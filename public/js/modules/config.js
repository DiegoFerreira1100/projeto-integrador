// ============================================
// CONFIG.JS - Configuração de Dias Bloqueados
// ============================================

const ConfigDias = (function() {
    // Constantes
    const STORAGE_KEY = 'configDiasBloqueados';
    
    const DIAS_SEMANA = [
        { id: 0, nome: 'Domingo', abreviado: 'DOM', completo: 'Domingo' },
        { id: 1, nome: 'Segunda', abreviado: 'SEG', completo: 'Segunda-feira' },
        { id: 2, nome: 'Terça', abreviado: 'TER', completo: 'Terça-feira' },
        { id: 3, nome: 'Quarta', abreviado: 'QUA', completo: 'Quarta-feira' },
        { id: 4, nome: 'Quinta', abreviado: 'QUI', completo: 'Quinta-feira' },
        { id: 5, nome: 'Sexta', abreviado: 'SEX', completo: 'Sexta-feira' },
        { id: 6, nome: 'Sábado', abreviado: 'SÁB', completo: 'Sábado' }
    ];

    const CONFIG_PADRAO = {
        diasBloqueados: [0, 6], // Domingo e Sábado
        personalizados: [],
        metadata: {
            criadoEm: new Date().toISOString(),
            versao: '1.0'
        }
    };

    // ===== INICIALIZAÇÃO =====
    function init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            salvarConfiguracao(CONFIG_PADRAO);
        }
        renderizarInterface();
    }

    // ===== CRUD CONFIGURAÇÃO =====
    function carregarConfiguracao() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || CONFIG_PADRAO;
    }

    function salvarConfiguracao(config) {
        config.metadata = {
            ...config.metadata,
            ultimaAtualizacao: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    // ===== INTERFACE =====
    function renderizarInterface() {
        const container = document.getElementById('dias-bloqueados-container');
        if (!container) return;

        const config = carregarConfiguracao();
        
        container.innerHTML = DIAS_SEMANA.map(dia => {
            const isBloqueado = config.diasBloqueados.includes(dia.id);
            return `
                <div class="dia-checkbox-item ${isBloqueado ? 'bloqueado' : ''}" 
                     onclick="ConfigDias.toggleDia(${dia.id})"
                     data-dia-id="${dia.id}"
                     title="${dia.completo}">
                    <span class="dia-nome">${dia.abreviado}</span>
                    <span class="dia-status">${isBloqueado ? '🔴 Bloqueado' : '🟢 Disponível'}</span>
                </div>
            `;
        }).join('');
    }

    function toggleDia(diaId) {
        const config = carregarConfiguracao();
        const index = config.diasBloqueados.indexOf(diaId);
        
        if (index === -1) {
            config.diasBloqueados.push(diaId);
        } else {
            config.diasBloqueados.splice(index, 1);
        }
        
        salvarConfiguracao(config);
        renderizarInterface();
    }

    function salvarConfig() {
        const config = carregarConfiguracao();
        
        // Feedback visual
        const mensagem = document.createElement('div');
        mensagem.className = 'auth-message sucesso';
        mensagem.textContent = 'Configuração salva com sucesso!';
        mensagem.style.display = 'block';
        
        const container = document.querySelector('.config-dias-card');
        if (container) {
            container.insertBefore(mensagem, container.firstChild);
            setTimeout(() => mensagem.remove(), 2000);
        }

        // Atualizar calendários
        if (typeof Calendar !== 'undefined') {
            Calendar.generateAll();
        }
    }

    function resetarPadrao() {
        if (confirm('Resetar para configuração padrão (sábado e domingo bloqueados)?')) {
            salvarConfiguracao(CONFIG_PADRAO);
            renderizarInterface();
            
            const mensagem = document.createElement('div');
            mensagem.className = 'auth-message sucesso';
            mensagem.textContent = 'Configuração resetada!';
            mensagem.style.display = 'block';
            
            const container = document.querySelector('.config-dias-card');
            if (container) {
                container.insertBefore(mensagem, container.firstChild);
                setTimeout(() => mensagem.remove(), 2000);
            }

            // Atualizar calendários
            if (typeof Calendar !== 'undefined') {
                Calendar.generateAll();
            }
        }
    }

    // ===== VALIDAÇÕES =====
    function isDiaBloqueado(diaSemana) {
        const config = carregarConfiguracao();
        return config.diasBloqueados.includes(diaSemana);
    }

    function isDataBloqueada(dateStr) {
        const date = new Date(dateStr);
        const diaSemana = date.getDay();
        return isDiaBloqueado(diaSemana);
    }

    function getDiasBloqueados() {
        const config = carregarConfiguracao();
        return config.diasBloqueados;
    }

    function getNomeDia(diaSemana) {
        const dia = DIAS_SEMANA.find(d => d.id === diaSemana);
        return dia ? dia.abreviado : '';
    }

    // ===== DIAS PERSONALIZADOS (para expansão futura) =====
    function adicionarDiaPersonalizado(data, motivo) {
        const config = carregarConfiguracao();
        
        if (!config.personalizados) {
            config.personalizados = [];
        }

        config.personalizados.push({
            data: data,
            motivo: motivo,
            criadoEm: new Date().toISOString()
        });

        salvarConfiguracao(config);
    }

    function removerDiaPersonalizado(data) {
        const config = carregarConfiguracao();
        
        if (config.personalizados) {
            config.personalizados = config.personalizados.filter(d => d.data !== data);
            salvarConfiguracao(config);
        }
    }

    // API Pública
    return {
        init,
        toggleDia,
        salvarConfig,
        resetarPadrao,
        isDiaBloqueado,
        isDataBloqueada,
        getDiasBloqueados,
        getNomeDia,
        adicionarDiaPersonalizado,
        removerDiaPersonalizado,
        DIAS_SEMANA
    };
})();