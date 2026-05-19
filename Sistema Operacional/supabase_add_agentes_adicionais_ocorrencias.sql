alter table public.ocorrencias
add column if not exists agentes_adicionais text[] not null default '{}';
