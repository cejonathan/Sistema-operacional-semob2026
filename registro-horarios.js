// ==========================================
// REGISTRO DE HORÁRIOS
// ==========================================
const REG_HORARIOS_TABLE = 'registro_horarios';
const REG_CONFIG_TABLE = 'registro_folha_config';

const REG_TURNOS = {
    mensal: { label: 'Mensal' },
    especifico: { label: 'Especifico' },
    folga: { label: 'Folga' },
    abonada: { label: 'Abonada' },
    atestado: { label: 'Atestado' },
    manha: { label: 'Manha' },
    diurno: { label: 'Diurno' },
    tarde_noite: { label: 'Tarde/Noite' },
    manual: { label: 'Manual' }
};

const REG_CONFIG_PADRAO = {
    salario_base: 3109.22,
    periculosidade: 932.77,
    adicional_tempo_servico: 0,
    ipmj_percentual: 14,
    dependentes: 0,
    pensao: 0,
    dias_previstos: 22
};

const REG_IRRF_2026 = [
    { limite: 2428.80, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 182.16 },
    { limite: 3751.05, aliquota: 0.15, deducao: 394.16 },
    { limite: 4664.68, aliquota: 0.225, deducao: 675.49 },
    { limite: Infinity, aliquota: 0.275, deducao: 908.73 }
];

const REG_DEDUCAO_DEPENDENTE = 189.59;
const REG_DESCONTO_SIMPLIFICADO = 607.20;
const REG_REDUCAO_LEI_15270_ZERO = 312.89;
const REG_REDUCAO_LEI_15270_INTERCEPTO = 978.62;
const REG_REDUCAO_LEI_15270_COEF = 0.133145;

let regHistorico = [];
let regConfig = Object.assign({}, REG_CONFIG_PADRAO);
let regUsandoLocalStorage = false;

function regEl(id) {
    return document.getElementById(id);
}

function regHojeISO() {
    return typeof obterDataLocal === 'function' ? obterDataLocal() : new Date().toISOString().slice(0, 10);
}

function regMesAtual() {
    return regHojeISO().slice(0, 7);
}

function regLabelMes(valorMes) {
    const [ano, mes] = String(valorMes || regMesAtual()).split('-').map(Number);
    const data = new Date(ano, mes - 1, 1);
    const nomeMes = data.toLocaleDateString('pt-BR', { month: 'long' });
    return `${nomeMes} - ${ano}`;
}

function regPopularSelectMes(idSelect, valorAtual = regMesAtual()) {
    const select = regEl(idSelect);
    if (!select) return;
    const ano = Number(String(valorAtual || regMesAtual()).split('-')[0]) || new Date().getFullYear();
    const opcoes = Array.from({ length: 12 }, (_, index) =>
        `${ano}-${String(index + 1).padStart(2, '0')}`
    );

    select.innerHTML = opcoes.map(valor =>
        `<option value="${valor}">${regEscape(regLabelMes(valor))}</option>`
    ).join('');
    select.value = valorAtual;
}

function regAgentePadrao() {
    return agenteLogado?.det_codigo || '';
}

function regMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function regHoras(valor) {
    const totalMinutos = Math.round(Number(valor || 0) * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.abs(totalMinutos % 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function regHoraCurta(valor) {
    return String(valor || '--:--').slice(0, 5);
}

function regNumero(id) {
    return Number(String(regEl(id)?.value || '0').replace(',', '.')) || 0;
}

function regEscape(valor) {
    if (typeof escapeHTML === 'function') return escapeHTML(valor);
    return String(valor || '').replace(/[&<>"']/g, s => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[s]));
}

function regStorageKey(tipo) {
    const userId = agenteLogado?.user_id || 'anonimo';
    return `registro_horarios_${tipo}_${userId}`;
}

function regLerLocal(tipo, fallback) {
    try {
        return JSON.parse(localStorage.getItem(regStorageKey(tipo))) || fallback;
    } catch (_) {
        return fallback;
    }
}

function regSalvarLocal(tipo, valor) {
    localStorage.setItem(regStorageKey(tipo), JSON.stringify(valor));
}

function regMinutos(hora) {
    const [h, m] = String(hora || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

function regCalcularHoras(entrada, saida, intervaloMinutos) {
    if (!entrada || !saida) return 0;
    let total = regMinutos(saida) - regMinutos(entrada);
    if (total < 0) total += 24 * 60;
    total -= Number(intervaloMinutos || 0);
    return Math.max(0, total / 60);
}

function regAtualizarCamposFormulario() {
    const editando = Boolean(regEl('reg-edit-id')?.value);
    regEl('reg-row-mes')?.classList.toggle('hidden', editando);
    regEl('reg-row-data-edicao')?.classList.toggle('hidden', !editando);
    regEl('reg-row-horario-especifico')?.classList.remove('hidden');
    if (!regEl('reg-entrada').value) regEl('reg-entrada').value = '06:00';
    if (!regEl('reg-saida').value) regEl('reg-saida').value = '15:00';
    regEl('reg-intervalo').value = 60;
    regEl('reg-row-observacao')?.classList.toggle('hidden', !editando);
    regRenderizarPreviewMes();
}

function regCalcularHorasFormulario(tipoData, tipoHorario, entrada, saida, intervalo) {
    return regCalcularHoras(entrada, saida, intervalo);
}

function regPeriodoLabel(item) {
    if (!item.data) return '-';
    const data = new Date(`${item.data}T00:00:00`);
    const dia = data.getDate();
    const semana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${dia} - ${semana}`;
}

function regDatasDoMes(mes) {
    const [ano, mesNumero] = String(mes || regMesAtual()).split('-').map(Number);
    const ultimoDia = new Date(ano, mesNumero, 0).getDate();
    return Array.from({ length: ultimoDia }, (_, index) => {
        const dia = String(index + 1).padStart(2, '0');
        return `${ano}-${String(mesNumero).padStart(2, '0')}-${dia}`;
    });
}

function regStatusPadraoData(data) {
    const diaSemana = new Date(`${data}T00:00:00`).getDay();
    return diaSemana === 0 || diaSemana === 6 ? 'folga' : 'trabalho';
}

function regDataFormatadaComSemana(data) {
    const dt = new Date(`${data}T00:00:00`);
    const semana = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return `${dt.toLocaleDateString('pt-BR')} - ${semana}`;
}

function regRenderizarPreviewMes() {
    const container = regEl('reg-preview-mes');
    if (!container) return;
    if (regEl('reg-edit-id')?.value) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    const mes = regEl('reg-data-mes')?.value || regEl('reg-mes')?.value || regMesAtual();
    const datas = regDatasDoMes(mes);
    container.innerHTML = datas.map(data => `
        <label class="registro-preview-dia">
            <span>${regEscape(regDataFormatadaComSemana(data))}</span>
            <select class="reg-dia-status" data-data="${regEscape(data)}">
                <option value="trabalho"${regStatusPadraoData(data) === 'trabalho' ? ' selected' : ''}>Trabalho</option>
                <option value="folga"${regStatusPadraoData(data) === 'folga' ? ' selected' : ''}>Folga</option>
                <option value="abonada">Abonada</option>
                <option value="atestado">Atestado</option>
            </select>
        </label>
    `).join('');
}

function regDataJaExiste(data, idIgnorado = '') {
    return regHistorico.some(item =>
        String(item.data) === String(data) && String(item.id) !== String(idIgnorado)
    );
}

function regStatusPorData() {
    return Array.from(document.querySelectorAll('.reg-dia-status')).map(select => ({
        data: select.dataset.data,
        status: select.value
    }));
}

function regCalcularIpmj(bruto, config) {
    const remuneracaoIpmj = Number(config.salario_base || 0) + Number(config.adicional_tempo_servico || 0);
    const remuneracaoTotal = Number(config.salario_base || 0)
        + Number(config.periculosidade || 0)
        + Number(config.adicional_tempo_servico || 0);
    const proporcao = remuneracaoTotal > 0 ? Math.min(1, bruto / remuneracaoTotal) : 0;
    return remuneracaoIpmj * proporcao * (Number(config.ipmj_percentual || 0) / 100);
}

function regIrrfTabela(base) {
    const faixa = REG_IRRF_2026.find(item => base <= item.limite) || REG_IRRF_2026[0];
    return Math.max(0, (base * faixa.aliquota) - faixa.deducao);
}

function regReducaoLei15270(irTabela, rendimentoTributavel) {
    if (rendimentoTributavel <= 5000) {
        return Math.min(irTabela, REG_REDUCAO_LEI_15270_ZERO);
    }
    if (rendimentoTributavel <= 7350) {
        const reducao = REG_REDUCAO_LEI_15270_INTERCEPTO - (REG_REDUCAO_LEI_15270_COEF * rendimentoTributavel);
        return Math.min(irTabela, Math.max(0, reducao));
    }
    return 0;
}

function regCalcularImposto(bruto, config) {
    const ipmj = regCalcularIpmj(bruto, config);
    const deducoesLegais = ipmj
        + (Number(config.dependentes || 0) * REG_DEDUCAO_DEPENDENTE)
        + Number(config.pensao || 0);
    const deducaoUsada = Math.max(deducoesLegais, REG_DESCONTO_SIMPLIFICADO);
    const baseIr = Math.max(0, bruto - deducaoUsada);
    const irTabela = regIrrfTabela(baseIr);
    const reducao = regReducaoLei15270(irTabela, bruto);
    const ir = Math.max(0, irTabela - reducao);

    return {
        bruto,
        ipmj,
        baseIr,
        irTabela,
        reducao,
        ir,
        liquido: bruto - ipmj - ir,
        deducaoUsada,
        usaSimplificado: REG_DESCONTO_SIMPLIFICADO > deducoesLegais
    };
}

function regConfigNormalizada(config = regConfig) {
    return Object.assign({}, REG_CONFIG_PADRAO, config);
}

function regHorasPrevistas(config = regConfig) {
    const mes = regEl('reg-mes')?.value || regMesAtual();
    const diasTrabalho = regHistorico.filter(item =>
        String(item.data || '').startsWith(mes)
        && item.agente === regAgentePadrao()
        && !['folga', 'abonada', 'atestado'].includes(item.equipe)
    ).length;
    const diasBase = diasTrabalho || regDatasDoMes(mes).filter(data => regStatusPadraoData(data) === 'trabalho').length;
    return Math.max(0, diasBase * 8);
}

function regRemuneracaoMensal(config = regConfig) {
    return Number(config.salario_base || 0)
        + Number(config.periculosidade || 0)
        + Number(config.adicional_tempo_servico || 0);
}

function regValorHora(config = regConfig) {
    const horasPrevistas = regHorasPrevistas(config);
    return horasPrevistas > 0 ? regRemuneracaoMensal(config) / horasPrevistas : 0;
}

function regValorHoraSalarioBase(config = regConfig) {
    const horasPrevistas = regHorasPrevistas(config);
    return horasPrevistas > 0 ? Number(config.salario_base || 0) / horasPrevistas : 0;
}

function regFiltrarHistorico() {
    const mes = regEl('reg-mes')?.value || regMesAtual();
    const agenteFiltro = regAgentePadrao();
    return regHistorico.filter(item => {
        const mesmoMes = String(item.data || '').startsWith(mes);
        const mesmoAgente = !agenteFiltro || item.agente === agenteFiltro;
        return mesmoMes && mesmoAgente;
    });
}

function regEhFimDeSemana(data) {
    const diaSemana = new Date(`${data}T00:00:00`).getDay();
    return diaSemana === 0 || diaSemana === 6;
}

function regCalcularCategoriasHoras(registros, valorHora) {
    return registros.reduce((totais, item) => {
        const horas = Number(item.horas_liquidas || 0);
        if (horas <= 0) return totais;
        const horasNoturnas = regCalcularHorasNoturnas(item.entrada, item.saida);
        totais.extras25Horas += horasNoturnas;
        totais.extras25Valor += horasNoturnas * valorHora * 0.25;

        if (regEhFimDeSemana(item.data)) {
            totais.extras100Dias += 1;
            totais.extras100Horas += horas;
            totais.extras100Valor += horas * valorHora * 2;
            return totais;
        }

        const normais = Math.min(8, horas);
        const extras50 = Math.max(0, horas - 8);
        if (normais > 0) {
            totais.normaisDias += 1;
            totais.normaisHoras += normais;
            totais.normaisValor += normais * valorHora;
        }
        if (extras50 > 0) {
            totais.extras50Dias += 1;
        }
        totais.extras50Horas += extras50;
        totais.extras50Valor += extras50 * valorHora * 1.5;
        return totais;
    }, {
        normaisDias: 0,
        normaisHoras: 0,
        normaisValor: 0,
        extras25Dias: 0,
        extras25Horas: 0,
        extras25Valor: 0,
        extras50Dias: 0,
        extras50Horas: 0,
        extras50Valor: 0,
        extras100Dias: 0,
        extras100Horas: 0,
        extras100Valor: 0
    });
}

function regRegistroAusente(item) {
    return ['folga', 'abonada', 'atestado'].includes(item.equipe);
}

function regCalcularHorasNoturnas(entrada, saida) {
    if (!entrada || !saida) return 0;
    let inicio = regMinutos(entrada);
    let fim = regMinutos(saida);
    if (fim <= inicio) fim += 24 * 60;

    let minutos = 0;
    for (let cursor = inicio; cursor < fim; cursor += 15) {
        const minutoDia = cursor % (24 * 60);
        if (minutoDia >= 22 * 60 || minutoDia < 5 * 60) {
            minutos += Math.min(15, fim - cursor);
        }
    }
    return minutos / 60;
}

function regResumoHorasValor(horas, valor) {
    return `${regHoras(horas)}<br>${regMoeda(valor)}`;
}

function regResumoDiasHorasValor(dias, horas, valor) {
    const rotuloDias = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    return `${rotuloDias}<br>${regHoras(horas)}<br>${regMoeda(valor)}`;
}

function regResumo() {
    const registros = regFiltrarHistorico();
    const valorHora = regValorHoraSalarioBase();
    const categorias = regCalcularCategoriasHoras(registros, valorHora);
    const horasLancadas = categorias.normaisHoras + categorias.extras25Horas + categorias.extras50Horas + categorias.extras100Horas;
    const ganhoLancado = categorias.normaisValor + categorias.extras25Valor + categorias.extras50Valor + categorias.extras100Valor;
    const horasPrevistas = regHorasPrevistas();
    const brutoProjetado = horasPrevistas > 0
        ? Math.max(ganhoLancado, regRemuneracaoMensal() * Math.min(1, horasLancadas / horasPrevistas))
        : ganhoLancado;
    const impostoLancado = regCalcularImposto(ganhoLancado, regConfig);
    const impostoProjetado = regCalcularImposto(regRemuneracaoMensal(), regConfig);

    let horasSemIr = 0;
    for (let h = horasLancadas; h <= Math.max(horasLancadas, horasPrevistas + 80); h += 0.25) {
        const brutoTeste = h * valorHora;
        if (regCalcularImposto(brutoTeste, regConfig).ir <= 0.009) horasSemIr = Math.max(0, h - horasLancadas);
        else break;
    }

    return {
        registros,
        valorHora,
        horasLancadas,
        ganhoLancado,
        categorias,
        brutoProjetado,
        impostoLancado,
        impostoProjetado,
        horasSemIr
    };
}

function regAtualizarResumo() {
    const resumo = regResumo();
    regEl('reg-resumo-horas-normais').innerHTML = regResumoDiasHorasValor(resumo.categorias.normaisDias, resumo.categorias.normaisHoras, resumo.categorias.normaisValor);
    regEl('reg-resumo-extras-25').innerHTML = regResumoHorasValor(resumo.categorias.extras25Horas, resumo.categorias.extras25Valor);
    regEl('reg-resumo-extras-50').innerHTML = regResumoDiasHorasValor(resumo.categorias.extras50Dias, resumo.categorias.extras50Horas, resumo.categorias.extras50Valor);
    regEl('reg-resumo-extras-100').innerHTML = regResumoDiasHorasValor(resumo.categorias.extras100Dias, resumo.categorias.extras100Horas, resumo.categorias.extras100Valor);
    regEl('reg-resumo-bruto-liquido').innerHTML = `${regMoeda(resumo.ganhoLancado)}<br>${regMoeda(resumo.impostoLancado.liquido)}`;
    regEl('reg-resumo-descontos').innerHTML = `${regMoeda(resumo.impostoLancado.ipmj)}<br>${regMoeda(resumo.impostoLancado.ir)}`;
    regEl('reg-resumo-horas-livres').textContent = regHoras(resumo.horasSemIr);

    const alerta = regEl('reg-resumo-alerta');
    if (!alerta) return;
    const deducao = resumo.impostoLancado.usaSimplificado ? 'desconto simplificado' : 'deduções legais';
    const maisOito = regCalcularImposto(resumo.ganhoLancado + (8 * resumo.valorHora), regConfig);
    const descontoExtra = (maisOito.ipmj + maisOito.ir) - (resumo.impostoLancado.ipmj + resumo.impostoLancado.ir);
    const liquidoExtra = (8 * resumo.valorHora) - descontoExtra;
    alerta.textContent = `Valor/hora ${regMoeda(resumo.valorHora)}. Projecao do mes completo: bruto ${regMoeda(regRemuneracaoMensal())}, IR ${regMoeda(resumo.impostoProjetado.ir)}. Mais 8h renderiam liquido estimado de ${regMoeda(liquidoExtra)}. Calculo usando ${deducao}.`;
}

function regHtmlLinhaTabela(item) {
    const valorDia = regCalcularCategoriasHoras([item], regValorHoraSalarioBase());
    const valorTotalDia = valorDia.normaisValor + valorDia.extras25Valor + valorDia.extras50Valor + valorDia.extras100Valor;
    const dataFmt = regPeriodoLabel(item);
    const id = regEscape(item.id);
    const ausente = regRegistroAusente(item);
    const horario = ausente ? '00:00 - 00:00' : `${regHoraCurta(item.entrada)} - ${regHoraCurta(item.saida)}`;
    const intervalo = ausente ? 0 : Number(item.intervalo_minutos || 0);

    return `
        <tr data-reg-id="${id}">
            <td>${dataFmt}</td>
            <td>${regEscape(horario)}</td>
            <td>${intervalo} min</td>
            <td>${regHoras(item.horas_liquidas)}</td>
            <td>${regMoeda(valorTotalDia)}</td>
            <td class="registro-obs">${regEscape(item.observacao || '')}</td>
            <td class="registro-acoes">
                <button class="btn-action" onclick="editarRegistroHorarios('${id}')">Editar</button>
            </td>
        </tr>
    `;
}

function regRenderizarHistorico() {
    const container = regEl('container-msgs-registro-horarios');
    if (!container) return;
    const registros = regResumo().registros.sort((a, b) => String(a.data).localeCompare(String(b.data)));
    if (!registros.length) {
        container.innerHTML = '<div class="message system-msg">Nenhum horário registrado para este mês.</div>';
    } else {
        container.innerHTML = `
            <div class="registro-tabela-wrap">
                <table class="registro-tabela">
                    <thead>
                        <tr>
                            <th>Período</th>
                            <th>Horário</th>
                            <th>Intervalo</th>
                            <th>Horas</th>
                            <th>Ganho</th>
                            <th>Obs.</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registros.map(regHtmlLinhaTabela).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    container.scrollTop = 0;
    regAtualizarResumo();
}

async function regCarregarConfig() {
    regConfig = regConfigNormalizada(regLerLocal('config', REG_CONFIG_PADRAO));
    regUsandoLocalStorage = false;

    if (!agenteLogado?.user_id) return;

    try {
        const { data, error } = await db.from(REG_CONFIG_TABLE)
            .select('*')
            .eq('criado_por', agenteLogado.user_id)
            .maybeSingle();
        if (error) throw error;
        if (data) {
            regConfig = regConfigNormalizada(data);
            regSalvarLocal('config', regConfig);
        }
    } catch (error) {
        regUsandoLocalStorage = true;
        console.warn('Usando configuracao local de horários:', error);
    }
}

async function regCarregarHistorico() {
    const mes = regEl('reg-mes')?.value || regMesAtual();
    const inicio = `${mes}-01`;
    const fim = `${mes}-31`;
    regHistorico = regLerLocal('historico', []);

    if (!agenteLogado?.user_id) {
        regRenderizarHistorico();
        return;
    }

    try {
        const { data, error } = await db.from(REG_HORARIOS_TABLE)
            .select('*')
            .eq('criado_por', agenteLogado.user_id)
            .gte('data', inicio)
            .lte('data', fim)
            .order('data', { ascending: true });
        if (error) throw error;
        regHistorico = data || [];
        regUsandoLocalStorage = false;
    } catch (error) {
        regUsandoLocalStorage = true;
        console.warn('Usando historico local de horários:', error);
    }

    regRenderizarHistorico();
}

async function abrirTelaRegistroHorarios() {
    ocultarTodasTelas();
    telaRegistroHorarios.classList.remove('hidden');
    if (!regEl('reg-mes').value) regPopularSelectMes('reg-mes', regMesAtual());
    await regCarregarConfig();
    await regCarregarHistorico();
    if (regUsandoLocalStorage) {
        mostrarNotificacao('erro-registro-horarios', 'Banco ainda nao configurado. Salvando localmente neste navegador.', true);
    }
}

window.abrirFormRegistroHorarios = function () {
    regEl('reg-modal-titulo').textContent = 'Novo Horário';
    regEl('reg-edit-id').value = '';
    regEl('reg-data-edicao').value = '';
    regEl('reg-observacao').value = '';
    regPopularSelectMes('reg-data-mes', regEl('reg-mes')?.value || regMesAtual());
    regAtualizarCamposFormulario();
    regEl('modal-registro-horario').classList.remove('hidden');
};

window.fecharModalRegistroHorarios = function () {
    regEl('modal-registro-horario').classList.add('hidden');
};

window.abrirConfigRegistroHorarios = function () {
    const config = regConfigNormalizada();
    regEl('reg-conf-salario').value = config.salario_base;
    regEl('reg-conf-periculosidade').value = config.periculosidade;
    regEl('reg-conf-tempo-servico').value = config.adicional_tempo_servico;
    regEl('reg-conf-ipmj').value = config.ipmj_percentual;
    regEl('modal-registro-config').classList.remove('hidden');
};

window.fecharModalRegistroConfig = function () {
    regEl('modal-registro-config').classList.add('hidden');
};

window.salvarConfigRegistroHorarios = async function () {
    const dados = regConfigNormalizada({
        salario_base: regNumero('reg-conf-salario'),
        periculosidade: regNumero('reg-conf-periculosidade'),
        adicional_tempo_servico: regNumero('reg-conf-tempo-servico'),
        ipmj_percentual: regNumero('reg-conf-ipmj'),
        dependentes: Number(regConfig.dependentes || 0),
        pensao: Number(regConfig.pensao || 0),
        dias_previstos: Number(regConfig.dias_previstos || REG_CONFIG_PADRAO.dias_previstos),
        criado_por: agenteLogado?.user_id || null,
        agente: regAgentePadrao()
    });

    regConfig = dados;
    regSalvarLocal('config', dados);

    if (agenteLogado?.user_id) {
        try {
            const { error } = await db.from(REG_CONFIG_TABLE)
                .upsert([dados], { onConflict: 'criado_por' });
            if (error) throw error;
            regUsandoLocalStorage = false;
        } catch (error) {
            regUsandoLocalStorage = true;
            console.warn('Configuracao salva apenas localmente:', error);
        }
    }

    fecharModalRegistroConfig();
    regRenderizarHistorico();
    mostrarNotificacao('erro-registro-horarios', 'Configuracao salva.', true);
};

window.salvarRegistroHorarios = async function () {
    const agente = regAgentePadrao();
    const tipoData = 'mes';
    const tipoHorario = 'mensal';
    const entrada = regEl('reg-entrada').value;
    const saida = regEl('reg-saida').value;
    const intervalo = 60;
    const idEdicao = regEl('reg-edit-id').value;
    const mesSelecionado = tipoData === 'mes'
        ? (regEl('reg-data-mes').value || regEl('reg-mes').value || regMesAtual())
        : regMesAtual();

    if (regEl('reg-mes')?.value !== mesSelecionado) {
        regEl('reg-mes').value = mesSelecionado;
        await regCarregarHistorico();
    }

    const diasSelecionados = idEdicao
        ? [{ data: regEl('reg-data-edicao')?.value || regHojeISO(), status: 'trabalho' }]
        : regStatusPorData();

    if (!agente || !diasSelecionados.length || !entrada || !saida) {
        mostrarNotificacao('erro-modal-registro-horario', 'Preencha a data e o horário.');
        return;
    }

    const diasNovos = diasSelecionados.filter(dia => !regDataJaExiste(dia.data, idEdicao));
    const datasPuladas = diasSelecionados.length - diasNovos.length;
    if (!diasNovos.length) {
        mostrarNotificacao('erro-modal-registro-horario', 'Todas as datas selecionadas ja foram lancadas.');
        return;
    }

    const criarDados = ({ data, status }) => {
        const ausente = status !== 'trabalho';
        const labelStatus = status === 'trabalho' ? '' : (REG_TURNOS[status]?.label || status);
        const observacaoEditada = idEdicao ? regEl('reg-observacao').value.trim() : '';
        return {
        agente,
        data,
        equipe: ausente ? status : tipoHorario,
        entrada: ausente ? '00:00' : entrada,
        saida: ausente ? '00:00' : saida,
        intervalo_minutos: intervalo,
        horas_liquidas: ausente ? 0 : regCalcularHorasFormulario(tipoData, tipoHorario, entrada, saida, intervalo),
        observacao: [labelStatus, observacaoEditada].filter(Boolean).join(' - '),
        criado_por: agenteLogado?.user_id || null
        };
    };

    const registros = diasNovos.map(criarDados);
    if (idEdicao) registros[0].id = idEdicao;

    try {
        if (agenteLogado?.user_id) {
            if (idEdicao && !String(idEdicao).startsWith('local-')) {
                const { error } = await db.from(REG_HORARIOS_TABLE).update(registros[0]).eq('id', idEdicao);
                if (error) throw error;
            } else {
                const { error } = await db.from(REG_HORARIOS_TABLE).insert(registros).select();
                if (error) throw error;
            }
            regUsandoLocalStorage = false;
        } else {
            throw new Error('Sem usuario logado');
        }
    } catch (error) {
        regUsandoLocalStorage = true;
        const local = regLerLocal('historico', []);
        if (idEdicao) {
            const index = local.findIndex(item => String(item.id) === String(idEdicao));
            if (index >= 0) local[index] = Object.assign({}, local[index], registros[0]);
            else local.push(Object.assign({}, registros[0], { id: idEdicao }));
        } else {
            registros.forEach((registro, index) => {
                local.push(Object.assign({}, registro, { id: `local-${Date.now()}-${index}` }));
            });
        }
        regSalvarLocal('historico', local);
        console.warn('Horário salvo localmente:', error);
    }

    fecharModalRegistroHorarios();
    await regCarregarHistorico();
    const avisoPuladas = datasPuladas ? ` ${datasPuladas} data(s) repetida(s) foram ignoradas.` : '';
    mostrarNotificacao('erro-registro-horarios', `${regUsandoLocalStorage ? 'Horário salvo localmente.' : 'Horário salvo.'}${avisoPuladas}`, true);
};

window.editarRegistroHorarios = function (id) {
    const item = regHistorico.find(reg => String(reg.id) === String(id))
        || regLerLocal('historico', []).find(reg => String(reg.id) === String(id));
    if (!item) return;

    regEl('reg-modal-titulo').textContent = 'Editar Horário';
    regEl('reg-edit-id').value = item.id;
    regEl('reg-data-edicao').value = item.data || regHojeISO();
    regEl('reg-data-edicao-label').textContent = regPeriodoLabel(item);
    regPopularSelectMes('reg-data-mes', String(item.data || regHojeISO()).slice(0, 7));
    regEl('reg-entrada').value = item.entrada || '';
    regEl('reg-saida').value = item.saida || '';
    regEl('reg-intervalo').value = 60;
    regEl('reg-observacao').value = item.observacao || '';
    regAtualizarCamposFormulario();
    regEl('modal-registro-horario').classList.remove('hidden');
};

window.excluirRegistroHorarios = async function (id) {
    if (!confirm('Excluir este registro de horário?')) return;

    try {
        if (agenteLogado?.user_id && !String(id).startsWith('local-')) {
            const { error } = await db.from(REG_HORARIOS_TABLE).delete().eq('id', id);
            if (error) throw error;
        } else {
            throw new Error('Registro local');
        }
    } catch (error) {
        const local = regLerLocal('historico', []).filter(item => String(item.id) !== String(id));
        regSalvarLocal('historico', local);
        console.warn('Exclusao aplicada localmente:', error);
    }

    await regCarregarHistorico();
};

function regObterLogosPDF() {
    const fontePdf = window.gerarPDFRelatorio ? window.gerarPDFRelatorio.toString() : '';
    const logoMatch = fontePdf.match(/const _LOGO\s*=\s*"([^"]+)"/);
    const brasaoMatch = fontePdf.match(/const _BRASAO\s*=\s*"([^"]+)"/);
    return {
        logo: logoMatch ? logoMatch[1] : null,
        brasao: brasaoMatch ? brasaoMatch[1] : null
    };
}

function regImagemSizePDF(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
        img.onerror = () => resolve({ w: 1, h: 1 });
        img.src = src || '';
    });
}

function regTextoPDF(doc, texto, x, y, maxWidth, lineHeight = 5) {
    const linhas = doc.splitTextToSize(String(texto || '-'), maxWidth);
    doc.text(linhas, x, y);
    return y + (linhas.length * lineHeight);
}

window.gerarPDFRegistroHorarios = async function () {
    const registros = regFiltrarHistorico().sort((a, b) => String(a.data).localeCompare(String(b.data)));
    if (!registros.length) {
        mostrarNotificacao('erro-registro-horarios', 'Nenhum horário para gerar PDF.');
        return;
    }
    if (!window.jspdf?.jsPDF) {
        mostrarNotificacao('erro-registro-horarios', 'Biblioteca PDF nao carregada.');
        return;
    }

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:22px 30px;border-radius:10px;z-index:9999;font-weight:bold;text-align:center;font-family:Arial,sans-serif;font-size:15px;';
    loadingDiv.innerText = 'Gerando PDF...\nAguarde um momento.';
    document.body.appendChild(loadingDiv);

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const margemX = 15;
        const larguraPagina = 210;
        const larguraUtil = larguraPagina - (margemX * 2);
        const mes = regEl('reg-mes')?.value || regMesAtual();
        const resumo = regResumo();
        const agente = regAgentePadrao() || 'AGENTE';
        let posY = 15;

        const novaPaginaSePreciso = altura => {
            if (posY + altura <= 282) return;
            doc.addPage();
            posY = 15;
        };

        const { logo, brasao } = regObterLogosPDF();
        if (logo && brasao) {
            const [logoSize, brasaoSize] = await Promise.all([regImagemSizePDF(logo), regImagemSizePDF(brasao)]);
            const altLogos = 14;
            const logoW = (logoSize.w / logoSize.h) * altLogos;
            const brasaoW = (brasaoSize.w / brasaoSize.h) * altLogos;
            doc.addImage(logo, 'PNG', margemX, posY, logoW, altLogos);
            doc.addImage(brasao, 'PNG', larguraPagina - margemX - brasaoW, posY, brasaoW, altLogos);
        }

        const centroY = posY + 7;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('PREFEITURA DE JACAREI', larguraPagina / 2, centroY - 1.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Secretaria de Mobilidade Urbana', larguraPagina / 2, centroY + 3.5, { align: 'center' });
        posY += 22;

        doc.setDrawColor(136, 136, 136);
        doc.setLineWidth(0.4);
        doc.rect(margemX, posY, larguraUtil, 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('REGISTRO DE HORÁRIOS', larguraPagina / 2, posY + 5.5, { align: 'center' });
        posY += 14;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('AGENTE:', margemX, posY);
        doc.text('MES:', margemX + 105, posY);
        doc.setFont('helvetica', 'normal');
        doc.text(agente, margemX + 18, posY);
        doc.text(regLabelMes(mes), margemX + 116, posY);
        posY += 8;

        const cards = [
            ['Horas normais', `${resumo.categorias.normaisDias} dias`, regHoras(resumo.categorias.normaisHoras), regMoeda(resumo.categorias.normaisValor)],
            ['Extras 50%', `${resumo.categorias.extras50Dias} dias`, regHoras(resumo.categorias.extras50Horas), regMoeda(resumo.categorias.extras50Valor)],
            ['Extras 100%', `${resumo.categorias.extras100Dias} dias`, regHoras(resumo.categorias.extras100Horas), regMoeda(resumo.categorias.extras100Valor)],
            ['Adic. noturno', '', regHoras(resumo.categorias.extras25Horas), regMoeda(resumo.categorias.extras25Valor)],
            ['Bruto/Liquido', '', regMoeda(resumo.ganhoLancado), regMoeda(resumo.impostoLancado.liquido)],
            ['IPMJ/IR', '', regMoeda(resumo.impostoLancado.ipmj), regMoeda(resumo.impostoLancado.ir)]
        ];
        const cardW = larguraUtil / 3;
        cards.forEach((card, index) => {
            const x = margemX + ((index % 3) * cardW);
            const y = posY + (Math.floor(index / 3) * 20);
            doc.rect(x, y, cardW, 18);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(card[0], x + 2, y + 5);
            doc.setFont('helvetica', 'normal');
            if (card[1]) {
                doc.text(card[1], x + 2, y + 10);
                doc.text(`${card[2]} | ${card[3]}`, x + 2, y + 15);
            } else {
                doc.text(`${card[2]} | ${card[3]}`, x + 2, y + 12);
            }
        });
        posY += 46;

        const colunas = [
            { titulo: 'Periodo', x: margemX, w: 38 },
            { titulo: 'Horário', x: margemX + 38, w: 32 },
            { titulo: 'Interv.', x: margemX + 70, w: 18 },
            { titulo: 'Horas', x: margemX + 88, w: 22 },
            { titulo: 'Valor', x: margemX + 110, w: 30 },
            { titulo: 'Obs.', x: margemX + 140, w: 40 }
        ];

        const desenharCabecalhoTabela = () => {
            doc.setFillColor(235, 235, 235);
            doc.rect(margemX, posY, larguraUtil, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            colunas.forEach(col => doc.text(col.titulo, col.x + 1, posY + 5));
            posY += 8;
        };

        desenharCabecalhoTabela();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        registros.forEach(item => {
            novaPaginaSePreciso(10);
            if (posY === 15) desenharCabecalhoTabela();
            const categoriasDia = regCalcularCategoriasHoras([item], regValorHoraSalarioBase());
            const valorDia = categoriasDia.normaisValor + categoriasDia.extras25Valor + categoriasDia.extras50Valor + categoriasDia.extras100Valor;
            const ausente = regRegistroAusente(item);
            const horario = ausente ? '00:00 - 00:00' : `${regHoraCurta(item.entrada)} - ${regHoraCurta(item.saida)}`;
            const intervalo = ausente ? 0 : Number(item.intervalo_minutos || 0);
            const yLinha = posY;
            doc.line(margemX, yLinha, margemX + larguraUtil, yLinha);
            doc.text(regPeriodoLabel(item), colunas[0].x + 1, yLinha + 5);
            doc.text(horario, colunas[1].x + 1, yLinha + 5);
            doc.text(`${intervalo} min`, colunas[2].x + 1, yLinha + 5);
            doc.text(regHoras(item.horas_liquidas), colunas[3].x + 1, yLinha + 5);
            doc.text(regMoeda(valorDia), colunas[4].x + 1, yLinha + 5);
            regTextoPDF(doc, item.observacao || '', colunas[5].x + 1, yLinha + 5, colunas[5].w - 2, 4);
            posY += 8;
        });
        doc.line(margemX, posY, margemX + larguraUtil, posY);

        novaPaginaSePreciso(35);
        posY += 28;
        doc.setLineWidth(0.4);
        doc.setDrawColor(50, 50, 50);
        doc.line(larguraPagina / 2 - 35, posY, larguraPagina / 2 + 35, posY);
        posY += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('ASSINATURA DO AGENTE', larguraPagina / 2, posY, { align: 'center' });
        posY += 4;
        doc.setFont('helvetica', 'normal');
        doc.text(agente, larguraPagina / 2, posY, { align: 'center' });

        doc.save(`Registro_Horarios_${mes}_${agente.replace(/[^A-Z0-9_-]/gi, '_')}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF de horários:', error);
        mostrarNotificacao('erro-registro-horarios', 'Erro ao gerar PDF.');
    } finally {
        loadingDiv.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    regEl('btn-entrar-registro-horarios')?.addEventListener('click', abrirTelaRegistroHorarios);
    regEl('reg-data-mes')?.addEventListener('change', regRenderizarPreviewMes);
    regEl('reg-mes')?.addEventListener('change', regCarregarHistorico);
});
