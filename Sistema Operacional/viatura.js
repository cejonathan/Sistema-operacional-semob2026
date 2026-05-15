// ==========================================
// HISTÓRICO DE VIATURA (paginado)
// ==========================================
let vtrPagina       = 0;
let vtrTodosCarregados = false;
let vtrCarregando   = false;

async function carregarHistoricoViatura(resetar = true) {
    if (vtrCarregando) return;
    if (resetar) {
        containerMensagensVtr.innerHTML = '';
        vtrPagina = 0;
        vtrTodosCarregados = false;
        const indicadorAntigo = document.getElementById('vtr-carregar-mais');
        if (indicadorAntigo) indicadorAntigo.remove();
    }
    if (vtrTodosCarregados) return;

    vtrCarregando = true;

    let indicador = document.getElementById('vtr-carregar-mais');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'vtr-carregar-mais';
        indicador.className = 'message system-msg';
        indicador.textContent = 'Carregando...';
        containerMensagensVtr.prepend(indicador);
    }

    const from = vtrPagina * VTR_PAGE_SIZE;
    const to   = from + VTR_PAGE_SIZE - 1;

    let query = db.from('registros_viatura')
        .select('*')
        .order('data', { ascending: false })
        .order('hora_inicial', { ascending: false })
        .range(from, to);

    if (agenteLogado && agenteLogado.det_codigo) {
        query = query.or(`condutor.ilike.%${agenteLogado.det_codigo}%,apoio.ilike.%${agenteLogado.det_codigo}%`);
    }

    const { data, error } = await query;
    vtrCarregando = false;

    if (error) {
        console.error("Erro ao carregar histórico viatura:", error);
        indicador.remove();
        return;
    }

    if (!data || data.length === 0) {
        vtrTodosCarregados = true;
        indicador.textContent = 'Início do histórico';
        return;
    }

    const scrollAntes = containerMensagensVtr.scrollHeight - containerMensagensVtr.scrollTop;

    indicador.remove();

    const fragment = document.createDocumentFragment();
    [...data].reverse().forEach(r => {
        const tmp = document.createElement('div');
        tmp.innerHTML = gerarHTMLMensagemVtr(r);
        if (tmp.firstElementChild) fragment.appendChild(tmp.firstElementChild);
    });
    containerMensagensVtr.prepend(fragment);

    if (resetar) {
        containerMensagensVtr.scrollTop = containerMensagensVtr.scrollHeight;
    } else {
        containerMensagensVtr.scrollTop = containerMensagensVtr.scrollHeight - scrollAntes;
    }

    if (data.length < VTR_PAGE_SIZE) {
        vtrTodosCarregados = true;
        const fim = document.createElement('div');
        fim.id = 'vtr-carregar-mais';
        fim.className = 'message system-msg';
        fim.textContent = 'Início do histórico';
        containerMensagensVtr.prepend(fim);
    } else {
        const novoInd = document.createElement('div');
        novoInd.id = 'vtr-carregar-mais';
        novoInd.className = 'message system-msg';
        novoInd.style.cursor = 'pointer';
        novoInd.textContent = '⬆ Carregar mais';
        novoInd.onclick = () => { carregarHistoricoViatura(false); };
        containerMensagensVtr.prepend(novoInd);
    }

    vtrPagina++;
}

function renderizarMensagemVtrFragment(dados, container) {
    const tmp = document.createElement('div');
    tmp.innerHTML = gerarHTMLMensagemVtr(dados);
    if (tmp.firstElementChild) container.appendChild(tmp.firstElementChild);
}

function renderizarMensagemVtr(dados, idBanco) {
    containerMensagensVtr.insertAdjacentHTML('beforeend', gerarHTMLMensagemVtr(dados));
    containerMensagensVtr.scrollTop = containerMensagensVtr.scrollHeight;
}

containerMensagensVtr.addEventListener('scroll', () => {
    if (containerMensagensVtr.scrollTop < 80 && !vtrTodosCarregados && !vtrCarregando) {
        carregarHistoricoViatura(false);
    }
});

