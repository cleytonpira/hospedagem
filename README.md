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
- **Banco de Dados**: SQLite3
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
├── public/           # Arquivos estáticos (frontend)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server.js         # Servidor Express
├── dados.json        # Arquivo de dados
├── package.json      # Dependências e scripts
├── vercel.json       # Configuração do Vercel
└── README.md         # Este arquivo
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

**Nota**: Na primeira execução, se você tiver um arquivo `dados.json`, ele será automaticamente migrado para SQLite.

A aplicação estará disponível em `http://localhost:3000`

## 🗄️ Banco de Dados

A aplicação utiliza **SQLite3** para armazenamento de dados, oferecendo:

- ✅ **Desenvolvimento Local**: Banco SQLite local (`hospedagem.db`)
- ✅ **Migração Automática**: Converte dados do `dados.json` automaticamente
- ✅ **Backup Automático**: Arquivo JSON original é preservado como `.backup`

### Migração Automática

Quando você executar a aplicação pela primeira vez após a atualização:
1. O sistema detectará o arquivo `dados.json` existente
2. Migrará automaticamente todos os dados para SQLite
3. Renomeará o arquivo original para `dados.json.backup`
4. Continuará funcionando normalmente com o banco SQLite

### Para Produção no Vercel

Para deploy em produção, recomenda-se usar um banco de dados externo:
1. **Vercel Postgres**: Banco PostgreSQL da Vercel
2. **PlanetScale**: MySQL serverless
3. **Supabase**: PostgreSQL com interface amigável
4. **Railway**: PostgreSQL/MySQL simples

Para implementar:
1. Modifique `database.js` para usar o banco escolhido
2. Adicione as variáveis de ambiente no Vercel