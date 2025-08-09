const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

class Database {
    constructor() {
        this.supabase = null;
    }

    // Conectar ao Supabase
    connect() {
        return new Promise((resolve, reject) => {
            try {
                if (!supabaseUrl || !supabaseKey) {
                    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas nas variáveis de ambiente');
                }

                this.supabase = createClient(supabaseUrl, supabaseKey);
                // Conectado ao Supabase com sucesso
                resolve();
            } catch (error) {
                // Erro ao conectar com o Supabase
                reject(error);
            }
        });
    }

    // Verificar se as tabelas existem e criar se necessário
    async initTables() {
        try {
            // As tabelas devem ser criadas manualmente no Supabase Dashboard
            // ou via SQL. Este método apenas verifica a conexão.
            // Verificando conexão com as tabelas do Supabase
            
            // Teste de conexão simples
            const { data, error } = await this.supabase
                .from('usuario')
                .select('count', { count: 'exact', head: true });
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não encontrada
                throw error;
            }
            
            // Conexão com Supabase verificada
            return Promise.resolve();
        } catch (error) {
            // Erro ao verificar tabelas
            return Promise.reject(error);
        }
    }

    // Buscar dados do usuário
    getUsuario() {
        // Executando getUsuario
        return new Promise(async (resolve, reject) => {
            try {
                const { data, error } = await this.supabase
                    .from('usuario')
                    .select('*')
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Erro ao buscar usuário:', error);
                    reject(error);
                    return;
                }

                const usuario = data ? {
                    nome: data.nome || '',
                    localPadrao: data.localpadrao || '',
                    valorDiaria: data.valordiaria || 0
                } : {
                    nome: '',
                    localPadrao: '',
                    valorDiaria: 0
                };

                // Usuário recuperado
                resolve(usuario);
            } catch (error) {
                console.error('Erro ao buscar usuário:', error);
                reject(error);
            }
        });
    }

    // Salvar dados do usuário
    saveUsuario(usuario) {
        return new Promise(async (resolve, reject) => {
            try {
                // Dados do usuário recebidos para salvar
                
                // Verificar se já existe um usuário
                const { data: existingUser } = await this.supabase
                    .from('usuario')
                    .select('id')
                    .limit(1)
                    .single();

                const dadosParaSalvar = {
                    nome: usuario.nome,
                    localpadrao: usuario.localPadrao,
                    valordiaria: usuario.valorDiaria
                };
                
                // Dados formatados para o banco

                let result;
                if (existingUser) {
                    // Atualizando usuário existente
                    // Atualizar usuário existente
                    result = await this.supabase
                        .from('usuario')
                        .update(dadosParaSalvar)
                        .eq('id', existingUser.id);
                } else {
                    // Inserindo novo usuário
                    // Inserir novo usuário
                    result = await this.supabase
                        .from('usuario')
                        .insert(dadosParaSalvar);
                }

                if (result.error) {
                    console.error('Erro ao atualizar registro:', result.error);
                    reject(result.error);
                    return;
                }

                // Usuário salvo com sucesso
                resolve();
            } catch (error) {
                // Erro ao salvar usuário
                reject(error);
            }
        });
    }

    // Buscar hospedagens
    getHospedagens() {
        // Executando getHospedagens
        return new Promise(async (resolve, reject) => {
            try {
                const { data, error } = await this.supabase
                    .from('hospedagem')
                    .select('*')
                    .order('mesano', { ascending: true });

                if (error) {
                    // Erro ao buscar hospedagens
                    reject(error);
                    return;
                }

                const hospedagens = (data || []).map(row => ({
                    id: row.id,
                    mesAno: row.mesano,
                    dias: JSON.parse(row.dias || '{}'),
                    fechado: row.fechado,
                    valorCalculado: row.valorcalculado,
                    valorPago: row.valorpago
                }));

                // Hospedagens recuperadas
                resolve(hospedagens);
            } catch (error) {
                // Erro ao buscar hospedagens
                reject(error);
            }
        });
    }

    // Salvar hospedagem
    saveHospedagem(mesAno, hospedagem) {
        return new Promise(async (resolve, reject) => {
            try {
                const { data: existing } = await this.supabase
                    .from('hospedagem')
                    .select('id')
                    .eq('mesano', mesAno)
                    .single();

                const hospedagemData = {
                    mesano: mesAno,
                    dias: JSON.stringify(hospedagem.dias),
                    fechado: hospedagem.fechado,
                    valorcalculado: hospedagem.valorCalculado,
                    valorpago: hospedagem.valorPago
                };

                let result;
                if (existing) {
                    // Atualizar hospedagem existente
                    result = await this.supabase
                        .from('hospedagem')
                        .update(hospedagemData)
                        .eq('id', existing.id);
                } else {
                    // Inserir nova hospedagem
                    result = await this.supabase
                        .from('hospedagem')
                        .insert(hospedagemData);
                }

                if (result.error) {
                    console.error('Erro ao salvar hospedagem:', result.error);
                    reject(result.error);
                    return;
                }

                resolve();
            } catch (error) {
                console.error('Erro ao salvar hospedagem:', error);
                reject(error);
            }
        });
    }

    // Buscar todos os dados
    getAllData() {
        // Executando getAllData
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.supabase) {
                    // Supabase não conectado, tentando conectar
                    await this.connect();
                }

                // Recuperando dados do usuário
                const usuario = await this.getUsuario();
                
                // Recuperando dados das hospedagens
                const hospedagensArray = await this.getHospedagens();

                // Converter array de hospedagens em objeto com chaves de mês-ano
                const hospedagens = {};
                hospedagensArray.forEach(hospedagem => {
                    hospedagens[hospedagem.mesAno] = {
                        dias: hospedagem.dias,
                        fechado: hospedagem.fechado,
                        valorCalculado: hospedagem.valorCalculado,
                        valorPago: hospedagem.valorPago
                    };
                });

                const result = {
                    usuario: usuario,
                    hospedagens: hospedagens
                };

                // getAllData concluído
                resolve(result);
            } catch (error) {
                // Erro em getAllData
                reject(error);
            }
        });
    }

    // Salvar todos os dados
    saveAllData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Iniciando saveAllData
                
                // Salvar usuário
                if (data.usuario) {
                    // Salvando usuário
                    await this.saveUsuario(data.usuario);
                }

                // Salvar hospedagens
                if (data.hospedagens) {
                    // Processando hospedagens
                    
                    // Verificar se hospedagens é um array ou objeto
                    if (Array.isArray(data.hospedagens)) {
                        // Se for array, iterar normalmente
                        for (const hospedagem of data.hospedagens) {
                            // Salvando hospedagem (array)
                            await this.saveHospedagem(hospedagem.mesAno, hospedagem);
                        }
                    } else {
                        // Se for objeto com chaves de mês-ano, iterar pelas chaves
                        for (const [mesAno, hospedagem] of Object.entries(data.hospedagens)) {
                            // Salvando hospedagem (objeto)
                            await this.saveHospedagem(mesAno, hospedagem);
                        }
                    }
                }

                // saveAllData concluído com sucesso
                resolve();
            } catch (error) {
                // Erro ao salvar todos os dados
                reject(error);
            }
        });
    }

    // Buscar todas as tabelas (para compatibilidade)
    getAllTables() {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await this.getAllData();
                resolve({
                    usuario: [data.usuario],
                    hospedagem: data.hospedagens
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Inserir registro genérico
    insertRecord(tableName, data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Inserindo dados
                
                // Mapear colunas para o formato do banco de dados
                let mappedData = { ...data };
                
                if (tableName === 'usuario') {
                    // Mapear campos do usuário para snake_case
                    if (data.localPadrao !== undefined) {
                        mappedData.localpadrao = data.localPadrao;
                        delete mappedData.localPadrao;
                    }
                    if (data.valorDiaria !== undefined) {
                        mappedData.valordiaria = data.valorDiaria;
                        delete mappedData.valorDiaria;
                    }
                } else if (tableName === 'hospedagem') {
                    // Mapear campos da hospedagem para snake_case
                    if (data.mesAno !== undefined) {
                        mappedData.mesano = data.mesAno;
                        delete mappedData.mesAno;
                    }
                    if (data.valorCalculado !== undefined) {
                        mappedData.valorcalculado = data.valorCalculado;
                        delete mappedData.valorCalculado;
                    }
                    if (data.valorPago !== undefined) {
                        mappedData.valorpago = data.valorPago;
                        delete mappedData.valorPago;
                    }
                }
                
                // Dados mapeados
                
                const { error } = await this.supabase
                    .from(tableName)
                    .insert(mappedData);

                if (error) {
                    console.error(`Erro ao inserir em ${tableName}:`, error);
                    reject(error);
                    return;
                }

                // Inserção realizada com sucesso
                resolve();
            } catch (error) {
                console.error(`Erro ao inserir em ${tableName}:`, error);
                reject(error);
            }
        });
    }

    // Atualizar registro genérico
    updateRecord(tableName, id, data) {
        return new Promise(async (resolve, reject) => {
            try {
                // Atualizando dados
                
                // Mapear colunas para o formato do banco de dados
                let mappedData = { ...data };
                
                if (tableName === 'usuario') {
                    // Mapear campos do usuário para snake_case
                    if (data.localPadrao !== undefined) {
                        mappedData.localpadrao = data.localPadrao;
                        delete mappedData.localPadrao;
                    }
                    if (data.valorDiaria !== undefined) {
                        mappedData.valordiaria = data.valorDiaria;
                        delete mappedData.valorDiaria;
                    }
                } else if (tableName === 'hospedagem') {
                    // Mapear campos da hospedagem para snake_case
                    if (data.mesAno !== undefined) {
                        mappedData.mesano = data.mesAno;
                        delete mappedData.mesAno;
                    }
                    if (data.valorCalculado !== undefined) {
                        mappedData.valorcalculado = data.valorCalculado;
                        delete mappedData.valorCalculado;
                    }
                    if (data.valorPago !== undefined) {
                        mappedData.valorpago = data.valorPago;
                        delete mappedData.valorPago;
                    }
                }
                
                // Dados mapeados
                
                const { error } = await this.supabase
                    .from(tableName)
                    .update(mappedData)
                    .eq('id', id);

                if (error) {
                    // Erro ao atualizar
                    reject(error);
                    return;
                }

                // Atualização realizada com sucesso
                resolve();
            } catch (error) {
                // Erro ao atualizar
                reject(error);
            }
        });
    }

    // Deletar registro genérico
    deleteRecord(tableName, id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { error } = await this.supabase
                    .from(tableName)
                    .delete()
                    .eq('id', id);

                if (error) {
                    // Erro ao deletar
                    reject(error);
                    return;
                }

                resolve();
            } catch (error) {
                // Erro ao deletar
                reject(error);
            }
        });
    }

    // Fechar conexão (não necessário no Supabase)
    close() {
        return new Promise((resolve) => {
            // Conexão com Supabase encerrada
            resolve();
        });
    }
}

module.exports = Database;