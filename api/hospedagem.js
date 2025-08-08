// Vercel Serverless Function para gerenciar dados de hospedagem
// Como o Vercel não permite escrita de arquivos, usamos uma abordagem híbrida:
// - Em desenvolvimento: arquivo JSON local
// - Em produção: retorna dados iniciais (frontend usa localStorage)

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'dados.json');

// Dados iniciais padrão
const getInitialData = () => ({
    usuario: { nome: '', localPadrao: '', valorDiaria: 0 },
    hospedagens: {}
});

// Função para ler dados (funciona em dev, retorna dados iniciais em prod)
const readData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return data ? JSON.parse(data) : getInitialData();
        }
    } catch (error) {
        console.log('Arquivo não encontrado ou erro de leitura, usando dados iniciais');
    }
    return getInitialData();
};

// Função para escrever dados (só funciona em desenvolvimento local)
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.log('Erro ao escrever arquivo (esperado no Vercel):', error.message);
        return false;
    }
};

export default function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Retornar dados existentes ou dados iniciais
        const data = readData();
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const newData = req.body;
        
        // Tentar salvar (funciona em dev, falha silenciosamente em prod)
        const saved = writeData(newData);
        
        if (saved) {
            return res.status(200).json({ 
                message: 'Dados salvos com sucesso!',
                saved: true
            });
        } else {
            // Em produção, retornar sucesso mas indicar que não foi salvo no servidor
            return res.status(200).json({ 
                message: 'Dados recebidos (salvos localmente no navegador)',
                saved: false,
                note: 'Em produção, os dados são mantidos apenas no navegador'
            });
        }
    }

    return res.status(405).json({ error: 'Método não permitido' });
}