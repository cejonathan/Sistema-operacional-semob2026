#!/usr/bin/env python3
"""Exporta nomes de logradouros de Jacarei para CSV de revisao.

Uso recomendado sem token:
  python3 scripts/export_geojacarei_logradouros.py

Fonte oficial usada por padrao:
  Prefeitura de Jacarei - Dados geograficos municipais - Logradouros 2025

Opcionalmente, para usar a API autenticada do GeoJacarei:
  GEOJACAREI_AUTHORIZATION='Bearer ...' \
    python3 scripts/export_geojacarei_logradouros.py --source geoapi

Se a sessao da API vier por cookie:
  GEOJACAREI_COOKIE='nome=valor; outro=valor' \
    python3 scripts/export_geojacarei_logradouros.py --source geoapi
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import shutil
import sqlite3
import struct
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Iterable
from pathlib import Path
from typing import Any


DEFAULT_ENDPOINT = "https://geo.jacarei.sp.gov.br/api/v2/logradouros"
DEFAULT_OUTPUT = "lista_setores_ruas_jacarei.csv"
OFFICIAL_MEGA_LINK = (
    "https://mega.nz/file/c3lwFBKS#sRwSvS0nFZ7V_MMY_sW3KpX5HtPFNCLn_mkrYQ5miB8"
)
NAME_FIELDS = (
    "nome",
    "nome_logradouro",
    "logradouro",
    "logradouro_nome",
    "logradouroNome",
    "nm_logradouro",
    "descricao",
    "name",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extrai logradouros do GeoJacarei e gera CSV com coluna nome."
    )
    parser.add_argument(
        "--source",
        choices=("official", "geoapi"),
        default="official",
        help="official usa a base publica Logradouros 2025; geoapi usa a API autenticada.",
    )
    parser.add_argument(
        "--mega-link",
        default=OFFICIAL_MEGA_LINK,
        help="Link publico Mega da base oficial de Logradouros 2025.",
    )
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--page-size", type=int, default=500)
    parser.add_argument("--max-pages", type=int, default=500)
    parser.add_argument("--sleep", type=float, default=0.15)
    parser.add_argument(
        "--auth",
        default=os.environ.get("GEOJACAREI_AUTHORIZATION", ""),
        help="Valor completo do header Authorization, ex: 'Bearer ...'.",
    )
    parser.add_argument(
        "--cookie",
        default=os.environ.get("GEOJACAREI_COOKIE", ""),
        help="Cookie de sessao do GeoJacarei, se o acesso depender de cookie.",
    )
    parser.add_argument(
        "--allow-unauth",
        action="store_true",
        help="Tenta consultar sem Authorization/Cookie. Util para diagnostico.",
    )
    return parser.parse_args()


def parse_mega_link(link: str) -> tuple[str, str]:
    if "/file/" not in link or "#" not in link:
        raise RuntimeError("Link Mega invalido. Esperado formato https://mega.nz/file/HANDLE#KEY.")
    handle = link.split("/file/", 1)[1].split("#", 1)[0].split("/", 1)[0]
    key = link.split("#", 1)[1].split("?", 1)[0]
    return handle, key


def b64url_decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + padding)


def mega_key_and_iv(key: str) -> tuple[str, str]:
    raw = b64url_decode(key)
    if len(raw) != 32:
        raise RuntimeError("Chave Mega inesperada; esperado link publico de arquivo.")
    words = struct.unpack(">8I", raw)
    aes_key = [words[i] ^ words[i + 4] for i in range(4)]
    iv = [words[4], words[5], 0, 0]
    key_hex = b"".join(struct.pack(">I", word) for word in aes_key).hex()
    iv_hex = b"".join(struct.pack(">I", word) for word in iv).hex()
    return key_hex, iv_hex


def request_mega_download_url(handle: str) -> str:
    payload = json.dumps([{"a": "g", "g": 1, "p": handle}]).encode("utf-8")
    request = urllib.request.Request(
        "https://g.api.mega.co.nz/cs?id=1",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        result = json.loads(response.read().decode("utf-8"))
    if not isinstance(result, list) or not result or "g" not in result[0]:
        raise RuntimeError(f"Mega nao retornou URL de download: {result}")
    return str(result[0]["g"])


def download_file(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=120) as response:
        with destination.open("wb") as handle:
            shutil.copyfileobj(response, handle)


def decrypt_mega_file(encrypted_path: Path, output_path: Path, key_hex: str, iv_hex: str) -> None:
    openssl = shutil.which("openssl")
    if not openssl:
        raise RuntimeError("openssl nao encontrado; necessario para descriptografar arquivo Mega.")
    subprocess.run(
        [
            openssl,
            "enc",
            "-d",
            "-aes-128-ctr",
            "-K",
            key_hex,
            "-iv",
            iv_hex,
            "-in",
            str(encrypted_path),
            "-out",
            str(output_path),
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def quote_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def extract_names_from_geopackage(path: Path) -> list[str]:
    connection = sqlite3.connect(path)
    try:
        tables = [
            row[0]
            for row in connection.execute(
                "select table_name from gpkg_contents where data_type = 'features'"
            )
        ]
        if not tables:
            tables = [
                row[0]
                for row in connection.execute(
                    "select name from sqlite_master where type = 'table' and name not like 'gpkg_%'"
                )
            ]
        if not tables:
            raise RuntimeError("GeoPackage nao possui tabela de feicoes.")

        names: list[str] = []
        for table in tables:
            columns = [row[1] for row in connection.execute(f"pragma table_info({quote_identifier(table)})")]
            lower_columns = {column.casefold(): column for column in columns}
            name_column = lower_columns.get("nome")
            type_column = lower_columns.get("tipo")
            if not name_column:
                continue

            select_columns = [quote_identifier(name_column)]
            if type_column:
                select_columns.append(quote_identifier(type_column))
            query = f"select {', '.join(select_columns)} from {quote_identifier(table)}"
            for row in connection.execute(query):
                name = clean_name(str(row[0] or ""))
                street_type = clean_name(str(row[1] or "")) if type_column else ""
                if name and street_type and not name.casefold().startswith(street_type.casefold() + " "):
                    names.append(f"{street_type} {name}")
                elif name:
                    names.append(name)
        return dedupe_sort(names)
    finally:
        connection.close()


def export_official_source(mega_link: str, output: str) -> list[str]:
    handle, key = parse_mega_link(mega_link)
    key_hex, iv_hex = mega_key_and_iv(key)
    print("Baixando base oficial Logradouros 2025...")
    with tempfile.TemporaryDirectory() as temp_dir:
        encrypted_path = Path(temp_dir) / "logradouros.enc"
        geopackage_path = Path(temp_dir) / "logradouros.gpkg"
        download_url = request_mega_download_url(handle)
        download_file(download_url, encrypted_path)
        decrypt_mega_file(encrypted_path, geopackage_path, key_hex, iv_hex)
        names = extract_names_from_geopackage(geopackage_path)

    if not names:
        raise RuntimeError("Nenhum nome foi extraido da base oficial.")
    write_csv(output, names)
    return names


def build_url(endpoint: str, page: int, page_size: int) -> str:
    parsed = urllib.parse.urlparse(endpoint)
    query = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
    query.update({"page": str(page), "pageSize": str(page_size)})
    return urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))


def request_json(url: str, auth: str, cookie: str) -> Any:
    headers = {
        "Accept": "application/json",
        "User-Agent": "Sistema-Operacional-Jacarei/1.0",
    }
    if auth:
        headers["Authorization"] = auth
    if cookie:
        headers["Cookie"] = cookie

    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} ao consultar {url}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Falha de rede ao consultar {url}: {exc.reason}") from exc

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        sample = raw[:500].replace("\n", " ")
        raise RuntimeError(f"Resposta nao e JSON valido: {sample}") from exc


def is_auth_error(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    message = str(payload.get("message", "")).lower()
    return payload.get("auth") is False or "token" in message or "autoriz" in message


def iter_dicts(payload: Any) -> Iterable[dict[str, Any]]:
    if isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict):
                yield item
            else:
                yield from iter_dicts(item)
        return

    if not isinstance(payload, dict):
        return

    preferred_keys = (
        "data",
        "content",
        "items",
        "results",
        "rows",
        "records",
        "list",
    )
    for key in preferred_keys:
        value = payload.get(key)
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    yield item
            return

    for value in payload.values():
        if isinstance(value, (dict, list)):
            yield from iter_dicts(value)


def name_from_record(record: dict[str, Any]) -> str:
    for field in NAME_FIELDS:
        value = record.get(field)
        if isinstance(value, str) and value.strip():
            return clean_name(value)
        if isinstance(value, dict):
            nested = name_from_record(value)
            if nested:
                return nested
    return ""


def clean_name(name: str) -> str:
    return " ".join(name.replace("\u00a0", " ").split()).strip()


def dedupe_sort(names: Iterable[str]) -> list[str]:
    seen: dict[str, str] = {}
    for name in names:
        cleaned = clean_name(name)
        if not cleaned:
            continue
        key = cleaned.casefold()
        seen.setdefault(key, cleaned)
    return sorted(seen.values(), key=lambda value: value.casefold())


def write_csv(output: str, names: list[str]) -> None:
    path = Path(output)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["nome"])
        for name in names:
            writer.writerow([name])


def export_geoapi_source(args: argparse.Namespace) -> list[str]:
    if not args.allow_unauth and not args.auth and not args.cookie:
        print(
            "Informe GEOJACAREI_AUTHORIZATION ou GEOJACAREI_COOKIE para acessar "
            "o endpoint autenticado do GeoJacarei.",
            file=sys.stderr,
        )
        raise SystemExit(2)

    all_names: list[str] = []
    for page in range(1, args.max_pages + 1):
        url = build_url(args.endpoint, page, args.page_size)
        payload = request_json(url, args.auth, args.cookie)
        if is_auth_error(payload):
            raise RuntimeError(
                "GeoJacarei recusou a consulta por autenticacao. "
                "Revise GEOJACAREI_AUTHORIZATION/GEOJACAREI_COOKIE."
            )

        records = list(iter_dicts(payload))
        page_names = [name_from_record(record) for record in records]
        page_names = [name for name in page_names if name]

        print(f"pagina={page} registros={len(records)} nomes={len(page_names)}")
        if not records and not page_names:
            break

        all_names.extend(page_names)
        if len(records) < args.page_size:
            break
        time.sleep(args.sleep)

    names = dedupe_sort(all_names)
    if not names:
        raise RuntimeError("Nenhum nome de logradouro foi encontrado na resposta.")

    write_csv(args.output, names)
    return names


def main() -> int:
    args = parse_args()
    if args.source == "official":
        names = export_official_source(args.mega_link, args.output)
    else:
        names = export_geoapi_source(args)

    print(f"CSV gerado: {args.output}")
    print(f"Total de nomes unicos: {len(names)}")
    print("Amostra:")
    for name in names[:10]:
        print(f"- {name}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        raise SystemExit(1)
