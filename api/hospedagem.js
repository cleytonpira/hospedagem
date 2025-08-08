const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'dados.json');

// Função para ler dados
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

// Função para salvar dados
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const data = readData();
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const requestData = req.body;
        
        // Se é uma ação específica
        if (requestData.action === 'registrar-diaria-especifica') {
            const data = readData();
            // Aqui você pode implementar a lógica específica para registrar diária
            // Por enquanto, apenas salva os dados
            const success = saveData(data);
            return res.status(200).json({ message: 'Diária registrada com sucesso!' });
        }
        
        // Salvar dados normalmente
        const success = saveData(requestData);
        
        if (success) {
            return res.status(200).json({ message: 'Dados salvos com sucesso!' });
        } else {
            return res.status(500).json({ error: 'Erro ao salvar os dados.' });
        }
    }

    return res.status(405).json({ error: 'Método não permitido' });
};