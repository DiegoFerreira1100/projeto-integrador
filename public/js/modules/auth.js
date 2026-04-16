// ============================================
// AUTH.JS - Sistema de Autenticacao com Perfis
// Versao: Sincronizacao Automatica de Professores
// ============================================

const Auth = (function() {
    // Constantes
    const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas em ms
    const STORAGE_KEYS = {
        USUARIOS: 'portal_usuarios',
        SESSAO: 'portal_sessao'
    };

    // ===== INICIALIZACAO =====
    function init() {
        criarCoordenadorPadrao();
        setupEventListeners();
        verificarSessao();
    }

    function criarCoordenadorPadrao() {
        const usuarios = carregarUsuarios();
        
        if (usuarios.length === 0) {
            const coordenador = {
                id: 1,
                nome: 'Coordenador',
                email: 'coordenador@escola.com',
                senha: 'coord123',
                perfil: 'coordenador',
                criadoEm: new Date().toISOString(),
                ultimoAcesso: null
            };
            
            usuarios.push(coordenador);
            salvarUsuarios(usuarios);
            console.log('Coordenador padrao criado');
        }
    }

    function setupEventListeners() {
        const loginPass = document.getElementById('login-pass');
        if (loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLogin();
                }
            });
        }

        const regPass = document.getElementById('reg-pass');
        if (regPass) {
            regPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSignup();
                }
            });
        }
    }

    // ===== USUARIOS =====
    function carregarUsuarios() {
        const usuarios = localStorage.getItem(STORAGE_KEYS.USUARIOS);
        return usuarios ? JSON.parse(usuarios) : [];
    }

    function salvarUsuarios(usuarios) {
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
    }

    // ===== LOGIN =====
    function handleLogin() {
        console.log('Tentativa de login...');
        
        const emailInput = document.getElementById('login-email');
        const senhaInput = document.getElementById('login-pass');
        
        if (!emailInput || !senhaInput) {
            console.error('Campos de login nao encontrados');
            mostrarMensagem('Erro no formulario de login', 'erro');
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const senha = senhaInput.value.trim();

        if (!email || !senha) {
            mostrarMensagem('Preencha todos os campos!', 'erro');
            return;
        }

        const usuarios = carregarUsuarios();
        const usuario = usuarios.find(u => u.email === email && u.senha === senha);

        if (usuario) {
            console.log('Usuario encontrado:', usuario.nome);
            
            // SE FOR PROFESSOR, ADICIONAR AUTOMATICAMENTE A LISTA
            if (usuario.perfil === 'professor' && typeof Database !== 'undefined') {
                Database.adicionarProfessorPorLogin(usuario.nome);
            }
            
            criarSessao(usuario);
            atualizarUltimoAcesso(usuario, usuarios);
            entrarSistema(usuario);
        } else {
            console.log('Usuario nao encontrado ou senha invalida');
            mostrarMensagem('E-mail ou senha invalidos!', 'erro');
        }
    }

    function criarSessao(usuario) {
        const sessao = {
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil || 'professor'
            },
            timestamp: Date.now(),
            expira: Date.now() + SESSION_DURATION,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2)
        };

        localStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
        console.log('Sessao criada:', sessao.usuario);
    }

    function atualizarUltimoAcesso(usuario, usuarios) {
        usuario.ultimoAcesso = new Date().toISOString();
        salvarUsuarios(usuarios);
    }

    // ===== CADASTRO =====
    function handleSignup() {
        console.log('Tentativa de cadastro...');
        
        const nome = document.getElementById('reg-nome')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim().toLowerCase();
        const senha = document.getElementById('reg-pass')?.value.trim();
        const perfilSelect = document.getElementById('reg-perfil');
        const perfil = perfilSelect ? perfilSelect.value : 'professor';

        if (!validarCamposCadastro(nome, email, senha)) {
            return;
        }

        const usuarios = carregarUsuarios();

        if (usuarios.find(u => u.email === email)) {
            mostrarMensagem('Este e-mail ja esta cadastrado!', 'erro');
            return;
        }

        const novoUsuario = {
            id: Date.now(),
            nome: nome,
            email: email,
            senha: senha,
            perfil: perfil,
            criadoEm: new Date().toISOString(),
            ultimoAcesso: null
        };

        usuarios.push(novoUsuario);
        salvarUsuarios(usuarios);

        console.log('Novo usuario cadastrado:', email);
        mostrarMensagem('Conta criada com sucesso! Faca login.', 'sucesso');

        setTimeout(() => {
            if (typeof UI !== 'undefined') {
                UI.toggleAuth('login');
            } else {
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('signup-form').style.display = 'none';
            }
            limparCamposCadastro();
        }, 1500);
    }

    function validarCamposCadastro(nome, email, senha) {
        if (!nome || !email || !senha) {
            mostrarMensagem('Preencha todos os campos!', 'erro');
            return false;
        }
        if (senha.length < 6) {
            mostrarMensagem('A senha deve ter no minimo 6 caracteres!', 'erro');
            return false;
        }
        if (!email.includes('@') || !email.includes('.')) {
            mostrarMensagem('Digite um e-mail valido!', 'erro');
            return false;
        }
        return true;
    }

    function limparCamposCadastro() {
        const nome = document.getElementById('reg-nome');
        const email = document.getElementById('reg-email');
        const senha = document.getElementById('reg-pass');
        const perfil = document.getElementById('reg-perfil');
        
        if (nome) nome.value = '';
        if (email) email.value = '';
        if (senha) senha.value = '';
        if (perfil) perfil.value = 'professor';
    }

    // ===== SESSAO =====
    function verificarSessao() {
        const sessao = localStorage.getItem(STORAGE_KEYS.SESSAO);
        if (!sessao) return false;

        try {
            const dados = JSON.parse(sessao);
            
            if (Date.now() > dados.expira) {
                console.log('Sessao expirada');
                logout();
                return false;
            }

            console.log('Sessao valida encontrada');
            return true;
        } catch (e) {
            console.error('Erro ao ler sessao:', e);
            logout();
            return false;
        }
    }

    function entrarSistema(usuario) {
        console.log('Entrando no sistema como:', usuario.perfil);
        
        const authScreen = document.getElementById('auth-screen');
        const appContent = document.getElementById('app-content');
        const sysHeader = document.getElementById('sys-header');

        if (authScreen) authScreen.classList.remove('active');
        if (appContent) appContent.style.display = 'flex';
        if (sysHeader) sysHeader.style.display = 'flex';

        // Atualizar nome do usuario no cabecalho
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            const perfilTexto = usuario.perfil === 'coordenador' ? 'Coordenador' : 'Professor';
            userInfo.innerText = `${perfilTexto}: ${usuario.nome}`;
        }

        // Atualizar o titulo do menu inicial
        const welcomeUserName = document.getElementById('welcome-user-name');
        if (welcomeUserName) {
            welcomeUserName.textContent = usuario.nome;
        }

        const welcomeUser = document.getElementById('welcome-user');
        if (welcomeUser) {
            welcomeUser.innerText = `Ola, ${usuario.nome}!`;
        }

        const welcomeBox = document.querySelector('.welcome-box h1');
        if (welcomeBox) {
            welcomeBox.innerHTML = `Bem-vindo, ${usuario.nome}!`;
        }

        // Aplicar perfil ao body
        document.body.setAttribute('data-perfil', usuario.perfil);

        // Mostrar/esconder elementos especificos por perfil
        aplicarPermissoes(usuario.perfil);

        if (typeof Navigation !== 'undefined') {
            Navigation.showSection('menu');
        }
        
        // Atualizar informacoes rapidas
        if (typeof window.atualizarInfoRapida === 'function') {
            setTimeout(() => window.atualizarInfoRapida(), 100);
        }
    }

    function aplicarPermissoes(perfil) {
        const elementosAdmin = document.querySelectorAll('.coordenador-only');
        const isCoordenador = (perfil === 'coordenador');
        
        elementosAdmin.forEach(el => {
            el.style.display = isCoordenador ? 'block' : 'none';
        });

        // Ajustar elementos especificos do menu
        const cardsCoordenador = document.querySelectorAll('.dashboard-card.coordenador-only');
        cardsCoordenador.forEach(card => {
            card.style.display = isCoordenador ? 'block' : 'none';
        });

        if (perfil === 'professor') {
            // Desabilitar inputs de cadastro para professores
            const secCadastros = document.getElementById('sec-cadastros');
            if (secCadastros) {
                const inputs = secCadastros.querySelectorAll('input, button, select');
                inputs.forEach(el => {
                    if (!el.classList.contains('back-link') && !el.closest('.back-link')) {
                        el.disabled = true;
                    }
                });
                
                // Adicionar mensagem para professor
                if (!document.getElementById('professor-msg')) {
                    const msg = document.createElement('div');
                    msg.id = 'professor-msg';
                    msg.className = 'professor-message';
                    msg.innerHTML = '<strong>Professor</strong> - Voce esta logado como Professor. Apenas coordenadores podem gerenciar cadastros.';
                    secCadastros.insertBefore(msg, secCadastros.firstChild);
                }
            }
        } else {
            // Remover mensagem e habilitar inputs para coordenador
            const msg = document.getElementById('professor-msg');
            if (msg) msg.remove();
            
            const secCadastros = document.getElementById('sec-cadastros');
            if (secCadastros) {
                const inputs = secCadastros.querySelectorAll('input, button, select');
                inputs.forEach(el => {
                    el.disabled = false;
                });
            }
        }
    }

    function logout() {
        console.log('Fazendo logout');
        localStorage.removeItem(STORAGE_KEYS.SESSAO);
        window.location.reload();
    }

    // ===== UTILITARIOS =====
    function mostrarMensagem(texto, tipo) {
        let msgBox = document.querySelector('.auth-message');
        
        if (!msgBox) {
            msgBox = document.createElement('div');
            msgBox.className = 'auth-message';
            const authBox = document.querySelector('.auth-box');
            if (authBox) {
                authBox.insertBefore(msgBox, authBox.firstChild);
            } else {
                msgBox.style.position = 'fixed';
                msgBox.style.top = '20px';
                msgBox.style.left = '50%';
                msgBox.style.transform = 'translateX(-50%)';
                msgBox.style.zIndex = '9999';
                document.body.appendChild(msgBox);
            }
        }

        msgBox.textContent = texto;
        msgBox.className = `auth-message ${tipo}`;
        msgBox.style.display = 'block';

        setTimeout(() => {
            msgBox.style.display = 'none';
        }, 3000);
    }

    function getUsuarioAtual() {
        const sessao = localStorage.getItem(STORAGE_KEYS.SESSAO);
        if (!sessao) return null;
        
        try {
            return JSON.parse(sessao).usuario;
        } catch {
            return null;
        }
    }

    function isCoordenador() {
        const usuario = getUsuarioAtual();
        return usuario && usuario.perfil === 'coordenador';
    }

    function isProfessor() {
        const usuario = getUsuarioAtual();
        return usuario && usuario.perfil === 'professor';
    }

    // ===== GERENCIAMENTO DE USUARIOS (PARA COORDENADOR) =====
    function listarUsuarios() {
        return carregarUsuarios();
    }

    function removerUsuario(id) {
        if (!isCoordenador()) {
            mostrarMensagem('Apenas coordenadores podem remover usuarios!', 'erro');
            return false;
        }
        
        const usuarios = carregarUsuarios();
        const index = usuarios.findIndex(u => u.id === id);
        
        if (index === -1) {
            return false;
        }
        
        // Nao permitir remover o ultimo coordenador
        const coordenadores = usuarios.filter(u => u.perfil === 'coordenador');
        if (usuarios[index].perfil === 'coordenador' && coordenadores.length <= 1) {
            mostrarMensagem('Nao e possivel remover o ultimo coordenador!', 'erro');
            return false;
        }
        
        usuarios.splice(index, 1);
        salvarUsuarios(usuarios);
        return true;
    }

    function alterarSenha(id, novaSenha) {
        const usuarios = carregarUsuarios();
        const usuario = usuarios.find(u => u.id === id);
        
        if (!usuario) {
            return false;
        }
        
        if (novaSenha.length < 6) {
            return false;
        }
        
        usuario.senha = novaSenha;
        salvarUsuarios(usuarios);
        return true;
    }

    // API Publica
    return {
        init,
        handleLogin,
        handleSignup,
        logout,
        verificarSessao,
        getUsuarioAtual,
        isCoordenador,
        isProfessor,
        aplicarPermissoes,
        listarUsuarios,
        removerUsuario,
        alterarSenha
    };
})();