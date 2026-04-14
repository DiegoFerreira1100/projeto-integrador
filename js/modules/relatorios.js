// ============================================
// RELATORIOS.JS - Geração de Relatórios
// Versão Corrigida e Funcional
// ============================================

const Relatorios = (function() {
    
    function mostrarMenuRelatorios() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box relatorio-modal">
                <h3>📊 Relatórios</h3>
                <p class="modal-description">Selecione o tipo de relatório desejado</p>
                
                <div class="relatorio-opcoes">
                    <div class="relatorio-card" onclick="Relatorios.gerarRelatorio('laboratorios')">
                        <span class="relatorio-icon">🧪</span>
                        <h4>Uso dos Laboratórios</h4>
                        <p>Reservas por laboratório e período</p>
                    </div>
                    <div class="relatorio-card" onclick="Relatorios.gerarRelatorio('monitores')">
                        <span class="relatorio-icon">👥</span>
                        <h4>Escala de Monitores</h4>
                        <p>Postos ocupados por período</p>
                    </div>
                    <div class="relatorio-card" onclick="Relatorios.gerarRelatorio('professores')">
                        <span class="relatorio-icon">👨‍🏫</span>
                        <h4>Professores</h4>
                        <p>Frequência de uso dos laboratórios</p>
                    </div>
                    <div class="relatorio-card" onclick="Relatorios.gerarRelatorio('geral')">
                        <span class="relatorio-icon">📈</span>
                        <h4>Relatório Geral</h4>
                        <p>Visão completa do período</p>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="Relatorios.fecharModal(this)">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function gerarRelatorio(tipo) {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
        
        const dados = coletarDados();
        const relatorioHTML = gerarHTMLRelatorio(tipo, dados);
        abrirJanelaRelatorio(relatorioHTML, tipo);
    }

    function coletarDados() {
        const dados = {
            reservas: {},
            monitoria: {},
            professores: new Set(),
            turmas: new Set(),
            periodo: typeof Periodos !== 'undefined' ? Periodos.getPeriodoAtivo() : null
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key.startsWith('res-')) {
                const partes = key.split('-');
                const lab = partes[1];
                const data = partes[2];
                const slot = partes.slice(3).join('-');
                
                try {
                    const reserva = JSON.parse(localStorage.getItem(key));
                    
                    if (!dados.reservas[lab]) dados.reservas[lab] = [];
                    dados.reservas[lab].push({
                        data,
                        slot,
                        professor: reserva.p || '',
                        turma: reserva.t || ''
                    });
                    
                    if (reserva.p) dados.professores.add(reserva.p);
                    if (reserva.t) dados.turmas.add(reserva.t);
                } catch (e) {
                    console.error('Erro ao ler reserva:', key);
                }
            }
            
            if (key.startsWith('mon-')) {
                const partes = key.split('-');
                const posto = partes[1];
                
                try {
                    const escala = JSON.parse(localStorage.getItem(key));
                    
                    if (!dados.monitoria[posto]) dados.monitoria[posto] = [];
                    dados.monitoria[posto].push({
                        monitor: escala.m || '',
                        turma: escala.t || ''
                    });
                } catch (e) {
                    console.error('Erro ao ler monitoria:', key);
                }
            }
        }

        return dados;
    }

    function gerarHTMLRelatorio(tipo, dados) {
        const periodo = dados.periodo || { nome: 'Sem período definido' };
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        let conteudo = `
            <div class="relatorio-header">
                <h1>📊 Relatório Escolar</h1>
                <p>Gerado em: ${dataAtual}</p>
            </div>
            
            <div class="relatorio-info">
                <h3>📅 Período Ativo: ${periodo.nome}</h3>
                ${periodo.dataInicio ? `
                    <p>${formatarData(periodo.dataInicio)} - ${formatarData(periodo.dataFim)}</p>
                ` : ''}
            </div>
        `;

        switch(tipo) {
            case 'laboratorios':
                conteudo += gerarRelatorioLaboratorios(dados);
                break;
            case 'monitores':
                conteudo += gerarRelatorioMonitores(dados);
                break;
            case 'professores':
                conteudo += gerarRelatorioProfessores(dados);
                break;
            case 'geral':
                conteudo += gerarRelatorioGeral(dados);
                break;
            default:
                conteudo += '<p>Tipo de relatório não reconhecido</p>';
        }

        return conteudo;
    }

    function gerarRelatorioLaboratorios(dados) {
        let html = '<h2>🧪 Uso dos Laboratórios</h2>';
        
        const labs = Object.keys(dados.reservas);
        
        if (labs.length === 0) {
            return html + '<p class="relatorio-vazio">Nenhuma reserva encontrada</p>';
        }
        
        labs.forEach(lab => {
            const reservas = dados.reservas[lab];
            const total = reservas.length;
            const diasUnicos = new Set(reservas.map(r => r.data)).size;
            
            html += `
                <div class="relatorio-secao">
                    <h3>${lab}</h3>
                    <p class="relatorio-resumo">Total: ${total} reservas | ${diasUnicos} dias</p>
                    
                    <table class="relatorio-tabela">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Professor</th>
                                <th>Turma</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            reservas.sort((a, b) => a.data.localeCompare(b.data)).forEach(r => {
                html += `
                    <tr>
                        <td>${formatarData(r.data)}</td>
                        <td>${r.slot}</td>
                        <td>${r.professor || '-'}</td>
                        <td>${r.turma || '-'}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        return html;
    }

    function gerarRelatorioMonitores(dados) {
        let html = '<h2>👥 Escala de Monitores</h2>';
        
        const postos = Object.keys(dados.monitoria);
        
        if (postos.length === 0) {
            return html + '<p class="relatorio-vazio">Nenhuma escala de monitoria encontrada</p>';
        }
        
        html += `
            <table class="relatorio-tabela">
                <thead>
                    <tr>
                        <th>Posto</th>
                        <th>Monitor</th>
                        <th>Turma</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        postos.forEach(posto => {
            dados.monitoria[posto].forEach(escala => {
                html += `
                    <tr>
                        <td><strong>${posto}</strong></td>
                        <td>${escala.monitor || '-'}</td>
                        <td>${escala.turma || '-'}</td>
                    </tr>
                `;
            });
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    }

    function gerarRelatorioProfessores(dados) {
        const usoProfessores = {};
        
        Object.values(dados.reservas).forEach(reservas => {
            reservas.forEach(r => {
                if (r.professor) {
                    if (!usoProfessores[r.professor]) {
                        usoProfessores[r.professor] = { total: 0, labs: {} };
                    }
                    usoProfessores[r.professor].total++;
                    
                    for (const [lab, res] of Object.entries(dados.reservas)) {
                        if (res.includes(r)) {
                            usoProfessores[r.professor].labs[lab] = 
                                (usoProfessores[r.professor].labs[lab] || 0) + 1;
                            break;
                        }
                    }
                }
            });
        });

        let html = '<h2>👨‍🏫 Frequência de Uso por Professor</h2>';
        
        const professores = Object.keys(usoProfessores);
        
        if (professores.length === 0) {
            return html + '<p class="relatorio-vazio">Nenhum dado de professor encontrado</p>';
        }
        
        html += `
            <table class="relatorio-tabela">
                <thead>
                    <tr>
                        <th>Professor</th>
                        <th>Total de Reservas</th>
                        <th>Detalhamento</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        professores
            .sort((a, b) => usoProfessores[b].total - usoProfessores[a].total)
            .forEach(prof => {
                const dadosProf = usoProfessores[prof];
                const detalhes = Object.entries(dadosProf.labs)
                    .map(([lab, qtd]) => `${lab}: ${qtd}`)
                    .join(' | ');
                
                html += `
                    <tr>
                        <td><strong>${prof}</strong></td>
                        <td><span class="relatorio-total">${dadosProf.total}</span></td>
                        <td>${detalhes}</td>
                    </tr>
                `;
            });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    }

    function gerarRelatorioGeral(dados) {
        const totalReservas = Object.values(dados.reservas)
            .reduce((acc, res) => acc + res.length, 0);
        
        const totalLaboratorios = Object.keys(dados.reservas).length;
        const totalProfessores = dados.professores.size;
        const totalTurmas = dados.turmas.size;
        
        let html = `
            <h2>📈 Relatório Geral</h2>
            
            <div class="relatorio-cards">
                <div class="relatorio-card-estatistica">
                    <span class="estatistica-valor">${totalLaboratorios}</span>
                    <span class="estatistica-label">Laboratórios</span>
                </div>
                <div class="relatorio-card-estatistica">
                    <span class="estatistica-valor">${totalProfessores}</span>
                    <span class="estatistica-label">Professores</span>
                </div>
                <div class="relatorio-card-estatistica">
                    <span class="estatistica-valor">${totalTurmas}</span>
                    <span class="estatistica-label">Turmas</span>
                </div>
                <div class="relatorio-card-estatistica">
                    <span class="estatistica-valor">${totalReservas}</span>
                    <span class="estatistica-label">Total de Reservas</span>
                </div>
            </div>
            
            <h3>Reservas por Laboratório</h3>
            <table class="relatorio-tabela">
                <thead>
                    <tr>
                        <th>Laboratório</th>
                        <th>Quantidade</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        Object.entries(dados.reservas).forEach(([lab, reservas]) => {
            html += `
                <tr>
                    <td>${lab}</td>
                    <td>${reservas.length}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        return html;
    }

    function abrirJanelaRelatorio(html, tipo) {
        const estilos = `
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    padding: 2rem;
                    background: #f8fafc;
                    color: #0f172a;
                    line-height: 1.6;
                }
                .relatorio-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #10b981;
                }
                .relatorio-header h1 {
                    color: #0f172a;
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                .relatorio-info {
                    background: white;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                    border-left: 4px solid #10b981;
                }
                .relatorio-tabela {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                    background: white;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .relatorio-tabela th {
                    background: #f0fdf4;
                    padding: 0.75rem;
                    text-align: left;
                    font-weight: 600;
                    color: #0f172a;
                    border-bottom: 2px solid #10b981;
                }
                .relatorio-tabela td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .relatorio-tabela tr:hover td {
                    background: #f8fafc;
                }
                .relatorio-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin: 2rem 0;
                }
                .relatorio-card-estatistica {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 0.5rem;
                    text-align: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }
                .estatistica-valor {
                    display: block;
                    font-size: 2rem;
                    font-weight: 700;
                    color: #10b981;
                    margin-bottom: 0.5rem;
                }
                .estatistica-label {
                    color: #64748b;
                    font-size: 0.9rem;
                }
                .relatorio-total {
                    background: #10b981;
                    color: white;
                    padding: 0.2rem 0.5rem;
                    border-radius: 1rem;
                    font-size: 0.85rem;
                }
                .relatorio-vazio {
                    text-align: center;
                    padding: 2rem;
                    background: white;
                    border-radius: 0.5rem;
                    color: #94a3b8;
                }
                .btn-print {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 2rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(16,185,129,0.3);
                }
                .btn-print:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16,185,129,0.4);
                }
                @media print {
                    .btn-print { display: none; }
                }
            </style>
        `;

        const janela = window.open('', '_blank');
        janela.document.write(`
            <html>
                <head>
                    <title>Relatório - Portal Escolar</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    ${estilos}
                </head>
                <body>
                    ${html}
                    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
                </body>
            </html>
        `);
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

    return {
        mostrarMenuRelatorios,
        gerarRelatorio,
        fecharModal
    };
})();