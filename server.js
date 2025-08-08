const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'dados.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para obter todos os dados
app.get('/api/hospedagem', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') { // Se o arquivo não existe, retorna dados iniciais
                const initialData = {
                    usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
                    hospedagens: {}
                };
                return res.json(initialData);
            }
            return res.status(500).json({ error: 'Erro ao ler os dados.' });
        }
        if (!data) { // Se o arquivo está vazio, retorna dados iniciais
            const initialData = {
                usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
                hospedagens: {}
            };
            return res.json(initialData);
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint para salvar os dados
app.post('/api/hospedagem', (req, res) => {
    const newData = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao salvar os dados.' });
        }
        res.json({ message: 'Dados salvos com sucesso!' });
    });
});

// Endpoint para registrar uma diária (dia anterior)
app.post('/api/hospedagem/registrar-diaria', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: 'Erro ao ler os dados.' });
        }

        const appData = (data && data.trim()) ? JSON.parse(data) : { usuario: {}, hospedagens: {} };

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
            return res.status(400).json({ message: 'Este mês já está fechado e não pode ser alterado.' });
        }

        if (appData.hospedagens[monthKey].dias.includes(day)) {
            return res.status(400).json({ message: 'A diária para este dia já foi registrada.' });
        }

        appData.hospedagens[monthKey].dias.push(day);

        fs.writeFile(DATA_FILE, JSON.stringify(appData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Erro ao salvar a nova diária.' });
            }
            res.status(201).json({ message: 'Diária registrada com sucesso!' });
        });
    });
});

// Endpoint para registrar ou remover uma diária em um dia específico (toggle)
app.post('/api/hospedagem/registrar-diaria-especifica', (req, res) => {
    const { date } = req.body; // Espera uma data no formato "YYYY-MM-DD"

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
    }

    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: 'Erro ao ler os dados.' });
        }

        const appData = (data && data.trim()) ? JSON.parse(data) : { usuario: {}, hospedagens: {} };

        const [year, month, day] = date.split('-').map(Number);
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        if (!appData.hospedagens[monthKey]) {
            appData.hospedagens[monthKey] = { dias: [], fechado: false };
        }

        if (appData.hospedagens[monthKey].fechado) {
            return res.status(400).json({ message: 'Este mês já está fechado e não pode ser alterado.' });
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
            appData.hospedagens[monthKey].dias.sort((a, b) => a - b); // Mantém os dias ordenados
            message = 'Diária registrada com sucesso!';
        }

        fs.writeFile(DATA_FILE, JSON.stringify(appData, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Erro ao salvar a alteração da diária.' });
            }
            res.status(200).json({ message });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exportar o app para Vercel
module.exports = app;