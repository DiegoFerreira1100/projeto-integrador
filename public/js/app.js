// ============================================
// APP.JS - Arquivo Principal
// Versão Corrigida - Sem Emojis, Visual Profissional
// ============================================

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando sistema...');
    
    try {
        // Inicializar módulos na ordem correta
        if (typeof Database !== 'undefined') {
            Database.init();
            console.log('Database inicializado');
        }
        
        if (typeof Auth !== 'undefined') {
            Auth.init();
            console.log('Auth inicializado');
        }
        
        if (typeof Turmas !== 'undefined') {
            Turmas.init();
            console.log('Turmas inicializado');
        }
        
        if (typeof Periodos !== 'undefined') {
            Periodos.init();
            console.log('Periodos inicializado');
        }
        
        if (typeof Calendar !== 'undefined') {
            Calendar.init();
            console.log('Calendar inicializado');
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
                        const perfilTexto = dados.usuario.perfil === 'coordenador' ? 'Coordenador' : 'Professor';
                        userInfo.innerText = `${perfilTexto}: ${dados.usuario.nome}`;
                    }
                    
                    // Aplicar perfil ao body
                    if (dados.usuario?.perfil) {
                        document.body.setAttribute('data-perfil', dados.usuario.perfil);
                    }
                    
                    // Aplicar permissões de interface
                    if (typeof Auth !== 'undefined' && Auth.aplicarPermissoes) {
                        Auth.aplicarPermissoes(dados.usuario.perfil);
                    }
                    
                    // Mostrar seção inicial
                    if (typeof Navigation !== 'undefined') {
                        Navigation.showSection('menu');
                    }
                    
                    console.log('Sessão restaurada para:', dados.usuario?.nome);
                } else {
                    // Sessão expirada
                    localStorage.removeItem('portal_sessao');
                    document.getElementById('auth-screen')?.classList.add('active');
                    console.log('Sessão expirada');
                }
            } catch (e) {
                console.error('Erro ao ler sessão:', e);
                localStorage.removeItem('portal_sessao');
                document.getElementById('auth-screen')?.classList.add('active');
            }
        } else {
            // Sem sessão
            document.getElementById('auth-screen')?.classList.add('active');
            console.log('Nenhuma sessão ativa');
        }

        // Renderizar listas de cadastro
        if (typeof UI !== 'undefined') {
            setTimeout(() => {
                UI.renderListasCadastros();
            }, 100);
        }
        
        // Atualizar informações rápidas
        setTimeout(() => {
            atualizarInfoRapida();
        }, 200);

        console.log('Sistema inicializado com sucesso!');
        
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

/**
 * Atualiza o nome do usuário na interface
 * @param {string} nome - Nome do usuário
 * @param {string} perfil - Perfil do usuário (coordenador ou professor)
 */
function atualizarNomeUsuario(nome, perfil) {
    // Atualizar o span no hero banner
    const welcomeUserName = document.getElementById('welcome-user-name');
    if (welcomeUserName) {
        welcomeUserName.textContent = nome;
    }
    
    // Também atualizar o elemento específico se existir
    const welcomeUser = document.getElementById('welcome-user');
    if (welcomeUser) {
        welcomeUser.innerText = `Ola, ${nome}!`;
    }
    
    // Atualizar o título do menu inicial (legado)
    const welcomeBox = document.querySelector('.welcome-box h1');
    if (welcomeBox) {
        welcomeBox.innerHTML = `Bem-vindo, ${nome}!`;
    }
}

/**
 * Atualiza as informações rápidas no menu inicial
 */
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

// Fechar menu de contexto ao clicar fora
window.onclick = (e) => {
    const menu = document.getElementById('custom-menu');
    if (menu && !e.target.closest('#custom-menu')) {
        menu.style.display = 'none';
    }
};

// Prevenir menu de contexto padrão no calendário
window.oncontextmenu = (e) => {
    if (e.target.closest('.calendar-day') && !e.target.closest('.empty')) {
        e.preventDefault();
    }
};

