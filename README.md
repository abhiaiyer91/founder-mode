# 🎮 Founder Mode

> *Build a real startup. Ship real code. Play the game.*

**Founder Mode** is a real-time strategy game where you manage a startup and your AI team builds actual software. Think *Civilization* meets *Y Combinator* — select your engineers, assign them to tasks, and watch real code get generated.

![Founder Mode](https://img.shields.io/badge/status-alpha-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![React](https://img.shields.io/badge/React-19-cyan) ![Tests](https://img.shields.io/badge/tests-270%20passing-green)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/founder-mode.git
cd founder-mode

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Add your OpenAI API key to .env
# OPENAI_API_KEY=sk-your-key-here

# Start PostgreSQL
docker compose up -d

# Push database schema
pnpm db:push

# Start everything (frontend + server)
pnpm start
```

This starts:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:3001](http://localhost:3001)
- **Database Studio**: `pnpm db:studio`

---

## 📋 Requirements

| Tool | Version | Required | Notes |
|------|---------|----------|-------|
| Node.js | 18+ | Yes | 20+ recommended |
| pnpm | 8+ | Yes | `npm install -g pnpm` |
| Docker | 20+ | Yes | For PostgreSQL |
| OpenAI API Key | - | Yes | For AI code generation |

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database (PostgreSQL)
DATABASE_URL=postgres://founder:founder123@localhost:5432/founder_mode

# AI (OpenAI)
OPENAI_API_KEY=sk-your-key-here

# Server
PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001

# GitHub OAuth - Optional, for pushing code to GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start frontend + server (one command!) |
| `pnpm dev` | Start frontend only (port 5173) |
| `pnpm dev:server` | Start API server only (port 3001) |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Lint the codebase |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

---

## 🏗️ Project Structure

```
founder-mode/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # UI components
│   │   ├── screens/        # Full-page screens (Dashboard, RTS, etc.)
│   │   └── tui/            # Terminal-style UI components
│   ├── game/               # Game systems
│   │   └── campus/         # Isometric campus view (Phaser 3)
│   ├── lib/                # Utilities
│   │   ├── ai/             # AI integration layer
│   │   ├── git/            # Virtual git system
│   │   └── pm/             # PM brain (autonomous planning)
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript definitions
│
├── server/                 # Backend (Express + Mastra)
│   ├── mastra/             # AI agent framework
│   │   ├── agents/         # Agent definitions (engineer, pm, etc.)
│   │   └── tools/          # AI tools (code gen, design, etc.)
│   ├── routes/             # API endpoints
│   └── db/                 # Database schema (Drizzle)
│
├── public/                 # Static assets
├── docker-compose.yml      # PostgreSQL setup
├── drizzle.config.ts       # Database config
└── vite.config.ts          # Vite config
```

---

## 🎮 Game Views

| View | Hotkey | Description |
|------|--------|-------------|
| RTS | `R` | Isometric office view (default) |
| Campus | `V` | 3D campus visualization (Phaser) |
| Dashboard | `D` | Split-panel overview |
| Command | `C` | Terminal-style command center |
| Queue | `Q` | Task import queue |
| Missions | `M` | Git-based feature branches |
| Artifacts | `A` | AI-generated code viewer |
| Preview | `P` | Live code preview (Sandpack) |
| Tech | `U` | Upgrade tree |
| Achievements | `Y` | Trophy room |

---

## 🚢 Deployment (Railway)

Deploy to [Railway](https://railway.app):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables

Add these in the Railway dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway Postgres (auto-provisioned) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GITHUB_CLIENT_ID` | For GitHub OAuth (optional) |
| `GITHUB_CLIENT_SECRET` | For GitHub OAuth (optional) |
| `FRONTEND_URL` | Your Railway app URL |

---

## 🔑 Setting Up GitHub OAuth

To enable "Push to GitHub" functionality:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Founder Mode
   - **Homepage URL**: `http://localhost:5173` (dev) or your production URL
   - **Authorization callback URL**: `http://localhost:3001/api/oauth/github/callback`
4. Copy Client ID and Client Secret to `.env`

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# With coverage report
pnpm test:coverage
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (React 19 + Vite)                                  │
│  ├── Zustand Store ──→ localStorage (instant, offline)     │
│  ├── Phaser 3 ──→ Isometric campus view                    │
│  ├── Sandpack ──→ Live code preview                        │
│  └── Game API Client ──→ HTTP                              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  SERVER (Express 5 + Mastra)                   :3001        │
│  ├── /api/game/* ──→ Save/Load game state                  │
│  ├── /api/agents/* ──→ AI agent execution                  │
│  ├── /api/oauth/* ──→ GitHub OAuth flow                    │
│  └── /api/integrations/* ──→ GitHub/Linear import          │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  DATABASE (PostgreSQL + Drizzle ORM)                        │
│  └── Game saves, user sessions, AI logs                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Integration

The game uses [Mastra](https://mastra.ai) for AI agents:

| Agent | Role | Tools |
|-------|------|-------|
| Engineer | Write code | `generateComponent`, `fixBug`, `writeTests` |
| PM | Plan work | `breakdownProject`, `prioritizeTasks` |
| Designer | Create styles | `createDesignSystem`, `createStyles` |
| Marketer | Write copy | `createLandingCopy`, `createSocialPost` |

---

## 🎯 Features

### Core Gameplay
- ✅ Hire employees (engineers, designers, PMs, marketers)
- ✅ Create and assign tasks
- ✅ AI generates real code, designs, and copy
- ✅ Multiple game views (RTS, Dashboard, Command Center)
- ✅ Hotkeys and control groups (like StarCraft)

### AI Features
- ✅ Real code generation with OpenAI
- ✅ Agent memory (employees remember past work)
- ✅ Task artifacts (view all AI output)
- ✅ Live preview of generated code

### Integrations
- ✅ GitHub OAuth for pushing code
- ✅ GitHub Issues import
- ✅ Linear Issues import
- ✅ Continuous git tracking

### Polish
- ✅ 25 achievements
- ✅ Random events with choices
- ✅ Autopilot mode
- ✅ Focus mode
- ✅ Mobile responsive

---

## 🗺️ Roadmap

- [ ] Multiple AI providers (Anthropic, Google, Ollama)
- [ ] Project templates (SaaS, mobile app, CLI tool)
- [ ] Multiplayer co-founder mode
- [ ] Deploy generated apps to Vercel/Netlify
- [ ] Real git repositories (not just virtual)

---

## 🤝 Contributing

Contributions welcome!

```bash
# Fork and clone
git clone https://github.com/your-username/founder-mode.git
cd founder-mode

# Install and start
pnpm install
pnpm start

# Make changes and test
pnpm test
pnpm lint

# Submit a PR!
```

---

## 📜 License

MIT License - Build something awesome!

---

<p align="center">
  <i>"Move fast and build things."</i>
  <br><br>
  Made with ☕ and questionable decisions
</p>
