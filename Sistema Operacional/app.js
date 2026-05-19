// ==========================================
// REFERÊNCIAS DO HTML
// ==========================================
const telaLogin      = document.getElementById('tela-login');
const telaInicial    = document.getElementById('tela-inicial');
const telaViatura    = document.getElementById('tela-conversa-viatura');
const telaOcorrencia = document.getElementById('tela-conversa-ocorrencia');
const telaDetalhe    = document.getElementById('tela-detalhe-ocorrencia');
const telaRelatorio = document.getElementById('tela-conversa-relatorio');

const btnEntrarViatura    = document.getElementById('btn-entrar-viatura');
const btnEntrarOcorrencia = document.getElementById('btn-entrar-ocorrencia');

// Viatura
const vtrSelectVtr      = document.getElementById('vtr-select-vtr');
const vtrSelectCondutor = document.getElementById('vtr-select-condutor');
const vtrSelectApoio    = document.getElementById('vtr-select-apoio');
const vtrKmInicial      = document.getElementById('vtr-km-inicial');
const vtrHoraInicial    = document.getElementById('vtr-hora-inicial');
const btnAbrirKm        = document.getElementById('btn-abrir-km');
const containerMensagensVtr = document.getElementById('container-msgs-viatura');

// Ocorrência (formulário)
const ocSelectCodigo     = document.getElementById('oc-select-codigo');
const ocSelectSetor      = document.getElementById('oc-select-setor');
const ocSugestoesSetor   = document.getElementById('oc-sugestoes-setor');
const ocSelectReferencia = document.getElementById('oc-select-referencia');
const ocRowReferenciaManual = document.getElementById('oc-row-referencia-manual');
const ocInputReferenciaManual = document.getElementById('oc-input-referencia-manual');
const ocRowReferenciaCruzamento = document.getElementById('oc-row-referencia-cruzamento');
const ocInputReferenciaCruzamento = document.getElementById('oc-input-referencia-cruzamento');
const ocSugestoesReferenciaCruzamento = document.getElementById('oc-sugestoes-referencia-cruzamento');
const ocSelectVtr        = document.getElementById('oc-select-vtr');
const ocSelectCondutor   = document.getElementById('oc-select-condutor');
const ocSelectApoio      = document.getElementById('oc-select-apoio');
const ocData             = document.getElementById('oc-data');
const ocHora             = document.getElementById('oc-hora');
const btnAbrirOcorrencia = document.getElementById('btn-abrir-ocorrencia');
const containerMensagensOc = document.getElementById('container-msgs-ocorrencia');

// Login
const inputEmail   = document.getElementById('login-email');
const inputSenha   = document.getElementById('login-senha');
const btnEntrar    = document.getElementById('btn-entrar');

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let idTurnoAtual      = null;
let idSendoProcessado = null;
let agenteLogado      = null;
let ocorrenciaAtual   = null;
let fotosSelecionadas = [];
let filtroOcorrenciaAtual = 'todos';
let listaSetoresOcorrencia = [];
let indiceSugestaoSetor = -1;
let indiceSugestaoReferenciaCruzamento = -1;

// ==========================================
// FUNÇÕES DE APOIO
// ==========================================
function verificaVinculoAgente(agente, condutor, apoio) {
    if (!agente) return true;
    const ag = agente.toUpperCase();
    const c  = (condutor || '').trim().toUpperCase();
    const ap = (apoio || '').trim().toUpperCase();

    const matchCondutor = c.length > 0 && (c.includes(ag) || ag.includes(c));
    const matchApoio    = ap.length > 0 && (ap.includes(ag) || ag.includes(ap));

    return matchCondutor || matchApoio;
}

function selecionarAgenteNoSelect(selectElement, agente) {
    if (!selectElement || !agente) return;
    const ag = agente.toUpperCase();
    for (let i = 0; i < selectElement.options.length; i++) {
        const val = selectElement.options[i].value.toUpperCase();
        if (val && (val.includes(ag) || ag.includes(val))) {
            selectElement.value = selectElement.options[i].value;
            return;
        }
    }
}

function obterIdentificadoresAgenteLogado() {
    if (!agenteLogado?.det_codigo) return [];
    const nomeCompleto = String(agenteLogado.det_codigo).trim();
    const codigoBase = nomeCompleto.split('-')[0].trim();
    return [...new Set([nomeCompleto, codigoBase].filter(Boolean))];
}

function aplicarFiltroMinhasOcorrencias(query) {
    const filtros = [];
    if (agenteLogado?.user_id) filtros.push(`criado_por.eq.${agenteLogado.user_id}`);
    obterIdentificadoresAgenteLogado().forEach(agente => {
        filtros.push(`condutor.ilike.%${agente}%`);
        filtros.push(`apoio.ilike.%${agente}%`);
        filtros.push(`agentes_adicionais.cs.{"${String(agente).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"}`);
    });

    return filtros.length ? query.or(filtros.join(',')) : query;
}

function aplicarFiltroOcorrencias(query) {
    if (filtroOcorrenciaAtual === 'abertas') {
        return query.eq('status', 'aberto');
    }

    if (filtroOcorrenciaAtual === 'minhas') {
        return aplicarFiltroMinhasOcorrencias(query);
    }

    return query;
}

function ocorrenciaEhDoAgenteLogado(ocorrencia) {
    if (!ocorrencia) return false;
    if (agenteLogado?.user_id && ocorrencia.criado_por === agenteLogado.user_id) return true;

    const condutor = String(ocorrencia.condutor || '').toUpperCase();
    const apoio = String(ocorrencia.apoio || '').toUpperCase();
    const agentesAdicionais = Array.isArray(ocorrencia.agentes_adicionais)
        ? ocorrencia.agentes_adicionais.map(a => String(a || '').toUpperCase())
        : [];

    return obterIdentificadoresAgenteLogado().some(agente => {
        const ag = agente.toUpperCase();
        return (condutor && (condutor.includes(ag) || ag.includes(condutor)))
            || (apoio && (apoio.includes(ag) || ag.includes(apoio)))
            || agentesAdicionais.some(extra => extra && (extra.includes(ag) || ag.includes(extra)));
    });
}

