// ============================================
// TURMAS.JS - Versão Simples (Apenas Criar)
// ============================================

const Turmas = (function() {
    
    // ===== INICIALIZAÇÃO =====
    function init() {
        renderizarLista();
    }

    // ===== CADASTRAR TURMA =====
    function cadastrarTurma() {
        const input = document.getElementById('new-turma-simples');
        if (!input) return;
        
        const valor = input.value.trim();
        if (!valor) {
            UI.showNotification('Digite um nome para a turma!', 'erro');
            return;
        }

        const db = typeof Database !== 'undefined' ? Database.getData('db') : null;
        if (!db) {
            UI.showNotification('Erro ao acessar banco de dados', 'erro');
            return;
        }

        if (!db.turmas) db.turmas = [];
        
        if (db.turmas.includes(valor)) {
            UI.showNotification('Esta turma já está cadastrada!', 'erro');
            return;
        }

        db.turmas.push(valor);
        
        // Criar entrada para monitores desta turma
        if (!db.monitores) db.monitores = {};
        if (!db.monitores[valor]) db.monitores[valor] = [];
        
        localStorage.setItem('portalEscolarDB', JSON.stringify(db));
        
        input.value = "";
        renderizarLista();
        
        UI.showNotification(`Turma "${valor}" adicionada com sucesso!`, 'sucesso');
    }

    // ===== REMOVER TURMA =====
    function removerTurma(index) {
        const db = typeof Database !== 'undefined' ? Database.getData('db') : null;
        if (!db || !db.turmas || index < 0 || index >= db.turmas.length) return;

        const turma = db.turmas[index];
        
        UI.showConfirmModal(
            'Remover Turma',
            `Tem certeza que deseja remover a turma <strong>${turma}</strong>?<br><br>
             <span style="color: #ef4444;">⚠️ Os monitores desta turma também serão removidos!</span>`,
            () => {
                db.turmas.splice(index, 1);
                
                // Remover monitores da turma
                if (db.monitores && db.monitores[turma]) {
                    delete db.monitores[turma];
                }
                
                localStorage.setItem('portalEscolarDB', JSON.stringify(db));
                renderizarLista();
                UI.showNotification('Turma removida com sucesso!', 'sucesso');
            }
        );
    }

    // ===== RENDERIZAR LISTA =====
    function renderizarLista() {
        const el = document.getElementById('list-turmas-simples');
        if (!el) return;

        const db = typeof Database !== 'undefined' ? Database.getData('db') : null;
        const turmas = (db && db.turmas) || [];

        if (turmas.length === 0) {
            el.innerHTML = '<li class="empty-message">Nenhuma turma cadastrada</li>';
        } else {
            el.innerHTML = turmas.map((turma, i) => 
                `<li class="list-item">
                    <span class="item-nome">🏫 ${turma}</span>
                    <button class="btn-delete" onclick="Turmas.removerTurma(${i})" title="Remover turma">
                        <span class="delete-icon">×</span>
                    </button>
                </li>`
            ).join('');
        }
    }

    // ===== EXPORTAÇÃO =====
    function getTurmas() {
        const db = typeof Database !== 'undefined' ? Database.getData('db') : null;
        return (db && db.turmas) || [];
    }

    // API Pública
    return {
        init,
        cadastrarTurma,
        removerTurma,
        renderizarLista,
        getTurmas
    };
})();