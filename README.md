<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="frontend/public/logo-light.png">
    <img src="frontend/public/logo-dark.png" alt="OmakeBox Logo" width="120" height="120">
  </picture>
</p>

<h1 align="center">OmakeBox</h1>

<p align="center">
  <strong>Anime Tracking & Social Platform</strong>
  <br>
  Descubra, acompanhe e compartilhe sua jornada no mundo dos animes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js" alt="Node.js 22">
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express" alt="Express 4">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize" alt="Sequelize 6">
  <br>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite 8">
  <img src="https://img.shields.io/badge/Vercel-000000?logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/Render-46E3B7?logo=render" alt="Render">
  <img src="https://img.shields.io/badge/Neon-00E599?logo=neon" alt="Neon">
</p>

---

## 📋 Sobre o Projeto

**OmakeBox** é uma plataforma web completa para fãs de animes que desejam:

- **Descobrir** novos animes por temporada, gênero ou tendências via [Jikan API](https://docs.api.jikan.moe/) (MyAnimeList)
- **Acompanhar** seu progresso de episódios com tracking personalizado
- **Avaliar** obras com notas e impressões textuais
- **Votar** em personagens favoritos por anime
- **Socializar** através de um feed com posts, curtidas e comentários
- **Conectar-se** com outros usuários e receber notificações
- **Visualizar** estatísticas detalhadas do seu consumo de animes

### 🎯 Deploys

| Ambiente | URL |
|----------|-----|
| **Frontend** | [https://omake-box.vercel.app](https://omake-box.vercel.app) |
| **Backend** | [https://omakebox-api.onrender.com](https://omakebox-api.onrender.com) |
| **API Health** | [https://omakebox-api.onrender.com/api/health](https://omakebox-api.onrender.com/api/health) |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Vercel)                │
│  React 19 · React Router · React Query · Axios   │
│  Sass Modules · Vite 8                           │
├─────────────────────────────────────────────────┤
│                   Backend (Render)                │
│  Node.js 22 · Express 4 · JWT · bcrypt · Joi     │
│  Sequelize 6 · MVC + SOLID                        │
├─────────────────────────────────────────────────┤
│                Database (Neon/PostgreSQL)          │
│                  Serverless Postgres               │
├─────────────────────────────────────────────────┤
│              External API (Jikan/MyAnimeList)      │
│                Dados somente leitura               │
└─────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| **Frontend** | React 19, Vite 8 | Interface de usuário SPA |
| **Roteamento** | React Router 7 | Navegação SPA |
| **Estado Remoto** | TanStack React Query 5 | Cache e gerenciamento de requisições |
| **HTTP** | Axios | Cliente HTTP com interceptors JWT |
| **Estilização** | Sass Modules | CSS modular com temas dark/light |
| **Backend** | Node.js 22, Express 4 | API REST |
| **ORM** | Sequelize 6 | Mapeamento objeto-relacional |
| **Autenticação** | JWT + bcrypt | Access/refresh tokens |
| **Validação** | Joi | Schemas de validação |
| **Upload** | Multer | Upload de avatares |
| **Database** | PostgreSQL 16 (Neon) | Banco de dados serverless |
| **Integração** | Jikan API v4 | Dados de animes (MyAnimeList) |

---

## 📁 Estrutura do Projeto

```
omakeBox/
├── frontend/                    # Aplicação React
│   ├── src/
│   │   ├── components/          # UI reutilizável
│   │   ├── context/             # Contextos globais (Auth, Theme, Toast)
│   │   ├── features/            # Módulos por funcionalidade
│   │   ├── hooks/               # Hooks compartilhados
│   │   ├── routes/              # Rotas protegidas
│   │   ├── services/            # API client (Axios)
│   │   └── styles/              # Temas e variáveis SCSS
│   ├── public/                  # Assets estáticos, logo, favicon
│   └── vite.config.js
│
├── backend/                     # API Node.js
│   ├── src/
│   │   ├── config/              # Config (DB, env, migrator)
│   │   ├── controllers/         # Handlers HTTP
│   │   ├── integrations/        # JikanClient (cache + API externa)
│   │   ├── middlewares/         # Auth, validação, error handler
│   │   ├── models/              # Modelos Sequelize
│   │   ├── repositories/        # Acesso a dados
│   │   ├── routes/              # Definição de endpoints
│   │   ├── services/            # Regras de negócio
│   │   ├── utils/               # AppError
│   │   └── validators/          # Schemas Joi
│   ├── migrations/              # Migrations do banco
│   ├── tests/                   # Testes unitários (Jest)
│   └── server.js                # Entry point
│
├── docs/                        # Documentação detalhada
│   ├── backend.md               # Documentação do backend
│   └── frontend.md              # Documentação do frontend
│
├── README.md                    # Este arquivo
└── spec OmakeBox.md             # Especificação técnica original
```

---

## 🚀 Começando

### Pré-requisitos

- Node.js 22.x
- PostgreSQL 16 (local ou Neon)
- npm 10+

### Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/doougg26/omakeBox-api
cd omakeBox

# 2. Instale as dependências do backend
cd backend
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações (DB, JWT, etc.)

# 4. Rode as migrations
npm run migrate

# 5. Inicie o backend
npm run dev

# 6. Em outro terminal, instale e inicie o frontend
cd frontend
npm install
npm run dev
```

### Variáveis de Ambiente

#### Backend (.env)

| Variável | Obrigatório | Padrão | Descrição |
|---------|-------------|--------|-----------|
| `DATABASE_URL` | Sim (prod) | — | Connection string PostgreSQL (Neon) |
| `DB_HOST` | Local | localhost | Host do banco |
| `DB_PORT` | Local | 5432 | Porta do banco |
| `DB_NAME` | Local | omakebox | Nome do banco |
| `DB_USER` | Local | postgres | Usuário do banco |
| `DB_PASSWORD` | Local | postgres | Senha do banco |
| `JWT_SECRET` | Sim | — | Chave do access token |
| `JWT_REFRESH_SECRET` | Sim | — | Chave do refresh token |
| `FRONTEND_URL` | Sim | http://localhost:5173 | URL do frontend (CORS) |
| `PORT` | — | 3001 | Porta do servidor |
| `NODE_ENV` | — | development | Ambiente |

#### Frontend (.env)

| Variável | Obrigatório | Padrão | Descrição |
|---------|-------------|--------|-----------|
| `VITE_API_URL` | — | https://omakebox-api.onrender.com/api | URL base da API |

---

## 🧪 Testes

```bash
# Backend - testes unitários
cd backend
npm test

# Com coverage
npm run test:coverage
```

---

## 📚 Documentação Detalhada

- **[Documentação do Backend](docs/backend.md)** — Arquitetura MVC + SOLID, endpoints da API, modelos de dados, serviços
- **[Documentação do Frontend](docs/frontend.md)** — Componentes, páginas, fluxos, contextos, hooks

---

## 🎨 Identidade Visual

| Elemento | Cor | Hex |
|----------|-----|-----|
| **Primária** | Teal | `#1e7682` |
| **Primária Light** | Teal Claro | `#2a9aa8` |
| **Secundária** | Coral | `#d46357` |
| **Fundo Escuro** | Azul Profundo | `#0f1923` |
| **Fundo Claro** | Cinza Claro | `#f4f6f8` |

O projeto suporta tema **Dark** e **Light** com detecção automática do sistema e persistência em `localStorage`.

---

## 🔗 Links Rápidos

| Recurso | Link |
|---------|------|
| **Jikan API Docs** | [https://docs.api.jikan.moe/](https://docs.api.jikan.moe/) |
| **Neon Console** | [https://console.neon.tech](https://console.neon.tech) |
| **Render Dashboard** | [https://dashboard.render.com](https://dashboard.render.com) |
| **Vercel Dashboard** | [https://vercel.com](https://vercel.com) |

---

## 📄 Licença

Projeto pessoal. Dados de animes via [MyAnimeList](https://myanimelist.net) / [Jikan API](https://jikan.moe).