function normalizarBusca(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function ocultarSugestoesSetor() {
    if (!ocSugestoesSetor) return;
    ocSugestoesSetor.classList.add('hidden');
    ocSugestoesSetor.innerHTML = '';
    indiceSugestaoSetor = -1;
}

function selecionarSugestaoSetor(nome) {
    if (!ocSelectSetor) return;
    ocSelectSetor.value = nome;
    ocultarSugestoesSetor();
}

function ocultarSugestoesReferenciaCruzamento() {
    if (!ocSugestoesReferenciaCruzamento) return;
    ocSugestoesReferenciaCruzamento.classList.add('hidden');
    ocSugestoesReferenciaCruzamento.innerHTML = '';
    indiceSugestaoReferenciaCruzamento = -1;
}

function selecionarSugestaoReferenciaCruzamento(nome) {
    if (!ocInputReferenciaCruzamento) return;
    ocInputReferenciaCruzamento.value = nome;
    ocultarSugestoesReferenciaCruzamento();
}

function renderizarSugestoesSetor() {
    if (!ocSelectSetor || !ocSugestoesSetor) return;

    const termo = normalizarBusca(ocSelectSetor.value);
    if (termo.length < 2) {
        ocultarSugestoesSetor();
        return;
    }

    const resultados = listaSetoresOcorrencia
        .filter(nome => normalizarBusca(nome).includes(termo))
        .slice(0, 12);

    if (!resultados.length) {
        ocultarSugestoesSetor();
        return;
    }

    ocSugestoesSetor.innerHTML = resultados.map((nome, index) =>
        `<button type="button" class="autocomplete-item${index === indiceSugestaoSetor ? ' ativo' : ''}" data-local="${escapeHTML(nome)}">${escapeHTML(nome)}</button>`
    ).join('');
    ocSugestoesSetor.classList.remove('hidden');
}

function renderizarSugestoesReferenciaCruzamento() {
    if (!ocInputReferenciaCruzamento || !ocSugestoesReferenciaCruzamento) return;

    const termo = normalizarBusca(ocInputReferenciaCruzamento.value);
    if (termo.length < 2) {
        ocultarSugestoesReferenciaCruzamento();
        return;
    }

    const resultados = listaSetoresOcorrencia
        .filter(nome => normalizarBusca(nome).includes(termo))
        .slice(0, 12);

    if (!resultados.length) {
        ocultarSugestoesReferenciaCruzamento();
        return;
    }

    ocSugestoesReferenciaCruzamento.innerHTML = resultados.map((nome, index) =>
        `<button type="button" class="autocomplete-item${index === indiceSugestaoReferenciaCruzamento ? ' ativo' : ''}" data-local="${escapeHTML(nome)}">${escapeHTML(nome)}</button>`
    ).join('');
    ocSugestoesReferenciaCruzamento.classList.remove('hidden');
}

function configurarAutocompleteSetor() {
    if (!ocSelectSetor || !ocSugestoesSetor) return;

    ocSelectSetor.addEventListener('input', () => {
        indiceSugestaoSetor = -1;
        renderizarSugestoesSetor();
    });

    ocSelectSetor.addEventListener('focus', renderizarSugestoesSetor);

    ocSelectSetor.addEventListener('keydown', event => {
        const itens = Array.from(ocSugestoesSetor.querySelectorAll('.autocomplete-item'));
        if (ocSugestoesSetor.classList.contains('hidden') || !itens.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            indiceSugestaoSetor = (indiceSugestaoSetor + 1) % itens.length;
            renderizarSugestoesSetor();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            indiceSugestaoSetor = (indiceSugestaoSetor - 1 + itens.length) % itens.length;
            renderizarSugestoesSetor();
        } else if (event.key === 'Enter' && indiceSugestaoSetor >= 0) {
            event.preventDefault();
            selecionarSugestaoSetor(itens[indiceSugestaoSetor].dataset.local);
        } else if (event.key === 'Escape') {
            ocultarSugestoesSetor();
        }
    });

    ocSugestoesSetor.addEventListener('mousedown', event => {
        const item = event.target.closest('.autocomplete-item');
        if (!item) return;
        event.preventDefault();
        selecionarSugestaoSetor(item.dataset.local);
    });

    document.addEventListener('click', event => {
        if (event.target === ocSelectSetor || ocSugestoesSetor.contains(event.target)) return;
        ocultarSugestoesSetor();
    });
}

function configurarAutocompleteReferenciaCruzamento() {
    if (!ocInputReferenciaCruzamento || !ocSugestoesReferenciaCruzamento) return;

    ocInputReferenciaCruzamento.addEventListener('input', () => {
        indiceSugestaoReferenciaCruzamento = -1;
        renderizarSugestoesReferenciaCruzamento();
    });

    ocInputReferenciaCruzamento.addEventListener('focus', renderizarSugestoesReferenciaCruzamento);

    ocInputReferenciaCruzamento.addEventListener('keydown', event => {
        const itens = Array.from(ocSugestoesReferenciaCruzamento.querySelectorAll('.autocomplete-item'));
        if (ocSugestoesReferenciaCruzamento.classList.contains('hidden') || !itens.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            indiceSugestaoReferenciaCruzamento = (indiceSugestaoReferenciaCruzamento + 1) % itens.length;
            renderizarSugestoesReferenciaCruzamento();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            indiceSugestaoReferenciaCruzamento = (indiceSugestaoReferenciaCruzamento - 1 + itens.length) % itens.length;
            renderizarSugestoesReferenciaCruzamento();
        } else if (event.key === 'Enter' && indiceSugestaoReferenciaCruzamento >= 0) {
            event.preventDefault();
            selecionarSugestaoReferenciaCruzamento(itens[indiceSugestaoReferenciaCruzamento].dataset.local);
        } else if (event.key === 'Escape') {
            ocultarSugestoesReferenciaCruzamento();
        }
    });

    ocSugestoesReferenciaCruzamento.addEventListener('mousedown', event => {
        const item = event.target.closest('.autocomplete-item');
        if (!item) return;
        event.preventDefault();
        selecionarSugestaoReferenciaCruzamento(item.dataset.local);
    });

    document.addEventListener('click', event => {
        if (event.target === ocInputReferenciaCruzamento || ocSugestoesReferenciaCruzamento.contains(event.target)) return;
        ocultarSugestoesReferenciaCruzamento();
    });
}

function atualizarCamposReferenciaOcorrencia() {
    if (!ocSelectReferencia) return;

    const tipo = ocSelectReferencia.value;
    const mostrarManual = tipo === 'Defronte' || tipo === 'Oposto';
    const mostrarCruzamento = tipo === 'Cruzamento';

    if (ocRowReferenciaManual) ocRowReferenciaManual.classList.toggle('hidden', !mostrarManual);
    if (ocRowReferenciaCruzamento) ocRowReferenciaCruzamento.classList.toggle('hidden', !mostrarCruzamento);

    if (!mostrarManual && ocInputReferenciaManual) ocInputReferenciaManual.value = '';
    if (!mostrarCruzamento && ocInputReferenciaCruzamento) ocInputReferenciaCruzamento.value = '';
    if (!mostrarCruzamento) ocultarSugestoesReferenciaCruzamento();

    if (mostrarManual && ocInputReferenciaManual) ocInputReferenciaManual.focus();
    if (mostrarCruzamento && ocInputReferenciaCruzamento) ocInputReferenciaCruzamento.focus();
}

function obterReferenciaOcorrencia() {
    const tipo = ocSelectReferencia?.value || '';
    if (!tipo) return { tipo: '', detalhe: '' };

    if (tipo === 'Defronte' || tipo === 'Oposto') {
        return { tipo, detalhe: (ocInputReferenciaManual?.value || '').trim() };
    }

    if (tipo === 'Cruzamento') {
        return { tipo, detalhe: (ocInputReferenciaCruzamento?.value || '').trim() };
    }

    return { tipo, detalhe: '' };
}

function montarLocalComReferencia(local) {
    const referencia = obterReferenciaOcorrencia();
    if (!referencia.tipo) return local;

    const detalhe = referencia.detalhe ? ` ${referencia.detalhe}` : '';
    return `${local} - ${referencia.tipo}${detalhe}`;
}

function limparReferenciaOcorrencia() {
    if (ocSelectReferencia) ocSelectReferencia.value = '';
    if (ocInputReferenciaManual) ocInputReferenciaManual.value = '';
    if (ocInputReferenciaCruzamento) ocInputReferenciaCruzamento.value = '';
    atualizarCamposReferenciaOcorrencia();
}

window.obterReferenciaOcorrencia = obterReferenciaOcorrencia;
window.montarLocalComReferencia = montarLocalComReferencia;
window.limparReferenciaOcorrencia = limparReferenciaOcorrencia;

function definirListaSetoresOcorrencia(setores) {
    const nomes = (setores || [])
        .map(s => String(s.nome || '').trim())
        .filter(Boolean);

    const unicos = new Map();
    nomes.forEach(nome => unicos.set(normalizarBusca(nome), nome));
    listaSetoresOcorrencia = Array.from(unicos.values())
        .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    renderizarSugestoesSetor();
    renderizarSugestoesReferenciaCruzamento();
}

async function carregarTodosSetores(colunas = 'id, nome') {
    const pageSize = 1000;
    let inicio = 0;
    let todos = [];

    while (true) {
        const { data, error } = await db
            .from('lista_setores')
            .select(colunas)
            .order('nome', { ascending: true })
            .range(inicio, inicio + pageSize - 1);

        if (error) return { data: todos, error };
        const pagina = data || [];
        todos = todos.concat(pagina);

        if (pagina.length < pageSize) break;
        inicio += pageSize;
    }

    return { data: todos, error: null };
}

function podeAlterarOcorrencia(ocorrencia) {
    if (!ocorrencia || !agenteLogado?.user_id) return false;

    if (ocorrencia.criado_por) {
        return ocorrencia.criado_por === agenteLogado.user_id;
    }

    return ocorrenciaEhDoAgenteLogado(ocorrencia);
}

function ocorrenciaPassaFiltroAtual(ocorrencia) {
    const status = String(ocorrencia?.status || '').trim().toLowerCase();

    if (filtroOcorrenciaAtual === 'abertas') {
        return status === 'aberto';
    }

    if (filtroOcorrenciaAtual === 'minhas') {
        return ocorrenciaEhDoAgenteLogado(ocorrencia);
    }

    return true;
}

function filtrarOcorrenciasLocalmente(ocorrencias) {
    return (ocorrencias || []).filter(ocorrenciaPassaFiltroAtual);
}

function atualizarFiltroOcorrenciaUI() {
    document.querySelectorAll('[data-oc-filtro]').forEach(btn => {
        btn.classList.toggle('ativo', btn.dataset.ocFiltro === filtroOcorrenciaAtual);
    });
}

async function atualizarContadoresOcorrencias() {
    const setCount = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `(${Number(count || 0)})`;
    };
    const temFiltroMinhas = Boolean(agenteLogado?.user_id || obterIdentificadoresAgenteLogado().length > 0);

    const [
        { count: totalTodas, error: errTodas },
        { count: totalAbertas, error: errAbertas },
        minhasResp
    ] = await Promise.all([
        db.from('ocorrencias').select('id', { count: 'exact', head: true }),
        db.from('ocorrencias').select('id', { count: 'exact', head: true }).eq('status', 'aberto'),
        temFiltroMinhas
            ? aplicarFiltroMinhasOcorrencias(db.from('ocorrencias').select('id', { count: 'exact', head: true }))
            : Promise.resolve({ count: 0, error: null })
    ]);

    if (!errTodas) setCount('oc-count-todos', totalTodas);
    if (!errAbertas) setCount('oc-count-abertas', totalAbertas);
    if (!minhasResp.error) setCount('oc-count-minhas', minhasResp.count);
}