// ==========================================
// ABRIR KM
// ==========================================
btnAbrirKm.addEventListener('click', async () => {
    const prefixo  = getValorCampo('vtr-select-vtr',      'vtr-input-vtr-outro');
    const condutor = getValorCampo('vtr-select-condutor',  'vtr-input-condutor-outro');
    const apoio    = getValorCampo('vtr-select-apoio',     'vtr-input-apoio-outro');
    const km       = vtrKmInicial.value.trim();
    const hora     = vtrHoraInicial.value;
    const data     = document.getElementById('vtr-data-inicial').value;

    if (!prefixo)  return mostrarNotificacao('erro-viatura', '⚠️ Selecione ou digite a Viatura.');
    if (!condutor) return mostrarNotificacao('erro-viatura', '⚠️ Selecione ou digite o Condutor.');
    if (!km)       return mostrarNotificacao('erro-viatura', '⚠️ Informe o KM Inicial.');
    if (!data)     return mostrarNotificacao('erro-viatura', '⚠️ Informe a Data.');
    if (!hora)     return mostrarNotificacao('erro-viatura', '⚠️ Informe a Hora Inicial.');

    const hoje = obterDataLocal();
    if (data !== hoje) {
        return mostrarNotificacao('erro-viatura', '⚠️ Só é permitido abrir KM na data atual.');
    }

    if (agenteLogado && agenteLogado.det_codigo) {
        const agente = agenteLogado.det_codigo;
        if (!verificaVinculoAgente(agente, condutor, apoio)) {
            return mostrarNotificacao('erro-viatura', `⚠️ Você (${agente}) precisa estar como Condutor ou Apoio.`);
        }
    }

    const { data: kmAberto } = await db
        .from('registros_viatura')
        .select('id, prefixo_vtr')
        .eq('status', 'aberto')
        .or(`condutor.ilike.%${agenteLogado?.det_codigo}%,apoio.ilike.%${agenteLogado?.det_codigo}%`)
        .limit(1);

    if (kmAberto && kmAberto.length > 0) {
        return mostrarNotificacao('erro-viatura',
            `⚠️ Você já tem KM aberto na viatura ${kmAberto[0].prefixo_vtr}. Encerre antes de abrir outro.`);
    }

    const { data: ultimoKm } = await db
        .from('registros_viatura')
        .select('km_final')
        .eq('prefixo_vtr', prefixo)
        .eq('status', 'fechado')
        .order('id', { ascending: false })
        .limit(1);

    if (ultimoKm && ultimoKm.length > 0 && ultimoKm[0].km_final) {
        const kmFinalAnterior = parseFloat(ultimoKm[0].km_final);
        const kmAtual         = parseFloat(km);
        if (kmAtual < kmFinalAnterior) {
            return mostrarNotificacao('erro-viatura',
                `⚠️ KM inválido. O último KM registrado da viatura ${prefixo} foi ${kmFinalAnterior}. O KM inicial não pode ser menor.`);
        }
    }

    const { data: viaturaAberta } = await db
        .from('registros_viatura')
        .select('id, condutor, apoio')
        .eq('prefixo_vtr', prefixo)
        .eq('status', 'aberto')
        .limit(1);

    if (viaturaAberta && viaturaAberta.length > 0) {
        const v = viaturaAberta[0];
        return mostrarNotificacao('erro-viatura',
            `⚠️ A viatura ${prefixo} já está com KM aberto (Condutor: ${v.condutor} | Apoio: ${v.apoio || '—'}). Encerre o KM atual antes de abrir um novo.`);
    }

    const dadosKm = { prefixo_vtr: prefixo, condutor, apoio, km_inicial: km, data: data, hora_inicial: hora, status: 'aberto' };
    const { data: kmInserido, error } = await db.from('registros_viatura').insert([dadosKm]).select();

    if (error) {
        mostrarNotificacao('erro-viatura', '❌ Erro ao abrir KM: ' + error.message);
    } else {
        idTurnoAtual = kmInserido[0].id;
        renderizarMensagemVtr(dadosKm, kmInserido[0].id);
        vtrKmInicial.value = '';
        vtrSelectVtr.value = '';
        vtrSelectCondutor.value = '';
        vtrSelectApoio.value = '';
        vtrKmInicial.value = '';
        vtrHoraInicial.value = '';
        document.getElementById('vtr-data-inicial').value = '';
        toggleFormViatura();
    }
});

