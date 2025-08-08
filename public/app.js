document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores do DOM ---
    const settingsModal = document.getElementById('settings-modal');
    const openSettingsModalButton = document.getElementById('open-settings-modal');
    const closeSettingsModalButton = document.getElementById('close-settings-modal');
    const userNameInput = document.getElementById('user-name');
    const locationNameInput = document.getElementById('location-name');
    const dailyRateInput = document.getElementById('daily-rate');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const savedFeedback = document.getElementById('saved-feedback');
    const logStayButton = document.getElementById('log-stay-button');
    const logFeedback = document.getElementById('log-feedback');
    const welcomeMessage = document.getElementById('welcome-message');
    const currentMonthSummaryDiv = document.getElementById('current-month-summary');

    // --- Constantes e Estado da Aplicação ---
    const API_URL = '/api/hospedagem';
    const LOCAL_STORAGE_KEY = 'hospedagem-app-data';
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    let appData = getInitialData();

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
     * Carrega os dados do localStorage primeiro, depois tenta sincronizar com o servidor.
     */
    async function loadData() {
        // Primeiro, carrega dados do localStorage se existirem
        const localData = loadFromLocalStorage();
        if (localData) {
            appData = localData;
            updateUI();
        }

        // Depois tenta carregar do servidor
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Não foi possível carregar os dados.');
            const serverData = await response.json();
            
            // Se o servidor tem dados mais completos, usa eles
            if (serverData && (serverData.usuario.nome || Object.keys(serverData.hospedagens).length > 0)) {
                appData = serverData;
                saveToLocalStorage(appData);
                updateUI();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do servidor:', error);
            if (!localData) {
                showFeedback('Usando dados locais. Conexão com servidor indisponível.', 'warning');
            }
        }
    }

    /**
     * Salva os dados no localStorage e tenta sincronizar com o servidor.
     */
    async function saveData() {
        // Sempre salva no localStorage primeiro
        saveToLocalStorage(appData);
        
        // Tenta salvar no servidor
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData),
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.saved) {
                    showFeedback('Dados salvos com sucesso!', 'success');
                } else {
                    showFeedback('Dados salvos localmente no navegador.', 'info');
                }
                return true;
            } else {
                throw new Error('Erro na resposta do servidor');
            }
        } catch (error) {
            console.error('Erro ao salvar no servidor:', error);
            showFeedback('Dados salvos localmente. Servidor indisponível.', 'warning');
            return true; // Retorna true porque salvou no localStorage
        }
    }

    /**
     * Salva dados no localStorage do navegador.
     */
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    /**
     * Carrega dados do localStorage do navegador.
     */
    function loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            return null;
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
    async function handleCloseMonth(monthKey) {
        const monthData = appData.hospedagens[monthKey];
        const dailyRate = parseFloat(appData.usuario.valorDiaria) || 0;
        const calculatedCost = monthData.dias.length * dailyRate;

        const promptMessage = `O valor calculado para ${monthKey} é ${formatCurrency(calculatedCost)}.\n\nInforme o valor efetivamente pago:`
        const paidAmountStr = prompt(promptMessage, calculatedCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.', ','));

        if (paidAmountStr === null) return; // Usuário cancelou

        const paidAmount = parseFloat(paidAmountStr.replace(',', '.').trim());

        if (isNaN(paidAmount) || paidAmount < 0) {
            showFeedback('Valor de pagamento inválido.', 'error');
            return;
        }

        monthData.fechado = true;
        monthData.valorCalculado = calculatedCost;
        monthData.valorPago = paidAmount;

        const success = await saveData();
        if (success) renderSummaries();
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
        } else if (type === 'warning') {
            element.className = 'fixed bottom-20 right-6 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
        } else if (type === 'info') {
            element.className = 'fixed bottom-20 right-6 bg-blue-400 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 z-30';
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

    // Controle da Modal
    openSettingsModalButton.addEventListener('click', () => toggleModal(true));
    closeSettingsModalButton.addEventListener('click', () => toggleModal(false));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) toggleModal(false); // Fecha se clicar no fundo
    });

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
            // Verifica se é um duplo clique
            if (event.detail === 2) {
                handleDayDoubleClick(calendarDay);
            }
        }
    });

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

    // Tornar a função global para uso no onclick
    window.closeHistoricalModal = closeHistoricalModal;

    // --- Inicialização ---
    loadData();
});