window.definirFiltroOcorrencias = function (filtro) {
    filtroOcorrenciaAtual = filtro;
    atualizarFiltroOcorrenciaUI();
    atualizarContadoresOcorrencias();
    const inputPesquisa = document.getElementById('input-pesquisa-ocorrencia');

    if (inputPesquisa && inputPesquisa.value.trim()) {
        inputPesquisa.dispatchEvent(new Event('input'));
        return;
    }

    ocPagina = 0;
    ocTodosCarregados = false;
    ocCarregando = false;
    carregarHistoricoOcorrencia(true);
};

function obterDataLocal() {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function escapeHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

// ==========================================
// BLOQUEAR LETRAS NOS CAMPOS DE KM
// ==========================================
['vtr-km-inicial', 'fechar-km-final', 'edit-km'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', e => {
        const permitidos = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','Home','End'];
        if (permitidos.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    });
    el.addEventListener('input', () => {
        el.value = el.value.replace(/\D/g, '');
    });
});

// ==========================================
// TOGGLE DOS FORMULÁRIOS
// ==========================================
window.toggleFormViatura = function () {
    const form = document.getElementById('vtr-form-fields');
    const btn  = document.getElementById('btn-toggle-form-vtr');
    const aberto = !form.classList.contains('hidden');
    if (aberto) {
        form.classList.add('hidden');
        btn.textContent = '+ ABRIR KM';
        btn.classList.remove('ativo');
    } else {
        form.classList.remove('hidden');
        btn.textContent = '✕ CANCELAR';
        btn.classList.add('ativo');
    }
};

