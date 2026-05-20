// ==========================================
// HISTÓRICO DE OCORRÊNCIAS (paginado)
// ==========================================
let ocPagina          = 0;
let ocTodosCarregados = false;
let ocCarregando      = false;
let ocorrenciaEditandoId = null;
let fotoListaTargetId = null;

async function carregarHistoricoOcorrencia(resetar = true) {
    if (ocCarregando) return;
    if (resetar) {
        atualizarContadoresOcorrencias();
        containerMensagensOc.innerHTML = '';
        ocPagina = 0;
        ocTodosCarregados = false;
        const indicadorAntigo = document.getElementById('oc-carregar-mais');
        if (indicadorAntigo) indicadorAntigo.remove();
    }
    if (ocTodosCarregados) return;

    ocCarregando = true;

    let indicador = document.getElementById('oc-carregar-mais');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'oc-carregar-mais';
        indicador.className = 'message system-msg';
        indicador.textContent = 'Carregando...';
        containerMensagensOc.prepend(indicador);
    }

    const from = ocPagina * OC_PAGE_SIZE;
    const to   = from + OC_PAGE_SIZE - 1;

    let query = db.from('ocorrencias')
        .select('*')
        .order('seq_numero', { ascending: false })
        .range(from, to);

    query = aplicarFiltroOcorrencias(query);

    const { data, error } = await query;
    ocCarregando = false;

    if (error) {
        console.error("Erro ao carregar histórico ocorrência:", error);
        indicador.remove();
        return;
    }

    if (!data || data.length === 0) {
        ocTodosCarregados = true;
        indicador.textContent = 'Início do histórico';
        return;
    }

    const scrollAntes = containerMensagensOc.scrollHeight - containerMensagensOc.scrollTop;
    indicador.remove();

    const fragment = document.createDocumentFragment();
    [...data].reverse().forEach(r => {
        const tmp = document.createElement('div');
        tmp.innerHTML = gerarHTMLMensagemOcorrencia(r);
        if (tmp.firstElementChild) fragment.appendChild(tmp.firstElementChild);
    });
    containerMensagensOc.prepend(fragment);

    if (resetar) {
        containerMensagensOc.scrollTop = containerMensagensOc.scrollHeight;
    } else {
        containerMensagensOc.scrollTop = containerMensagensOc.scrollHeight - scrollAntes;
    }

    if (data.length < OC_PAGE_SIZE) {
        ocTodosCarregados = true;
        const fim = document.createElement('div');
        fim.id = 'oc-carregar-mais';
        fim.className = 'message system-msg';
        fim.textContent = 'Início do histórico';
        containerMensagensOc.prepend(fim);
    } else {
        const novoInd = document.createElement('div');
        novoInd.id = 'oc-carregar-mais';
        novoInd.className = 'message system-msg';
        novoInd.style.cursor = 'pointer';
        novoInd.textContent = '⬆ Carregar mais';
        novoInd.onclick = () => { carregarHistoricoOcorrencia(false); };
        containerMensagensOc.prepend(novoInd);
    }

    ocPagina++;
}

function renderizarMensagemOcorrencia(dados, idBanco) {
    containerMensagensOc.insertAdjacentHTML('beforeend', gerarHTMLMensagemOcorrencia(dados));
    containerMensagensOc.scrollTop = containerMensagensOc.scrollHeight;
}

containerMensagensOc.addEventListener('scroll', () => {
    if (containerMensagensOc.scrollTop < 80 && !ocTodosCarregados && !ocCarregando) {
        carregarHistoricoOcorrencia(false);
    }
});

// ==========================================
// REGISTRAR NOVA OCORRÊNCIA
// ==========================================
btnAbrirOcorrencia.addEventListener('click', async () => {
    if (idSendoProcessado) return;
    idSendoProcessado = true;
    const textoOriginal = btnAbrirOcorrencia.textContent;
    btnAbrirOcorrencia.disabled = true;
    btnAbrirOcorrencia.textContent = 'Salvando...';
    try {
        const codigo   = getValorCampo('oc-select-codigo',   'oc-input-codigo-outro');
        const setor    = getValorCampo('oc-select-setor',    'oc-input-setor-outro');
        const referencia = typeof obterReferenciaOcorrencia === 'function'
            ? obterReferenciaOcorrencia()
            : { tipo: '', detalhe: '' };
        const localFinal = typeof montarLocalComReferencia === 'function'
            ? montarLocalComReferencia(setor)
            : setor;
        const viatura  = getValorCampo('oc-select-vtr',      'oc-input-vtr-outro');
        const condutor = getValorCampo('oc-select-condutor', 'oc-input-condutor-outro');
        const apoio    = getValorCampo('oc-select-apoio',    'oc-input-apoio-outro');
        const data     = ocData.value;
        const hora     = ocHora.value;

        if (!codigo)   return mostrarNotificacao('erro-ocorrencia', '⚠️ Selecione ou digite o Código.');
        if (!setor)    return mostrarNotificacao('erro-ocorrencia', '⚠️ Selecione ou digite o Local.');
        if (referencia.tipo && !referencia.detalhe) {
            return mostrarNotificacao('erro-ocorrencia', `⚠️ Informe o detalhe da referência ${referencia.tipo}.`);
        }
        if (!viatura)  return mostrarNotificacao('erro-ocorrencia', '⚠️ Selecione ou digite a Viatura.');
        if (!condutor) return mostrarNotificacao('erro-ocorrencia', '⚠️ Selecione ou digite o Condutor.');
        if (!hora)     return mostrarNotificacao('erro-ocorrencia', '⚠️ Informe a Hora.');

        if (agenteLogado && agenteLogado.det_codigo) {
            const agente = agenteLogado.det_codigo;
            if (!verificaVinculoAgente(agente, condutor, apoio)) {
                return mostrarNotificacao('erro-ocorrencia', `⚠️ Você (${agente}) precisa estar como Condutor ou Apoio.`);
            }
        }

        const { data: numeroOcorrencia, error: errSeq } = await db.rpc('obter_proximo_numero_ocorrencia');

        if (errSeq || !numeroOcorrencia) {
            console.error('Erro ao gerar sequência:', errSeq);
            return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao gerar o número da ocorrência.');
        }

        const dadosDB = {
            numero_ocorrencia:    numeroOcorrencia,
            seq_numero:           parseInt(numeroOcorrencia.split('/')[0]),
            codigo_descricao:     codigo,
            local:                localFinal,
            id_viatura_vinculada: viatura,
            condutor:             condutor,
            apoio:                apoio || null,
            criado_por:           agenteLogado?.user_id || null,
            data:                 data,
            hora_inicial:         hora,
            status:               'aberto'
        };

        const { data: resultado, error } = await db.from('ocorrencias').insert([dadosDB]).select();

        if (error) {
            mostrarNotificacao('erro-ocorrencia', '❌ Erro ao registrar: ' + error.message);
            return;
        }

        renderizarMensagemOcorrencia(resultado[0], resultado[0].id);
        atualizarContadoresOcorrencias();
        ocSelectCodigo.value = ''; ocSelectSetor.value = '';
        if (typeof limparReferenciaOcorrencia === 'function') limparReferenciaOcorrencia();
        ocSelectVtr.value    = ''; ocSelectCondutor.value = '';
        ocSelectApoio.value  = '';
        toggleFormOcorrencia();
    } finally {
        idSendoProcessado = false;
        btnAbrirOcorrencia.disabled = false;
        btnAbrirOcorrencia.textContent = textoOriginal;
    }
});