// ==========================================
// GERAR HTML MENSAGEM VIATURA
// ==========================================
function gerarHTMLMensagemVtr(dados) {
    const idBanco  = dados.id;
    const idMsg    = `msg-${idBanco}`;
    const aberto   = !['fechado','finalizado','encerrado'].includes((dados.status||'').trim().toLowerCase());

    const kmFinal   = escapeHTML(dados.km_final   || '—');
    const horaFinal = dados.hora_final || '—';
    const prefixo   = escapeHTML(dados.prefixo_vtr || '—');
    const condutor  = escapeHTML(dados.condutor || '—');
    const apoio     = escapeHTML(dados.apoio || '—');
    const kmInicial = escapeHTML(dados.km_inicial || '—');

    let createdAtTs = null;
    if (dados.data) {
        const hora = (dados.hora_inicial || '00:00:00').split(':').slice(0, 2).join(':') + ':00';
        const ts = Date.parse(String(dados.data) + 'T' + hora);
        if (!isNaN(ts)) createdAtTs = ts;
    }
    if (createdAtTs === null && dados.created_at) {
        createdAtTs = new Date(dados.created_at).getTime();
        if (isNaN(createdAtTs)) createdAtTs = null;
    }
    const isUnder24h = createdAtTs !== null && (Date.now() - createdAtTs) <= 86400000;
    let botoesAcao = '';
    if (aberto && isUnder24h) {
        botoesAcao = `<div class="message-actions">
               <button class="btn-action" onclick="editarRegistroCompleto('${idBanco}')">✏️ EDITAR</button>
               <button class="btn-action btn-close" onclick="fecharKM('${idBanco}')">🏁 ENCERRAR</button>
           </div>`;
    } else if (aberto && !isUnder24h) {
        botoesAcao = `<div class="message-actions">
               <button class="btn-action btn-close" onclick="fecharKM('${idBanco}')">🏁 ENCERRAR</button>
           </div>`;
    } else if (isUnder24h) {
        botoesAcao = `<div class="message-actions">
               <button class="btn-action" onclick="editarRegistroCompleto('${idBanco}')">✏️ Editar</button>
           </div>`;
    }

    const statusColor  = aberto ? 'var(--green-accent)' : '#ff5252';
    const statusLabel  = aberto ? 'KM ABERTO' : 'KM FECHADO';

    const fmt = h => h ? h.substring(0, 5) : '—';

    const dataFmtVtr = dados.data
        ? new Date(dados.data + 'T00:00:00').toLocaleDateString('pt-BR')
        : dados.created_at
            ? new Date(dados.created_at).toLocaleDateString('pt-BR')
            : '—';

    return `
        <div class="message sent" id="${idMsg}">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${prefixo}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">${dataFmtVtr}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:6px;">
                <span style="color:var(--text-secondary);font-size:11px;">CONDUTOR</span><br>
                ${condutor}
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:8px;">
                <span style="color:var(--text-secondary);font-size:11px;">APOIO</span><br>
                ${apoio}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:4px;">
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">KM INICIAL</div>
                    <div style="font-size:13px;">${kmInicial}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">KM FINAL</div>
                    <div style="font-size:13px;">${kmFinal}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">HORA INICIAL</div>
                    <div style="font-size:13px;">${fmt(dados.hora_inicial)}</div>
                </div>
                <div>
                    <div style="color:var(--text-secondary);font-size:11px;">HORA FINAL</div>
                    <div style="font-size:13px;">${aberto ? '—' : fmt(horaFinal)}</div>
                </div>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);margin:8px 0;"></div>
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${statusColor};display:inline-block;flex-shrink:0;"></span>
                <span style="font-size:11px;font-weight:700;letter-spacing:0.6px;color:${statusColor};">${statusLabel}</span>
            </div>
            ${botoesAcao}
        </div>`;
}