window.toggleFormOcorrencia = function () {
    const form = document.getElementById('oc-form-fields');
    const btn  = document.getElementById('btn-toggle-form-oc');
    const aberto = !form.classList.contains('hidden');
    if (aberto) {
        form.classList.add('hidden');
        btn.textContent = '＋ NOVA OCORRÊNCIA';
        btn.classList.remove('ativo');
    } else {
        form.classList.remove('hidden');
        btn.textContent = '✕ CANCELAR';
        btn.classList.add('ativo');
    }
};

// ==========================================
// NOTIFICAÇÕES
// ==========================================
function mostrarNotificacao(idElemento, mensagem, sucesso = false) {
    const el = document.getElementById(idElemento);
    if (!el) return;
    el.textContent = mensagem;
    el.className = 'erro-inline ' + (sucesso ? 'sucesso-inline' : '');
    el.classList.remove('hidden');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.add('hidden'), 4000);
}

// ==========================================
// NAVEGAÇÃO ENTRE TELAS
// ==========================================
function ocultarTodasTelas() {
    [telaLogin, telaInicial, telaViatura, telaOcorrencia, telaDetalhe, telaRelatorio]
        .forEach(t => t && t.classList.add('hidden'));
}

btnEntrarViatura.addEventListener('click', () => {
    ocultarTodasTelas();
    telaViatura.classList.remove('hidden');
    carregarHistoricoViatura();
    const agora = new Date();
    document.getElementById('vtr-data-inicial').value = obterDataLocal();
    vtrHoraInicial.value = agora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (agenteLogado) {
        if (agenteLogado.pref_vtr) vtrSelectVtr.value = agenteLogado.pref_vtr;
        if (agenteLogado.pref_funcao) {
            definirFuncaoAgente(agenteLogado.pref_funcao);
        } else {
            vtrSelectCondutor.value = '';
            vtrSelectApoio.value = '';
        }
    }
});

window.definirFuncaoAgente = function (funcao) {
    const btnCondutor = document.getElementById('btn-funcao-condutor');
    const btnApoio    = document.getElementById('btn-funcao-apoio');

    if (btnCondutor) btnCondutor.classList.toggle('ativo', funcao === 'condutor');
    if (btnApoio)    btnApoio.classList.toggle('ativo',    funcao === 'apoio');

    if (!agenteLogado) return;

    if (funcao === 'condutor') {
        selecionarAgenteNoSelect(vtrSelectCondutor, agenteLogado.det_codigo);
        vtrSelectCondutor.disabled = false;
        vtrSelectApoio.value       = '';
        vtrSelectApoio.disabled    = false;
    } else {
        selecionarAgenteNoSelect(vtrSelectApoio, agenteLogado.det_codigo);
        vtrSelectApoio.disabled    = false;
        vtrSelectCondutor.value    = '';
        vtrSelectCondutor.disabled = false;
    }
};

btnEntrarOcorrencia.addEventListener('click', async () => {
    ocultarTodasTelas();
    telaOcorrencia.classList.remove('hidden');
    carregarHistoricoOcorrencia();
    carregarCodigosESetores();
    const agora = new Date();
    ocData.value = obterDataLocal();
    ocHora.value = agora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (agenteLogado && agenteLogado.det_codigo) {
        const { data: kmAberto } = await db
            .from('registros_viatura')
            .select('prefixo_vtr, condutor, apoio')
            .or(`condutor.ilike.%${agenteLogado.det_codigo}%,apoio.ilike.%${agenteLogado.det_codigo}%`)
            .eq('status', 'aberto')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (kmAberto) {
            ocSelectVtr.value    = kmAberto.prefixo_vtr;
            ocSelectVtr.disabled = true;

            const agenteSendoCondutor = verificaVinculoAgente(agenteLogado.det_codigo, kmAberto.condutor, '');
            if (agenteSendoCondutor) {
                ocSelectCondutor.value    = kmAberto.condutor || '';
                ocSelectCondutor.disabled = true;
                ocSelectApoio.value       = kmAberto.apoio || '';
                ocSelectApoio.disabled    = false;
            } else {
                ocSelectCondutor.value    = kmAberto.condutor || '';
                ocSelectCondutor.disabled = false;
                ocSelectApoio.value       = kmAberto.apoio || '';
                ocSelectApoio.disabled    = true;
            }
        } else {
            ocSelectVtr.disabled      = false;
            selecionarAgenteNoSelect(ocSelectCondutor, agenteLogado.det_codigo);
            ocSelectCondutor.disabled = true;
        }
    }
});

configurarAutocompleteSetor();
configurarAutocompleteReferenciaCruzamento();
if (ocSelectReferencia) {
    ocSelectReferencia.addEventListener('change', atualizarCamposReferenciaOcorrencia);
    atualizarCamposReferenciaOcorrencia();
}

