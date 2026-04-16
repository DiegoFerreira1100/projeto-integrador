// ============================================
// RESERVATIONS.JS - Gerenciamento de Reservas + Monitoria por Área
// Versão Completa e Atualizada
// ============================================

const Reservations = (function() {
    // ==================== CONSTANTES ====================
    const SLOTS = [
        "07:20 - 08:10", "08:10 - 09:00", "09:20 - 10:10",
        "10:10 - 11:00", "11:00 - 11:50", "12:00 - 13:00",
        "13:10 - 14:00", "14:00 - 14:50", "15:10 - 16:00",
        "16:00 - 16:50"
    ];

    let currentLab = "Lab Informática";
    let currentMonitoriaArea = "Geral";

    // Postos específicos por área de Monitoria
    const POSTOS_POR_AREA = {
        "Geral": [
            "Fila (Intervalo da Manhã)",
            "Fila (Almoço)",
            "Sucos (Almoço)",
            "Portaria (Almoço)",
            "Fila (Intervalo da Tarde)",
            "Monitor Reserva"
        ],
        "Lei": [
            "Intervalo do Almoço"
        ],
        "Hardware": [
            "Intervalo do Almoço"
        ],
        "Multimídia": [
            "Intervalo do Almoço"
        ]
    };

    // ==================== LABORATÓRIOS ====================
    function changeLab(lab, btn) {
        currentLab = lab;
        
        document.querySelectorAll('.btn-lab').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        
        const display = document.getElementById('current-lab-display');
        if (display) {
            const icon = display.querySelector('.current-lab-icon');
            const name = display.querySelector('.current-lab-name');
            
            if (lab.includes('Informática')) icon.textContent = '💻';
            else if (lab.includes('Hardware')) icon.textContent = '🛠️';
            else if (lab.includes('Multimídia')) icon.textContent = '🎬';
            
            name.textContent = lab;
        }
        
        renderTable();
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`Laboratório alterado para ${lab}`, 'sucesso');
        }
    }

    function getCurrentLab() {
        return currentLab;
    }

    // ==================== MONITORIA POR ÁREA ====================
    function changeMonitoriaArea(area, btn) {
        currentMonitoriaArea = area;
        
        document.querySelectorAll('#monitoria-area-buttons .btn-lab').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        
        const display = document.getElementById('current-monitoria-display');
        if (display) {
            const icon = display.querySelector('.current-lab-icon');
            const name = display.querySelector('.current-lab-name');
            
            if (area === 'Geral') icon.textContent = '🏠';
            else if (area === 'Lei') icon.textContent = '⚖️';
            else if (area === 'Hardware') icon.textContent = '🛠️';
            else if (area === 'Multimídia') icon.textContent = '🎬';
            
            name.textContent = `Monitor ${area}`;
        }
        
        renderMonitoria();
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`Monitoria alterada para ${area}`, 'sucesso');
        }
    }

    function getCurrentMonitoriaArea() {
        return currentMonitoriaArea;
    }

    // ==================== VERIFICAÇÃO DE DIA BLOQUEADO ====================
    function isDiaBloqueado() {
        const selectedDate = typeof Calendar !== 'undefined' ? Calendar.getSelectedDate() : new Date().toISOString().split('T')[0];
        
        if (typeof Calendar !== 'undefined' && Calendar.isDiaBloqueado) {
            return Calendar.isDiaBloqueado(selectedDate);
        }
        return false;
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    function gerarOpcoesProfessores(valorSelecionado) {
        const professores = typeof Database !== 'undefined' ? Database.getData('professores') : [];
        let options = '<option value="">Selecione um professor</option>';
        
        professores.forEach(prof => {
            const selected = prof === valorSelecionado ? 'selected' : '';
            options += `<option value="${prof}" ${selected}>👨‍🏫 ${prof}</option>`;
        });
        return options;
    }

    function gerarOpcoesTurmas(valorSelecionado) {
        const turmas = typeof Database !== 'undefined' ? Database.getData('turmas') : [];
        let options = '<option value="">Selecione uma turma</option>';
        
        turmas.forEach(turma => {
            const selected = turma === valorSelecionado ? 'selected' : '';
            options += `<option value="${turma}" ${selected}>🏫 ${turma}</option>`;
        });
        return options;
    }

    function gerarOpcoesMonitores(valorSelecionado) {
        const db = typeof Database !== 'undefined' ? Database.getData('db') : { monitores: {} };
        const monitores = Object.values(db.monitores || {}).flat();
        let options = '<option value="">Selecione um monitor</option>';
        
        monitores.forEach(monitor => {
            const selected = monitor === valorSelecionado ? 'selected' : '';
            options += `<option value="${monitor}" ${selected}>👤 ${monitor}</option>`;
        });
        return options;
    }

    // ==================== TABELA DE RESERVAS (Laboratórios) ====================
    function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody || !currentLab) return;

        const selectedDate = typeof Calendar !== 'undefined' ? Calendar.getSelectedDate() : new Date().toISOString().split('T')[0];
        const isBloqueado = isDiaBloqueado();
        const disabledAttr = isBloqueado ? 'disabled' : '';

        tbody.innerHTML = SLOTS.map((slot, i) => {
            const isLunch = slot.includes("12:00");
            
            if (isLunch) {
                return `
                    <tr>
                        <td colspan="4" class="lunch-break">🍱 INTERVALO DE ALMOÇO</td>
                    </tr>
                `;
            }
            
            const reserva = typeof Database !== 'undefined' ? 
                Database.getReserva(currentLab, selectedDate, slot) : { p: '', t: '' };
            
            return `
                <tr>
                    <td><strong>${slot}</strong></td>
                    <td>
                        <select id="p-${i}" onchange="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            ${gerarOpcoesProfessores(reserva.p)}
                        </select>
                    </td>
                    <td>
                        <select id="t-${i}" onchange="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            ${gerarOpcoesTurmas(reserva.t)}
                        </select>
                    </td>
                    <td>
                        <button class="btn-save" onclick="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            Salvar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Mensagem de dia bloqueado
        const header = document.querySelector('#sec-reservas .section-header');
        let msgEl = document.getElementById('reserva-bloqueado-msg');
        
        if (isBloqueado) {
            if (!msgEl) {
                msgEl = document.createElement('div');
                msgEl.id = 'reserva-bloqueado-msg';
                msgEl.className = 'auth-message erro';
                if (header) header.appendChild(msgEl);
            }
            const marcacao = typeof Database !== 'undefined' ? Database.getMarcacao(selectedDate) : null;
            msgEl.textContent = `🔒 DIA BLOQUEADO - ${marcacao ? marcacao.desc : 'Fora do período letivo'}`;
        } else if (msgEl) {
            msgEl.remove();
        }
    }

    function saveReserva(slot, index) {
        if (isDiaBloqueado()) {
            UI.showNotification('❌ Não é possível reservar em dias bloqueados!', 'erro');
            renderTable();
            return;
        }
        
        const selectedDate = typeof Calendar !== 'undefined' ? Calendar.getSelectedDate() : new Date().toISOString().split('T')[0];
        
        const professor = document.getElementById(`p-${index}`)?.value || '';
        const turma = document.getElementById(`t-${index}`)?.value || '';
        
        if (typeof Database !== 'undefined') {
            Database.setReserva(currentLab, selectedDate, slot, professor, turma);
        }
        
        const btn = document.querySelector(`#p-${index}`).closest('tr').querySelector('.btn-save');
        btn.style.backgroundColor = '#10b981';
        btn.textContent = '✓ Salvo!';
        
        setTimeout(() => {
            btn.style.backgroundColor = '';
            btn.textContent = 'Salvar';
        }, 1500);
        
        UI.showNotification('Reserva salva com sucesso!', 'sucesso');
    }

    // ==================== TABELA DE MONITORIA ====================
    function renderMonitoria() {
        const tbody = document.getElementById('tableBodyMonitoria');
        if (!tbody) return;

        const area = getCurrentMonitoriaArea();
        const postos = POSTOS_POR_AREA[area] || [];

        if (postos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">Nenhum posto configurado para esta área</td></tr>';
            return;
        }

        tbody.innerHTML = postos.map((posto, index) => {
            const key = `mon-${area}-${posto}`;
            const saved = localStorage.getItem(key);
            const escala = saved ? JSON.parse(saved) : { m: '', t: '' };
            
            return `
                <tr>
                    <td><strong>${posto}</strong></td>
                    <td>
                        <select id="mon-${index}" onchange="Reservations.saveMonitoria('${posto}', ${index})">
                            ${gerarOpcoesMonitores(escala.m)}
                        </select>
                    </td>
                    <td>
                        <select id="mt-${index}" onchange="Reservations.saveMonitoria('${posto}', ${index})">
                            ${gerarOpcoesTurmas(escala.t)}
                        </select>
                    </td>
                    <td>
                        <button class="btn-save" onclick="Reservations.saveMonitoria('${posto}', ${index})">
                            Salvar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function saveMonitoria(posto, index) {
        const area = getCurrentMonitoriaArea();
        const aluno = document.getElementById(`mon-${index}`)?.value || '';
        const turma = document.getElementById(`mt-${index}`)?.value || '';
        
        const key = `mon-${area}-${posto}`;
        const data = { 
            m: aluno, 
            t: turma, 
            area: area,
            atualizadoEm: new Date().toISOString() 
        };
        
        localStorage.setItem(key, JSON.stringify(data));
        
        const btn = document.querySelector(`#mon-${index}`).closest('tr').querySelector('.btn-save');
        btn.style.backgroundColor = '#10b981';
        btn.textContent = '✓ Salvo!';
        
        setTimeout(() => {
            btn.style.backgroundColor = '';
            btn.textContent = 'Salvar';
        }, 1500);
        
        UI.showNotification(`Escala salva em Monitor ${area}`, 'sucesso');
    }

    function renderAll() {
        renderTable();
        renderMonitoria();
    }

    // ==================== API PÚBLICA ====================
    return {
        changeLab,
        changeMonitoriaArea,
        getCurrentLab,
        getCurrentMonitoriaArea,
        renderTable,
        renderMonitoria,
        renderAll,
        saveReserva,
        saveMonitoria,
        SLOTS,
        isDiaBloqueado
    };
})();