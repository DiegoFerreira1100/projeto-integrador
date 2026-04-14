// ============================================
// APP.JS - Arquivo Principal
// Versão Corrigida - Nome do Usuário
// ============================================

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando sistema...');
    
    try {
        // Inicializar módulos na ordem correta
        if (typeof Database !== 'undefined') {
            Database.init();
            console.log('✅ Database inicializado');
        }
        
        if (typeof Auth !== 'undefined') {
            Auth.init();
            console.log('✅ Auth inicializado');
        }
        
        if (typeof Turmas !== 'undefined') {
            Turmas.init();
            console.log('✅ Turmas inicializado');
        }
        
        if (typeof Periodos !== 'undefined') {
            Periodos.init();
            console.log('✅ Periodos inicializado');
        }
        
        if (typeof Calendar !== 'undefined') {
            Calendar.init();
            console.log('✅ Calendar inicializado');
        }

        // Verificar sessão
        const sessao = localStorage.getItem('portal_sessao');
        
        if (sessao) {
            try {
                const dados = JSON.parse(sessao);
                const agora = Date.now();
                
                if (agora < dados.expira) {
                    // Sessão válida
                    document.getElementById('auth-screen')?.classList.remove('active');
                    document.getElementById('app-content').style.display = 'flex';
                    document.getElementById('sys-header').style.display = 'flex';
                    
                    // Atualizar nome do usuário no menu inicial
                    if (dados.usuario && dados.usuario.nome) {
                        atualizarNomeUsuario(dados.usuario.nome, dados.usuario.perfil);
                    }
                    
                    // Mostrar nome do usuário no cabeçalho
                    const userInfo = document.getElementById('user-info');
                    if (userInfo && dados.usuario) {
                        const perfilTexto = dados.usuario.perfil === 'coordenador' ? '👑 Coordenador' : '👨‍🏫 Professor';
                        userInfo.innerText = `${perfilTexto}: ${dados.usuario.nome}`;
                    }
                    
                    // Aplicar perfil ao body
                    if (dados.usuario?.perfil) {
                        document.body.setAttribute('data-perfil', dados.usuario.perfil);
                    }
                    
                    // Mostrar seção inicial
                    if (typeof Navigation !== 'undefined') {
                        Navigation.showSection('menu');
                    }
                    
                    console.log('✅ Sessão restaurada para:', dados.usuario?.nome);
                } else {
                    // Sessão expirada
                    localStorage.removeItem('portal_sessao');
                    document.getElementById('auth-screen')?.classList.add('active');
                    console.log('⏰ Sessão expirada');
                }
            } catch (e) {
                console.error('❌ Erro ao ler sessão:', e);
                localStorage.removeItem('portal_sessao');
                document.getElementById('auth-screen')?.classList.add('active');
            }
        } else {
            // Sem sessão
            document.getElementById('auth-screen')?.classList.add('active');
            console.log('👋 Nenhuma sessão ativa');
        }

        // Renderizar listas de cadastro
        if (typeof UI !== 'undefined') {
            setTimeout(() => {
                UI.renderListasCadastros();
            }, 100);
        }

        console.log('🎉 Sistema inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
    }
});

function atualizarNomeUsuario(nome, perfil) {
    // Atualizar o título do menu inicial
    const welcomeBox = document.querySelector('.welcome-box h1');
    if (welcomeBox) {
        const saudacao = perfil === 'coordenador' ? '👑 Coordenador' : '👨‍🏫 Professor';
        welcomeBox.innerHTML = `Bem-vindo, ${nome}!`;
    }
    
    // Também atualizar o elemento específico se existir
    const welcomeUser = document.getElementById('welcome-user');
    if (welcomeUser) {
        welcomeUser.innerText = `Olá, ${nome}!`;
    }
}

// Fechar menu de contexto ao clicar fora
window.onclick = (e) => {
    const menu = document.getElementById('custom-menu');
    if (menu && !e.target.closest('#custom-menu')) {
        menu.style.display = 'none';
    }
};

// Prevenir menu de contexto padrão
window.oncontextmenu = (e) => {
    if (e.target.closest('.calendar-day') && !e.target.closest('.empty')) {
        e.preventDefault();
    }
};

// ===== FUNÇÃO DE EXPORTAÇÃO DE BACKUP =====
function exportarDados() {
    if (typeof Database === 'undefined' || typeof Database.exportarBackup !== 'function') {
        if (typeof UI !== 'undefined') {
            UI.showNotification('Erro: Módulo Database não disponível', 'erro');
        } else {
            alert('Erro: Módulo Database não disponível');
        }
        return;
    }
    
    const backup = Database.exportarBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup-portal-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    if (typeof UI !== 'undefined') {
        UI.showNotification('Backup exportado com sucesso!', 'sucesso');
    }
}

// ===== GLOBAL EXPORTS =====
window.Auth = Auth;
window.Database = Database;
window.Turmas = Turmas;
window.Periodos = Periodos;
window.Relatorios = Relatorios;
window.Calendar = Calendar;
window.Reservations = Reservations;
window.Navigation = Navigation;
window.UI = UI;
window.exportarDados = exportarDados;

// ===== VERSÃO DO SISTEMA =====
const SISTEMA = {
    nome: 'Portal Gestão Escolar',
    versao: '3.2',
    autor: 'JarmisonJr',
    ano: new Date().getFullYear()
};

console.log(`
╔════════════════════════════════════╗
║   ${SISTEMA.nome} v${SISTEMA.versao}   ║
║   © ${SISTEMA.ano} ${SISTEMA.autor}         ║
╚════════════════════════════════════╝
`);
// ===== ATUALIZAR INFORMAÇÕES RÁPIDAS =====
function atualizarInfoRapida() {
    // Data atual
    const dataDisplay = document.getElementById('current-date-display');
    if (dataDisplay) {
        const hoje = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dataDisplay.textContent = hoje.toLocaleDateString('pt-BR', options);
    }

    // Contagem de professores
    const profCount = document.getElementById('professores-count');
    if (profCount && typeof Database !== 'undefined') {
        const professores = Database.getData('professores') || [];
        profCount.textContent = professores.length;
    }

    // Contagem de turmas
    const turmasCount = document.getElementById('turmas-count');
    if (turmasCount && typeof Database !== 'undefined') {
        const turmas = Database.getData('turmas') || [];
        turmasCount.textContent = turmas.length;
    }
}

// Chamar após inicialização
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    
    setTimeout(() => {
        atualizarInfoRapida();
    }, 200);
});