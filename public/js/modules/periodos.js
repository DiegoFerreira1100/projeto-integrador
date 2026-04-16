// ============================================
// PERIODOS.JS - Gestão de Períodos Letivos
// Versão Corrigida - Controles de Período Funcionando
// ============================================

const Periodos = (function() {
    const STORAGE_KEY = 'periodosLetivos';
    
    const DIAS_SEMANA = [
        { id: 1, nome: 'Segunda', abreviado: 'SEG' },
        { id: 2, nome: 'Terça', abreviado: 'TER' },
        { id: 3, nome: 'Quarta', abreviado: 'QUA' },
        { id: 4, nome: 'Quinta', abreviado: 'QUI' },
        { id: 5, nome: 'Sexta', abreviado: 'SEX' },
        { id: 6, nome: 'Sábado', abreviado: 'SÁB' }
    ];

    const MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // ===== INICIALIZAÇÃO =====
    function init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const configPadrao = {
                periodos: [],
                metadata: {
                    criadoEm: new Date().toISOString(),
                    versao: '2.0'
                }
            };
            salvarPeriodos(configPadrao);
        }
        
        // Inicializar controles de mês/ano com valores atuais
        setTimeout(() => {
            inicializarControles();
        }, 200);
    }

    function inicializarControles() {
        const controleMes = document.getElementById('controle-mes');
        const controleAno = document.getElementById('controle-ano');
        
        if (controleMes && controleAno) {
            const hoje = new Date();
            controleMes.value = hoje.getMonth();
            controleAno.value = hoje.getFullYear();
        }
    }

    function carregarPeriodos() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { periodos: [] };
    }

    function salvarPeriodos(config) {
        config.metadata = {
            ...config.metadata,
            ultimaAtualizacao: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    // ===== RENDERIZAÇÃO =====
    function renderizarInterface() {
        const container = document.getElementById('periodos-container');
        if (!container) return;

        const config = carregarPeriodos();
        
        if (config.periodos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📅</span>
                    <p>Nenhum período letivo cadastrado</p>
                    <p class="empty-hint">Clique em "Novo Período" para começar</p>
                </div>
            `;
        } else {
            let html = '';
            
            const periodosOrdenados = [...config.periodos].sort((a, b) => 
                new Date(a.dataInicio) - new Date(b.dataInicio)
            );
            
            periodosOrdenados.forEach(periodo => {
                const diasTexto = periodo.diasSemana.map(d => {
                    const dia = DIAS_SEMANA.find(dia => dia.id === d);
                    return dia ? dia.abreviado : '';
                }).join(', ');
                
                html += `
                    <div class="periodo-card ${periodo.ativo ? 'ativo' : 'inativo'}">
                        <div class="periodo-header">
                            <div class="periodo-titulo">
                                <h4>${periodo.nome}</h4>
                                <span class="periodo-tipo-badge">${periodo.tipo || 'Personalizado'}</span>
                            </div>
                            <span class="periodo-status">${periodo.ativo ? '✅ Ativo' : '⏸️ Inativo'}</span>
                        </div>
                        
                        <div class="periodo-datas">
                            <span>📅 ${formatarData(periodo.dataInicio)} - ${formatarData(periodo.dataFim)}</span>
                        </div>
                        
                        <div class="periodo-dias">
                            <span class="periodo-dias-label">Dias com aula:</span>
                            <span class="periodo-dias-valor">${diasTexto}</span>
                        </div>
                        
                        ${periodo.observacoes ? `
                            <div class="periodo-obs">
                                <small>📝 ${periodo.observacoes}</small>
                            </div>
                        ` : ''}
                        
                        <div class="periodo-acoes">
                            <button class="btn-small ${periodo.ativo ? 'btn-desativar' : 'btn-ativar'}" 
                                    onclick="Periodos.ativarPeriodo('${periodo.id}')">
                                ${periodo.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                            </button>
                            <button class="btn-small btn-duplicar" onclick="Periodos.duplicarPeriodo('${periodo.id}')">
                                📋 Duplicar
                            </button>
                            <button class="btn-small btn-excluir" onclick="Periodos.excluirPeriodo('${periodo.id}')">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }
    }

    // ===== CONTROLES DE MÊS/ANO =====
    function aplicarMesAno() {
        const mes = document.getElementById('controle-mes')?.value;
        const ano = document.getElementById('controle-ano')?.value;
        
        if (mes && ano && typeof Calendar !== 'undefined') {
            const reservaMonth = document.getElementById('reserva-month');
            const reservaYear = document.getElementById('reserva-year');
            const monitoriaMonth = document.getElementById('monitoria-month');
            const monitoriaYear = document.getElementById('monitoria-year');
            
            if (reservaMonth) reservaMonth.value = mes;
            if (reservaYear) reservaYear.value = ano;
            if (monitoriaMonth) monitoriaMonth.value = mes;
            if (monitoriaYear) monitoriaYear.value = ano;
            
            Calendar.generateAll();
            
            if (typeof UI !== 'undefined') {
                UI.showNotification(`Visualização alterada para ${MESES[mes]} ${ano}`, 'sucesso');
            }
        } else {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Erro ao aplicar mês/ano', 'erro');
            }
        }
    }

    // ===== MODAIS =====
    function mostrarModalNovoPeriodo() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box periodo-modal">
                <h3>➕ Novo Período Letivo</h3>
                
                <div class="form-group">
                    <label>Nome do Período</label>
                    <input type="text" id="periodo-nome" placeholder="Ex: 1º Semestre 2024">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Data Início</label>
                        <input type="date" id="periodo-inicio">
                    </div>
                    <div class="form-group">
                        <label>Data Fim</label>
                        <input type="date" id="periodo-fim">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Dias da Semana (com aula)</label>
                    <div class="dias-semana-grid">
                        ${DIAS_SEMANA.map(d => `
                            <label class="dia-checkbox">
                                <input type="checkbox" value="${d.id}" checked> ${d.nome}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Observações (opcional)</label>
                    <input type="text" id="periodo-obs" placeholder="Ex: Semestre com feriados">
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Periodos.fecharModal(this)">Cancelar</button>
                    <button class="btn-primary" onclick="Periodos.salvarNovoPeriodo()">Salvar Período</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function mostrarModalSemestre() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box periodo-modal">
                <h3>📆 Adicionar Semestre</h3>
                
                <div class="form-group">
                    <label>Selecione o Semestre</label>
                    <select id="semestre-select">
                        <option value="1">1º Semestre (Fev - Jun)</option>
                        <option value="2">2º Semestre (Jul - Nov)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Ano</label>
                    <input type="number" id="semestre-ano" value="2026" min="2020" max="2030">
                </div>
                
                <div class="form-group">
                    <label>Dias da Semana (com aula)</label>
                    <div class="dias-semana-grid">
                        ${DIAS_SEMANA.map(d => `
                            <label class="dia-checkbox">
                                <input type="checkbox" value="${d.id}" checked> ${d.nome}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Periodos.fecharModal(this)">Cancelar</button>
                    <button class="btn-primary" onclick="Periodos.salvarSemestre()">Adicionar Semestre</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function mostrarModalMesCompleto() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box periodo-modal">
                <h3>📅 Adicionar Mês Inteiro</h3>
                
                <div class="form-group">
                    <label>Selecione o Mês</label>
                    <select id="mes-select">
                        ${MESES.map((mes, index) => `<option value="${index}">${mes}</option>`).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Ano</label>
                    <input type="number" id="mes-ano" value="2026" min="2020" max="2030">
                </div>
                
                <div class="form-group">
                    <label>Dias da Semana (com aula)</label>
                    <div class="dias-semana-grid">
                        ${DIAS_SEMANA.map(d => `
                            <label class="dia-checkbox">
                                <input type="checkbox" value="${d.id}" checked> ${d.nome}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Periodos.fecharModal(this)">Cancelar</button>
                    <button class="btn-primary" onclick="Periodos.salvarMesCompleto()">Adicionar Mês</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ===== SALVAR PERÍODOS =====
    function salvarNovoPeriodo() {
        const nome = document.getElementById('periodo-nome')?.value;
        const dataInicio = document.getElementById('periodo-inicio')?.value;
        const dataFim = document.getElementById('periodo-fim')?.value;
        const obs = document.getElementById('periodo-obs')?.value;
        
        const dias = [];
        document.querySelectorAll('.dias-semana-grid input:checked').forEach(cb => {
            dias.push(parseInt(cb.value));
        });

        if (!nome || !dataInicio || !dataFim || dias.length === 0) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Preencha todos os campos obrigatórios!', 'erro');
            }
            return;
        }

        if (new Date(dataInicio) > new Date(dataFim)) {
            if (typeof UI !== 'undefined') {
                UI.showNotification('Data de início não pode ser maior que data fim!', 'erro');
            }
            return;
        }

        const config = carregarPeriodos();
        const novoPeriodo = {
            id: Date.now().toString(),
            nome: nome,
            tipo: 'Personalizado',
            dataInicio: dataInicio,
            dataFim: dataFim,
            diasSemana: dias,
            observacoes: obs || '',
            ativo: config.periodos.length === 0,
            criadoEm: new Date().toISOString()
        };

        config.periodos.push(novoPeriodo);
        salvarPeriodos(config);
        
        fecharModal(document.querySelector('.modal-footer .btn-secondary'));
        renderizarInterface();
        
        if (typeof Calendar !== 'undefined') {
            Calendar.generateAll();
        }
        
        if (typeof UI !== 'undefined') {
            UI.showNotification('Período letivo criado com sucesso!', 'sucesso');
        }
    }

    function salvarSemestre() {
        const semestre = document.getElementById('semestre-select')?.value;
        const ano = document.getElementById('semestre-ano')?.value;
        
        const dias = [];
        document.querySelectorAll('.dias-semana-grid input:checked').forEach(cb => {
            dias.push(parseInt(cb.value));
        });

        if (!ano || dias.length === 0) return;

        let dataInicio, dataFim, nome;
        
        if (semestre === '1') {
            dataInicio = `${ano}-02-01`;
            dataFim = `${ano}-06-30`;
            nome = `1º Semestre ${ano}`;
        } else {
            dataInicio = `${ano}-07-01`;
            dataFim = `${ano}-11-30`;
            nome = `2º Semestre ${ano}`;
        }

        const config = carregarPeriodos();
        const novoPeriodo = {
            id: Date.now().toString(),
            nome: nome,
            tipo: 'Semestre',
            dataInicio: dataInicio,
            dataFim: dataFim,
            diasSemana: dias,
            observacoes: `Semestre letivo ${ano}`,
            ativo: config.periodos.length === 0,
            criadoEm: new Date().toISOString()
        };

        config.periodos.push(novoPeriodo);
        salvarPeriodos(config);
        
        fecharModal(document.querySelector('.modal-footer .btn-secondary'));
        renderizarInterface();
        
        if (typeof Calendar !== 'undefined') {
            Calendar.generateAll();
        }
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`${nome} adicionado com sucesso!`, 'sucesso');
        }
    }

    function salvarMesCompleto() {
        const mes = document.getElementById('mes-select')?.value;
        const ano = document.getElementById('mes-ano')?.value;
        
        const dias = [];
        document.querySelectorAll('.dias-semana-grid input:checked').forEach(cb => {
            dias.push(parseInt(cb.value));
        });

        if (!ano || dias.length === 0) return;

        const ultimoDia = new Date(ano, parseInt(mes) + 1, 0).getDate();
        const dataInicio = `${ano}-${String(parseInt(mes) + 1).padStart(2, '0')}-01`;
        const dataFim = `${ano}-${String(parseInt(mes) + 1).padStart(2, '0')}-${ultimoDia}`;
        const nome = `${MESES[mes]} ${ano}`;

        const config = carregarPeriodos();
        const novoPeriodo = {
            id: Date.now().toString(),
            nome: nome,
            tipo: 'Mês',
            dataInicio: dataInicio,
            dataFim: dataFim,
            diasSemana: dias,
            observacoes: `Mês completo de ${MESES[mes]}`,
            ativo: config.periodos.length === 0,
            criadoEm: new Date().toISOString()
        };

        config.periodos.push(novoPeriodo);
        salvarPeriodos(config);
        
        fecharModal(document.querySelector('.modal-footer .btn-secondary'));
        renderizarInterface();
        
        if (typeof Calendar !== 'undefined') {
            Calendar.generateAll();
        }
        
        if (typeof UI !== 'undefined') {
            UI.showNotification(`${nome} adicionado com sucesso!`, 'sucesso');
        }
    }

    function duplicarPeriodo(id) {
        const config = carregarPeriodos();
        const periodo = config.periodos.find(p => p.id === id);
        
        if (!periodo) return;

        const novoPeriodo = {
            ...periodo,
            id: Date.now().toString(),
            nome: `${periodo.nome} (cópia)`,
            ativo: false,
            criadoEm: new Date().toISOString()
        };

        config.periodos.push(novoPeriodo);
        salvarPeriodos(config);
        renderizarInterface();
        
        if (typeof UI !== 'undefined') {
            UI.showNotification('Período duplicado com sucesso!', 'sucesso');
        }
    }

    function ativarPeriodo(id) {
        const config = carregarPeriodos();
        const periodo = config.periodos.find(p => p.id === id);
        
        if (!periodo) return;

        if (periodo.ativo) {
            periodo.ativo = false;
            if (typeof UI !== 'undefined') {
                UI.showNotification(`Período "${periodo.nome}" desativado!`, 'sucesso');
            }
        } else {
            config.periodos.forEach(p => p.ativo = false);
            periodo.ativo = true;
            if (typeof UI !== 'undefined') {
                UI.showNotification(`Período "${periodo.nome}" ativado!`, 'sucesso');
            }
        }
        
        salvarPeriodos(config);
        renderizarInterface();
        
        if (typeof Calendar !== 'undefined') {
            Calendar.generateAll();
        }
    }

    function excluirPeriodo(id) {
        const config = carregarPeriodos();
        const periodo = config.periodos.find(p => p.id === id);
        
        if (!periodo) return;

        if (typeof UI !== 'undefined') {
            UI.showConfirmModal(
                'Excluir Período',
                `Tem certeza que deseja excluir o período <strong>${periodo.nome}</strong>?`,
                () => {
                    config.periodos = config.periodos.filter(p => p.id !== id);
                    salvarPeriodos(config);
                    renderizarInterface();
                    
                    if (typeof Calendar !== 'undefined') {
                        Calendar.generateAll();
                    }
                    
                    UI.showNotification('Período removido!', 'sucesso');
                }
            );
        }
    }

    // ===== UTILITÁRIOS =====
    function getPeriodoAtivo() {
        const config = carregarPeriodos();
        return config.periodos.find(p => p.ativo);
    }

    function isDiaLetivo(dateStr) {
        const periodoAtivo = getPeriodoAtivo();
        if (!periodoAtivo) return true;
        
        const data = new Date(dateStr);
        const dataInicio = new Date(periodoAtivo.dataInicio);
        const dataFim = new Date(periodoAtivo.dataFim);
        
        if (data < dataInicio || data > dataFim) return false;
        
        const diaSemana = data.getDay();
        
        if (diaSemana === 0) return false;
        
        return periodoAtivo.diasSemana.includes(diaSemana);
    }

    function formatarData(dataStr) {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function fecharModal(btn) {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.remove();
    }

    // API Pública
    return {
        init,
        isDiaLetivo,
        getPeriodoAtivo,
        renderizarInterface,
        mostrarModalNovoPeriodo,
        mostrarModalSemestre,
        mostrarModalMesCompleto,
        salvarNovoPeriodo,
        salvarSemestre,
        salvarMesCompleto,
        duplicarPeriodo,
        ativarPeriodo,
        excluirPeriodo,
        aplicarMesAno,
        fecharModal
    };
})();