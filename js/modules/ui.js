// ============================================
// UI.JS - Interface do Usuário
// Versão Corrigida - Async/Await Funcional
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
    async function renderListasCadastros() {
        await renderProfessores();
        await renderTurmas();
        await renderMonitoresPorTurma();
    }

    // 🔥 CORRIGIDA - Adicionado async
    async function renderProfessores() {
        const el = document.getElementById('list-professores');
        if (!el) return;

        try {
            // Verificar se Database está disponível
            if (typeof Database === 'undefined' || !Database.getData) {
                el.innerHTML = '<li class="empty-message">Erro: Módulo Database não disponível</li>';
                return;
            }

            let itens = await Database.getData('professores');
            
            // Garantir que itens é um array
            if (!Array.isArray(itens)) {
                itens = [];
            }
            
            // Se for array de objetos com propriedade 'nome', extrair
            if (itens.length > 0 && typeof itens[0] === 'object' && itens[0].nome) {
                itens = itens.map(item => item.nome);
            }
            
            if (itens.length === 0) {
                el.innerHTML = '<li class="empty-message">Nenhum professor cadastrado</li>';
            } else {
                el.innerHTML = itens.map((item, i) => 
                    `<li class="list-item">
                        <span class="item-nome">👨‍🏫 ${typeof item === 'object' ? item.nome : item}</span>
                        <button class="btn-delete" onclick="Database.removerProfessor(${i})" title="Remover professor">
                            <span class="delete-icon">×</span>
                        </button>
                    </li>`
                ).join('');
            }
        } catch (error) {
            console.error('Erro ao renderizar professores:', error);
            el.innerHTML = '<li class="empty-message">Erro ao carregar professores</li>';
        }
    }

    // 🔥 CORRIGIDA - Adicionado async
    async function renderTurmas() {
        const el = document.getElementById('list-turmas-simples');
        if (!el) return;

        try {
            if (typeof Database === 'undefined' || !Database.getData) {
                el.innerHTML = '<li class="empty-message">Erro: Módulo Database não disponível</li>';
                return;
            }

            let itens = await Database.getData('turmas');
            
            // Garantir que itens é um array
            if (!Array.isArray(itens)) {
                itens = [];
            }
            
            // Se for array de objetos com propriedade 'turma', extrair
            if (itens.length > 0 && typeof itens[0] === 'object' && itens[0].turma) {
                itens = itens.map(item => item.turma);
            }
            
            if (itens.length === 0) {
                el.innerHTML = '<li class="empty-message">Nenhuma turma cadastrada</li>';
            } else {
                el.innerHTML = itens.map((item, i) => 
                    `<li class="list-item">
                        <span class="item-nome">🏫 ${typeof item === 'object' ? item.turma : item}</span>
                        <button class="btn-delete" onclick="Database.removerTurma(${i})" title="Remover turma">
                            <span class="delete-icon">×</span>
                        </button>
                    </li>`
                ).join('');
            }
        } catch (error) {
            console.error('Erro ao renderizar turmas:', error);
            el.innerHTML = '<li class="empty-message">Erro ao carregar turmas</li>';
        }
    }

    // 🔥 CORRIGIDA - Adicionado async
    async function renderMonitoresPorTurma() {
        const container = document.getElementById('monitores-container');
        if (!container) return;

        try {
            if (typeof Database === 'undefined') {
                container.innerHTML = '<div class="empty-state"><p>Erro: Módulo Database não disponível</p></div>';
                return;
            }

            let turmas = await Database.getData('turmas');
            
            // Garantir que turmas é um array
            if (!Array.isArray(turmas)) {
                turmas = [];
            }
            
            // Extrair nomes das turmas se for array de objetos
            if (turmas.length > 0 && typeof turmas[0] === 'object' && turmas[0].turma) {
                turmas = turmas.map(item => item.turma);
            }
            
            const monitoresObj = Database.getMonitoresPorTurma ? 
                Database.getMonitoresPorTurma() : {};

            if (turmas.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📚</span>
                        <p>Nenhuma turma cadastrada</p>
                        <p class="empty-hint">Cadastre uma turma primeiro</p>
                    </div>
                `;
                return;
            }

            let html = '';
            
            for (const turma of turmas) {
                let monitores = [];
                if (monitoresObj[turma]) {
                    monitores = monitoresObj[turma];
                }
                
                // Sanitizar o nome da turma para usar como ID
                const turmaId = turma.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                
                html += `
                    <div class="turma-monitores-card">
                        <div class="turma-header">
                            <h4>📖 ${turma}</h4>
                            <span class="monitores-count">${monitores.length} monitor(es)</span>
                        </div>
                        
                        <div class="monitores-list">
                            ${monitores.length === 0 ? 
                                '<p class="empty-monitores">Nenhum monitor cadastrado</p>' : 
                                monitores.map((monitor, idx) => `
                                    <div class="monitor-item">
                                        <span class="monitor-nome">👤 ${monitor}</span>
                                        <button class="btn-delete-small" onclick="Database.removerMonitor('${turma}', ${idx})" title="Remover monitor">
                                            ×
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                        
                        <div class="add-monitor-form">
                            <input type="text" id="monitor-${turmaId}" 
                                   placeholder="Nome do monitor" class="monitor-input">
                            <button class="btn-add-monitor" onclick="Database.cadastrarMonitor('${turma}', 'monitor-${turmaId}')">
                                + Adicionar
                            </button>
                        </div>
                    </div>
                `;
            }

            container.innerHTML = html;
        } catch (error) {
            console.error('Erro ao renderizar monitores:', error);
            container.innerHTML = '<div class="empty-state"><p>Erro ao carregar monitores</p></div>';
        }
    }

    // ===== MODAL DE CONFIRMAÇÃO =====
    function showConfirmModal(titulo, mensagem, onConfirm) {
        const modalExistente = document.querySelector('.confirm-modal-overlay');
        if (modalExistente) modalExistente.remove();

        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        const callbackId = 'callback_' + Date.now();
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
            const cancelBtn = modal.querySelector('.confirm-modal-btn-cancel');
            if (cancelBtn) cancelBtn.focus();
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

        // Remover notificações antigas se houver muitas
        if (container.children.length > 5) {
            while (container.children.length > 4) {
                container.removeChild(container.firstChild);
            }
        }

        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        
        // Adicionar ícone baseado no tipo
        let icone = '';
        switch(tipo) {
            case 'sucesso':
                icone = '✅ ';
                break;
            case 'erro':
                icone = '❌ ';
                break;
            case 'info':
                icone = 'ℹ️ ';
                break;
            default:
                icone = '📌 ';
        }
        
        toast.textContent = icone + mensagem;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, duracao);
    }

    // ===== LOADING =====
    function showLoading(element) {
        if (element) {
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            element.classList.add('btn-loading');
            element.disabled = true;
            element.textContent = '⏳ Carregando...';
        }
    }

    function hideLoading(element) {
        if (element) {
            const originalText = element.getAttribute('data-original-text');
            element.classList.remove('btn-loading');
            element.disabled = false;
            if (originalText) {
                element.textContent = originalText;
            }
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
        const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return dias[dia] || '';
    }

    function formatarDataCompleta(date) {
        if (!date) date = new Date();
        const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
    }

    // ===== SCROLL TO TOP =====
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== COPIAR PARA ÁREA DE TRANSFERÊNCIA =====
    async function copiarTexto(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            showNotification('Texto copiado para a área de transferência!', 'sucesso');
            return true;
        } catch (err) {
            console.error('Erro ao copiar:', err);
            showNotification('Erro ao copiar texto', 'erro');
            return false;
        }
    }

    // API Pública
    return {
        // Autenticação
        toggleAuth,
        togglePassword,
        checkPasswordStrength,
        
        // Renderização
        renderListasCadastros,
        renderProfessores,
        renderTurmas,
        renderMonitoresPorTurma,
        
        // Modais e Notificações
        showConfirmModal,
        closeConfirmModal,
        confirmAction,
        showNotification,
        
        // Utilitários
        showLoading,
        hideLoading,
        limparCampos,
        fecharMenuContexto,
        formatarData,
        getDiaSemana,
        formatarDataCompleta,
        scrollToTop,
        copiarTexto
    };
})();

// Garantir que UI esteja disponível globalmente
window.UI = UI;