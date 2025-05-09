Teste Técnico - Gerenciamento de Usuários com NestJS

Uma aplicação backend construída com NestJS para cadastro, gerenciamento e autenticação de usuários com controle de permissões.

Descrição
Este projeto é a implementação do backend para um teste técnico de desenvolvedor full-stack, focado na construção de uma API para cadastro e gerenciamento de usuários com controle de acesso. A aplicação permite:

Autenticação de usuários via JWT.
CRUD de usuários (criar, listar, visualizar, atualizar, excluir).
Controle de permissões baseado em níveis de acesso (Admin, Gerente, Comum) usando CASL.
Armazenamento seguro de dados no PostgreSQL com TypeORM, incluindo senhas criptografadas com bcrypt.
Validações robustas (ex.: email único) e mensagens de erro claras.

O projeto segue uma arquitetura modular com NestJS, utilizando boas práticas como validação de DTOs, aliases para imports, e configuração de ambiente com .env. A estrutura está preparada para integração com um frontend em React/Next.js (a ser implementado).
Requisitos do Teste Técnico

Entidade User: Campos id, name, email (único), password (criptografado), role (admin, gerente, comum).
Autenticação: Login com JWT, token com expiração (1 hora).
Permissões:
Admin: Pode criar, editar (incluindo role), visualizar e excluir qualquer usuário.
Gerente: Pode visualizar todos os usuários e editar name, email, password (não role).
Comum: Só pode visualizar e editar seu próprio perfil.

Segurança: Senhas criptografadas, validação de email único, erros claros (ex.: 400 para email duplicado, 401 para não autenticado, 403 para permissões insuficientes).
Cenários de Teste:
Usuário não autenticado acessa /users → 401 Unauthorized.
Usuário comum acessa listagem de usuários → 403 Forbidden.
Gerente altera role → 403 Forbidden.
Admin edita usuário → 200 OK.
Cadastro com email duplicado → 400 Email already in use.

Estrutura do Projeto
A aplicação segue uma arquitetura modular, com os seguintes módulos e pastas:
meu-projeto/
├── src/
│ ├── auth/
│ │ ├── dtos/
│ │ │ └── login.dto.ts # DTO para login
│ │ ├── auth.controller.ts # Endpoints de autenticação
│ │ ├── auth.service.ts # Lógica de autenticação
│ │ ├── auth.module.ts # Módulo de autenticação
│ │ ├── jwt-auth.guard.ts # Guarda JWT
│ │ └── jwt.strategy.ts # Estratégia JWT
│ ├── users/
│ │ ├── dtos/
│ │ │ ├── create-user.dto.ts # DTO para criar usuário
│ │ │ └── update-user.dto.ts # DTO para atualizar usuário
│ │ ├── user.entity.ts # Entidade User
│ │ ├── users.controller.ts # Endpoints do CRUD
│ │ ├── users.service.ts # Lógica do CRUD
│ │ └── users.module.ts # Módulo de usuários
│ ├── shared/
│ │ ├── abilities.ts # Regras de permissão CASL
│ │ ├── casl.guard.ts # Guarda de permissões
│ │ └── shared.module.ts # Módulo compartilhado
│ ├── config/
│ │ ├── env.validation.ts # Validação de variáveis de ambiente
│ │ └── configuration.ts # Configurações gerais
│ ├── app.module.ts # Módulo raiz
│ └── main.ts # Ponto de entrada
├── .env # Variáveis de ambiente
├── docker-compose.yml # Configuração do PostgreSQL
├── .eslintrc.js # Configuração do ESLint
├── .eslintignore # Arquivos ignorados pelo ESLint
├── .prettierrc # Configuração do Prettier
├── tsconfig.json # Configuração do TypeScript
├── package.json # Dependências e scripts
└── README.md # Documentação

Módulos Implementados

UsersModule: Gerencia o CRUD de usuários, com entidade User e validações (email único, senhas criptografadas).
AuthModule: Implementa autenticação com JWT (endpoint /auth/login, token com expiração).
SharedModule: Define regras de permissão com CASL e um CaslGuard para proteger rotas.

