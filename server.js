const express = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Instância do banco de dados
const db = new Database();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Função para migrar dados do JSON para SQLite (se necessário)
async function migrateFromJson() {
    const dataFile = path.join(__dirname, 'dados.json');
    
    if (fs.existsSync(dataFile)) {
        try {
            console.log('Migrando dados do arquivo JSON para SQLite...');
            const jsonData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            await db.saveAllData(jsonData);
            
            // Renomear arquivo JSON para backup
            fs.renameSync(dataFile, dataFile + '.backup');
            console.log('Migração concluída. Arquivo JSON renomeado para dados.json.backup');
        } catch (error) {
            console.error('Erro na migração:', error);
        }
    }
}

// Endpoint para obter todos os dados
app.get('/api/hospedagem', async (req, res) => {
    try {
        const data = await db.getAllData();
        res.json(data);
    } catch (error) {
        console.error('Erro ao obter dados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Endpoint para salvar os dados
app.post('/api/hospedagem', async (req, res) => {
    try {
        await db.saveAllData(req.body);
        res.json({ message: 'Dados salvos com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ error: 'Erro ao salvar dados' });
    }
});

// Endpoint para registrar uma diária (dia anterior)
app.post('/api/hospedagem/registrar-diaria', async (req, res) => {
    try {
        const appData = await db.getAllData();

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

        await db.saveAllData(appData);
        res.status(201).json({ message: 'Diária registrada com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar diária:', error);
        res.status(500).json({ error: 'Erro ao salvar a nova diária.' });
    }
});

// Endpoint para registrar ou remover uma diária em um dia específico (toggle)
app.post('/api/hospedagem/registrar-diaria-especifica', async (req, res) => {
    const { date } = req.body; // Espera uma data no formato "YYYY-MM-DD"

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD.' });
    }

    try {
        const appData = await db.getAllData();

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

        await db.saveAllData(appData);
        res.status(200).json({ message });
    } catch (error) {
        console.error('Erro ao alterar diária:', error);
        res.status(500).json({ error: 'Erro ao salvar a alteração da diária.' });
    }
});

// Inicializar banco de dados e iniciar servidor
async function startServer() {
    try {
        await db.connect();
        await migrateFromJson();
        
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}

startServer();

// Exportar o app para Vercel
module.exports = app;