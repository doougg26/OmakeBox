<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../frontend/public/logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="../frontend/public/logo-light.png">
    <img src="../frontend/public/logo-dark.png" alt="OmakeBox Logo" width="80" height="80">
  </picture>
</p>

<h1 align="center">OmakeBox — Frontend</h1>

<p align="center">
  <strong>React 19 · Vite 8 · TanStack React Query · Sass Modules</strong>
  <br>
  Documentação técnica da interface de usuário.
</p>

---

## 📑 Índice

- [Arquitetura](#-arquitetura)
- [Stack](#-stack)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Páginas e Rotas](#-páginas-e-rotas)
- [Componentes](#-componentes)
- [Contextos Globais](#-contextos-globais)
- [Fluxos de Usuário](#-fluxos-de-usuário)
- [Estilização e Temas](#-estilização-e-temas)
- [Deploy](#-deploy)

---

## 🏛️ Arquitetura

O frontend é uma **SPA (Single Page Application)** construída com React 19, utilizando uma arquitetura baseada em **features** para organização do código.

```
┌─────────────────────────────────────────────────┐
│                   App (Root)                      │
│  QueryClientProvider · AuthProvider · ThemeProvider│
│  ToastProvider · BrowserRouter                     │
├─────────────────────────────────────────────────┤
│                    Routes                          │
│  /discovery · /feed · /tracking · /anime/:id      │
│  /perfil/:nickname · /login · /register            │
├─────────────────────────────────────────────────┤
│                  Features (Módulos)                │
│  auth/ · discovery/ · feed/ · tracking/            │
│  community/ · profile/ · stats/ · notifications/   │
│  onboarding/                                       │
├─────────────────────────────────────────────────┤
│               Componentes Compartilhados            │
│  AnimeCard · Avatar · Navbar · Footer · Icon       │
│  SpoilerBlock · ImageWithFallback · BackToTop      │
├─────────────────────────────────────────────────┤
│                  Contextos Globais                  │
│  Auth · Theme · Toast                               │
└─────────────────────────────────────────────────┘
```

### Gerenciamento de Estado

| Tipo | Solução | Detalhes |
|------|---------|----------|
| **Sessão/Usuário** | AuthContext (Context API) | Login, logout, persistência em localStorage |
| **Dados Remotos (API)** | TanStack React Query 5 | Cache automático, stale-while-revalidate, refetch | 
| **Tema** | ThemeContext (Context API) | Dark/Light com persistência |
| **Toast/Notificações** | ToastContext (Context API) | Sistema de notificações toast com auto-dismiss |
| **Estado Local** | useState, useReducer | Estado específico de componentes |

---

## 🛠️ Stack

| Tecnologia | Versão | Finalidade |
|-----------|--------|------------|
| React | 19.x | Biblioteca de UI |
| Vite | 8.x | Bundler e dev server |
| React Router | 7.x | Roteamento SPA |
| TanStack React Query | 5.x | Gerenciamento de dados remotos |
| Axios | 1.x | Cliente HTTP com interceptors |
| Sass | 1.x | Pré-processador CSS |
| Sass Modules | — | CSS modular com escopo |
| Oxlint | 1.x | Linter |

---

## 📂 Estrutura de Pastas

```
frontend/
├── public/
│   ├── logo-dark.png           # Logo tema escuro
│   ├── logo-light.png          # Logo tema claro
│   ├── favicon.svg             # Favicon
│   ├── favicon.png             # Favicon fallback
│   ├── avatar-placeholder.png  # Placeholder de avatar
│   └── icons.svg               # Sprite de ícones
│
├── src/
│   ├── components/             # UI reutilizável e agnóstica
│   │   ├── AnimeCard.jsx / .module.scss    # Card de anime (Discovery, Tracking)
│   │   ├── Avatar.jsx / .module.scss       # Avatar do usuário
│   │   ├── BackToTop.jsx / .module.scss    # Botão voltar ao topo
│   │   ├── Footer.jsx / .module.scss       # Rodapé global
│   │   ├── Icon.jsx                        # Ícones SVG inline
│   │   ├── ImageWithFallback.jsx           # Imagem com fallback
│   │   ├── Navbar.jsx / .module.scss       # Barra de navegação
│   │   ├── PageLayout.jsx                  # Layout padrão (Navbar + Footer)
│   │   └── SpoilerBlock.jsx                # Bloqueio de spoiler
│   │
│   ├── context/                # Contextos globais
│   │   ├── AuthContext.jsx     # Sessão do usuário
│   │   ├── ThemeContext.jsx    # Tema dark/light
│   │   └── ToastContext.jsx    # Notificações toast
│   │
│   ├── features/               # Módulos por funcionalidade
│   │   ├── auth/               # Login e registro
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── AuthPage.module.scss
│   │   │
│   │   ├── discovery/          # Descoberta de animes
│   │   │   ├── DiscoveryPage.jsx
│   │   │   └── DiscoveryPage.module.scss
│   │   │
│   │   ├── feed/               # Feed social
│   │   │   ├── FeedPage.jsx
│   │   │   └── FeedPage.module.scss
│   │   │
│   │   ├── community/          # Página de comunidade do anime
│   │   │   ├── CommunityPage.jsx
│   │   │   └── CommunityPage.module.scss
│   │   │
│   │   ├── tracking/           # Tracking pessoal
│   │   │   ├── TrackingPage.jsx
│   │   │   ├── TrackingPage.module.scss
│   │   │   ├── TrackingDetailPage.jsx
│   │   │   └── TrackingDetailPage.module.scss
│   │   │
│   │   ├── profile/            # Perfil do usuário
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── ProfilePage.module.scss
│   │   │   ├── EditProfileModal.jsx
│   │   │   └── EditProfileModal.module.scss
│   │   │
│   │   ├── stats/              # Estatísticas
│   │   │   ├── StatsPage.jsx
│   │   │   └── StatsPage.module.scss
│   │   │
│   │   ├── notifications/      # Notificações
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── NotificationsPage.module.scss
│   │   │
│   │   └── onboarding/         # Primeiro acesso
│   │       ├── OnboardingPage.jsx
│   │       └── OnboardingPage.module.scss
│   │
│   ├── hooks/                  # Hooks compartilhados
│   │   ├── useDebounce.js      # Debounce para busca
│   │   └── useDocumentTitle.js # Título da aba
│   │
│   ├── routes/
│   │   └── PrivateRoute.jsx    # Rota protegida (redireciona se não autenticado)
│   │
│   ├── services/
│   │   └── api.js              # Instância Axios + interceptors + endpoints
│   │
│   ├── styles/
│   │   ├── global.scss         # Reset, variáveis CSS, utilitários
│   │   └── _variables.scss     # Variáveis SCSS (cores, breakpoints, etc.)
│   │
│   ├── App.jsx                 # Componente raiz (providers, rotas)
│   ├── App.css
│   ├── index.css
│   └── main.jsx                # Entry point (StrictMode + render)
│
├── index.html                  # HTML template
├── vercel.json                 # Configuração Vercel
├── vite.config.js              # Configuração Vite
└── package.json
```

---

## 🗺️ Páginas e Rotas

| Rota | Página | Privada | Descrição |
|------|--------|---------|-----------|
| `/discovery` | DiscoveryPage | — | Home: busca, trending, temporada, filtros |
| `/login` | LoginPage | — | Login |
| `/register` | RegisterPage | — | Cadastro |
| `/onboarding` | OnboardingPage | ✅ | Escolha de anime favorito (pós-cadastro) |
| `/anime/:id` | CommunityPage | — | Detalhes do anime, votação, reviews |
| `/tracking` | TrackingPage | ✅ | Lista de animes acompanhados |
| `/tracking/:malId/details` | TrackingDetailPage | ✅ | Detalhes do tracking + histórico |
| `/perfil/:nickname` | ProfilePage | — | Perfil público + edit modal |
| `/feed` | FeedPage | — | Feed social com posts |
| `/notifications` | NotificationsPage | ✅ | Notificações do usuário |
| `/stats` | StatsPage | — | Estatísticas da plataforma |
| `*` | — | — | Redireciona para `/discovery` |

### PrivateRoute

O componente `PrivateRoute` verifica o `AuthContext` e redireciona para `/login` se o usuário não estiver autenticado.

---

## 🧩 Componentes

### Componentes Compartilhados

#### AnimeCard
Card de anime usado no Discovery, Tracking e Feed. Exibe:

![AnimeCard estrutura]

- Imagem de capa com fallback
- Título do anime
- Score/nota
- Tipo e episódios
- Status de tracking (se aplicável)
- Placeholder shimmer durante loading

#### Avatar
Avatar do usuário com suporte a:
- Imagem personalizada (upload)
- Fallback com iniciais do nickname
- Tamanhos: `xs` (32px), `sm` (40px), `md` (48px), `lg` (64px), `xl` (96px)

#### Navbar
Barra de navegação responsiva com:
- Logo com link para Discovery
- Links: Descobrir, Feed, Estatísticas, Tracking, Perfil
- Botão de tema (dark/light)
- Badge de notificações não lidas
- Menu hamburger no mobile
- Avatar do usuário logado

#### SpoilerBlock
Bloqueia conteúdo sensível com overlay "Clique para revelar". Usado em:
- Posts marcados como spoiler no feed
- Impressões textuais no perfil

#### Icon
Ícones SVG inline (Lucide icons via strings SVG). Ícones disponíveis:

| Nome | Uso |
|------|-----|
| `search`, `compass` | Discovery |
| `feed`, `list` | Feed, Tracking |
| `user`, `userPlus` | Perfil, Cadastro |
| `heart`, `messageCircle` | Likes, Comentários |
| `bell`, `bellOff` | Notificações |
| `sun`, `moon` | Tema |
| `star`, `barChart` | Avaliações, Estatísticas |
| `checkCircle`, `alertCircle`, `alertTriangle`, `info` | Toast |
| `chevronLeft`, `chevronRight` | Paginação |
| `menu`, `close`, `moreHorizontal` | Navegação |
| `upload`, `camera`, `trash2` | Avatar |

#### ImageWithFallback
Imagem que exibe um placeholder SVG se a URL falhar ao carregar.

#### BackToTop
Botão flutuante que aparece ao scrollar para baixo e leva ao topo da página.

#### PageLayout
Wrapper que adiciona Navbar e Footer ao redor do conteúdo da página.

---

## 🌐 Contextos Globais

### AuthContext

Gerencia toda a autenticação do usuário.

```javascript
const { user, login, register, logout, loading, isAuthenticated } = useAuth();
```

- **Persistência:** User salvo em `localStorage`
- **Token:** Access token e refresh token em `localStorage`
- **Verificação:** Ao montar, verifica se token existe e busca dados atuais via `GET /users/me`
- **Logout:** Limpa tokens e user do localStorage

### ThemeContext

Gerencia o tema (dark/light).

```javascript
const { theme, toggleTheme } = useTheme();
```

- **Detecção:** Preferência do sistema (`prefers-color-scheme`)
- **Persistência:** Tema salvo em `localStorage`
- **Aplicação:** Atributo `data-theme` no `<html>`
- **Transição:** CSS transition suave nas cores

### ToastContext

Sistema de notificações toast.

```javascript
const { success, error, info, warning, confirm } = useToast();
```

- **Tipos:** success, error, info, warning, confirm
- **Auto-dismiss:** 4 segundos (configurável)
- **Confirmação:** Retorna Promise com true/false
- **Animação:** Entrada/saída com slide
- **Posição:** Topo direito, empilhado

---

## 🔄 Fluxos de Usuário

### Autenticação

```
Usuário não logado
    │
    ├── /login → LoginPage
    │           ├── Form: identifier (nickname/email) + senha
    │           └── POST /auth/login → AuthContext.login()
    │
    ├── /register → RegisterPage
    │               ├── Form: nickname + email + senha
    │               └── POST /auth/register → AuthContext.register()
    │                                      → Redirect para /onboarding
    │
    └── → Redirect para /discovery (autenticado)
```

### Onboarding (Primeiro Acesso)

```
Register → Redirect /onboarding
    │
    ├── Busca anime por título
    │   └── animeApi.search(query) — debounce 400ms
    │
    ├── Seleciona anime favorito
    │   └── POST /onboarding/favorite-anime
    │
    └── Redireciona para /discovery
```

### Descoberta (Discovery)

```
/discovery
    │
    ├── Trending (top anime)
    │   └── GET /anime/trending?page=
    │
    ├── Temporada Atual
    │   └── GET /anime/season?year=&season=&page=
    │
    ├── Busca por Título
    │   └── Input → debounce 400ms → GET /anime/search?q=&page=
    │
    ├── Filtro por Gênero
    │   └── GET /anime/by-genre?genre=&page=
    │
    └── Filtros adicionais: Tipo (TV/Movie/OVA) · Nota Mínima
```

### Tracking

```
/tracking → Lista de animes acompanhados
    │
    ├── Cada anime → status, progresso
    │
    ├── Clique em "Assistir Episódio"
    │   └── POST /tracking/:malId/watch-episode
    │
    ├── Clique no anime → /tracking/:malId/details
    │   └── GET /tracking/:malId/details
    │       ├── Informações do anime
    │       ├── Progresso percentual + gráfico
    │       ├── Episódios assistidos (histórico)
    │       └── Ações: atualizar status/nota/impressão
    │
    └── Adicionar anime → modal de busca
```

### Feed Social

```
/feed → Lista de posts (paginado)
    │
    ├── Criar post
    │   ├── Busca anime → seleciona → escreve texto
    │   ├── Opção: marcar como spoiler
    │   └── POST /feed
    │
    ├── Curtir post
    │   └── POST /feed/:postId/like
    │
    ├── Comentar
    │   └── POST /feed/:postId/comments
    │
    └── Ver detalhes do post
        └── GET /feed/:postId
```

### Comunidade do Anime

```
/anime/:malId → Página do anime
    │
    ├── Detalhes: sinopse, capa, episódios, gêneros
    ├── Nota pessoal (0-10) + média da comunidade
    ├── Votação de personagem (1 voto por anime)
    ├── Reviews/impressões (com spoiler block)
    └── Postagens relacionadas
```

### Perfil

```
/perfil/:nickname → Perfil público
    │
    ├── Informações: avatar, bio, links sociais
    ├── Anime favorito
    ├── Trackings públicos
    ├── Posts do usuário
    │
    └── Se for o próprio perfil:
        ├── Editar perfil (modal)
        ├── Upload/remover avatar
        └── Editar anime favorito
```

---

## 🎨 Estilização e Temas

### Sistema de Temas

O projeto usa **CSS Custom Properties** para temas dark e light, alternados via atributo `data-theme` no `<html>`.

```scss
// Tema Escuro (padrão)
[data-theme="dark"] {
  --bg-dark: #0f1923;
  --bg-base: #1a2a3a;
  --bg-card: #2a3d4f;
  --text-primary: #e8edf2;
  --text-secondary: #9aafc4;
  // ...
}

// Tema Claro
[data-theme="light"] {
  --bg-dark: #f4f6f8;
  --bg-base: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1a2332;
  --text-secondary: #4a5a6e;
  // ...
}
```

### Variáveis SCSS

Em `_variables.scss`, as variáveis são mapeadas das CSS Custom Properties:

```scss
$primary: var(--primary);          // #1e7682
$bg-base: var(--bg-base);          // Dinâmico por tema
$text-primary: var(--text-primary); // Dinâmico por tema
$shadow-md: var(--shadow-md);       // Dinâmico por tema
```

### Breakpoints

```scss
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop pequeno
$breakpoint-xl: 1280px;  // Desktop grande
```

### Utilities CSS Globais

Em `global.scss`:

- `.container` — Container centralizado (max 1200px)
- `.card` — Card com sombra e hover
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-danger` — Botões
- `.input` — Input estilizado
- `.spinner` — Loading spinner
- `.error-text` — Texto de erro
- `.hide-mobile` / `.hide-desktop` — Responsive helpers

---

## 🔌 API Client (Axios)

### Configuração

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://omakebox-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

### Interceptors

**Request:** Adiciona `Authorization: Bearer <token>` automaticamente.

**Response (401):** Tenta refresh automático:
1. Chama `POST /auth/refresh` com refresh token
2. Se sucesso: atualiza tokens no localStorage e retry da requisição original
3. Se falha: limpa sessão e redireciona para `/login`

### API Services

| Módulo | Endpoints |
|--------|-----------|
| `authApi` | register, login, refresh |
| `userApi` | getMe, getProfile, updateMe, avatar CRUD |
| `animeApi` | getTrending, search, getSeason, getByGenre, getById |
| `communityApi` | getAnimeDetails, voteCharacter, rateAnime, getReviews |
| `trackingApi` | upsertTracking, watchEpisode, getDetails, getStats |
| `feedApi` | getFeed, createPost, likePost, addComment |
| `connectionApi` | getConnections, sendRequest, acceptRequest |
| `notificationApi` | getNotifications, markAsRead, getUnreadCount |
| `onboardingApi` | setFavoriteAnime |
| `translateApi` | translate |

---

## 🚀 Deploy

### Vercel

O deploy é configurado via `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|---------|-------------|--------|-----------|
| `VITE_API_URL` | — | https://omakebox-api.onrender.com/api | URL base da API |

### Comandos

```bash
npm run dev       # Dev server (Vite)
npm run build     # Build de produção
npm run preview   # Preview do build
npm run lint      # Oxlint
```

---

## 🧪 Principais Hooks

### useDebounce

```javascript
const debouncedSearch = useDebounce(searchQuery, 400);
```

Retorna o valor atualizado após o delay especificado sem mudanças. Usado para evitar chamadas excessivas à API durante a digitação.

### useDocumentTitle

```javascript
useDocumentTitle('Discovery');
```

Atualiza o título da aba do navegador com prefixo "OmakeBox — {title}".

---

## 🎯 Funcionalidades por Página

### DiscoveryPage
- Busca com debounce (400ms)
- Abas: Temporada atual / Em Alta (trending)
- Filtros: Gênero (30+), Tipo (TV/Movie/OVA), Nota Mínima
- Grid responsivo com AnimeCards
- Paginação
- Skeleton loading
- Tratamento de erro com mensagens específicas
- Cache Jikan: `_stale` banner quando dados estão desatualizados

### CommunityPage
- Detalhes completos do anime
- Sistema de avaliação (0-10) com média
- Votação de personagem (1 voto ativo)
- Reviews com spoiler block por progresso
- Ranking de personagens

### TrackingPage / TrackingDetailPage
- Grid de animes acompanhados por status
- Progresso percentual com barra
- Watch episode (incrementa + histórico)
- Gráfico de distribuição de status (TrackingDetailPage)
- Estatísticas: total episódios, tempo gasto, médias
- Modal de busca para adicionar tracking

### FeedPage
- Feed infinito (paginação)
- Criação de post com busca de anime
- Sistema de likes e comentários
- Spoiler toggle
- Auto-refresh na criação

### ProfilePage
- Perfil público com avatar, bio, links
- Abas: Trackings, Posts
- EditProfileModal (bio, links, anime favorito, avatar)
- Upload de avatar com preview

### StatsPage
- Estatísticas globais da plataforma
- Cards informativos

### NotificationsPage
- Lista de notificações
- Marcar como lida / todas
- Badge de não lidas na Navbar
- Tipos: curtida, comentário, conexão
