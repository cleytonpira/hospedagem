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