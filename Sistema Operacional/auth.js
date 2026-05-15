btnEntrar.addEventListener('click', async () => {
    const email    = inputEmail.value.trim();
    const password = inputSenha.value;
    if (!email || !password) return mostrarNotificacao('erro-login', '⚠️ Preencha e-mail e senha.');

    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) mostrarNotificacao('erro-login', '❌ Credenciais inválidas.');
    else       iniciarAplicativo();
});

async function verificarSessaoAtiva() {
    const { data: { session } } = await db.auth.getSession();
    if (session) iniciarAplicativo();
    else {
        ocultarTodasTelas();
        telaLogin.classList.remove('hidden');
    }
}

function normalizarIdentificadorAgente(valor) {
    return String(valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function codigoAgenteDoEmail(email) {
    const codigo = String(email || '').split('@')[0];
    return codigo.toUpperCase().replace(/(\d)/, ' $1').trim();
}

async function buscarPerfilFuncionario(user) {
    const { data: perfilPorUsuario } = await db.from('funcionarios')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    const codigoDoEmail = codigoAgenteDoEmail(user.email);
    const emailNormalizado = String(user.email || '').toLowerCase();
    const codigoNormalizado = normalizarIdentificadorAgente(codigoDoEmail);

    const { data: funcionarios, error } = await db.from('funcionarios').select('*').order('det_codigo', { ascending: true });
    if (error || !funcionarios) return perfilPorUsuario || null;

    const porUsuario = funcionarios.find(funcionario => funcionario.user_id && funcionario.user_id === user.id);
    const porEmail = funcionarios.find(funcionario => funcionario.email && String(funcionario.email).toLowerCase() === emailNormalizado);
    const porCodigoExato = funcionarios.find(funcionario => {
        return normalizarIdentificadorAgente(funcionario.det_codigo) === codigoNormalizado;
    });
    const porCodigoCompleto = funcionarios.find(funcionario => {
        const detNormalizado = normalizarIdentificadorAgente(funcionario.det_codigo);
        return detNormalizado.startsWith(codigoNormalizado) && funcionario.det_codigo !== codigoDoEmail;
    });

    const perfil = porUsuario || perfilPorUsuario || porEmail || porCodigoCompleto || porCodigoExato || null;
    if (!perfil || !porCodigoCompleto) return perfil;

    const perfilNormalizado = normalizarIdentificadorAgente(perfil.det_codigo);
    const completoNormalizado = normalizarIdentificadorAgente(porCodigoCompleto.det_codigo);

    if (perfilNormalizado === codigoNormalizado && completoNormalizado.startsWith(codigoNormalizado)) {
        return Object.assign({}, perfil, {
            det_codigo: porCodigoCompleto.det_codigo,
        });
    }

    return perfil;
}

async function iniciarAplicativo() {
    const { data: { user } } = await db.auth.getUser();
    if (user) {
        const codigoDoEmail = codigoAgenteDoEmail(user.email);
        const perfil = await buscarPerfilFuncionario(user);

        agenteLogado = Object.assign({}, perfil || {}, {
            user_id:    user.id,
            email:      user.email,
            det_codigo: perfil?.det_codigo || codigoDoEmail,
        });

        const header = document.getElementById('header-titulo');
        if (header) header.innerText = `Agente: ${agenteLogado.det_codigo}`;
    }
    ocultarTodasTelas();
    telaInicial.classList.remove('hidden');
    carregarListas();
}

const btnSair = document.getElementById('btn-sair');
if (btnSair) {
    btnSair.addEventListener('click', async () => {
        await db.auth.signOut();
        agenteLogado = null;
        inputEmail.value = '';
        inputSenha.value = '';
        const header = document.getElementById('header-titulo');
        if (header) header.innerText = 'Mobilidade Urbana';
        ocultarTodasTelas();
        telaLogin.classList.remove('hidden');
    });
}

verificarSessaoAtiva();