window.voltarParaInicio = function () {
    [vtrSelectCondutor, vtrSelectApoio, ocSelectVtr, ocSelectCondutor].forEach(s => {
        if (s) s.disabled = false;
    });
    ocultarTodasTelas();
    telaInicial.classList.remove('hidden');
};

window.voltarParaOcorrencias = async function () {
    ocorrenciaAtual = null;

    const inputPesquisa = document.getElementById('input-pesquisa-ocorrencia');
    if (inputPesquisa) inputPesquisa.value = '';

    idSendoProcessado = null;
    btnAbrirOcorrencia.disabled = false;
    btnAbrirOcorrencia.textContent = '➤';

    [ocSelectVtr, ocSelectCondutor, ocSelectApoio].forEach(s => {
        if (s) s.disabled = false;
    });

    ocSelectVtr.value = '';
    ocSelectCondutor.value = '';
    ocSelectApoio.value = '';
    ocData.value = obterDataLocal();
    const agora = new Date();
    ocHora.value = agora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const form = document.getElementById('oc-form-fields');
    const btnToggle = document.getElementById('btn-toggle-form-oc');
    if (form && !form.classList.contains('hidden')) {
        form.classList.add('hidden');
        if (btnToggle) {
            btnToggle.textContent = '+ Nova Ocorrência';
            btnToggle.classList.remove('ativo');
        }
    }

    if (agenteLogado && agenteLogado.det_codigo) {
        const { data: kmAberto } = await db
            .from('registros_viatura')
            .select('prefixo_vtr, condutor, apoio')
            .or(`condutor.ilike.%${agenteLogado.det_codigo}%,apoio.ilike.%${agenteLogado.det_codigo}%`)
            .eq('status', 'aberto')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (kmAberto) {
            ocSelectVtr.value    = kmAberto.prefixo_vtr;
            ocSelectVtr.disabled = true;

            const agenteSendoCondutor = verificaVinculoAgente(agenteLogado.det_codigo, kmAberto.condutor, '');
            if (agenteSendoCondutor) {
                ocSelectCondutor.value    = kmAberto.condutor || '';
                ocSelectCondutor.disabled = true;
                ocSelectApoio.value       = kmAberto.apoio || '';
                ocSelectApoio.disabled    = false;
            } else {
                ocSelectCondutor.value    = kmAberto.condutor || '';
                ocSelectCondutor.disabled = false;
                ocSelectApoio.value       = kmAberto.apoio || '';
                ocSelectApoio.disabled    = true;
            }
        } else {
            ocSelectVtr.disabled = false;
            selecionarAgenteNoSelect(ocSelectCondutor, agenteLogado.det_codigo);
            ocSelectCondutor.disabled = true;
        }
    }

    ocultarTodasTelas();
    telaOcorrencia.classList.remove('hidden');

    carregarHistoricoOcorrencia(true);
    containerMensagensOc.scrollTop = containerMensagensOc.scrollHeight;
};

// ==========================================
// DEBOUNCE
// ==========================================
function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ==========================================
// PESQUISAS
// ==========================================
document.getElementById('input-pesquisa-viatura').addEventListener('input', debounce(async function (e) {
    const termo = e.target.value.trim();

    if (!termo) {
        vtrPagina = 0; vtrTodosCarregados = false; vtrCarregando = false;
        carregarHistoricoViatura(true);
        return;
    }

    containerMensagensVtr.innerHTML = '<div class="message system-msg">Pesquisando...</div>';

    const ag = agenteLogado?.det_codigo;

    let termoBusca = termo;
    const matchData = termo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchData) termoBusca = `${matchData[3]}-${matchData[2]}-${matchData[1]}`;
    const matchMesAno = termo.match(/^(\d{2})\/(\d{4})$/);
    if (matchMesAno) termoBusca = `${matchMesAno[2]}-${matchMesAno[1]}`;
    const matchDiaMes = termo.match(/^(\d{2})\/(\d{2})$/);
    if (matchDiaMes) termoBusca = `-${matchDiaMes[2]}-${matchDiaMes[1]}`;

    const orBusca = [
        `prefixo_vtr.ilike.%${termoBusca}%`,
        `condutor.ilike.%${termoBusca}%`,
        `apoio.ilike.%${termoBusca}%`,
        `status.ilike.%${termoBusca}%`
    ].join(',');

    const { data: resVtr, error: errVtr } = await db
        .from('registros_viatura')
        .select('*')
        .order('id', { ascending: false })
        .or(orBusca);

    containerMensagensVtr.innerHTML = '';

    if (errVtr) {
        console.error('Erro pesquisa viatura:', errVtr);
        containerMensagensVtr.innerHTML = '<div class="message system-msg">Erro na pesquisa.</div>';
        return;
    }

    let resultados = resVtr || [];
    if (ag) resultados = resultados.filter(r => r.condutor === ag || r.apoio === ag);

    if (resultados.length === 0) {
        let q2 = db.from('registros_viatura').select('*').order('id', { ascending: false });
        if (ag) q2 = q2.or(`condutor.ilike.%${ag}%,apoio.ilike.%${ag}%`);
        const { data: todos } = await q2;
        if (todos) {
            resultados = todos.filter(r => {
                const t = termoBusca.toLowerCase();
                return String(r.km_inicial || '').includes(t)
                    || String(r.km_final   || '').includes(t)
                    || String(r.data       || '').includes(t);
            });
        }
    }

    if (resultados.length === 0) {
        containerMensagensVtr.innerHTML = '<div class="message system-msg">Nenhum resultado encontrado.</div>';
        return;
    }

    [...resultados].reverse().forEach(r => renderizarMensagemVtr(r, r.id));
    containerMensagensVtr.scrollTop = containerMensagensVtr.scrollHeight;
}, 400));

