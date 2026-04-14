// ============================================
// CALENDAR.JS - Gerenciamento do Calendário
// Versão Completa com Integração de Períodos Letivos
// ============================================

const Calendar = (function() {
    // Estado
    let selectedDate = new Date().toISOString().split('T')[0];
    let dayToCustomize = null;
    let isContextMenuEnabled = true;

    // Constantes
    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // ===== INICIALIZAÇÃO =====
    function init() {
        initControls('reserva');
        initControls('monitoria');
        
        // Verificar perfil para habilitar/desabilitar menu de contexto
        if (typeof Auth !== 'undefined') {
            isContextMenuEnabled = Auth.isCoordenador();
        }
        
        setTimeout(() => {
            generateAll();
            updateDateDisplay();
        }, 100);
    }

    function initControls(prefix) {
        const mSel = document.getElementById(`${prefix}-month`);
        const ySel = document.getElementById(`${prefix}-year`);

        if (!mSel) return;

        mSel.innerHTML = '';
        ySel.innerHTML = '';

        MESES.forEach((m, i) => {
            const option = new Option(m, i);
            mSel.add(option);
        });

        const anoAtual = new Date().getFullYear();
        for (let i = anoAtual - 2; i <= anoAtual + 4; i++) {
            const option = new Option(i, i);
            ySel.add(option);
        }

        const hoje = new Date();
        mSel.value = hoje.getMonth();
        ySel.value = hoje.getFullYear();

        mSel.addEventListener('change', generateAll);
        ySel.addEventListener('change', generateAll);
    }

    function generateAll() {
        generateReservaCalendar();
        generateMonitoriaCalendar();
    }

    function generateReservaCalendar() {
        generateGeneric('calendar-grid', 'reserva-month', 'reserva-year');
    }

    function generateMonitoriaCalendar() {
        generateGeneric('monitoria-grid', 'monitoria-month', 'monitoria-year');
    }

    function generateGeneric(gridId, monthId, yearId) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const monthSel = document.getElementById(monthId);
        const yearSel = document.getElementById(yearId);
        
        if (!monthSel || !yearSel) return;

        const month = parseInt(monthSel.value);
        const year = parseInt(yearSel.value);
        
        grid.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Ajuste: domingo (0) vai para última posição (6)
        let startOffset;
        if (firstDay === 0) {
            startOffset = 6;
        } else {
            startOffset = firstDay - 1;
        }

        // Dias vazios no início
        for (let i = 0; i < startOffset; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            grid.appendChild(emptyCell);
        }

        // Dias do mês
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayCell = criarCelulaDia(dateStr, d, month, year);
            grid.appendChild(dayCell);
        }

        // Completar com células vazias no final
        const totalCells = grid.children.length;
        const remainingCells = 42 - totalCells;
        if (remainingCells > 0) {
            for (let i = 0; i < remainingCells; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                grid.appendChild(emptyCell);
            }
        }
    }

    function criarCelulaDia(dateStr, dia, month, year) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        // Verificar se é o dia selecionado
        if (dateStr === selectedDate) {
            cell.classList.add('selected');
        }

        // Verificar se é dia letivo (usando períodos)
        let isLetivo = true;
        if (typeof Periodos !== 'undefined') {
            isLetivo = Periodos.isDiaLetivo(dateStr);
        }
        
        // Verificar marcações
        let marcacao = null;
        if (typeof Database !== 'undefined') {
            marcacao = Database.getMarcacao(dateStr);
        }

        // Aplicar classes baseadas no status
        if (!isLetivo) {
            cell.classList.add('status-feriado');
            cell.classList.add('dia-nao-letivo');
        } else if (marcacao) {
            if (marcacao.type === 'feriado') {
                cell.classList.add('status-feriado');
            } else if (marcacao.type === 'evento') {
                cell.classList.add('status-evento');
            }
        }

        // Conteúdo da célula
        cell.innerHTML = `<span>${dia}</span>`;
        
        if (marcacao && isLetivo) {
            const label = document.createElement('span');
            label.className = 'day-label';
            label.textContent = marcacao.desc.substring(0, 3) + (marcacao.desc.length > 3 ? '…' : '');
            cell.appendChild(label);
        } else if (!isLetivo) {
            const label = document.createElement('span');
            label.className = 'day-label';
            label.textContent = '🚫';
            cell.appendChild(label);
        }

        // Evento de clique
        cell.onclick = () => selecionarDia(dateStr);

        // Verificar perfil do usuário
        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        const isCoordenador = usuario && usuario.perfil === 'coordenador';
        
        // Menu de contexto só para coordenadores em dias letivos
        if (isCoordenador && isLetivo) {
            cell.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                dayToCustomize = cell;
                dayToCustomize.dataset.tempDate = dateStr;
                
                const menu = document.getElementById('custom-menu');
                if (menu) {
                    menu.style.display = 'block';
                    menu.style.left = e.pageX + 'px';
                    menu.style.top = e.pageY + 'px';
                    
                    // Garantir que o menu não saia da tela
                    const rect = menu.getBoundingClientRect();
                    if (rect.right > window.innerWidth) {
                        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
                    }
                    if (rect.bottom > window.innerHeight) {
                        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
                    }
                }
                return false;
            };
        }

        return cell;
    }

    // ===== FUNÇÃO PRINCIPAL DE VERIFICAÇÃO DE BLOQUEIO =====
    function isDiaBloqueado(dateStr) {
        if (!dateStr) dateStr = selectedDate;
        
        try {
            // 1️⃣ Verificar se é dia letivo (períodos)
            if (typeof Periodos !== 'undefined') {
                if (!Periodos.isDiaLetivo(dateStr)) {
                    return true; // Fora do período letivo = bloqueado
                }
            }
            
            // 2️⃣ Verificar marcações de feriado/evento
            let marcacao = null;
            if (typeof Database !== 'undefined') {
                marcacao = Database.getMarcacao(dateStr);
            }
            if (marcacao && marcacao.type !== 'letivo') {
                return true; // Feriado ou evento bloqueia
            }
            
            return false;
            
        } catch (e) {
            console.error('Erro ao verificar bloqueio:', e);
            return false;
        }
    }

    function selecionarDia(dateStr) {
        selectedDate = dateStr;
        updateDateDisplay();
        generateAll();
        
        if (typeof Reservations !== 'undefined') {
            Reservations.renderAll();
        }
    }

    function applyStatus(status) {
        if (!dayToCustomize) return;

        const dateStr = dayToCustomize.dataset.tempDate;

        // Verificar se é coordenador
        if (typeof Auth !== 'undefined' && !Auth.isCoordenador()) {
            UI.showNotification('Apenas coordenadores podem marcar feriados/eventos!', 'erro');
            fecharMenu();
            return;
        }

        if (status === 'letivo') {
            if (typeof Database !== 'undefined') {
                Database.setMarcacao(dateStr, 'letivo');
                UI.showNotification('Dia marcado como letivo!', 'sucesso');
            }
        } else {
            const desc = prompt(`Descrição do ${status}:`, "");
            if (desc && desc.trim()) {
                if (typeof Database !== 'undefined') {
                    Database.setMarcacao(dateStr, status, desc.trim());
                    
                    // Se for feriado/evento, perguntar se quer limpar reservas
                    if (confirm('Deseja remover todas as reservas deste dia?')) {
                        limparReservasDoDia(dateStr);
                    }
                    
                    UI.showNotification(`${status} marcado com sucesso!`, 'sucesso');
                }
            }
        }

        fecharMenu();
        generateAll();
        
        if (typeof Reservations !== 'undefined') {
            Reservations.renderAll();
        }
    }

    function limparReservasDoDia(dateStr) {
        // Encontrar e remover todas as reservas desta data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('res-') && key.includes(dateStr)) {
                keysToRemove.push(key);
            }
            if (key.startsWith('mon-') && key.includes(dateStr)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`Reservas do dia removidas!`, 'sucesso');
        }
    }

    function fecharMenu() {
        const menu = document.getElementById('custom-menu');
        if (menu) menu.style.display = 'none';
        dayToCustomize = null;
    }

    function updateDateDisplay() {
        if (!selectedDate) return;
        
        const [y, m, d] = selectedDate.split('-');
        const fmt = `${d}/${m}/${y}`;

        const labels = ['selected-date-label', 'selected-monitoria-date-label'];
        labels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `Horários para: ${fmt}`;
        });
    }

    function toggleView() {
        // Função mantida para compatibilidade, mas não usada
        console.log('Calendar toggle view');
    }

    function getSelectedDate() {
        return selectedDate;
    }

    // ===== FUNÇÕES PARA CONTROLE DE MÊS/ANO =====
    function setMonth(month) {
        const reservaMonth = document.getElementById('reserva-month');
        const monitoriaMonth = document.getElementById('monitoria-month');
        
        if (reservaMonth) reservaMonth.value = month;
        if (monitoriaMonth) monitoriaMonth.value = month;
        
        generateAll();
    }

    function setYear(year) {
        const reservaYear = document.getElementById('reserva-year');
        const monitoriaYear = document.getElementById('monitoria-year');
        
        if (reservaYear) reservaYear.value = year;
        if (monitoriaYear) monitoriaYear.value = year;
        
        generateAll();
    }

    // API Pública
    return {
        init,
        initControls,
        generateAll,
        generateReservaCalendar,
        generateMonitoriaCalendar,
        selecionarDia,
        applyStatus,
        toggleView,
        getSelectedDate,
        isDiaBloqueado,
        updateDateDisplay,
        fecharMenu,
        setMonth,
        setYear
    };
})();