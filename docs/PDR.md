App de Controle de Hospedagem
Versão: 1.1
Data: 08/08/2025

1. Introdução e Visão Geral
Este documento descreve o projeto de desenvolvimento de um aplicativo web para controle de diárias de hospedagem. O objetivo principal é permitir que usuários registrem suas estadias, monitorem os custos mensais e gerem relatórios para pagamento.

O projeto será desenvolvido em duas fases principais:

Fase 1 (MVP - Mínimo Produto Viável): Uma aplicação single-page (página única) utilizando apenas HTML, CSS e JavaScript. Os dados serão armazenados localmente no navegador, em formato JSON, para validar as funcionalidades essenciais.

Fase 2 (Arquitetura Cliente-Servidor): A aplicação será refatorada. O frontend (cliente) continuará sendo a interface web, e será desenvolvido um backend (servidor) com Node.js e Express.js. O backend será responsável por gerenciar a lógica de negócio e a persistência dos dados através de uma API RESTful, que manipulará um arquivo JSON no servidor.

2. Escopo do Projeto
2.1. Funcionalidades Incluídas (No Escopo)
Configuração Inicial: O usuário poderá informar seu nome, o nome do local padrão de hospedagem e o valor da diária.

Registro de Hospedagem: Funcionalidade para o usuário registrar uma nova diária. O sistema deve sempre considerar a data como sendo o dia anterior ao do registro (D-1).

Visualização de Resumo: A tela principal exibirá um resumo de custos e dias de hospedagem para o mês atual e o mês anterior.

Detalhamento Mensal: Os resumos mensais serão expansíveis, permitindo ao usuário visualizar em quais dias específicos do mês houve hospedagem (ex: "15 - Sexta-feira").

Fechamento do Mês: Uma função para "fechar" um mês, que calculará o valor total a ser pago, solicitará a confirmação do valor efetivamente pago e marcará o mês como faturado.

API para Registro (Fase 2): O backend deverá expor um endpoint na API para que seja possível registrar uma hospedagem diretamente, sem a interface gráfica.

2.2. Funcionalidades Excluídas (Fora do Escopo)
Autenticação de múltiplos usuários.

Uso de banco de dados relacional ou NoSQL (a persistência será em arquivo JSON).

Hospedagem em múltiplos locais simultaneamente.

Relatórios anuais ou com períodos personalizados.

3. Requisitos
3.1. Requisitos Funcionais
ID

Requisito

Descrição

Fase

RF-01

Configurar Dados do Usuário

O usuário deve poder inserir e salvar seu nome, local de hospedagem e valor da diária.

1

RF-02

Registrar Diária

O usuário deve clicar em um botão que registra uma hospedagem para o dia anterior.

1

RF-03

Exibir Resumo Mensal

A interface deve mostrar o total de diárias e o custo total para o mês corrente e o anterior.

1

RF-04

Expandir Detalhes do Mês

O usuário deve poder clicar em um mês para ver a lista de dias em que esteve hospedado.

1

RF-05

Calcular e Fechar Mês

O usuário deve poder acionar uma função de fechamento. O sistema deve exibir o valor calculado e solicitar que o usuário insira o valor efetivamente pago.

1

RF-06

API de Registro

O backend deve prover um endpoint POST /hospedagem para registrar uma diária via API.

2

RF-07

API de Consulta

O backend deve prover um endpoint GET /hospedagem para consultar os dados.

2

3.2. Requisitos Não-Funcionais
ID

Requisito

Descrição

RNF-01

Usabilidade

A interface deve ser limpa, intuitiva e fácil de usar.

RNF-02

Performance

A aplicação deve ter um tempo de resposta rápido, especialmente na Fase 1.

RNF-03

Persistência (Fase 1)

Os dados devem ser salvos no localStorage do navegador para não se perderem ao recarregar a página.

RNF-04

Persistência (Fase 2)

Os dados devem ser salvos em um arquivo dados.json no servidor.

RNF-05

Portabilidade

A aplicação web deve ser responsiva e funcionar em navegadores modernos (Chrome, Firefox, Safari).

4. Arquitetura Técnica
4.1. Fase 1: Aplicação Frontend Pura
Linguagens: HTML5, CSS3, JavaScript (ES6+).

Estrutura:

index.html: Estrutura principal da página.

style.css: Estilização e layout.

app.js: Lógica da aplicação (manipulação do DOM, eventos, cálculos e interação com o localStorage).

Armazenamento: Window.localStorage do navegador.

4.2. Fase 2: Arquitetura Cliente-Servidor (2 Camadas)
Frontend (Cliente):

A mesma base da Fase 1 (HTML, CSS, JS).

O app.js será modificado para, em vez de usar o localStorage, fazer chamadas de API (fetch) para o backend.

Backend (Servidor):

Plataforma: Node.js.

Framework: Express.js para criar o servidor web e as rotas da API.

API: Padrão RESTful.

Armazenamento: Um único arquivo dados.json no servidor, lido e escrito pelo Node.js.

5. Modelo de Dados (JSON)
A estrutura de dados principal será um objeto JSON. Na Fase 1, este objeto será armazenado no localStorage. Na Fase 2, será o conteúdo do arquivo dados.json.

{
  "usuario": {
    "nome": "Nome do Usuário",
    "localPadrao": "Nome do Hotel/Pousada",
    "valorDiaria": 150.50
  },
  "hospedagens": {
    "2025-07": {
      "fechado": true,
      "valorCalculado": 1204.00,
      "valorPago": 1200.00,
      "dias": [1, 2, 8, 9, 15, 16, 22, 23]
    },
    "2025-08": {
      "fechado": false,
      "dias": [5, 6, 7]
    }
  }
}

usuario: Objeto com as configurações iniciais.

hospedagens: Objeto onde cada chave é o ano e o mês no formato AAAA-MM.

fechado: Booleano que indica se o mês já foi faturado.

valorCalculado: (Apenas em meses fechados) Valor total calculado pelo sistema (diárias x valor).

valorPago: (Apenas em meses fechados) Valor efetivamente pago, informado pelo usuário.

dias: Um array com os números dos dias em que houve hospedagem.

6. Plano de Desenvolvimento (Fases)
Estrutura HTML e CSS:

Criar o index.html com os campos de input para configuração, a área para os resumos mensais e o botão de ação.

Estilizar a página com style.css para uma aparência limpa e organizada.

Lógica JavaScript (MVP):

Implementar a lógica em app.js para:

Salvar e carregar as configurações do localStorage.

Adicionar a funcionalidade ao botão "Hospedei-me Hoje" (salvando o dia anterior).

Renderizar dinamicamente os resumos do mês atual e anterior.

Implementar a função de expandir/recolher para ver os detalhes dos dias.

Criar a função de "Fechar Mês".

Desenvolvimento do Backend (Node.js):

Configurar um novo projeto Node.js com npm init.

Instalar o Express.js.

Criar a estrutura do servidor em um arquivo server.js.

Implementar as rotas da API (GET e POST) para ler e escrever no arquivo dados.json.

Integração Frontend-Backend:

Modificar o app.js do frontend.

Substituir todas as chamadas ao localStorage por chamadas fetch para a API do backend.

Testar a comunicação entre as duas camadas.