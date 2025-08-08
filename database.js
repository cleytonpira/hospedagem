const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const DB_PATH = path.join(__dirname, 'hospedagem.db');

class Database {
    constructor() {
        this.db = null;
    }

    // Conectar ao banco de dados
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Erro ao conectar com o banco de dados:', err.message);
                    reject(err);
                } else {
                    console.log('Conectado ao banco de dados SQLite.');
                    this.initTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // Inicializar tabelas
    initTables() {
        return new Promise((resolve, reject) => {
            const createUserTable = `
                CREATE TABLE IF NOT EXISTS usuario (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT,
                    localPadrao TEXT,
                    valorDiaria REAL
                )
            `;

            const createHospedagemTable = `
                CREATE TABLE IF NOT EXISTS hospedagem (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mesAno TEXT UNIQUE,
                    dias TEXT,
                    fechado BOOLEAN DEFAULT 0,
                    valorCalculado REAL,
                    valorPago REAL
                )
            `;

            this.db.serialize(() => {
                this.db.run(createUserTable, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela usuario:', err.message);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createHospedagemTable, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela hospedagem:', err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    }

    // Obter dados do usuário
    getUsuario() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM usuario LIMIT 1', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || { nome: '', localPadrao: '', valorDiaria: 0 });
                }
            });
        });
    }

    // Salvar dados do usuário
    saveUsuario(usuario) {
        return new Promise((resolve, reject) => {
            const { nome, localPadrao, valorDiaria } = usuario;
            
            // Primeiro, verificar se já existe um usuário
            this.db.get('SELECT id FROM usuario LIMIT 1', (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // Atualizar usuário existente
                    this.db.run(
                        'UPDATE usuario SET nome = ?, localPadrao = ?, valorDiaria = ? WHERE id = ?',
                        [nome, localPadrao, valorDiaria, row.id],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                } else {
                    // Inserir novo usuário
                    this.db.run(
                        'INSERT INTO usuario (nome, localPadrao, valorDiaria) VALUES (?, ?, ?)',
                        [nome, localPadrao, valorDiaria],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                }
            });
        });
    }

    // Obter todas as hospedagens
    getHospedagens() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM hospedagem', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const hospedagens = {};
                    rows.forEach(row => {
                        hospedagens[row.mesAno] = {
                            dias: JSON.parse(row.dias || '[]'),
                            fechado: Boolean(row.fechado),
                            valorCalculado: row.valorCalculado,
                            valorPago: row.valorPago
                        };
                    });
                    resolve(hospedagens);
                }
            });
        });
    }

    // Salvar hospedagem
    saveHospedagem(mesAno, hospedagem) {
        return new Promise((resolve, reject) => {
            const { dias, fechado, valorCalculado, valorPago } = hospedagem;
            const diasJson = JSON.stringify(dias);
            
            this.db.run(
                `INSERT OR REPLACE INTO hospedagem 
                 (mesAno, dias, fechado, valorCalculado, valorPago) 
                 VALUES (?, ?, ?, ?, ?)`,
                [mesAno, diasJson, fechado ? 1 : 0, valorCalculado, valorPago],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // Obter todos os dados (formato compatível com JSON anterior)
    getAllData() {
        return new Promise(async (resolve, reject) => {
            try {
                const usuario = await this.getUsuario();
                const hospedagens = await this.getHospedagens();
                
                resolve({
                    usuario,
                    hospedagens
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Salvar todos os dados
    saveAllData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Salvar usuário
                if (data.usuario) {
                    await this.saveUsuario(data.usuario);
                }

                // Salvar hospedagens
                if (data.hospedagens) {
                    for (const [mesAno, hospedagem] of Object.entries(data.hospedagens)) {
                        await this.saveHospedagem(mesAno, hospedagem);
                    }
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Fechar conexão
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Erro ao fechar o banco de dados:', err.message);
                } else {
                    console.log('Conexão com o banco de dados fechada.');
                }
            });
        }
    }
}

module.exports = Database;