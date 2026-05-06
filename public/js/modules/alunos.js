// ============================================
// ALUNOS.JS - Cadastro e Gestão de Alunos
// Versão: Hierarquia de Liderança por Turma
// ============================================

const Alunos = (function() {
    // Estado
    let turmaSelecionada = null;
    let alunoEditando = null;

    // ===== INICIALIZAÇÃO =====
    function init() {
        console.log('👥 Módulo de Alunos inicializado');
    }

    // ===== RENDERIZAÇÃO PRINCIPAL =====
    function renderizarTelaAlunos() {
        const container = document.getElementById('alunos-content');
        if (!container) return;

        const turmas = typeof Database !== 'undefined' ? Database.getData('turmas') : [];

        if (turmas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🏫</span>
                    <p>Nenhuma turma cadastrada</p>
                    <p class="empty-hint">Cadastre uma turma primeiro na seção de Configurações</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="alunos-container">
                <div class="alunos-header">
                    <h2>👥 Cadastro de Alunos</h2>
                    <div class="alunos-controls">
                        <div class="form-group">
                            <label>Turma</label>
                            <select id="alunos-turma-select" onchange="Alunos.onTurmaChange()">
                                <option value="">Selecione uma turma</option>
                                ${turmas.map(t => `<option value="${t}" ${t === turmaSelecionada ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        ${turmaSelecionada ? `
                            <button class="btn-primary" onclick="Alunos.abrirModalNovoAluno()">
                                + Novo Aluno
                            </button>
                            <button class="btn-secondary" onclick="Alunos.abrirModalImportar()">
                                📥 Importar Lista
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div id="alunos-turma-content"></div>
            </div>
        `;

        container.innerHTML = html;

        if (turmaSelecionada) {
            renderizarAlunosTurma(turmaSelecionada);
        }
    }

    function onTurmaChange() {
        const select = document.getElementById('alunos-turma-select');
        if (select && select.value) {
            turmaSelecionada = select.value;
            renderizarTelaAlunos(); // Re-renderizar para mostrar botões
            renderizarAlunosTurma(turmaSelecionada);
        } else {
            turmaSelecionada = null;
            const content = document.getElementById('alunos-turma-content');
            if (content) content.innerHTML = '';
        }
    }

    // ===== RENDERIZAR ALUNOS DA TURMA =====
    function renderizarAlunosTurma(turma) {
        const content = document.getElementById('alunos-turma-content');
        if (!content) return;

        const alunos = typeof Database !== 'undefined' ? Database.getAlunosPorTurma(turma) : [];
        const lideranca = typeof Database !== 'undefined' ? Database.getAlunosComLideranca(turma) : null;

        let html = `
            <div class="alunos-info-bar">
                <div class="alunos-total">
                    <strong>Total de alunos:</strong> ${alunos.length}
                </div>
                <div class="alunos-lideranca">
                    ${lideranca ? `
                        <span class="lideranca-item">
                            👑 <strong>Líder:</strong> ${lideranca.lider ? lideranca.lider.nome : 'Não definido'}
                        </span>
                        <span class="lideranca-item">
                            ⭐ <strong>Vice-líder:</strong> ${lideranca.viceLider ? lideranca.viceLider.nome : 'Não definido'}
                        </span>
                        <span class="lideranca-item">
                            📝 <strong>Secretário:</strong> ${lideranca.secretario ? lideranca.secretario.nome : 'Não definido'}
                        </span>
                    ` : '<span>Carregando lideranças...</span>'}
                </div>
            </div>

            <div class="alunos-lista-container">
        `;

        if (alunos.length === 0) {
            html += `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>Nenhum aluno cadastrado nesta turma</p>
                    <p class="empty-hint">Clique em "+ Novo Aluno" para começar</p>
                </div>
            `;
        } else {
            html += `
                <div class="alunos-tabela-wrapper">
                    <table class="alunos-tabela">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Nome</th>
                                <th>Função</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            alunos.forEach(aluno => {
                const funcaoNome = getFuncaoNome(aluno.funcao);
                const funcaoClass = `funcao-${aluno.funcao}`;
                const statusClass = aluno.ativo ? 'ativo' : 'inativo';
                const statusTexto = aluno.ativo ? 'Ativo' : 'Inativo';

                html += `
                    <tr class="aluno-row ${statusClass}">
                        <td><span class="matricula-badge">${aluno.matricula}</span></td>
                        <td>
                            <span class="aluno-nome">${aluno.nome}</span>
                            ${aluno.funcao !== 'aluno' ? `<span class="funcao-badge-mini ${funcaoClass}">${funcaoNome}</span>` : ''}
                        </td>
                        <td>
                            <span class="funcao-texto ${funcaoClass}">${funcaoNome}</span>
                        </td>
                        <td>
                            <span class="status-badge status-${statusClass}">${statusTexto}</span>
                        </td>
                        <td>
                            <div class="aluno-acoes">
                                <button class="btn-small" onclick="Alunos.abrirModalEditarAluno('${aluno.id}', '${turma}')" title="Editar aluno">
                                    ✏️
                                </button>
                                <button class="btn-small btn-desativar" onclick="Alunos.toggleAtivoAluno('${aluno.id}', '${turma}')" title="${aluno.ativo ? 'Desativar' : 'Ativar'} aluno">
                                    ${aluno.ativo ? '👁️' : '🔒'}
                                </button>
                                <button class="btn-small btn-excluir" onclick="Alunos.removerAluno('${aluno.id}', '${turma}', '${aluno.nome}')" title="Remover aluno">
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        html += `
            </div>
        `;

        // Adicionar seção de exportação
        if (alunos.length > 0) {
            html += `
                <div class="alunos-export">
                    <button class="btn-secondary" onclick="Alunos.exportarListaAlunos('${turma}')">
                        📥 Exportar Lista (CSV)
                    </button>
                    <button class="btn-secondary" onclick="Alunos.imprimirLista('${turma}')">
                        🖨️ Imprimir Lista
                    </button>
                </div>
            `;
        }

        content.innerHTML = html;
    }

    function getFuncaoNome(funcao) {
        const nomes = {
            'lider': 'Líder',
            'vice-lider': 'Vice-líder',
            'secretario': 'Secretário',
            'aluno': 'Aluno'
        };
        return nomes[funcao] || 'Aluno';
    }

    // ===== CRUD ALUNOS =====
    function abrirModalNovoAluno() {
        if (!turmaSelecionada) {
            UI.showNotification('Selecione uma turma primeiro!', 'erro');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-novo-aluno';

        modal.innerHTML = `
            <div class="modal-box modal-aluno">
                <h3>➕ Novo Aluno</h3>
                <p class="modal-turma-info">Turma: <strong>${turmaSelecionada}</strong></p>
                
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" id="novo-aluno-nome" placeholder="Ex: João Silva" required>
                </div>
                
                <div class="form-group">
                    <label>Número de Matrícula</label>
                    <input type="text" id="novo-aluno-matricula" placeholder="Ex: 20240001" required>
                </div>
                
                <div class="form-group">
                    <label>Função na Turma</label>
                    <select id="novo-aluno-funcao">
                        <option value="aluno">Aluno</option>
                        <option value="lider">👑 Líder</option>
                        <option value="vice-lider">⭐ Vice-líder</option>
                        <option value="secretario">📝 Secretário</option>
                    </select>
                    <small class="form-hint">
                        ⚠️ Apenas um aluno pode ser Líder, Vice-líder ou Secretário por turma.
                        Se já existir, o atual será substituído.
                    </small>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Alunos.fecharModal('modal-novo-aluno')">Cancelar</button>
                    <button class="btn-primary" onclick="Alunos.salvarNovoAluno()">💾 Salvar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function salvarNovoAluno() {
        const nome = document.getElementById('novo-aluno-nome')?.value.trim();
        const matricula = document.getElementById('novo-aluno-matricula')?.value.trim();
        const funcao = document.getElementById('novo-aluno-funcao')?.value;

        if (!nome || !matricula) {
            UI.showNotification('Preencha todos os campos!', 'erro');
            return;
        }

        // Verificar se a função de liderança já existe
        if (funcao !== 'aluno') {
            const lideranca = Database.getAlunosComLideranca(turmaSelecionada);
            const funcaoAtual = {
                'lider': lideranca.lider,
                'vice-lider': lideranca.viceLider,
                'secretario': lideranca.secretario
            };

            if (funcaoAtual[funcao]) {
                // Remover função do aluno atual
                Database.atualizarAluno(turmaSelecionada, funcaoAtual[funcao].id, { funcao: 'aluno' });
            }
        }

        const resultado = Database.cadastrarAluno(turmaSelecionada, nome, matricula, funcao);

        if (resultado.sucesso) {
            fecharModal('modal-novo-aluno');
            renderizarAlunosTurma(turmaSelecionada);
            UI.showNotification(`Aluno "${nome}" cadastrado com sucesso!`, 'sucesso');
        } else {
            UI.showNotification(resultado.mensagem || 'Erro ao cadastrar aluno', 'erro');
        }
    }

    function abrirModalEditarAluno(alunoId, turma) {
        const alunos = Database.getAlunosPorTurma(turma);
        const aluno = alunos.find(a => a.id === alunoId);

        if (!aluno) {
            UI.showNotification('Aluno não encontrado!', 'erro');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-editar-aluno';

        modal.innerHTML = `
            <div class="modal-box modal-aluno">
                <h3>✏️ Editar Aluno</h3>
                <p class="modal-turma-info">Turma: <strong>${turma}</strong></p>
                
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" id="editar-aluno-nome" value="${aluno.nome}" required>
                </div>
                
                <div class="form-group">
                    <label>Número de Matrícula</label>
                    <input type="text" id="editar-aluno-matricula" value="${aluno.matricula}" required>
                </div>
                
                <div class="form-group">
                    <label>Função na Turma</label>
                    <select id="editar-aluno-funcao">
                        <option value="aluno" ${aluno.funcao === 'aluno' ? 'selected' : ''}>Aluno</option>
                        <option value="lider" ${aluno.funcao === 'lider' ? 'selected' : ''}>👑 Líder</option>
                        <option value="vice-lider" ${aluno.funcao === 'vice-lider' ? 'selected' : ''}>⭐ Vice-líder</option>
                        <option value="secretario" ${aluno.funcao === 'secretario' ? 'selected' : ''}>📝 Secretário</option>
                    </select>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Alunos.fecharModal('modal-editar-aluno')">Cancelar</button>
                    <button class="btn-primary" onclick="Alunos.salvarEdicaoAluno('${alunoId}', '${turma}')">💾 Salvar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function salvarEdicaoAluno(alunoId, turma) {
        const nome = document.getElementById('editar-aluno-nome')?.value.trim();
        const matricula = document.getElementById('editar-aluno-matricula')?.value.trim();
        const funcao = document.getElementById('editar-aluno-funcao')?.value;

        if (!nome || !matricula) {
            UI.showNotification('Preencha todos os campos!', 'erro');
            return;
        }

        // Verificar liderança
        if (funcao !== 'aluno') {
            const lideranca = Database.getAlunosComLideranca(turma);
            const funcaoAtual = {
                'lider': lideranca.lider,
                'vice-lider': lideranca.viceLider,
                'secretario': lideranca.secretario
            };

            if (funcaoAtual[funcao] && funcaoAtual[funcao].id !== alunoId) {
                Database.atualizarAluno(turma, funcaoAtual[funcao].id, { funcao: 'aluno' });
            }
        }

        const resultado = Database.atualizarAluno(turma, alunoId, {
            nome: nome,
            matricula: matricula,
            funcao: funcao
        });

        if (resultado.sucesso) {
            fecharModal('modal-editar-aluno');
            renderizarAlunosTurma(turma);
            UI.showNotification(`Aluno "${nome}" atualizado com sucesso!`, 'sucesso');
        } else {
            UI.showNotification(resultado.mensagem || 'Erro ao atualizar aluno', 'erro');
        }
    }

    function toggleAtivoAluno(alunoId, turma) {
        const alunos = Database.getAlunosPorTurma(turma);
        const aluno = alunos.find(a => a.id === alunoId);

        if (!aluno) return;

        const novoStatus = !aluno.ativo;
        const acao = novoStatus ? 'ativar' : 'desativar';

        UI.showConfirmModal(
            `${novoStatus ? 'Ativar' : 'Desativar'} Aluno`,
            `Tem certeza que deseja ${acao} o aluno <strong>${aluno.nome}</strong>?`,
            () => {
                Database.atualizarAluno(turma, alunoId, { ativo: novoStatus });
                renderizarAlunosTurma(turma);
                UI.showNotification(`Aluno ${aluno.nome} ${novoStatus ? 'ativado' : 'desativado'}!`, 'sucesso');
            }
        );
    }

    function removerAluno(alunoId, turma, nomeAluno) {
        UI.showConfirmModal(
            'Remover Aluno',
            `Tem certeza que deseja remover o aluno <strong>${nomeAluno}</strong> da turma <strong>${turma}</strong>?<br><br>
             <span style="color: #ef4444;">⚠️ Os registros de frequência deste aluno serão mantidos.</span>`,
            () => {
                const resultado = Database.removerAluno(turma, alunoId);
                
                if (resultado.sucesso) {
                    renderizarAlunosTurma(turma);
                    UI.showNotification('Aluno removido com sucesso!', 'sucesso');
                } else {
                    UI.showNotification(resultado.mensagem || 'Erro ao remover aluno', 'erro');
                }
            }
        );
    }

    function fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }

    // ===== IMPORTAÇÃO EM LOTE =====
    function abrirModalImportar() {
        if (!turmaSelecionada) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-importar-alunos';

        modal.innerHTML = `
            <div class="modal-box modal-importar">
                <h3>📥 Importar Lista de Alunos</h3>
                <p class="modal-turma-info">Turma: <strong>${turmaSelecionada}</strong></p>
                
                <div class="form-group">
                    <label>Cole os dados dos alunos</label>
                    <p class="form-hint">Formato: <code>Nome;Matrícula;Função</code> (um por linha)</p>
                    <p class="form-hint">Funções: aluno, lider, vice-lider, secretario</p>
                    <textarea id="importar-dados" rows="10" placeholder="João Silva;20240001;aluno
Maria Santos;20240002;lider
Pedro Costa;20240003;aluno"></textarea>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Alunos.fecharModal('modal-importar-alunos')">Cancelar</button>
                    <button class="btn-primary" onclick="Alunos.processarImportacao()">📥 Importar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function processarImportacao() {
        const dados = document.getElementById('importar-dados')?.value.trim();
        
        if (!dados) {
            UI.showNotification('Cole os dados dos alunos!', 'erro');
            return;
        }

        const linhas = dados.split('\n').filter(l => l.trim());
        let importados = 0;
        let erros = 0;

        linhas.forEach(linha => {
            const partes = linha.split(';').map(p => p.trim());
            
            if (partes.length >= 2) {
                const nome = partes[0];
                const matricula = partes[1];
                const funcao = partes[2] || 'aluno';

                if (nome && matricula) {
                    const resultado = Database.cadastrarAluno(turmaSelecionada, nome, matricula, funcao);
                    
                    if (resultado.sucesso) {
                        importados++;
                    } else {
                        erros++;
                    }
                }
            }
        });

        fecharModal('modal-importar-alunos');
        renderizarAlunosTurma(turmaSelecionada);
        UI.showNotification(`${importados} alunos importados! ${erros > 0 ? erros + ' erros.' : ''}`, 'sucesso');
    }

    // ===== EXPORTAÇÃO =====
    function exportarListaAlunos(turma) {
        const alunos = Database.getAlunosPorTurma(turma);
        
        if (alunos.length === 0) {
            UI.showNotification('Nenhum aluno para exportar!', 'erro');
            return;
        }

        let csv = 'Nome;Matrícula;Função;Status\n';
        
        alunos.forEach(aluno => {
            csv += `${aluno.nome};${aluno.matricula};${getFuncaoNome(aluno.funcao)};${aluno.ativo ? 'Ativo' : 'Inativo'}\n`;
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `alunos_${turma.replace(/\s+/g, '_')}.csv`;
        link.click();

        UI.showNotification('Lista exportada com sucesso!', 'sucesso');
    }

    function imprimirLista(turma) {
        const alunos = Database.getAlunosPorTurma(turma);
        
        const janela = window.open('', '_blank');
        janela.document.write(`
            <html>
                <head>
                    <title>Lista de Alunos - ${turma}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f0f0f0; }
                        @media print { button { display: none; } }
                    </style>
                </head>
                <body>
                    <h1>Lista de Alunos - ${turma}</h1>
                    <p>Total: ${alunos.length} alunos</p>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Matrícula</th>
                                <th>Nome</th>
                                <th>Função</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alunos.map((a, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${a.matricula}</td>
                                    <td>${a.nome}</td>
                                    <td>${getFuncaoNome(a.funcao)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;">
                        🖨️ Imprimir
                    </button>
                </body>
            </html>
        `);
    }

    // API Pública
    return {
        init,
        renderizarTelaAlunos,
        onTurmaChange,
        abrirModalNovoAluno,
        salvarNovoAluno,
        abrirModalEditarAluno,
        salvarEdicaoAluno,
        toggleAtivoAluno,
        removerAluno,
        fecharModal,
        abrirModalImportar,
        processarImportacao,
        exportarListaAlunos,
        imprimirLista
    };
})();