// ==========================================
// MODAIS DE VIATURA (Editar / Fechar KM)
// ==========================================
function setValorInteligente(idSel, idInp, valor) {
    const select = document.getElementById(idSel);
    const input  = document.getElementById(idInp);
    if (!select || !input) return;
    const existe = Array.from(select.options).some(o => o.value === valor);
    if (existe && valor && valor.toLowerCase() !== 'outro') {
        select.value = valor;
        input.classList.add('hidden');
        input.value = '';
    } else {
        select.value = 'outro';
        input.value  = valor || '';
        input.classList.remove('hidden');
    }
}

window.editarRegistroCompleto = async function (id) {
    idSendoProcessado = id;
    const { data: reg, error } = await db.from('registros_viatura').select('*').eq('id', id).single();
    if (error) return mostrarNotificacao('erro-viatura', '❌ Erro ao carregar dados.');

    let createdAtTs = null;
    if (reg.data) {
        const hora = (reg.hora_inicial || '00:00:00').split(':').slice(0, 2).join(':') + ':00';
        const ts = Date.parse(String(reg.data) + 'T' + hora);
        if (!isNaN(ts)) createdAtTs = ts;
    }
    if (createdAtTs === null && reg.created_at) {
        createdAtTs = new Date(reg.created_at).getTime();
        if (isNaN(createdAtTs)) createdAtTs = null;
    }
    const isUnder24h = createdAtTs !== null && (Date.now() - createdAtTs) <= 86400000;
    if (!isUnder24h) return mostrarNotificacao('erro-viatura', '⚠️ Registros com mais de 24h não podem ser editados.');

    if (reg.status === 'aberto') {
        const { data: suc } = await db.from('registros_viatura').select('id').gt('created_at', reg.created_at).limit(1);
        if (suc && suc.length > 0) return mostrarNotificacao('erro-viatura', '⚠️ Existe um KM mais recente aberto.');
    }

    setValorInteligente('edit-prefixo',  'edit-prefixo-outro',  reg.prefixo_vtr);
    setValorInteligente('edit-condutor', 'edit-condutor-outro', reg.condutor);
    setValorInteligente('edit-apoio',    'edit-apoio-outro',    reg.apoio);
    document.getElementById('edit-km').value   = reg.km_inicial;
    document.getElementById('edit-hora').value = reg.hora_inicial;

    const rowFinal = document.getElementById('row-edit-final');
    if (reg.status === 'fechado') {
        rowFinal.classList.remove('hidden');
        document.getElementById('edit-km-final').value   = reg.km_final || '';
        document.getElementById('edit-hora-final').value = reg.hora_final || '';
    } else {
        rowFinal.classList.add('hidden');
    }

    document.getElementById('edit-condutor').disabled = false;
    document.getElementById('edit-apoio').disabled    = false;

    document.getElementById('modal-editar').classList.remove('hidden');
};

