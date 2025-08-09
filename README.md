# App de Controle de Hospedagem

Aplicação web para controle de hospedagens com backend Node.js e frontend vanilla JavaScript.

## Funcionalidades

- Registro de diárias de hospedagem
- Visualização de calendário mensal
- Estatísticas gerais (meses hospedados, total de dias, valores)
- Fechamento de meses com cálculo de valores
- Interface responsiva

## Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Vercel

## Deploy no Vercel

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab, ou Bitbucket)

### Passos para Deploy

1. **Fazer push do código para um repositório Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <URL_DO_SEU_REPOSITORIO>
   git push -u origin main
   ```

2. **Conectar ao Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub/GitLab/Bitbucket
   - Clique em "New Project"
   - Selecione seu repositório
   - Clique em "Deploy"

3. **Configuração Automática**
   - O Vercel detectará automaticamente as configurações do `vercel.json`
   - O deploy será feito automaticamente

### Estrutura do Projeto

```
├── public/                # Arquivos estáticos (frontend)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── docs/                  # Documentação
│   └── PDR.md
├── server.js              # Servidor Express
├── database.js            # Módulo de conexão com Supabase
├── supabase-setup.sql     # Script de configuração do banco
├── SUPABASE_MIGRATION.md  # Documentação da migração
├── .env.example           # Exemplo de variáveis de ambiente
├── package.json           # Dependências e scripts
├── vercel.json            # Configuração do Vercel
└── README.md              # Este arquivo
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Ou executar diretamente
npm start
```

**Nota**: Configure as variáveis de ambiente do Supabase antes da primeira execução.

A aplicação estará disponível em `http://localhost:3000`

## 🗄️ Banco de Dados

A aplicação utiliza **Supabase** (PostgreSQL) para persistência de dados:

- ✅ **Desenvolvimento Local**: Conecta ao Supabase via variáveis de ambiente
- ✅ **Produção (Vercel)**: Conecta ao Supabase via variáveis de ambiente
- ✅ **Persistência Total**: Dados são mantidos permanentemente
- ✅ **Interface Web**: Dashboard do Supabase para gerenciamento

### Configuração do Supabase

1. **Criar conta no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Crie uma conta gratuita
   - Crie um novo projeto

2. **Configurar variáveis de ambiente**:
   ```bash
   # Copie o arquivo de exemplo
   cp .env.example .env
   
   # Configure as variáveis no arquivo .env
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   ```

3. **Executar script de configuração**:
   - Execute o script `supabase-setup.sql` no SQL Editor do Supabase
   - Isso criará as tabelas necessárias: `usuarios` e `hospedagens`

### Estrutura do Banco

**Tabela `usuarios`**:
- `id`: UUID (chave primária)
- `nome`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

**Tabela `hospedagens`**:
- `id`: UUID (chave primária)
- `usuario_id`: UUID (referência ao usuário)
- `data`: DATE
- `valor`: DECIMAL
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Deploy com Supabase

Para deploy no Vercel:
1. Configure as variáveis de ambiente no painel do Vercel
2. Adicione `SUPABASE_URL` e `SUPABASE_ANON_KEY`
3. O deploy será automático com persistência total

### Migração de Dados

Se você possui dados em formato JSON:
1. Execute a aplicação localmente com Supabase configurado
2. Use o editor de banco integrado para importar dados
3. Ou execute scripts SQL personalizados no Supabase