document.getElementById('input-pesquisa-ocorrencia').addEventListener('input', debounce(async function (e) {
    const termo = e.target.value.trim();

    if (!termo) {
        ocPagina = 0; ocTodosCarregados = false; ocCarregando = false;
        carregarHistoricoOcorrencia(true);
        return;
    }

    containerMensagensOc.innerHTML = '<div class="message system-msg">Pesquisando...</div>';

    let termoBuscaOc = termo;
    const matchDataOc = termo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchDataOc) termoBuscaOc = `${matchDataOc[3]}-${matchDataOc[2]}-${matchDataOc[1]}`;
    const matchMesAnoOc = termo.match(/^(\d{2})\/(\d{4})$/);
    if (matchMesAnoOc) termoBuscaOc = `${matchMesAnoOc[2]}-${matchMesAnoOc[1]}`;
    const matchDiaMesOc = termo.match(/^(\d{2})\/(\d{2})$/);
    if (matchDiaMesOc) termoBuscaOc = `-${matchDiaMesOc[2]}-${matchDiaMesOc[1]}`;

    const orBuscaOc = [
        `numero_ocorrencia.ilike.%${termoBuscaOc}%`,
        `codigo_descricao.ilike.%${termoBuscaOc}%`,
        `id_viatura_vinculada.ilike.%${termoBuscaOc}%`,
        `condutor.ilike.%${termoBuscaOc}%`,
        `local.ilike.%${termoBuscaOc}%`,
        `apoio.ilike.%${termoBuscaOc}%`,
        `observacao.ilike.%${termoBuscaOc}%`,
        `status.ilike.%${termoBuscaOc}%`
    ].join(',');

    let query = db.from('ocorrencias')
        .select('*')
        .order('id', { ascending: false })
        .or(orBuscaOc);

    if (filtroOcorrenciaAtual === 'abertas') {
        query = query.eq('status', 'aberto');
    }

    const { data: resOc, error: errOc } = await query;
    containerMensagensOc.innerHTML = '';

    if (errOc) {
        console.error('Erro pesquisa ocorrência:', errOc);
        containerMensagensOc.innerHTML = '<div class="message system-msg">Erro na pesquisa.</div>';
        return;
    }

    let resultadosOc = filtrarOcorrenciasLocalmente(resOc || []);

    if (resultadosOc.length === 0) {
        let q2 = db.from('ocorrencias').select('*').order('id', { ascending: false });
        if (filtroOcorrenciaAtual === 'abertas') {
            q2 = q2.eq('status', 'aberto');
        }
        const { data: todos } = await q2;
        if (todos) {
            const termoNormalizado = normalizarBusca(termoBuscaOc);
            resultadosOc = filtrarOcorrenciasLocalmente(todos).filter(r =>
                [
                    r.data,
                    r.numero_ocorrencia,
                    r.codigo_descricao,
                    r.id_viatura_vinculada,
                    r.local,
                    r.condutor,
                    r.apoio,
                    r.observacao,
                    r.status,
                    ...(Array.isArray(r.agentes_adicionais) ? r.agentes_adicionais : [])
                ].some(valor => normalizarBusca(valor).includes(termoNormalizado))
            );
        }
    }

    if (resultadosOc.length === 0) {
        containerMensagensOc.innerHTML = '<div class="message system-msg">Nenhum resultado encontrado.</div>';
        return;
    }

    [...resultadosOc].reverse().forEach(r => renderizarMensagemOcorrencia(r, r.id));
    containerMensagensOc.scrollTop = containerMensagensOc.scrollHeight;
}, 400));

// ==========================================
// CARREGAR LISTAS (SELECTS)
// ==========================================
function bloquearOpcaoRepetida(origem, destino) {
    const valorSelecionado = origem.value;
    Array.from(destino.options).forEach(opt => {
        opt.disabled = (opt.value && opt.value === valorSelecionado);
    });
    if (destino.value === valorSelecionado) destino.value = '';
}

function getValorCampo(idSel, idInp) {
    const sel = document.getElementById(idSel);
    const inp = document.getElementById(idInp);
    if (!sel) return '';
    return (sel.value === 'Outros' || sel.value.toLowerCase().startsWith('outro')) ? (inp ? inp.value.trim() : '') : sel.value;
}