window.confirmarEdicao = async function () {
    const { data: regAtual } = await db.from('registros_viatura').select('*').eq('id', idSendoProcessado).single();
    if (regAtual) {
        let createdAtTs = null;
        if (regAtual.data) {
            const hora = (regAtual.hora_inicial || '00:00:00').split(':').slice(0, 2).join(':') + ':00';
            const ts = Date.parse(String(regAtual.data) + 'T' + hora);
            if (!isNaN(ts)) createdAtTs = ts;
        }
        if (createdAtTs === null && regAtual.created_at) {
            createdAtTs = new Date(regAtual.created_at).getTime();
            if (isNaN(createdAtTs)) createdAtTs = null;
        }
        const isUnder24h = createdAtTs !== null && (Date.now() - createdAtTs) <= 86400000;
        if (!isUnder24h) return mostrarNotificacao('erro-modal-editar', '⚠️ Registros com mais de 24h não podem ser editados.');
    }

    const novos = {
        prefixo_vtr:  getValorCampo('edit-prefixo',  'edit-prefixo-outro'),
        condutor:     getValorCampo('edit-condutor', 'edit-condutor-outro'),
        apoio:        getValorCampo('edit-apoio',    'edit-apoio-outro'),
        km_inicial:   document.getElementById('edit-km').value,
        hora_inicial: document.getElementById('edit-hora').value,
    };

    const rowFinal = document.getElementById('row-edit-final');
    if (!rowFinal.classList.contains('hidden')) {
        novos.km_final   = document.getElementById('edit-km-final').value;
        novos.hora_final = document.getElementById('edit-hora-final').value;
        if (!novos.km_final) return mostrarNotificacao('erro-modal-editar', '⚠️ Informe o KM Final.');
        if (!novos.hora_final) return mostrarNotificacao('erro-modal-editar', '⚠️ Informe a Hora Final.');
    }

    if (!novos.prefixo_vtr) return mostrarNotificacao('erro-modal-editar', '⚠️ Informe a Viatura.');
    if (!novos.condutor)    return mostrarNotificacao('erro-modal-editar', '⚠️ Informe o Condutor.');
    if (!novos.km_inicial)  return mostrarNotificacao('erro-modal-editar', '⚠️ Informe o KM Inicial.');
    if (novos.condutor && novos.apoio && novos.condutor === novos.apoio)
        return mostrarNotificacao('erro-modal-editar', '⚠️ Condutor e Apoio não podem ser o mesmo agente.');
    if (agenteLogado && agenteLogado.det_codigo) {
        const agente = agenteLogado.det_codigo;
        if (!verificaVinculoAgente(agente, novos.condutor, novos.apoio))
            return mostrarNotificacao('erro-modal-editar', `⚠️ Você (${agente}) precisa estar como Condutor ou Apoio.`);
    }

    const { error } = await db.from('registros_viatura').update(novos).eq('id', idSendoProcessado);
    if (error) {
        mostrarNotificacao('erro-modal-editar', '❌ Erro ao atualizar: ' + error.message);
    } else {
        fecharModal('modal-editar');
        const balao = document.getElementById(`msg-${idSendoProcessado}`);
        if (balao) {
            balao.querySelector('strong').innerText    = `Viatura ${novos.prefixo_vtr} ABERTA!`;
            balao.querySelector('small').innerText     = `Condutor: ${novos.condutor} | Apoio: ${novos.apoio || '—'}`;
            balao.querySelector('.dados-km').innerText = `KM Inicial: ${novos.km_inicial} | Hora: ${novos.hora_inicial}`;
            balao.style.backgroundColor = 'var(--green-accent)';
            setTimeout(() => balao.style.backgroundColor = 'var(--msg-sent)', 500);
        }
    }
};

window.fecharKM = async function (id) {
    const { data: ocAberta } = await db
        .from('ocorrencias')
        .select('id, numero_ocorrencia, codigo_descricao')
        .eq('status', 'aberto')
        .eq('criado_por', agenteLogado?.user_id)
        .limit(1);

    if (ocAberta && ocAberta.length > 0) {
        const oc = ocAberta[0];
        const num = oc.numero_ocorrencia ? `#${oc.numero_ocorrencia}` : '';
        return mostrarNotificacao('erro-viatura',
            `⚠️ Há uma ocorrência aberta ${num} (${oc.codigo_descricao || ''}). Encerre-a antes de fechar o KM.`);
    }

    idSendoProcessado = id;
    document.getElementById('fechar-hora-final').value =
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('fechar-km-final').value = '';
    document.getElementById('modal-fechar').classList.remove('hidden');
};

window.confirmarFechamento = async function () {
    const kmFinal   = document.getElementById('fechar-km-final').value.trim();
    const horaFinal = document.getElementById('fechar-hora-final').value;
    if (!kmFinal) return mostrarNotificacao('erro-modal-fechar', '⚠️ Informe o KM Final.');

    const { error } = await db.from('registros_viatura')
        .update({ km_final: kmFinal, hora_final: horaFinal, status: 'fechado' })
        .eq('id', idSendoProcessado);

    if (error) {
        mostrarNotificacao('erro-modal-fechar', '❌ Erro ao encerrar: ' + error.message);
    } else {
        fecharModal('modal-fechar');
        const balao = document.getElementById(`msg-${idSendoProcessado}`);
        if (balao) {
            balao.style.opacity = '0.7';
            balao.querySelector('.message-actions').innerHTML =
                `✅ KM Finalizado: ${kmFinal} (${horaFinal})`;
        }
    }
};
