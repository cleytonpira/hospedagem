# Migração para Supabase

Este documento contém as instruções para migrar o sistema de hospedagem do SQLite para o Supabase.

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Node.js instalado

## Passos da Migração

### 1. Configurar o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Crie um novo projeto ou use um existente
3. Anote a **URL do projeto** e a **chave anônima (anon key)**

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e configure as variáveis do Supabase:
   ```env
   PORT=3000
   SUPABASE_URL=https://seu-projeto-id.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```

### 3. Criar as Tabelas no Supabase

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Execute o script `supabase-setup.sql` que está na raiz do projeto
3. Verifique se as tabelas `usuario` e `hospedagem` foram criadas na aba **Table Editor**

### 4. Instalar Dependências

As dependências já foram atualizadas. Se necessário, execute:
```bash
npm install
```

### 5. Testar a Aplicação

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Acesse `http://localhost:3000` e teste as funcionalidades

## Principais Mudanças

### Estrutura do Banco de Dados

- **SQLite**: Banco local/em memória
- **Supabase**: PostgreSQL na nuvem

### Campos Adicionados

- `created_at`: Timestamp de criação
- `updated_at`: Timestamp de última atualização (atualizado automaticamente)

### Melhorias de Performance

- Índices criados para consultas mais rápidas
- Row Level Security (RLS) habilitado para segurança

### Formato dos Dados

#### Hospedagens
Antes (SQLite):
```json
{
  "01/2024": {
    "dias": [1, 2, 3],
    "fechado": false,
    "valorCalculado": 300,
    "valorPago": 300
  }
}
```

Agora (Supabase):
```json
[
  {
    "id": 1,
    "mesAno": "01/2024",
    "dias": [1, 2, 3],
    "fechado": false,
    "valorCalculado": 300,
    "valorPago": 300,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

## Configuração no Vercel

Para deploy no Vercel, adicione as variáveis de ambiente:

1. Acesse o dashboard do Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave anônima do Supabase

## Benefícios da Migração

1. **Persistência**: Dados não são perdidos entre deploys
2. **Escalabilidade**: PostgreSQL suporta mais conexões e dados
3. **Backup Automático**: Supabase faz backup automático
4. **Interface Visual**: Dashboard para visualizar e editar dados
5. **APIs Automáticas**: Supabase gera APIs REST e GraphQL automaticamente
6. **Real-time**: Suporte a subscriptions em tempo real

## Solução de Problemas

### Erro de Conexão
- Verifique se as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretas
- Confirme se o projeto Supabase está ativo

### Tabelas Não Encontradas
- Execute o script `supabase-setup.sql` no SQL Editor do Supabase
- Verifique se as tabelas aparecem no Table Editor

### Dados Não Carregam
- Verifique as políticas RLS no Supabase
- Confirme se as tabelas têm as permissões corretas

## Migração de Dados Existentes

Se você tem dados no SQLite que precisa migrar:

1. Exporte os dados do SQLite
2. Use o Table Editor do Supabase para importar
3. Ou crie um script de migração personalizado

## Suporte

Para dúvidas sobre o Supabase:
- [Documentação oficial](https://supabase.com/docs)
- [Comunidade Discord](https://discord.supabase.com)
- [GitHub](https://github.com/supabase/supabase)