// ===== FUNÇÃO DE EXPORTAÇÃO DE BACKUP =====
function exportarDados() {
    if (typeof Database === 'undefined' || typeof Database.exportarBackup !== 'function') {
        if (typeof UI !== 'undefined') {
            UI.showNotification('Erro: Modulo Database nao disponivel', 'erro');
        } else {
            alert('Erro: Modulo Database nao disponivel');
        }
        return;
    }
    
    const backup = Database.exportarBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup-portal-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    if (typeof UI !== 'undefined') {
        UI.showNotification('Backup exportado com sucesso!', 'sucesso');
    }
}

// ===== FUNÇÃO DE IMPORTAÇÃO DE BACKUP =====
function importarDados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (typeof UI !== 'undefined') {
                    UI.showConfirmModal(
                        'Importar Backup',
                        'Tem certeza que deseja importar este backup?<br><br><span style="color: #dc2626;">Esta acao substituira todos os dados atuais!</span>',
                        () => {
                            if (typeof Database !== 'undefined' && Database.importarBackup) {
                                const resultado = Database.importarBackup(backup);
                                if (resultado.sucesso) {
                                    UI.showNotification('Backup importado com sucesso!', 'sucesso');
                                    setTimeout(() => window.location.reload(), 1500);
                                } else {
                                    UI.showNotification(resultado.mensagem || 'Erro ao importar backup', 'erro');
                                }
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Erro ao ler arquivo:', error);
                if (typeof UI !== 'undefined') {
                    UI.showNotification('Arquivo de backup invalido!', 'erro');
                }
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ===== FUNÇÃO PARA LIMPAR DADOS =====
function limparDadosSistema() {
    if (typeof Database !== 'undefined' && Database.limparDados) {
        Database.limparDados();
    } else if (typeof UI !== 'undefined') {
        UI.showConfirmModal(
            'Limpar Todos os Dados',
            'Tem certeza que deseja limpar todos os dados do sistema?<br><br><span style="color: #dc2626; font-weight: bold;">Esta acao nao pode ser desfeita!</span>',
            () => {
                localStorage.clear();
                window.location.reload();
            }
        );
    }
}

// ===== FUNÇÃO PARA ALTERNAR TEMA (PREPARAÇÃO PARA FUTURO) =====
function alternarTema() {
    const body = document.body;
    const temaAtual = body.getAttribute('data-theme') || 'light';
    const novoTema = temaAtual === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', novoTema);
    localStorage.setItem('portal_tema', novoTema);
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
window.importarDados = importarDados;
window.limparDadosSistema = limparDadosSistema;
window.atualizarInfoRapida = atualizarInfoRapida;
window.atualizarNomeUsuario = atualizarNomeUsuario;

// ===== VERSÃO DO SISTEMA =====
const SISTEMA = {
    nome: 'Portal Gestao Escolar',
    versao: '3.2',
    autor: 'JarmisonJr',
    ano: new Date().getFullYear()
};

console.log(`
==========================================
   ${SISTEMA.nome} v${SISTEMA.versao}
   (c) ${SISTEMA.ano} ${SISTEMA.autor}
==========================================
`);

// ===== VERIFICAR ATUALIZAÇÕES (OPCIONAL) =====
function verificarAtualizacoes() {
    const versaoAtual = SISTEMA.versao;
    const ultimaVerificacao = localStorage.getItem('ultima_verificacao');
    const agora = Date.now();
    
    // Verificar uma vez por dia
    if (!ultimaVerificacao || (agora - parseInt(ultimaVerificacao)) > 86400000) {
        localStorage.setItem('ultima_verificacao', agora.toString());
        console.log('Sistema atualizado na versao', versaoAtual);
    }
}

// Executar verificação de atualizações
setTimeout(() => {
    verificarAtualizacoes();
}, 5000);