Pré-requisitos

Node.js (versão 18 ou superior)
npm (versão 9 ou superior)
Docker e Docker Compose (para rodar o PostgreSQL)
Git (opcional, para controle de versão)

Instalação

Clone o repositório (se aplicável):
git clone https://github.com/marden-melo/user-history-api.git
cd user-history-api

Instale as dependências:
npm install

As dependências incluem:

Produção: @nestjs/core, @nestjs/common, @nestjs/platform-express, typeorm, pg, @nestjs/typeorm, @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt, @casl/ability, class-validator, class-transformer, @nestjs/config, module-alias.
Desenvolvimento: jest, @nestjs/testing, ts-jest, @types/jest, @types/node, @types/bcrypt, eslint, prettier, eslint-config-prettier, eslint-plugin-prettier, @typescript-eslint/parser, @typescript-eslint/eslint-plugin.

Configure o arquivo .env:Crie um arquivo .env na raiz do projeto com o seguinte conteúdo:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=myapp
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
PORT=3000

Inicie o PostgreSQL com Docker:
docker-compose up -d

Compilar e Executar

# Modo de desenvolvimento (com hot-reload)

npm run start:dev

# Modo de produção

npm run build
npm run start:prod

A aplicação estará disponível em http://localhost:3000.
Endpoints da API
Autenticação

POST /auth/login
Corpo: { "email": "user@example.com", "password": "password123" }
Resposta: { "access_token": "jwt-token" }
Erro: 401 Unauthorized (credenciais inválidas)

Usuários

POST /users (cria usuário, exige autenticação e permissão de admin)
Corpo: { "name": "John Doe", "email": "john@example.com", "password": "password123", "role": "comum" }
Resposta: { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "comum" }
Erros: 400 (email duplicado), 401 (não autenticado), 403 (sem permissão)

GET /users (lista usuários, exige autenticação e permissão de admin/gerente)
Resposta: [{ "id": 1, "name": "John Doe", "email": "john@example.com", "role": "comum" }, ...]
Erros: 401, 403

GET /users/:id (visualiza usuário, exige autenticação e permissão)
Resposta: { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "comum" }
Erros: 401, 403

PATCH /users/:id (atualiza usuário, exige autenticação e permissão)
Corpo: { "name": "Jane Doe", "email": "jane@example.com" }
Resposta: { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "comum" }
Erros: 400, 401, 403

DELETE /users/:id (exclui usuário, exige autenticação e permissão de admin)
Resposta: (vazio, status 204)
Erros: 401, 403

Testes
Os testes unitários e de integração estão em desenvolvimento. Para executar os testes existentes:

# Testes unitários

npm run test

# Testes com cobertura

npm run test:cov

Linting e Formatação
O projeto usa ESLint e Prettier para manter a consistência do código.

# Verificar linting

npm run lint

# Corrigir problemas de linting

npm run lint:fix

# Formatar código

npm run format

Deploy
Para deploy em produção, siga as recomendações do NestJS Deployment. Algumas sugestões:

Desative synchronize: true no TypeORM e use migrações.
Configure um provedor de hospedagem (ex.: AWS, Heroku).
Use o NestJS Mau para deploy simplificado no AWS:npm install -g @nestjs/mau
mau deploy

Próximos Passos

Testes: Implementar testes unitários e de integração para UsersService, AuthService, e endpoints.
Frontend: Desenvolver a interface com React/Next.js, Tailwind CSS, e Context API, incluindo:
Login e armazenamento de JWT.
Listagem de usuários (admin/gerente).
Formulários de cadastro/edição com validação.
Restrições visuais com CASL.

Documentação: Adicionar Swagger para documentação da API.
Segurança: Configurar logging de erros e monitoramento.

Recursos

NestJS Documentation
TypeORM Documentation
CASL Documentation
NestJS Discord
NestJS Courses

Suporte
Este projeto é um teste técnico e não possui suporte oficial. Para dúvidas, consulte a documentação do NestJS ou entre em contato com a comunidade no Discord.
Licença
Este projeto é licenciado sob a MIT License.
