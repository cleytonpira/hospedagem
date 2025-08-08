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
    const userNameInput = document.getElementById('user-name');
    const locationNameInput = document.getElementById('location-name');
    const dailyRateInput = document.getElementById('daily-rate');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const savedFeedback = document.getElementById('saved-feedback');
    const logStayButton = document.getElementById('log-stay-button');
    const logFeedback = document.getElementById('log-feedback');
    const welcomeMessage = document.getElementById('welcome-message');
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

    // --- Constantes e Estado da Aplicação ---
    const API_URL = '/api/hospedagem';
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let appData = getInitialData();
    
    // Estado do Editor de Banco
    let currentTable = 'usuario';
    let currentTableData = [];
    let editingRecord = null;
    let editingIndex = -1;

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
    async function loadData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Não foi possível carregar os dados.');
            appData = await response.json();
            updateUI();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showFeedback('Erro ao carregar dados do servidor.', 'error');
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
            console.error('Erro ao salvar dados:', error);
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
     * Carrega as configurações do usuário nos campos do formulário e na mensagem de boas-vindas.
     */
    function loadSettings() {
        const { nome, localPadrao, valorDiaria } = appData.usuario;
        userNameInput.value = nome;
        locationNameInput.value = localPadrao;
        dailyRateInput.value = valorDiaria > 0 ? valorDiaria.toFixed(2) : '';
        welcomeMessage.textContent = nome ? `Bem-vindo(a), ${nome}!` : 'Bem-vindo(a)!';
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
        let totalDias = 0;
        let totalValorPago = 0;
        
        // Calcular estatísticas de todos os meses
        Object.keys(hospedagens).forEach(monthKey => {
            const month = hospedagens[monthKey];
            totalMeses++;
            totalDias += month.dias ? month.dias.length : 0;
            
            if (month.fechado && month.valorPago) {
                totalValorPago += month.valorPago;
            }
        });
        
        const mediaMensal = totalMeses > 0 ? totalValorPago / totalMeses : 0;
        
        generalStatisticsDiv.innerHTML = `
            <h3 class="text-xl font-bold mb-4 text-gray-800">Estatísticas Gerais</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${totalMeses}</div>
                    <div class="text-sm text-gray-600">Meses Hospedados</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${totalDias}</div>
                    <div class="text-sm text-gray-600">Total de Dias</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">R$ ${totalValorPago.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div class="text-sm text-gray-600">Valor Total Pago</div>
                </div>
                <div class="text-center p-4 bg-orange-50 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">R$ ${mediaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div class="text-sm text-gray-600">Média Mensal</div>
                </div>
            </div>
        `;
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
            const totalDays = monthData.dias.length;
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
        const totalDays = monthData.dias.length;
        const totalCost = totalDays * dailyRate;

        const detailsHtml = totalDays > 0 ? createCalendar(date, monthData.dias) : '<p class="text-sm text-gray-500">Nenhuma diária registrada.</p>';
        const closeButtonHtml = createCloseMonthButton(monthKey, isClosed, monthData);

        element.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer accordion-toggle">
                <h3 class="text-lg font-semibold">${title} <span class="text-base font-normal text-gray-500">(${defaultTitle})</span></h3>
                <svg class="w-6 h-6 arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <div class="mt-2 text-gray-700">
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
        const totalDays = monthData.dias.length;
        const totalCost = totalDays * dailyRate;
        const isClosed = monthData.fechado;

        const monthName = monthNames[monthDate.getMonth()];
        const year = monthDate.getFullYear();

        let statusHtml = '';
        if (isClosed) {
            const paidAmount = monthData.valorPago || 0;
            statusHtml = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4">
                    <strong>Mês Fechado</strong> - Valor Pago: ${formatCurrency(paidAmount)}
                </div>
            `;
        }

        const html = `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6 calendar-expanded">
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                ${statusHtml}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">${totalDays}</div>
                        <div class="text-sm text-gray-600">Diárias</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${formatCurrency(totalCost)}</div>
                        <div class="text-sm text-gray-600">Total Estimado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600">${formatCurrency(dailyRate)}</div>
                        <div class="text-sm text-gray-600">Valor da Diária</div>
                    </div>
                </div>
                ${createCalendar(monthDate, monthData.dias)}
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
                <p class="font-bold text-green-800 mb-2">Mês Fechado</p>
                ${paidText}
            </div>
        `;
    }

    /**
     * Cria a estrutura HTML de um calendário para um mês específico.
     */
    function createCalendar(date, hostedDays) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        let html = `<div class="calendar-grid" data-year="${year}" data-month="${month + 1}">`;
        weekDays.forEach(day => { html += `<div class="calendar-header">${day}</div>`; });
        for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const dayClass = hostedDays.includes(day) ? 'calendar-day has-stay' : 'calendar-day';
            html += `<div class="${dayClass}" data-day="${day}">${day}</div>`;
        }
        html += '</div>';
        
        // Adiciona dica para dispositivos móveis
        if (isMobileDevice()) {
            html += '<div class="mobile-hint">💡 Toque duas vezes em um dia para registrar/remover hospedagem</div>';
        }
        
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
     * Manipula o clique para registrar uma nova diária.
     */
    async function handleLogStay() {
        showFeedback('', 'clear'); // Limpa feedback anterior
        try {
            const response = await fetch(`${API_URL}/registrar-diaria`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro desconhecido.');

            showFeedback('Diária registrada com sucesso!', 'success');
            await loadData(); // Recarrega tudo para garantir consistência
        } catch (error) {
            console.error('Erro ao registrar diária:', error);
            showFeedback(error.message, 'error');
        }
    }

    /**
     * Manipula o clique para fechar um mês.
     */
    function handleCloseMonth(monthKey) {
        const monthData = appData.hospedagens[monthKey];
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const calculatedCost = monthData.dias.length * dailyRate;

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
            element.className = 'fixed bottom-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        } else if (type === 'error') {
            element.className = 'fixed bottom-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        } else {
            element.className = 'fixed bottom-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
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

    // Permitir confirmar com Enter no campo de valor pago
    paidAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmCloseMonth();
        }
    });

    // Variáveis para controle de toque em mobile
    let lastTouchTime = 0;
    let lastTouchedElement = null;
    const DOUBLE_TAP_DELAY = 300; // 300ms para detectar duplo toque

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
        if (calendarDay) {
            // Verifica se é um duplo clique (apenas para desktop)
            if (event.detail === 2 && !isMobileDevice()) {
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
                // Duplo toque detectado
                handleDayDoubleClick(calendarDay);
                lastTouchTime = 0; // Reset para evitar triplo toque
                lastTouchedElement = null;
            } else {
                // Primeiro toque
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
        const totalDays = monthData.dias.length;
        const totalCost = totalDays * dailyRate;
        const isClosed = monthData.fechado;

        const monthName = monthNames[monthDate.getMonth()];
        const year = monthDate.getFullYear();

        let statusHtml = '';
        if (isClosed) {
            const paidAmount = monthData.valorPago || 0;
            statusHtml = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4">
                    <strong>Mês Fechado</strong> - Valor Pago: ${formatCurrency(paidAmount)}
                </div>
            `;
        }

        const html = `
            <div class="bg-white">
                ${statusHtml}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-blue-600">${totalDays}</div>
                        <div class="text-sm text-gray-600">Diárias</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-600">${formatCurrency(totalCost)}</div>
                        <div class="text-sm text-gray-600">Total Estimado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-purple-600">${formatCurrency(dailyRate)}</div>
                        <div class="text-sm text-gray-600">Valor da Diária</div>
                    </div>
                </div>
                ${createCalendar(monthDate, monthData.dias)}
                
                <!-- Lista de dias com hospedagem -->
                ${monthData.dias.length > 0 ? `
                    <div class="mt-6">
                        <h4 class="text-lg font-semibold mb-3 text-gray-700">Dias com Hospedagem:</h4>
                        <div class="grid grid-cols-7 gap-2">
                            ${monthData.dias.sort((a, b) => parseInt(a) - parseInt(b)).map(day => `
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
            console.error('Erro:', error);
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
                        ${columns.map(col => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${col}</th>`).join('')}
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;

        currentTableData.forEach((record, index) => {
            html += `
                <tr class="hover:bg-gray-50">
                    ${columns.map(col => {
                        let value = record[col];
                        if (col.includes('data') && value) {
                            value = new Date(value).toLocaleDateString('pt-BR');
                        }
                        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value || ''}</td>`;
                    }).join('')}
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="editRecord(${index})" class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                        <button onclick="deleteRecord(${index})" class="text-red-600 hover:text-red-900">Excluir</button>
                    </td>
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">Dias (JSON)</label>
                    <input type="text" name="dias" value="${record?.dias || ''}" placeholder="Ex: [1,2,3]" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
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
            console.error('Erro:', error);
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

    // --- Inicialização ---
    loadData();
});