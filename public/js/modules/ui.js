// ============================================
// UI.JS - Interface do Usuário
// Versão Atualizada - Sem Emojis
// ============================================

const UI = (function() {
    // ===== AUTENTICAÇÃO =====
    function toggleAuth(type) {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginForm && signupForm) {
            if (type === 'signup') {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            } else {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
            }
        }
    }

    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    function checkPasswordStrength(val) {
        const bar = document.getElementById('strength-bar');
        if (!bar) return;
        
        if (val.length === 0) {
            bar.className = 'strength-bar';
        } else if (val.length < 6) {
            bar.className = 'strength-bar strength-weak';
        } else if (val.length < 8) {
            bar.className = 'strength-bar strength-medium';
        } else {
            bar.className = 'strength-bar strength-strong';
        }
    }

    // ===== LISTAS DE CADASTRO =====
    function renderListasCadastros() {
        renderProfessores();
        renderTurmas();
        renderMonitoresPorTurma();
    }

    function renderProfessores() {
        const el = document.getElementById('list-professores');
        if (!el) return;

        const itens = typeof Database !== 'undefined' ? Database.getData('professores') : [];
        
        if (itens.length === 0) {
            el.innerHTML = '<li class="empty-message">Nenhum professor cadastrado</li>';
        } else {
            el.innerHTML = itens.map((item, i) => 
                `<li class="list-item">
                    <span class="item-nome">${item}</span>
                    <button class="btn-delete" onclick="Database.removerProfessor(${i})" title="Remover professor">
                        <span class="delete-icon">×</span>
                    </button>
                </li>`
            ).join('');
        }
    }

    function renderTurmas() {
        const el = document.getElementById('list-turmas-simples');
        if (!el) return;

        const itens = typeof Database !== 'undefined' ? Database.getData('turmas') : [];
        
        if (itens.length === 0) {
            el.innerHTML = '<li class="empty-message">Nenhuma turma cadastrada</li>';
        } else {
            el.innerHTML = itens.map((item, i) => 
                `<li class="list-item">
                    <span class="item-nome">${item}</span>
                    <button class="btn-delete" onclick="Database.removerTurma(${i})" title="Remover turma">
                        <span class="delete-icon">×</span>
                    </button>
                </li>`
            ).join('');
        }
    }

    function renderMonitoresPorTurma() {
        const container = document.getElementById('monitores-container');
        if (!container) return;

        const turmas = typeof Database !== 'undefined' ? Database.getData('turmas') : [];
        const db = typeof Database !== 'undefined' ? Database.getData('db') : { monitores: {} };
        const monitoresObj = db.monitores || {};

        if (turmas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhuma turma cadastrada</p>
                    <p class="empty-hint">Cadastre uma turma primeiro</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        turmas.forEach(turma => {
            const monitores = monitoresObj[turma] || [];
            
            html += `
                <div class="turma-monitores-card">
                    <div class="turma-header">
                        <h4>${turma}</h4>
                        <span class="monitores-count">${monitores.length} monitor(es)</span>
                    </div>
                    
                    <div class="monitores-list">
                        ${monitores.length === 0 ? 
                            '<p class="empty-monitores">Nenhum monitor cadastrado</p>' : 
                            monitores.map((monitor, idx) => `
                                <div class="monitor-item">
                                    <span class="monitor-nome">${monitor}</span>
                                    <button class="btn-delete-small" onclick="Database.removerMonitor('${turma}', ${idx})" title="Remover monitor">
                                        ×
                                    </button>
                                </div>
                            `).join('')
                        }
                    </div>
                    
                    <div class="add-monitor-form">
                        <input type="text" id="monitor-${turma.replace(/\s+/g, '-')}" 
                               placeholder="Nome do monitor" class="monitor-input">
                        <button class="btn-add-monitor" onclick="Database.cadastrarMonitor('${turma}', 'monitor-${turma.replace(/\s+/g, '-')}')">
                            + Adicionar
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ===== MODAL DE CONFIRMAÇÃO =====
    function showConfirmModal(titulo, mensagem, onConfirm) {
        const modalExistente = document.querySelector('.confirm-modal-overlay');
        if (modalExistente) modalExistente.remove();

        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        // Criar um ID único para este modal
        const callbackId = 'callback_' + Date.now();
        // Armazenar o callback no escopo global
        window[callbackId] = function() {
            if (typeof onConfirm === 'function') {
                onConfirm();
            } else if (typeof onConfirm === 'string') {
                try {
                    eval(onConfirm);
                } catch (e) {
                    console.error('Erro ao executar callback:', e);
                }
            }
            delete window[callbackId];
        };
        
        modal.innerHTML = `
            <h3 class="confirm-modal-title">${titulo}</h3>
            <div class="confirm-modal-message">${mensagem}</div>
            <div class="confirm-modal-actions">
                <button class="confirm-modal-btn confirm-modal-btn-cancel" onclick="UI.closeConfirmModal(this)">
                    Cancelar
                </button>
                <button class="confirm-modal-btn confirm-modal-btn-confirm" onclick="UI.confirmAction('${callbackId}')">
                    Confirmar
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            modal.querySelector('.confirm-modal-btn-cancel').focus();
        }, 100);
    }

    function closeConfirmModal(btn) {
        const modal = btn.closest('.confirm-modal-overlay');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => modal.remove(), 200);
        }
    }

    function confirmAction(callbackId) {
        if (callbackId && window[callbackId]) {
            window[callbackId]();
        }
        
        const modal = document.querySelector('.confirm-modal-overlay');
        if (modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => modal.remove(), 200);
        }
    }

    // ===== NOTIFICAÇÕES =====
    function showNotification(mensagem, tipo = 'info', duracao = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.textContent = mensagem;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duracao);
    }

    // ===== LOADING =====
    function showLoading(element) {
        if (element) {
            element.classList.add('btn-loading');
            element.disabled = true;
        }
    }

    function hideLoading(element) {
        if (element) {
            element.classList.remove('btn-loading');
            element.disabled = false;
        }
    }

    // ===== FORMULÁRIOS =====
    function limparCampos(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type !== 'button' && input.type !== 'submit') {
                    input.value = '';
                }
            });
        }
    }

    // ===== MENU DE CONTEXTO =====
    function fecharMenuContexto() {
        const menu = document.getElementById('custom-menu');
        if (menu) menu.style.display = 'none';
    }

    // ===== UTILITÁRIOS =====
    function formatarData(dataStr) {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function getDiaSemana(dia) {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return dias[dia] || '';
    }

    // API Pública
    return {
        toggleAuth,
        togglePassword,
        checkPasswordStrength,
        renderListasCadastros,
        renderProfessores,
        renderTurmas,
        renderMonitoresPorTurma,
        showConfirmModal,
        closeConfirmModal,
        confirmAction,
        showNotification,
        showLoading,
        hideLoading,
        limparCampos,
        fecharMenuContexto,
        formatarData,
        getDiaSemana
    };
})();