// ==========================================
// GERAR HTML MENSAGEM OCORRÊNCIA
// ==========================================
function gerarHTMLMensagemOcorrencia(dados) {
    const idBanco   = dados.id;
    const idMsg     = `msg-oc-${idBanco}`;
    const numeroOc  = escapeHTML(dados.numero_ocorrencia || '');
    const codigo    = escapeHTML(dados.codigo_descricao || '—');
    const viatura   = escapeHTML(dados.id_viatura_vinculada || '—');
    const condutor  = escapeHTML(dados.condutor || '—');
    const apoio     = escapeHTML(dados.apoio || '—');
    const setor     = escapeHTML(dados.local || '—');
    const hora      = dados.hora_inicial || '—';
    const dataRaw   = dados.data;
    const dataFmt   = dataRaw ? new Date(dataRaw + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const agentesAdicionais = Array.isArray(dados.agentes_adicionais)
        ? dados.agentes_adicionais.filter(Boolean)
        : [];
    const agentesAdicionaisHTML = agentesAdicionais.length
        ? `<div style="margin-bottom:6px;">
                <div style="color:var(--text-secondary);font-size:11px;">AGENTES ADICIONAIS</div>
                <div style="font-size:13px;">${escapeHTML(agentesAdicionais.join(', '))}</div>
           </div>`
        : '';

    const observacao = dados.observacao
        ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:13px;">📝 ${escapeHTML(dados.observacao)}</div>`
        : '';
    const fotoLegada = dados.foto_url
        ? `<div style="margin-top:8px;"><img src="${escapeHTML(dados.foto_url)}" style="max-width:100%;border-radius:8px;" loading="lazy"></div>`
        : '';
    const fotosArray = (dados.fotos_urls || [])
        .map(url => `<div style="margin-top:6px;"><img src="${escapeHTML(url)}" style="max-width:100%;border-radius:8px;" loading="lazy"></div>`)
        .join('');
    const foto = fotoLegada + fotosArray;

    let createdAtOcTs = null;
    if (dados.data) {
        let h = dados.hora_inicial || '00:00:00';
        if (h.split(':').length === 2) h += ':00';
        const ts = Date.parse(String(dados.data) + 'T' + h);
        if (!isNaN(ts)) createdAtOcTs = ts;
    }
    if (createdAtOcTs === null && dados.created_at) {
        createdAtOcTs = new Date(dados.created_at).getTime();
        if (isNaN(createdAtOcTs)) createdAtOcTs = null;
    }
    const isUnder24hOc = createdAtOcTs !== null && (Date.now() - createdAtOcTs) <= 86400000;

    const podeAlterar = podeAlterarOcorrencia(dados);
    let botoesOcorrencia = '';
    if (podeAlterar && !['fechado','finalizado','encerrado'].includes((dados.status||'').trim().toLowerCase())) {
        botoesOcorrencia = `<div class="message-actions">
            <button class="btn-action" onclick="event.stopPropagation(); adicionarObservacaoLista('${idBanco}')">📝 OBS</button>
            <button class="btn-action" onclick="event.stopPropagation(); adicionarFotoLista('${idBanco}')">📷 FOTO</button>
            <button class="btn-action" onclick="event.stopPropagation(); abrirModalAgentesOcorrencia('${idBanco}')">👥 AGENTES</button>
            <button class="btn-action" onclick="event.stopPropagation(); abrirModalEditarOcorrencia('${idBanco}')">✏️ EDITAR</button>
            <button class="btn-action btn-close" onclick="event.stopPropagation(); encerrarOcorrencia('${idBanco}')">🏁 ENCERRAR</button>
        </div>`;
    } else if (podeAlterar && isUnder24hOc) {
        botoesOcorrencia = `<div class="message-actions">
            <button class="btn-action" onclick="event.stopPropagation(); adicionarObservacaoLista('${idBanco}')">📝 OBS</button>
            <button class="btn-action" onclick="event.stopPropagation(); adicionarFotoLista('${idBanco}')">📷 FOTO</button>
            <button class="btn-action" onclick="event.stopPropagation(); abrirModalEditarOcorrencia('${idBanco}')">✏️ Editar</button>
        </div>`;
    }

    const aberta        = !['fechado','finalizado','encerrado'].includes((dados.status||'').trim().toLowerCase());
    const ocStatusLabel = aberta ? 'OCORRÊNCIA ABERTA' : 'OCORRÊNCIA FECHADA';
    const ocStatusColor = aberta ? 'var(--green-accent)' : '#ff5252';
    const fmt           = h => h ? h.substring(0, 5) : '—';
    const horaFinal     = dados.hora_final ? fmt(dados.hora_final) : '—';

    return `
        <div class="message sent" id="${idMsg}">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">
                ${numeroOc ? `Ocorrência #${numeroOc}` : 'Ocorrência'}
            </div>
            <div style="margin-bottom:6px;">
                <div style="color:var(--text-secondary);font-size:11px;">VIATURA</div>
                <div style="font-size:13px;">${viatura}</div>
            </div>
            <div style="margin-bottom:6px;">
                <div style="color:var(--text-secondary);font-size:11px;">CÓDIGO</div>
                <div style="font-size:13px;">${codigo}</div>
            </div>
            <div style="margin-bottom:6px;">
                <div style="color:var(--text-secondary);font-size:11px;">LOCAL</div>
                <div style="font-size:13px;">${setor}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px;">
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">CONDUTOR</div>
                    <div style="font-size:13px;">${condutor}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">APOIO</div>
                    <div style="font-size:13px;">${apoio}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">HORA INICIAL</div>
                    <div style="font-size:13px;">${fmt(hora)}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">HORA FINAL</div>
                    <div style="font-size:13px;">${horaFinal}</div>
                </div>
            </div>
            <div style="margin-bottom:6px;">
                <div style="color:var(--text-secondary);font-size:11px;">DATA</div>
                <div style="font-size:13px;">${dataFmt}</div>
            </div>
            ${agentesAdicionaisHTML}
            ${observacao}${foto}
            ${botoesOcorrencia}
            <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:6px;display:flex;align-items:center;justify-content:flex-end;gap:5px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${ocStatusColor};display:inline-block;flex-shrink:0;"></span>
                <span style="font-size:11px;font-weight:700;letter-spacing:0.6px;color:${ocStatusColor};">${ocStatusLabel}</span>
            </div>
        </div>`;
}

// ==========================================
// TELA DE DETALHE DA OCORRÊNCIA
// ==========================================
function abrirDetalheOcorrencia(oc) {
    ocorrenciaAtual = oc;

    const statusNormalizado = (oc.status || '').toString().trim().toLowerCase();

    document.getElementById('d-numero').textContent    = oc.numero_ocorrencia || '—';
    document.getElementById('d-codigo').textContent    = oc.codigo_descricao || '—';
    document.getElementById('d-local').textContent     = oc.local || '—';
    document.getElementById('d-viatura').textContent   = oc.id_viatura_vinculada || '—';
    document.getElementById('d-condutor').textContent  = oc.condutor || '—';
    document.getElementById('d-apoio').textContent     = oc.apoio || '—';
    document.getElementById('d-hora-inicial').textContent = oc.hora_inicial || '—';

    const dataFmt = oc.data ? new Date(oc.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    document.getElementById('d-data').textContent = dataFmt;

    const rowHoraFinal = document.getElementById('d-row-hora-final');
    if (oc.hora_final) {
        document.getElementById('d-hora-final').textContent = oc.hora_final;
        rowHoraFinal.style.display = 'flex';
    } else {
        rowHoraFinal.style.display = 'none';
    }

    const titulo = oc.numero_ocorrencia
        ? `#${oc.numero_ocorrencia} — ${oc.codigo_descricao || 'Ocorrência'}`
        : (oc.codigo_descricao || 'Ocorrência');
    document.getElementById('detalhe-titulo').textContent = titulo;
    const badge = document.getElementById('detalhe-status-badge');
    if (statusNormalizado === 'aberto') {
        badge.textContent = '● ABERTA';
        badge.className = 'status-badge status-aberta';
    } else {
        badge.textContent = '● FINALIZADA';
        badge.className = 'status-badge status-fechada';
    }

    const painel = document.getElementById('painel-acoes-detalhe');
    const podeAlterar = podeAlterarOcorrencia(oc);
    painel.style.display = podeAlterar ? '' : 'none';

    const btnFinalizar = document.getElementById('btn-finalizar-oc-header');
    if (btnFinalizar) btnFinalizar.style.display = podeAlterar && statusNormalizado === 'aberto' ? '' : 'none';

    document.getElementById('detalhe-observacao').value = '';
    document.getElementById('detalhe-hora-final').value = '';
    fotosSelecionadas = [];
    atualizarPreviewFotos();

    carregarObservacoes(oc.id);

    ocultarTodasTelas();
    telaDetalhe.classList.remove('hidden');
}

// ==========================================
// OBTER TIMESTAMP PARA VALIDAÇÃO 24h
// ==========================================
function obterTsOcorrencia(dados) {
    let ts = null;
    if (dados.data) {
        let h = dados.hora_inicial || '00:00:00';
        if (h.split(':').length === 2) h += ':00';
        const parsed = Date.parse(String(dados.data) + 'T' + h);
        if (!isNaN(parsed)) ts = parsed;
    }
    if (ts === null && dados.created_at) {
        const parsed = new Date(dados.created_at).getTime();
        if (!isNaN(parsed)) ts = parsed;
    }
    return ts;
}

function isUnder24hOc(dados) {
    const ts = obterTsOcorrencia(dados);
    return ts !== null && (Date.now() - ts) <= 86400000;
}

function separarLocalReferenciaOcorrencia(localCompleto) {
    const texto = String(localCompleto || '').trim();
    const match = texto.match(/^(.*) - (Defronte|Oposto|Cruzamento)(?:\s+(.+))?$/);
    if (!match) return { local: texto, referencia: '', detalhe: '' };

    return {
        local: match[1].trim(),
        referencia: match[2],
        detalhe: (match[3] || '').trim()
    };
}

function atualizarCamposReferenciaEditOcorrencia() {
    const tipo = document.getElementById('oc-edit-referencia')?.value || '';
    const inputManual = document.getElementById('oc-edit-referencia-manual');
    const selectCruzamento = document.getElementById('oc-edit-referencia-cruzamento');
    const mostrarManual = tipo === 'Defronte' || tipo === 'Oposto';
    const mostrarCruzamento = tipo === 'Cruzamento';

    if (inputManual) {
        inputManual.classList.toggle('hidden', !mostrarManual);
        if (!mostrarManual) inputManual.value = '';
    }

    if (selectCruzamento) {
        selectCruzamento.classList.toggle('hidden', !mostrarCruzamento);
        if (!mostrarCruzamento) selectCruzamento.value = '';
    }
}

function obterReferenciaEditOcorrencia() {
    const tipo = document.getElementById('oc-edit-referencia')?.value || '';
    if (!tipo) return { tipo: '', detalhe: '' };

    if (tipo === 'Defronte' || tipo === 'Oposto') {
        return {
            tipo,
            detalhe: (document.getElementById('oc-edit-referencia-manual')?.value || '').trim()
        };
    }

    if (tipo === 'Cruzamento') {
        return {
            tipo,
            detalhe: (document.getElementById('oc-edit-referencia-cruzamento')?.value || '').trim()
        };
    }

    return { tipo: '', detalhe: '' };
}

function montarLocalEditComReferencia(local) {
    const referencia = obterReferenciaEditOcorrencia();
    if (!referencia.tipo) return local;
    return `${local} - ${referencia.tipo} ${referencia.detalhe}`.trim();
}

// ==========================================
// EDITAR OCORRÊNCIA (modal)
// ==========================================
window.abrirModalEditarOcorrencia = async function (id) {
    ocorrenciaEditandoId = id;
    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');

    if (!podeAlterarOcorrencia(oc)) {
        ocorrenciaEditandoId = null;
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Você só pode editar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(oc)) return mostrarNotificacao('erro-ocorrencia', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');

    document.getElementById('oc-edit-codigo').value   = oc.codigo_descricao || '';
    document.getElementById('oc-edit-viatura').value  = oc.id_viatura_vinculada || '';
    document.getElementById('oc-edit-condutor').value = oc.condutor || '';
    document.getElementById('oc-edit-apoio').value    = oc.apoio || '';
    document.getElementById('oc-edit-hora').value     = oc.hora_inicial || '';

    const rowFinal = document.getElementById('oc-row-edit-final');
    if (oc.status === 'fechado') {
        rowFinal.classList.remove('hidden');
        document.getElementById('oc-edit-hora-final').value = oc.hora_final || '';
    } else {
        rowFinal.classList.add('hidden');
    }

    const localSeparado = separarLocalReferenciaOcorrencia(oc.local);
    const svLocal = document.getElementById('oc-edit-setor');
    const inpLocal = document.getElementById('oc-edit-local-outro');
    if (svLocal && localSeparado.local) {
        const existe = [...svLocal.options].some(o => o.value === localSeparado.local);
        if (existe) {
            svLocal.value = localSeparado.local;
            if (inpLocal) { inpLocal.classList.add('hidden'); inpLocal.value = ''; }
        } else {
            const optOutro = [...svLocal.options].find(o => o.value === 'Outros' || o.value.toLowerCase().startsWith('outro'));
            if (optOutro) {
                svLocal.value = optOutro.value;
                if (inpLocal) { inpLocal.classList.remove('hidden'); inpLocal.value = localSeparado.local; }
            } else {
                svLocal.insertAdjacentHTML('beforeend', '<option value="Outros">Outros</option>');
                svLocal.value = 'Outros';
                if (inpLocal) { inpLocal.classList.remove('hidden'); inpLocal.value = localSeparado.local; }
            }
        }
    }

    const editRef = document.getElementById('oc-edit-referencia');
    const editRefManual = document.getElementById('oc-edit-referencia-manual');
    const editRefCruzamento = document.getElementById('oc-edit-referencia-cruzamento');
    if (editRef) editRef.value = localSeparado.referencia || '';
    if (editRefManual) editRefManual.value = (localSeparado.referencia === 'Defronte' || localSeparado.referencia === 'Oposto') ? localSeparado.detalhe : '';
    if (editRefCruzamento) {
        if (localSeparado.referencia === 'Cruzamento' && localSeparado.detalhe) {
            const existeRef = [...editRefCruzamento.options].some(o => o.value === localSeparado.detalhe);
            if (!existeRef) {
                editRefCruzamento.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(localSeparado.detalhe)}">${escapeHTML(localSeparado.detalhe)}</option>`);
            }
            editRefCruzamento.value = localSeparado.detalhe;
        } else {
            editRefCruzamento.value = '';
        }
    }
    atualizarCamposReferenciaEditOcorrencia();

    const svVtr = document.getElementById('oc-edit-viatura');
    if (svVtr && oc.id_viatura_vinculada) {
        const existe = [...svVtr.options].some(o => o.value === oc.id_viatura_vinculada);
        if (!existe) {
            const optOutroVtr = [...svVtr.options].find(o => o.value === 'outro' || o.value.toLowerCase().startsWith('outro'));
            if (optOutroVtr) {
                svVtr.value = optOutroVtr.value;
            } else {
                svVtr.insertAdjacentHTML('beforeend', '<option value="outro">Outro</option>');
                svVtr.value = 'outro';
            }
            const inpVtr = document.getElementById('oc-edit-viatura-outro');
            if (inpVtr) { inpVtr.classList.remove('hidden'); inpVtr.value = oc.id_viatura_vinculada; }
        }
    }

    document.getElementById('erro-modal-editar-oc').classList.add('hidden');
    document.getElementById('modal-editar-oc').classList.remove('hidden');
};

document.getElementById('oc-edit-viatura')?.addEventListener('change', function () {
    const inp = document.getElementById('oc-edit-viatura-outro');
    if (inp) inp.classList.toggle('hidden', this.value !== 'outro');
});

document.getElementById('oc-edit-setor')?.addEventListener('change', function () {
    const inp = document.getElementById('oc-edit-local-outro');
    if (inp) {
        const mostrar = this.value === 'Outros' || this.value.toLowerCase().startsWith('outro');
        inp.classList.toggle('hidden', !mostrar);
        if (!mostrar) inp.value = '';
    }
});

document.getElementById('oc-edit-referencia')?.addEventListener('change', atualizarCamposReferenciaEditOcorrencia);

window.confirmarEdicaoOcorrencia = async function () {
    if (!ocorrenciaEditandoId) return;

    const { data: ocOriginal, error: errOriginal } = await db.from('ocorrencias')
        .select('id, criado_por, condutor, apoio')
        .eq('id', ocorrenciaEditandoId)
        .single();

    if (errOriginal || !ocOriginal) {
        return mostrarNotificacao('erro-modal-editar-oc', '❌ Erro ao validar ocorrência.');
    }

    if (!podeAlterarOcorrencia(ocOriginal)) {
        return mostrarNotificacao('erro-modal-editar-oc', '⚠️ Você só pode editar ocorrências criadas por você.');
    }

    const codigo   = document.getElementById('oc-edit-codigo').value;
    const localSel = document.getElementById('oc-edit-setor').value;
    const local    = (localSel === 'Outros' || localSel.toLowerCase().startsWith('outro'))
        ? document.getElementById('oc-edit-local-outro').value.trim()
        : localSel;
    const referencia = obterReferenciaEditOcorrencia();
    const localFinal = montarLocalEditComReferencia(local);
    const vtrSel   = document.getElementById('oc-edit-viatura').value;
    const viatura  = (vtrSel === 'outro' || vtrSel.toLowerCase().startsWith('outro'))
        ? document.getElementById('oc-edit-viatura-outro').value.trim()
        : vtrSel;
    const condutor = document.getElementById('oc-edit-condutor').value;
    const apoio    = document.getElementById('oc-edit-apoio').value;
    const hora     = document.getElementById('oc-edit-hora').value;
    const errEl    = document.getElementById('erro-modal-editar-oc');

    const mostrar = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!codigo)   return mostrar('⚠️ Selecione o Código.');
    if (!local)    return mostrar('⚠️ Selecione o Local.');
    if (referencia.tipo && !referencia.detalhe) return mostrar(`⚠️ Informe o detalhe da referência ${referencia.tipo}.`);
    if (!viatura)  return mostrar('⚠️ Informe a Viatura.');
    if (!condutor) return mostrar('⚠️ Selecione o Condutor.');
    if (!hora)     return mostrar('⚠️ Informe a Hora Inicial.');

    const updates = {
        codigo_descricao:     codigo,
        local:                localFinal,
        id_viatura_vinculada: viatura,
        condutor:             condutor,
        apoio:                apoio || null,
        hora_inicial:         hora,
    };

    const rowFinal = document.getElementById('oc-row-edit-final');
    if (!rowFinal.classList.contains('hidden')) {
        updates.hora_final = document.getElementById('oc-edit-hora-final').value;
        if (!updates.hora_final) return mostrar('⚠️ Informe a Hora Final.');
    }

    const { error } = await db.from('ocorrencias').update(updates).eq('id', ocorrenciaEditandoId);

    if (error) return mostrar('❌ Erro ao salvar: ' + error.message);

    fecharModal('modal-editar-oc');

    const { data: ocAtual } = await db.from('ocorrencias').select('*').eq('id', ocorrenciaEditandoId).single();
    if (ocAtual) {
        const balaoAntigo = document.getElementById(`msg-oc-${ocorrenciaEditandoId}`);
        if (balaoAntigo) {
            balaoAntigo.outerHTML = gerarHTMLMensagemOcorrencia(ocAtual);
        }
        if (ocorrenciaAtual && ocorrenciaAtual.id === ocorrenciaEditandoId) {
            abrirDetalheOcorrencia(ocAtual);
            mostrarNotificacao('erro-detalhe', '✅ Ocorrência atualizada!', true);
        } else {
            mostrarNotificacao('erro-ocorrencia', '✅ Ocorrência atualizada!', true);
        }
    }
};

