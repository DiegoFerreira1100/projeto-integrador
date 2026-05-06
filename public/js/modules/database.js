// ============================================
// DATABASE.JS - Gerenciamento de Dados
// Versão: Sincronização Automática de Professores
// Atualização: Módulo de Alunos e Frequência
// ============================================

const Database = (function() {
    // Constantes
    const STORAGE_KEYS = {
        DB: 'portalEscolarDB',
        USUARIOS: 'portal_usuarios',
        SESSAO: 'portal_sessao',
        ALUNOS: 'portal_alunos',
        FREQUENCIA: 'portal_frequencia'
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
        inicializarAlunos();
        inicializarFrequencia();
        return db;
    }

    function carregarDB() {
        const stored = localStorage.getItem(STORAGE_KEYS.DB);
        if (stored) {
            db = JSON.parse(stored);
            
            if (!db.professores) db.professores = [];
            
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

        if (!db.monitores || typeof db.monitores !== 'object') {
            db.monitores = {};
        }

        if (db.monitoriaEscala && (db.monitoriaEscala[0]?.posto === "Entrada Principal" || db.monitoriaEscala.length !== 5)) {
            db.monitoriaEscala = POSTOS_PADRAO;
            salvarDB();
        }

        return db;
    }

    function salvarDB() {
        localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(db));
    }

    // ===== INICIALIZAÇÃO DE ALUNOS =====
    function inicializarAlunos() {
        if (!localStorage.getItem(STORAGE_KEYS.ALUNOS)) {
            localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify({}));
        }
    }

    function inicializarFrequencia() {
        if (!localStorage.getItem(STORAGE_KEYS.FREQUENCIA)) {
            localStorage.setItem(STORAGE_KEYS.FREQUENCIA, JSON.stringify({}));
        }
    }

    // ===== SINCRONIZAÇÃO =====
    function sincronizarProfessoresComUsuarios() {
        const usuarios = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS)) || [];
        
        const professoresUsuarios = usuarios
            .filter(u => u.perfil === 'professor')
            .map(u => u.nome);
        
        professoresUsuarios.forEach(nomeProfessor => {
            if (!db.professores.includes(nomeProfessor)) {
                db.professores.push(nomeProfessor);
                console.log(`✅ Professor "${nomeProfessor}" adicionado automaticamente`);
            }
        });
        
        if (professoresUsuarios.length > 0) {
            salvarDB();
        }
    }

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
                 <span style="color: #ef4444;">⚠️ Os monitores e alunos desta turma também serão removidos!</span>`,
                function() {
                    db.turmas.splice(index, 1);
                    
                    if (db.monitores && db.monitores[turma]) {
                        delete db.monitores[turma];
                    }
                    
                    // Remover alunos da turma
                    const alunos = getAlunos();
                    if (alunos[turma]) {
                        delete alunos[turma];
                        salvarAlunos(alunos);
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

    // ============================================
    // NOVO: MÓDULO DE ALUNOS
    // ============================================

    function getAlunos() {
        const alunos = localStorage.getItem(STORAGE_KEYS.ALUNOS);
        return alunos ? JSON.parse(alunos) : {};
    }

    function salvarAlunos(alunos) {
        localStorage.setItem(STORAGE_KEYS.ALUNOS, JSON.stringify(alunos));
    }

    function getAlunosPorTurma(turma) {
        const alunos = getAlunos();
        return alunos[turma] || [];
    }

    function cadastrarAluno(turma, nome, matricula, funcao) {
        const alunos = getAlunos();
        
        if (!alunos[turma]) {
            alunos[turma] = [];
        }

        // Verificar se já existe aluno com esta matrícula
        const existe = alunos[turma].find(a => a.matricula === matricula);
        if (existe) {
            return { sucesso: false, mensagem: 'Já existe um aluno com esta matrícula nesta turma!' };
        }

        const novoAluno = {
            id: Date.now().toString(),
            nome: nome.trim(),
            matricula: matricula.trim(),
            turma: turma,
            funcao: funcao || 'aluno',
            ativo: true,
            criadoEm: new Date().toISOString()
        };

        alunos[turma].push(novoAluno);
        salvarAlunos(alunos);
        
        return { sucesso: true, aluno: novoAluno };
    }

    function removerAluno(turma, alunoId) {
        const alunos = getAlunos();
        
        if (!alunos[turma]) {
            return { sucesso: false, mensagem: 'Turma não encontrada' };
        }

        const index = alunos[turma].findIndex(a => a.id === alunoId);
        if (index === -1) {
            return { sucesso: false, mensagem: 'Aluno não encontrado' };
        }

        alunos[turma].splice(index, 1);
        salvarAlunos(alunos);
        
        return { sucesso: true };
    }

    function atualizarAluno(turma, alunoId, dadosAtualizados) {
        const alunos = getAlunos();
        
        if (!alunos[turma]) {
            return { sucesso: false, mensagem: 'Turma não encontrada' };
        }

        const aluno = alunos[turma].find(a => a.id === alunoId);
        if (!aluno) {
            return { sucesso: false, mensagem: 'Aluno não encontrado' };
        }

        // Atualizar dados
        if (dadosAtualizados.nome) aluno.nome = dadosAtualizados.nome.trim();
        if (dadosAtualizados.matricula) aluno.matricula = dadosAtualizados.matricula.trim();
        if (dadosAtualizados.funcao) aluno.funcao = dadosAtualizados.funcao;
        if (typeof dadosAtualizados.ativo === 'boolean') aluno.ativo = dadosAtualizados.ativo;

        salvarAlunos(alunos);
        
        return { sucesso: true, aluno: aluno };
    }

    function getAlunosComLideranca(turma) {
        const alunos = getAlunosPorTurma(turma);
        return {
            lider: alunos.find(a => a.funcao === 'lider' && a.ativo),
            viceLider: alunos.find(a => a.funcao === 'vice-lider' && a.ativo),
            secretario: alunos.find(a => a.funcao === 'secretario' && a.ativo),
            todos: alunos.filter(a => a.ativo)
        };
    }

    // ============================================
    // NOVO: MÓDULO DE FREQUÊNCIA
    // ============================================

    const AULAS_DIA = [
        { numero: 1, horario: '07:20 - 08:10' },
        { numero: 2, horario: '08:10 - 09:00' },
        { numero: 3, horario: '09:20 - 10:10' },
        { numero: 4, horario: '10:10 - 11:00' },
        { numero: 5, horario: '11:00 - 11:50' },
        { numero: 6, horario: '13:10 - 14:00' },
        { numero: 7, horario: '14:00 - 14:50' },
        { numero: 8, horario: '15:10 - 16:00' },
        { numero: 9, horario: '16:00 - 16:50' }
    ];

    function getFrequencia() {
        const freq = localStorage.getItem(STORAGE_KEYS.FREQUENCIA);
        return freq ? JSON.parse(freq) : {};
    }

    function salvarFrequencia(frequencia) {
        localStorage.setItem(STORAGE_KEYS.FREQUENCIA, JSON.stringify(frequencia));
    }

    function getFrequenciaAlunoData(alunoId, data) {
        const frequencia = getFrequencia();
        const chave = `${alunoId}_${data}`;
        return frequencia[chave] || null;
    }

    function getFrequenciaTurmaData(turma, data) {
        const frequencia = getFrequencia();
        const alunos = getAlunosPorTurma(turma);
        const resultados = [];

        alunos.forEach(aluno => {
            const chave = `${aluno.id}_${data}`;
            const registro = frequencia[chave];
            
            if (registro) {
                resultados.push({
                    aluno: aluno,
                    frequencia: registro
                });
            } else {
                // Se não tem registro, assume presente em todas as aulas
                const aulasPresentes = {};
                AULAS_DIA.forEach(aula => {
                    aulasPresentes[aula.numero] = 'presente';
                });
                
                resultados.push({
                    aluno: aluno,
                    frequencia: {
                        alunoId: aluno.id,
                        data: data,
                        aulas: aulasPresentes,
                        justificativa: '',
                        registradoPor: '',
                        ultimaAtualizacao: null
                    }
                });
            }
        });

        return resultados;
    }

    function registrarFrequencia(alunoId, data, aulas, justificativa, registradoPor) {
        const frequencia = getFrequencia();
        const chave = `${alunoId}_${data}`;

        // Calcular resumo
        let presentes = 0;
        let faltas = 0;
        
        Object.values(aulas).forEach(status => {
            if (status === 'presente') presentes++;
            else faltas++;
        });

        frequencia[chave] = {
            alunoId: alunoId,
            data: data,
            aulas: aulas,
            resumo: {
                totalAulas: 9,
                presentes: presentes,
                faltas: faltas
            },
            justificativa: justificativa || '',
            registradoPor: registradoPor,
            ultimaAtualizacao: new Date().toISOString()
        };

        salvarFrequencia(frequencia);
        
        return frequencia[chave];
    }

    function registrarFrequenciaRapida(alunoId, data, aulaChegada, aulaSaida, justificativa, registradoPor) {
        const aulas = {};
        
        AULAS_DIA.forEach(aula => {
            const num = aula.numero;
            
            if (aulaChegada && aulaSaida) {
                // Chegou e saiu em horários específicos
                if (num >= aulaChegada && num <= aulaSaida) {
                    aulas[num] = 'presente';
                } else {
                    aulas[num] = 'falta';
                }
            } else if (aulaChegada && !aulaSaida) {
                // Apenas horário de chegada (ficou até o final)
                if (num >= aulaChegada) {
                    aulas[num] = 'presente';
                } else {
                    aulas[num] = 'falta';
                }
            } else if (!aulaChegada && aulaSaida) {
                // Saiu mais cedo (estava desde o início)
                if (num <= aulaSaida) {
                    aulas[num] = 'presente';
                } else {
                    aulas[num] = 'falta';
                }
            } else {
                // Sem informação = presente em todas
                aulas[num] = 'presente';
            }
        });

        return registrarFrequencia(alunoId, data, aulas, justificativa, registradoPor);
    }

    function registrarFaltaTotal(alunoId, data, justificativa, registradoPor) {
        const aulas = {};
        AULAS_DIA.forEach(aula => {
            aulas[aula.numero] = 'falta';
        });

        return registrarFrequencia(alunoId, data, aulas, justificativa, registradoPor);
    }

    function getResumoFaltosos(data, turma) {
        const frequenciaTurma = getFrequenciaTurmaData(turma, data);
        const resumo = {
            turma: turma,
            data: data,
            totalAlunos: frequenciaTurma.length,
            presentes: [],
            faltosos: [],
            atrasados: [],
            totalFaltasAula: 0
        };

        frequenciaTurma.forEach(item => {
            const faltasAula = item.frequencia.resumo.faltas;
            
            if (faltasAula === 0) {
                resumo.presentes.push({
                    aluno: item.aluno,
                    frequencia: item.frequencia
                });
            } else if (faltasAula === 9) {
                resumo.faltosos.push({
                    aluno: item.aluno,
                    frequencia: item.frequencia
                });
            } else {
                resumo.atrasados.push({
                    aluno: item.aluno,
                    frequencia: item.frequencia
                });
            }
            
            resumo.totalFaltasAula += faltasAula;
        });

        return resumo;
    }

    function getFaltososDoDia(data) {
        const turmas = db.turmas || [];
        const resultado = [];

        turmas.forEach(turma => {
            const resumo = getResumoFaltosos(data, turma);
            resultado.push(resumo);
        });

        return resultado;
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
            alunos: getAlunos(),
            frequencia: getFrequencia(),
            metadata: {
                exportadoEm: new Date().toISOString(),
                versao: '3.5'
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

            if (backup.alunos) {
                salvarAlunos(backup.alunos);
            }

            if (backup.frequencia) {
                salvarFrequencia(backup.frequencia);
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
        // Novos métodos - Alunos
        getAlunos,
        getAlunosPorTurma,
        cadastrarAluno,
        removerAluno,
        atualizarAluno,
        getAlunosComLideranca,
        // Novos métodos - Frequência
        AULAS_DIA,
        getFrequencia,
        getFrequenciaAlunoData,
        getFrequenciaTurmaData,
        registrarFrequencia,
        registrarFrequenciaRapida,
        registrarFaltaTotal,
        getResumoFaltosos,
        getFaltososDoDia,
        STORAGE_KEYS
    };
})();