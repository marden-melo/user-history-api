User History API

Pré-requisitos

Node.js: Versão 18 ou superior
npm: Versão 9 ou superior
Docker e Docker Compose: Para rodar o PostgreSQL

Instalação
Siga os passos abaixo para configurar e executar o projeto localmente.

1. Clone o Repositório
   git clone https://github.com/marden-melo/user-history-api.git
   cd user-history-api

2. Instale as Dependências
   npm install

As principais dependências incluem:

Produção: @nestjs/core, @nestjs/typeorm, typeorm, pg, @nestjs/jwt, bcrypt, @casl/ability, class-validator, @nestjs/config, entre outros.
Desenvolvimento: jest, @nestjs/testing, eslint, prettier, ts-jest, entre outros.

3. Configure o Arquivo .env (copair e colar de .env.example)
   Crie um arquivo .env na raiz do projeto e cole dentro desse arquivo o conteúdo de .env.example:

4. Inicie o PostgreSQL com Docker
   docker-compose up -d

Isso iniciará um container PostgreSQL com as configurações definidas no docker-compose.yml. 5. Execute as Migrações do Banco de Dados
Para criar as tabelas necessárias no banco de dados:
npm run migration:run

Compilar e Executar
Modo de Desenvolvimento (com hot-reload)
npm run start:dev

Modo de Produção
npm run build
npm run start:prod

A API estará disponível em http://localhost:3333, e a documentação Swagger pode ser acessada em http://localhost:3333/api.

Testes
Para executar os testes existentes:

Testes Unitários
npm run test

Documentação: Aprimorar a documentação Swagger da API.
Segurança: Configurar logging de erros e monitoramento.

Sistema de e-mail utilizado - Brevo

SEED criando um usuário admin no banco

email: admin@example.com
password: Test123!
name: Admin

Autor: Marden Melo
Repositório: https://github.com/marden-melo/user-history-api
