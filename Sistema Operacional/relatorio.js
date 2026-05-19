// ==========================================
// RELATÓRIO — TELA PRINCIPAL
// ==========================================
const btnEntrarRelatorio = document.getElementById('btn-entrar-relatorio');

// Contadores para campos dinâmicos
let relEnvolvidosCount  = 0;
let relApoioCount       = 0;
let relSocorroCount     = 0;
let relVitimasCount     = 0;
let relAgentesCount     = 0;
let relVtrsCount        = 0;
let relFotosSelecionadas = [];
let remAgentesCount     = 0;
let remVtrsCount        = 0;
let remFotosSelecionadas = [];
let abAgentesCount      = 0;
let abVtrsCount         = 0;
let abApoioCount        = 0;
let abFotosSelecionadas = [];
let art279AgentesCount  = 0;
let art279VtrsCount     = 0;
let art279FotosSelecionadas = [];

function calcularDimensoesFotoPDF(src, maxW, maxH) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const larguraNatural = img.naturalWidth || maxW;
            const alturaNatural = img.naturalHeight || maxH;
            const escala = Math.min(maxW / larguraNatural, maxH / alturaNatural);
            const largura = larguraNatural * escala;
            const altura = alturaNatural * escala;
            resolve({
                largura,
                altura,
                offsetX: (maxW - largura) / 2,
                offsetY: (maxH - altura) / 2
            });
        };
        img.onerror = () => resolve({ largura: maxW, altura: maxH, offsetX: 0, offsetY: 0 });
        img.src = src;
    });
}

// VTR_CODES e DET_CODES vêm de carregarListas() e são os mesmos do app
// Serão populados via populateRelatorioSelects()

// ==========================================
// ENTRAR NA TELA RELATÓRIO
// ==========================================
if (btnEntrarRelatorio) {
    btnEntrarRelatorio.addEventListener('click', () => {
        ocultarTodasTelas();
        telaRelatorio.classList.remove('hidden');
        carregarHistoricoRelatorio();
    });
}

window.voltarParaRelatorio = function () {
    ocultarTodasTelas();
    telaRelatorio.classList.remove('hidden');
    carregarHistoricoRelatorio();
};

// ==========================================
// MENU DROPDOWN "NOVO RELATÓRIO"
// ==========================================
window.toggleMenuRelatorio = function () {
    const menu = document.getElementById('menu-novo-relatorio');
    menu.classList.toggle('hidden');
};

window.abrirFormularioSinistro = function () {
    document.getElementById('menu-novo-relatorio').classList.add('hidden');
    document.getElementById('modal-sinistro').classList.remove('hidden');
    resetFormSinistro();
    populateRelatorioSelects();
};

window.fecharModalSinistro = function () {
    document.getElementById('modal-sinistro').classList.add('hidden');
    resetFormSinistro();
};

window.abrirFormularioRemocaoAbandono = function () {
    document.getElementById('menu-novo-relatorio').classList.add('hidden');
    document.getElementById('modal-remocao-abandono').classList.remove('hidden');
    resetFormRemocaoAbandono();
    populateRelatorioSelects();
};

window.fecharModalRemocaoAbandono = function () {
    document.getElementById('modal-remocao-abandono').classList.add('hidden');
    resetFormRemocaoAbandono();
};

window.abrirFormularioRemocao279A = function () {
    document.getElementById('menu-novo-relatorio').classList.add('hidden');
    document.getElementById('modal-remocao-279a').classList.remove('hidden');
    resetFormRemocao279A();
    populateRelatorioSelects();
};

window.fecharModalRemocao279A = function () {
    document.getElementById('modal-remocao-279a').classList.add('hidden');
    resetFormRemocao279A();
};

function criarModalRemocao() {
    if (document.getElementById('modal-remocao')) return;
    document.querySelector('.app-container').insertAdjacentHTML('beforeend', `
        <div id="modal-remocao" class="modal-overlay hidden" style="align-items:flex-start;padding-top:10px;overflow-y:auto;">
            <div class="modal-card" style="max-width:460px;width:96%;margin:0 auto 20px;max-height:95vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="color:var(--green-accent);">🚧 Relatório de Remoção</h3>
                    <button class="btn-cancelar" style="padding:4px 10px;font-size:12px;" onclick="fecharModalRemocao()">✕ Fechar</button>
                </div>
                <div id="rem-edit-indicator" class="hidden" style="margin-bottom:10px;padding:8px 12px;background:rgba(0,168,132,0.1);border:1px solid rgba(0,168,132,0.3);border-radius:8px;font-size:12px;font-weight:700;color:var(--green-accent);">✏️ Editando Registro</div>
                <div id="erro-modal-remocao" class="erro-inline hidden" style="margin-bottom:10px;"></div>
                <div class="modal-body" style="gap:12px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA</label><input type="date" id="rem-data" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">HORA</label><input type="time" id="rem-hora" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº AIT</label><input type="text" id="rem-numero-ait" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">PLACA</label><input type="text" id="rem-placa" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MODELO/MARCA</label><input type="text" id="rem-modelo-marca" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">ESTADO DE CONSERVAÇÃO</label><input type="text" id="rem-estado-conservacao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MOTIVO DA REMOÇÃO (INFRAÇÃO/ART CTB)</label><input type="text" id="rem-motivo-remocao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">CR - GUIA RECOLHIMENTO</label><input type="text" id="rem-cr-guia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESP. GUINCHO</label><input type="text" id="rem-resp-guincho" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº OCORRÊNCIA</label><input type="text" id="rem-numero-ocorrencia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">OPERADOR COTRAN</label><input type="text" id="rem-operador-cotran" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">FONTE</label><select id="rem-fonte" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option>
                    <option value="Solicitação de munícipe">Solicitação de Munícipe</option>
                    <option value="Fiscalização de rotina">Fiscalização de Rotina</option>
                    <option>COI</option>
                    <option>CECOM</option>
                    <option>BLITZ</option>
                    </select></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DADOS DO SOLICITANTE</label><input type="text" id="rem-dados-solicitante" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">ENDEREÇO</label><input type="text" id="rem-endereco" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">PESQUISA FURTO/ROUBO</label><select id="rem-pesquisa-furto-roubo" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option>
                        <option>Polícia Militar</option>
                        </select></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">POLICIAL RESPONSÁVEL</label><input type="text" id="rem-policial-responsavel" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESUMO DOS FATOS</label><textarea id="rem-resumo" rows="3" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;resize:none;font-family:inherit;outline:none;"></textarea></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">AGENTES ENVOLVIDOS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addAgenteRem()">+ Adicionar Agente</button></div><div id="rem-agentes-container"></div></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">VIATURAS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addVtrRem()">+ Adicionar VTR</button></div><div id="rem-vtrs-container"></div></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">AGENTE RESPONSÁVEL PELO AIT</label><select id="rem-responsavel-ait" disabled style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></select></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MATRÍCULA</label><input type="text" id="rem-matricula-agente" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">SUPERVISÃO</label><input type="text" id="rem-supervisao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MATRÍCULA</label><input type="text" id="rem-matricula-supervisao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA DO RELATÓRIO</label><input type="date" id="rem-data-relatorio" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <label style="font-size:11px;font-weight:700;color:var(--text-secondary);">FOTOS DA REMOÇÃO</label>
                            <label class="btn-action" style="cursor:pointer;padding:4px 10px;font-size:11px;">
                                📷 Anexar Fotos
                                <input type="file" id="rem-foto-input" accept="image/*" multiple style="display:none;">
                            </label>
                        </div>
                        <div id="rem-fotos-container" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
                    </div>
                </div>
                <div class="modal-footer" style="margin-top:20px;"><button class="btn-cancelar" onclick="fecharModalRemocao()">Cancelar</button><button class="btn-salvar" id="btn-salvar-remocao" onclick="salvarRemocao()">💾 Salvar Relatório</button></div>
            </div>
        </div>`);
}

criarModalRemocao();

function criarModalRemocaoAbandono() {
    if (document.getElementById('modal-remocao-abandono')) return;
    document.querySelector('.app-container').insertAdjacentHTML('beforeend', `
        <div id="modal-remocao-abandono" class="modal-overlay hidden" style="align-items:flex-start;padding-top:10px;overflow-y:auto;">
            <div class="modal-card" style="max-width:460px;width:96%;margin:0 auto 20px;max-height:95vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="color:var(--green-accent);">🅿️ Remoção por Abandono</h3>
                    <button class="btn-cancelar" style="padding:4px 10px;font-size:12px;" onclick="fecharModalRemocaoAbandono()">✕ Fechar</button>
                </div>
                <div id="ab-edit-indicator" class="hidden" style="margin-bottom:10px;padding:8px 12px;background:rgba(0,168,132,0.1);border:1px solid rgba(0,168,132,0.3);border-radius:8px;font-size:12px;font-weight:700;color:var(--green-accent);">✏️ Editando Registro</div>
                <div id="erro-modal-abandono" class="erro-inline hidden" style="margin-bottom:10px;"></div>
                <div class="modal-body" style="gap:12px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">PLACA</label><input type="text" id="ab-placa" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MODELO/MARCA</label><input type="text" id="ab-modelo-marca" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº DO AIM</label><input type="text" id="ab-numero-aim" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº OCORRÊNCIA</label><input type="text" id="ab-numero-ocorrencia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA DO AIM</label><input type="date" id="ab-data-aim" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA DA PUBLICAÇÃO</label><input type="date" id="ab-data-publicacao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MOTIVO DA REMOÇÃO</label><select id="ab-motivo-remocao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option><option>Infração Art. 42, da Lei Complementar nº 11/2021</option></select></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">CR - GUIA RECOLHIMENTO</label><input type="text" id="ab-cr-guia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESP. GUINCHO</label><input type="text" id="ab-resp-guincho" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">HORA INICIAL</label><input type="time" id="ab-hora-inicial" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">HORA FINAL</label><input type="time" id="ab-hora-final" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">FONTE</label><select id="ab-fonte" onchange="toggleFonteAbandonoCustom()" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option><option value="Solicitação de munícipe">Solicitação de Munícipe</option><option value="Fiscalização de rotina">Fiscalização de Rotina</option><option value="GRP">GRP</option><option value="Atendimento N°">Atendimento N°</option><option value="Outro">Outro</option></select></div>
                    <div id="ab-fonte-numero-container" class="hidden"><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">NÚMERO</label><input type="text" id="ab-fonte-numero" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div id="ab-fonte-custom-container" class="hidden"><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">FONTE MANUAL</label><input type="text" id="ab-fonte-custom" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESUMO DOS FATOS</label><textarea id="ab-resumo" rows="3" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;resize:none;font-family:inherit;outline:none;"></textarea></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">AGENTES ENVOLVIDOS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addAgenteAbandono()">+ Adicionar Agente</button></div><div id="ab-agentes-container"></div></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">VIATURAS ENVOLVIDAS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addVtrAbandono()">+ Adicionar VTR</button></div><div id="ab-vtrs-container"></div></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">APOIO</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addApoioAbandono()">+ Adicionar Apoio</button></div><div id="ab-apoio-container"></div></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">SUPERVISÃO</label><input type="text" id="ab-supervisao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA</label><input type="date" id="ab-data" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <label style="font-size:11px;font-weight:700;color:var(--text-secondary);">FOTOS DA REMOÇÃO</label>
                            <label class="btn-action" style="cursor:pointer;padding:4px 10px;font-size:11px;">
                                📷 Anexar Fotos
                                <input type="file" id="ab-foto-input" accept="image/*" multiple style="display:none;">
                            </label>
                        </div>
                        <div id="ab-fotos-container" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
                    </div>
                </div>
                <div class="modal-footer" style="margin-top:20px;"><button class="btn-cancelar" onclick="fecharModalRemocaoAbandono()">Cancelar</button><button class="btn-salvar" id="btn-salvar-abandono" onclick="salvarRemocaoAbandono()">💾 Salvar Relatório</button></div>
            </div>
        </div>`);
}

criarModalRemocaoAbandono();

function criarModalRemocao279A() {
    if (document.getElementById('modal-remocao-279a')) return;
    document.querySelector('.app-container').insertAdjacentHTML('beforeend', `
        <div id="modal-remocao-279a" class="modal-overlay hidden" style="align-items:flex-start;padding-top:10px;overflow-y:auto;">
            <div class="modal-card" style="max-width:460px;width:96%;margin:0 auto 20px;max-height:95vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="color:var(--green-accent);">⚖️ Remoção Art. 279-A CTB</h3>
                    <button class="btn-cancelar" style="padding:4px 10px;font-size:12px;" onclick="fecharModalRemocao279A()">✕ Fechar</button>
                </div>
                <div id="art279-edit-indicator" class="hidden" style="margin-bottom:10px;padding:8px 12px;background:rgba(0,168,132,0.1);border:1px solid rgba(0,168,132,0.3);border-radius:8px;font-size:12px;font-weight:700;color:var(--green-accent);">✏️ Editando Registro</div>
                <div id="erro-modal-279a" class="erro-inline hidden" style="margin-bottom:10px;"></div>
                <div class="modal-body" style="gap:12px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">DATA DA REMOÇÃO</label><input type="date" id="art279-data-remocao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">HORA</label><input type="time" id="art279-hora" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº DO AIT</label><input type="text" id="art279-numero-ait" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">PLACA</label><input type="text" id="art279-placa" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;text-transform:uppercase;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MODELO/MARCA</label><input type="text" id="art279-modelo-marca" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">ESTADO DE CONSERVAÇÃO</label><input type="text" id="art279-estado-conservacao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">FONTE</label><select id="art279-fonte" onchange="toggleFonte279ACustom()" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option><option value="Solicitação de munícipe">Solicitação de Munícipe</option><option value="Fiscalização de rotina">Fiscalização de Rotina</option><option>COTRAN</option><option>COI</option><option>CECOM</option><option value="Atendimento">Atendimento</option><option value="GPRO">GPRO</option></select></div>
                    <div id="art279-fonte-numero-container" class="hidden"><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">NÚMERO DA FONTE</label><input type="text" id="art279-fonte-numero" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">CR - GUIA RECOLHIMENTO</label><input type="text" id="art279-cr-guia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESP. GUINCHO</label><input type="text" id="art279-resp-guincho" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">Nº OCORRÊNCIA</label><input type="text" id="art279-numero-ocorrencia" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">OPERADOR COTRAN</label><input type="text" id="art279-operador-cotran" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">ENDEREÇO</label><input type="text" id="art279-endereco" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">PESQUISA FURTO/ROUBO</label><select id="art279-pesquisa-furto-roubo" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"><option value="">Selecionar...</option><option>Polícia Militar</option></select></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">POLICIAL RESPONSÁVEL</label><input type="text" id="art279-policial-responsavel" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">RESUMO DOS FATOS</label><textarea id="art279-resumo" rows="3" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;resize:none;font-family:inherit;outline:none;"></textarea></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">AGENTES ENVOLVIDOS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addAgente279A()">+ Adicionar Agente</button></div><div id="art279-agentes-container"></div></div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><label style="font-size:11px;font-weight:700;color:var(--text-secondary);">VIATURAS ENVOLVIDAS</label><button class="btn-action" style="padding:4px 10px;font-size:11px;" onclick="addVtr279A()">+ Adicionar VTR</button></div><div id="art279-vtrs-container"></div></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">AGENTE RESPONSÁVEL PELA REMOÇÃO</label><select id="art279-responsavel-remocao" disabled style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></select></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MATRÍCULA</label><input type="text" id="art279-matricula-agente" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">SUPERVISÃO</label><input type="text" id="art279-supervisao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                        <div><label style="font-size:11px;color:var(--text-secondary);display:block;margin-bottom:4px;">MATRÍCULA</label><input type="text" id="art279-matricula-supervisao" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:14px;"></div>
                    </div>
                    <div style="background:var(--bg-input);border-radius:12px;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <label style="font-size:11px;font-weight:700;color:var(--text-secondary);">FOTOS DA REMOÇÃO</label>
                            <label class="btn-action" style="cursor:pointer;padding:4px 10px;font-size:11px;">
                                📷 Anexar Fotos
                                <input type="file" id="art279-foto-input" accept="image/*" multiple style="display:none;">
                            </label>
                        </div>
                        <div id="art279-fotos-container" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
                    </div>
                </div>
                <div class="modal-footer" style="margin-top:20px;"><button class="btn-cancelar" onclick="fecharModalRemocao279A()">Cancelar</button><button class="btn-salvar" id="btn-salvar-279a" onclick="salvarRemocao279A()">💾 Salvar Relatório</button></div>
            </div>
        </div>`);
}

criarModalRemocao279A();

window.abrirFormularioRemocao = function () {
    document.getElementById('menu-novo-relatorio').classList.add('hidden');
    document.getElementById('modal-remocao').classList.remove('hidden');
    resetFormRemocao();
    populateRelatorioSelects();
};

window.fecharModalRemocao = function () {
    document.getElementById('modal-remocao').classList.add('hidden');
    resetFormRemocao();
};

// ==========================================
// POPULA SELECTS DO FORMULÁRIO DE SINISTRO
// ==========================================
function populateRelatorioSelects() {
    // Agentes (usa a tabela funcionarios já carregada no DOM via carregarListas)
    const srcCondutor = document.getElementById('vtr-select-condutor');
    const agentesOpts = srcCondutor ? Array.from(srcCondutor.options)
        .filter(o => o.value)
        .map(o => `<option value="${o.value}">${o.value}</option>`)
        .join('') : '';

    // Viaturas
    const srcVtr = document.getElementById('vtr-select-vtr');
    const vtrsOpts = srcVtr ? Array.from(srcVtr.options)
        .filter(o => o.value)
        .map(o => `<option value="${o.value}">${o.value}</option>`)
        .join('') : '';

    // Responsável pelo relatório — sempre o agente logado
    const selResp = document.getElementById('sin-responsavel-select');
    if (selResp) {
        selResp.innerHTML = agentesOpts;
        if (agenteLogado && agenteLogado.det_codigo) {
            selResp.value = agenteLogado.det_codigo;
        }
        selResp.disabled = true;
    }
    const inpResp = document.getElementById('sin-responsavel-custom');
    if (inpResp) inpResp.classList.add('hidden');

    // Guarda globalmente para uso em addAgenteSinistro / addVtrSinistro
    window._relAgentesOpts = agentesOpts;
    window._relVtrsOpts    = vtrsOpts;

    const remResp = document.getElementById('rem-responsavel-ait');
    if (remResp) {
        remResp.innerHTML = agentesOpts;
        if (agenteLogado && agenteLogado.det_codigo) remResp.value = agenteLogado.det_codigo;
        remResp.disabled = true;
    }
    const art279Resp = document.getElementById('art279-responsavel-remocao');
    if (art279Resp) {
        art279Resp.innerHTML = agentesOpts;
        if (agenteLogado && agenteLogado.det_codigo) art279Resp.value = agenteLogado.det_codigo;
        art279Resp.disabled = true;
    }
}

