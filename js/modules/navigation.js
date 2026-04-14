// ============================================
// NAVIGATION.JS - Navegação entre Seções
// Versão Completa e Corrigida
// ============================================

const Navigation = (function() {
    // ===== SEÇÕES =====
    function showSection(id) {
        console.log('📱 Navegando para:', id);
        
        document.querySelectorAll('.app-section').forEach(s => {
            s.classList.remove('active');
        });

        let targetId = '';
        if (id === 'menu') {
            targetId = 'main-menu';
        } else if (id === 'cadastros') {
            targetId = 'sec-cadastros';
        } else if (id === 'reservas') {
            targetId = 'sec-reservas';
        } else if (id === 'monitoria') {
            targetId = 'sec-monitoria';
        } else if (id.startsWith('sec-')) {
            targetId = id;
        } else {
            targetId = `sec-${id}`;
        }
        
        const target = document.getElementById(targetId);

        if (target) {
            target.classList.add('active');
            
            switch(id) {
                case 'monitoria':
                    initMonitoria();
                    break;
                case 'cadastros':
                    initCadastros();
                    break;
                case 'reservas':
                    initReservas();
                    break;
                case 'menu':
                    initMenu();
                    break;
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error('❌ Seção não encontrada:', targetId);
        }
    }

    function initMonitoria() {
        console.log('🔄 Inicializando Monitoria...');
        try {
            if (typeof Calendar !== 'undefined') {
                if (Calendar.initControls) Calendar.initControls('monitoria');
                if (Calendar.generateMonitoriaCalendar) Calendar.generateMonitoriaCalendar();
                if (Calendar.updateDateDisplay) Calendar.updateDateDisplay();
            }
            if (typeof Reservations !== 'undefined') {
                if (Reservations.renderMonitoria) Reservations.renderMonitoria();
            }
            updateCurrentMonitoriaDisplay();
        } catch (error) {
            console.error('❌ Erro na monitoria:', error);
        }
    }

    function initCadastros() {
        console.log('🔄 Inicializando Cadastros...');
        try {
            if (typeof UI !== 'undefined') {
                if (UI.renderListasCadastros) UI.renderListasCadastros();
            }
            if (typeof Periodos !== 'undefined') {
                setTimeout(() => {
                    if (Periodos.renderizarInterface) Periodos.renderizarInterface();
                    if (Periodos.popularControlesAno) Periodos.popularControlesAno();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Erro nos cadastros:', error);
        }
    }

    function initReservas() {
        console.log('🔄 Inicializando Reservas...');
        try {
            if (typeof Calendar !== 'undefined') {
                if (Calendar.initControls) Calendar.initControls('reserva');
                if (Calendar.generateReservaCalendar) Calendar.generateReservaCalendar();
                if (Calendar.updateDateDisplay) Calendar.updateDateDisplay();
            }
            if (typeof Reservations !== 'undefined') {
                if (Reservations.renderTable) Reservations.renderTable();
            }
            updateCurrentLabDisplay();
        } catch (error) {
            console.error('❌ Erro nas reservas:', error);
        }
    }

    function initMenu() {
        console.log('🔄 Atualizando Menu...');
        try {
            updateQuickInfo();
            updateWelcomeUser();
        } catch (error) {
            console.error('❌ Erro no menu:', error);
        }
    }

    function updateCurrentLabDisplay() {
        const display = document.getElementById('current-lab-display');
        if (!display) return;
        
        const currentLab = (typeof Reservations !== 'undefined' && Reservations.getCurrentLab) 
            ? Reservations.getCurrentLab() 
            : 'Lab Informática';
        
        const icon = display.querySelector('.current-lab-icon');
        const name = display.querySelector('.current-lab-name');
        
        if (currentLab.includes('Informática')) {
            if (icon) icon.textContent = '💻';
        } else if (currentLab.includes('Hardware')) {
            if (icon) icon.textContent = '🛠️';
        } else if (currentLab.includes('Multimídia')) {
            if (icon) icon.textContent = '🎬';
        }
        if (name) name.textContent = currentLab;
    }

    function updateCurrentMonitoriaDisplay() {
        const display = document.getElementById('current-monitoria-display');
        if (!display) return;
        
        const currentArea = (typeof Reservations !== 'undefined' && Reservations.getCurrentMonitoriaArea)
            ? Reservations.getCurrentMonitoriaArea()
            : 'Geral';
        
        const icon = display.querySelector('.current-lab-icon');
        const name = display.querySelector('.current-lab-name');
        
        const icons = { Geral: '🏠', Lei: '⚖️', Hardware: '🛠️', Multimídia: '🎬' };
        const names = { Geral: 'Monitoria Geral', Lei: 'Monitor Lei', Hardware: 'Monitor Hardware', Multimídia: 'Monitor Multimeios' };
        
        if (icon) icon.textContent = icons[currentArea] || '🏠';
        if (name) name.textContent = names[currentArea] || 'Monitoria Geral';
    }

    function updateQuickInfo() {
        const dataDisplay = document.getElementById('current-date-display');
        if (dataDisplay) {
            const hoje = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dataDisplay.textContent = hoje.toLocaleDateString('pt-BR', options);
        }

        const profCount = document.getElementById('professores-count');
        if (profCount && typeof Database !== 'undefined') {
            const professores = Database.getData('professores') || [];
            profCount.textContent = professores.length;
        }

        const turmasCount = document.getElementById('turmas-count');
        if (turmasCount && typeof Database !== 'undefined') {
            const turmas = Database.getData('turmas') || [];
            turmasCount.textContent = turmas.length;
        }
    }

    function updateWelcomeUser() {
        const welcomeSpan = document.getElementById('welcome-user-name');
        if (!welcomeSpan) return;
        
        const sessao = localStorage.getItem('portal_sessao');
        if (sessao) {
            try {
                const dados = JSON.parse(sessao);
                if (dados.usuario && dados.usuario.nome) {
                    welcomeSpan.textContent = dados.usuario.nome;
                    return;
                }
            } catch (e) {}
        }
        welcomeSpan.textContent = 'servidor';
    }

    function openLab(labName) {
        console.log('🔬 Abrindo laboratório:', labName);
        if (typeof Reservations !== 'undefined' && Reservations.changeLab) {
            const buttons = document.querySelectorAll('.btn-lab');
            let targetButton = null;
            buttons.forEach(btn => {
                const btnLabName = btn.querySelector('.lab-name')?.textContent;
                if (btnLabName === labName || btn.textContent.includes(labName)) {
                    targetButton = btn;
                }
            });
            Reservations.changeLab(labName, targetButton);
        }
        showSection('reservas');
    }

    function goBack() {
        showSection('menu');
    }

    function getCurrentSection() {
        const active = document.querySelector('.app-section.active');
        if (!active) return null;
        const id = active.id;
        if (id === 'main-menu') return 'menu';
        if (id === 'sec-reservas') return 'reservas';
        if (id === 'sec-monitoria') return 'monitoria';
        if (id === 'sec-cadastros') return 'cadastros';
        return id;
    }

    return {
        showSection,
        openLab,
        goBack,
        getCurrentSection,
        updateQuickInfo,
        updateWelcomeUser,
        updateCurrentLabDisplay,
        updateCurrentMonitoriaDisplay,
        initMonitoria,
        initCadastros,
        initReservas,
        initMenu
    };
})();

window.Navigation = Navigation;