function normalizarTextoBase(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function isSemViatura(valor) {
    return normalizarTextoBase(valor) === 'sem viatura';
}

function atualizarCampoKmInicialViatura() {
    const prefixo = getValorCampo('vtr-select-vtr', 'vtr-input-vtr-outro');
    const semViatura = isSemViatura(prefixo);
    const rowKm = document.getElementById('row-vtr-km-inicial');
    if (rowKm) rowKm.classList.toggle('hidden', semViatura);
    if (semViatura && vtrKmInicial) vtrKmInicial.value = '';
}

async function carregarListas() {
    console.log("Carregando listas...");

    const [
        { data: vtrs,    error: errVtr    },
        { data: agentes, error: errAgente },
        { data: codigos, error: errCodigo },
        { data: setores, error: errSetor  }
    ] = await Promise.all([
        db.from('frota').select('*').order('prefixo', { ascending: true }),
        db.from('funcionarios').select('*').order('det_codigo', { ascending: true }),
        db.from('lista_codigos').select('*').order('id', { ascending: true }),
        carregarTodosSetores('id, nome'),
    ]);

    if (errVtr)    console.error("Erro ao carregar frota:", errVtr);
    if (errAgente) console.error("Erro ao carregar funcionários:", errAgente);
    if (errCodigo) console.error("Erro ao carregar lista_codigos:", errCodigo);
    if (errSetor)  console.error("Erro ao carregar lista_setores:", errSetor);

    const editPrefixo  = document.getElementById('edit-prefixo');
    const editCondutor = document.getElementById('edit-condutor');
    const editApoio    = document.getElementById('edit-apoio');

    const reset = (sel, label) => { if (sel) sel.innerHTML = `<option value="">${label}</option>`; };

    reset(vtrSelectVtr,      'Viatura...');
    reset(vtrSelectCondutor, 'Condutor...');
    reset(vtrSelectApoio,    'Apoio (opcional)...');
    reset(editPrefixo,       'Viatura...');
    reset(editCondutor,      'Condutor...');
    reset(editApoio,         'Apoio...');
    reset(ocSelectCodigo,    'Código...');
    reset(ocSelectVtr,       'Viatura...');
    reset(ocSelectCondutor,  'Condutor...');
    reset(ocSelectApoio,     'Apoio (opcional)...');
    if (ocSelectSetor) ocSelectSetor.value = '';
    ocultarSugestoesSetor();

    if (vtrs && !errVtr) {
        vtrs.forEach(vtr => {
            const prefixo = escapeHTML(vtr.prefixo);
            const html = `<option value="${prefixo}">${prefixo}</option>`;
            [vtrSelectVtr, ocSelectVtr, editPrefixo].forEach(s => s && s.insertAdjacentHTML('beforeend', html));
        });
        vtrs.forEach(vtr => {
            const sv = document.getElementById('oc-edit-viatura');
            const prefixo = escapeHTML(vtr.prefixo);
            if (sv) sv.insertAdjacentHTML('beforeend',
                `<option value="${prefixo}">${prefixo}</option>`);
        });
    }
    atualizarCampoKmInicialViatura();

    if (agentes && !errAgente) {
        agentes.forEach(ag => {
            const detCodigo = escapeHTML(ag.det_codigo);
            const html = `<option value="${detCodigo}">${detCodigo}</option>`;
            [vtrSelectCondutor, vtrSelectApoio, ocSelectCondutor, ocSelectApoio, editCondutor, editApoio]
                .forEach(s => s && s.insertAdjacentHTML('beforeend', html));
        });
        if (agenteLogado) {
            definirFuncaoAgente(agenteLogado.pref_funcao || 'condutor');
        }
        agentes.forEach(ag => {
            const detCodigo = escapeHTML(ag.det_codigo);
            const html = `<option value="${detCodigo}">${detCodigo}</option>`;
            ['oc-edit-condutor','oc-edit-apoio'].forEach(id => {
                const s = document.getElementById(id);
                if (s) s.insertAdjacentHTML('beforeend', html);
            });
        });
    }

    if (codigos && !errCodigo) {
        console.log(`✅ lista_codigos carregada: ${codigos.length} registros`, codigos);
        codigos.forEach(c =>
            ocSelectCodigo.insertAdjacentHTML('beforeend',
                `<option value="${escapeHTML(c.descricao)}">${escapeHTML(c.descricao)}</option>`)
        );
    } else {
        console.error('❌ Falha lista_codigos — erro:', errCodigo, '| dados:', codigos);
        mostrarNotificacao('erro-ocorrencia', '⚠️ Não foi possível carregar a lista de códigos.');
    }

    if (setores && !errSetor) {
        console.log(`✅ lista_setores carregada: ${setores.length} registros`, setores);
        definirListaSetoresOcorrencia(setores);

        setores.forEach(s => {
            const nome = escapeHTML(s.nome);
            const html = `<option value="${nome}">${nome}</option>`;
            const ss = document.getElementById('oc-edit-setor');
            if (ss) ss.insertAdjacentHTML('beforeend', `<option value="${nome}">${nome}</option>`);
            const ssRef = document.getElementById('oc-edit-referencia-cruzamento');
            if (ssRef) ssRef.insertAdjacentHTML('beforeend', `<option value="${nome}">${nome}</option>`);
            const ss2 = document.getElementById('edit-setor');
            if (ss2) ss2.insertAdjacentHTML('beforeend', `<option value="${nome}">${nome}</option>`);
        });
    } else {
        console.error('❌ Falha lista_setores — erro:', errSetor, '| dados:', setores);
        mostrarNotificacao('erro-ocorrencia', '⚠️ Não foi possível carregar a lista de locais.');
    }

    if (codigos && !errCodigo) {
        codigos.forEach(c => {
            const se = document.getElementById('oc-edit-codigo');
            if (se) se.insertAdjacentHTML('beforeend',
                `<option value="${escapeHTML(c.descricao)}">${escapeHTML(c.descricao)}</option>`);
        });
    }

    const pares = [
        ['vtr-select-vtr',      'vtr-input-vtr-outro',       'row-vtr-outro'],
        ['vtr-select-condutor', 'vtr-input-condutor-outro',   'row-condutor-outro'],
        ['vtr-select-apoio',    'vtr-input-apoio-outro',      'row-apoio-outro'],
        ['oc-select-codigo',    'oc-input-codigo-outro',      'oc-row-codigo-outro'],
        ['oc-select-vtr',       'oc-input-vtr-outro',         'oc-row-vtr-outro'],
        ['oc-select-condutor',  'oc-input-condutor-outro',    'oc-row-condutor-outro'],
        ['oc-select-apoio',     'oc-input-apoio-outro',       'oc-row-apoio-outro'],
        ['edit-prefixo',        'edit-prefixo-outro',         null],
        ['edit-condutor',       'edit-condutor-outro',        null],
        ['edit-apoio',          'edit-apoio-outro',           null],
    ];

    pares.forEach(([idSel, idInp, idRow]) => {
        const select  = document.getElementById(idSel);
        const input   = document.getElementById(idInp);
        const wrapper = idRow ? document.getElementById(idRow) : null;
        if (!select || !input) return;

        select.addEventListener('change', function () {
            const mostrar = this.value === 'Outros' || this.value.toLowerCase().startsWith('outro');
            if (wrapper) wrapper.classList.toggle('hidden', !mostrar);
            else         input.classList.toggle('hidden', !mostrar);
            if (mostrar) input.focus();
            else         input.value = '';
            if (idSel === 'vtr-select-vtr') atualizarCampoKmInicialViatura();
        });
    });

    document.getElementById('vtr-input-vtr-outro')?.addEventListener('input', atualizarCampoKmInicialViatura);

    document.getElementById('edit-prefixo')?.addEventListener('change', function () {
        const prefixo = getValorCampo('edit-prefixo', 'edit-prefixo-outro');
        const semViatura = isSemViatura(prefixo);
        const rowKm = document.getElementById('row-edit-km-inicial');
        if (rowKm) rowKm.classList.toggle('hidden', semViatura);
        if (semViatura) document.getElementById('edit-km').value = '';
    });

    console.log("Listas carregadas!");

    const paresBloqueio = [
        [vtrSelectCondutor, vtrSelectApoio],
        [ocSelectCondutor,  ocSelectApoio],
    ];

    paresBloqueio.forEach(([selA, selB]) => {
        if (!selA || !selB) return;
        selA.addEventListener('change', () => bloquearOpcaoRepetida(selA, selB));
        selB.addEventListener('change', () => bloquearOpcaoRepetida(selB, selA));
    });
}

async function carregarCodigosESetores() {
    const jaTemCodigos = ocSelectCodigo.options.length > 1;
    const jaTemSetores = listaSetoresOcorrencia.length > 0;
    if (jaTemCodigos && jaTemSetores) return;

    console.log('🔄 Recarregando códigos e setores...');

    const [
        { data: codigos, error: errCodigo },
        { data: setores, error: errSetor  }
    ] = await Promise.all([
        db.from('lista_codigos').select('id, descricao').order('id', { ascending: true }),
        carregarTodosSetores('id, nome'),
    ]);

    if (errCodigo) console.error('❌ lista_codigos:', errCodigo);
    if (errSetor)  console.error('❌ lista_setores:', errSetor);

    if (codigos && !errCodigo && ocSelectCodigo.options.length <= 1) {
        console.log(`✅ Códigos carregados: ${codigos.length}`);
        codigos.forEach(c =>
            ocSelectCodigo.insertAdjacentHTML('beforeend',
                `<option value="${escapeHTML(c.descricao)}">${escapeHTML(c.descricao)}</option>`)
        );
    } else if (errCodigo) {
        mostrarNotificacao('erro-ocorrencia', '⚠️ Erro ao carregar códigos: ' + errCodigo.message);
    }

    if (setores && !errSetor && listaSetoresOcorrencia.length === 0) {
        console.log(`✅ Setores carregados: ${setores.length}`);
        definirListaSetoresOcorrencia(setores);
    } else if (errSetor) {
        mostrarNotificacao('erro-ocorrencia', '⚠️ Erro ao carregar locais: ' + errSetor.message);
    }
}

// ==========================================
// FECHAR MODAL (genérico)
// ==========================================
window.fecharModal = function (idModal) {
    document.getElementById(idModal)?.classList.add('hidden');
    if (idModal === 'modal-editar') {
        ['edit-condutor', 'edit-apoio'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = false;
        });
    }
};

