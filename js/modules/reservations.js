// ============================================
// RESERVATIONS.JS - Gerenciamento de Reservas + Monitoria por Área
// Versão Corrigida - Todos os métodos implementados
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
            
            // Atualizar ícone baseado no laboratório
            if (icon) {
                if (lab.includes('Informática')) icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
                else if (lab.includes('Hardware')) icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>';
                else if (lab.includes('Multimídia')) icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 12h8M12 8v8"/></svg>';
            }
            if (name) name.textContent = lab;
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
            
            if (icon) {
                if (area === 'Geral') icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>';
                else if (area === 'Lei') icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>';
                else if (area === 'Hardware') icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>';
                else if (area === 'Multimídia') icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 12h8M12 8v8"/></svg>';
            }
            if (name) name.textContent = `Monitor ${area}`;
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
    async function gerarOpcoesProfessores(valorSelecionado) {
        let professores = [];
        if (typeof Database !== 'undefined') {
            const data = await Database.getData('professores');
            professores = Array.isArray(data) ? data : [];
        }
        
        let options = '<option value="">Selecione um professor</option>';
        
        professores.forEach(prof => {
            const nome = typeof prof === 'object' ? prof.nome : prof;
            const selected = nome === valorSelecionado ? 'selected' : '';
            options += `<option value="${nome}" ${selected}>👨‍🏫 ${nome}</option>`;
        });
        return options;
    }

    async function gerarOpcoesTurmas(valorSelecionado) {
        let turmas = [];
        if (typeof Database !== 'undefined') {
            const data = await Database.getData('turmas');
            turmas = Array.isArray(data) ? data : [];
        }
        
        let options = '<option value="">Selecione uma turma</option>';
        
        turmas.forEach(turma => {
            const nome = typeof turma === 'object' ? turma.turma : turma;
            const selected = nome === valorSelecionado ? 'selected' : '';
            options += `<option value="${nome}" ${selected}>🏫 ${nome}</option>`;
        });
        return options;
    }

    function gerarOpcoesMonitores(valorSelecionado) {
        const db = typeof Database !== 'undefined' ? Database.getData('db') : { monitores: {} };
        const monitoresObj = (db && db.monitores) ? db.monitores : {};
        const monitores = Object.values(monitoresObj).flat();
        
        let options = '<option value="">Selecione um monitor</option>';
        
        // Remover duplicatas
        const monitoresUnicos = [...new Set(monitores)];
        
        monitoresUnicos.forEach(monitor => {
            const selected = monitor === valorSelecionado ? 'selected' : '';
            options += `<option value="${monitor}" ${selected}>👤 ${monitor}</option>`;
        });
        return options;
    }

    // ==================== TABELA DE RESERVAS (Laboratórios) ====================
    async function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody || !currentLab) return;

        const selectedDate = typeof Calendar !== 'undefined' ? Calendar.getSelectedDate() : new Date().toISOString().split('T')[0];
        const isBloqueado = isDiaBloqueado();
        const disabledAttr = isBloqueado ? 'disabled' : '';

        // 🔥 CORRIGIDO - Buscar reservas do dia usando o método correto
        let reservasDoDia = {};
        if (typeof Database !== 'undefined') {
            if (Database.getReservasPorData) {
                reservasDoDia = await Database.getReservasPorData(selectedDate);
            } else {
                // Fallback: buscar reserva por reserva
                for (const lab of ['Lab Informática', 'Lab Hardware', 'Lab Multimídia']) {
                    reservasDoDia[lab] = {};
                    for (const slot of SLOTS) {
                        const reserva = Database.getReserva(lab, selectedDate, slot);
                        if (reserva && (reserva.p || reserva.t)) {
                            reservasDoDia[lab][slot] = reserva;
                        } else {
                            reservasDoDia[lab][slot] = { p: '', t: '' };
                        }
                    }
                }
            }
        }
        
        tbody.innerHTML = await Promise.all(SLOTS.map(async (slot, i) => {
            const isLunch = slot.includes("12:00") || slot === "12:00 - 13:00";
            
            if (isLunch) {
                return `
                    <tr class="lunch-break-row">
                        <td colspan="4" class="lunch-break">🍱 INTERVALO DE ALMOÇO</td>
                    </tr>
                `;
            }
            
            let reserva = { p: '', t: '' };
            if (reservasDoDia[currentLab] && reservasDoDia[currentLab][slot]) {
                reserva = reservasDoDia[currentLab][slot];
            }
            
            const profOptions = await gerarOpcoesProfessores(reserva.p);
            const turmaOptions = await gerarOpcoesTurmas(reserva.t);
            
            return `
                <tr>
                    <td class="slot-time"><strong>${slot}</strong></td>
                    <td>
                        <select id="p-${i}" class="professor-select" onchange="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            ${profOptions}
                        </select>
                    </td>
                    <td>
                        <select id="t-${i}" class="turma-select" onchange="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            ${turmaOptions}
                        </select>
                    </td>
                    <td>
                        <button class="btn-save" onclick="Reservations.saveReserva('${slot}', ${i})" ${disabledAttr}>
                            💾 Salvar
                        </button>
                    </td>
                </tr>
            `;
        })).then(results => results.join(''));

        // Adicionar mensagem de dia bloqueado se necessário
        const sectionHeader = document.querySelector('#sec-reservas .section-header');
        let msgEl = document.getElementById('reserva-bloqueado-msg');
        
        if (isBloqueado) {
            if (!msgEl) {
                msgEl = document.createElement('div');
                msgEl.id = 'reserva-bloqueado-msg';
                msgEl.className = 'blocked-day-message';
                msgEl.style.cssText = 'background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; margin: 10px 0; text-align: center; font-weight: 500;';
                if (sectionHeader && sectionHeader.parentNode) {
                    sectionHeader.parentNode.insertBefore(msgEl, sectionHeader.nextSibling);
                }
            }
            let marcacao = null;
            if (typeof Database !== 'undefined' && Database.getMarcacao) {
                marcacao = Database.getMarcacao(selectedDate);
            }
            msgEl.textContent = `🔒 DIA BLOQUEADO - ${marcacao && marcacao.desc ? marcacao.desc : 'Fora do período letivo'}`;
        } else if (msgEl) {
            msgEl.remove();
        }
    }

    async function saveReserva(slot, index) {
        if (isDiaBloqueado()) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('❌ Não é possível reservar em dias bloqueados!', 'erro');
            }
            renderTable();
            return;
        }
        
        const selectedDate = typeof Calendar !== 'undefined' ? Calendar.getSelectedDate() : new Date().toISOString().split('T')[0];
        
        const professorSelect = document.getElementById(`p-${index}`);
        const turmaSelect = document.getElementById(`t-${index}`);
        
        const professor = professorSelect?.value || '';
        const turma = turmaSelect?.value || '';
        
        if (!professor) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('⚠️ Selecione um professor!', 'info');
            }
            return;
        }
        
        if (!turma) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('⚠️ Selecione uma turma!', 'info');
            }
            return;
        }
        
        if (typeof Database !== 'undefined' && Database.setReserva) {
            Database.setReserva(currentLab, selectedDate, slot, professor, turma);
        } else if (typeof Database !== 'undefined') {
            // Fallback para localStorage direto
            const key = `res-${currentLab}-${selectedDate}-${slot}`;
            const reserva = { p: professor, t: turma, atualizadoEm: new Date().toISOString() };
            localStorage.setItem(key, JSON.stringify(reserva));
        }
        
        const btn = document.querySelector(`#p-${index}`)?.closest('tr')?.querySelector('.btn-save');
        if (btn) {
            const originalText = btn.textContent;
            btn.style.backgroundColor = '#10b981';
            btn.textContent = '✓ Salvo!';
            
            setTimeout(() => {
                btn.style.backgroundColor = '';
                btn.textContent = originalText;
            }, 1500);
        }
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`✅ Reserva salva: ${professor} - ${turma}`, 'sucesso');
        }
    }

    // ==================== TABELA DE MONITORIA ====================
    function renderMonitoria() {
        const tbody = document.getElementById('tableBodyMonitoria');
        if (!tbody) return;

        const area = getCurrentMonitoriaArea();
        const postos = POSTOS_POR_AREA[area] || [];

        if (postos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">📋 Nenhum posto configurado para esta área</td></tr>';
            return;
        }

        tbody.innerHTML = postos.map((posto, index) => {
            const key = `mon-${area}-${posto}`;
            const saved = localStorage.getItem(key);
            let escala = { m: '', t: '' };
            
            if (saved) {
                try {
                    escala = JSON.parse(saved);
                } catch (e) {
                    console.error('Erro ao parsear monitoria:', e);
                }
            }
            
            return `
                <tr>
                    <td class="posto-nome"><strong>${posto}</strong></td>
                    <td>
                        <select id="mon-${index}" class="monitor-select" onchange="Reservations.saveMonitoria('${posto}', ${index})">
                            ${gerarOpcoesMonitores(escala.m)}
                        </select>
                    </td>
                    <td>
                        <select id="mt-${index}" class="turma-monitor-select" onchange="Reservations.saveMonitoria('${posto}', ${index})">
                            ${gerarOpcoesTurmas(escala.t)}
                        </select>
                    </td>
                    <td>
                        <button class="btn-save" onclick="Reservations.saveMonitoria('${posto}', ${index})">
                            💾 Salvar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function saveMonitoria(posto, index) {
        const area = getCurrentMonitoriaArea();
        const monitorSelect = document.getElementById(`mon-${index}`);
        const turmaSelect = document.getElementById(`mt-${index}`);
        
        const monitor = monitorSelect?.value || '';
        const turma = turmaSelect?.value || '';
        
        if (!monitor) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('⚠️ Selecione um monitor!', 'info');
            }
            return;
        }
        
        const key = `mon-${area}-${posto}`;
        const data = { 
            m: monitor, 
            t: turma, 
            area: area,
            atualizadoEm: new Date().toISOString() 
        };
        
        localStorage.setItem(key, JSON.stringify(data));
        
        const btn = document.querySelector(`#mon-${index}`)?.closest('tr')?.querySelector('.btn-save');
        if (btn) {
            const originalText = btn.textContent;
            btn.style.backgroundColor = '#10b981';
            btn.textContent = '✓ Salvo!';
            
            setTimeout(() => {
                btn.style.backgroundColor = '';
                btn.textContent = originalText;
            }, 1500);
        }
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`✅ Escala salva: ${monitor} em ${posto}`, 'sucesso');
        }
    }

    // ==================== FUNÇÃO PARA RENDERIZAR TUDO ====================
    async function renderAll() {
        await renderTable();
        renderMonitoria();
    }

    // ==================== FUNÇÃO PARA LIMPAR RESERVAS ====================
    function limparReservasDoDia(data) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('res-') && key.includes(data)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`🗑️ Reservas do dia ${data} removidas`, 'sucesso');
        }
        
        renderTable();
    }

    // ==================== FUNÇÃO PARA EXPORTAR RESERVAS ====================
    function exportarReservas() {
        const reservas = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('res-')) {
                try {
                    const reserva = JSON.parse(localStorage.getItem(key));
                    reservas.push({ key, ...reserva });
                } catch (e) {}
            }
        }
        
        const dataStr = JSON.stringify(reservas, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservas-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        if (typeof UI !== 'undefined') {
            UI.showNotification('📥 Reservas exportadas com sucesso!', 'sucesso');
        }
    }

    // API Pública
    return {
        // Constantes
        SLOTS,
        POSTOS_POR_AREA,
        
        // Laboratórios
        changeLab,
        getCurrentLab,
        
        // Monitoria
        changeMonitoriaArea,
        getCurrentMonitoriaArea,
        
        // Renderização
        renderTable,
        renderMonitoria,
        renderAll,
        
        // Salvamento
        saveReserva,
        saveMonitoria,
        
        // Utilitários
        isDiaBloqueado,
        limparReservasDoDia,
        exportarReservas,
        
        // Funções auxiliares (expostas para uso em outros módulos)
        gerarOpcoesProfessores,
        gerarOpcoesTurmas,
        gerarOpcoesMonitores
    };
})();

// Garantir que Reservations esteja disponível globalmente
window.Reservations = Reservations;