// ==========================================
// ENCERRAR OCORRÊNCIA
// ==========================================
window.abrirModalEncerrarOcorrencia = function () {
    if (!ocorrenciaAtual) return;
    encerrarOcorrencia(ocorrenciaAtual.id);
};

window.encerrarOcorrencia = async function (id) {
    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');

    if (!podeAlterarOcorrencia(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Você só pode encerrar ocorrências criadas por você.');
    }

    idSendoProcessado = id;
    const agora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('encerrar-oc-hora-final').value = agora;
    document.getElementById('erro-modal-encerrar-oc').classList.add('hidden');
    document.getElementById('modal-encerrar-oc').classList.remove('hidden');
};

window.confirmarEncerramentoOcorrencia = async function () {
    const horaFinal = document.getElementById('encerrar-oc-hora-final').value;
    if (!horaFinal) {
        const errEl = document.getElementById('erro-modal-encerrar-oc');
        errEl.textContent = '⚠️ Informe a Hora Final.';
        errEl.classList.remove('hidden');
        return;
    }

    const { data: oc, error: errOc } = await db.from('ocorrencias')
        .select('id, criado_por, condutor, apoio')
        .eq('id', idSendoProcessado)
        .single();

    if (errOc || !oc) {
        const errEl = document.getElementById('erro-modal-encerrar-oc');
        errEl.textContent = '❌ Erro ao validar ocorrência.';
        errEl.classList.remove('hidden');
        return;
    }

    if (!podeAlterarOcorrencia(oc)) {
        const errEl = document.getElementById('erro-modal-encerrar-oc');
        errEl.textContent = '⚠️ Você só pode encerrar ocorrências criadas por você.';
        errEl.classList.remove('hidden');
        return;
    }

    const { error } = await db.from('ocorrencias')
        .update({ status: 'fechado', hora_final: horaFinal, fechado_por: agenteLogado?.user_id || null })
        .eq('id', idSendoProcessado);

    if (error) {
        const errEl = document.getElementById('erro-modal-encerrar-oc');
        errEl.textContent = '❌ Erro ao encerrar: ' + error.message;
        errEl.classList.remove('hidden');
        return;
    }

    fecharModal('modal-encerrar-oc');

    const idParaAtualizar = idSendoProcessado;
    idSendoProcessado = null;

    const { data: ocAtual } = await db.from('ocorrencias').select('*').eq('id', idParaAtualizar).single();
    if (ocAtual) {
        const balaoAntigo = document.getElementById(`msg-oc-${idParaAtualizar}`);
        if (balaoAntigo) balaoAntigo.remove();
        renderizarMensagemOcorrencia(ocAtual, ocAtual.id);
    }

    atualizarContadoresOcorrencias();
    mostrarNotificacao('erro-ocorrencia', '✅ Ocorrência encerrada!', true);
};

// ==========================================
// REMOVER FOTOS
// ==========================================
window.removerFotoSalva = async function () {
    if (!ocorrenciaAtual) return;

    if (!podeAlterarOcorrencia(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    const { error } = await db.from('ocorrencias')
        .update({ foto_url: null })
        .eq('id', ocorrenciaAtual.id);
    if (error) return mostrarNotificacao('erro-detalhe', '❌ Erro ao remover foto.');
    ocorrenciaAtual.foto_url = null;
    carregarObservacoes(ocorrenciaAtual.id);
    mostrarNotificacao('erro-detalhe', '✅ Foto removida.', true);
};

window.removerFotoArray = async function (idx) {
    if (!ocorrenciaAtual) return;

    if (!podeAlterarOcorrencia(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    const fotos = [...(ocorrenciaAtual.fotos_urls || [])];
    fotos.splice(idx, 1);
    const { error } = await db.from('ocorrencias')
        .update({ fotos_urls: fotos })
        .eq('id', ocorrenciaAtual.id);
    if (error) return mostrarNotificacao('erro-detalhe', '❌ Erro ao remover foto.');
    ocorrenciaAtual.fotos_urls = fotos;
    carregarObservacoes(ocorrenciaAtual.id);
    mostrarNotificacao('erro-detalhe', '✅ Foto removida.', true);
};

// ==========================================
// ABRIR DETALHE POR ID
// ==========================================
window.abrirDetalheOcorrenciaPorId = async function (id) {
    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao abrir ocorrência.');
    abrirDetalheOcorrencia(oc);
};

window.abrirDetalheEEditar = async function (id) {
    abrirModalEditarOcorrencia(id);
};

// ==========================================
// CARREGAR OBSERVAÇÕES (feed do detalhe)
// ==========================================
async function carregarObservacoes(idOcorrencia) {
    const container = document.getElementById('container-msgs-detalhe');
    container.innerHTML = '<div class="message system-msg">Carregando...</div>';

    const { data: oc, error } = await db
        .from('ocorrencias')
        .select('*')
        .eq('id', idOcorrencia)
        .single();

    container.innerHTML = '';

    if (error) {
        container.innerHTML = '<div class="message system-msg">Adicione observações ou fotos para esta ocorrência.</div>';
        console.warn("Erro ao carregar ocorrência:", error.message);
        return;
    }

    if (ocorrenciaAtual && ocorrenciaAtual.id === oc.id) {
        ocorrenciaAtual.fotos_urls = oc.fotos_urls || [];
        ocorrenciaAtual.foto_url   = oc.foto_url;
    }

    const podeRemover = isUnder24hOc(oc) && podeAlterarOcorrencia(oc);
    let temConteudo = false;

    if (oc.observacao) {
        temConteudo = true;
        const btnsObs = podeRemover
            ? `<div class="message-actions" style="margin-top:8px;">
                    <button class="btn-action" onclick="editarObservacao()">✏️ EDITAR</button>
                    <button class="btn-action btn-close" onclick="excluirObservacao()">🗑️ EXCLUIR</button>
               </div>`
            : '';
        container.insertAdjacentHTML('beforeend', `
            <div class="message sent" id="msg-observacao-existente">
                <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.5);">📝 Observação</p>
                <p style="margin:0;" id="texto-observacao-existente">${escapeHTML(oc.observacao)}</p>
                ${btnsObs}
            </div>`);
    }

    if (oc.foto_url) {
        temConteudo = true;
        const btnRem = podeRemover
            ? `<button onclick="removerFotoSalva()" style="margin-top:6px;background:rgba(255,82,82,0.15);
                border:1px solid #ff5252;color:#ff8080;border-radius:6px;padding:4px 10px;
                font-size:11px;cursor:pointer;width:100%;">✕ Remover</button>`
            : '';
        container.insertAdjacentHTML('beforeend', `
            <div class="message sent">
                <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.5);">📷 Foto registrada</p>
                <img src="${escapeHTML(oc.foto_url)}" style="max-width:100%;border-radius:8px;" loading="lazy">
                ${btnRem}
            </div>`);
    }

    const fotos = oc.fotos_urls || [];
    fotos.forEach((url, idx) => {
        temConteudo = true;
        const btnRem = podeRemover
            ? `<button onclick="removerFotoArray(${idx})" style="margin-top:6px;background:rgba(255,82,82,0.15);
                border:1px solid #ff5252;color:#ff8080;border-radius:6px;padding:4px 10px;
                font-size:11px;cursor:pointer;width:100%;">✕ Remover</button>`
            : '';
        container.insertAdjacentHTML('beforeend', `
            <div class="message sent">
                <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.5);">📷 Foto ${fotos.length > 1 ? idx + 1 : 'registrada'}</p>
                <img src="${escapeHTML(url)}" style="max-width:100%;border-radius:8px;" loading="lazy">
                ${btnRem}
            </div>`);
    });

    if (!temConteudo) {
        container.insertAdjacentHTML('beforeend',
            '<div class="message system-msg">Nenhuma observação ou foto ainda.</div>');
    }

    container.scrollTop = container.scrollHeight;
}

window.editarObservacao = function () {
    if (!ocorrenciaAtual) return;

    if (!podeAlterarOcorrencia(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Você só pode editar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    const textoAtual = ocorrenciaAtual.observacao || '';
    const campoObs = document.getElementById('detalhe-observacao');
    campoObs.value = textoAtual;
    campoObs.focus();

    const msgExistente = document.getElementById('msg-observacao-existente');
    if (msgExistente) {
        msgExistente.style.opacity = '0.5';
        msgExistente.style.pointerEvents = 'none';
    }

    mostrarNotificacao('erro-detalhe', '✏️ Edite a observação e clique em Salvar.', false);
};

window.excluirObservacao = async function () {
    if (!ocorrenciaAtual) return;

    if (!podeAlterarOcorrencia(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    const { error } = await db.from('ocorrencias')
        .update({ observacao: null })
        .eq('id', ocorrenciaAtual.id);

    if (error) {
        return mostrarNotificacao('erro-detalhe', '❌ Erro ao excluir observação: ' + error.message);
    }

    ocorrenciaAtual.observacao = null;
    carregarObservacoes(ocorrenciaAtual.id);
    mostrarNotificacao('erro-detalhe', '✅ Observação excluída.', true);
};

// ==========================================
// SALVAR OBSERVAÇÃO + FOTO + HORA FINAL
// ==========================================
document.getElementById('btn-salvar-observacao').addEventListener('click', async () => {
    if (!ocorrenciaAtual) return;

    if (!podeAlterarOcorrencia(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(ocorrenciaAtual)) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    const texto     = document.getElementById('detalhe-observacao').value.trim();
    const horaFinal = document.getElementById('detalhe-hora-final').value;
    const arquivos  = fotosSelecionadas.map(f => f.file);

    if (!texto && arquivos.length === 0 && !horaFinal) {
        return mostrarNotificacao('erro-detalhe', '⚠️ Adicione uma observação, foto ou hora final.');
    }

    const camposAtualizar = {};
    const novasFotosUrls = [];

    for (const arquivo of arquivos) {
        const ext     = arquivo.name.split('.').pop();
        const caminho = `ocorrencias/${ocorrenciaAtual.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: errUpload } = await db.storage
            .from('fotos')
            .upload(caminho, arquivo, { upsert: true });

        if (errUpload) {
            mostrarNotificacao('erro-detalhe', '❌ Erro ao enviar foto: ' + errUpload.message);
            return;
        }
        const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
        novasFotosUrls.push(publicUrl);
    }

    if (texto) {
        camposAtualizar.observacao = texto;
    }

    if (horaFinal) {
        camposAtualizar.hora_final = horaFinal;
    }

    if (Object.keys(camposAtualizar).length > 0) {
        const { error: errUpdate } = await db.from('ocorrencias')
            .update(camposAtualizar)
            .eq('id', ocorrenciaAtual.id);
        if (errUpdate) {
            mostrarNotificacao('erro-detalhe', '❌ Erro ao salvar: ' + errUpdate.message);
            return;
        }
        Object.assign(ocorrenciaAtual, camposAtualizar);
    }

    for (const novaFotoUrl of novasFotosUrls) {
        const { error: errFoto } = await db.rpc('append_foto_ocorrencia', {
            oc_id:    ocorrenciaAtual.id,
            nova_url: novaFotoUrl
        });
        if (errFoto) {
            mostrarNotificacao('erro-detalhe', '❌ Erro ao salvar foto: ' + errFoto.message);
            return;
        }
    }

    if (novasFotosUrls.length > 0 || camposAtualizar.observacao) {
        carregarObservacoes(ocorrenciaAtual.id);
    }

    if (camposAtualizar.hora_final) {
        document.getElementById('d-hora-final').textContent = camposAtualizar.hora_final;
        document.getElementById('d-row-hora-final').style.display = 'flex';
    }

    document.getElementById('detalhe-observacao').value = '';
    document.getElementById('detalhe-hora-final').value = '';
    fotosSelecionadas = [];
    atualizarPreviewFotos();

    const msgExistente = document.getElementById('msg-observacao-existente');
    if (msgExistente) {
        msgExistente.style.opacity = '';
        msgExistente.style.pointerEvents = '';
    }

    mostrarNotificacao('erro-detalhe', '✅ Salvo!', true);
});

// ==========================================
// PREVIEW DE FOTOS
// ==========================================
document.getElementById('detalhe-foto').addEventListener('change', function () {
    const novosArquivos = Array.from(this.files);
    novosArquivos.forEach(file => {
        fotosSelecionadas.push({
            file: file,
            previewUrl: URL.createObjectURL(file)
        });
    });
    this.value = '';
    atualizarPreviewFotos();
});

function atualizarPreviewFotos() {
    const container = document.getElementById('foto-preview-container');
    container.innerHTML = '';

    if (fotosSelecionadas.length === 0) {
        container.innerHTML = '<span id="foto-nome" style="flex:1;font-size:12px;color:var(--text-secondary);">Nenhuma foto</span>';
        return;
    }

    fotosSelecionadas.forEach((foto, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'foto-preview-thumb';
        thumb.innerHTML = `
            <img src="${foto.previewUrl}" alt="Preview">
            <button class="btn-remove-foto" onclick="removerFotoPreview(${idx})">✕</button>
        `;
        container.appendChild(thumb);
    });
}

window.removerFotoPreview = function (idx) {
    URL.revokeObjectURL(fotosSelecionadas[idx].previewUrl);
    fotosSelecionadas.splice(idx, 1);
    atualizarPreviewFotos();
};

// ==========================================
// OBSERVAÇÃO E FOTO DIRETO DA LISTA
// ==========================================
let ocorrenciaObservacaoListaId = null;
let ocorrenciaAgentesExtraId = null;
let ocorrenciaAgentesExtraAtuais = [];
let ocorrenciaAgentesExtraBloqueados = [];

function normalizarAgenteOcorrencia(valor) {
    return String(valor || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function agenteJaListadoOcorrencia(lista, agente) {
    const alvo = normalizarAgenteOcorrencia(agente);
    return (lista || []).some(item => normalizarAgenteOcorrencia(item) === alvo);
}

function mostrarErroAgentesOcorrencia(msg) {
    const erro = document.getElementById('erro-modal-agentes-oc');
    if (!erro) return mostrarNotificacao('erro-ocorrencia', msg);
    erro.textContent = msg;
    erro.classList.remove('hidden');
}

function ocultarErroAgentesOcorrencia() {
    document.getElementById('erro-modal-agentes-oc')?.classList.add('hidden');
}

function renderizarAgentesExtraOcorrencia() {
    const lista = document.getElementById('oc-agentes-extra-lista');
    if (!lista) return;

    if (!ocorrenciaAgentesExtraAtuais.length) {
        lista.innerHTML = '<div class="message system-msg" style="max-width:100%;margin-top:6px;">Nenhum agente adicional.</div>';
        return;
    }

    lista.innerHTML = ocorrenciaAgentesExtraAtuais.map((agente, idx) => `
        <div class="rel-card-sub" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-size:13px;color:var(--text-primary);">${escapeHTML(agente)}</span>
            <button class="btn-action btn-close" type="button" style="padding:4px 9px;font-size:11px;" onclick="removerAgenteExtraOcorrencia(${idx})">✕</button>
        </div>
    `).join('');
}

async function carregarAgentesComKmAberto() {
    const { data, error } = await db
        .from('registros_viatura')
        .select('condutor, apoio')
        .eq('status', 'aberto');

    if (error) throw error;

    const unicos = new Map();
    (data || []).forEach(reg => {
        [reg.condutor, reg.apoio].forEach(agente => {
            const nome = String(agente || '').trim();
            if (!nome) return;
            unicos.set(normalizarAgenteOcorrencia(nome), nome);
        });
    });

    return Array.from(unicos.values()).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

function preencherSelectAgentesExtraOcorrencia(agentes) {
    const select = document.getElementById('oc-agente-extra-select');
    if (!select) return;

    const disponiveis = (agentes || []).filter(agente =>
        !agenteJaListadoOcorrencia(ocorrenciaAgentesExtraBloqueados, agente)
        && !agenteJaListadoOcorrencia(ocorrenciaAgentesExtraAtuais, agente)
    );

    if (!disponiveis.length) {
        select.innerHTML = '<option value="">Nenhum agente disponível</option>';
        return;
    }

    select.innerHTML = '<option value="">Selecione o agente...</option>' + disponiveis
        .map(agente => `<option value="${escapeHTML(agente)}">${escapeHTML(agente)}</option>`)
        .join('');
}

window.abrirModalAgentesOcorrencia = async function (id) {
    ocorrenciaAgentesExtraId = null;
    ocultarErroAgentesOcorrencia();

    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');

    if (!podeAlterarOcorrencia(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Só o criador pode gerenciar agentes desta ocorrência.');
    }

    if (!isUnder24hOc(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    ocorrenciaAgentesExtraId = id;
    ocorrenciaAgentesExtraAtuais = Array.isArray(oc.agentes_adicionais) ? [...oc.agentes_adicionais].filter(Boolean) : [];
    ocorrenciaAgentesExtraBloqueados = [oc.condutor, oc.apoio].filter(Boolean);

    const select = document.getElementById('oc-agente-extra-select');
    if (select) select.innerHTML = '<option value="">Carregando agentes...</option>';
    renderizarAgentesExtraOcorrencia();
    document.getElementById('modal-agentes-oc')?.classList.remove('hidden');

    try {
        const agentes = await carregarAgentesComKmAberto();
        preencherSelectAgentesExtraOcorrencia(agentes);
    } catch (err) {
        mostrarErroAgentesOcorrencia('❌ Erro ao carregar agentes com KM aberto: ' + err.message);
        if (select) select.innerHTML = '<option value="">Erro ao carregar agentes</option>';
    }
};

window.adicionarAgenteExtraOcorrencia = async function () {
    const select = document.getElementById('oc-agente-extra-select');
    const agente = String(select?.value || '').trim();
    if (!agente) return mostrarErroAgentesOcorrencia('⚠️ Selecione um agente.');

    if (agenteJaListadoOcorrencia(ocorrenciaAgentesExtraBloqueados, agente)) {
        return mostrarErroAgentesOcorrencia('⚠️ Este agente já está como condutor ou apoio.');
    }

    if (agenteJaListadoOcorrencia(ocorrenciaAgentesExtraAtuais, agente)) {
        return mostrarErroAgentesOcorrencia('⚠️ Este agente já foi adicionado.');
    }

    ocultarErroAgentesOcorrencia();
    ocorrenciaAgentesExtraAtuais.push(agente);
    renderizarAgentesExtraOcorrencia();

    try {
        const agentes = await carregarAgentesComKmAberto();
        preencherSelectAgentesExtraOcorrencia(agentes);
    } catch (err) {
        if (select) select.value = '';
    }
};

window.removerAgenteExtraOcorrencia = async function (idx) {
    ocorrenciaAgentesExtraAtuais.splice(idx, 1);
    renderizarAgentesExtraOcorrencia();

    try {
        const agentes = await carregarAgentesComKmAberto();
        preencherSelectAgentesExtraOcorrencia(agentes);
    } catch (err) {
        // Mantem a lista atual renderizada mesmo se a recarga do select falhar.
    }
};

window.confirmarAgentesExtraOcorrencia = async function () {
    if (!ocorrenciaAgentesExtraId) return;

    const { error } = await db.from('ocorrencias')
        .update({ agentes_adicionais: ocorrenciaAgentesExtraAtuais })
        .eq('id', ocorrenciaAgentesExtraId);

    if (error) return mostrarErroAgentesOcorrencia('❌ Erro ao salvar agentes: ' + error.message);

    ocorrenciaAgentesExtraId = null;
    ocorrenciaAgentesExtraAtuais = [];
    ocorrenciaAgentesExtraBloqueados = [];
    fecharModal('modal-agentes-oc');
    mostrarNotificacao('erro-ocorrencia', '✅ Agentes atualizados!', true);
    carregarHistoricoOcorrencia(true);
};

window.adicionarObservacaoLista = async function (id) {
    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');

    if (!podeAlterarOcorrencia(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    ocorrenciaObservacaoListaId = id;
    const erro = document.getElementById('erro-modal-observacao-oc');
    const campo = document.getElementById('oc-observacao-texto');
    if (erro) erro.classList.add('hidden');
    if (campo) {
        campo.value = oc.observacao || '';
        setTimeout(() => campo.focus(), 0);
    }
    document.getElementById('modal-observacao-oc')?.classList.remove('hidden');
};

window.confirmarObservacaoLista = async function () {
    if (!ocorrenciaObservacaoListaId) return;

    const erro = document.getElementById('erro-modal-observacao-oc');
    const campo = document.getElementById('oc-observacao-texto');
    const obs = (campo?.value || '').trim();
    const mostrar = msg => {
        if (!erro) return mostrarNotificacao('erro-ocorrencia', msg);
        erro.textContent = msg;
        erro.classList.remove('hidden');
    };

    if (!obs) return mostrar('⚠️ A observação não pode ficar vazia.');

    const { error: errUpdate } = await db.from('ocorrencias')
        .update({ observacao: obs })
        .eq('id', ocorrenciaObservacaoListaId);

    if (errUpdate) return mostrar('❌ Erro ao salvar: ' + errUpdate.message);

    ocorrenciaObservacaoListaId = null;
    if (campo) campo.value = '';
    fecharModal('modal-observacao-oc');
    mostrarNotificacao('erro-ocorrencia', '✅ Observação salva!', true);
    carregarHistoricoOcorrencia(true);
};

window.adicionarFotoLista = async function (id) {
    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', id).single();
    if (error || !oc) return mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');

    if (!podeAlterarOcorrencia(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    fotoListaTargetId = id;
    const input = document.getElementById('lista-foto-input');
    input.value = '';
    input.click();
};

document.getElementById('lista-foto-input').addEventListener('change', async function () {
    if (!fotoListaTargetId) return;
    const arquivos = Array.from(this.files);
    if (arquivos.length === 0) return;

    const { data: oc, error } = await db.from('ocorrencias').select('*').eq('id', fotoListaTargetId).single();
    if (error || !oc) {
        mostrarNotificacao('erro-ocorrencia', '❌ Erro ao carregar ocorrência.');
        return;
    }

    if (!podeAlterarOcorrencia(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Você só pode alterar ocorrências criadas por você.');
    }

    if (!isUnder24hOc(oc)) {
        return mostrarNotificacao('erro-ocorrencia', '⚠️ Ocorrências com mais de 24h não podem ser editadas.');
    }

    const novasFotosUrls = [];
    for (const arquivo of arquivos) {
        const ext = arquivo.name.split('.').pop();
        const caminho = `ocorrencias/${fotoListaTargetId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: errUpload } = await db.storage
            .from('fotos')
            .upload(caminho, arquivo, { upsert: true });

        if (errUpload) {
            mostrarNotificacao('erro-ocorrencia', '❌ Erro ao enviar foto: ' + errUpload.message);
            return;
        }
        const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
        novasFotosUrls.push(publicUrl);
    }

    for (const novaFotoUrl of novasFotosUrls) {
        const { error: errFoto } = await db.rpc('append_foto_ocorrencia', {
            oc_id: fotoListaTargetId,
            nova_url: novaFotoUrl
        });
        if (errFoto) {
            mostrarNotificacao('erro-ocorrencia', '❌ Erro ao salvar foto: ' + errFoto.message);
            return;
        }
    }

    mostrarNotificacao('erro-ocorrencia', `✅ ${novasFotosUrls.length} foto(s) salva(s)!`, true);
    carregarHistoricoOcorrencia(true);
});