// ==========================================
// CONFIGURAÇÕES / PREFERÊNCIAS
// ==========================================
const btnConfig      = document.getElementById('btn-config');
const btnSalvarPref  = document.getElementById('btn-salvar-pref');
const prefVtrSelect  = document.getElementById('pref_vtr');
const prefFuncaoSelect = document.getElementById('pref_funcao');

if (btnConfig) {
    btnConfig.addEventListener('click', () =>
        document.getElementById('modal-config').classList.remove('hidden'));
}

window.abrirPreferencias = function () {
    fecharModal('modal-config');
    prefVtrSelect.innerHTML = vtrSelectVtr.innerHTML;
    if (agenteLogado) {
        prefVtrSelect.value    = agenteLogado.pref_vtr    || '';
        prefFuncaoSelect.value = agenteLogado.pref_funcao || '';
        const outroPref = prefVtrSelect.querySelector('option[value="outro"]');
        if (outroPref) outroPref.remove();
    }
    document.getElementById('modal-preferencias').classList.remove('hidden');
};

if (btnSalvarPref) {
    btnSalvarPref.addEventListener('click', async () => {
        const { data: { user } } = await db.auth.getUser();
        const dados = { pref_vtr: prefVtrSelect.value, pref_funcao: prefFuncaoSelect.value };
        const { error } = await db.from('funcionarios').update(dados).eq('user_id', user.id);
        if (error) {
            mostrarNotificacao('erro-viatura', '❌ Erro ao salvar preferências.');
        } else {
            if (agenteLogado) { agenteLogado.pref_vtr = dados.pref_vtr; agenteLogado.pref_funcao = dados.pref_funcao; }
            fecharModal('modal-preferencias');
            mostrarNotificacao('erro-viatura', '✅ Preferências salvas!', true);
        }
    });
}

window.abrirTrocarSenha = function () {
    fecharModal('modal-config');
    if (!document.getElementById('modal-trocar-senha')) {
        const html = `
        <div id="modal-trocar-senha" class="modal-overlay">
            <div class="modal-card">
                <h3>Alterar Senha</h3>
                <div id="erro-trocar-senha" class="erro-inline hidden"></div>
                <div class="modal-body">
                    <label>Nova Senha:</label>
                    <input type="password" id="nova-senha" placeholder="Mínimo 6 caracteres">
                    <label>Confirmar Nova Senha:</label>
                    <input type="password" id="confirmar-nova-senha" placeholder="Repita a senha">
                </div>
                <div class="modal-footer">
                    <button class="btn-cancelar" onclick="fecharModal('modal-trocar-senha')">Cancelar</button>
                    <button class="btn-salvar" id="btn-confirmar-trocar-senha">Salvar Senha</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('btn-confirmar-trocar-senha').addEventListener('click', async () => {
            const nova      = document.getElementById('nova-senha').value;
            const confirmar = document.getElementById('confirmar-nova-senha').value;
            if (!nova || nova.length < 6) return mostrarNotificacao('erro-trocar-senha', '⚠️ Mínimo 6 caracteres.');
            if (nova !== confirmar)        return mostrarNotificacao('erro-trocar-senha', '⚠️ Senhas não coincidem.');
            const { error } = await db.auth.updateUser({ password: nova });
            if (error) mostrarNotificacao('erro-trocar-senha', '❌ Erro: ' + error.message);
            else {
                fecharModal('modal-trocar-senha');
                mostrarNotificacao('erro-viatura', '✅ Senha alterada!', true);
            }
        });
    }
    document.getElementById('modal-trocar-senha').classList.remove('hidden');
};

// ==========================================
// TEMA CLARO / ESCURO
// ==========================================
function aplicarTema(tema) {
    if (tema === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

window.toggleTema = function () {
    const isLight = document.body.classList.contains('light-theme');
    const novoTema = isLight ? 'dark' : 'light';
    aplicarTema(novoTema);
    localStorage.setItem('temaPreferencia', novoTema);
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
const temaSalvo = localStorage.getItem('temaPreferencia') || 'dark';
aplicarTema(temaSalvo);