function resetFormRemocao(manterEdicao = false) {
    if (!manterEdicao) {
        window._editandoRemocaoId = null;
        const ind = document.getElementById('rem-edit-indicator');
        if (ind) ind.classList.add('hidden');
    }
    [
        'rem-data','rem-hora','rem-numero-ait','rem-placa','rem-modelo-marca',
        'rem-estado-conservacao','rem-motivo-remocao','rem-cr-guia','rem-resp-guincho',
        'rem-numero-ocorrencia','rem-operador-cotran','rem-fonte','rem-dados-solicitante',
        'rem-endereco','rem-pesquisa-furto-roubo','rem-policial-responsavel','rem-resumo',
        'rem-responsavel-ait','rem-matricula-agente','rem-supervisao','rem-matricula-supervisao',
        'rem-data-relatorio'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['rem-agentes-container','rem-vtrs-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    remFotosSelecionadas.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    remFotosSelecionadas = [];
    window._fotosRemocaoExistentes = [];
    const fpCont = document.getElementById('rem-fotos-container');
    if (fpCont) fpCont.innerHTML = '';
    remAgentesCount = 0;
    remVtrsCount = 0;
    const err = document.getElementById('erro-modal-remocao');
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    const hoje = obterDataLocal();
    const data = document.getElementById('rem-data');
    const dataRel = document.getElementById('rem-data-relatorio');
    if (data) data.value = hoje;
    if (dataRel) dataRel.value = hoje;
    const hora = document.getElementById('rem-hora');
    if (hora) hora.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    populateRelatorioSelects();
}

window.addAgenteRem = function (valor = '') {
    remAgentesCount++;
    const id = remAgentesCount;
    const cont = document.getElementById('rem-agentes-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `rem-ag-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
            <select id="rem-agente-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;">
                <option value="">Agente...</option>${window._relAgentesOpts || ''}
            </select>
            <button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('rem-ag-${id}').remove()">✕</button>
        </div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`rem-agente-${id}`).value = valor;
};

window.addVtrRem = function (valor = '') {
    remVtrsCount++;
    const id = remVtrsCount;
    const cont = document.getElementById('rem-vtrs-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `rem-vtr-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
            <select id="rem-vtr-${id}-select" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;">
                <option value="">Viatura...</option>${window._relVtrsOpts || ''}
            </select>
            <button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('rem-vtr-${id}').remove()">✕</button>
        </div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`rem-vtr-${id}-select`).value = valor;
};

function lerCampoRem(id) {
    return (document.getElementById(id)?.value || '').trim();
}

function normalizarFonteRelatorio(valor) {
    const fontes = {
        'solicitação de munícipe': 'Solicitação de munícipe',
        'fiscalização de rotina': 'Fiscalização de rotina',
        'cotran': 'COTRAN',
        'coi': 'COI',
        'cecom': 'CECOM',
        'blitz': 'BLITZ',
    };
    return fontes[(valor || '').trim().toLowerCase()] || valor;
}

function formatarDet(valor) {
    const texto = String(valor || '').trim();
    if (!texto) return '';
    const numero = texto.replace(/^det\s*-?\s*/i, '').trim();
    return numero ? `DET - ${numero}` : texto;
}

function lerAgentesRem() {
    return Array.from(document.querySelectorAll('[id^="rem-agente-"]')).map(el => el.value).filter(Boolean);
}

function lerVtrsRem() {
    return Array.from(document.querySelectorAll('[id^="rem-vtr-"][id$="-select"]')).map(el => el.value).filter(Boolean);
}

function resetFormRemocaoAbandono(manterEdicao = false) {
    if (!manterEdicao) {
        window._editandoAbandonoId = null;
        const ind = document.getElementById('ab-edit-indicator');
        if (ind) ind.classList.add('hidden');
    }
    [
        'ab-placa','ab-modelo-marca','ab-numero-aim','ab-data-aim','ab-data-publicacao',
        'ab-motivo-remocao','ab-cr-guia','ab-resp-guincho','ab-numero-ocorrencia',
        'ab-hora-inicial','ab-hora-final','ab-fonte','ab-fonte-numero','ab-fonte-custom',
        'ab-resumo','ab-supervisao','ab-data'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['ab-agentes-container','ab-vtrs-container','ab-apoio-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    abFotosSelecionadas.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    abFotosSelecionadas = [];
    window._fotosAbandonoExistentes = [];
    const fpCont = document.getElementById('ab-fotos-container');
    if (fpCont) fpCont.innerHTML = '';
    abAgentesCount = 0;
    abVtrsCount = 0;
    abApoioCount = 0;
    const hoje = obterDataLocal();
    const data = document.getElementById('ab-data');
    if (data) data.value = hoje;
    const err = document.getElementById('erro-modal-abandono');
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    toggleFonteAbandonoCustom();
    populateRelatorioSelects();
}

window.toggleFonteAbandonoCustom = function () {
    const fonte = lerCampoAbandono('ab-fonte');
    const contNumero = document.getElementById('ab-fonte-numero-container');
    const contCustom = document.getElementById('ab-fonte-custom-container');
    if (contNumero) contNumero.classList.toggle('hidden', !['GRP', 'Atendimento N°'].includes(fonte));
    if (contCustom) contCustom.classList.toggle('hidden', fonte !== 'Outro');
    if (!['GRP', 'Atendimento N°'].includes(fonte)) {
        const el = document.getElementById('ab-fonte-numero');
        if (el) el.value = '';
    }
    if (fonte !== 'Outro') {
        const el = document.getElementById('ab-fonte-custom');
        if (el) el.value = '';
    }
};

window.addAgenteAbandono = function (valor = '') {
    abAgentesCount++;
    const id = abAgentesCount;
    const cont = document.getElementById('ab-agentes-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `ab-ag-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;"><select id="ab-agente-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;"><option value="">Agente...</option>${window._relAgentesOpts || ''}</select><button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('ab-ag-${id}').remove()">✕</button></div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`ab-agente-${id}`).value = valor;
};

window.addVtrAbandono = function (valor = '') {
    abVtrsCount++;
    const id = abVtrsCount;
    const cont = document.getElementById('ab-vtrs-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `ab-vtr-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;"><select id="ab-vtr-${id}-select" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;"><option value="">Viatura...</option>${window._relVtrsOpts || ''}</select><button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('ab-vtr-${id}').remove()">✕</button></div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`ab-vtr-${id}-select`).value = valor;
};

window.addApoioAbandono = function (valor = '') {
    abApoioCount++;
    const id = abApoioCount;
    const cont = document.getElementById('ab-apoio-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `ab-apoio-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;"><input id="ab-apoio-${id}-input" type="text" placeholder="Apoio" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;"><button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('ab-apoio-${id}').remove()">✕</button></div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`ab-apoio-${id}-input`).value = valor;
};

function lerCampoAbandono(id) {
    return (document.getElementById(id)?.value || '').trim();
}

function lerAgentesAbandono() {
    return Array.from(document.querySelectorAll('[id^="ab-agente-"]')).map(el => el.value).filter(Boolean);
}

function lerVtrsAbandono() {
    return Array.from(document.querySelectorAll('[id^="ab-vtr-"][id$="-select"]')).map(el => el.value).filter(Boolean);
}

function lerApoioAbandono() {
    return Array.from(document.querySelectorAll('[id^="ab-apoio-"][id$="-input"]')).map(el => el.value.trim()).filter(Boolean);
}

function resetFormRemocao279A(manterEdicao = false) {
    if (!manterEdicao) {
        window._editando279AId = null;
        const ind = document.getElementById('art279-edit-indicator');
        if (ind) ind.classList.add('hidden');
    }
    [
        'art279-data-remocao','art279-hora','art279-numero-ait','art279-placa','art279-modelo-marca',
        'art279-estado-conservacao','art279-fonte','art279-fonte-numero','art279-cr-guia',
        'art279-resp-guincho','art279-numero-ocorrencia','art279-operador-cotran','art279-endereco',
        'art279-pesquisa-furto-roubo','art279-policial-responsavel','art279-resumo',
        'art279-responsavel-remocao','art279-matricula-agente','art279-supervisao','art279-matricula-supervisao'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    ['art279-agentes-container','art279-vtrs-container'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    art279FotosSelecionadas.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    art279FotosSelecionadas = [];
    window._fotos279AExistentes = [];
    const fpCont = document.getElementById('art279-fotos-container');
    if (fpCont) fpCont.innerHTML = '';
    art279AgentesCount = 0;
    art279VtrsCount = 0;
    const data = document.getElementById('art279-data-remocao');
    if (data) data.value = obterDataLocal();
    const hora = document.getElementById('art279-hora');
    if (hora) hora.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const err = document.getElementById('erro-modal-279a');
    if (err) { err.classList.add('hidden'); err.textContent = ''; }
    toggleFonte279ACustom();
    populateRelatorioSelects();
}

window.toggleFonte279ACustom = function () {
    const fonte = lerCampo279A('art279-fonte');
    const cont = document.getElementById('art279-fonte-numero-container');
    if (cont) cont.classList.toggle('hidden', !['Atendimento', 'GPRO'].includes(fonte));
    if (!['Atendimento', 'GPRO'].includes(fonte)) {
        const el = document.getElementById('art279-fonte-numero');
        if (el) el.value = '';
    }
};

window.addAgente279A = function (valor = '') {
    art279AgentesCount++;
    const id = art279AgentesCount;
    const cont = document.getElementById('art279-agentes-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `art279-ag-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;"><select id="art279-agente-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;"><option value="">Agente...</option>${window._relAgentesOpts || ''}</select><button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('art279-ag-${id}').remove()">✕</button></div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`art279-agente-${id}`).value = valor;
};

window.addVtr279A = function (valor = '') {
    art279VtrsCount++;
    const id = art279VtrsCount;
    const cont = document.getElementById('art279-vtrs-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `art279-vtr-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `<div style="display:flex;gap:6px;align-items:center;margin-top:6px;"><select id="art279-vtr-${id}-select" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-app);color:var(--text-primary);font-size:13px;"><option value="">Viatura...</option>${window._relVtrsOpts || ''}</select><button class="btn-action btn-close" style="padding:5px 9px;font-size:11px;" onclick="document.getElementById('art279-vtr-${id}').remove()">✕</button></div>`;
    cont.appendChild(div);
    if (valor) document.getElementById(`art279-vtr-${id}-select`).value = valor;
};

function lerCampo279A(id) {
    return (document.getElementById(id)?.value || '').trim();
}

function lerAgentes279A() {
    return Array.from(document.querySelectorAll('[id^="art279-agente-"]')).map(el => el.value).filter(Boolean);
}

function lerVtrs279A() {
    return Array.from(document.querySelectorAll('[id^="art279-vtr-"][id$="-select"]')).map(el => el.value).filter(Boolean);
}

// ==========================================
// RESET FORM SINISTRO
// ==========================================
function resetFormSinistro(manterEdicao = false) {
    if (!manterEdicao) {
        window._editandoRelatorioId = null;
        const ind = document.getElementById('sin-edit-indicator');
        if (ind) ind.classList.add('hidden');
    }
    // Limpa campos simples
    ['sin-data','sin-hora','sin-numero','sin-origem','sin-origem-custom',
     'sin-endereco','sin-caracteristica','sin-resumo','sin-supervisao',
     'sin-responsavel-select','sin-responsavel-custom','sin-matricula',
     'sin-data-relatorio'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    // Oculta custom origem
    const oc = document.getElementById('sin-origem-custom-container');
    if (oc) oc.classList.add('hidden');

    // Limpa seção vítimas
    const vitSec = document.getElementById('sin-vitimas-section');
    if (vitSec) vitSec.classList.add('hidden');
    const vitCont = document.getElementById('sin-vitimas-container');
    if (vitCont) vitCont.innerHTML = '';

    // Limpa containers dinâmicos
    ['sin-envolvidos-container','sin-apoio-container','sin-socorro-container',
     'sin-agentes-container','sin-vtrs-container'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });

    // Reset contadores
    relEnvolvidosCount = relApoioCount = relSocorroCount = relVitimasCount = relAgentesCount = relVtrsCount = 0;

    // Fotos
    relFotosSelecionadas = [];
    const fpCont = document.getElementById('sin-fotos-container');
    if (fpCont) fpCont.innerHTML = '';

    // Reset notificação
    const err = document.getElementById('erro-modal-sinistro');
    if (err) { err.classList.add('hidden'); err.textContent = ''; }

    // Data padrão
    const hoje = obterDataLocal();
    const elData = document.getElementById('sin-data');
    if (elData) elData.value = hoje;
    const elDataRel = document.getElementById('sin-data-relatorio');
    if (elDataRel) elDataRel.value = hoje;
}

// ==========================================
// TOGGLE CAMPOS CONDICIONAIS
// ==========================================
window.toggleSinistroOrigemCustom = function () {
    const sel = document.getElementById('sin-origem');
    const cont = document.getElementById('sin-origem-custom-container');
    if (!sel || !cont) return;
    cont.classList.toggle('hidden', sel.value !== 'Outros');
    if (sel.value !== 'Outros') {
        const inp = document.getElementById('sin-origem-custom');
        if (inp) inp.value = '';
    }
};

window.toggleVitimaFieldsSin = function () {
    const sel = document.getElementById('sin-caracteristica');
    const sec = document.getElementById('sin-vitimas-section');
    if (!sel || !sec) return;
    sec.classList.toggle('hidden', sel.value !== 'Com vítima');
};

window.toggleSinistroResponsavelCustom = function () {
    const sel = document.getElementById('sin-responsavel-select');
    const inp = document.getElementById('sin-responsavel-custom');
    if (!sel || !inp) return;
    const mostrar = sel.value === 'Outros';
    inp.classList.toggle('hidden', !mostrar);
    if (!mostrar) inp.value = '';
};

// ==========================================
// CAMPOS DINÂMICOS — ENVOLVIDOS
// ==========================================
window.addEnvolvidoSin = function () {
    relEnvolvidosCount++;
    const id = relEnvolvidosCount;
    const cont = document.getElementById('sin-envolvidos-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `sin-env-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Veículo ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-env-${id}').remove()">✕</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <select id="sin-env-tipo-${id}" style="flex:1;min-width:120px;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Tipo...</option>
                <option>Automóvel 🚗</option>
                <option>Motocicleta 🏍️</option>
                <option>Caminhão 🚛</option>
                <option>Ônibus 🚌</option>
                <option>Van</option>
                <option>Bicicleta 🚴</option>
                <option>Pedestre 🚶</option>
                <option>Autopropelido 🛴</option>
                <option>Ciclomotor 🛵</option>
                <option>Outro</option>
                <option>Sem Informação</option>
            </select>
            <input id="sin-env-placa-${id}" type="text" placeholder="Placa" style="width:100px;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;text-transform:uppercase;">
        </div>
        <input id="sin-env-cnh-${id}" type="text" placeholder="CNH" style="width:100%;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;margin-top:6px;">
    `;
    cont.appendChild(div);
};

// ==========================================
// CAMPOS DINÂMICOS — APOIO POLICIAL
// ==========================================
window.addApoioSin = function () {
    relApoioCount++;
    const id = relApoioCount;
    const cont = document.getElementById('sin-apoio-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `sin-apoio-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Apoio ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-apoio-${id}').remove()">✕</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <select id="sin-apoio-tipo-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Tipo...</option>
                <option>Polícia Militar 🚓</option>
                <option>Polícia Civil 🚓</option>
                <option>Polícia Rodoviária Estadual 🚓</option>
                <option>Polícia Rodoviária Federal 🚓</option>
                <option>GCM 🚓</option>
                <option>Outro</option>
                <option>Sem Informação</option>
            </select>
            <input id="sin-apoio-prefixo-${id}" type="text" placeholder="VTR/Prefixo" style="width:100px;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
        </div>
        <input id="sin-apoio-resp-${id}" type="text" placeholder="Responsável" style="width:100%;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;margin-top:6px;">
    `;
    cont.appendChild(div);
};

// ==========================================
// CAMPOS DINÂMICOS — SOCORRO MÉDICO
// ==========================================
window.addSocorroSin = function () {
    relSocorroCount++;
    const id = relSocorroCount;
    const cont = document.getElementById('sin-socorro-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `sin-socorro-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Socorro ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-socorro-${id}').remove()">✕</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <select id="sin-socorro-tipo-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Tipo...</option>
                <option>SAMU 🚑</option>
                <option>Bombeiros 🚒</option>
                <option>Resgate 🚒</option>
                <option>Ambulância 🚑</option>
                <option>Outro 🚨</option>
                <option>Recusou</option>
                <option>Sem Necessidade</option>
                <option>Sem Informação</option>
            </select>
            <input id="sin-socorro-prefixo-${id}" type="text" placeholder="VTR/Prefixo" style="width:100px;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
        </div>
        <input id="sin-socorro-resp-${id}" type="text" placeholder="Responsável" style="width:100%;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;margin-top:6px;">
    `;
    cont.appendChild(div);
};

// ==========================================
// CAMPOS DINÂMICOS — VÍTIMAS
// ==========================================
window.addVitimaSin = function () {
    relVitimasCount++;
    const id = relVitimasCount;
    const cont = document.getElementById('sin-vitimas-container');
    if (!cont) return;
    const div = document.createElement('div');
    div.id = `sin-vit-${id}`;
    div.className = 'rel-card-sub';
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Vítima ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-vit-${id}').remove()">✕</button>
        </div>
        <input id="sin-vit-nome-${id}" type="text" placeholder="Nome da vítima" style="width:100%;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;margin-bottom:6px;">
        <div style="display:flex;gap:6px;">
            <select id="sin-vit-sexo-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Sexo...</option>
                <option>Masculino</option><option>Feminino</option><option>Outro</option>
            </select>
            <select id="sin-vit-estado-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Estado da vitíma</option>
                <option>Leve</option>
                <option>Grave</option>
                <option>Óbito</option>
                <option>Sem Informação</option>
            </select>
        </div>
        <input id="sin-vit-desc-${id}" type="text" placeholder="Descrição das lesões" style="width:100%;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;margin-top:6px;">
    `;
    cont.appendChild(div);
};

// ==========================================
// CAMPOS DINÂMICOS — AGENTES SINISTRO
// ==========================================
window.addAgenteSin = function () {
    relAgentesCount++;
    const id = relAgentesCount;
    const cont = document.getElementById('sin-agentes-container');
    if (!cont) return;
    
    const div = document.createElement('div');
    div.id = `sin-ag-${id}`;
    div.className = 'rel-card-sub'; // <--- Essa é a classe que cria o fundo preto arredondado
    
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Agente Envolvido ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-ag-${id}').remove()">✕</button>
        </div>
        <div style="display:flex;gap:6px;width:100%;">
            <select id="sin-ag-sel-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Agente...</option>
                ${window._relAgentesOpts || ''}
                <option value="Outros">Outros</option>
            </select>
            <input id="sin-ag-custom-${id}" type="text" placeholder="Nome do agente" class="hidden" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
        </div>
    `;
    
    cont.appendChild(div);
    const sel = div.querySelector(`#sin-ag-sel-${id}`);
    const inp = div.querySelector(`#sin-ag-custom-${id}`);
    sel.addEventListener('change', () => {
        inp.classList.toggle('hidden', sel.value !== 'Outros');
        if (sel.value !== 'Outros') inp.value = '';
    });
};

// ==========================================
// CAMPOS DINÂMICOS — VTRs SINISTRO
// ==========================================
window.addVtrSin = function () {
    relVtrsCount++;
    const id = relVtrsCount;
    const cont = document.getElementById('sin-vtrs-container');
    if (!cont) return;
    
    const div = document.createElement('div');
    div.id = `sin-vtr-${id}`;
    div.className = 'rel-card-sub'; // Fundo preto com cantos arredondados
    
    div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:700;color:var(--text-secondary);">Viatura Envolvida ${id}</span>
            <button class="btn-action btn-close" style="padding:3px 8px;font-size:11px;" onclick="document.getElementById('sin-vtr-${id}').remove()">✕</button>
        </div>
        <div style="display:flex;gap:6px;width:100%;">
            <select id="sin-vtr-sel-${id}" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
                <option value="">Viatura...</option>
                ${window._relVtrsOpts || ''}
                <option value="Outra">Outra</option>
            </select>
            <input id="sin-vtr-custom-${id}" type="text" placeholder="Prefixo da VTR" class="hidden" style="flex:1;padding:8px;border-radius:10px;border:none;background:var(--bg-input);color:var(--text-primary);font-size:13px;">
        </div>
    `;
    
    cont.appendChild(div);
    const sel = div.querySelector(`#sin-vtr-sel-${id}`);
    const inp = div.querySelector(`#sin-vtr-custom-${id}`);
    sel.addEventListener('change', () => {
        inp.classList.toggle('hidden', sel.value !== 'Outra');
        if (sel.value !== 'Outra') inp.value = '';
    });
};

// ==========================================
// FOTOS
// ==========================================
document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'sin-foto-input') {
        Array.from(e.target.files).forEach(file => {
            relFotosSelecionadas.push({ file, previewUrl: URL.createObjectURL(file) });
        });
        e.target.value = '';
        renderFotosSinistro();
    }
    if (e.target && e.target.id === 'rem-foto-input') {
        Array.from(e.target.files).forEach(file => {
            remFotosSelecionadas.push({ file, previewUrl: URL.createObjectURL(file) });
        });
        e.target.value = '';
        renderFotosRemocao();
    }
    if (e.target && e.target.id === 'ab-foto-input') {
        Array.from(e.target.files).forEach(file => {
            abFotosSelecionadas.push({ file, previewUrl: URL.createObjectURL(file) });
        });
        e.target.value = '';
        renderFotosAbandono();
    }
    if (e.target && e.target.id === 'art279-foto-input') {
        Array.from(e.target.files).forEach(file => {
            art279FotosSelecionadas.push({ file, previewUrl: URL.createObjectURL(file) });
        });
        e.target.value = '';
        renderFotos279A();
    }
});

function renderFotosSinistro() {
    const cont = document.getElementById('sin-fotos-container');
    if (!cont) return;
    cont.innerHTML = '';
    relFotosSelecionadas.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'foto-preview-thumb';
        div.innerHTML = `
            <img src="${f.previewUrl}" alt="Foto">
            <button class="btn-remove-foto" onclick="removerFotoSinistro(${idx})">✕</button>
        `;
        cont.appendChild(div);
    });
}

window.removerFotoSinistro = function (idx) {
    URL.revokeObjectURL(relFotosSelecionadas[idx].previewUrl);
    relFotosSelecionadas.splice(idx, 1);
    renderFotosSinistro();
};

function renderFotosRemocao() {
    const cont = document.getElementById('rem-fotos-container');
    if (!cont) return;
    cont.innerHTML = '';
    (window._fotosRemocaoExistentes || []).forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;';
        cont.appendChild(img);
    });
    remFotosSelecionadas.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'foto-preview-thumb';
        div.innerHTML = `
            <img src="${f.previewUrl}" alt="Foto">
            <button class="btn-remove-foto" onclick="removerFotoRemocao(${idx})">✕</button>
        `;
        cont.appendChild(div);
    });
}

window.removerFotoRemocao = function (idx) {
    URL.revokeObjectURL(remFotosSelecionadas[idx].previewUrl);
    remFotosSelecionadas.splice(idx, 1);
    renderFotosRemocao();
};

function renderFotosAbandono() {
    const cont = document.getElementById('ab-fotos-container');
    if (!cont) return;
    cont.innerHTML = '';
    (window._fotosAbandonoExistentes || []).forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;';
        cont.appendChild(img);
    });
    abFotosSelecionadas.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'foto-preview-thumb';
        div.innerHTML = `
            <img src="${f.previewUrl}" alt="Foto">
            <button class="btn-remove-foto" onclick="removerFotoAbandono(${idx})">✕</button>
        `;
        cont.appendChild(div);
    });
}

window.removerFotoAbandono = function (idx) {
    URL.revokeObjectURL(abFotosSelecionadas[idx].previewUrl);
    abFotosSelecionadas.splice(idx, 1);
    renderFotosAbandono();
};

function renderFotos279A() {
    const cont = document.getElementById('art279-fotos-container');
    if (!cont) return;
    cont.innerHTML = '';
    (window._fotos279AExistentes || []).forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;';
        cont.appendChild(img);
    });
    art279FotosSelecionadas.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'foto-preview-thumb';
        div.innerHTML = `
            <img src="${f.previewUrl}" alt="Foto">
            <button class="btn-remove-foto" onclick="removerFoto279A(${idx})">✕</button>
        `;
        cont.appendChild(div);
    });
}

window.removerFoto279A = function (idx) {
    URL.revokeObjectURL(art279FotosSelecionadas[idx].previewUrl);
    art279FotosSelecionadas.splice(idx, 1);
    renderFotos279A();
};

// ==========================================
// HELPERS LEITURA DE CAMPOS
// ==========================================
function lerCampoSinistro(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function lerEnvolvidosSin() {
    const cont = document.getElementById('sin-envolvidos-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        return {
            tipo:  lerCampoSinistro(`sin-env-tipo-${idN}`),
            placa: lerCampoSinistro(`sin-env-placa-${idN}`),
            cnh:   lerCampoSinistro(`sin-env-cnh-${idN}`),
        };
    }).filter(e => e.tipo || e.placa);
}

function lerApoioSin() {
    const cont = document.getElementById('sin-apoio-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        return {
            tipo:        lerCampoSinistro(`sin-apoio-tipo-${idN}`),
            prefixo:     lerCampoSinistro(`sin-apoio-prefixo-${idN}`),
            responsavel: lerCampoSinistro(`sin-apoio-resp-${idN}`),
        };
    }).filter(e => e.tipo);
}

function lerSocorroSin() {
    const cont = document.getElementById('sin-socorro-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        return {
            tipo:        lerCampoSinistro(`sin-socorro-tipo-${idN}`),
            prefixo:     lerCampoSinistro(`sin-socorro-prefixo-${idN}`),
            responsavel: lerCampoSinistro(`sin-socorro-resp-${idN}`),
        };
    }).filter(e => e.tipo);
}

function lerVitimasSin() {
    const cont = document.getElementById('sin-vitimas-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        return {
            nome:     lerCampoSinistro(`sin-vit-nome-${idN}`),
            sexo:     lerCampoSinistro(`sin-vit-sexo-${idN}`),
            estado:   lerCampoSinistro(`sin-vit-estado-${idN}`),
            descricao:lerCampoSinistro(`sin-vit-desc-${idN}`),
        };
    }).filter(v => v.nome || v.estado);
}

function lerAgentesSin() {
    const cont = document.getElementById('sin-agentes-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        const sel = lerCampoSinistro(`sin-ag-sel-${idN}`);
        const custom = lerCampoSinistro(`sin-ag-custom-${idN}`);
        return sel === 'Outros' ? custom : sel;
    }).filter(v => v);
}

