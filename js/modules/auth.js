// ============================================
// AUTH.JS - Sistema de Autenticacao com Firebase
// ============================================

const Auth = (function() {
    
    // ===== INICIALIZACAO =====
    function init() {
        setupEventListeners();
        
        // Observar mudanças no estado de autenticação do Firebase
        if (window.auth) {
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    console.log('Usuário logado no Firebase:', user.email);
                    
                    // Buscar perfil do usuário no Firestore
                    try {
                        const userDoc = await window.db.collection('users').doc(user.uid).get();
                        const userData = userDoc.data();
                        
                        if (userData) {
                            entrarSistema(userData);
                        } else {
                            console.error('Usuário sem perfil no Firestore');
                            // Criar perfil padrão para usuário existente
                            const defaultProfile = {
                                nome: user.email.split('@')[0],
                                email: user.email,
                                perfil: 'professor',
                                uid: user.uid
                            };
                            await window.db.collection('users').doc(user.uid).set(defaultProfile);
                            entrarSistema(defaultProfile);
                        }
                    } catch (error) {
                        console.error('Erro ao buscar perfil:', error);
                    }
                } else {
                    console.log('Nenhum usuário logado');
                    mostrarTelaLogin();
                }
            });
        } else {
            console.error('Firebase Auth não disponível');
        }
    }
    
    function setupEventListeners() {
        const loginPass = document.getElementById('login-pass');
        if (loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
        }
        
        const regPass = document.getElementById('reg-pass');
        if (regPass) {
            regPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSignup();
            });
        }
    }
    
    // ===== LOGIN =====
    async function handleLogin() {
        const email = document.getElementById('login-email')?.value.trim();
        const senha = document.getElementById('login-pass')?.value.trim();
        
        if (!email || !senha) {
            mostrarMensagem('Preencha todos os campos!', 'erro');
            return;
        }
        
        try {
            const userCredential = await window.auth.signInWithEmailAndPassword(email, senha);
            console.log('Login bem-sucedido:', userCredential.user.email);
            
            // Buscar dados do usuário no Firestore
            const userDoc = await window.db.collection('users').doc(userCredential.user.uid).get();
            const userData = userDoc.data();
            
            if (userData && userData.perfil === 'professor' && typeof Database !== 'undefined') {
                Database.adicionarProfessorPorLogin(userData.nome);
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            let mensagem = 'Erro ao fazer login!';
            if (error.code === 'auth/user-not-found') {
                mensagem = 'Usuário não encontrado!';
            } else if (error.code === 'auth/wrong-password') {
                mensagem = 'Senha incorreta!';
            } else if (error.code === 'auth/invalid-email') {
                mensagem = 'E-mail inválido!';
            }
            mostrarMensagem(mensagem, 'erro');
        }
    }
    
    // ===== CADASTRO =====
    async function handleSignup() {
        const nome = document.getElementById('reg-nome')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const senha = document.getElementById('reg-pass')?.value.trim();
        const perfil = document.getElementById('reg-perfil')?.value;
        
        if (!validarCamposCadastro(nome, email, senha)) {
            return;
        }
        
        try {
            // Criar usuário no Firebase Auth
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, senha);
            const user = userCredential.user;
            
            // Salvar perfil no Firestore
            await window.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                nome: nome,
                email: email,
                perfil: perfil,
                criadoEm: new Date().toISOString(),
                ultimoAcesso: null
            });
            
            console.log('Usuário criado com sucesso:', email);
            mostrarMensagem('Conta criada com sucesso!', 'sucesso');
            
            // Limpar formulário
            setTimeout(() => {
                if (typeof UI !== 'undefined') {
                    UI.toggleAuth('login');
                }
                limparCamposCadastro();
            }, 1500);
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            let mensagem = 'Erro ao criar conta!';
            if (error.code === 'auth/email-already-in-use') {
                mensagem = 'Este e-mail já está cadastrado!';
            } else if (error.code === 'auth/weak-password') {
                mensagem = 'A senha deve ter pelo menos 6 caracteres!';
            }
            mostrarMensagem(mensagem, 'erro');
        }
    }
    
    // ===== LOGOUT =====
    async function logout() {
        try {
            await window.auth.signOut();
            console.log('Logout realizado');
            // Limpar dados de sessão antigos
            localStorage.removeItem('portal_sessao');
            localStorage.removeItem('portal_usuarios');
            window.location.reload();
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    }
    
    // ===== UTILITÁRIOS =====
    function mostrarTelaLogin() {
        const authScreen = document.getElementById('auth-screen');
        const appContent = document.getElementById('app-content');
        const sysHeader = document.getElementById('sys-header');
        
        if (authScreen) authScreen.classList.add('active');
        if (appContent) appContent.style.display = 'none';
        if (sysHeader) sysHeader.style.display = 'none';
    }
    
    function entrarSistema(usuario) {
        const authScreen = document.getElementById('auth-screen');
        const appContent = document.getElementById('app-content');
        const sysHeader = document.getElementById('sys-header');
        
        if (authScreen) authScreen.classList.remove('active');
        if (appContent) appContent.style.display = 'flex';
        if (sysHeader) sysHeader.style.display = 'flex';
        
        // Atualizar interface
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            const perfilTexto = usuario.perfil === 'coordenador' ? 'Coordenador' : 'Professor';
            userInfo.innerText = `${perfilTexto}: ${usuario.nome}`;
        }
        
        const welcomeUserName = document.getElementById('welcome-user-name');
        if (welcomeUserName) {
            welcomeUserName.textContent = usuario.nome;
        }
        
        document.body.setAttribute('data-perfil', usuario.perfil);
        aplicarPermissoes(usuario.perfil);
        
        if (typeof Navigation !== 'undefined') {
            Navigation.showSection('menu');
        }
        
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
        
        const cardsCoordenador = document.querySelectorAll('.dashboard-card.coordenador-only');
        cardsCoordenador.forEach(card => {
            card.style.display = isCoordenador ? 'block' : 'none';
        });
    }
    
    function validarCamposCadastro(nome, email, senha) {
        if (!nome || !email || !senha) {
            mostrarMensagem('Preencha todos os campos!', 'erro');
            return false;
        }
        if (senha.length < 6) {
            mostrarMensagem('A senha deve ter no mínimo 6 caracteres!', 'erro');
            return false;
        }
        if (!email.includes('@') || !email.includes('.')) {
            mostrarMensagem('Digite um e-mail válido!', 'erro');
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
    
    function mostrarMensagem(texto, tipo) {
        if (typeof UI !== 'undefined') {
            UI.showNotification(texto, tipo);
        } else {
            alert(texto);
        }
    }
    
    function getUsuarioAtual() {
        return window.auth?.currentUser;
    }
    
    async function isCoordenador() {
        const user = window.auth?.currentUser;
        if (!user) return false;
        
        try {
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            return userDoc.data()?.perfil === 'coordenador';
        } catch {
            return false;
        }
    }
    
    // API Pública
    return {
        init,
        handleLogin,
        handleSignup,
        logout,
        getUsuarioAtual,
        isCoordenador,
        isProfessor: async () => !(await isCoordenador()),
        aplicarPermissoes
    };
})();