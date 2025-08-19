document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const settingsModal = document.getElementById('settings-modal');
    const openSettingsModalButton = document.getElementById('open-settings-modal');
    const closeSettingsModalButton = document.getElementById('close-settings-modal');
    const closeMonthModal = document.getElementById('close-month-modal');
    const closeMonthModalBtn = document.getElementById('close-month-modal-btn');
    const closeMonthNameSpan = document.getElementById('close-month-name');
    const calculatedValueSpan = document.getElementById('calculated-value');
    const paidAmountInput = document.getElementById('paid-amount');
    const cancelCloseMonthBtn = document.getElementById('cancel-close-month');
    const confirmCloseMonthBtn = document.getElementById('confirm-close-month');
    const userNameInput = document.getElementById('user-name-input');
    const locationNameInput = document.getElementById('location-name');
    const dailyRateInput = document.getElementById('daily-rate');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const savedFeedback = document.getElementById('saved-feedback');
    const logStayButton = document.getElementById('log-stay-button');
    const logFeedback = document.getElementById('log-feedback');
    const userNameDisplay = document.getElementById('user-name');
    const currentMonthSummaryDiv = document.getElementById('current-month-summary');
    
    // Editor de Banco de Dados
    const openDatabaseEditorBtn = document.getElementById('open-database-editor');
    const databaseEditorModal = document.getElementById('database-editor-modal');
    const closeDatabaseEditorBtn = document.getElementById('close-database-editor');
    const tableSelector = document.getElementById('table-selector');
    const addRecordBtn = document.getElementById('add-record-btn');
    const refreshDataBtn = document.getElementById('refresh-data-btn');
    const dataGrid = document.getElementById('data-grid');
    const recordEditorModal = document.getElementById('record-editor-modal');
    const closeRecordEditorBtn = document.getElementById('close-record-editor');
    const recordEditorTitle = document.getElementById('record-editor-title');
    const recordForm = document.getElementById('record-form');
    const cancelRecordEditBtn = document.getElementById('cancel-record-edit');
    const saveRecordBtn = document.getElementById('save-record');
    
    // Modal de Detalhes do Dia
    const dayDetailsModal = document.getElementById('day-details-modal');
    const closeDayDetailsBtn = document.getElementById('close-day-details');
    const dayDetailsTitle = document.getElementById('day-details-title');
    const dayDetailsContent = document.getElementById('day-details-content');
    
    // Sistema de Temas
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // --- Constantes e Estado da Aplicação ---
    const API_URL = '/api/hospedagem';
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let appData = getInitialData();
    
    // === FUNÇÕES UTILITÁRIAS ===
    
    /**
     * Extrai os dias de hospedagem de um objeto de hospedagem,
     * lidando com formato legado (array) e novo formato (objeto).
     * @param {Object} monthData - Dados do mês de hospedagem
     * @returns {Array} Array com os números dos dias
     */
    function extractDaysFromHospedagem(monthData) {
        if (!monthData || !monthData.dias) {
            return [];
        }
        
        // Se dias é um array (formato legado), retornar diretamente
        if (Array.isArray(monthData.dias)) {
            return monthData.dias;
        }
        
        // Se dias é um objeto (novo formato), extrair as chaves
        if (typeof monthData.dias === 'object') {
            return Object.keys(monthData.dias).map(day => parseInt(day));
        }
        
        return [];
    }
    
    // Estado do Editor de Banco
    let currentTable = 'usuario';
    let currentTableData = [];
    let editingRecord = null;
    let editingIndex = -1;

    // === SISTEMA DE TEMAS ===
    
    /**
     * Obtém o tema atual (salvo no localStorage ou tema claro como padrão)
     */
    function getCurrentTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return 'light'; // Sempre usar tema claro como padrão
    }
    
    /**
     * Aplica o tema especificado
     */
    function applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            html.removeAttribute('data-theme');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
        
        localStorage.setItem('theme', theme);
    }
    
    /**
     * Alterna entre tema claro e escuro
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }
    
    /**
     * Inicializa o sistema de temas
     */
    function initThemeSystem() {
        // Aplica o tema inicial
        const initialTheme = getCurrentTheme();
        applyTheme(initialTheme);
        
        // Adiciona listener para o botão de alternância
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // --- Funções ---

    /**
     * Retorna a estrutura de dados inicial para a aplicação.
     */
    function getInitialData() {
        return {
            usuario: { nome: "", localPadrao: "", valorDiaria: 0 },
            hospedagens: {}
        };
    }

    /**
     * Carrega os dados principais do servidor.
     */
    async function loadData(retryCount = 0) {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) throw new Error('Não foi possível carregar os dados.');
            
            appData = await response.json();
            updateUI();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Retry automático até 3 tentativas (sem delay com Supabase)
            if (retryCount < 3) {
                console.log(`Tentativa ${retryCount + 1} de recarregamento...`);
                loadData(retryCount + 1);
            } else {
                showFeedback('Erro ao carregar dados do servidor. Tente recarregar a página.', 'error');
            }
        }
    }

    /**
     * Salva todos os dados da aplicação no servidor.
     */
    async function saveData() {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData),
            });
            if (!response.ok) throw new Error('Não foi possível salvar os dados.');
            return true;
        } catch (error) {
            // Erro ao salvar dados
            showFeedback('Erro ao salvar dados no servidor.', 'error');
            return false;
        }
    }

    /**
     * Atualiza toda a interface do usuário com base nos dados atuais.
     */
    function updateUI() {
        loadSettings();
        renderSummaries();
    }

    /**
     * Carrega as configurações do usuário nos campos do formulário e no header.
     */
    function loadSettings() {
        const { nome, localPadrao, valorDiaria } = appData.usuario;
        
        if (userNameInput) {
            userNameInput.value = nome || '';
        }
        if (locationNameInput) {
            locationNameInput.value = localPadrao || '';
        }
        if (dailyRateInput) {
            dailyRateInput.value = valorDiaria > 0 ? valorDiaria.toFixed(2) : '';
        }
        if (userNameDisplay) {
            userNameDisplay.textContent = nome || 'Usuário';
        }
    }

    /**
     * Renderiza os resumos para o mês atual e todos os meses históricos.
     */
    function renderSummaries() {
        const today = new Date();
        const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Limpar container
        currentMonthSummaryDiv.innerHTML = '';
        
        // Sempre exibir o mês atual como principal
        renderExpandedMonth(currentMonthDate, currentMonthSummaryDiv, 'Mês Atual');
        
        // Renderiza estatísticas gerais
        renderGeneralStatistics();
        
        // Renderiza todos os meses históricos
        renderHistoricalMonths();
    }

    /**
     * Renderiza as estatísticas gerais de todos os meses.
     */
    function renderGeneralStatistics() {
        const generalStatisticsDiv = document.getElementById('general-statistics');
        
        if (!appData || !appData.hospedagens) {
            generalStatisticsDiv.innerHTML = '<p class="text-gray-500">Nenhum dado disponível.</p>';
            return;
        }
        
        const hospedagens = appData.hospedagens;
        const valorDiaria = appData.usuario?.valorDiaria || 0;
        
        let totalMeses = 0;
        let totalMesesFechados = 0;
        let totalDias = 0;
        let totalValorPago = 0;
        
        // Calcular estatísticas de todos os meses
        Object.keys(hospedagens).forEach(monthKey => {
            const month = hospedagens[monthKey];
            totalMeses++;
            const dias = extractDaysFromHospedagem(month);
            totalDias += dias.length;
            
            if (month.fechado && month.valorPago) {
                totalValorPago += month.valorPago;
                totalMesesFechados++;
            }
        });
        
        const mediaMensal = totalMesesFechados > 0 ? totalValorPago / totalMesesFechados : 0;
        
        generalStatisticsDiv.innerHTML = `
            <h3 class="text-xl font-bold mb-4 text-gray-800">Estatísticas Gerais</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
                <div class="text-center p-2 md:p-4 bg-blue-50 rounded-lg stats-card">
                    <div class="text-lg md:text-2xl font-bold text-blue-600 leading-tight">${totalMeses}</div>
                    <div class="text-xs md:text-sm text-gray-600 leading-tight">Meses</div>
                </div>
                <div class="text-center p-2 md:p-4 bg-green-50 rounded-lg stats-card">
                    <div class="text-lg md:text-2xl font-bold text-green-600 leading-tight">${totalDias}</div>
                    <div class="text-xs md:text-sm text-gray-600 leading-tight">Total de Dias</div>
                </div>
                <div class="text-center p-2 md:p-4 bg-purple-50 rounded-lg stats-card">
                    <div class="text-sm md:text-xl font-bold text-purple-600 leading-tight">R$ ${totalValorPago.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div class="text-xs md:text-sm text-gray-600 leading-tight">Valor Total Pago</div>
                </div>
                <div class="text-center p-2 md:p-4 bg-orange-50 rounded-lg stats-card">
                    <div class="text-sm md:text-xl font-bold text-orange-600 leading-tight">R$ ${mediaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div class="text-xs md:text-sm text-gray-600 leading-tight">Média Mensal</div>
                </div>
            </div>
            
            <!-- Gráfico de Estatísticas Mensais -->
            <div class="mt-6">
                <h4 class="text-lg font-semibold mb-4 text-gray-700">Evolução Mensal</h4>
                <div class="rounded-lg">
                    <canvas id="monthly-stats-chart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
        
        // Renderizar o gráfico após o DOM ser atualizado
        setTimeout(() => {
            renderMonthlyStatsChart();
        }, 100);
    }

    /**
     * Renderiza o gráfico de estatísticas mensais com dois eixos.
     */
    function renderMonthlyStatsChart() {
        const canvas = document.getElementById('monthly-stats-chart');
        if (!canvas || !appData || !appData.hospedagens) {
            return;
        }
        
        // Destruir gráfico existente se houver
        if (window.monthlyChart) {
            window.monthlyChart.destroy();
        }
        
        const hospedagens = appData.hospedagens;
        const monthKeys = Object.keys(hospedagens).sort();
        
        // Preparar dados para o gráfico
        const labels = [];
        const diasData = [];
        const valorPagoData = [];
        const backgroundColors = [];
        const borderColors = [];
        
        // Obter data atual para identificar o mês atual
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        monthKeys.forEach(monthKey => {
            const month = hospedagens[monthKey];
            const isCurrentMonth = monthKey === currentMonthKey;
            
            // Mostrar meses fechados e o mês atual (se existir)
            if (!month.fechado && !isCurrentMonth) {
                return;
            }
            
            const [year, monthNum] = monthKey.split('-');
            const monthName = monthNames[parseInt(monthNum) - 1];
            const shortLabel = `${monthName.substring(0, 3)}/${year.substring(2)}`;
            
            labels.push(shortLabel);
            const dias = extractDaysFromHospedagem(month);
            
            if (isCurrentMonth) {
                // Para o mês atual, incluir dias estimados
                const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                const estimatedDays = calculateEstimatedFutureDays(monthDate);
                const totalEstimatedDays = dias.length + estimatedDays.length;
                const dailyRate = parseFloat(appData.usuario?.valorDiaria) || 0;
                const totalEstimatedValue = totalEstimatedDays * dailyRate;
                
                diasData.push(totalEstimatedDays);
                valorPagoData.push(totalEstimatedValue);
                // Cor verde claro para mês atual estimado
                backgroundColors.push('rgba(34, 197, 94, 0.6)');
                borderColors.push('rgba(34, 197, 94, 1)');
            } else {
                diasData.push(dias.length);
                valorPagoData.push(month.valorPago ? month.valorPago : 0);
                // Cor marrom para meses fechados
                backgroundColors.push('rgba(139, 69, 19, 0.6)');
                borderColors.push('rgba(139, 69, 19, 1)');
            }
        });
        
        // Calcular média mensal do valor pago
        const mediaValorPago = valorPagoData.length > 0 ? 
            valorPagoData.reduce((sum, val) => sum + val, 0) / valorPagoData.length : 0;
        const mediaData = new Array(labels.length).fill(mediaValorPago);
        
        const ctx = canvas.getContext('2d');
        
        window.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pago R$',
                        data: valorPagoData,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        yAxisID: 'y1',
                        type: 'bar'
                    },
                    {
                        label: 'Dias',
                        data: diasData,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y',
                        type: 'line'
                    },
                    {
                        label: 'Média R$',
                        data: mediaData,
                        borderColor: 'rgba(220, 38, 127, 1)',
                        backgroundColor: 'rgba(220, 38, 127, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0,
                        yAxisID: 'y1',
                        type: 'line',
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Dias'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Valor Pago (R$)'
                        },
                        grid: {
                            drawOnChartArea: true
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    /**
     * Renderiza todos os meses históricos na coluna da esquerda.
     * O primeiro mês do histórico sempre aparece expandido como calendário.
     */
    function renderHistoricalMonths() {
        const historicalMonthsDiv = document.getElementById('historical-months');
        const today = new Date();
        const currentMonthKey = getMonthKey(new Date(today.getFullYear(), today.getMonth(), 1));
        
        // Obter todos os meses dos dados, exceto o atual
        const allMonthKeys = Object.keys(appData.hospedagens)
            .filter(monthKey => monthKey !== currentMonthKey)
            .sort((a, b) => b.localeCompare(a)); // Ordenar do mais recente para o mais antigo
        
        if (allMonthKeys.length === 0) {
            historicalMonthsDiv.innerHTML = '<p class="text-sm text-gray-500 text-center">Nenhum mês histórico encontrado.</p>';
            return;
        }
        
        let historicalHtml = '';
        
        // O primeiro mês do histórico aparece expandido como calendário
        const firstMonthKey = allMonthKeys[0];
        if (firstMonthKey) {
            const [year, month] = firstMonthKey.split('-');
            const firstMonthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = monthNames[firstMonthDate.getMonth()];
            
            // Criar um container temporário para o calendário expandido
            const tempDiv = document.createElement('div');
            renderExpandedMonth(firstMonthDate, tempDiv, `${monthName} ${year}`);
            historicalHtml += `<div class="mb-6">${tempDiv.innerHTML}</div>`;
            
            // Adicionar o label "Histórico" após o primeiro mês
            historicalHtml += `<h3 class="text-lg font-semibold mb-4 text-gray-700">Histórico</h3>`;
        }
        
        // Função para criar HTML de um mês como item de histórico
        const createMonthHtml = (monthKey) => {
            const monthData = appData.hospedagens[monthKey] || { dias: [], fechado: false };
            const [year, month] = monthKey.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = monthNames[monthDate.getMonth()];
            const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
            const totalDays = extractDaysFromHospedagem(monthData).length;
            const totalCost = totalDays * dailyRate;
            const isClosed = monthData.fechado;
            
            const closedClass = isClosed ? 'closed' : '';
            const statusText = isClosed ? 'Fechado' : 'Aberto';
            const valueText = isClosed && monthData.valorPago ? 
                `Pago: ${formatCurrency(monthData.valorPago)}` : 
                `Estimado: ${formatCurrency(totalCost)}`;
            
            return `
                <div class="historical-month-item ${closedClass}" data-month-key="${monthKey}">
                    <div class="historical-month-title">${monthName} ${year}</div>
                    <div class="historical-month-stats">${totalDays} diárias • ${statusText}</div>
                    <div class="historical-month-value">${valueText}</div>
                </div>
            `;
        };
        
        // Adicionar outros meses históricos como itens (exceto o primeiro que já foi expandido)
        const otherMonthsHtml = allMonthKeys
            .slice(1) // Pular o primeiro mês que já foi expandido
            .map(monthKey => createMonthHtml(monthKey))
            .join('');
        
        historicalHtml += otherMonthsHtml;
        
        historicalMonthsDiv.innerHTML = historicalHtml;
    }

    /**
     * Renderiza o card de um mês específico, incluindo o calendário.
     */
    function renderMonth(date, element, defaultTitle) {
        const monthKey = getMonthKey(date);
        const monthData = appData.hospedagens[monthKey] || { dias: [], fechado: false };
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const isClosed = monthData.fechado;

        if (isClosed) {
            element.classList.add('month-closed');
        } else {
            element.classList.remove('month-closed');
        }

        const monthName = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const title = `${monthName} de ${year}`;
        const totalDays = extractDaysFromHospedagem(monthData).length;
        const totalCost = totalDays * dailyRate;

        const detailsHtml = totalDays > 0 ? createCalendar(date, extractDaysFromHospedagem(monthData), monthData) : '<p class="text-sm text-gray-500">Nenhuma diária registrada.</p>';
        const closeButtonHtml = createCloseMonthButton(monthKey, isClosed, monthData);

        element.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer accordion-toggle">
                <h3 class="text-lg font-semibold">${title} <span class="text-base font-normal text-gray-500">(${defaultTitle})</span></h3>
                <svg class="w-6 h-6 arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <div class="mt-2 text-gray-700 text-sm md:text-base">
                <p><strong>Diárias registradas:</strong> ${totalDays}</p>
                <p><strong>Custo estimado:</strong> ${formatCurrency(totalCost)}</p>
            </div>
            <div class="accordion-content mt-2 border-t pt-2">
                <h4 class="font-semibold text-md mb-1">Dias de Hospedagem:</h4>
                ${detailsHtml}
                ${closeButtonHtml}
            </div>
        `;
    }

    /**
     * Renderiza um mês específico com calendário expandido.
     * @param {Date} monthDate - Data do mês a ser renderizado.
     * @param {HTMLElement} container - Container onde o mês será renderizado.
     * @param {string} title - Título do mês.
     */
    function renderExpandedMonth(monthDate, container, title) {
        const monthKey = getMonthKey(monthDate);
        const monthData = appData.hospedagens[monthKey] || { dias: [], fechado: false };
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const totalDays = extractDaysFromHospedagem(monthData).length;
        const totalCost = totalDays * dailyRate;
        const isClosed = monthData.fechado;
        
        // Calcular dias futuros estimados apenas para o mês atual
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === monthDate.getFullYear() && today.getMonth() === monthDate.getMonth();
        const estimatedFutureDays = isCurrentMonth ? calculateEstimatedFutureDays(monthDate) : [];
        const estimatedDaysCount = estimatedFutureDays.length;
        const estimatedCost = estimatedDaysCount * dailyRate;
        const totalEstimatedDays = totalDays + estimatedDaysCount;
        const totalEstimatedCost = totalCost + estimatedCost;

        const monthName = monthNames[monthDate.getMonth()];
        const year = monthDate.getFullYear();

        let statusHtml = '';
        if (isClosed) {
            const paidAmount = monthData.valorPago || 0;
            statusHtml = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4">
                    <span class="text-sm md:text-base"><strong>Mês Fechado</strong> - Valor Pago: ${formatCurrency(paidAmount)}</span>
                </div>
            `;
        }

        const html = `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6 calendar-expanded">
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                ${statusHtml}
                <div class="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-lg md:text-xl font-bold text-blue-600">${isCurrentMonth ? totalEstimatedDays : totalDays}</div>
                        <div class="text-xs md:text-sm text-gray-600">${isCurrentMonth ? 'Estimadas (dia)' : 'Diárias'}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg md:text-xl font-bold text-green-600">${formatCurrency(isCurrentMonth ? totalEstimatedCost : totalCost)}</div>
                        <div class="text-xs md:text-sm text-gray-600">Total Estimado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-lg md:text-xl font-bold text-purple-600">${formatCurrency(dailyRate)}</div>
                        <div class="text-xs md:text-sm text-gray-600">Valor da Diária</div>
                    </div>
                </div>
                ${createCalendar(monthDate, extractDaysFromHospedagem(monthData), monthData)}
                <div class="mt-4 flex justify-end">
                    <button onclick="${isClosed ? `reopenMonth('${monthKey}')` : `closeMonth('${monthKey}')`}" class="${isClosed ? 'bg-yellow-500 hover:bg-yellow-700' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded">
                        ${isClosed ? 'Reabrir Mês' : 'Fechar Mês'}
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Gera o HTML para o botão de fechar o mês ou o status de mês fechado.
     */
    function createCloseMonthButton(monthKey, isClosed, monthData) {
        if (!isClosed) {
            return `<button data-month-key="${monthKey}" class="close-month-btn mt-4 bg-red-500 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-red-600 transition">Fechar Mês</button>`;
        }
        
        const valorPago = monthData.valorPago ?? 0;
        const valorCalculado = monthData.valorCalculado ?? 0;
        let paidText = `<p class="font-semibold">Valor Pago: ${formatCurrency(valorPago)}</p>`;
        if (Math.abs(valorPago - valorCalculado) > 0.01) {
            paidText += `<p class="text-xs text-gray-600">Valor Calculado: ${formatCurrency(valorCalculado)}</p>`;
        }

        return `
            <div class="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p class="font-bold text-green-800 mb-2 text-sm md:text-base">Mês Fechado</p>
                ${paidText}
            </div>
        `;
    }

    /**
     * Calcula os dias futuros estimados (segundas e terças) para o mês atual.
     * @param {Date} monthDate - Data do mês.
     * @returns {Array} Array com os dias futuros estimados.
     */
    function calculateEstimatedFutureDays(monthDate) {
        const today = new Date();
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        
        if (!isCurrentMonth) {
            return [];
        }
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const currentDay = today.getDate();
        const estimatedDays = [];
        
        // Verificar cada dia do mês a partir de hoje (incluindo hoje)
        for (let day = currentDay; day <= daysInMonth; day++) {
            const dayOfWeek = (firstDay + day - 1) % 7;
            // Segunda-feira = 1, Terça-feira = 2
            if (dayOfWeek === 1 || dayOfWeek === 2) {
                estimatedDays.push(day);
            }
        }
        
        return estimatedDays;
    }

    /**
     * Cria a estrutura HTML de um calendário para um mês específico.
     */
    function createCalendar(date, hostedDays, monthData = null) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Obter data atual para destacar o dia
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const currentDay = today.getDate();
        
        // Normalizar hostedDays para array de números
        const normalizedHostedDays = Array.isArray(hostedDays) ? hostedDays : Object.keys(hostedDays || {}).map(day => parseInt(day));
        
        // Obter dados completos dos dias (para informações adicionais)
        const daysData = monthData && !Array.isArray(monthData.dias) ? monthData.dias : {};
        
        // Calcular dias futuros estimados apenas para o mês atual
        const estimatedDays = calculateEstimatedFutureDays(date);

        let html = `<div class="calendar-grid" data-year="${year}" data-month="${month + 1}">`;
        weekDays.forEach(day => { html += `<div class="calendar-header">${day}</div>`; });
        for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
        for (let day = 1; day <= daysInMonth; day++) {
            let dayClass = 'calendar-day';
            
            // Calcular o dia da semana (0 = domingo, 6 = sábado)
            const dayOfWeek = (firstDay + day - 1) % 7;
            
            // Adicionar classe para final de semana
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayClass += ' weekend';
            }
            
            let dayAttributes = `data-day="${day}"`;
            
            if (normalizedHostedDays.includes(day)) {
                dayClass += ' has-stay';
                
                // Verificar se há informações adicionais para este dia
                const dayData = daysData[day];
                if (dayData && (dayData.timestamp || dayData.latitude || dayData.longitude)) {
                    dayClass += ' has-details';
                    dayAttributes += ` data-year="${year}" data-month="${month + 1}" data-has-details="true"`;
                    if (dayData.timestamp) dayAttributes += ` data-timestamp="${dayData.timestamp}"`;
                    if (dayData.latitude) dayAttributes += ` data-latitude="${dayData.latitude}"`;
                    if (dayData.longitude) dayAttributes += ` data-longitude="${dayData.longitude}"`;
                }
            } else if (estimatedDays.includes(day)) {
                dayClass += ' estimated-stay';
            }
            
            if (isCurrentMonth && day === currentDay) {
                dayClass += ' current-day';
            }
            html += `<div class="${dayClass}" ${dayAttributes}>${day}</div>`;
        }
        html += '</div>';
        
        // Event listeners para clique e duplo clique serão gerenciados globalmente
        // para permitir coexistência das duas funcionalidades
        
        return html;
    }

    /**
     * Manipula o clique para salvar as configurações.
     */
    async function handleSaveSettings() {
        appData.usuario.nome = userNameInput.value.trim();
        appData.usuario.localPadrao = locationNameInput.value.trim();
        appData.usuario.valorDiaria = parseFloat(dailyRateInput.value) || 0;

        const success = await saveData();
        if (success) {
            updateUI();
            toggleModal(false);
            showFeedback('Salvo!', 'success', savedFeedback, 2000);
        }
    }

    /**
     * Mostra ou esconde a animação de carregamento no botão
     */
    function toggleButtonLoading(buttonElement, isLoading) {
        if (isLoading) {
            buttonElement.disabled = true;
            buttonElement.style.opacity = '0.7';
            const originalContent = buttonElement.innerHTML;
            buttonElement.dataset.originalContent = originalContent;
            buttonElement.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                </div>
            `;
        } else {
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';
            if (buttonElement.dataset.originalContent) {
                buttonElement.innerHTML = buttonElement.dataset.originalContent;
            }
        }
    }

    /**
     * Manipula o clique para registrar uma nova diária.
     */
    async function handleLogStay() {
        const logButton = document.getElementById('log-stay-button');
        showFeedback('', 'clear'); // Limpa feedback anterior
        
        try {
            toggleButtonLoading(logButton, true);
            const response = await fetch(`${API_URL}/registrar-diaria`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro desconhecido.');

            showFeedback('Diária registrada com sucesso!', 'success');
            await loadData(); // Recarrega tudo para garantir consistência
        } catch (error) {
            // Erro ao registrar diária
            showFeedback(error.message, 'error');
        } finally {
            toggleButtonLoading(logButton, false);
        }
    }

    /**
     * Manipula o clique para fechar um mês.
     */
    function handleCloseMonth(monthKey) {
        const monthData = appData.hospedagens[monthKey];
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const calculatedCost = extractDaysFromHospedagem(monthData).length * dailyRate;

        // Preencher dados no modal
        closeMonthNameSpan.textContent = monthKey;
        calculatedValueSpan.textContent = formatCurrency(calculatedCost);
        paidAmountInput.value = calculatedCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.', ',');
        
        // Armazenar dados temporariamente para uso na confirmação
        closeMonthModal.dataset.monthKey = monthKey;
        closeMonthModal.dataset.calculatedCost = calculatedCost;
        
        // Mostrar modal
        closeMonthModal.classList.remove('hidden');
        
        // Dar foco e selecionar todo o texto para facilitar a edição
        setTimeout(() => {
            paidAmountInput.focus();
            paidAmountInput.select();
        }, 100);
    }

    async function confirmCloseMonth() {
        const monthKey = closeMonthModal.dataset.monthKey;
        const calculatedCost = parseFloat(closeMonthModal.dataset.calculatedCost);
        const paidAmountStr = paidAmountInput.value.trim();

        if (!paidAmountStr) {
            showFeedback('Por favor, informe o valor pago.', 'error');
            return;
        }

        const paidAmount = parseFloat(paidAmountStr.replace(',', '.'));

        if (isNaN(paidAmount) || paidAmount < 0) {
            showFeedback('Valor de pagamento inválido.', 'error');
            return;
        }

        const monthData = appData.hospedagens[monthKey];
        monthData.fechado = true;
        monthData.valorCalculado = calculatedCost;
        monthData.valorPago = paidAmount;

        const success = await saveData();
        if (success) {
            renderSummaries();
            closeCloseMonthModal();
            showFeedback('Mês fechado com sucesso!', 'success');
        }
    }

    function closeCloseMonthModal() {
        closeMonthModal.classList.add('hidden');
        paidAmountInput.value = '';
        delete closeMonthModal.dataset.monthKey;
        delete closeMonthModal.dataset.calculatedCost;
    }

    /**
     * Função global para fechar um mês (chamada pelo onclick).
     */
    window.closeMonth = function(monthKey) {
        handleCloseMonth(monthKey);
    };

    /**
     * Função global para reabrir um mês (chamada pelo onclick).
     */
    window.reopenMonth = async function(monthKey) {
        const monthData = appData.hospedagens[monthKey];
        if (monthData) {
            monthData.fechado = false;
            delete monthData.valorPago;
            delete monthData.valorCalculado;
            
            const success = await saveData();
            if (success) {
                renderSummaries();
                showFeedback('Mês reaberto com sucesso!', 'success');
            }
        }
    };

    /**
     * Manipula o duplo clique em um dia do calendário para registrar/remover uma diária.
     */
    async function handleDayDoubleClick(dayElement) {
        const calendarGrid = dayElement.closest('.calendar-grid');
        const year = calendarGrid.dataset.year;
        const month = calendarGrid.dataset.month.padStart(2, '0');
        const day = dayElement.dataset.day.padStart(2, '0');
        const fullDate = `${year}-${month}-${day}`;

        // Adicionar indicador visual de carregamento no dia clicado
        const originalContent = dayElement.innerHTML;
        dayElement.innerHTML = '<div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>';
        dayElement.style.pointerEvents = 'none';

        try {
            const response = await fetch(`${API_URL}/registrar-diaria-especifica`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: fullDate }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro ao registrar diária.');
            }

            showFeedback(result.message, 'success');
            await loadData(); // Recarrega os dados para atualizar a UI

        } catch (error) {
            console.error('Erro ao registrar diária específica:', error);
            showFeedback(error.message, 'error');
            // Restaurar conteúdo original em caso de erro
            dayElement.innerHTML = originalContent;
            dayElement.style.pointerEvents = 'auto';
        }
    }

    /**
     * Controla a visibilidade da modal de configurações.
     */
    function toggleModal(show) {
        if (show) {
            settingsModal.classList.remove('hidden');
        } else {
            settingsModal.classList.add('hidden');
        }
    }

    /**
     * Exibe uma mensagem de feedback para o usuário.
     */
    function showFeedback(message, type, element = logFeedback, duration = 3000) {
        element.textContent = message;
        
        // Configurar cores baseadas no tipo
        if (type === 'success') {
            element.className = 'fixed top-24 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        } else if (type === 'error') {
            element.className = 'fixed top-24 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        } else {
            element.className = 'fixed top-24 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        }

        if (message) {
            // Mostrar o feedback com animação
            element.classList.remove('opacity-0', 'translate-y-2');
            element.classList.add('opacity-100', 'translate-y-0');
            
            // Esconder após o tempo especificado
            setTimeout(() => {
                element.classList.remove('opacity-100', 'translate-y-0');
                element.classList.add('opacity-0', 'translate-y-2');
            }, duration);
        }
    }

    /**
     * Funções auxiliares de formatação e data.
     */
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // --- Event Listeners ---

    // Ações principais
    logStayButton.addEventListener('click', handleLogStay);
    saveSettingsButton.addEventListener('click', handleSaveSettings);

    // Controle da Modal de Configurações
    openSettingsModalButton.addEventListener('click', () => toggleModal(true));
    closeSettingsModalButton.addEventListener('click', () => toggleModal(false));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) toggleModal(false); // Fecha se clicar no fundo
    });

    // Controle da Modal de Fechamento de Mês
    closeMonthModalBtn.addEventListener('click', closeCloseMonthModal);
    cancelCloseMonthBtn.addEventListener('click', closeCloseMonthModal);
    confirmCloseMonthBtn.addEventListener('click', confirmCloseMonth);
    closeMonthModal.addEventListener('click', (e) => {
        if (e.target === closeMonthModal) closeCloseMonthModal(); // Fecha se clicar no fundo
    });

    // Controle da Modal de Detalhes do Dia
    closeDayDetailsBtn.addEventListener('click', closeDayDetailsModal);
    dayDetailsModal.addEventListener('click', (e) => {
        if (e.target === dayDetailsModal) closeDayDetailsModal(); // Fecha se clicar no fundo
    });

    // Permitir confirmar com Enter no campo de valor pago
    paidAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmCloseMonth();
        }
    });

    // Variáveis para controle de toque em mobile e clique/duplo clique
    let lastTouchTime = 0;
    let lastTouchedElement = null;
    let clickTimeout = null;
    const DOUBLE_TAP_DELAY = 300; // 300ms para detectar duplo toque
    const CLICK_DELAY = 250; // 250ms para distinguir clique simples de duplo clique

    // Delegação de eventos para acordeão e botão de fechar mês
    document.addEventListener('click', (event) => {
        const accordionToggle = event.target.closest('.accordion-toggle');
        const closeButton = event.target.closest('.close-month-btn');

        if (accordionToggle) {
            const content = accordionToggle.closest('.bg-white').querySelector('.accordion-content');
            content.classList.toggle('open');
            accordionToggle.classList.toggle('open');
        }

        if (closeButton) {
            const monthKey = closeButton.dataset.monthKey;
            handleCloseMonth(monthKey);
        }

        const calendarDay = event.target.closest('.calendar-day:not(.empty)');
        if (calendarDay && !isMobileDevice()) {
            // Limpar timeout anterior se existir
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }

            if (event.detail === 1) {
                // Primeiro clique - aguardar para ver se haverá um segundo
                clickTimeout = setTimeout(() => {
                    // Clique simples confirmado - abrir detalhes se o dia tiver detalhes
                    if (calendarDay.classList.contains('has-details')) {
                        const year = parseInt(calendarDay.dataset.year);
                        const month = parseInt(calendarDay.dataset.month);
                        const day = parseInt(calendarDay.textContent);
                        
                        const dayData = {
                            timestamp: calendarDay.dataset.timestamp,
                            latitude: calendarDay.dataset.latitude,
                            longitude: calendarDay.dataset.longitude
                        };
                        
                        openDayDetailsModal(day, month, year, dayData);
                    }
                    clickTimeout = null;
                }, CLICK_DELAY);
            } else if (event.detail === 2) {
                // Duplo clique - registrar/remover diária
                event.preventDefault();
                handleDayDoubleClick(calendarDay);
            }
        }
    });

    // Event listener para touch events em dispositivos móveis
    document.addEventListener('touchstart', (event) => {
        const calendarDay = event.target.closest('.calendar-day:not(.empty)');
        if (calendarDay && isMobileDevice()) {
            // Adiciona feedback visual
            calendarDay.classList.add('touched');
        }
    });

    document.addEventListener('touchend', (event) => {
        const calendarDay = event.target.closest('.calendar-day:not(.empty)');
        if (calendarDay && isMobileDevice()) {
            event.preventDefault(); // Previne zoom
            
            // Remove feedback visual
            setTimeout(() => {
                calendarDay.classList.remove('touched');
            }, 150);
            
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastTouchTime;
            
            if (timeDiff < DOUBLE_TAP_DELAY && lastTouchedElement === calendarDay) {
                // Duplo toque detectado - registrar/remover diária
                handleDayDoubleClick(calendarDay);
                lastTouchTime = 0; // Reset para evitar triplo toque
                lastTouchedElement = null;
            } else {
                // Primeiro toque - verificar se deve abrir detalhes
                if (calendarDay.classList.contains('has-details')) {
                    // Aguardar um pouco para ver se haverá um segundo toque
                    setTimeout(() => {
                        // Se ainda é o mesmo elemento e não houve segundo toque
                        if (lastTouchedElement === calendarDay && 
                            (new Date().getTime() - lastTouchTime) >= DOUBLE_TAP_DELAY) {
                            
                            const year = parseInt(calendarDay.dataset.year);
                            const month = parseInt(calendarDay.dataset.month);
                            const day = parseInt(calendarDay.textContent);
                            
                            const dayData = {
                                timestamp: calendarDay.dataset.timestamp,
                                latitude: calendarDay.dataset.latitude,
                                longitude: calendarDay.dataset.longitude
                            };
                            
                            openDayDetailsModal(day, month, year, dayData);
                            
                            // Reset para evitar ações duplicadas
                            lastTouchTime = 0;
                            lastTouchedElement = null;
                        }
                    }, DOUBLE_TAP_DELAY + 50);
                }
                
                lastTouchTime = currentTime;
                lastTouchedElement = calendarDay;
            }
        }
    });

    // Remove feedback visual se o toque for cancelado
    document.addEventListener('touchcancel', (event) => {
        const calendarDay = event.target.closest('.calendar-day:not(.empty)');
        if (calendarDay && isMobileDevice()) {
            calendarDay.classList.remove('touched');
        }
    });

    /**
     * Detecta se o dispositivo é móvel
     */
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }

    // Event listener para clique nos meses históricos
    document.addEventListener('click', function(event) {
        const historicalItem = event.target.closest('.historical-month-item');
        if (historicalItem) {
            const monthKey = historicalItem.getAttribute('data-month-key');
            expandHistoricalMonth(monthKey);
        }
    });

    /**
     * Expande um mês histórico para visualização completa.
     * @param {string} monthKey - Chave do mês no formato 'YYYY-MM'.
     */
    function expandHistoricalMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = monthNames[monthDate.getMonth()];
        
        // Criar uma modal ou substituir o conteúdo da área principal
        const modalHtml = `
            <div id="historical-month-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-2xl font-bold">${monthName} ${year}</h2>
                            <button onclick="closeHistoricalModal()" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <div id="historical-month-content"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Renderizar o mês na modal
        const contentDiv = document.getElementById('historical-month-content');
        renderHistoricalMonthModal(monthDate, contentDiv);
    }

    /**
     * Renderiza um mês histórico na modal sem botões de ação.
     * @param {Date} monthDate - Data do mês a ser renderizado.
     * @param {HTMLElement} container - Container onde o mês será renderizado.
     */
    function renderHistoricalMonthModal(monthDate, container) {
        const monthKey = getMonthKey(monthDate);
        const monthData = appData.hospedagens[monthKey] || { dias: [], fechado: false };
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const totalDays = extractDaysFromHospedagem(monthData).length;
        const totalCost = totalDays * dailyRate;
        const isClosed = monthData.fechado;

        const monthName = monthNames[monthDate.getMonth()];
        const year = monthDate.getFullYear();

        let statusHtml = '';
        if (isClosed) {
            const paidAmount = monthData.valorPago || 0;
            statusHtml = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4">
                    <span class="text-sm md:text-base"><strong>Mês Fechado</strong> - Valor Pago: ${formatCurrency(paidAmount)}</span>
                </div>
            `;
        }

        const html = `
            <div class="bg-white">
                ${statusHtml}
                <div class="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                    <div class="text-center">
                        <div class="text-xl md:text-2xl font-bold text-blue-600">${totalDays}</div>
                        <div class="text-xs md:text-sm text-gray-600">Diárias</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xl md:text-2xl font-bold text-green-600">${formatCurrency(totalCost)}</div>
                        <div class="text-xs md:text-sm text-gray-600">Total Estimado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xl md:text-2xl font-bold text-purple-600">${formatCurrency(dailyRate)}</div>
                        <div class="text-xs md:text-sm text-gray-600">Valor da Diária</div>
                    </div>
                </div>
                ${createCalendar(monthDate, extractDaysFromHospedagem(monthData), monthData)}
                
                <!-- Lista de dias com hospedagem -->
                ${extractDaysFromHospedagem(monthData).length > 0 ? `
                    <div class="mt-6">
                        <h4 class="text-lg font-semibold mb-3 text-gray-700">Dias com Hospedagem:</h4>
                        <div class="grid grid-cols-7 gap-2">
                            ${extractDaysFromHospedagem(monthData).sort((a, b) => parseInt(a) - parseInt(b)).map(day => `
                                <div class="bg-green-100 text-green-800 text-center py-2 px-3 rounded font-medium">
                                    ${day}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '<div class="mt-6 text-center text-gray-500">Nenhuma diária registrada neste mês.</div>'}
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Fecha a modal do mês histórico.
     */
    function closeHistoricalModal() {
        const modal = document.getElementById('historical-month-modal');
        if (modal) {
            modal.remove();
        }
    }

    // --- Funções do Editor de Banco de Dados ---

    /**
     * Abre o modal do editor de banco de dados.
     */
    function openDatabaseEditor() {
        databaseEditorModal.classList.remove('hidden');
        loadTableData();
    }

    /**
     * Fecha o modal do editor de banco de dados.
     */
    function closeDatabaseEditor() {
        databaseEditorModal.classList.add('hidden');
        currentTableData = [];
    }

    /**
     * Carrega os dados da tabela selecionada.
     */
    async function loadTableData() {
        try {
            const response = await fetch(`/api/database/tables/${currentTable}`);
            if (response.ok) {
                currentTableData = await response.json();
                renderDataGrid();
            } else {
                console.error('Erro ao carregar dados da tabela');
                showFeedback('Erro ao carregar dados da tabela', 'error');
            }
        } catch (error) {
            // Erro de conexão
            showFeedback('Erro de conexão', 'error');
        }
    }

    /**
     * Renderiza a grade de dados.
     */
    function renderDataGrid() {
        if (currentTableData.length === 0) {
            dataGrid.innerHTML = '<div class="p-4 text-center text-gray-500">Nenhum registro encontrado</div>';
            return;
        }

        const columns = Object.keys(currentTableData[0]);
        
        let html = `
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Ações</th>
                        ${columns.map(col => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        currentTableData.forEach((record, index) => {
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="editRecord(${index})" class="text-blue-600 hover:text-blue-900 mr-2 p-1 rounded hover:bg-blue-50" title="Editar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteRecord(${index})" class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </td>
                    ${columns.map(col => {
                        let value = record[col];
                        if (col.includes('data') && value) {
                            value = new Date(value).toLocaleDateString('pt-BR');
                        }
                        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value || ''}</td>`;
                    }).join('')}
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        dataGrid.innerHTML = html;
    }

    /**
     * Abre o modal de edição de registro.
     */
    function openRecordEditor(title, record = null, index = -1) {
        recordEditorTitle.textContent = title;
        editingRecord = record;
        editingIndex = index;
        
        generateRecordForm(record);
        recordEditorModal.classList.remove('hidden');
    }

    /**
     * Fecha o modal de edição de registro.
     */
    function closeRecordEditor() {
        recordEditorModal.classList.add('hidden');
        editingRecord = null;
        editingIndex = -1;
        recordForm.innerHTML = '';
    }

    /**
     * Inicializa o editor visual de dias.
     */
    function initDaysVisualEditor(diasJson) {
        const visualEditor = document.getElementById('days-visual-editor');
        const addDayBtn = document.getElementById('add-day-btn');
        const toggleJsonBtn = document.getElementById('toggle-json-view');
        const jsonTextarea = document.getElementById('dias-json-textarea');
        
        let diasData = {};
        let isJsonViewVisible = false;
        
        // Parse do JSON inicial
        try {
            diasData = diasJson ? JSON.parse(diasJson) : {};
        } catch (e) {
            diasData = {};
        }
        
        function renderDaysEditor() {
            const days = Object.keys(diasData).sort((a, b) => parseInt(a) - parseInt(b));
            
            visualEditor.innerHTML = days.length === 0 ? 
                '<div class="text-gray-500 text-sm text-center py-4">Nenhum dia adicionado</div>' :
                days.map(day => {
                    const dayData = diasData[day];
                    return `
                        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded border" data-day="${day}">
                            <div class="flex-1 grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <label class="block text-gray-600 mb-1">Dia:</label>
                                    <input type="number" min="1" max="31" value="${day}" class="day-input w-full px-1 py-1 border rounded text-center" onchange="updateDayNumber(this, '${day}')">
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Data/Hora:</label>
                                    <input type="datetime-local" value="${dayData.timestamp ? new Date(dayData.timestamp).toISOString().slice(0, 16) : ''}" class="timestamp-input w-full px-1 py-1 border rounded text-xs" onchange="updateDayData('${day}', 'timestamp', this.value)">
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Latitude:</label>
                                    <input type="number" step="any" value="${dayData.latitude || ''}" placeholder="null" class="latitude-input w-full px-1 py-1 border rounded text-xs" onchange="updateDayData('${day}', 'latitude', this.value)">
                                </div>
                                <div>
                                    <label class="block text-gray-600 mb-1">Longitude:</label>
                                    <input type="number" step="any" value="${dayData.longitude || ''}" placeholder="null" class="longitude-input w-full px-1 py-1 border rounded text-xs" onchange="updateDayData('${day}', 'longitude', this.value)">
                                </div>
                            </div>
                            <button type="button" onclick="removeDay('${day}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">×</button>
                        </div>
                    `;
                }).join('');
        }
        
        function updateJsonTextarea() {
            jsonTextarea.value = JSON.stringify(diasData, null, 2);
        }
        
        window.updateDayNumber = function(input, oldDay) {
            const newDay = input.value;
            if (newDay !== oldDay && newDay >= 1 && newDay <= 31 && !diasData[newDay]) {
                diasData[newDay] = diasData[oldDay];
                delete diasData[oldDay];
                renderDaysEditor();
                updateJsonTextarea();
            } else {
                input.value = oldDay; // Reverter se inválido
            }
        };
        
        window.updateDayData = function(day, field, value) {
            if (!diasData[day]) diasData[day] = {};
            
            if (field === 'timestamp') {
                diasData[day][field] = value ? new Date(value).toISOString() : null;
            } else if (field === 'latitude' || field === 'longitude') {
                diasData[day][field] = value === '' ? null : parseFloat(value);
            }
            
            updateJsonTextarea();
        };
        
        window.removeDay = function(day) {
            delete diasData[day];
            renderDaysEditor();
            updateJsonTextarea();
        };
        
        addDayBtn.addEventListener('click', () => {
            const availableDays = [];
            for (let i = 1; i <= 31; i++) {
                if (!diasData[i]) availableDays.push(i);
            }
            
            if (availableDays.length === 0) {
                alert('Todos os dias do mês já foram adicionados.');
                return;
            }
            
            const newDay = availableDays[0];
            diasData[newDay] = {
                timestamp: new Date().toISOString(),
                latitude: null,
                longitude: null
            };
            
            renderDaysEditor();
            updateJsonTextarea();
        });
        
        toggleJsonBtn.addEventListener('click', () => {
            isJsonViewVisible = !isJsonViewVisible;
            
            if (isJsonViewVisible) {
                visualEditor.classList.add('hidden');
                jsonTextarea.classList.remove('hidden');
                toggleJsonBtn.textContent = 'Ver Visual';
                addDayBtn.style.display = 'none';
            } else {
                // Sincronizar dados do JSON para o editor visual
                try {
                    diasData = JSON.parse(jsonTextarea.value || '{}');
                    renderDaysEditor();
                } catch (e) {
                    alert('JSON inválido. Mantendo dados anteriores.');
                }
                
                visualEditor.classList.remove('hidden');
                jsonTextarea.classList.add('hidden');
                toggleJsonBtn.textContent = 'Ver JSON';
                addDayBtn.style.display = 'block';
            }
        });
        
        // Inicializar
        renderDaysEditor();
        updateJsonTextarea();
    }
    
    /**
     * Gera o formulário de edição baseado na tabela atual.
     */
    function generateRecordForm(record) {
        let html = '';
        
        if (currentTable === 'usuario') {
            html = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input type="text" name="nome" value="${record?.nome || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Local Padrão</label>
                    <input type="text" name="localPadrao" value="${record?.localPadrao || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor da Diária</label>
                    <input type="number" step="0.01" name="valorDiaria" value="${record?.valorDiaria || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
            `;
        } else if (currentTable === 'hospedagem') {
            html = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mês/Ano</label>
                    <input type="text" name="mesAno" value="${record?.mesAno || ''}" placeholder="Ex: 2025-08" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Dias</label>
                    <div class="border border-gray-300 rounded-md p-3">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-sm font-medium text-gray-600">Editor Visual de Dias</span>
                            <div class="flex gap-2">
                                <button type="button" id="add-day-btn" class="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded">+ Adicionar Dia</button>
                                <button type="button" id="toggle-json-view" class="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded">Ver JSON</button>
                            </div>
                        </div>
                        <div id="days-visual-editor" class="space-y-2 max-h-48 overflow-y-auto">
                            <!-- Dias serão inseridos aqui dinamicamente -->
                        </div>
                        <textarea name="dias" id="dias-json-textarea" rows="6" placeholder="Ex: {\"1\": {\"timestamp\": \"2025-01-01T00:00:00.000Z\", \"latitude\": null, \"longitude\": null}}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm mt-3 hidden">${record?.dias || ''}</textarea>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fechado</label>
                    <select name="fechado" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="0" ${record?.fechado == 0 ? 'selected' : ''}>Não</option>
                        <option value="1" ${record?.fechado == 1 ? 'selected' : ''}>Sim</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor Calculado</label>
                    <input type="number" step="0.01" name="valorCalculado" value="${record?.valorCalculado || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor Pago</label>
                    <input type="number" step="0.01" name="valorPago" value="${record?.valorPago || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>
            `;
        }
        
        recordForm.innerHTML = html;
        
        // Inicializar editor visual de dias se for tabela hospedagem
        if (currentTable === 'hospedagem') {
            // Aguardar o DOM ser atualizado
            setTimeout(() => {
                initDaysVisualEditor(record?.dias || '');
            }, 0);
        }
    }

    /**
     * Salva o registro editado ou novo.
     */
    async function saveRecord() {
        const formData = new FormData(recordForm);
        const recordData = {};
        
        for (let [key, value] of formData.entries()) {
            recordData[key] = value;
        }
        
        // Conversão de tipos para tabela hospedagem
        if (currentTable === 'hospedagem') {
            if (recordData.fechado) recordData.fechado = parseInt(recordData.fechado);
            if (recordData.valorCalculado) recordData.valorCalculado = parseFloat(recordData.valorCalculado);
            if (recordData.valorPago) recordData.valorPago = parseFloat(recordData.valorPago);
        }
        
        // Validação básica
        if (currentTable === 'usuario' && !recordData.nome) {
            showFeedback('Nome é obrigatório', 'error');
            return;
        }
        
        if (currentTable === 'hospedagem' && !recordData.mesAno) {
            showFeedback('Mês/Ano é obrigatório', 'error');
            return;
        }
        
        try {
            let response;
            
            if (editingIndex >= 0) {
                // Atualizar registro existente
                const recordId = currentTableData[editingIndex].id;
                response = await fetch(`/api/database/tables/${currentTable}/${recordId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recordData)
                });
            } else {
                // Criar novo registro
                response = await fetch(`/api/database/tables/${currentTable}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(recordData)
                });
            }
            
            if (response.ok) {
                showFeedback('Registro salvo com sucesso!', 'success');
                closeRecordEditor();
                loadTableData();
            } else {
                showFeedback('Erro ao salvar registro', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showFeedback('Erro de conexão', 'error');
        }
    }

    /**
     * Edita um registro.
     */
    window.editRecord = function(index) {
        const record = currentTableData[index];
        openRecordEditor('Editar Registro', record, index);
    };

    /**
     * Exclui um registro.
     */
    window.deleteRecord = async function(index) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) {
            return;
        }
        
        try {
            const recordId = currentTableData[index].id;
            const response = await fetch(`/api/database/tables/${currentTable}/${recordId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showFeedback('Registro excluído com sucesso!', 'success');
                loadTableData();
            } else {
                showFeedback('Erro ao excluir registro', 'error');
            }
        } catch (error) {
            // Erro de conexão
            showFeedback('Erro de conexão', 'error');
        }
    };

    // Tornar a função global para uso no onclick
    window.closeHistoricalModal = closeHistoricalModal;

    // --- Event Listeners do Editor de Banco ---
    
    // Abrir editor de banco
    openDatabaseEditorBtn.addEventListener('click', openDatabaseEditor);
    
    // Fechar editor de banco
    closeDatabaseEditorBtn.addEventListener('click', closeDatabaseEditor);
    
    // Mudança de tabela
    tableSelector.addEventListener('change', (e) => {
        currentTable = e.target.value;
        loadTableData();
    });
    
    // Adicionar novo registro
    addRecordBtn.addEventListener('click', () => {
        openRecordEditor('Adicionar Registro');
    });
    
    // Atualizar dados
    refreshDataBtn.addEventListener('click', loadTableData);
    
    // Fechar editor de registro
    closeRecordEditorBtn.addEventListener('click', closeRecordEditor);
    cancelRecordEditBtn.addEventListener('click', closeRecordEditor);
    
    // Salvar registro
    saveRecordBtn.addEventListener('click', saveRecord);
    
    // Fechar modais ao clicar fora
    databaseEditorModal.addEventListener('click', (e) => {
        if (e.target === databaseEditorModal) {
            closeDatabaseEditor();
        }
    });
    
    recordEditorModal.addEventListener('click', (e) => {
        if (e.target === recordEditorModal) {
            closeRecordEditor();
        }
    });

    // --- Funções do Modal de Detalhes do Dia ---

    /**
     * Abre o modal de detalhes do dia com informações adicionais.
     */
    function openDayDetailsModal(day, month, year, dayData) {
        const date = new Date(year, month - 1, day);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        dayDetailsTitle.textContent = formattedDate;
        
        let content = '<div class="space-y-4">';
        
        // Informações de timestamp
        if (dayData.timestamp) {
            const createdDate = new Date(dayData.timestamp);
            const formattedTimestamp = createdDate.toLocaleString('pt-BR');
            content += `
                <div class="rounded-lg">
                    <h4 class="font-semibold text-gray-700 mb-1">📅 Data de Criação</h4>
                    <p class="text-gray-600 text-sm">${formattedTimestamp}</p>
                </div>
            `;
        }
        
        // Informações de localização
        if (dayData.latitude && dayData.longitude) {
            content += `
                <div class="rounded-lg">
                    <h4 class="font-semibold text-gray-700 mb-2">📍 Localização</h4>
                    <p class="text-gray-600 text-sm mb-3">Lat: ${dayData.latitude}, Lng: ${dayData.longitude}</p>
                    <div id="day-details-map" class="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span class="text-gray-500">Carregando mapa...</span>
                    </div>
                </div>
            `;
        }
        
        content += '</div>';
        dayDetailsContent.innerHTML = content;
        
        // Carregar mapa se houver coordenadas
        if (dayData.latitude && dayData.longitude) {
            loadMapForDayDetails(dayData.latitude, dayData.longitude);
        }
        
        dayDetailsModal.classList.remove('hidden');
    }

    /**
     * Fecha o modal de detalhes do dia.
     */
    function closeDayDetailsModal() {
        dayDetailsModal.classList.add('hidden');
        dayDetailsContent.innerHTML = '';
    }

    /**
     * Carrega um mapa simples para mostrar a localização.
     */
    function loadMapForDayDetails(latitude, longitude) {
        const mapContainer = document.getElementById('day-details-map');
        if (!mapContainer) return;
        
        // Converter para números e calcular bbox explicitamente
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        // Validar coordenadas
        if (isNaN(lat) || isNaN(lng)) {
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    <span>Coordenadas inválidas</span>
                </div>
            `;
            return;
        }
        
        const offset = 0.01;
        const west = lng - offset;
        const south = lat - offset;
        const east = lng + offset;
        const north = lat + offset;
        
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${lat},${lng}`;
        
        mapContainer.innerHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                style="border: none; border-radius: 0.5rem; display: block;" 
                src="${mapUrl}" 
                loading="lazy"
                allowfullscreen
                title="Mapa da localização"
                onload="this.style.opacity='1'"
                onerror="this.parentElement.innerHTML='<div class=\"flex items-center justify-center h-full text-gray-500\"><span>Erro ao carregar mapa</span></div>'">
            </iframe>
        `;
        
        // Adicionar timeout para detectar se o iframe não carregou
        setTimeout(() => {
            const iframe = mapContainer.querySelector('iframe');
            if (iframe && iframe.style.opacity !== '1') {
                mapContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                        <span>📍</span>
                        <span class="text-sm">Lat: ${lat}, Lng: ${lng}</span>
                        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="text-blue-500 hover:text-blue-700 text-sm underline">
                            Abrir no Google Maps
                        </a>
                    </div>
                `;
            }
        }, 5000);
    }

    // Tornar a função global para uso nos event listeners
    window.openDayDetailsModal = openDayDetailsModal;

    // === PULL-TO-REFRESH FUNCTIONALITY ===
    
    let pullToRefreshState = {
        startY: 0,
        currentY: 0,
        isRefreshing: false,
        threshold: 80,
        maxPull: 120
    };
    
    // Criar elemento do indicador de pull-to-refresh
    function createPullToRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'pull-to-refresh-indicator';
        indicator.innerHTML = `
            <div class="pull-refresh-content">
                <div class="pull-refresh-spinner"></div>
                <span class="pull-refresh-text">Puxe para atualizar</span>
            </div>
        `;
        document.body.insertBefore(indicator, document.body.firstChild);
        return indicator;
    }
    
    // Inicializar indicador
    const pullIndicator = createPullToRefreshIndicator();
    
    // Detectar início do toque
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0 && !pullToRefreshState.isRefreshing) {
            pullToRefreshState.startY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    // Detectar movimento do toque
    document.addEventListener('touchmove', (e) => {
        if (pullToRefreshState.startY === 0 || pullToRefreshState.isRefreshing) return;
        
        pullToRefreshState.currentY = e.touches[0].clientY;
        const pullDistance = pullToRefreshState.currentY - pullToRefreshState.startY;
        
        if (pullDistance > 0 && window.scrollY === 0) {
            e.preventDefault();
            
            const normalizedDistance = Math.min(pullDistance, pullToRefreshState.maxPull);
            const progress = normalizedDistance / pullToRefreshState.threshold;
            
            // Atualizar posição do indicador
            pullIndicator.style.transform = `translateY(${normalizedDistance - 60}px)`;
            pullIndicator.style.opacity = Math.min(progress, 1);
            
            // Atualizar texto baseado no progresso
            const textElement = pullIndicator.querySelector('.pull-refresh-text');
            if (normalizedDistance >= pullToRefreshState.threshold) {
                textElement.textContent = 'Solte para atualizar';
                pullIndicator.classList.add('ready-to-refresh');
            } else {
                textElement.textContent = 'Puxe para atualizar';
                pullIndicator.classList.remove('ready-to-refresh');
            }
        }
    }, { passive: false });
    
    // Detectar fim do toque
    document.addEventListener('touchend', (e) => {
        if (pullToRefreshState.startY === 0 || pullToRefreshState.isRefreshing) return;
        
        const pullDistance = pullToRefreshState.currentY - pullToRefreshState.startY;
        
        if (pullDistance >= pullToRefreshState.threshold && window.scrollY === 0) {
            // Ativar refresh
            pullToRefreshState.isRefreshing = true;
            pullIndicator.classList.add('refreshing');
            pullIndicator.style.transform = 'translateY(20px)';
            
            const textElement = pullIndicator.querySelector('.pull-refresh-text');
            textElement.textContent = 'Atualizando...';
            
            // Simular carregamento e recarregar dados
            setTimeout(() => {
                loadData(); // Recarregar dados da aplicação
                
                // Resetar estado após carregamento
                setTimeout(() => {
                    pullToRefreshState.isRefreshing = false;
                    pullIndicator.style.transform = 'translateY(-60px)';
                    pullIndicator.style.opacity = '0';
                    pullIndicator.classList.remove('refreshing', 'ready-to-refresh');
                    
                    const textElement = pullIndicator.querySelector('.pull-refresh-text');
                    textElement.textContent = 'Puxe para atualizar';
                }, 300);
            }, 1000);
        } else {
            // Resetar posição
            pullIndicator.style.transform = 'translateY(-60px)';
            pullIndicator.style.opacity = '0';
            pullIndicator.classList.remove('ready-to-refresh');
        }
        
        // Resetar estado
        pullToRefreshState.startY = 0;
        pullToRefreshState.currentY = 0;
    }, { passive: true });

    // --- Inicialização ---
    initThemeSystem();
    loadData();
});