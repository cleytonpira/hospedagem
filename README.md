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
- **Armazenamento**: JSON file

## Deploy no Vercel

### Arquitetura Serverless

Esta aplicação foi configurada para usar **Serverless Functions** do Vercel:

- **Frontend**: Arquivos estáticos servidos da pasta `public/`
- **Backend**: API serverless em `api/hospedagem.js`
- **Dados**: Persistência via arquivo JSON (limitações em produção)

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
   - A API será automaticamente configurada como serverless function
   - O deploy será feito automaticamente

### Estrutura do Projeto

```
hospedagem-backend/
├── api/              # Serverless functions do Vercel
│   └── hospedagem.js # API principal para dados de hospedagem
├── public/           # Arquivos estáticos (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js         # Servidor Express (para desenvolvimento local)
├── dados.json        # Arquivo de dados (criado automaticamente)
├── package.json      # Dependências do projeto
├── vercel.json       # Configuração do Vercel
├── .gitignore        # Arquivos ignorados pelo Git
├── .env.example      # Exemplo de variáveis de ambiente
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

A aplicação estará disponível em `http://localhost:3000`

## Notas Importantes

⚠️ **IMPORTANTE - Limitações no Vercel:**
- O Vercel é uma plataforma serverless, onde os arquivos não persistem entre execuções
- O arquivo `dados.json` será perdido a cada novo deploy ou reinicialização
- **Para uso em produção no Vercel, é necessário integrar com um banco de dados**

### Alternativas para Persistência de Dados:

1. **Vercel KV** (Redis)
2. **PlanetScale** (MySQL)
3. **Supabase** (PostgreSQL)
4. **MongoDB Atlas**
5. **Firebase Firestore**

### Para Desenvolvimento Local:
- Os dados são armazenados em arquivo JSON local
- O arquivo `dados.json` será criado automaticamente na primeira execução
- Funciona perfeitamente para desenvolvimento e testes