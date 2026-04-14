// ============================================
// NAVIGATION.JS - Navegação entre Seções
// ============================================

const Navigation = (function() {
    // ===== SEÇÕES =====
    function showSection(id) {
        document.querySelectorAll('.app-section').forEach(s => {
            s.classList.remove('active');
        });

        let targetId = id === 'menu' ? 'main-menu' : (id.startsWith('sec-') ? id : `sec-${id}`);
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
            }
        }
    }

    function initMonitoria() {
        if (typeof Calendar !== 'undefined') {
            Calendar.initControls('monitoria');
            Calendar.generateMonitoriaCalendar();
            Calendar.updateDateDisplay();
        }
        if (typeof Reservations !== 'undefined') {
            Reservations.renderMonitoria();
        }
    }

    function initCadastros() {
        if (typeof UI !== 'undefined') {
            UI.renderListasCadastros();
        }
        if (typeof Periodos !== 'undefined') {
            setTimeout(() => {
                Periodos.renderizarInterface();
            }, 50);
        }
    }

    function initReservas() {
        if (typeof Calendar !== 'undefined') {
            Calendar.initControls('reserva');
            Calendar.generateReservaCalendar();
            Calendar.updateDateDisplay();
        }
        if (typeof Reservations !== 'undefined') {
            Reservations.renderTable();
        }
    }

    // ===== LABORATÓRIOS =====
    function openLab(name) {
        if (typeof Reservations !== 'undefined') {
            Reservations.setLab(name);
        }
        showSection('reservas');
    }

    function goBack() {
        showSection('menu');
    }

    function getCurrentSection() {
        const active = document.querySelector('.app-section.active');
        return active ? active.id : null;
    }

    // API Pública
    return {
        showSection,
        openLab,
        goBack,
        getCurrentSection
    };
})();