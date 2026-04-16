// ============================================
// DATABASE.JS - Gerenciamento de Dados
// Versão: Sincronização Automática de Professores
// ============================================

const Database = (function() {
    // Constantes
    const STORAGE_KEYS = {
        DB: 'portalEscolarDB',
        USUARIOS: 'portal_usuarios',
        SESSAO: 'portal_sessao'
    };

    const POSTOS_PADRAO = [
        { posto: "Fila (manhã)" },
        { posto: "Sucos (almoço)" },
        { posto: "Fila (almoço)" },
        { posto: "Liberar salas (Almoço)" },
        { posto: "Fila (Tarde)" }
    ];

    // Estado interno
    let db = null;

    // ===== INICIALIZAÇÃO =====
    function init() {
        carregarDB();
        sincronizarProfessoresComUsuarios();
        return db;
    }

    function carregarDB() {
        const stored = localStorage.getItem(STORAGE_KEYS.DB);
        if (stored) {
            db = JSON.parse(stored);
            
            // Garantir que professores seja um array
            if (!db.professores) db.professores = [];
            
            // Migração: converter monitores antigos para novo formato se necessário
            if (db.monitores && Array.isArray(db.monitores) && db.monitores.length > 0) {
                if (typeof db.monitores[0] === 'string') {
                    const monitoresAntigos = [...db.monitores];
                    db.monitores = {};
                    
                    const turmas = db.turmas || [];
                    if (turmas.length > 0) {
                        turmas.forEach((turma, index) => {
                            if (index < monitoresAntigos.length) {
                                if (!db.monitores[turma]) db.monitores[turma] = [];
                                db.monitores[turma].push(monitoresAntigos[index]);
                            }
                        });
                    } else {
                        db.monitores = { "Sem Turma": monitoresAntigos };
                    }
                    salvarDB();
                }
            }
        } else {
            db = {
                professores: [],
                turmas: [],
                monitores: {},
                monitoriaEscala: POSTOS_PADRAO,
                metadata: {
                    criadoEm: new Date().toISOString(),
                    versao: '3.2'
                }
            };
            salvarDB();
        }

        // Garantir que monitores seja um objeto
        if (!db.monitores || typeof db.monitores !== 'object') {
            db.monitores = {};
        }

        // Garantir postos corretos
        if (db.monitoriaEscala && (db.monitoriaEscala[0]?.posto === "Entrada Principal" || db.monitoriaEscala.length !== 5)) {
            db.monitoriaEscala = POSTOS_PADRAO;
            salvarDB();
        }

        return db;
    }

    function salvarDB() {
        localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(db));
    }

    // ===== NOVA FUNÇÃO: Sincronizar Professores com Usuários =====
    function sincronizarProfessoresComUsuarios() {
        const usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS)) || [];
        
        // Filtrar apenas usuários com perfil 'professor'
        const professoresUsuarios = usuarios
            .filter(u => u.perfil === 'professor')
            .map(u => u.nome);
        
        // Adicionar professores que não existem na lista
        professoresUsuarios.forEach(nomeProfessor => {
            if (!db.professores.includes(nomeProfessor)) {
                db.professores.push(nomeProfessor);
                console.log(`✅ Professor "${nomeProfessor}" adicionado automaticamente`);
            }
        });
        
        // Salvar se houver mudanças
        if (professoresUsuarios.length > 0) {
            salvarDB();
        }
    }

    // ===== FUNÇÃO PARA ADICIONAR PROFESSOR AUTOMATICAMENTE NO LOGIN =====
    function adicionarProfessorPorLogin(nomeProfessor) {
        if (!db.professores.includes(nomeProfessor)) {
            db.professores.push(nomeProfessor);
            salvarDB();
            
            if (typeof UI !== 'undefined') {
                UI.renderListasCadastros();
                UI.showNotification(`👨‍🏫 Professor "${nomeProfessor}" adicionado à lista`, 'sucesso');
            }
            
            return true;
        }
        return false;
    }

    // ===== CRUD OPERATIONS =====
    function getData(tipo) {
        if (tipo === 'db') return db;
        if (tipo === 'monitores') return db.monitores || {};
        return db[tipo] || [];
    }

    function getMonitoresPorTurma(turma) {
        if (!db.monitores) db.monitores = {};
        return db.monitores[turma] || [];
    }

    // ===== PROFESSORES =====
    function cadastrarProfessor(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return { sucesso: false, mensagem: 'Campo não encontrado' };
        
        const valor = input.value.trim();
        if (!valor) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Digite um nome válido!', 'erro');
            }
            return { sucesso: false };
        }

        if (!db.professores) db.professores = [];
        
        if (db.professores.includes(valor)) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Este professor já está cadastrado!', 'erro');
            }
            return { sucesso: false };
        }

        db.professores.push(valor);
        salvarDB();
        input.value = "";
        
        if (typeof UI !== 'undefined') {
            UI.renderListasCadastros();
            UI.showNotification('Professor adicionado com sucesso!', 'sucesso');
        }
        
        return { sucesso: true };
    }

    function removerProfessor(index) {
        if (!db.professores || index < 0 || index >= db.professores.length) {
            console.error('Índice inválido:', index);
            return { sucesso: false };
        }

        const professor = db.professores[index];
        
        // Verificar se é um professor que veio do login automático
        const usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS)) || [];
        const isAutoGenerated = usuarios.some(u => u.perfil === 'professor' && u.nome === professor);
        
        let mensagem = `Tem certeza que deseja remover o professor <strong>${professor}</strong>?`;
        if (isAutoGenerated) {
            mensagem += `<br><br><span style="color: #f59e0b;">⚠️ Este professor foi adicionado automaticamente pelo login. Removê-lo não afetará seu acesso.</span>`;
        }
        
        if (typeof UI !== 'undefined') {
            UI.showConfirmModal(
                'Remover Professor',
                mensagem,
                function() {
                    db.professores.splice(index, 1);
                    salvarDB();
                    UI.renderListasCadastros();
                    UI.showNotification('Professor removido com sucesso!', 'sucesso');
                }
            );
        }
        
        return { sucesso: true };
    }

    // ===== TURMAS =====
    function cadastrarTurma(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return { sucesso: false };
        
        const valor = input.value.trim();
        if (!valor) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Digite uma turma válida!', 'erro');
            }
            return { sucesso: false };
        }

        if (!db.turmas) db.turmas = [];
        
        if (db.turmas.includes(valor)) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Esta turma já está cadastrada!', 'erro');
            }
            return { sucesso: false };
        }

        db.turmas.push(valor);
        
        if (!db.monitores) db.monitores = {};
        if (!db.monitores[valor]) db.monitores[valor] = [];
        
        salvarDB();
        input.value = "";
        
        if (typeof UI !== 'undefined') {
            UI.renderListasCadastros();
            UI.showNotification('Turma adicionada com sucesso!', 'sucesso');
        }
        
        return { sucesso: true };
    }

    function removerTurma(index) {
        if (!db.turmas || index < 0 || index >= db.turmas.length) {
            console.error('Índice inválido:', index);
            return { sucesso: false };
        }

        const turma = db.turmas[index];
        
        if (typeof UI !== 'undefined') {
            UI.showConfirmModal(
                'Remover Turma',
                `Tem certeza que deseja remover a turma <strong>${turma}</strong>?<br><br>
                 <span style="color: #ef4444;">⚠️ Os monitores desta turma também serão removidos!</span>`,
                function() {
                    db.turmas.splice(index, 1);
                    
                    if (db.monitores && db.monitores[turma]) {
                        delete db.monitores[turma];
                    }
                    
                    salvarDB();
                    UI.renderListasCadastros();
                    UI.showNotification('Turma removida com sucesso!', 'sucesso');
                }
            );
        }
        
        return { sucesso: true };
    }

    // ===== MONITORES =====
    function cadastrarMonitor(turma, inputId) {
        const input = document.getElementById(inputId);
        if (!input) return { sucesso: false };
        
        const valor = input.value.trim();
        if (!valor) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Digite um nome válido!', 'erro');
            }
            return { sucesso: false };
        }

        if (!db.monitores) db.monitores = {};
        if (!db.monitores[turma]) db.monitores[turma] = [];
        
        if (db.monitores[turma].includes(valor)) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Este monitor já está cadastrado nesta turma!', 'erro');
            }
            return { sucesso: false };
        }

        db.monitores[turma].push(valor);
        salvarDB();
        input.value = "";
        
        if (typeof UI !== 'undefined') {
            UI.renderListasCadastros();
            UI.showNotification('Monitor adicionado com sucesso!', 'sucesso');
        }
        
        return { sucesso: true };
    }

    function removerMonitor(turma, index) {
        if (!db.monitores || !db.monitores[turma] || index < 0 || index >= db.monitores[turma].length) {
            console.error('Índice inválido:', index);
            return { sucesso: false };
        }

        const monitor = db.monitores[turma][index];
        
        if (typeof UI !== 'undefined') {
            UI.showConfirmModal(
                'Remover Monitor',
                `Tem certeza que deseja remover o monitor <strong>${monitor}</strong> da turma <strong>${turma}</strong>?`,
                function() {
                    db.monitores[turma].splice(index, 1);
                    salvarDB();
                    UI.renderListasCadastros();
                    UI.showNotification('Monitor removido com sucesso!', 'sucesso');
                }
            );
        }
        
        return { sucesso: true };
    }

    // ===== RESERVAS =====
    function getReserva(lab, data, slot) {
        const key = `res-${lab}-${data}-${slot}`;
        return JSON.parse(localStorage.getItem(key)) || { p: '', t: '' };
    }

    function setReserva(lab, data, slot, professor, turma) {
        const key = `res-${lab}-${data}-${slot}`;
        const reserva = { p: professor, t: turma, atualizadoEm: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(reserva));
        return reserva;
    }

    // ===== MONITORIA =====
    function getMonitoria(posto, data) {
        const key = `mon-${posto}-${data}`;
        return JSON.parse(localStorage.getItem(key)) || { m: '', t: '' };
    }

    function setMonitoria(posto, data, monitor, turma) {
        const key = `mon-${posto}-${data}`;
        const escala = { m: monitor, t: turma, atualizadoEm: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(escala));
        return escala;
    }

    // ===== MARCAÇÕES =====
    function getMarcacao(data) {
        return JSON.parse(localStorage.getItem(`mark-${data}`));
    }

    function setMarcacao(data, tipo, descricao) {
        if (tipo === 'letivo') {
            localStorage.removeItem(`mark-${data}`);
            return null;
        } else {
            const marcacao = { 
                type: tipo, 
                desc: descricao, 
                dataRegistro: new Date().toISOString() 
            };
            localStorage.setItem(`mark-${data}`, JSON.stringify(marcacao));
            return marcacao;
        }
    }

    // ===== EXPORTAÇÃO/IMPORTAÇÃO =====
    function exportarBackup() {
        const backup = {
            db: db,
            reservas: Object.keys(localStorage)
                .filter(key => key.startsWith('res-') || key.startsWith('mon-') || key.startsWith('mark-'))
                .reduce((acc, key) => {
                    acc[key] = JSON.parse(localStorage.getItem(key));
                    return acc;
                }, {}),
            usuarios: JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS) || '[]'),
            metadata: {
                exportadoEm: new Date().toISOString(),
                versao: '3.2'
            }
        };

        return backup;
    }

    function importarBackup(backup) {
        try {
            if (backup.db) {
                db = backup.db;
                salvarDB();
            }

            if (backup.reservas) {
                Object.entries(backup.reservas).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
            }

            if (backup.usuarios) {
                localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(backup.usuarios));
            }

            return { sucesso: true, mensagem: 'Backup importado com sucesso' };
        } catch (e) {
            return { sucesso: false, mensagem: 'Erro ao importar backup' };
        }
    }

    function limparDados() {
        if (typeof UI !== 'undefined') {
            UI.showConfirmModal(
                '⚠️ Limpar Todos os Dados',
                'Tem certeza que deseja limpar todos os dados do sistema?<br><br>' +
                '<span style="color: #ef4444; font-weight: bold;">Esta ação não pode ser desfeita!</span>',
                function() {
                    localStorage.clear();
                    window.location.reload();
                }
            );
        }
    }

    // API Pública
    return {
        init,
        getData,
        getMonitoresPorTurma,
        cadastrarProfessor,
        cadastrarTurma,
        cadastrarMonitor,
        removerProfessor,
        removerTurma,
        removerMonitor,
        adicionarProfessorPorLogin,
        getReserva,
        setReserva,
        getMonitoria,
        setMonitoria,
        getMarcacao,
        setMarcacao,
        exportarBackup,
        importarBackup,
        limparDados,
        STORAGE_KEYS
    };
})();