function lerVtrsSin() {
    const cont = document.getElementById('sin-vtrs-container');
    if (!cont) return [];
    return Array.from(cont.children).map(div => {
        const idN = div.id.split('-').pop();
        const sel = lerCampoSinistro(`sin-vtr-sel-${idN}`);
        const custom = lerCampoSinistro(`sin-vtr-custom-${idN}`);
        return sel === 'Outros' ? custom : sel;
    }).filter(v => v);
}

// ==========================================
// SALVAR SINISTRO NO SUPABASE
// ==========================================
window.salvarSinistro = async function () {
    const btnSalvar = document.getElementById('btn-salvar-sinistro');
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando...'; }

    try {
        const data           = lerCampoSinistro('sin-data');
        const hora           = lerCampoSinistro('sin-hora');
        const numero         = lerCampoSinistro('sin-numero');
        const origemSel      = lerCampoSinistro('sin-origem');
        const origemCustom   = lerCampoSinistro('sin-origem-custom');
        const origem         = origemSel === 'Outros' ? origemCustom : origemSel;
        const endereco       = lerCampoSinistro('sin-endereco');
        const caracteristica = lerCampoSinistro('sin-caracteristica');
        const resumo         = lerCampoSinistro('sin-resumo');
        const supervisao     = lerCampoSinistro('sin-supervisao');
        const responsavel   = agenteLogado?.det_codigo || '—';
        const matricula     = lerCampoSinistro('sin-matricula');
        const dataRelatorio  = lerCampoSinistro('sin-data-relatorio');

        if (!data)     return mostrarNotificacao('erro-modal-sinistro', '⚠️ Informe a Data.');
        if (!hora)     return mostrarNotificacao('erro-modal-sinistro', '⚠️ Informe a Hora.');
        if (!endereco) return mostrarNotificacao('erro-modal-sinistro', '⚠️ Informe o Endereço.');

        // Valida edição dentro de 24h
        const editandoId = window._editandoRelatorioId;
        if (editandoId) {
            const { data: regAtual } = await db.from('relatorios_sinistro').select('created_at').eq('id', editandoId).single();
            if (regAtual && !isUnder24hRel(regAtual.created_at)) {
                return mostrarNotificacao('erro-modal-sinistro', '⚠️ Registros com mais de 24h não podem ser editados.');
            }
        }

        // Upload de fotos
        const fotosUrls = [];
        for (const f of relFotosSelecionadas) {
            const ext = f.file.name.split('.').pop();
            const caminho = `sinistros/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: errUp } = await db.storage.from('fotos').upload(caminho, f.file, { upsert: true });
            if (errUp) {
                mostrarNotificacao('erro-modal-sinistro', '❌ Erro ao enviar foto: ' + errUp.message);
                return;
            }
            const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
            fotosUrls.push(publicUrl);
        }

        const dadosDB = {
            data,
            hora,
            numero_ocorrencia: numero || null,
            origem: origem || null,
            endereco,
            caracteristica: caracteristica || null,
            resumo: resumo || null,
            supervisao: supervisao || null,
            responsavel: responsavel || null,
            matricula: matricula || null,
            data_relatorio: dataRelatorio || null,
            agentes:     lerAgentesSin(),
            vtrs:        lerVtrsSin(),
            envolvidos:  lerEnvolvidosSin(),
            apoio:       lerApoioSin(),
            socorro:     lerSocorroSin(),
            vitimas:     lerVitimasSin(),
            fotos:       fotosUrls,
            criado_por:  agenteLogado?.user_id || null,
        };

        let resultId;

        if (editandoId) {
            const { error } = await db.from('relatorios_sinistro').update(dadosDB).eq('id', editandoId);
            if (error) {
                mostrarNotificacao('erro-modal-sinistro', '❌ Erro ao atualizar: ' + error.message);
                return;
            }
            resultId = editandoId;
            mostrarNotificacao('erro-relatorio', '✅ Relatório atualizado!', true);
        } else {
            const { data: resultado, error } = await db.from('relatorios_sinistro').insert([dadosDB]).select();
            if (error) {
                mostrarNotificacao('erro-modal-sinistro', '❌ Erro ao salvar: ' + error.message);
                return;
            }
            resultId = resultado[0].id;
            mostrarNotificacao('erro-relatorio', '✅ Relatório salvo!', true);
        }

        fecharModalSinistro();
        carregarHistoricoRelatorio();
    } finally {
        if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = '💾 Salvar Relatório'; }
    }
};

window.salvarRemocao = async function () {
    const btnSalvar = document.getElementById('btn-salvar-remocao');
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando...'; }
    try {
        const data = lerCampoRem('rem-data');
        const hora = lerCampoRem('rem-hora');
        const placa = lerCampoRem('rem-placa').toUpperCase();
        const endereco = lerCampoRem('rem-endereco');
        const agenteResponsavel = agenteLogado?.det_codigo || lerCampoRem('rem-responsavel-ait') || '—';

        if (!data) return mostrarNotificacao('erro-modal-remocao', '⚠️ Informe a Data.');
        if (!hora) return mostrarNotificacao('erro-modal-remocao', '⚠️ Informe a Hora.');
        if (!placa) return mostrarNotificacao('erro-modal-remocao', '⚠️ Informe a Placa.');
        if (!endereco) return mostrarNotificacao('erro-modal-remocao', '⚠️ Informe o Endereço.');

        const editandoId = window._editandoRemocaoId;
        if (editandoId) {
            const { data: regAtual } = await db.from('relatorios_remocao').select('created_at').eq('id', editandoId).single();
            if (regAtual && !isUnder24hRel(regAtual.created_at)) {
                return mostrarNotificacao('erro-modal-remocao', '⚠️ Registros com mais de 24h não podem ser editados.');
            }
        }

        const fotosUrls = [];
        for (const f of remFotosSelecionadas) {
            const ext = f.file.name.split('.').pop();
            const caminho = `remocoes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: errUp } = await db.storage.from('fotos').upload(caminho, f.file, { upsert: true });
            if (errUp) {
                mostrarNotificacao('erro-modal-remocao', '❌ Erro ao enviar foto: ' + errUp.message);
                return;
            }
            const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
            fotosUrls.push(publicUrl);
        }
        const fotosRemocao = [...(window._fotosRemocaoExistentes || []), ...fotosUrls];

        const dadosDB = {
            data,
            hora,
            numero_ait: lerCampoRem('rem-numero-ait') || null,
            placa,
            modelo_marca: lerCampoRem('rem-modelo-marca') || null,
            estado_conservacao: lerCampoRem('rem-estado-conservacao') || null,
            motivo_remocao: lerCampoRem('rem-motivo-remocao') || null,
            cr_guia_recolhimento: lerCampoRem('rem-cr-guia') || null,
            responsavel_guincho: lerCampoRem('rem-resp-guincho') || null,
            numero_ocorrencia: lerCampoRem('rem-numero-ocorrencia') || null,
            operador_cotran: lerCampoRem('rem-operador-cotran') || null,
            fonte: normalizarFonteRelatorio(lerCampoRem('rem-fonte')) || null,
            dados_solicitante: lerCampoRem('rem-dados-solicitante') || null,
            endereco,
            pesquisa_furto_roubo: lerCampoRem('rem-pesquisa-furto-roubo') || null,
            policial_responsavel: lerCampoRem('rem-policial-responsavel') || null,
            resumo: lerCampoRem('rem-resumo') || null,
            agentes: lerAgentesRem(),
            vtrs: lerVtrsRem(),
            agente_responsavel_ait: agenteResponsavel || null,
            matricula_agente_ait: lerCampoRem('rem-matricula-agente') || null,
            supervisao: lerCampoRem('rem-supervisao') || null,
            matricula_supervisao: lerCampoRem('rem-matricula-supervisao') || null,
            data_relatorio: lerCampoRem('rem-data-relatorio') || null,
            criado_por: agenteLogado?.user_id || null,
        };
        if (fotosRemocao.length > 0) dadosDB.fotos = fotosRemocao;

        if (editandoId) {
            const { error } = await db.from('relatorios_remocao').update(dadosDB).eq('id', editandoId);
            if (error) return mostrarNotificacao('erro-modal-remocao', '❌ Erro ao atualizar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório atualizado!', true);
        } else {
            const { error } = await db.from('relatorios_remocao').insert([dadosDB]).select();
            if (error) return mostrarNotificacao('erro-modal-remocao', '❌ Erro ao salvar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório salvo!', true);
        }

        fecharModalRemocao();
        carregarHistoricoRelatorio();
    } finally {
        if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = '💾 Salvar Relatório'; }
    }
};

window.salvarRemocaoAbandono = async function () {
    const btnSalvar = document.getElementById('btn-salvar-abandono');
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando...'; }
    try {
        const placa = lerCampoAbandono('ab-placa').toUpperCase();
        const numeroAim = lerCampoAbandono('ab-numero-aim').toUpperCase();
        const data = lerCampoAbandono('ab-data');
        const fonteSel = lerCampoAbandono('ab-fonte');
        const fonteNumero = lerCampoAbandono('ab-fonte-numero');
        const fonteCustom = lerCampoAbandono('ab-fonte-custom');
        const fonte = fonteSel === 'Outro' ? fonteCustom : fonteSel;

        if (!placa) return mostrarNotificacao('erro-modal-abandono', '⚠️ Informe a Placa.');
        if (!numeroAim) return mostrarNotificacao('erro-modal-abandono', '⚠️ Informe o Nº do AIM.');
        if (!data) return mostrarNotificacao('erro-modal-abandono', '⚠️ Informe a Data.');
        if (['GRP', 'Atendimento N°'].includes(fonteSel) && !fonteNumero) {
            return mostrarNotificacao('erro-modal-abandono', '⚠️ Informe o número da Fonte.');
        }
        if (fonteSel === 'Outro' && !fonteCustom) {
            return mostrarNotificacao('erro-modal-abandono', '⚠️ Informe a Fonte manual.');
        }

        const editandoId = window._editandoAbandonoId;
        if (editandoId) {
            const { data: regAtual } = await db.from('relatorios_remocao_abandono').select('created_at').eq('id', editandoId).single();
            if (regAtual && !isUnder24hRel(regAtual.created_at)) {
                return mostrarNotificacao('erro-modal-abandono', '⚠️ Registros com mais de 24h não podem ser editados.');
            }
        }

        const fotosUrls = [];
        for (const f of abFotosSelecionadas) {
            const ext = f.file.name.split('.').pop();
            const caminho = `remocoes-abandono/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: errUp } = await db.storage.from('fotos').upload(caminho, f.file, { upsert: true });
            if (errUp) {
                mostrarNotificacao('erro-modal-abandono', '❌ Erro ao enviar foto: ' + errUp.message);
                return;
            }
            const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
            fotosUrls.push(publicUrl);
        }
        const fotosAbandono = [...(window._fotosAbandonoExistentes || []), ...fotosUrls];

        const dadosDB = {
            placa,
            modelo_marca: lerCampoAbandono('ab-modelo-marca') || null,
            numero_aim: numeroAim,
            data_aim: lerCampoAbandono('ab-data-aim') || null,
            data_publicacao: lerCampoAbandono('ab-data-publicacao') || null,
            motivo_remocao: lerCampoAbandono('ab-motivo-remocao') || null,
            cr_guia_recolhimento: lerCampoAbandono('ab-cr-guia') || null,
            responsavel_guincho: lerCampoAbandono('ab-resp-guincho') || null,
            numero_ocorrencia: lerCampoAbandono('ab-numero-ocorrencia') || null,
            hora_inicial: lerCampoAbandono('ab-hora-inicial') || null,
            hora_final: lerCampoAbandono('ab-hora-final') || null,
            fonte: fonte || null,
            fonte_tipo: fonteSel || null,
            fonte_numero: fonteNumero || null,
            resumo: lerCampoAbandono('ab-resumo') || null,
            agentes: lerAgentesAbandono(),
            vtrs: lerVtrsAbandono(),
            apoio: lerApoioAbandono(),
            supervisao: lerCampoAbandono('ab-supervisao') || null,
            data,
            criado_por: agenteLogado?.user_id || null,
        };
        if (fotosAbandono.length > 0) dadosDB.fotos = fotosAbandono;

        if (editandoId) {
            const { error } = await db.from('relatorios_remocao_abandono').update(dadosDB).eq('id', editandoId);
            if (error) return mostrarNotificacao('erro-modal-abandono', '❌ Erro ao atualizar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório atualizado!', true);
        } else {
            const { error } = await db.from('relatorios_remocao_abandono').insert([dadosDB]).select();
            if (error) return mostrarNotificacao('erro-modal-abandono', '❌ Erro ao salvar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório salvo!', true);
        }

        fecharModalRemocaoAbandono();
        carregarHistoricoRelatorio();
    } finally {
        if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = '💾 Salvar Relatório'; }
    }
};

window.salvarRemocao279A = async function () {
    const btnSalvar = document.getElementById('btn-salvar-279a');
    if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando...'; }
    try {
        const dataRemocao = lerCampo279A('art279-data-remocao');
        const hora = lerCampo279A('art279-hora');
        const numeroAit = lerCampo279A('art279-numero-ait').toUpperCase();
        const placa = lerCampo279A('art279-placa').toUpperCase();
        const endereco = lerCampo279A('art279-endereco');
        const fonte = lerCampo279A('art279-fonte');
        const fonteNumero = lerCampo279A('art279-fonte-numero');

        if (!dataRemocao) return mostrarNotificacao('erro-modal-279a', '⚠️ Informe a Data da Remoção.');
        if (!hora) return mostrarNotificacao('erro-modal-279a', '⚠️ Informe a Hora.');
        if (!numeroAit) return mostrarNotificacao('erro-modal-279a', '⚠️ Informe o Nº do AIT.');
        if (!placa) return mostrarNotificacao('erro-modal-279a', '⚠️ Informe a Placa.');
        if (!endereco) return mostrarNotificacao('erro-modal-279a', '⚠️ Informe o Endereço.');
        if (['Atendimento', 'GPRO'].includes(fonte) && !fonteNumero) {
            return mostrarNotificacao('erro-modal-279a', '⚠️ Informe o número da Fonte.');
        }

        const editandoId = window._editando279AId;
        if (editandoId) {
            const { data: regAtual } = await db.from('relatorios_remocao_279a').select('created_at').eq('id', editandoId).single();
            if (regAtual && !isUnder24hRel(regAtual.created_at)) {
                return mostrarNotificacao('erro-modal-279a', '⚠️ Registros com mais de 24h não podem ser editados.');
            }
        }

        const fotosUrls = [];
        for (const f of art279FotosSelecionadas) {
            const ext = f.file.name.split('.').pop();
            const caminho = `remocoes-279a/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: errUp } = await db.storage.from('fotos').upload(caminho, f.file, { upsert: true });
            if (errUp) {
                mostrarNotificacao('erro-modal-279a', '❌ Erro ao enviar foto: ' + errUp.message);
                return;
            }
            const { data: { publicUrl } } = db.storage.from('fotos').getPublicUrl(caminho);
            fotosUrls.push(publicUrl);
        }
        const fotos279A = [...(window._fotos279AExistentes || []), ...fotosUrls];

        const dadosDB = {
            data_remocao: dataRemocao,
            hora,
            numero_ait: numeroAit,
            placa,
            modelo_marca: lerCampo279A('art279-modelo-marca') || null,
            estado_conservacao: lerCampo279A('art279-estado-conservacao') || null,
            fonte: fonte || null,
            fonte_numero: fonteNumero || null,
            cr_guia_recolhimento: lerCampo279A('art279-cr-guia') || null,
            responsavel_guincho: lerCampo279A('art279-resp-guincho') || null,
            numero_ocorrencia: lerCampo279A('art279-numero-ocorrencia') || null,
            operador_cotran: lerCampo279A('art279-operador-cotran') || null,
            endereco,
            pesquisa_furto_roubo: lerCampo279A('art279-pesquisa-furto-roubo') || null,
            policial_responsavel: lerCampo279A('art279-policial-responsavel') || null,
            resumo: lerCampo279A('art279-resumo') || null,
            agentes: lerAgentes279A(),
            vtrs: lerVtrs279A(),
            agente_responsavel_remocao: agenteLogado?.det_codigo || lerCampo279A('art279-responsavel-remocao') || null,
            matricula_agente: lerCampo279A('art279-matricula-agente') || null,
            supervisao: lerCampo279A('art279-supervisao') || null,
            matricula_supervisao: lerCampo279A('art279-matricula-supervisao') || null,
            criado_por: agenteLogado?.user_id || null,
        };
        if (fotos279A.length > 0) dadosDB.fotos = fotos279A;

        if (editandoId) {
            const { error } = await db.from('relatorios_remocao_279a').update(dadosDB).eq('id', editandoId);
            if (error) return mostrarNotificacao('erro-modal-279a', '❌ Erro ao atualizar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório atualizado!', true);
        } else {
            const { error } = await db.from('relatorios_remocao_279a').insert([dadosDB]).select();
            if (error) return mostrarNotificacao('erro-modal-279a', '❌ Erro ao salvar: ' + error.message);
            mostrarNotificacao('erro-relatorio', '✅ Relatório salvo!', true);
        }

        fecharModalRemocao279A();
        carregarHistoricoRelatorio();
    } finally {
        if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = '💾 Salvar Relatório'; }
    }
};

// ==========================================
// HELPERS 24H
// ==========================================
function isUnder24hRel(createdAt) {
    if (!createdAt) return false;
    const ts = new Date(createdAt).getTime();
    return !isNaN(ts) && (Date.now() - ts) <= 86400000;
}

// ==========================================
// HISTÓRICO RELATÓRIOS (paginado)
// ==========================================
let relPagina          = 0;
let relTodosCarregados = false;
let relCarregando      = false;
const REL_PAGE_SIZE    = 15;
let relHistoricoCache  = [];

async function carregarHistoricoRelatorio(resetar = true) {
    const container = document.getElementById('container-msgs-relatorio');
    if (!container) return;
    if (relCarregando) return;

    if (resetar) {
        container.innerHTML = '';
        relPagina = 0;
        relTodosCarregados = false;
        relHistoricoCache = [];
        const antigo = document.getElementById('rel-carregar-mais');
        if (antigo) antigo.remove();
    }
    if (relTodosCarregados) return;

    relCarregando = true;

    let indicador = document.getElementById('rel-carregar-mais');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'rel-carregar-mais';
        indicador.className = 'message system-msg';
        indicador.textContent = 'Carregando...';
        container.prepend(indicador);
    }

    if (relHistoricoCache.length === 0) {
        let querySinistro = db.from('relatorios_sinistro')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, 199);
        let queryRemocao = db.from('relatorios_remocao')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, 199);
        let queryAbandono = db.from('relatorios_remocao_abandono')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, 199);
        let query279A = db.from('relatorios_remocao_279a')
            .select('*')
            .order('created_at', { ascending: false })
            .range(0, 199);

        if (agenteLogado && agenteLogado.user_id) {
            querySinistro = querySinistro.eq('criado_por', agenteLogado.user_id);
            queryRemocao = queryRemocao.eq('criado_por', agenteLogado.user_id);
            queryAbandono = queryAbandono.eq('criado_por', agenteLogado.user_id);
            query279A = query279A.eq('criado_por', agenteLogado.user_id);
        }

        const [resSinistro, resRemocao, resAbandono, res279A] = await Promise.all([querySinistro, queryRemocao, queryAbandono, query279A]);

        if (resSinistro.error && resRemocao.error && resAbandono.error && res279A.error) {
            relCarregando = false;
            console.error('Erro ao carregar relatórios:', resSinistro.error, resRemocao.error, resAbandono.error, res279A.error);
            indicador.remove();
            return;
        }
        if (resSinistro.error) console.error('Erro ao carregar sinistros:', resSinistro.error);
        if (resRemocao.error) console.error('Erro ao carregar remoções:', resRemocao.error);
        if (resAbandono.error) console.error('Erro ao carregar remoções por abandono:', resAbandono.error);
        if (res279A.error) console.error('Erro ao carregar remoções 279-A:', res279A.error);

        relHistoricoCache = [
            ...((resSinistro.data || []).map(r => Object.assign({ _tipo_relatorio: 'sinistro' }, r))),
            ...((resRemocao.data || []).map(r => Object.assign({ _tipo_relatorio: 'remocao' }, r))),
            ...((resAbandono.data || []).map(r => Object.assign({ _tipo_relatorio: 'abandono' }, r))),
            ...((res279A.data || []).map(r => Object.assign({ _tipo_relatorio: '279a' }, r))),
        ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    relCarregando = false;

    const from = relPagina * REL_PAGE_SIZE;
    const to = from + REL_PAGE_SIZE;
    const data = relHistoricoCache.slice(from, to);

    if (!data || data.length === 0) {
        relTodosCarregados = true;
        indicador.textContent = 'Início do histórico';
        return;
    }

    const scrollAntes = container.scrollHeight - container.scrollTop;
    indicador.remove();

    const fragment = document.createDocumentFragment();
    [...data].reverse().forEach(r => {
        const tmp = document.createElement('div');
        tmp.innerHTML = gerarHTMLMensagemRelatorio(r);
        if (tmp.firstElementChild) fragment.appendChild(tmp.firstElementChild);
    });
    container.prepend(fragment);

    if (resetar) {
        container.scrollTop = container.scrollHeight;
    } else {
        container.scrollTop = container.scrollHeight - scrollAntes;
    }

    if (to >= relHistoricoCache.length) {
        relTodosCarregados = true;
        const fim = document.createElement('div');
        fim.id = 'rel-carregar-mais';
        fim.className = 'message system-msg';
        fim.textContent = 'Início do histórico';
        container.prepend(fim);
    } else {
        const novoInd = document.createElement('div');
        novoInd.id = 'rel-carregar-mais';
        novoInd.className = 'message system-msg';
        novoInd.style.cursor = 'pointer';
        novoInd.textContent = '⬆ Carregar mais';
        novoInd.onclick = () => carregarHistoricoRelatorio(false);
        container.prepend(novoInd);
    }

    relPagina++;
}

// Scroll infinito
document.addEventListener('scroll', function () {}, true); // placeholder
setTimeout(() => {
    const cont = document.getElementById('container-msgs-relatorio');
    if (cont) {
        cont.addEventListener('scroll', () => {
            if (cont.scrollTop < 80 && !relTodosCarregados && !relCarregando) {
                carregarHistoricoRelatorio(false);
            }
        });
    }
}, 1000);

