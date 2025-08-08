const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'dados.json');

/**
 * Função para ler dados do arquivo JSON
 * @returns {Object} Dados da aplicação
 */
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return {
                usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
                hospedagens: {}
            };
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : {
            usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
            hospedagens: {}
        };
    } catch (error) {
        return {
            usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
            hospedagens: {}
        };
    }
}

/**
 * Função para salvar dados no arquivo JSON
 * @param {Object} data - Dados para salvar
 * @returns {boolean} Sucesso da operação
 */
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Registra uma diária para o dia anterior (ontem)
 * @returns {Object} Resultado da operação
 */
function registrarDiariaOntem() {
    const appData = readData();
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const day = yesterday.getDate();
    
    if (!appData.hospedagens[monthKey]) {
        appData.hospedagens[monthKey] = { dias: [], fechado: false };
    }
    
    if (appData.hospedagens[monthKey].fechado) {
        return { success: false, message: 'Este mês já está fechado e não pode ser alterado.' };
    }
    
    if (appData.hospedagens[monthKey].dias.includes(day)) {
        return { success: false, message: 'A diária para este dia já foi registrada.' };
    }
    
    appData.hospedagens[monthKey].dias.push(day);
    appData.hospedagens[monthKey].dias.sort((a, b) => a - b);
    
    const success = saveData(appData);
    
    if (success) {
        return { success: true, message: 'Diária registrada com sucesso!' };
    } else {
        return { success: false, message: 'Erro ao salvar a nova diária.' };
    }
}

/**
 * Alterna (adiciona/remove) uma diária para uma data específica
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Object} Resultado da operação
 */
function alternarDiariaEspecifica(date) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { success: false, message: 'Formato de data inválido. Use YYYY-MM-DD.' };
    }
    
    const appData = readData();
    
    const [year, month, day] = date.split('-').map(Number);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!appData.hospedagens[monthKey]) {
        appData.hospedagens[monthKey] = { dias: [], fechado: false };
    }
    
    if (appData.hospedagens[monthKey].fechado) {
        return { success: false, message: 'Este mês já está fechado e não pode ser alterado.' };
    }
    
    const dayIndex = appData.hospedagens[monthKey].dias.indexOf(day);
    let message = '';
    
    if (dayIndex > -1) {
        // Dia existe, remover
        appData.hospedagens[monthKey].dias.splice(dayIndex, 1);
        message = 'Diária removida com sucesso!';
    } else {
        // Dia não existe, adicionar
        appData.hospedagens[monthKey].dias.push(day);
        appData.hospedagens[monthKey].dias.sort((a, b) => a - b);
        message = 'Diária registrada com sucesso!';
    }
    
    const success = saveData(appData);
    
    if (success) {
        return { success: true, message };
    } else {
        return { success: false, message: 'Erro ao salvar a alteração da diária.' };
    }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para obter todos os dados
app.get('/api/hospedagem', (req, res) => {
    const data = readData();
    res.json(data);
});

// Endpoint para salvar os dados
app.post('/api/hospedagem', (req, res) => {
    const newData = req.body;
    const success = saveData(newData);
    
    if (success) {
        res.json({ message: 'Dados salvos com sucesso!' });
    } else {
        res.status(500).json({ error: 'Erro ao salvar os dados.' });
    }
});

// Endpoint para registrar uma diária (dia anterior)
app.post('/api/hospedagem/registrar-diaria', (req, res) => {
    const result = registrarDiariaOntem();
    
    if (result.success) {
        res.status(201).json({ message: result.message });
    } else {
        res.status(400).json({ message: result.message });
    }
});

// Endpoint para registrar ou remover uma diária em um dia específico (toggle)
app.post('/api/hospedagem/registrar-diaria-especifica', (req, res) => {
    const { date } = req.body;
    const result = alternarDiariaEspecifica(date);
    
    if (result.success) {
        res.status(200).json({ message: result.message });
    } else {
        res.status(400).json({ message: result.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exportar o app para Vercel
module.exports = app;