// ============================================
// FREQUENCIA.JS - Controle de Frequência de Alunos
// Versão: Registro por Aula com Hierarquia de Liderança
// ============================================

const Frequencia = (function() {
    // Estado
    let turmaAtual = null;
    let dataAtual = new Date().toISOString().split('T')[0];
    let alunoEditando = null;

    // ===== INICIALIZAÇÃO =====
    function init() {
        console.log('📋 Módulo de Frequência inicializado');
        determinarTurmaUsuario();
    }

    function determinarTurmaUsuario() {
        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        
        if (!usuario) return;

        // Se for líder/vice/secretário, encontrar sua turma
        if (['lider', 'vice-lider', 'secretario'].includes(usuario.perfil)) {
            const todasTurmas = typeof Database !== 'undefined' ? Database.getData('turmas') : [];
            
            for (const turma of todasTurmas) {
                const alunos = typeof Database !== 'undefined' ? Database.getAlunosPorTurma(turma) : [];
                const alunoEncontrado = alunos.find(a => 
                    a.nome.toLowerCase() === usuario.nome.toLowerCase() &&
                    ['lider', 'vice-lider', 'secretario'].includes(a.funcao)
                );
                
                if (alunoEncontrado) {
                    turmaAtual = turma;
                    console.log(`👤 ${usuario.nome} é ${alunoEncontrado.funcao} da turma ${turma}`);
                    break;
                }
            }
        }
    }

    // ===== RENDERIZAÇÃO PRINCIPAL =====
    function renderizarTelaFrequencia() {
        const container = document.getElementById('frequencia-content');
        if (!container) return;

        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        if (!usuario) return;

        const turmas = typeof Database !== 'undefined' ? Database.getData('turmas') : [];
        
        // Se for líder, já define a turma
        if (['lider', 'vice-lider', 'secretario'].includes(usuario.perfil) && turmaAtual) {
            renderizarFrequenciaTurma(turmaAtual, dataAtual);
            return;
        }

        // Para professor/gestor: mostrar seletor de turma
        let html = `
            <div class="frequencia-container">
                <div class="frequencia-header">
                    <h2>📋 Verificação de Faltosos</h2>
                    <div class="frequencia-controls">
                        <div class="form-group">
                            <label>Turma</label>
                            <select id="freq-turma-select" onchange="Frequencia.onTurmaChange()">
                                <option value="">Selecione uma turma</option>
                                ${turmas.map(t => `<option value="${t}" ${t === turmaAtual ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Data</label>
                            <input type="date" id="freq-data-input" value="${dataAtual}" 
                                   onchange="Frequencia.onDataChange()">
                        </div>
                    </div>
                </div>
                <div id="frequencia-turma-content"></div>
            </div>
        `;

        container.innerHTML = html;

        // Se já tem turma selecionada, renderizar
        if (turmaAtual) {
            renderizarFrequenciaTurma(turmaAtual, dataAtual);
        }
    }

    function onTurmaChange() {
        const select = document.getElementById('freq-turma-select');
        if (select && select.value) {
            turmaAtual = select.value;
            renderizarFrequenciaTurma(turmaAtual, dataAtual);
        } else {
            turmaAtual = null;
            document.getElementById('frequencia-turma-content').innerHTML = '';
        }
    }

    function onDataChange() {
        const input = document.getElementById('freq-data-input');
        if (input && input.value) {
            dataAtual = input.value;
            if (turmaAtual) {
                renderizarFrequenciaTurma(turmaAtual, dataAtual);
            }
        }
    }

    // ===== RENDERIZAR FREQUÊNCIA DA TURMA =====
    function renderizarFrequenciaTurma(turma, data) {
        const content = document.getElementById('frequencia-turma-content');
        if (!content) return;

        const frequenciaTurma = typeof Database !== 'undefined' ? 
            Database.getFrequenciaTurmaData(turma, data) : [];

        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        const podeEditar = usuario && (
            ['coordenador', 'professor', 'lider', 'vice-lider', 'secretario'].includes(usuario.perfil)
        );

        // Resumo
        let totalPresentes = 0;
        let totalFaltosos = 0;
        let totalAtrasados = 0;
        let totalFaltasAula = 0;

        frequenciaTurma.forEach(item => {
            const faltas = item.frequencia.resumo.faltas;
            totalFaltasAula += faltas;
            
            if (faltas === 0) totalPresentes++;
            else if (faltas === 9) totalFaltosos++;
            else totalAtrasados++;
        });

        let html = `
            <div class="frequencia-resumo">
                <div class="resumo-card resumo-presentes">
                    <span class="resumo-numero">${totalPresentes}</span>
                    <span class="resumo-label">Presentes</span>
                </div>
                <div class="resumo-card resumo-faltosos">
                    <span class="resumo-numero">${totalFaltosos}</span>
                    <span class="resumo-label">Faltosos</span>
                </div>
                <div class="resumo-card resumo-atrasos">
                    <span class="resumo-numero">${totalAtrasados}</span>
                    <span class="resumo-label">Atrasados</span>
                </div>
                <div class="resumo-card resumo-total">
                    <span class="resumo-numero">${totalFaltasAula}</span>
                    <span class="resumo-label">Faltas-Aula</span>
                </div>
            </div>

            ${podeEditar ? `
                <div class="frequencia-acoes-rapidas">
                    <button class="btn-primary" onclick="Frequencia.marcarTodosPresentes('${turma}', '${data}')">
                        ✅ Marcar Todos Presentes
                    </button>
                    <button class="btn-secondary" onclick="Frequencia.expandirTodos('${turma}')">
                        📋 Expandir Detalhes
                    </button>
                </div>
            ` : ''}

            <div class="frequencia-lista">
        `;

        frequenciaTurma.forEach((item, index) => {
            const aluno = item.aluno;
            const freq = item.frequencia;
            const faltas = freq.resumo.faltas;
            const presentes = freq.resumo.presentes;
            
            let statusClass = 'status-presente';
            let statusIcon = '✅';
            let statusText = 'Presente';
            
            if (faltas === 9) {
                statusClass = 'status-falta';
                statusIcon = '❌';
                statusText = 'Falta (9 aulas)';
            } else if (faltas > 0) {
                statusClass = 'status-atraso';
                statusIcon = '⏰';
                statusText = `Atraso (${faltas} faltas)`;
            }

            const funcaoBadge = aluno.funcao !== 'aluno' ? 
                `<span class="funcao-badge funcao-${aluno.funcao}">${getFuncaoNome(aluno.funcao)}</span>` : '';

            html += `
                <div class="frequencia-item ${statusClass}" id="freq-item-${aluno.id}">
                    <div class="frequencia-item-header" onclick="Frequencia.toggleDetalhes('${aluno.id}')">
                        <div class="frequencia-aluno-info">
                            <span class="frequencia-status-icon">${statusIcon}</span>
                            <div>
                                <span class="frequencia-aluno-nome">${aluno.nome}</span>
                                <span class="frequencia-aluno-matricula">Mat: ${aluno.matricula}</span>
                            </div>
                            ${funcaoBadge}
                        </div>
                        <div class="frequencia-aluno-status">
                            <span class="status-text ${statusClass}">${statusText}</span>
                            ${podeEditar ? `<button class="btn-small" onclick="event.stopPropagation(); Frequencia.abrirEdicao('${aluno.id}', '${turma}', '${data}')">✏️ Editar</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="frequencia-detalhes" id="detalhes-${aluno.id}" style="display: none;">
                        <div class="aulas-grid">
                            ${Database.AULAS_DIA.map(aula => {
                                const status = freq.aulas[aula.numero] || 'presente';
                                const aulaClass = status === 'presente' ? 'aula-presente' : 'aula-falta';
                                const aulaIcon = status === 'presente' ? '✅' : '❌';
                                
                                return `
                                    <div class="aula-item ${aulaClass}">
                                        <span class="aula-numero">${aula.numero}ª</span>
                                        <span class="aula-horario">${aula.horario}</span>
                                        <span class="aula-status-icon">${aulaIcon}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        ${freq.justificativa ? `
                            <div class="frequencia-justificativa">
                                <strong>📝 Justificativa:</strong> ${freq.justificativa}
                            </div>
                        ` : ''}
                        
                        ${freq.registradoPor ? `
                            <div class="frequencia-registrado-por">
                                <small>Registrado por: ${freq.registradoPor}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        content.innerHTML = html;
    }

    function getFuncaoNome(funcao) {
        const nomes = {
            'lider': '👑 Líder',
            'vice-lider': '⭐ Vice-líder',
            'secretario': '📝 Secretário',
            'aluno': 'Aluno'
        };
        return nomes[funcao] || 'Aluno';
    }

    function toggleDetalhes(alunoId) {
        const detalhes = document.getElementById(`detalhes-${alunoId}`);
        if (detalhes) {
            detalhes.style.display = detalhes.style.display === 'none' ? 'block' : 'none';
        }
    }

    function expandirTodos(turma) {
        const frequenciaTurma = Database.getFrequenciaTurmaData(turma, dataAtual);
        frequenciaTurma.forEach(item => {
            const detalhes = document.getElementById(`detalhes-${item.aluno.id}`);
            if (detalhes) {
                detalhes.style.display = 'block';
            }
        });
    }

    // ===== EDIÇÃO DE FREQUÊNCIA =====
    function abrirEdicao(alunoId, turma, data) {
        const alunos = Database.getAlunosPorTurma(turma);
        const aluno = alunos.find(a => a.id === alunoId);
        
        if (!aluno) {
            UI.showNotification('Aluno não encontrado!', 'erro');
            return;
        }

        const freq = Database.getFrequenciaAlunoData(alunoId, data);
        
        alunoEditando = { alunoId, turma, data, aluno };

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-editar-frequencia';
        
        let aulasHTML = Database.AULAS_DIA.map(aula => {
            const statusAtual = freq ? (freq.aulas[aula.numero] || 'presente') : 'presente';
            const checkedPresente = statusAtual === 'presente' ? 'checked' : '';
            const checkedFalta = statusAtual === 'falta' ? 'checked' : '';
            
            return `
                <div class="aula-edicao-item">
                    <div class="aula-edicao-info">
                        <span class="aula-edicao-numero">${aula.numero}ª Aula</span>
                        <span class="aula-edicao-horario">${aula.horario}</span>
                    </div>
                    <div class="aula-edicao-radios">
                        <label class="radio-label radio-presente">
                            <input type="radio" name="aula-${aula.numero}" value="presente" ${checkedPresente}> Presente
                        </label>
                        <label class="radio-label radio-falta">
                            <input type="radio" name="aula-${aula.numero}" value="falta" ${checkedFalta}> Falta
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        const justificativaAtual = freq ? freq.justificativa : '';

        modal.innerHTML = `
            <div class="modal-box modal-frequencia">
                <h3>✏️ Editar Frequência</h3>
                <p class="modal-aluno-info">
                    <strong>Aluno:</strong> ${aluno.nome}<br>
                    <strong>Matrícula:</strong> ${aluno.matricula}<br>
                    <strong>Turma:</strong> ${turma}<br>
                    <strong>Data:</strong> ${formatarData(data)}
                </p>
                
                <div class="modal-frequencia-content">
                    <div class="frequencia-rapida">
                        <h4>⚡ Modo Rápido</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Chegou na aula:</label>
                                <select id="rapido-chegada">
                                    <option value="">Selecione...</option>
                                    ${Database.AULAS_DIA.map(a => `<option value="${a.numero}">${a.numero}ª - ${a.horario}</option>`).join('')}
                                    <option value="0">Não compareceu</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Saiu na aula:</label>
                                <select id="rapido-saida">
                                    <option value="">Ficou até o final</option>
                                    ${Database.AULAS_DIA.map(a => `<option value="${a.numero}">${a.numero}ª - ${a.horario}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <button class="btn-secondary" onclick="Frequencia.aplicarModoRapido()">
                            ⚡ Aplicar Modo Rápido
                        </button>
                    </div>
                    
                    <div class="frequencia-manual">
                        <h4>📋 Marcação Aula por Aula</h4>
                        <div class="aulas-edicao-grid">
                            ${aulasHTML}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>📝 Justificativa</label>
                        <input type="text" id="editar-justificativa" 
                               placeholder="Ex: Problema de saúde, transporte..." 
                               value="${justificativaAtual}">
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Frequencia.fecharModalEdicao()">Cancelar</button>
                    <button class="btn-primary" onclick="Frequencia.salvarEdicao()">💾 Salvar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function aplicarModoRapido() {
        const chegada = document.getElementById('rapido-chegada')?.value;
        const saida = document.getElementById('rapido-saida')?.value;

        if (!chegada && !saida) {
            UI.showNotification('Selecione pelo menos um horário!', 'erro');
            return;
        }

        const aulaChegada = chegada && chegada !== '0' ? parseInt(chegada) : null;
        const aulaSaida = saida ? parseInt(saida) : null;

        Database.AULAS_DIA.forEach(aula => {
            const num = aula.numero;
            let status = 'presente';

            if (chegada === '0') {
                // Não compareceu
                status = 'falta';
            } else if (aulaChegada && aulaSaida) {
                status = (num >= aulaChegada && num <= aulaSaida) ? 'presente' : 'falta';
            } else if (aulaChegada) {
                status = num >= aulaChegada ? 'presente' : 'falta';
            } else if (aulaSaida) {
                status = num <= aulaSaida ? 'presente' : 'falta';
            }

            const radios = document.getElementsByName(`aula-${num}`);
            radios.forEach(radio => {
                if (radio.value === status) {
                    radio.checked = true;
                }
            });
        });

        UI.showNotification('Modo rápido aplicado! Revise e salve.', 'sucesso');
    }

    function salvarEdicao() {
        if (!alunoEditando) return;

        const { alunoId, turma, data, aluno } = alunoEditando;
        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        const registradoPor = usuario ? `${usuario.nome} (${getFuncaoNome(usuario.perfil)})` : 'Sistema';

        // Coletar status de cada aula
        const aulas = {};
        Database.AULAS_DIA.forEach(aula => {
            const radios = document.getElementsByName(`aula-${aula.numero}`);
            let status = 'presente';
            
            radios.forEach(radio => {
                if (radio.checked) {
                    status = radio.value;
                }
            });
            
            aulas[aula.numero] = status;
        });

        const justificativa = document.getElementById('editar-justificativa')?.value || '';

        // Salvar
        Database.registrarFrequencia(alunoId, data, aulas, justificativa, registradoPor);

        // Fechar modal
        fecharModalEdicao();

        // Atualizar tela
        renderizarFrequenciaTurma(turma, data);

        UI.showNotification(`Frequência de ${aluno.nome} salva com sucesso!`, 'sucesso');
    }

    function fecharModalEdicao() {
        const modal = document.getElementById('modal-editar-frequencia');
        if (modal) modal.remove();
        alunoEditando = null;
    }

    function marcarTodosPresentes(turma, data) {
        const usuario = typeof Auth !== 'undefined' ? Auth.getUsuarioAtual() : null;
        const registradoPor = usuario ? `${usuario.nome} (${getFuncaoNome(usuario.perfil)})` : 'Sistema';
        
        const alunos = Database.getAlunosPorTurma(turma);
        
        alunos.forEach(aluno => {
            const aulas = {};
            Database.AULAS_DIA.forEach(aula => {
                aulas[aula.numero] = 'presente';
            });
            
            Database.registrarFrequencia(aluno.id, data, aulas, '', registradoPor);
        });

        renderizarFrequenciaTurma(turma, data);
        UI.showNotification(`Todos os ${alunos.length} alunos marcados como presentes!`, 'sucesso');
    }

    // ===== UTILITÁRIOS =====
    function formatarData(dataStr) {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // API Pública
    return {
        init,
        renderizarTelaFrequencia,
        onTurmaChange,
        onDataChange,
        toggleDetalhes,
        expandirTodos,
        abrirEdicao,
        fecharModalEdicao,
        salvarEdicao,
        aplicarModoRapido,
        marcarTodosPresentes
    };
})();