function gerarHTMLMensagemRelatorio(dados) {
    if (dados._tipo_relatorio === 'remocao') return gerarHTMLMensagemRemocao(dados);
    if (dados._tipo_relatorio === 'abandono') return gerarHTMLMensagemRemocaoAbandono(dados);
    if (dados._tipo_relatorio === '279a') return gerarHTMLMensagemRemocao279A(dados);
    const id = dados.id;
    const under24 = isUnder24hRel(dados.created_at);
    
    const dataFmt = dados.data ? new Date(dados.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const dataRelFmt = dados.data_relatorio ? new Date(dados.data_relatorio + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const horaFmt = dados.hora ? dados.hora.substring(0, 5) : '—';
    const fotos = dados.fotos || [];

    const envolvidosHTML = (dados.envolvidos || []).map(e =>
        `<div style="font-size:11px;padding:2px 0;">• ${escapeHTML(e.tipo || '—')}${e.placa ? ` | PLACA: ${escapeHTML(e.placa.toUpperCase())}` : ''}${e.cnh ? ` | CNH: ${escapeHTML(e.cnh)}` : ''}</div>`
    ).join('') || '<div style="font-size:11px;color:rgba(255,255,255,0.4);">Nenhum</div>';

    const vitimasHTML = (dados.vitimas || []).map(v =>
        `<div style="font-size:11px;padding:2px 0;">• ${escapeHTML(v.nome || '—')} | ${escapeHTML(v.sexo || '—')} | ${escapeHTML(v.estado || '—')}${v.descricao ? ` — ${escapeHTML(v.descricao)}` : ''}</div>`
    ).join('') || '<div style="font-size:11px;color:rgba(255,255,255,0.4);">Nenhuma</div>';

    const apoioHTML = (dados.apoio || []).map(a =>
        `<div style="font-size:11px;padding:2px 0;">• ${escapeHTML(a.tipo || '—')}${a.prefixo ? ` | VTR: ${escapeHTML(a.prefixo)}` : ''}${a.responsavel ? ` | RESP: ${escapeHTML(a.responsavel)}` : ''}</div>`
    ).join('') || '<div style="font-size:11px;color:rgba(255,255,255,0.4);">Nenhum</div>';

    const socorroHTML = (dados.socorro || []).map(s =>
        `<div style="font-size:11px;padding:2px 0;">• ${escapeHTML(s.tipo || '—')}${s.prefixo ? ` | VTR: ${escapeHTML(s.prefixo)}` : ''}${s.responsavel ? ` | RESP: ${escapeHTML(s.responsavel)}` : ''}</div>`
    ).join('') || '<div style="font-size:11px;color:rgba(255,255,255,0.4);">Nenhum</div>';

    const botoesAcao = `
        <div class="message-actions">
            ${under24 ? `<button class="btn-action" onclick="editarRelatorio('${id}')">✏️ EDITAR</button>` : ''}
            <button class="btn-action" onclick="gerarPDFRelatorio('${id}')" style="background: #2196F3; color: white;">📄 PDF</button>
        </div>`;

    const fotosHTML = fotos.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${fotos.map(url => `<img src="${escapeHTML(url)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="window.open('${escapeHTML(url)}','_blank')">`).join('')}
        </div>` : '';

    return `
        <div class="message sent" id="msg-rel-${id}">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">🚨 SINISTRO DE TRÂNSITO</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">${dataFmt} às ${escapeHTML(horaFmt)} &nbsp;|&nbsp; ${escapeHTML(dados.caracteristica || '—')}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:4px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">Nº OCORRÊNCIA</span><br>${escapeHTML(dados.numero_ocorrencia || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">LOCAL</span><br>${escapeHTML(dados.endereco || '—')}</div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">
                <span style="color:var(--text-secondary);font-size:11px;">ORIGEM</span><br>${escapeHTML(dados.origem || '—')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">VÍTIMAS</span>${vitimasHTML}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">ENVOLVIDOS</span>${envolvidosHTML}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">SOCORRO MÉDICO</span>${socorroHTML}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">APOIO POLICIAL</span>${apoioHTML}</div>
            </div>
            <div style="margin-bottom:6px;">
                <span style="color:var(--text-secondary);font-size:10px;">RESUMO</span>
                <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(dados.resumo || '—')}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AGENTES</span><br>${escapeHTML((dados.agentes || []).join(', ') || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">VIATURAS</span><br>${escapeHTML((dados.vtrs || dados.viaturas || []).join(', ') || '—')}</div>
            </div>
            <div style="display:flex;gap:12px;font-size:11px;color:var(--text-secondary);margin-bottom:4px;flex-wrap:wrap;">
                <span><span style="font-weight:600;">SUPERVISÃO:</span> ${escapeHTML(dados.supervisao || '---')}</span>
                <span><span style="font-weight:600;">RESPONSÁVEL:</span> ${escapeHTML(dados.responsavel || '---')}</span>
                <span><span style="font-weight:600;">MATRÍCULA:</span> ${escapeHTML(dados.matricula || '---')}</span>
                <span><span style="font-weight:600;">DATA RELATÓRIO:</span> ${dataRelFmt}</span>
            </div>
            ${fotosHTML}
            ${botoesAcao}
        </div>`;
	}

function gerarHTMLMensagemRemocao(dados) {
    const id = dados.id;
    const under24 = isUnder24hRel(dados.created_at);
    const dataFmt = dados.data ? new Date(dados.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const horaFmt = dados.hora ? String(dados.hora).substring(0, 5) : '—';
    const agentes = (dados.agentes || []).join(', ') || '—';
    const vtrs = (dados.vtrs || []).join(', ') || '—';
    const fotos = dados.fotos || [];
    const botoesAcao = `
        <div class="message-actions">
            ${under24 ? `<button class="btn-action" onclick="editarRemocao('${id}')">✏️ EDITAR</button>` : ''}
            <button class="btn-action" onclick="gerarPDFRemocao('${id}')" style="background:#2196F3;color:white;">📄 PDF</button>
        </div>`;
    const fotosHTML = fotos.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${fotos.map(url => `<img src="${escapeHTML(url)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="window.open('${escapeHTML(url)}','_blank')">`).join('')}
        </div>` : '';

    return `
        <div class="message sent" id="msg-rem-${id}">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">🚧 RELATÓRIO DE REMOÇÃO</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">${dataFmt} às ${escapeHTML(horaFmt)} &nbsp;|&nbsp; ${escapeHTML(dados.fonte || '—')}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:4px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AIT</span><br>${escapeHTML(dados.numero_ait || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">PLACA</span><br>${escapeHTML(dados.placa || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">MODELO/MARCA</span><br>${escapeHTML(dados.modelo_marca || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">Nº OCORRÊNCIA</span><br>${escapeHTML(dados.numero_ocorrencia || '—')}</div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">
                <span style="color:var(--text-secondary);font-size:11px;">ENDEREÇO</span><br>${escapeHTML(dados.endereco || '—')}
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">
                <span style="color:var(--text-secondary);font-size:11px;">MOTIVO DA REMOÇÃO</span><br>${escapeHTML(dados.motivo_remocao || '—')}
            </div>
            <div style="font-size:12px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);font-size:10px;">RESUMO</span>
                <div style="color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(dados.resumo || '—')}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AGENTES</span><br>${escapeHTML(agentes)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">VIATURAS</span><br>${escapeHTML(vtrs)}</div>
            </div>
            <div style="display:flex;gap:12px;font-size:11px;color:var(--text-secondary);margin-bottom:4px;flex-wrap:wrap;">
                <span><span style="font-weight:600;">RESP. AIT:</span> ${escapeHTML(dados.agente_responsavel_ait || '---')}</span>
                <span><span style="font-weight:600;">SUPERVISÃO:</span> ${escapeHTML(dados.supervisao || '---')}</span>
            </div>
            ${fotosHTML}
            ${botoesAcao}
        </div>`;
}

function gerarHTMLMensagemRemocaoAbandono(dados) {
    const id = dados.id;
    const under24 = isUnder24hRel(dados.created_at);
    const dataFmt = dados.data ? new Date(dados.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const dataAimFmt = dados.data_aim ? new Date(dados.data_aim + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const dataPubFmt = dados.data_publicacao ? new Date(dados.data_publicacao + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const horaInicial = dados.hora_inicial ? String(dados.hora_inicial).substring(0, 5) : '—';
    const horaFinal = dados.hora_final ? String(dados.hora_final).substring(0, 5) : '—';
    const agentes = (dados.agentes || []).join(', ') || '—';
    const vtrs = (dados.vtrs || []).join(', ') || '—';
    const apoio = (dados.apoio || []).join(', ') || '—';
    const fotos = dados.fotos || [];
    const fonteDetalhada = dados.fonte_numero ? `${dados.fonte || '—'} ${dados.fonte_numero}` : (dados.fonte || '—');
    const botoesAcao = `
        <div class="message-actions">
            ${under24 ? `<button class="btn-action" onclick="editarRemocaoAbandono('${id}')">✏️ EDITAR</button>` : ''}
            <button class="btn-action" onclick="gerarPDFRemocaoAbandono('${id}')" style="background:#2196F3;color:white;">📄 PDF</button>
        </div>`;
    const fotosHTML = fotos.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${fotos.map(url => `<img src="${escapeHTML(url)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="window.open('${escapeHTML(url)}','_blank')">`).join('')}
        </div>` : '';

    return `
        <div class="message sent" id="msg-ab-${id}">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">🅿️ REMOÇÃO POR ABANDONO</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">${dataFmt} &nbsp;|&nbsp; ${escapeHTML(fonteDetalhada)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:4px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">PLACA</span><br>${escapeHTML(dados.placa || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">MODELO/MARCA</span><br>${escapeHTML(dados.modelo_marca || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">Nº AIM</span><br>${escapeHTML(dados.numero_aim || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">Nº OCORRÊNCIA</span><br>${escapeHTML(dados.numero_ocorrencia || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">DATA AIM</span><br>${dataAimFmt}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">PUBLICAÇÃO</span><br>${dataPubFmt}</div>
            </div>
            <div style="display:flex;gap:12px;font-size:11px;color:var(--text-secondary);margin-bottom:6px;flex-wrap:wrap;">
                <span><span style="font-weight:600;">INÍCIO:</span> ${escapeHTML(horaInicial)}</span>
                <span><span style="font-weight:600;">FINAL:</span> ${escapeHTML(horaFinal)}</span>
                <span><span style="font-weight:600;">CR:</span> ${escapeHTML(dados.cr_guia_recolhimento || '---')}</span>
                <span><span style="font-weight:600;">GUINCHO:</span> ${escapeHTML(dados.responsavel_guincho || '---')}</span>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">
                <span style="color:var(--text-secondary);font-size:11px;">MOTIVO DA REMOÇÃO</span><br>${escapeHTML(dados.motivo_remocao || '—')}
            </div>
            <div style="font-size:12px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);font-size:10px;">RESUMO</span>
                <div style="color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(dados.resumo || '—')}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AGENTES</span><br>${escapeHTML(agentes)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">VIATURAS</span><br>${escapeHTML(vtrs)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">APOIO</span><br>${escapeHTML(apoio)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">SUPERVISÃO</span><br>${escapeHTML(dados.supervisao || '—')}</div>
            </div>
            ${fotosHTML}
            ${botoesAcao}
        </div>`;
}

function gerarHTMLMensagemRemocao279A(dados) {
    const id = dados.id;
    const under24 = isUnder24hRel(dados.created_at);
    const dataFmt = dados.data_remocao ? new Date(dados.data_remocao + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const horaFmt = dados.hora ? String(dados.hora).substring(0, 5) : '—';
    const agentes = (dados.agentes || []).join(', ') || '—';
    const vtrs = (dados.vtrs || []).join(', ') || '—';
    const fotos = dados.fotos || [];
    const fonteDetalhada = dados.fonte_numero ? `${dados.fonte || '—'} ${dados.fonte_numero}` : (dados.fonte || '—');
    const botoesAcao = `
        <div class="message-actions">
            ${under24 ? `<button class="btn-action" onclick="editarRemocao279A('${id}')">✏️ EDITAR</button>` : ''}
            <button class="btn-action" onclick="gerarPDFRemocao279A('${id}')" style="background:#2196F3;color:white;">📄 PDF</button>
        </div>`;
    const fotosHTML = fotos.length > 0 ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            ${fotos.map(url => `<img src="${escapeHTML(url)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;" onclick="window.open('${escapeHTML(url)}','_blank')">`).join('')}
        </div>` : '';

    return `
        <div class="message sent" id="msg-279a-${id}">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">⚖️ REMOÇÃO ART. 279-A CTB</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">${dataFmt} às ${escapeHTML(horaFmt)} &nbsp;|&nbsp; ${escapeHTML(fonteDetalhada)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:4px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AIT</span><br>${escapeHTML(dados.numero_ait || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">PLACA</span><br>${escapeHTML(dados.placa || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">MODELO/MARCA</span><br>${escapeHTML(dados.modelo_marca || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">Nº OCORRÊNCIA</span><br>${escapeHTML(dados.numero_ocorrencia || '—')}</div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:4px;">
                <span style="color:var(--text-secondary);font-size:11px;">ENDEREÇO</span><br>${escapeHTML(dados.endereco || '—')}
            </div>
            <div style="font-size:12px;margin-bottom:6px;">
                <span style="color:var(--text-secondary);font-size:10px;">RESUMO</span>
                <div style="color:rgba(255,255,255,0.85);margin-top:2px;">${escapeHTML(dados.resumo || '—')}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
                <div><span style="color:var(--text-secondary);font-size:10px;">AGENTES</span><br>${escapeHTML(agentes)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">VIATURAS</span><br>${escapeHTML(vtrs)}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">RESP. REMOÇÃO</span><br>${escapeHTML(dados.agente_responsavel_remocao || '—')}</div>
                <div><span style="color:var(--text-secondary);font-size:10px;">SUPERVISÃO</span><br>${escapeHTML(dados.supervisao || '—')}</div>
            </div>
            ${fotosHTML}
            ${botoesAcao}
        </div>`;
}

// ==========================================
// EDITAR RELATÓRIO
// ==========================================
window.editarRelatorio = async function (id) {
    const { data: reg, error } = await db.from('relatorios_sinistro').select('*').eq('id', id).single();
    if (error || !reg) return mostrarNotificacao('erro-relatorio', '❌ Erro ao carregar relatório.');
    if (!isUnder24hRel(reg.created_at)) {
        return mostrarNotificacao('erro-relatorio', '⚠️ Registros com mais de 24h não podem ser editados.');
    }

    populateRelatorioSelects();
    resetFormSinistro(true);
    window._editandoRelatorioId = id;

    // Mostra indicador de edição
    const ind = document.getElementById('sin-edit-indicator');
    if (ind) ind.classList.remove('hidden');

    // Preenche campos
    const set = (elId, val) => { const el = document.getElementById(elId); if (el && val !== null && val !== undefined) el.value = val; };

    set('sin-data', reg.data || '');
    set('sin-hora', reg.hora || '');
    set('sin-numero', reg.numero_ocorrencia || '');
    set('sin-endereco', reg.endereco || '');
    set('sin-caracteristica', reg.caracteristica || '');
    set('sin-resumo', reg.resumo || '');
    set('sin-supervisao', reg.supervisao || '');
    set('sin-matricula', reg.matricula || '');
    set('sin-data-relatorio', reg.data_relatorio || '');

    // Origem
    const origens = ['Fiscalização de rotina','COTRAN','COI','CECOM','Solicitação de munícipe'];
    if (reg.origem && origens.includes(reg.origem)) {
        set('sin-origem', reg.origem);
    } else if (reg.origem) {
        set('sin-origem', 'Outros');
        set('sin-origem-custom', reg.origem);
        document.getElementById('sin-origem-custom-container')?.classList.remove('hidden');
    }

    // Vítimas
    if (reg.caracteristica === 'Com vítima') {
        document.getElementById('sin-vitimas-section')?.classList.remove('hidden');
    }
    (reg.vitimas || []).forEach(v => {
        addVitimaSin();
        const n = relVitimasCount;
        set(`sin-vit-nome-${n}`, v.nome);
        set(`sin-vit-sexo-${n}`, v.sexo);
        set(`sin-vit-estado-${n}`, v.estado);
        set(`sin-vit-desc-${n}`, v.descricao);
    });

    // Envolvidos
    (reg.envolvidos || []).forEach(e => {
        addEnvolvidoSin();
        const n = relEnvolvidosCount;
        set(`sin-env-tipo-${n}`, e.tipo);
        set(`sin-env-placa-${n}`, e.placa);
        set(`sin-env-cnh-${n}`, e.cnh);
    });

    // Apoio
    (reg.apoio || []).forEach(a => {
        addApoioSin();
        const n = relApoioCount;
        set(`sin-apoio-tipo-${n}`, a.tipo);
        set(`sin-apoio-prefixo-${n}`, a.prefixo);
        set(`sin-apoio-resp-${n}`, a.responsavel);
    });

    // Socorro
    (reg.socorro || []).forEach(s => {
        addSocorroSin();
        const n = relSocorroCount;
        set(`sin-socorro-tipo-${n}`, s.tipo);
        set(`sin-socorro-prefixo-${n}`, s.prefixo);
        set(`sin-socorro-resp-${n}`, s.responsavel);
    });

    // Agentes
    (reg.agentes || []).forEach(ag => {
        addAgenteSin();
        const n = relAgentesCount;
        const selAg = document.getElementById(`sin-ag-sel-${n}`);
        const inpAg = document.getElementById(`sin-ag-custom-${n}`);
        if (selAg) {
            const opExiste = Array.from(selAg.options).some(o => o.value === ag);
            if (opExiste) { selAg.value = ag; }
            else { selAg.value = 'Outros'; if (inpAg) { inpAg.value = ag; inpAg.classList.remove('hidden'); } }
        }
    });

    // VTRs
    (reg.vtrs || []).forEach(vtr => {
        addVtrSin();
        const n = relVtrsCount;
        const selVtr = document.getElementById(`sin-vtr-sel-${n}`);
        const inpVtr = document.getElementById(`sin-vtr-custom-${n}`);
        if (selVtr) {
            const opExiste = Array.from(selVtr.options).some(o => o.value === vtr);
            if (opExiste) { selVtr.value = vtr; }
            else { selVtr.value = 'Outros'; if (inpVtr) { inpVtr.value = vtr; inpVtr.classList.remove('hidden'); } }
        }
    });

    // Fotos existentes (não re-upload — exibe aviso)
    if ((reg.fotos || []).length > 0) {
        const fpCont = document.getElementById('sin-fotos-container');
        if (fpCont) {
            fpCont.innerHTML = `<div style="font-size:11px;color:var(--text-secondary);grid-column:1/-1;">${reg.fotos.length} foto(s) salva(s) — novas fotos serão adicionadas</div>`;
            reg.fotos.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;';
                fpCont.appendChild(img);
            });
        }
        // Mantém as fotos existentes como URLs (não re-upload)
        relFotosSelecionadas = [];
        window._fotosExistentes = reg.fotos;
    } else {
        window._fotosExistentes = [];
    }

    document.getElementById('modal-sinistro').classList.remove('hidden');
};

window.editarRemocao = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao').select('*').eq('id', id).single();
    if (error || !reg) return mostrarNotificacao('erro-relatorio', '❌ Erro ao carregar relatório de remoção.');
    if (!isUnder24hRel(reg.created_at)) {
        return mostrarNotificacao('erro-relatorio', '⚠️ Registros com mais de 24h não podem ser editados.');
    }

    populateRelatorioSelects();
    resetFormRemocao(true);
    window._editandoRemocaoId = id;
    const ind = document.getElementById('rem-edit-indicator');
    if (ind) ind.classList.remove('hidden');

    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el && val !== null && val !== undefined) el.value = val;
    };

    set('rem-data', reg.data || '');
    set('rem-hora', reg.hora || '');
    set('rem-numero-ait', reg.numero_ait || '');
    set('rem-placa', reg.placa || '');
    set('rem-modelo-marca', reg.modelo_marca || '');
    set('rem-estado-conservacao', reg.estado_conservacao || '');
    set('rem-motivo-remocao', reg.motivo_remocao || '');
    set('rem-cr-guia', reg.cr_guia_recolhimento || '');
    set('rem-resp-guincho', reg.responsavel_guincho || '');
    set('rem-numero-ocorrencia', reg.numero_ocorrencia || '');
    set('rem-operador-cotran', reg.operador_cotran || '');
    set('rem-fonte', normalizarFonteRelatorio(reg.fonte || ''));
    set('rem-dados-solicitante', reg.dados_solicitante || '');
    set('rem-endereco', reg.endereco || '');
    set('rem-pesquisa-furto-roubo', reg.pesquisa_furto_roubo || '');
    set('rem-policial-responsavel', reg.policial_responsavel || '');
    set('rem-resumo', reg.resumo || '');
    set('rem-responsavel-ait', reg.agente_responsavel_ait || agenteLogado?.det_codigo || '');
    set('rem-matricula-agente', reg.matricula_agente_ait || '');
    set('rem-supervisao', reg.supervisao || '');
    set('rem-matricula-supervisao', reg.matricula_supervisao || '');
    set('rem-data-relatorio', reg.data_relatorio || '');
    window._fotosRemocaoExistentes = reg.fotos || [];
    renderFotosRemocao();

    (reg.agentes || []).forEach(addAgenteRem);
    (reg.vtrs || []).forEach(addVtrRem);

    document.getElementById('modal-remocao').classList.remove('hidden');
};

window.editarRemocaoAbandono = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao_abandono').select('*').eq('id', id).single();
    if (error || !reg) return mostrarNotificacao('erro-relatorio', '❌ Erro ao carregar relatório de remoção por abandono.');
    if (!isUnder24hRel(reg.created_at)) {
        return mostrarNotificacao('erro-relatorio', '⚠️ Registros com mais de 24h não podem ser editados.');
    }

    populateRelatorioSelects();
    resetFormRemocaoAbandono(true);
    window._editandoAbandonoId = id;
    const ind = document.getElementById('ab-edit-indicator');
    if (ind) ind.classList.remove('hidden');

    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el && val !== null && val !== undefined) el.value = val;
    };

    set('ab-placa', reg.placa || '');
    set('ab-modelo-marca', reg.modelo_marca || '');
    set('ab-numero-aim', reg.numero_aim || '');
    set('ab-data-aim', reg.data_aim || '');
    set('ab-data-publicacao', reg.data_publicacao || '');
    set('ab-motivo-remocao', reg.motivo_remocao || '');
    set('ab-cr-guia', reg.cr_guia_recolhimento || '');
    set('ab-resp-guincho', reg.responsavel_guincho || '');
    set('ab-numero-ocorrencia', reg.numero_ocorrencia || '');
    set('ab-hora-inicial', reg.hora_inicial || '');
    set('ab-hora-final', reg.hora_final || '');
    const fontesFixas = ['Solicitação de munícipe', 'Fiscalização de rotina', 'GRP', 'Atendimento N°'];
    if (fontesFixas.includes(reg.fonte_tipo || reg.fonte)) {
        set('ab-fonte', reg.fonte_tipo || reg.fonte);
    } else if (reg.fonte) {
        set('ab-fonte', 'Outro');
        set('ab-fonte-custom', reg.fonte);
    }
    set('ab-fonte-numero', reg.fonte_numero || '');
    toggleFonteAbandonoCustom();
    set('ab-resumo', reg.resumo || '');
    set('ab-supervisao', reg.supervisao || '');
    set('ab-data', reg.data || '');
    window._fotosAbandonoExistentes = reg.fotos || [];
    renderFotosAbandono();

    (reg.agentes || []).forEach(addAgenteAbandono);
    (reg.vtrs || []).forEach(addVtrAbandono);
    (reg.apoio || []).forEach(addApoioAbandono);

    document.getElementById('modal-remocao-abandono').classList.remove('hidden');
};

window.editarRemocao279A = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao_279a').select('*').eq('id', id).single();
    if (error || !reg) return mostrarNotificacao('erro-relatorio', '❌ Erro ao carregar relatório Art. 279-A.');
    if (!isUnder24hRel(reg.created_at)) {
        return mostrarNotificacao('erro-relatorio', '⚠️ Registros com mais de 24h não podem ser editados.');
    }

    populateRelatorioSelects();
    resetFormRemocao279A(true);
    window._editando279AId = id;
    const ind = document.getElementById('art279-edit-indicator');
    if (ind) ind.classList.remove('hidden');

    const set = (elId, val) => {
        const el = document.getElementById(elId);
        if (el && val !== null && val !== undefined) el.value = val;
    };

    set('art279-data-remocao', reg.data_remocao || '');
    set('art279-hora', reg.hora || '');
    set('art279-numero-ait', reg.numero_ait || '');
    set('art279-placa', reg.placa || '');
    set('art279-modelo-marca', reg.modelo_marca || '');
    set('art279-estado-conservacao', reg.estado_conservacao || '');
    set('art279-fonte', reg.fonte || '');
    set('art279-fonte-numero', reg.fonte_numero || '');
    toggleFonte279ACustom();
    set('art279-cr-guia', reg.cr_guia_recolhimento || '');
    set('art279-resp-guincho', reg.responsavel_guincho || '');
    set('art279-numero-ocorrencia', reg.numero_ocorrencia || '');
    set('art279-operador-cotran', reg.operador_cotran || '');
    set('art279-endereco', reg.endereco || '');
    set('art279-pesquisa-furto-roubo', reg.pesquisa_furto_roubo || '');
    set('art279-policial-responsavel', reg.policial_responsavel || '');
    set('art279-resumo', reg.resumo || '');
    set('art279-responsavel-remocao', reg.agente_responsavel_remocao || agenteLogado?.det_codigo || '');
    set('art279-matricula-agente', reg.matricula_agente || '');
    set('art279-supervisao', reg.supervisao || '');
    set('art279-matricula-supervisao', reg.matricula_supervisao || '');
    window._fotos279AExistentes = reg.fotos || [];
    renderFotos279A();

    (reg.agentes || []).forEach(addAgente279A);
    (reg.vtrs || []).forEach(addVtr279A);

    document.getElementById('modal-remocao-279a').classList.remove('hidden');
};

// Pesquisa na tela de relatórios
document.addEventListener('DOMContentLoaded', () => {
    const inputRel = document.getElementById('input-pesquisa-relatorio');
    if (inputRel) {
        inputRel.addEventListener('input', debounce(async function (e) {
            const termo = e.target.value.trim();
            const container = document.getElementById('container-msgs-relatorio');
            if (!container) return;

            if (!termo) {
                relPagina = 0; relTodosCarregados = false; relCarregando = false;
                carregarHistoricoRelatorio(true);
                return;
            }

            container.innerHTML = '<div class="message system-msg">Pesquisando...</div>';

            let querySinistro = db.from('relatorios_sinistro')
                .select('*')
                .order('created_at', { ascending: false })
                .or(`endereco.ilike.%${termo}%,numero_ocorrencia.ilike.%${termo}%,origem.ilike.%${termo}%,resumo.ilike.%${termo}%`);
            let queryRemocao = db.from('relatorios_remocao')
                .select('*')
                .order('created_at', { ascending: false })
                .or(`placa.ilike.%${termo}%,numero_ait.ilike.%${termo}%,numero_ocorrencia.ilike.%${termo}%,fonte.ilike.%${termo}%,resumo.ilike.%${termo}%`);
            let queryAbandono = db.from('relatorios_remocao_abandono')
                .select('*')
                .order('created_at', { ascending: false })
                .or(`placa.ilike.%${termo}%,numero_aim.ilike.%${termo}%,numero_ocorrencia.ilike.%${termo}%,fonte.ilike.%${termo}%,resumo.ilike.%${termo}%`);
            let query279A = db.from('relatorios_remocao_279a')
                .select('*')
                .order('created_at', { ascending: false })
                .or(`placa.ilike.%${termo}%,numero_ait.ilike.%${termo}%,numero_ocorrencia.ilike.%${termo}%,fonte.ilike.%${termo}%,resumo.ilike.%${termo}%`);

            if (agenteLogado && agenteLogado.user_id) {
                querySinistro = querySinistro.eq('criado_por', agenteLogado.user_id);
                queryRemocao = queryRemocao.eq('criado_por', agenteLogado.user_id);
                queryAbandono = queryAbandono.eq('criado_por', agenteLogado.user_id);
                query279A = query279A.eq('criado_por', agenteLogado.user_id);
            }

            const [resSinistro, resRemocao, resAbandono, res279A] = await Promise.all([querySinistro, queryRemocao, queryAbandono, query279A]);
            container.innerHTML = '';
            const data = [
                ...((resSinistro.data || []).map(r => Object.assign({ _tipo_relatorio: 'sinistro' }, r))),
                ...((resRemocao.data || []).map(r => Object.assign({ _tipo_relatorio: 'remocao' }, r))),
                ...((resAbandono.data || []).map(r => Object.assign({ _tipo_relatorio: 'abandono' }, r))),
                ...((res279A.data || []).map(r => Object.assign({ _tipo_relatorio: '279a' }, r))),
            ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            const error = resSinistro.error && resRemocao.error && resAbandono.error && res279A.error;

            if (error || !data || data.length === 0) {
                container.innerHTML = '<div class="message system-msg">Nenhum resultado encontrado.</div>';
                return;
            }

            [...data].reverse().forEach(r => {
                container.insertAdjacentHTML('beforeend', gerarHTMLMensagemRelatorio(r));
            });
            container.scrollTop = container.scrollHeight;
        }, 400));
    }
});

// ==========================================
// GERAÇÃO DE PDF — LAYOUT FIEL AO MODELO OFICIAL (JSPDF PURO)
// ==========================================
window.gerarPDFRelatorio = async function (id) {
    // Imagens embutidas em base64 (mantidas originais para funcionar offline e mobile)
    const _LOGO   = "data:image/png;base64,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";
    const _BRASAO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOQAAACcCAMAAABY+PcTAAADAFBMVEX///8AAADcthDDDxGMDhMKU4jy9ftZEBK/lgC0lBDMzMyGhIO2tbQLRSLvfoFmZmaMchCjpqaohhDTISIOH06ZmZlBcJNPTk0RSnOWioXOh2iZeBCYRSe/uKM+RD1LQUDlKzKWk4cAa7UdHR3m5eWGfHzlChYCfjCjcVYzMzPFxMMMFRG8paVNMC+TIh/fAAUCY6b/qn6ei1F1c3J3Yw4qLzL/zADW1tbpWV2KbVzNyMWWXFbv7+7TqAYTMxw5UGPzpaXxIiSumUyyDBThCRcyEhL/zMxbW1lzDxMHZil5gosAWqbmmmsAcMH///+soJoAZL7tCRYRDQrtbXC8vbyQUz0KJGCtrKvkISSyIyT/tocYERDd4N9qQzSMjItva2pmMzOZhCG/nRHxk5UxIyMoLCb74eLmPkNzZT09OjoAmTOgDRPRChSXdXWOWxGadikkYYv4CBXmugzQqhDgBxBXHR4JWCRmYlwvWXoHWpaZMzN8e3pbeY+wpHpaTlL3vb4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADFy8avAAAAAXRSTlMAQObYZgAAMpdJREFUeNrVfXdUW1e674dQQQWBJCTRESCaKMZgDNgYTImNS9ziuDB2nGRK2kxe5t55b959d933x1tr/rh3Za25a0rKTDLjJB7HThzXxMaYYhtswHSERBNNIIEKQgX1wtvnSFQ7GeNYnsxe9tE5+7T929/e3/f7vr33IQB+4OmoPvT8931G4A8d5HzqgwRWidzxfZ4R8IOXJBH/6Zyw/DNIUqhD/x37RHIyeZ98s9yb8feTRJ4MQLOadiZIf+AghZy9G4wmBzgWRmQLtJ03Ds3J4WhxvOx4z9+/177bCI2OtoSuCM0PGyR7Wio1BdqKcnd3Bv6CdyPQBQrInekJbXY+xs33iuzR0YP0rdFG3Q8OJG3/cvvSZW3vT0oyTu6G8FFNI2WPZkf8BlXWTcMLKyR52PFtGNI94Exl3eEXNf6wFE/+qOUFScfyMT2gspqapAeQx266Vg4Y/E0WqCMut0DaLyfBrmh61MNC9np/WwrPPFlpCP4BOQQbLgzQlo9foNIWcnomJqiHNF89T7uRNzFx8ArtzvOu5Ssof7pwQdj5rc2CiTYFl34ozVW48K9dDog+dYv3Y/Gy1h92S3KmipLkJsN29cQ264bWXXp5IIGjX26hgc5fihvRDdwAylqbuP2yOOdDTMlatD8MkC89CJzS51gqhicLG7XLasXpcBYrEmpf5xtulEX+OYAjVUreah2ULGMsOtb8YF/6hpGNBWTjL/tsKx/JnfjX+G92dakTIMKt+UGAlO0aKh8mWMSzhAmtT63kh5SpA8hkedkN133VQBWJlHlvbPewW29xHt+gJJCP9GIXkaXz5JRrJksIv7VEv9LwnzCECEy26Fv0SpoTChv/QYonPwaClhUC7cULtJLrhEMBMHwfyUen+RlMBtjcmKaZoJXVMzdQ0Z61Pwso0A4gqqbuXvgKyBHY+cOmJprVQzj0FdGw4vF8xnw+9ltLoO6AWtU/RJI0Fk2X/+eTG5SUBLwpOfdaM+8IS64ZewZpoWkpkbGaRmX+hYmS/JuvFGgiehnhJHSRKxWIAZLnbxqUAXu+kgq2jJXK/lekvckYaXH+stNkPLjCsBzNGhPhxC5hahfTnkGTP3OQwgJDUMA8wy5sH/ixZi8SG8qL1PRyp7O1sRs3iGLvW0JrJ7WvVB/tGMibHhhwKY0+kJ3TSqWLMBK5ZaL3nUJGbUW3Mcodv7fZydlfPVcuurCCIkSHjLG97HW4P5bgnJt81iBpAYaNUVGeGbGQF/WNBzQjHlQ6SXmLJqcn4xsTfzwka67lgGOWZe2eDWydM7xy0/BOXzzgkmwyGAwb9Ftc0riBgY69gfmbWtmXo9vM2+7KHD2ZK+xrfjKMyaPx3VBde4Gz2fas++T/loAE8RFs42UmrWrf3ikXWCelQHbGwsFJ+Oqdya9oYKXuukDg+/pkABx8b0f9rq8gNR2+goXd1VQLhKNzNWvUJ3c/WHvHqLuvGyqhWfPrqcBPn7EkD3M6jHYAjSadx8PLxuvLU3hPJRGBRJt07Z4qyQfjtV2fWrYIBki2dNGOPl+fbKqg9wzb45KSWgZk7ncKrTJ7RtXVHGgJWkPtgpXqqWzzpsBIE5k6HNuS2Kp7xiDzLkyckmAAwxYWuJFhGuAdcPnoqtQVAS4lKyH5GrNRuaV+YU5GJDtIMW6d0tcnjbIeILwVZh3SB1XYBwi1gpKwum0kCGpbU4+6LZJQLUk7lh7aIqC5jUld9mcL8sStPKGaF3jD/FLT3By07QENj6db5OSv6cE1l3NFlEKKnIuQPTccN20rSYQa0aRPkoNgd0XebDWP7h5LjYqsjZV72nJRQ761huywBb1V8ffzFORhFW2BFD+WNPSMQUYbNBqeJ0rxwi0SieRigYMPn2b3+k52pAGJkxodY7wW0yIYGKeUlPGvDo2SZBQvSJr0eY/WQHz7Jm3YnhBomTiaS2KSSUBrWfMOucWWeA6sJEdgkKgn+RYlsezeswX5AmjSMxgf0yR5GKNM6xmLghf+sETjjLHguqkdUG65vbA7qqJxoNUcGnqKkehrrkMbPfc3BDFr9roDg+MDaq3TAxyst4qn176EXtrJYACQsiKdMsHYQjK78ZmCpDUJNRH2z2CBNB5IAtX4vuHwavWybmTHAEk5VxIVKHNMK0m7Oyklkc16+fSCF2TCpd3RDYaK8eHjRF1oNcEZMZ0ahU5MPkRNI4ZTTFgVdqoUnuiRk/YGzTMFeVQi5LkjO4BIYlpBV17ktOdKJ5ZP722JhrvE+R5ZiUJr2F1dNOAKSZwOzBR8KRZ+KR7IIYyPblGWtT5/U5Vf6+FXtJbe55KAeeOht+iIWqyhSCKD5slC4iS/9tnSul5On3ChwYpA2mMCzB7uTN/92ZWnN9NAOK19q3nImYroQNBQWAQpsnnv18fZYsq/iC5vbqio/Rncj9MFctymE/RIj8hKgvOPCIYQuYMMUDHBuSW86UBHw7N2tSw09QzBCq9OFc5AijLUrF3doXRJQEqofK/CGfp8FGm6oEU729tHY/T0hKgtxppIpUE0EP5X2JvWVfK1qLtWNtycgwApHn5L3HyOKcqMFO/kGKEvQPesQYLDnDlDcuaO6EEVpLIyIwZXnd0U6YSz5pw7WkOL6GLJeVFOrwfeukjeH+bQbhP1WN76pvjqruHovxWbd8YzxkuV5kyoHXzES7YpPSpzjhZUNGfZ8Ng/IsYT45mFIBofokABKuvc6pOnTJeqmkpiJttBTnpekv4VvINnYww7ZnEvYOFauRScSohNu3Sw8ZFK5Wj9C5QvgbnnzlzZF4Z/RPgjWueCEMijyHSC6KzBNSHukS07tHPKBte0Ftz92v539BTjecpZOc9sD2CfDbjMM0oaDa07884YnGX9cQHiIz2kRzZGiWWX625iRQBDLih2lfY+e5A7CzrAmkhiRkRQOrW5kjWteWIuVKJ1a53wTtREgKdVK5X+/Iuc4KbxcZkjxDYhFbTsihoP/+s7LU4pVPTYJa6pRzlztvD0gXSBau5ypDHyo/IvSCfZrIiftDufIcheBJKz70xyz3RhZLJBsrYnqIdQYV6YcLUMVCSNHyhvC3ClUanxKFGpRJOVqJ8adpLmwgdo+/r734ra2brGiypibKFHbC42W/uCx9Ku7wC24kdEG1/jIBAi2liWZwcSnJogcnrQJJE4HHdavvbFWdoXdrbEKfNSCPqhUecEazjgBdUCSn0qVdhCOkm6e+x1vSRAsje2JzSC8lVB1+r743Njvjg2pbmYPFRq7wWuJAaoqi/YWclyRPYm02IUzw7kkVxZlNyYyFKmKHbFTkSv7lTlIB94hdFMjGh1LZAoJbUUVoZGwsswKZF75ui2LwyXWkPsepoku7ki9y8EffiqyEa8wa2OlFOc26+I7rEKGsM3Y8w8gTl2b16tszoPd+ifCcgiLYkUKms4pIaiYBMPppT87QnshZUwe13aV+B8RYtgiLq/IvdiRaw7ScXLqNkESItSUghZY5OO8fzxktT7lrTm2XfEHauiYyMuk8K051YAJ+cmU2QXUXzeByN6W/crd+0uyvQzAFmU4Zp/vSCHIGRNw+17Efb47uD79Nn+FztXqoRMtngg787+hF4r4fNGi0SqKFZNpk5eEGIgB4akNsu0brjytvtgp8lljF5N2DZJiWZeijYp+XymsMAEpKVQ+9SUYlNSd6RB9wxAvtRgnGGq1RIeL06+P2gj65YzWBsVwNM8DysaneK5DttIKcLn8PWgYlWzA5Q4SJO3BzollumFLKmFFLNabR2xqjdO7J801r5qpP4127UIslqW7FDnUQvlpHVJkvhkYbr/rITJSaxgw3xYSB2BfY6Wg3PQm14tY7xyYekyQfT2C86I5dtcwMno4WB7xjf+vGxQOUTBfNDyZYc/tgDmNh7/760x/LOWqoPtqqxhKMTbRrrByX4Pgl69/Qy06+5dajhwBYlEExmkkY/q50YFUzxbL2jsuaEN7qXUVnDFLV8+LLvBFxP4u6b5SJSh0cNL+XL3bEH18mXi0kFgFY8y779+RZZg22Wl3o0aqYzHZUkxB7J7AjmlE8Ke9RT3yWidcD4PJmfykCSzwjuh0ANAaE6fw+jIfBKZ/213qbZ1eW6XSw+LCSApnvjWy6CvD3JgWh8evxU1GEVnlZX/WZn3DIuGN/xm7Uuf+L+5wit9i30IkWZxUyXMo13mrj5ohW8vPHySRQgeFekWMr5z0sot1HInDZU6djWjEsBQZaV+kOM7dZU9ibIgdp2jW082Pqn00kr0370RVexmqMY72rt/57ZSgLzBO4a2PzOZK0YiVXhafaVrM7ABwwOiy5fgIMGnTCM2bMR+wrzv8zNIAR4AwXdtRXBcAJXYQRZIvvu2yQyQVHLmNxfGzCwyllu3bs3OikSiu6tR7sDe0Ggno+3Gn1ip7V2+MOylPuynBdWA/0GKlnf/2IZULCoKJlVgfuddfM/XkC6B/n6Y5GUBjkoVNf9a8qjpi3b27CqUbixu92bNV6gu2JgoD3ifPARVSIa65IOOE/4HWbe8+yuE0bR4sAuq4DtG1/jp45PpKGWEc3oLw7EL+aKUtgcefSG/cOSuSqVdfe8f4D/0MoDC1LPUs9fwnF/ARySA8PZLBZ3+B1l4XuJ1f1ekc04MMHXLd94YtrW3zch5YAf9n50iDJJKETdJx+tnOxSal6JEdQVo8/rBbp3Z611XGbGWW9tXdXAnE66+cNKq8T/I9vSjR9M5Xoba7v0pQpsb70Lfd6sEvjQhPXPCw+e/PXe1MxfLMeipKbjizCf8rkOW4JMlcRxtuntg2wICV8Y7CzBRjXVJoF6KgkqH3pzjd5BFVfDuu9h4FpaO49tOeDMLjJiK/TYj6UMJvM8xKzOVB7FdKI9/ODkS1yKVfyU5Mvmfp/u0K5anHWVCITY6IjhorWrPhFB1FZLpf2EyfZDgd5AeKuqLPk2KGBeu99oeeEfxdj8aompWGbOix2kTOioV+fiJ//JFbgyZG4OOb4MVxiQdLoEVEyX/5iWoipM1/8SKcg+ykD0pd/kdZP8N1DRXa9KczXmYlWQ+GqEqXDjWtUp7vntUx36foFLdjU4u9GYdulkedKcZ+BiZEEV47XC4FAoxrRZRZYVLC2n9kwgl9aMyrJsK/Q3yLSNwjLuKV2aNz30LPJT4s8Kvz8HG1vBlIfGLlRLYZtOlnxxbLG3LXuvGbp7XfmrwFpx+ctQA1m7MCbtMhaqBOjb7EpzVbv6bXTfrd4JeFEYEJaltJAapOF5wtLzLkABUtexHGpCdUjO1jGWMvaqsZmLxQH8fbIzoCuJiZ8yMET76ZQwKaGBLbW1KX+oDUuNCRjC6ezRYTU8GJmW6pTkvgQhJwwmQ2D/YmZmZet1aRhKHRAgHJgXiaad/JanDhsTTfYIMQrpgt1Qq1UMXbjRXynFTeroyfewDdGJjV9fWsFVWMMrEBPb5IrpO6hvTlHCRK/YF3jsPI7Vy+WJnCfTLdGBNlUILwZl6Fqw/IlJx+phUOEOO9LerpQqROKOmclxIkhrjKKIG2VFR/cEiywIPkCTNpN7paYLZbKZcsk9Mz+B3zGykIgUyhPLBK0lg3LZwwTGi4Cus8sxpVHjG5khqUBFyaBJjahGjEmWMdoKDnOWCaBeVO/Zc1xEgGeORNxCB9XtNybjOvyD/pV3DnLBvqo/SYHzVBqa9cy5X8OZ520JHkpp58RhXQ0/acDY+4QZQg2yooUbMwOsLWV/kB3lsYUUudh8OEsIKnK6O4u23SjPjPe0mrsqiPz/icGBeUQrXDtCQPGYByOgeGumfHvWU98V4Lmdiw35iswCq5aduDflZkgMbeVu3TIZOYCD5LhtYtXMbQ88Hsm0LxqaoKar6yyya+1NyQV1axJgN9cWZmaP0cFOjVXRRmU/7NKjliIYBqqFMjSauFdI1CWB3uWK4kB6niVccliH8YWfCAGT5LinqdYqqSCFKjYlhTHIahhHEwTH1JyI/dtj9DJIeDZ9uuRtgwEHGTMOOjGRx76sXM40BRr2gK4uK6Uthgi2cqY4lWwfhaHtXuC2IEW8XohNChrU6jqG6mxKZyGw8NLfszo6Kmfxx9jwCSVOzQCcP6sDs5+EFEkr9PBnoDXhw4OxLYc0vNnFzZDb/mhDEd7B4WuvLOJ37BIpC3q1r3/du4TCiPM40/BJyvRapE0eUUq3d+DqPl9K2gIgQU0bFrIEcI6y/4ky822ARYzZRRvU6GCM+noM6JdZkdSXYborXRVMcA4mkGxnJs6lz1AMNzEstHD9HBqLwUjV7SUlGkx1OV9bSfl+5wbwATLUVz+4+gIjpNVclUiDSS/JKZLl14XVOT84i48xRttGRSywlZ5o6GG48KwSz/0vKhA0J+LQklIGeaADD0KGzHQjxwWqmsFfUDNp1DXA9gSSTzkuQX5DsPfhrHrTN4k85jdkQz99wUYqMQquCQCcjcYpECI2KGiU1l1UY2YsEdkoUUC2mHCkN86hnvNNaRHTEA+KXXlKPhyzzjXA2WKHYvPnslq7NmxPPng2uCHXxqw8cTPczGaDd3YL0zsdDMBStAY1oCNKS7VMEj4CgSrbo5/QnfFPPZNbcOOVUJq4favNJZshVelnCmCuOAYz5nTFNDoNG41aSBb4g1X0JxcJBLYuGmrZuy+dYniUJhFezGAxGwu14LoPbWLVgH2JBzJdKmZ8jA/8SI4F3YRPAqxg9RzZ5/At4E7KBlPQJGA/Bn3y+lkPeWD+7zeuTVFiBKpGSVvlczVPFOXyUtmxu9gWpfv3LEzmJi6OSHvwHkYJLmUsRl8+AaITwxqiahOf9HMii/SfyNTi+AE96GqrSrZXQBBIde3xTWnrscoSkbFt6bqOMWV2tU5GbnaRtwtVxGT7fF9bboPXGGSobRoINv/Wyotod3mnCU3CWtxT9k01WuSF01nPhpHGdqwrW3Vx/Ldekl220/gXp1zmNxmgDSgdbOlk2FsLI4wZqGC300urxxADZA2QuGC5zYOfe0dncbzJJWLNVqdn1G+zu2bgV7NZMcGxpncK9w7DLPI8UnaN1LWw96z0d2xAb71W+okB7t9PdrNIz02PWPZlnvZLMR4KEv95AxUQo0rNQ6ZIcMIs3p9NgDaTmQ/Ov7DExg79qw2QiEm6zlm2zViAh6upnE7bHvOyOmwtdwQ/vFvZesVZZcPlZgxcHOAZHvb8nHAfD2aDDde44lP0H9Y3DHD5QzesVzHolWW7g8SYneNcdkCpUw40SOWz0QGgmjHEJkoVp0m3VsfTOOERmpkqCZjhq6uJttaXJtykEjUYz37XXR+swjASCJEdo57ZvxX3gOKqKkoS0TZ7B101dGf2o/YcME6m6llTkwu5uuvaSStWtBz9Lst0SGCiJ2T6Pe86BP24CynWolwCUPdBVJNnn0380I+HjSTujuVAcR61lMmvJbbOFlGavnuFHrSDWdwvSVgQ362YpG6Nw2tjqy5FfehHTSAVd4CzX4Qp1k3lqZh/4GyTbwbZG7MPYMSkGWpD6ESeGBpXV19eDuJkMiZ6rgiXNkvPi6M0Ldrd7/6UXNJ4p/sPDB6rX8SU7upoE3FXePa+VYBfdGlm8gAQYUagcOFA/elUwDcF/KYImgnxdQYEnaq5Rz7fbGA0yJxyuUAeOIoGyWTVl9cT8GU8gSJ9vp0QErXCaISIsbn5+Po4QsZznc5rxXe44pnG7FeG4AGe6J3CVhJxm37VUWydGD9QNTsZ2SfCDgILJ5K5NmY1hCv9K8vAWbMmYANGR1D6YQ1U6FA8IYx7kGaCsbA7S10QkvU332572AaZpyNkVXs7TkcwuXB1dJiZk4zrnIOwEjYMcoJhTB1mhIMbPzdX0MdpkDABs+aDa8wCAghhKvSFPIpFU/rQe+qDpbcbjP4yfWIHqhDoxUYjHvyqFhcOha4YIcdsacKnKU+0KZ6LKUsCTpHWBLCoJ2TEjE5Mt2ABVSCtiPRmoO0ZXYtFJSR8TxjzQaOevo+3zkBK5FBM13RtHZWJ4dWsUJz4YUI00bAvRHo5202ij1CcAuS4vRFDNhwLcLwAzsbgeeUJfgqESG8tiGtHWahgXrKvS+AERE0i7gJuzoNUc7RB27lw98OjCmS8xDZH+50mmHEWa837q6pEYP0jyjK01PpWjcmMRmvD6MvGQ3cCslEh8Q5UgqWQmLFDWsZxKFXQBpDEezOB4OPPEav37q887cd66G9PB9eN1nWmd0rB0VMNO//bJcnaN7AoXMcdiI6LexK3WSi88pnfIAAlzYmY9L+/bCrNcn/cVlQMl21WrRgcrcd1//SAm1Jlw6GeNFdIQ4kq/mpAtUyTQplAQLsNGzdb66FCJl0Wmb93im36uccz9HSu2woQk2G/FQXGYt57l9Skx9DEaw2dC6FSODsbzMCZEZyKbHGAVRTG2Riw82I6Mp9SffbL34OjsvHUD0noTqAFBzNLg3bvpvnGe9FbOYzRX7yW5X6ZVIOvowpVNbke5EYx7m9Gp5/rgRMJvo2JlcOhSOTo1q91gHRDyYXYEGoUF8NCY4VMGOa9OiGze/ilAwYv4sLbEh02yNJaFhHz37zwkoOS2j9QFqA/A5ULhVfzgJNKhn1x/HfXK7eMiatvJz5DSOROnQzZE1HoJ6Kh9sAepdLk2l0qbXS/IdU5xYe1t4Heg9w5XTk5BYfWiWZ6s9HZNSWVr4NbHb0yYXllqe9hULtwdlVc+oJbXMbExu7SZbZgjmXoprLC2Apq1J2pf7ad29vtVkgDIT9qCQIb+qm/X8pSqlWNZaUrH41NLPOq1ePnSbcKUm3thP24ndPiThffgZ2K6FKmiM8z32BvW/xGQ9RL0C9gqXUh4F96FsqVxxF3LYyBTBfB9U/XV2DqGQhsbmyT8iRwbcUWk7g9Qhj344JEd87Ad/CxJ2NyBVcuZd0Y4SPFxmN55f+8uguRA0kNB32pM5+Obxd01hw+ZhAz2bZlWNAr7FR8lPMiG0Pu52LASRuapszf/fqf//iBJgA8nMSSYcp8N9+XeWOLMtQfX3CDLCNVLc9FGJqSibTWnCLoi3xDrmUZyRmhmiwDlqdYyQXK2LgPi61rMDp2e4RhJFQBbJzFXYq9kbG/fPObv5joJzdgUmmEL3lp3LapziZcNvDL52kPKReqUzgil2appeCB1bti33+l0DV3IHr8IadLbF4bQmVHT2nsc3eaxOgahsyPZ/n9KRKkD/3WwqBPJOwGJklFzuMPvkpwtbL6IfhQxmKP3q0W1gyxIBsKZ8S5wC7tX3/ANJIl/bHsLzHuNqgxgs2FU9ybAgyN/gf6gtwCmg/6bOb5GVVH0e1qo22ac85DUJ75jLR2ossJump4cF4eYQs600r+KR3gKZN45Z01pWN/o64NF3gp/xUT5qxD2+2vnuNA+hzmUjt2hcja1ox2goo2kh98VeAo7gl+ufUvsvECcYR26gV51Jra2pBKrtfogC5kCyAM5uPkGsnonQvwnSbcrv1XpnZv8aWwBPDSV7l3IPs9ae5PFYT/NPHT6HcFNG83OOof5yTenofA9ThSEnjcb4bcRa7/1cf36JmzAwIxsheVHc7StVKAW9IfRrZiXRTXCO7+Bm3u7pP6SpDsqFHKgHN/X1ePWg4OpVN8QkyQG9A/XWsbLES8TPqecTiIEnA6ds74cGvo52rwfYNWfft9KoES8HPGQR2ehflYHdEzE22c987gH2VlD9XqSZ3MmRXA4Ks9fzZUmmLcy5PDAS/Gsy0zAxUyHWWw1/lsPe8wO0lkzS28HKr45rT9NtdrR5rhdz/Ic1+uPw1lFxZpbRHAz3NqX+RHaXaD6sFVV+U5WwY1NScFXpEV+8ELyQ7gpGc0bxNH9hIV5r7P3c40GeOIY44wwpHBOQ0LOr6ajH+j21WpEGOGc70ZkxYU2LleQyOoisZKtrgEWoSdgQBTR7OCo1+gdTbgUdIaoxPHKXpAnPVTT1/cFuDpgTHnUxd3Z+zQlyU2khIXZuW9AedgeWAw6fjzpHUDjTEox3wk7ePUR9xpFVv30Tr0e37wynZ6ePjuKjnYSsKxp/UHNo93D+7/JHQeIeFiJzH9Vg5GfU/KwMHna4aeoeDS7xjOg7jwPXR29VC/cXX2oGxoRJbD+kcXEDeZfHnXzpTc6NwOFfQxRXvjjy+ftcITVOapjvQIfH2LBHwcqvjUOAasm1vrSKOy9e44K+8ZV5XX8rPNPU7t+GtF1Ek72QUbdzcKlOPNir9x1J1KGK5/0VnQw+hAThDaM7859fhw8//M/kdz091E/fg+O0z//7pcyuGM099rMTTc7GEyeOSpktI6vvft0++T8cXY0iNPCnAO2UZ430i+vqPfGCz7dNlUue1GNemgJUS4L4K659Z70p6MHOn7yAX1LtuB9vG1yraqfJimbfpI36vkZo2Pt9VifxNOx6DFP2NqCfGHRvUEJMoZCwj39xNMOfzjpX24dbI/UKkMcfF/0k+GNrfF2/ol7Nw0bT+NFyuWhQWsLrYoP6esijh4ebB4Vl/vuNDd3wbErjRAgEHvY3wZyPCws46HZkNFSGEhqrByM6SwB+VM2IdytUW+08DdCuuU5WOSawUyv5jmbS/fl2B71STah7LTefhzQRle+ZCUsyI7Am3o9Cx4abCy47tsJGlU1PII8Q8iVE9+YWwrY9sOPWfjH7JNHp7HmX/7Zto+OypcqcFIiyMId5QWVV7lKsI1yjbLQbSYivso6hvTM5aXMEXj5JtJEEWagPhT0H17cySY81L9hqA0V5uJfTs7DPBhZ+a1PEeQJOR57+ozwmxPBFhD0eXO7q2L+hP3GlM8zCJgfuQEpuxJYw9J0nxwCMWAzRT9HDVNWYsYCV4nKz9n45NG5pF7pmloxHToDRbo5i2vT7yILHhEDo3+UKP/Egjy+8rHHXJb2eDEefoo1+xwcu40qmRZhz73i61npOMGhBp+P5LsIqKgzVNKZ/NHC1fc2u6moLBQ2ttnjCP0sFbPvozJUFRE7QyHgnLVsTa2QL4DwOQnqAeaYq7y1KBP/H0tIaaK/o5N0QSroQjuemuIRzk/G9Bk3SLBxUOeOySkv5QF6AR7Gb6BGWVKGYufn52FgXqE4vCY2EDTrOja+gHSlysmOcX/tImBfg2JPLwQf6+uSdDcjUa/hgrccoAsciYhnid2bo9cWJaTraMjXcIitYJOnSTZ+vOSpgdTZnHKdc9JrOSTM8iwvnaLqcEXq7NhnrRPiFNPT5wBZ6KoxGancYOsmH+mwdRNeu5vspkyb81EtjKqqJppsbpbDYsul0Ve/DFvmrjCbNt8o532ZsrYonrlGJDyWoPb2pFOnm5Q8TcWzMhXCXW+HJ8rx3jSOmTRvmNC95zzQVg9VkAlIxcyxEONBnqR03FplnWcaIVHG2sk6txNzu6A/cdUKBKc32KD6cEMfLI+ct/jarQv/cF9TApO2jqDdEywt3BpZe8yEcS6uATfttW7IH4/FrZ1qVAO0560rrw6tsyag+qZ6UNNmx5X2U+FsWCEENKKLKAQrNoPkoqtsTZf0ugSZDVH0IR+2xuO+rxD4vhQmosrXMc/lCebW5TTP6TqwyUolXmotIBJnF+e6Idtt+Xq1cwgHso5TqAcOHUfX6KcwkkLTMTuBSjl+6ACFcjwLhP9jVXDP14FOGBXEjNFFvXNyevkFeCeo/Bn4VZIRFQtnGDGT88DahpeKldS0k54mxvtTOBIDN2GFJpFSJ+lmeoQM9buI6Qiy8EpYgRU6jAxEKLAsmEYnN62M2qh83xIN2RIP0LdoRGtcvvUmV3xKj5VglfpTkpsbLsJ8wHGub5yQzmiCkZ5x6WKQFXauNOHZw6/uhOlifHO0T+/ZW2Dl98v3gM1onIZjxcXHUP411aqwgFehb4AxRt/2xUFZa/maQuzJWEdzfYKZy5lTpVLQkAKtcXg/3B/RDrod5wKxSuePIM3Z+8uBZf3aAi19ZMRS+zCqysmxiP44wDbu+JIBmAkRXJFEDR47F9u/PAWU6fEqTHupfqS9UCPyja/3J/k05KDPqPbKEqf9CXJ8d58aKflUVyL24urE0HvIrvx0C1bpcgMmhw5d3NLFCw6r3dYdfAA3IXeS3eF3wZFLjrbiJqQ7GNCGNU+OWm5ZPg+RNNumS7ndUewDKfo61bsTL12KWz4v9SPIuBj6IA5o62UhYunBZmyluCIBo+3mLOzFzkDboifCbE090EV/M4PaxftpDkji3TfL0jLbOC72SHFG4cThvIzU0TczLJT7ixEQaZdPUk4dsFxa6PRio3nmfTGC8cX5H45jpMdeof4EdlJW6Jvwacd+TdYa3P9wVSNdG+gNuh4kLM7iuExMQhQV/aNiTjNqxcR+pbGqVQQ0lGfGnGbKHCT1blx8du6yqy8kMeW+GadQP+/xtf5l//K6Qyjzn+IBW/uiU4T10Ev4+/fXY4gjvWU5c2PxIxfBmTc/txtPXwT99GkKCxs93b4ftCIYscDN00Y7m4JO3oS+xbBRrXgFT89rXbIYELxz+Y2+ZIYZP2pXmPLd5MacIspBfATo2gbMDgT6Fhdp0nzTBPe3WYESisVd0WaOI4Uy1x18dg4NC76+bCVgm89pPpHo6MvdjAvYTPtFpRp+8aFSWA4s+LFPgjvXy13HN7kBvhHnYXPdiInJ6KBh0eLF+obwgkm8SEUgEW2YCzyd0koO/sQAexXmGVMeT6fqykYbdHIi2ktf2Q+WnbtMO977vF1xyhw85eXquuU5Wamjj7sA5km+GLGfOYZHAIqiEC1juR5UWNxnDnsISGU0Li0wZO3AyV1jUNDqUNEubKAPeWmrcrddxIldffqyDxxnxB/l+xsTLQGyxAJvn2xdGXLwI0jGYZd3EjgXuY5pU38rKtGZr+lDtwHz5rKFfkkWtl6FJp9f2v/39ptYm36RVuPFFhA+7e2OstYnKPCT9Ml0WOwhqAt9YD3R9BuTJBzT0xcPLAfDPy1d5ycRtZnLGBk6hPHozlPXFz/xUdBE9oo0CZ4RyNbFu0rQm4MuIfVzpgPvggSed8kD/qWD3/xyXV/oqO3HrQf+OXDhyTuif+enPHhfE7lEnLbjv2XjTwLyCRTPFlGC6s2hA0j5SMtczARhbqKScMRcoA2HyBj7KCK0RTGBmHpoLO17/K9XkFNxu7R/6x2M7iTBjoU7tTZEAkq8iidMocGNs1P882md/0EK44MonabBI65dkQ7SjDvWSL0oTB6SbwduV1o9tyaiXALFd4rwPzrQs+tW3GM+lXoDX9e9xdGGxP/vEl7w7xvjAn8x9aanF1eqU4bXR716VpM047T4GSRNwCrryJHbKx23eye2ufdeiKNCb3uP3ZxvJzX1MFosibEkBWOMmUvG/Pse4sZO7mM8VTogxZdBHI2RBtN0R6FO0ns0WmXpZFyafs4rSXVYeis+C0MZPTAXQT7U6z+QtJ+ok2YGYWwekhnDxdJ+ZVoyCfAVcCfuRENmpmazamzIY5gLKBmX78C8CUdmW6r77zdVyRzutSWBtFzZl59g6uWGjYykDNt0kOVV0VPx97K9Q9hBnRBMPGY8qND5C6RTIBsJRjQkZ/KuMU3DHSruw2pXydFBGt5jkhveHnOwnQsB2jnC1B6stnud0xsmvnvGtkos8H6thJGsgjFn8sbrW7KCEtoccuR7EDbj8d0ZoktLN1uG0du0BQkJAReHDeL1lHu9dpLFjCsQN71+WhOyKQveE2b74i5Jm73BifOsF4a6NiqIUM4YvLJE0BK+fcp2LWXHIic/pR4tHxuK6to44WV3QmxJDDYrIjLQGZAJ8PsU7G1R0LJdemF9hV4/GRDNGSMLPsvv3g0mfjcOUj0jr/IG3L42gJCVB4wWFSgJS+s4iwYZuTOPUrTS7DpY4khF8vTRhKHk+Dq9N1CQ77HgABMDFAL4BmdBSvS6zuSZVv+bEM28UxTGKBNx7hlIJqy5dofyOXPDuFoQ9YDO2bnBYSYbtCVVd3x3yC16UcfUMK1p5bh5dTD7tnXAtBSJPhFDAorTmgOWcSf2NdDQkGRCaE51ZlLgJEyqQ1AqmjWilyQ+EK+7yE/2tbOTHYGIHO95z1vqcKbg994ocOE1237LxEAkKE+RoL911acyaBQiuJyxIjzgvKcGnOmrJJJbQAbH6CjwqcE3iKHMIXdJGpLgOKyYrpU6tyIo6WcygMWVBA9O2EPUo1nBwcFdIqZJnZnpwHbz08lRqtatSeoQ9zlqQ8CqMLPTZrHYjjRjvMy29XObzbF6jYdHJPmiO5CQY78TVUbeOrQ1hWIyqdUOX6AgW7x1BiI+cSBRDtr8Kkkhx5RZs6MeyqAmvLwG9k0hmNhqVayyg71/cMKboqD/TkUDJBttNiG/eYd4HJt1+LDLIISCzvHdgfV5KllQ0JHfQWltSdri8paV8+00yFg2zRyGEeMM7s3uqHF6Do03PW2QJy5TY6d4UCmGWp/83xSDZsz2bzM3IQSeu/VcNz7zeGkdbLC3oKnvw+vwYQXyM9+GamMpNOwGnBt8eAiacqGjEuB3pUjBvgYDt9+oSX8YHZLgLbQxkEvHCj8J4ULwfKD3/RWQWW085f5TSbfsKYAsEnROv+lSccW1JXg5BPjQh6DfyTSBhm8MgpLpofBo00h29yNvD8ZD6PhoCVb4VAB85ccbAAOrT0tW1NBKEV4tbXCcaoZgTs3OEYDM38Mvxr2T+8ZRDb7+YUXmTOQfyPZDZ74PSOHsz64SIgNvvQ3YdMelYjQQd5sge+rivzUHm4aiXemD5YPR0K0B+A4O94jx/djvUOH4s+Z1x6fHjVk1OwLGBOfisYc3bltZhUgxGUkcYFps579nc82XLPyr9bcL+5YbUmZ/ohIJUmiKN4zzbIUzC0ZdsIyroQbZsLlgt4Cb7TXiT5ayb3FBUzCYAmNDOwIWbguCM5oFAYOJ7WmIqrv7a3+xZEEyEcLoyc6SoDPfX7sqHM477tJpMZ+5+KfL1HfoaM+SUGPW7j035YDEpgz6FN2yd0LU5o528qLjppgwA5qtYgv98aGJLShtDQ8Pv5ARbFQFujm9IRkyUKuHQycEfXzFHIvYbppR1xG5vkIEU2j8a8qESxZp71MyIYoecwrrFj+rHZtnmvnFwvPYGhxDFJ0ey85mKy4REkfpQCcBjciR3XPcShY0BMvokRNZ0XEzeOHpGuw/hkCMdnHk2JEXl9iCrEP2lLAxMnszuS38FiueqxU4tHnXDkoSr/IS802hmjw2Y3piK9aS9rXxmTjKTBp/rmPE1vt07aRmhGIgRmLCVE++Vr04qXZyYi4SeByESTOdmPhRYmJE534jsT9lxJZF9aj0VxSk50KDOsjU4V1xPI3RaBwpo4zgBG+aWePICg5NoE2INqvjw2+FUvsqdB8nxSFGkyhuTHEoG17sEhCeG4wfj3ETWU7KYBDeW6wll59TYx86/lAa+ZnCD2TAaTawq7McwTWEguT2RZR0w1TucJhq64wlQ93BIhHnheIJUV1QJ2s2W+0wZofFf6TkFjiCeBxlQsf94Lv5DaLEOCRRF021JXCayPlis4d+n87stiSDp8eyt0ZhChfZIezeiw0QlAh9wog2ewoTtdMZurflpwRSz6EiyJmxXetwKdfDeESpd15rMfBKGRc2uDL5Ppx0+oxBt7UbLNYwXYGSB7OO2eLgzfFTAt59suiBIzrWFZjWwDEbaP3pfRFFU0k0oKC7bofa+c27uqxp6qgIoY0annjNTs6fcpFc9BlxtIy//5P9DKGJNj5gMrgSuxd7dib//IOOiWIKokHxXbGKp00GcJMptrneHjdh1i1ypAHcrytWm24NPHcBQsaODyaPxy+468pHwLZzimW8HUkWBIwVTgeMDZXDCJALwYxZmwM3mR4XB1Oc4b/dHd2dPcWsKeg/8FtkJzRjIkFIS1ondZVFQib1akAglDqZgBfBmKP69OlLkraj5ef5YqzTOxwOUvgO1lfDAxGOTL51UecikZYpuOSpbQ4CV6kYlWbQ4ucDryXGc6ozzkVbBH+Onl1gz3UWGSR8EFNJQpuDM3+vkOT2dEVoCcnAHOQYtjVwXUiBkV3aKW5yiom+KMFgCiUhWH2LUB6dQaKYvEXIukY2ReiesiQZhfVvi1cZ4nGsZsFdgvmz38SuMuRczFF4Dkw3Qwy5YZ/Hb/ryRVY759YxCBjkzHI4TLhF5YXXCJKhRpDSIxUFJdYdxr5lEo2Z2EdwJtMCqQGwliMYX8n5MnuTO1ufKsjDhoVg01rWsgfEC3dwoGmKh2knjhanLphnfRX2IcxpoA0LCcYvbeEmGvBIHGKnGPV9mEBg10UtjDT4avKbtWXa0xsvbn2KIPOLZYLxJf6JE8/gxWnazn4MaGniB28oAHMAH8LqNfaLVAhucZfwfxsLxJ79zY7+1CWA3vGlNe8Hwe+iJ54eSCFpGCP+yJ03AvbZz+vArATMNXptIK1mD3aFuDHUFnrkd+7XPvgWd+KxUrDPU8PgJRv1kXFUvCLFqf2pH2LvX3o9/v5SSPxo+82npngCU49I04ZnOkNtYoOhvb3dYFCrQ8marI38mfv0akaIRHUnUmE3JNgd20qq956Jri5VJCgxfYEnmQGlRy/JkWOnon3XURwJivizsWnsSzxDi4c6Zk/UZUhUXzC/DGqTF0tHx22drjHf6w3JxNoEbqNgV4xG81RNyLdJWUkpvBeUa2xaziBQf9Y+gOpaXAslAGl48/J5VSvSuM/nRN7X9tQPoQIJSm37+Xvlk7NLPuKJ/inb/ovppKbvWUY//TFqZFZnOC4sUBHJY3IvYUskf4c6bu3i0oHaCtTdSjOrczsOKq2YxrEZd7bI/FUWv/1ZcbnOE27yTO23z3Ja29UJXRP0oimrayydjJLMQNE49owwJ4z16rZioo62rV/o4Db6qyj+kySDjk0ujs34Zk8/YzEWnD8+7/3006/h3mITfCmYPA6zGVCnfPOa9J8MZMjeqHmAuk0RbiDeXbJmRcOQ1AS0U+zfLF141JAGvTMubIL7vstm/xSG6CeQmdfJKV2wMUp3OvCl5Q/WNcG/65ymredWBGTdk1D7Sm5LFzgJdvM/W3NFutHURywfk7uUC/Mrco8Sab0reUrEyStEV/lYlL7bb3rnCT/2/ljpTEhyeZ05tnz16vOg2qvqlcdGKJcr6+LZ4D+M/gRJuwefESC+LnrFzKn8WFAleXauWPyY0QKRRwmfAavIfyXxY3PNnZoPmOeH8juXW2vRpAVjKKcur/hyadJMUc6dqE4HYQz+WdOvi19aPTKw8sebdnovKYJ/XpCPEZX8vyz4505HH8uT83Mh/j9wMXpDKQmk4QAAAABJRU5ErkJggg==";

    // 1. Busca dados
    const { data: reg, error } = await db.from('relatorios_sinistro').select('*').eq('id', id).single();
    if (error || !reg) { alert('❌ Erro ao buscar dados para o PDF.'); return; }

    // 2. Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-pdf';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:22px 30px;border-radius:10px;z-index:9999;font-weight:bold;text-align:center;font-family:Arial,sans-serif;font-size:15px;';
    loadingDiv.innerText = '⏳ Gerando PDF...\nAguarde um momento.';
    document.body.appendChild(loadingDiv);

    try {
        // Inicializa jsPDF puro
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Constantes de Layout e Posição
        const margemX = 15;
        const larguraPagina = 210;
        const larguraUtil = larguraPagina - (margemX * 2);
        let posY = 15;

        // --- FUNÇÃO AUXILIAR DE QUEBRA DE PÁGINA ---
        // Verifica se o espaço restante é suficiente. Se não, cria nova página.
        function checkPageBreak(alturaNecessaria, startYBordaForRect = null) {
            if (posY + alturaNecessaria > 280) {
                // Se estivermos no meio de um desenho de borda (rect), fecha a caixa antes de quebrar a página
                if (startYBordaForRect !== null) {
                    doc.rect(margemX, startYBordaForRect, larguraUtil, 280 - startYBordaForRect);
                }
                
                doc.addPage();
                posY = 15;
                
                // Retorna o novo Y para continuar desenhando a borda na nova folha
                if (startYBordaForRect !== null) {
                    return posY; 
                }
            }
            return startYBordaForRect;
        }

        // --- 3. Formatações ---
        const dataOcorrencia = reg.data ? new Date(reg.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const dataRelatorio  = reg.data_relatorio ? new Date(reg.data_relatorio + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const horaRaw        = reg.hora || '';
        const hora           = horaRaw.includes(':') ? horaRaw.replace(/^(\d{1,2}):(\d{2}).*$/, '$1h $2min') : (horaRaw || '—');
        const numero         = reg.numero_ocorrencia || '—';
        const origem         = reg.origem || '—';
        const agentesFmt     = (reg.agentes || []).join(', ') || '—';
        const agentePrincipal = (reg.agentes || [])[0] || '—';
        const responsavel    = (reg.responsavel || 'AGENTE RESPONSÁVEL').toUpperCase();
        const supervisao     = reg.supervisao || '---';

        // Helper para converter URL de Imagem/Foto em Base64 para o jsPDF injetar nativamente
        const urlToBase64 = async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = () => resolve(url); // Em caso de falha, devolve a URL para evitar travar a thread
                img.src = url;
            });
        };

        // ==========================================
        // MONTAGEM VISUAL (COORDENADAS X/Y)
        // ==========================================

        // --- FUNÇÃO AUXILIAR DIMENSÕES DE IMAGEM ---
        function getImgSize(b64) {
            return new Promise(res => {
                const img = new Image();
                img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => res({ w: 1, h: 1 });
                img.src = b64;
            });
        }

        const [logoSize, brasaoSize] = await Promise.all([
            getImgSize(_LOGO),
            getImgSize(_BRASAO)
        ]);

        const altLogos = 14;
        const logoW = (logoSize.w / logoSize.h) * altLogos;
        const brasaoW = (brasaoSize.w / brasaoSize.h) * altLogos;

        // --- CABEÇALHO ---
        doc.addImage(_LOGO, 'PNG', margemX, posY, logoW, altLogos);
        doc.addImage(_BRASAO, 'PNG', larguraPagina - margemX - brasaoW, posY, brasaoW, altLogos);

        const centroY = posY + (altLogos / 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("PREFEITURA DE JACAREÍ", larguraPagina / 2, centroY - 1.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Secretaria de Mobilidade Urbana", larguraPagina / 2, centroY + 3.5, { align: "center" });

        posY += 20;

        // --- TÍTULO DO DOCUMENTO ---
        doc.setDrawColor(136, 136, 136);
        doc.setLineWidth(0.4);
        doc.rect(margemX, posY, larguraUtil, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELATÓRIO DE SINISTRO DE TRÂNSITO", larguraPagina / 2, posY + 5.5, { align: "center" });
        posY += 14;

        // --- METADADOS ---
        doc.setFontSize(10);
        function textoRotulado(label, valor, x, y, align = 'left') {
            const labelComEspaco = `${label}:  `;
            if (align === 'left') {
                doc.setFont("helvetica", "bold");
                const w = doc.getTextWidth(labelComEspaco);
                doc.text(labelComEspaco, x, y);
                doc.setFont("helvetica", "normal");
                doc.text(valor, x + w, y);
            } else {
                doc.setFont("helvetica", "bold");
                const labelW = doc.getTextWidth(labelComEspaco);
                doc.setFont("helvetica", "normal");
                const valorW = doc.getTextWidth(valor);
                const totalW = labelW + valorW;
                doc.setFont("helvetica", "bold");
                doc.text(labelComEspaco, x - totalW, y);
                doc.setFont("helvetica", "normal");
                doc.text(valor, x - totalW + labelW, y);
            }
        }
        textoRotulado('DATA DO FATO', dataOcorrencia, margemX, posY);
        textoRotulado('HORA', hora, larguraPagina - margemX, posY, 'right');
        posY += 6;
        
        textoRotulado('Nº OCORRÊNCIA', numero, margemX, posY);
        textoRotulado('ORIGEM', origem, larguraPagina - margemX, posY, 'right');
        posY += 6;
        
        textoRotulado('ENDEREÇO', reg.endereco || '—', margemX, posY);
        posY += 6;
        
        textoRotulado('CARACTERÍSTICA', reg.caracteristica || '—', margemX, posY);
        posY += 10;

        // --- FUNÇÃO DE CRIAÇÃO DE SEÇÕES ---
        function desenharSecaoTitulo(titulo) {
            checkPageBreak(25);
            
            // Barra lateral azul/cinza escuro
            doc.setFillColor(44, 62, 80); 
            doc.rect(margemX, posY, 1.5, 6, 'F');
            
            // Fundo da barra de título
            doc.setFillColor(232, 234, 237);
            doc.rect(margemX + 1.5, posY, larguraUtil - 1.5, 6, 'F');
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(26, 26, 26);
            doc.text(titulo.toUpperCase(), margemX + 4, posY + 4.2);
            posY += 6;
            
            doc.setDrawColor(208, 208, 208);
            doc.setLineWidth(0.3);
            doc.setTextColor(0, 0, 0); 
        }

        // --- VÍTIMAS ---
        desenharSecaoTitulo("Vítimas");
        let startYBorda = posY;
        posY += 4;
        doc.setFontSize(9);
        if (reg.vitimas && reg.vitimas.length > 0) {
            reg.vitimas.forEach((v, i) => {
                startYBorda = checkPageBreak(15, startYBorda);
                doc.setFont("helvetica", "bold");
                doc.text(`Vítima ${i + 1}: ${v.nome || '---'}`, margemX + 3, posY);
                posY += 4;
                doc.setFont("helvetica", "normal");
                doc.text(`Sexo: ${v.sexo || 'SEM INFORMAÇÃO'}     Estado: ${v.estado || 'SEM INFORMAÇÃO'}`, margemX + 3, posY);
                posY += 4;
                doc.text(`Descrição: ${v.descricao || 'SEM INFORMAÇÃO'}`, margemX + 3, posY);
                posY += 6;
            });
        } else {
            doc.setFont("helvetica", "normal");
            doc.text("Sem vítimas registradas.", margemX + 3, posY);
            posY += 6;
        }
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda); 
        posY += 4;

        // --- ENVOLVIDOS / VEÍCULOS ---
        desenharSecaoTitulo("Envolvidos / Veículos");
        startYBorda = posY;
        posY += 4;
        if (reg.envolvidos && reg.envolvidos.length > 0) {
            reg.envolvidos.forEach((e, i) => {
                startYBorda = checkPageBreak(8, startYBorda);
                const tipo = (e.tipo || 'Veículo').replace(/ 🚗| 🏍️| 🚛| 🚌| 🚴| 🚶| 🛴| 🛵/g, '').trim();
                const placa = e.placa ? ` | PLACA: ${e.placa.toUpperCase()}` : '';
                const cnh   = e.cnh   ? ` | CNH: ${e.cnh}` : '';
                
                doc.setFont("helvetica", "bold");
                doc.text(`${i + 1}. `, margemX + 3, posY);
                doc.setFont("helvetica", "normal");
                doc.text(`${tipo}${placa}${cnh}`, margemX + 7, posY);
                posY += 5;
            });
        } else {
            doc.setFont("helvetica", "normal");
            doc.text("Nenhum envolvido registrado.", margemX + 3, posY);
            posY += 5;
        }
        posY += 1;
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
        posY += 4;

        // --- SOCORRO MÉDICO ---
        desenharSecaoTitulo("Socorro Médico");
        startYBorda = posY;
        posY += 4;
        doc.setFont("helvetica", "normal");
        if (reg.socorro && reg.socorro.length > 0) {
            reg.socorro.forEach((s) => {
                startYBorda = checkPageBreak(8, startYBorda);
                const tipo = (s.tipo || 'SEM INFORMAÇÃO').replace(/ 🚑| 🚒| 🚨/g,'').trim() || 'SEM INFORMAÇÃO';
                const semDetalhes = ['Recusou', 'Sem Necessidade', 'Sem Informação'].includes(tipo);
                if (semDetalhes) {
                    doc.text(`• ${tipo}`, margemX + 3, posY);
                } else {
                    const vtr  = `VTR: ${s.prefixo || 'SEM INFORMAÇÃO'}`;
                    const resp = `RESP: ${s.responsavel || 'SEM INFORMAÇÃO'}`;
                    doc.text(`• ${tipo} | ${vtr} | ${resp}`, margemX + 3, posY);
                }
                posY += 5;
            });
        } else {
             doc.text("• SEM INFORMAÇÃO", margemX + 3, posY);
             posY += 5;
        }
        posY += 1;
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
        posY += 4;

        // --- APOIO POLICIAL ---
        desenharSecaoTitulo("Apoio Policial");
        startYBorda = posY;
        posY += 4;
        doc.setFont("helvetica", "normal");
        if (reg.apoio && reg.apoio.length > 0) {
            reg.apoio.forEach((a) => {
                startYBorda = checkPageBreak(8, startYBorda);
                const tipo = (a.tipo || 'SEM INFORMAÇÃO').replace('Polícia Militar 🚓','PM').replace('Polícia Civil 🚓','PC')
                    .replace('Polícia Rodoviária Estadual 🚓','PRE').replace('Polícia Rodoviária Federal 🚓','PRF')
                    .replace('GCM 🚓','GCM').replace(/ 🚓| 🚒| 🚑| 🚨/g,'').trim() || 'SEM INFORMAÇÃO';
                if (tipo === 'Sem Informação') {
                    doc.text(`• ${tipo}`, margemX + 3, posY);
                } else {
                    const vtr  = ` | VTR: ${a.prefixo || 'SEM INFORMAÇÃO'}`;
                    const resp = ` | RESP: ${a.responsavel || 'SEM INFORMAÇÃO'}`;
                    doc.text(`• ${tipo}${vtr}${resp}`, margemX + 3, posY);
                }
                posY += 5;
            });
        } else {
            doc.text("• SEM INFORMAÇÃO | VTR: SEM INFORMAÇÃO | RESP: SEM INFORMAÇÃO", margemX + 3, posY);
            posY += 5;
        }
        posY += 1;
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
        posY += 4;

        // --- RESUMO DOS FATOS ---
        desenharSecaoTitulo("Resumo dos Fatos");
        startYBorda = posY;
        posY += 4;
        doc.setFont("helvetica", "normal");
        
        const textoResumo = reg.resumo || '—';
        const linhasResumo = doc.splitTextToSize(textoResumo, larguraUtil - 6);
        for (let i = 0; i < linhasResumo.length; i++) {
            startYBorda = checkPageBreak(8, startYBorda);
            doc.text(linhasResumo[i], margemX + 3, posY);
            posY += 5;
        }
        posY += 2;
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
        posY += 6;

        // --- FOTOS DO SINISTRO ---
        const fotos = reg.fotos || [];
        if (fotos.length > 0) {
            desenharSecaoTitulo("FOTOS DO SINISTRO");
            startYBorda = posY;
            posY += 4;
            
            let imgX = margemX + 3;
            const imgWidth = 55;
            const imgHeight = 40;
            
            for (let i = 0; i < fotos.length; i++) {
                startYBorda = checkPageBreak(imgHeight + 10, startYBorda);
                const b64 = await urlToBase64(fotos[i]);
                const dimFoto = await calcularDimensoesFotoPDF(b64, imgWidth, imgHeight);
                try {
                    doc.addImage(b64, 'JPEG', imgX + dimFoto.offsetX, posY + dimFoto.offsetY, dimFoto.largura, dimFoto.altura);
                } catch(e) {
                    console.error("Erro injetando a foto", e);
                }
                
                // Distribuição Responsiva
                imgX += imgWidth + 4;
                if (imgX + imgWidth > larguraPagina - margemX) {
                    imgX = margemX + 3;
                    posY += imgHeight + 4;
                }
            }
            if (imgX !== margemX + 3) {
                posY += imgHeight + 4;
            }
            doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
            posY += 6;
        }

        // --- AGENTES E VIATURAS ENVOLVIDAS ---
        desenharSecaoTitulo("Agentes e Viaturas Envolvidos");
        startYBorda = posY;
        posY += 4;

        const colEsq = margemX + 3;
        const colDir = margemX + (larguraUtil / 2) + 3;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("AGENTES:", colEsq, posY);
        doc.text("VIATURAS:", colDir, posY);
        doc.setFont("helvetica", "normal");
        posY += 5;

        const agentesList = reg.agentes && reg.agentes.length > 0 ? reg.agentes : ['—'];
        const vtrsList = reg.vtrs && reg.vtrs.length > 0 ? reg.vtrs : ['—'];
        const maxLen = Math.max(agentesList.length, vtrsList.length);

        for (let i = 0; i < maxLen; i++) {
            startYBorda = checkPageBreak(5, startYBorda);
            const ag = agentesList[i];
            const vtr = vtrsList[i];
            if (ag) doc.text(`• ${ag}`, colEsq + 3, posY);
            if (vtr) doc.text(`• ${vtr}`, colDir + 3, posY);
            posY += 5;
        }
        posY += 1;
        doc.rect(margemX, startYBorda, larguraUtil, posY - startYBorda);
        posY += 4;

        // --- RODAPÉ DE INFORMAÇÕES TÉCNICAS ---
        checkPageBreak(40);
        posY += 5;
        doc.setFontSize(9);
        
        doc.setFont("helvetica", "bold");
        doc.text("SUPERVISÃO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(supervisao, margemX + 25, posY);
        
        doc.setFont("helvetica", "bold");
        doc.text("RESPONSÁVEL PELO RELATÓRIO:", larguraPagina - margemX - 100, posY);
        doc.setFont("helvetica", "normal");
        doc.text(responsavel, larguraPagina - margemX - 45, posY);
        
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("DATA DO RELATÓRIO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(dataRelatorio, margemX + 38, posY);

        // --- LINHA DE ASSINATURA ---
        posY += 25;
        doc.setLineWidth(0.4);
        doc.setDrawColor(50, 50, 50);
        doc.line(larguraPagina / 2 - 35, posY, larguraPagina / 2 + 35, posY); // Linha central
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("ASSINATURA DO AGENTE", larguraPagina / 2, posY, { align: "center" });
        posY += 4;
        doc.setFont("helvetica", "normal");
        doc.text(agentePrincipal, larguraPagina / 2, posY, { align: "center" });

        // --- GERAÇÃO E DOWNLOAD ---
        doc.save(`Sinistro_${numero}_assinado.pdf`);

    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        alert('⚠️ Ocorreu um erro ao criar o PDF.');
    } finally {
        const loader = document.getElementById('loading-pdf');
        if (loader && document.body.contains(loader)) document.body.removeChild(loader);
    }
};

window.gerarPDFRemocao = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao').select('*').eq('id', id).single();
    if (error || !reg) { alert('❌ Erro ao buscar dados para o PDF.'); return; }

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-pdf';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:22px 30px;border-radius:10px;z-index:9999;font-weight:bold;text-align:center;font-family:Arial,sans-serif;font-size:15px;';
    loadingDiv.innerText = '⏳ Gerando PDF...\nAguarde um momento.';
    document.body.appendChild(loadingDiv);

    try {
        const fontePdf = window.gerarPDFRelatorio.toString();
        const logoMatch = fontePdf.match(/const _LOGO\s*=\s*"([^"]+)"/);
        const brasaoMatch = fontePdf.match(/const _BRASAO\s*=\s*"([^"]+)"/);
        const _LOGO = logoMatch ? logoMatch[1] : null;
        const _BRASAO = brasaoMatch ? brasaoMatch[1] : null;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const margemX = 15;
        const larguraPagina = 210;
        const larguraUtil = larguraPagina - (margemX * 2);
        let posY = 15;

        function checkPageBreak(alturaNecessaria) {
            if (posY + alturaNecessaria > 280) {
                doc.addPage();
                posY = 15;
            }
        }

        function getImgSize(b64) {
            return new Promise(res => {
                if (!b64) return res({ w: 1, h: 1 });
                const img = new Image();
                img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => res({ w: 1, h: 1 });
                img.src = b64;
            });
        }

        const urlToBase64 = async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = () => resolve(url);
                img.src = url;
            });
        };

        const [logoSize, brasaoSize] = await Promise.all([getImgSize(_LOGO), getImgSize(_BRASAO)]);
        const altLogos = 14;
        if (_LOGO) {
            const logoW = (logoSize.w / logoSize.h) * altLogos;
            doc.addImage(_LOGO, 'PNG', margemX, posY, logoW, altLogos);
        }
        if (_BRASAO) {
            const brasaoW = (brasaoSize.w / brasaoSize.h) * altLogos;
            doc.addImage(_BRASAO, 'PNG', larguraPagina - margemX - brasaoW, posY, brasaoW, altLogos);
        }

        const centroY = posY + (altLogos / 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("PREFEITURA DE JACAREÍ", larguraPagina / 2, centroY - 1.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Secretaria de Mobilidade Urbana", larguraPagina / 2, centroY + 3.5, { align: "center" });
        posY += 20;

        doc.setDrawColor(136, 136, 136);
        doc.setLineWidth(0.4);
        doc.rect(margemX, posY, larguraUtil, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELATÓRIO DE REMOÇÃO", larguraPagina / 2, posY + 5.5, { align: "center" });
        posY += 14;

        function textoRotulado(label, valor, x, y, align = 'left') {
            const labelComEspaco = `${label}:  `;
            const valorTxt = String(valor || '—');
            if (align === 'left') {
                doc.setFont("helvetica", "bold");
                const w = doc.getTextWidth(labelComEspaco);
                doc.text(labelComEspaco, x, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x + w, y);
            } else {
                doc.setFont("helvetica", "bold");
                const labelW = doc.getTextWidth(labelComEspaco);
                doc.setFont("helvetica", "normal");
                const valorW = doc.getTextWidth(valorTxt);
                const totalW = labelW + valorW;
                doc.setFont("helvetica", "bold");
                doc.text(labelComEspaco, x - totalW, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x - totalW + labelW, y);
            }
        }

        function desenharSecaoTitulo(titulo) {
            checkPageBreak(25);
            doc.setFillColor(44, 62, 80);
            doc.rect(margemX, posY, 1.5, 6, 'F');
            doc.setFillColor(232, 234, 237);
            doc.rect(margemX + 1.5, posY, larguraUtil - 1.5, 6, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(26, 26, 26);
            doc.text(titulo.toUpperCase(), margemX + 4, posY + 4.2);
            posY += 6;
            doc.setDrawColor(208, 208, 208);
            doc.setLineWidth(0.3);
            doc.setTextColor(0, 0, 0);
        }

        function caixaTexto(titulo, linhas) {
            desenharSecaoTitulo(titulo);
            const startY = posY;
            posY += 4;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            linhas.forEach(linha => {
                const quebradas = doc.splitTextToSize(String(linha || '—'), larguraUtil - 6);
                quebradas.forEach(txt => {
                    checkPageBreak(8);
                    doc.text(txt, margemX + 3, posY);
                    posY += 5;
                });
            });
            posY += 2;
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 4;
        }

        const dataFato = reg.data ? new Date(reg.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const dataRelatorio = reg.data_relatorio ? new Date(reg.data_relatorio + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const hora = reg.hora ? String(reg.hora).replace(/^(\d{1,2}):(\d{2}).*$/, '$1h $2min') : '—';
        const responsavel = (reg.agente_responsavel_ait || 'AGENTE RESPONSÁVEL').toUpperCase();
        const agentesFmt = (reg.agentes || []).join(', ') || '—';
        const vtrsFmt = (reg.vtrs || []).join(', ') || '—';
        const agenteAssinatura = agenteLogado?.det_codigo || ((reg.agentes || [])[0] || responsavel);

        doc.setFontSize(10);
        textoRotulado('DATA DO FATO', dataFato, margemX, posY);
        textoRotulado('HORA', hora, larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('Nº AIT', reg.numero_ait || '—', margemX, posY);
        textoRotulado('Nº OCORRÊNCIA', reg.numero_ocorrencia || '—', larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('PLACA', reg.placa || '—', margemX, posY);
        textoRotulado('MODELO/MARCA', reg.modelo_marca || '—', larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('FONTE', reg.fonte || '—', margemX, posY);
        textoRotulado('OPERADOR COTRAN', reg.operador_cotran || '—', larguraPagina - margemX, posY, 'right');
        posY += 10;

        caixaTexto("Dados do Veículo e Remoção", [
            `Estado de conservação: ${reg.estado_conservacao || '—'}`,
            `Motivo da remoção (Infração/ART CTB): ${reg.motivo_remocao || '—'}`,
            `CR - Guia de recolhimento: ${reg.cr_guia_recolhimento || '—'}`,
            `Responsável pelo guincho: ${reg.responsavel_guincho || '—'}`,
        ]);

        caixaTexto("Solicitação e Local", [
            `Dados do solicitante: ${reg.dados_solicitante || '—'}`,
            `Endereço: ${reg.endereco || '—'}`,
        ]);

        caixaTexto("Pesquisa de Furto ou Roubo", [
            `Órgão: ${reg.pesquisa_furto_roubo || '—'}`,
            `Policial responsável: ${reg.policial_responsavel || '—'}`,
        ]);

        caixaTexto("Resumo dos Fatos", [reg.resumo || '—']);

        caixaTexto("Agentes e Viaturas Envolvidos", [
            `Agentes: ${agentesFmt}`,
            `Viaturas: ${vtrsFmt}`,
        ]);

        const fotos = reg.fotos || [];
        if (fotos.length > 0) {
            desenharSecaoTitulo("Fotos da Remoção");
            const startY = posY;
            posY += 4;

            let imgX = margemX + 3;
            const imgWidth = 55;
            const imgHeight = 40;

            for (let i = 0; i < fotos.length; i++) {
                checkPageBreak(imgHeight + 10);
                const b64 = await urlToBase64(fotos[i]);
                const dimFoto = await calcularDimensoesFotoPDF(b64, imgWidth, imgHeight);
                try {
                    doc.addImage(b64, 'JPEG', imgX + dimFoto.offsetX, posY + dimFoto.offsetY, dimFoto.largura, dimFoto.altura);
                } catch (e) {
                    console.error("Erro injetando a foto de remoção", e);
                }

                imgX += imgWidth + 4;
                if (imgX + imgWidth > larguraPagina - margemX) {
                    imgX = margemX + 3;
                    posY += imgHeight + 4;
                }
            }
            if (imgX !== margemX + 3) {
                posY += imgHeight + 4;
            }
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 6;
        }

        checkPageBreak(45);
        posY += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SUPERVISÃO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.supervisao || '---', margemX + 25, posY);
        doc.setFont("helvetica", "bold");
        doc.text("MATRÍCULA:", margemX + 90, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.matricula_supervisao || '---', margemX + 112, posY);
        posY += 5;

        doc.setFont("helvetica", "bold");
        doc.text("AGENTE RESPONSÁVEL PELO AIT:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(responsavel, margemX + 55, posY);
        doc.setFont("helvetica", "bold");
        doc.text("MATRÍCULA:", margemX + 120, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.matricula_agente_ait || '---', margemX + 142, posY);
        posY += 5;

        doc.setFont("helvetica", "bold");
        doc.text("DATA DO RELATÓRIO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(dataRelatorio, margemX + 38, posY);

        posY += 25;
        doc.setLineWidth(0.4);
        doc.setDrawColor(50, 50, 50);
        doc.line(larguraPagina / 2 - 35, posY, larguraPagina / 2 + 35, posY);
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("ASSINATURA DO AGENTE", larguraPagina / 2, posY, { align: "center" });
        posY += 4;
        doc.setFont("helvetica", "normal");
        doc.text(agenteAssinatura, larguraPagina / 2, posY, { align: "center" });

        doc.save(`Remocao_${reg.placa || reg.numero_ait || id}.pdf`);
    } catch (err) {
        console.error('Erro ao gerar PDF de remoção:', err);
        alert('⚠️ Ocorreu um erro ao criar o PDF.');
    } finally {
        const loader = document.getElementById('loading-pdf');
        if (loader && document.body.contains(loader)) document.body.removeChild(loader);
    }
};

window.gerarPDFRemocaoAbandono = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao_abandono').select('*').eq('id', id).single();
    if (error || !reg) { alert('❌ Erro ao buscar dados para o PDF.'); return; }

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-pdf';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:22px 30px;border-radius:10px;z-index:9999;font-weight:bold;text-align:center;font-family:Arial,sans-serif;font-size:15px;';
    loadingDiv.innerText = '⏳ Gerando PDF...\nAguarde um momento.';
    document.body.appendChild(loadingDiv);

    try {
        const fontePdf = window.gerarPDFRelatorio.toString();
        const logoMatch = fontePdf.match(/const _LOGO\s*=\s*"([^"]+)"/);
        const brasaoMatch = fontePdf.match(/const _BRASAO\s*=\s*"([^"]+)"/);
        const _LOGO = logoMatch ? logoMatch[1] : null;
        const _BRASAO = brasaoMatch ? brasaoMatch[1] : null;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const margemX = 15;
        const larguraPagina = 210;
        const larguraUtil = larguraPagina - (margemX * 2);
        let posY = 15;

        function checkPageBreak(alturaNecessaria) {
            if (posY + alturaNecessaria > 280) {
                doc.addPage();
                posY = 15;
            }
        }

        function getImgSize(b64) {
            return new Promise(res => {
                if (!b64) return res({ w: 1, h: 1 });
                const img = new Image();
                img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => res({ w: 1, h: 1 });
                img.src = b64;
            });
        }

        const urlToBase64 = async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = () => resolve(url);
                img.src = url;
            });
        };

        const [logoSize, brasaoSize] = await Promise.all([getImgSize(_LOGO), getImgSize(_BRASAO)]);
        const altLogos = 14;
        if (_LOGO) {
            const logoW = (logoSize.w / logoSize.h) * altLogos;
            doc.addImage(_LOGO, 'PNG', margemX, posY, logoW, altLogos);
        }
        if (_BRASAO) {
            const brasaoW = (brasaoSize.w / brasaoSize.h) * altLogos;
            doc.addImage(_BRASAO, 'PNG', larguraPagina - margemX - brasaoW, posY, brasaoW, altLogos);
        }

        const centroY = posY + (altLogos / 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("PREFEITURA DE JACAREÍ", larguraPagina / 2, centroY - 1.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Secretaria de Mobilidade Urbana", larguraPagina / 2, centroY + 3.5, { align: "center" });
        posY += 20;

        doc.setDrawColor(136, 136, 136);
        doc.setLineWidth(0.4);
        doc.rect(margemX, posY, larguraUtil, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELATÓRIO DE REMOÇÃO POR ABANDONO", larguraPagina / 2, posY + 5.5, { align: "center" });
        posY += 14;

        function textoRotulado(label, valor, x, y, align = 'left') {
            const labelComEspaco = `${label}:  `;
            const valorTxt = String(valor || '—');
            if (align === 'left') {
                doc.setFont("helvetica", "bold");
                const w = doc.getTextWidth(labelComEspaco);
                doc.text(labelComEspaco, x, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x + w, y);
            } else {
                doc.setFont("helvetica", "bold");
                const labelW = doc.getTextWidth(labelComEspaco);
                doc.setFont("helvetica", "normal");
                const valorW = doc.getTextWidth(valorTxt);
                const totalW = labelW + valorW;
                doc.setFont("helvetica", "bold");
                doc.text(labelComEspaco, x - totalW, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x - totalW + labelW, y);
            }
        }

        function desenharSecaoTitulo(titulo) {
            checkPageBreak(25);
            doc.setFillColor(44, 62, 80);
            doc.rect(margemX, posY, 1.5, 6, 'F');
            doc.setFillColor(232, 234, 237);
            doc.rect(margemX + 1.5, posY, larguraUtil - 1.5, 6, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(26, 26, 26);
            doc.text(titulo.toUpperCase(), margemX + 4, posY + 4.2);
            posY += 6;
            doc.setDrawColor(208, 208, 208);
            doc.setLineWidth(0.3);
            doc.setTextColor(0, 0, 0);
        }

        function caixaTexto(titulo, linhas) {
            desenharSecaoTitulo(titulo);
            const startY = posY;
            posY += 4;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            linhas.forEach(linha => {
                const quebradas = doc.splitTextToSize(String(linha || '—'), larguraUtil - 6);
                quebradas.forEach(txt => {
                    checkPageBreak(8);
                    doc.text(txt, margemX + 3, posY);
                    posY += 5;
                });
            });
            posY += 2;
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 4;
        }

        const fmtData = valor => valor ? new Date(valor + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const fmtHora = valor => valor ? String(valor).replace(/^(\d{1,2}):(\d{2}).*$/, '$1h $2min') : '—';
        const fonteDetalhada = reg.fonte_numero ? `${reg.fonte || '—'} ${reg.fonte_numero}` : (reg.fonte || '—');
        const agentesFmt = (reg.agentes || []).join(', ') || '—';
        const vtrsFmt = (reg.vtrs || []).join(', ') || '—';
        const apoioFmt = (reg.apoio || []).join(', ') || '—';
        const agenteAssinatura = agenteLogado?.det_codigo || ((reg.agentes || [])[0] || 'AGENTE RESPONSÁVEL');

        doc.setFontSize(10);
        textoRotulado('DATA', fmtData(reg.data), margemX, posY);
        textoRotulado('Nº OCORRÊNCIA', reg.numero_ocorrencia || '—', larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('Nº AIM', reg.numero_aim || '—', margemX, posY);
        textoRotulado('DATA DO AIM', fmtData(reg.data_aim), larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('DATA DA PUBLICAÇÃO', fmtData(reg.data_publicacao), margemX, posY);
        textoRotulado('FONTE', fonteDetalhada, larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('HORA INICIAL', fmtHora(reg.hora_inicial), margemX, posY);
        textoRotulado('HORA FINAL', fmtHora(reg.hora_final), larguraPagina - margemX, posY, 'right');
        posY += 10;

        caixaTexto("Dados do Veículo e Remoção", [
            `Placa: ${reg.placa || '—'}`,
            `Modelo/Marca: ${reg.modelo_marca || '—'}`,
            `Motivo da remoção: ${reg.motivo_remocao || '—'}`,
            `CR - Guia de recolhimento: ${reg.cr_guia_recolhimento || '—'}`,
            `Responsável pelo guincho: ${reg.responsavel_guincho || '—'}`,
        ]);

        caixaTexto("Resumo dos Fatos", [reg.resumo || '—']);

        caixaTexto("Agentes, Viaturas e Apoio", [
            `Agentes envolvidos: ${agentesFmt}`,
            `Viaturas envolvidas: ${vtrsFmt}`,
            `Apoio: ${apoioFmt}`,
            `Supervisão: ${reg.supervisao || '—'}`,
        ]);

        const fotos = reg.fotos || [];
        if (fotos.length > 0) {
            desenharSecaoTitulo("Fotos da Remoção");
            const startY = posY;
            posY += 4;

            let imgX = margemX + 3;
            const imgWidth = 55;
            const imgHeight = 40;

            for (let i = 0; i < fotos.length; i++) {
                checkPageBreak(imgHeight + 10);
                const b64 = await urlToBase64(fotos[i]);
                const dimFoto = await calcularDimensoesFotoPDF(b64, imgWidth, imgHeight);
                try {
                    doc.addImage(b64, 'JPEG', imgX + dimFoto.offsetX, posY + dimFoto.offsetY, dimFoto.largura, dimFoto.altura);
                } catch (e) {
                    console.error("Erro injetando a foto de remoção por abandono", e);
                }

                imgX += imgWidth + 4;
                if (imgX + imgWidth > larguraPagina - margemX) {
                    imgX = margemX + 3;
                    posY += imgHeight + 4;
                }
            }
            if (imgX !== margemX + 3) {
                posY += imgHeight + 4;
            }
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 6;
        }

        checkPageBreak(35);
        posY += 15;
        doc.setLineWidth(0.4);
        doc.setDrawColor(50, 50, 50);
        doc.line(larguraPagina / 2 - 35, posY, larguraPagina / 2 + 35, posY);
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("ASSINATURA DO AGENTE", larguraPagina / 2, posY, { align: "center" });
        posY += 4;
        doc.setFont("helvetica", "normal");
        doc.text(agenteAssinatura, larguraPagina / 2, posY, { align: "center" });

        doc.save(`Remocao_Abandono_${reg.placa || reg.numero_aim || id}.pdf`);
    } catch (err) {
        console.error('Erro ao gerar PDF de remoção por abandono:', err);
        alert('⚠️ Ocorreu um erro ao criar o PDF.');
    } finally {
        const loader = document.getElementById('loading-pdf');
        if (loader && document.body.contains(loader)) document.body.removeChild(loader);
    }
};

window.gerarPDFRemocao279A = async function (id) {
    const { data: reg, error } = await db.from('relatorios_remocao_279a').select('*').eq('id', id).single();
    if (error || !reg) { alert('❌ Erro ao buscar dados para o PDF.'); return; }

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-pdf';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.92);color:#fff;padding:22px 30px;border-radius:10px;z-index:9999;font-weight:bold;text-align:center;font-family:Arial,sans-serif;font-size:15px;';
    loadingDiv.innerText = '⏳ Gerando PDF...\nAguarde um momento.';
    document.body.appendChild(loadingDiv);

    try {
        const fontePdf = window.gerarPDFRelatorio.toString();
        const logoMatch = fontePdf.match(/const _LOGO\s*=\s*"([^"]+)"/);
        const brasaoMatch = fontePdf.match(/const _BRASAO\s*=\s*"([^"]+)"/);
        const _LOGO = logoMatch ? logoMatch[1] : null;
        const _BRASAO = brasaoMatch ? brasaoMatch[1] : null;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const margemX = 15;
        const larguraPagina = 210;
        const larguraUtil = larguraPagina - (margemX * 2);
        let posY = 15;

        function checkPageBreak(alturaNecessaria) {
            if (posY + alturaNecessaria > 280) {
                doc.addPage();
                posY = 15;
            }
        }

        function getImgSize(b64) {
            return new Promise(res => {
                if (!b64) return res({ w: 1, h: 1 });
                const img = new Image();
                img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => res({ w: 1, h: 1 });
                img.src = b64;
            });
        }

        const urlToBase64 = async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = () => resolve(url);
                img.src = url;
            });
        };

        const [logoSize, brasaoSize] = await Promise.all([getImgSize(_LOGO), getImgSize(_BRASAO)]);
        const altLogos = 14;
        if (_LOGO) {
            const logoW = (logoSize.w / logoSize.h) * altLogos;
            doc.addImage(_LOGO, 'PNG', margemX, posY, logoW, altLogos);
        }
        if (_BRASAO) {
            const brasaoW = (brasaoSize.w / brasaoSize.h) * altLogos;
            doc.addImage(_BRASAO, 'PNG', larguraPagina - margemX - brasaoW, posY, brasaoW, altLogos);
        }

        const centroY = posY + (altLogos / 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("PREFEITURA DE JACAREÍ", larguraPagina / 2, centroY - 1.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("Secretaria de Mobilidade Urbana", larguraPagina / 2, centroY + 3.5, { align: "center" });
        posY += 20;

        doc.setDrawColor(136, 136, 136);
        doc.setLineWidth(0.4);
        doc.rect(margemX, posY, larguraUtil, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RELATÓRIO DE REMOÇÃO ART. 279-A CTB", larguraPagina / 2, posY + 5.5, { align: "center" });
        posY += 14;

        const fmtData = valor => valor ? new Date(valor + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        const fmtHora = valor => valor ? String(valor).replace(/^(\d{1,2}):(\d{2}).*$/, '$1h $2min') : '—';
        const fonteDetalhada = reg.fonte_numero ? `${reg.fonte || '—'} ${reg.fonte_numero}` : (reg.fonte || '—');
        const agentesFmt = (reg.agentes || []).map(formatarDet).join(', ') || '—';
        const vtrsFmt = (reg.vtrs || []).join(', ') || '—';
        const agenteResponsavelRemocao = formatarDet(agenteLogado?.det_codigo || reg.agente_responsavel_remocao);
        const agenteAssinatura = agenteResponsavelRemocao || formatarDet((reg.agentes || [])[0]) || 'AGENTE RESPONSÁVEL';

        function textoRotulado(label, valor, x, y, align = 'left') {
            const labelComEspaco = `${label}:  `;
            const valorTxt = String(valor || '—');
            if (align === 'left') {
                doc.setFont("helvetica", "bold");
                const w = doc.getTextWidth(labelComEspaco);
                doc.text(labelComEspaco, x, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x + w, y);
            } else {
                doc.setFont("helvetica", "bold");
                const labelW = doc.getTextWidth(labelComEspaco);
                doc.setFont("helvetica", "normal");
                const valorW = doc.getTextWidth(valorTxt);
                const totalW = labelW + valorW;
                doc.setFont("helvetica", "bold");
                doc.text(labelComEspaco, x - totalW, y);
                doc.setFont("helvetica", "normal");
                doc.text(valorTxt, x - totalW + labelW, y);
            }
        }

        function desenharSecaoTitulo(titulo) {
            checkPageBreak(25);
            doc.setFillColor(44, 62, 80);
            doc.rect(margemX, posY, 1.5, 6, 'F');
            doc.setFillColor(232, 234, 237);
            doc.rect(margemX + 1.5, posY, larguraUtil - 1.5, 6, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(26, 26, 26);
            doc.text(titulo.toUpperCase(), margemX + 4, posY + 4.2);
            posY += 6;
            doc.setDrawColor(208, 208, 208);
            doc.setLineWidth(0.3);
            doc.setTextColor(0, 0, 0);
        }

        function caixaTexto(titulo, linhas) {
            desenharSecaoTitulo(titulo);
            const startY = posY;
            posY += 4;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            linhas.forEach(linha => {
                const quebradas = doc.splitTextToSize(String(linha || '—'), larguraUtil - 6);
                quebradas.forEach(txt => {
                    checkPageBreak(8);
                    doc.text(txt, margemX + 3, posY);
                    posY += 5;
                });
            });
            posY += 2;
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 4;
        }

        doc.setFontSize(10);
        textoRotulado('DATA DA REMOÇÃO', fmtData(reg.data_remocao), margemX, posY);
        textoRotulado('HORA', fmtHora(reg.hora), larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('Nº AIT', reg.numero_ait || '—', margemX, posY);
        textoRotulado('Nº OCORRÊNCIA', reg.numero_ocorrencia || '—', larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('PLACA', reg.placa || '—', margemX, posY);
        textoRotulado('MODELO/MARCA', reg.modelo_marca || '—', larguraPagina - margemX, posY, 'right');
        posY += 6;
        textoRotulado('FONTE', fonteDetalhada, margemX, posY);
        textoRotulado('OPERADOR COTRAN', reg.operador_cotran || '—', larguraPagina - margemX, posY, 'right');
        posY += 10;

        caixaTexto("Dados do Veículo e Remoção", [
            `Estado de conservação: ${reg.estado_conservacao || '—'}`,
            `CR - Guia de recolhimento: ${reg.cr_guia_recolhimento || '—'}`,
            `Responsável pelo guincho: ${reg.responsavel_guincho || '—'}`,
            `Endereço: ${reg.endereco || '—'}`,
        ]);

        caixaTexto("Pesquisa de Furto ou Roubo", [
            `Órgão: ${reg.pesquisa_furto_roubo || '—'}`,
            `Policial responsável: ${reg.policial_responsavel || '—'}`,
        ]);

        caixaTexto("Resumo dos Fatos", [reg.resumo || '—']);

        caixaTexto("Agentes e Viaturas Envolvidos", [
            `Agentes: ${agentesFmt}`,
            `Viaturas: ${vtrsFmt}`,
        ]);

        const fotos = reg.fotos || [];
        if (fotos.length > 0) {
            desenharSecaoTitulo("Fotos da Remoção");
            const startY = posY;
            posY += 4;

            let imgX = margemX + 3;
            const imgWidth = 55;
            const imgHeight = 40;

            for (let i = 0; i < fotos.length; i++) {
                checkPageBreak(imgHeight + 10);
                const b64 = await urlToBase64(fotos[i]);
                const dimFoto = await calcularDimensoesFotoPDF(b64, imgWidth, imgHeight);
                try {
                    doc.addImage(b64, 'JPEG', imgX + dimFoto.offsetX, posY + dimFoto.offsetY, dimFoto.largura, dimFoto.altura);
                } catch (e) {
                    console.error("Erro injetando a foto de remoção 279-A", e);
                }

                imgX += imgWidth + 4;
                if (imgX + imgWidth > larguraPagina - margemX) {
                    imgX = margemX + 3;
                    posY += imgHeight + 4;
                }
            }
            if (imgX !== margemX + 3) {
                posY += imgHeight + 4;
            }
            doc.rect(margemX, startY, larguraUtil, posY - startY);
            posY += 6;
        }

        checkPageBreak(45);
        posY += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SUPERVISÃO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.supervisao || '---', margemX + 25, posY);
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("MATRÍCULA SUPERVISÃO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.matricula_supervisao || '---', margemX + 45, posY);
        posY += 5;

        doc.setFont("helvetica", "bold");
        doc.text("AGENTE RESP. REMOÇÃO:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(agenteResponsavelRemocao || '---', margemX + 45, posY);
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("MATRÍCULA AGENTE:", margemX, posY);
        doc.setFont("helvetica", "normal");
        doc.text(reg.matricula_agente || '---', margemX + 38, posY);

        posY += 20;
        doc.setLineWidth(0.4);
        doc.setDrawColor(50, 50, 50);
        doc.line(larguraPagina / 2 - 35, posY, larguraPagina / 2 + 35, posY);
        posY += 5;
        doc.setFont("helvetica", "bold");
        doc.text("ASSINATURA DO AGENTE", larguraPagina / 2, posY, { align: "center" });
        posY += 4;
        doc.setFont("helvetica", "normal");
        doc.text(agenteAssinatura, larguraPagina / 2, posY, { align: "center" });

        doc.save(`Remocao_279A_${reg.placa || reg.numero_ait || id}.pdf`);
    } catch (err) {
        console.error('Erro ao gerar PDF de remoção 279-A:', err);
        alert('⚠️ Ocorreu um erro ao criar o PDF.');
    } finally {
        const loader = document.getElementById('loading-pdf');
        if (loader && document.body.contains(loader)) document.body.removeChild(loader);
    }
};
