-- Script SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar tabela de usuário
CREATE TABLE IF NOT EXISTS usuario (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT,
    localPadrao TEXT,
    valorDiaria DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de hospedagem
CREATE TABLE IF NOT EXISTS hospedagem (
    id BIGSERIAL PRIMARY KEY,
    mesAno TEXT UNIQUE NOT NULL,
    dias TEXT, -- JSON string com os dias
    fechado BOOLEAN DEFAULT FALSE,
    valorCalculado DECIMAL(10,2),
    valorPago DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hospedagem_mesAno ON hospedagem(mesAno);
CREATE INDEX IF NOT EXISTS idx_hospedagem_fechado ON hospedagem(fechado);

-- Habilitar RLS (Row Level Security) - opcional, mas recomendado
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospedagem ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas (permitir todas as operações para usuários autenticados)
-- Ajuste conforme suas necessidades de segurança
CREATE POLICY "Permitir todas as operações na tabela usuario" ON usuario
    FOR ALL USING (true);

CREATE POLICY "Permitir todas as operações na tabela hospedagem" ON hospedagem
    FOR ALL USING (true);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospedagem_updated_at BEFORE UPDATE ON hospedagem
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE usuario IS 'Tabela para armazenar dados do usuário do sistema de hospedagem';
COMMENT ON TABLE hospedagem IS 'Tabela para armazenar dados das hospedagens por mês/ano';

COMMENT ON COLUMN usuario.nome IS 'Nome do usuário';
COMMENT ON COLUMN usuario.localPadrao IS 'Local padrão de hospedagem';
COMMENT ON COLUMN usuario.valorDiaria IS 'Valor padrão da diária';

COMMENT ON COLUMN hospedagem.mesAno IS 'Mês e ano no formato MM/YYYY';
COMMENT ON COLUMN hospedagem.dias IS 'JSON string contendo os dias trabalhados';
COMMENT ON COLUMN hospedagem.fechado IS 'Indica se o mês foi fechado para edição';
COMMENT ON COLUMN hospedagem.valorCalculado IS 'Valor calculado baseado nos dias trabalhados';
COMMENT ON COLUMN hospedagem.valorPago IS 'Valor efetivamente pago';