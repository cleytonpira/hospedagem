const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados - usar memória em produção (Vercel)
const DB_PATH = process.env.NODE_ENV === 'production' ? ':memory:' : path.join(__dirname, 'hospedagem.db');

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
                    const dbType = DB_PATH === ':memory:' ? 'SQLite em memória (produção)' : 'SQLite local';
                    console.log(`Conectado ao banco de dados ${dbType}.`);
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
            console.log('Executando getUsuario...');
            this.db.get('SELECT * FROM usuario LIMIT 1', (err, row) => {
                if (err) {
                    console.error('Erro em getUsuario:', err);
                    reject(err);
                } else {
                    const result = row || { nome: '', localPadrao: '', valorDiaria: 0 };
                    console.log('getUsuario resultado:', result);
                    resolve(result);
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
            console.log('Executando getHospedagens...');
            this.db.all('SELECT * FROM hospedagem', (err, rows) => {
                if (err) {
                    console.error('Erro em getHospedagens:', err);
                    reject(err);
                } else {
                    console.log('Rows recuperadas de hospedagem:', rows);
                    const hospedagens = {};
                    rows.forEach(row => {
                        hospedagens[row.mesAno] = {
                            dias: JSON.parse(row.dias || '[]'),
                            fechado: Boolean(row.fechado),
                            valorCalculado: row.valorCalculado,
                            valorPago: row.valorPago
                        };
                    });
                    console.log('getHospedagens resultado:', hospedagens);
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
                console.log('Iniciando getAllData...');
                
                if (!this.db) {
                    throw new Error('Banco de dados não conectado');
                }
                
                const usuario = await this.getUsuario();
                console.log('Usuário recuperado:', usuario);
                
                const hospedagens = await this.getHospedagens();
                console.log('Hospedagens recuperadas:', hospedagens);
                
                const result = {
                    usuario,
                    hospedagens
                };
                
                console.log('getAllData concluído:', result);
                resolve(result);
            } catch (error) {
                console.error('Erro em getAllData:', error);
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

    // === MÉTODOS CRUD PARA EDITOR DE BANCO ===
    
    // Obter todas as tabelas e seus dados
    getAllTables() {
        return new Promise((resolve, reject) => {
            const tables = {};
            
            // Obter dados da tabela usuario
            this.db.all('SELECT * FROM usuario', (err, userRows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                tables.usuario = userRows;
                
                // Obter dados da tabela hospedagem
                this.db.all('SELECT * FROM hospedagem', (err, hospedagemRows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    tables.hospedagem = hospedagemRows;
                    resolve(tables);
                });
            });
        });
    }
    
    // Inserir registro em uma tabela
    insertRecord(tableName, data) {
        return new Promise((resolve, reject) => {
            if (tableName === 'usuario') {
                const { nome, localPadrao, valorDiaria } = data;
                this.db.run(
                    'INSERT INTO usuario (nome, localPadrao, valorDiaria) VALUES (?, ?, ?)',
                    [nome, localPadrao, valorDiaria],
                    function(err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID });
                    }
                );
            } else if (tableName === 'hospedagem') {
                const { mesAno, dias, fechado, valorCalculado, valorPago } = data;
                this.db.run(
                    'INSERT INTO hospedagem (mesAno, dias, fechado, valorCalculado, valorPago) VALUES (?, ?, ?, ?, ?)',
                    [mesAno, dias, fechado ? 1 : 0, valorCalculado, valorPago],
                    function(err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID });
                    }
                );
            } else {
                reject(new Error('Tabela não suportada'));
            }
        });
    }
    
    // Atualizar registro em uma tabela
    updateRecord(tableName, id, data) {
        return new Promise((resolve, reject) => {
            if (tableName === 'usuario') {
                const { nome, localPadrao, valorDiaria } = data;
                this.db.run(
                    'UPDATE usuario SET nome = ?, localPadrao = ?, valorDiaria = ? WHERE id = ?',
                    [nome, localPadrao, valorDiaria, id],
                    function(err) {
                        if (err) reject(err);
                        else resolve({ changes: this.changes });
                    }
                );
            } else if (tableName === 'hospedagem') {
                const { mesAno, dias, fechado, valorCalculado, valorPago } = data;
                this.db.run(
                    'UPDATE hospedagem SET mesAno = ?, dias = ?, fechado = ?, valorCalculado = ?, valorPago = ? WHERE id = ?',
                    [mesAno, dias, fechado ? 1 : 0, valorCalculado, valorPago, id],
                    function(err) {
                        if (err) reject(err);
                        else resolve({ changes: this.changes });
                    }
                );
            } else {
                reject(new Error('Tabela não suportada'));
            }
        });
    }
    
    // Deletar registro de uma tabela
    deleteRecord(tableName, id) {
        return new Promise((resolve, reject) => {
            if (tableName === 'usuario' || tableName === 'hospedagem') {
                this.db.run(
                    `DELETE FROM ${tableName} WHERE id = ?`,
                    [id],
                    function(err) {
                        if (err) reject(err);
                        else resolve({ changes: this.changes });
                    }
                );
            } else {
                reject(new Error('Tabela não suportada'));
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