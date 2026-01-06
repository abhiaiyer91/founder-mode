# 🎮 Founder Mode

> *Build a real startup. Ship real code. Play the game.*

**Founder Mode** is a real-time strategy game where you manage a startup and your AI team builds actual software. Think *Civilization* meets *Y Combinator* — select your engineers, assign them to tasks, and watch real code get generated.

**The twist?** Your team uses AI to generate actual code, designs, and marketing copy that you can use in real projects.

![Founder Mode](https://img.shields.io/badge/status-alpha-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![React](https://img.shields.io/badge/React-19-cyan)

---

## 🏰 Isometric RTS View (NEW!)

The default view is now an **isometric RTS game view** inspired by Civilization and Warcraft:

```
                    🏗️ Engineering           🎨 Design
                   ┌─────────────┐        ┌─────────┐
                   │   👩‍💻 👨‍💻      │        │   🎨    │
                   │  ███████    │        │  ████   │
                   └─────────────┘        └─────────┘
                
       📢 Marketing              📋 Product           ☕ Break Room
      ┌─────────┐              ┌─────────┐         ┌─────────┐
      │  🔒     │              │   📊    │         │   🔒    │
      │ $20k   │              │  ████   │         │ 3 emp   │
      └─────────┘              └─────────┘         └─────────┘
```

**Features:**
- **Isometric Grid** - Buildings arranged on an isometric plane
- **Unit Sprites** - Animated employees with health/morale bars
- **Fog of War** - Buildings unlock as you grow (hire, earn money, complete tasks)
- **Selection Box** - Drag to select multiple units
- **Minimap** - See your entire office at a glance
- **Floating Resources** - +$1,000 floating numbers when you earn money
- **Command Panel** - Quick actions for selected units

**Fog of War Unlock Requirements:**
| Building | Unlock Requirement |
|----------|-------------------|
| Engineering | Always unlocked |
| Design | Hire 1 employee |
| PM | Hire 2 employees |
| Marketing | Earn $20,000 |
| Break Room | Hire 3 employees |
| Servers | Complete 5 tasks |

---

## 🎮 Multiple Game Views

The **Command Center** is your main headquarters showing everything at once:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏢 COMMAND CENTER                              🎮 Command 📋 Tasks 👥 Team  │
├──────────────────┬─────────────────────────────────┬────────────────────────┤
│ 👥 Team (4)      │ 📋 Tasks                        │ 🎯 Project: MyApp      │
│                  │                                 │ [████████░░] 67%       │
│ 👨‍💻 Alex      ⚡78│ 📥 Todo (3) │ 🔨 Active (2)    │                        │
│ [████░░] 67%     │ ┌─────────┐ │ ┌─────────────┐  │ ────────────────────── │
│                  │ │✨Feature│ │ │🐛 Fix login │  │ 📜 Activity            │
│ 👩‍💻 Sam       ⚡85│ │Dashboard│ │ │ 👨‍💻 Alex     │  │ ▸ Alex started task   │
│ [idle]           │ │+Assign  │ │ │ [███░░] 45% │  │ ▸ Sam hired            │
│                  │ └─────────┘ │ └─────────────┘  │ ▸ Bug discovered!      │
│ 🎨 Jordan    ⚡72│             │                  │                        │
│ [████████] 100%  │             │ 👀 Review (1)    │                        │
│                  │             │ ┌─────────────┐  │                        │
│ 📊 Casey     ⚡90│             │ │🎨 UI polish │  │                        │
│ [idle]           │             │ │[✓ Approve]  │  │                        │
└──────────────────┴─────────────┴─────────────────┴────────────────────────┘
│ 💰 $45,000 │ ⏱️ Week 2 │ 👥 4 │ 💤 2 idle │ 🔨 2 active │ ⏸ ▶ ▶▶ ▶▶▶     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Unit Selection** (RTS-style):
- Click employees to select them
- Ctrl/Cmd+Click for multi-select
- Press `I` to select all idle employees
- Assign selected employees to tasks with one click

**Hotkeys** (StarCraft-style):
| Key | Action |
|-----|--------|
| `Space` | Pause/Resume |
| `1/2/3` | Game speed (Normal/Fast/Turbo) |
| `Ctrl+1-9` | Set control group |
| `4-9` | Recall control group |
| `R` | **RTS isometric view (default)** |
| `D` | Dashboard view |
| `C` | Command center view |
| `Q` | Task queue |
| `U` | Tech tree / Upgrades |
| `A` | Achievements |
| `H` | Hire screen |
| `T` | Tasks board |
| `E` | Team view |
| `S` | Settings |
| `Esc` | Go back |

**Control Groups** (like StarCraft!):
- Select employees, press `Ctrl+1-9` to assign to a group
- Press `4-9` to instantly select that group
- Groups persist across sessions

**Task Queue** (RTS-style import):
- Press `Q` or click "📥 Queue" to open the Task Queue
- Import issues from **GitHub** or **Linear**
- Tasks auto-assign to idle employees
- Queue executes continuously like RTS command queuing

**Tech Tree** (Company Upgrades):
- Press `U` to open the Tech Tree
- Purchase upgrades to boost productivity, morale, and efficiency
- Upgrades unlock other upgrades in a tree structure
- Categories: Engineering, Culture, Tools, Processes

**Missions** (PM-created feature branches):
- Press `M` to open Missions
- Create missions for larger features (like epics)
- Each mission gets its own **git worktree** (separate branch)
- Tasks within a mission are grouped together
- Push to GitHub, create PRs, and merge directly from the game!

```
Mission: User Authentication
├── Branch: mission/user-authentication
├── Tasks:
│   ├── ✅ Create auth schema
│   ├── 🔨 Build login form (in progress)
│   └── 📋 Add password reset (todo)
├── Commits: 3
└── Status: Active → Ready for PR → Merged! 🎉
```

**PM Advisor** (Human-in-the-Loop):

The PM agent continuously analyzes your product state and makes **suggestions**, but **YOU decide** what to build:

```
┌─────────────────────────────────────────────────────┐
│ 🧠 PM ADVISOR                           2 pending  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📬 AWAITING YOUR DECISION                          │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🎯 MISSION  HIGH                                │ │
│ │ New Mission: User Authentication                │ │
│ │                                                 │ │
│ │ 💭 PM's Reasoning:                              │ │
│ │ "Product is in MVP phase. 2 employees are      │ │
│ │  idle with 0 pending tasks. This mission       │ │
│ │  will advance the product."                    │ │
│ │                                                 │ │
│ │     [❌ Reject]            [✅ Approve]        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 💭 PM IS THINKING...                               │
│ 👁️ Product is in MVP phase with 3 features.        │
│ ⚠️ 2 idle employees with no pending tasks.         │
│ 💡 Proposing mission: User Authentication          │
└─────────────────────────────────────────────────────┘
```

The PM suggests, you approve - just like advisors in Civilization!

---

## 🎯 The Vision

Imagine describing your startup idea in a text prompt, then hiring and managing a team of AI-powered employees—engineers, product managers, designers, and marketers—who actually build your product in real-time.

**Use cases:**
- 🏆 **Hackathons**: Build a complete app in a weekend with your AI team
- 🚀 **Rapid Prototyping**: Go from idea to working MVP in hours
- 📚 **Learning**: Understand how startups and software teams operate
- 🎲 **Just for fun**: Experience the chaos of founding a startup

---

## 🎮 How It Works

### 1. Start with an Idea
```
┌─────────────────────────────────────────────────────────────┐
│  FOUNDER MODE v0.1.0                              [■][□][×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome, Founder.                                          │
│                                                             │
│  What will you build?                                       │
│  > A social network for dogs where they can share bones_    │
│                                                             │
│  [ENTER to continue]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2. Hire Your Team
```
┌─────────────────────────────────────────────────────────────┐
│  THE OFFICE                                     💰 $50,000  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TEAM (2/10)                    AVAILABLE TO HIRE           │
│  ├── 👩‍💻 Alex Chen              ├── 👨‍💻 Engineer ($8k/mo)     │
│  │   Senior Engineer            ├── 🎨 Designer ($6k/mo)     │
│  │   ████████░░ Busy            ├── 📊 PM ($7k/mo)           │
│  │                              └── 📢 Marketer ($5k/mo)     │
│  └── 🎨 Sam Rivera                                          │
│      Designer                                               │
│      ██░░░░░░░░ Idle                                        │
│                                                             │
│  [H]ire  [T]asks  [C]ode  [G]it  [S]ettings                │
└─────────────────────────────────────────────────────────────┘
```

### 3. Manage Tasks
- **Hands-on**: Review and create every task yourself
- **Delegate**: Let your PM break down features into tasks
- **Autopilot**: Watch your team work autonomously

### 4. Ship Real Code
Your AI team commits actual working code to a GitHub repository. Watch your product come to life as engineers complete tasks, designers create assets, and the codebase grows.

### 5. Push to GitHub (OAuth)
Click **Save** in the top bar to push generated code to GitHub:

1. **Sign in with GitHub** - No personal access tokens needed!
2. **Select your repository** - Choose from your GitHub repos
3. **Select files** - Pick which generated files to push
4. **Push!** - Your code is committed to a `founder-mode` branch

**GitHub OAuth Setup (for self-hosting):**
```bash
# 1. Create OAuth App at https://github.com/settings/developers
# 2. Set Authorization callback URL to:
#    http://localhost:3001/api/oauth/github/callback

# 3. Add to .env:
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── tui/                 # Terminal UI component library
│   │   ├── Terminal.tsx     # Main terminal container
│   │   ├── Input.tsx        # Text input with blinking cursor
│   │   ├── Menu.tsx         # Keyboard-navigable menus
│   │   ├── ProgressBar.tsx  # ASCII progress bars (█░)
│   │   └── Box.tsx          # Styled containers
│   ├── screens/             # Game screens
│   │   ├── StartScreen.tsx  # Startup idea input
│   │   ├── OfficeScreen.tsx # Main dashboard
│   │   ├── TeamScreen.tsx   # Team management
│   │   ├── TasksScreen.tsx  # Kanban task board
│   │   ├── CodeScreen.tsx   # View generated code
│   │   ├── HireScreen.tsx   # Hire employees
│   │   └── SettingsScreen.tsx # Game settings & AI config
│   └── StatusBar.tsx        # Bottom status bar
├── lib/
│   └── ai/                  # AI Integration Layer
│       ├── agents.ts        # Agent definitions (Mastra-style)
│       └── index.ts         # AI service (OpenAI API)
├── store/
│   └── gameStore.ts         # Zustand game state
└── types/
    └── index.ts             # TypeScript interfaces
```

### Persistence Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                                   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Zustand Store ──→ localStorage (immediate, offline)          │ │
│  │       ↓                                                        │ │
│  │  Game API Client ──→ HTTP ─────────────────────────────────┐  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                                                    │
┌─────────────────────────────────────────────────────────────────────┐
│  SERVER (Express)                                      localhost:3001│
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  /api/game/saves     - CRUD for game saves                    │ │
│  │  /api/game/sync      - Full state sync (auto-save)            │ │
│  │  /api/auth/*         - Authentication (better-auth)           │ │
│  │  /api/agents/*       - Mastra AI agents                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                           ↓                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Drizzle ORM ──→ PostgreSQL (Docker)                          │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Zustand + localStorage**: Instant saves, works offline
- **Express API**: Auth, validation, business logic
- **Drizzle ORM**: Type-safe database queries
- **PostgreSQL**: Production-ready relational database
- **Docker**: Easy local development

### Database Setup

```bash
# Start PostgreSQL with Docker
docker compose up -d

# Push schema to database
pnpm db:push

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### AI Architecture (Powered by Mastra)

The game uses **Mastra**, a powerful AI agent framework:

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (React Game)                                       │
│  └── AI Service ──→ Mastra Client                          │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────────┐
│  SERVER (Mastra)                                            │
│  ├── Engineer Agent ──→ Code Tools                         │
│  ├── PM Agent ──→ Product Tools                            │
│  ├── Designer Agent ──→ Design Tools                       │
│  └── Marketer Agent ──→ Marketing Tools                    │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- **Agents**: Each role has a full Mastra agent with personality and expertise
- **Tools**: 12+ tools for code generation, task breakdown, design, and marketing
- **Fallback Chain**: Mastra server → OpenAI direct → Simulation mode

```
server/
├── mastra/
│   ├── agents/         # Agent definitions with prompts
│   │   ├── engineer.ts # Writes React/TypeScript code
│   │   ├── pm.ts       # Breaks down projects into tasks
│   │   ├── designer.ts # Creates CSS and design systems
│   │   └── marketer.ts # Writes copy and campaigns
│   ├── tools/          # Mastra tools
│   │   ├── code.ts     # generateReactComponent, fixBug, etc.
│   │   ├── product.ts  # breakdownProject, prioritizeTasks
│   │   ├── design.ts   # createDesignSystem, createComponentStyles
│   │   └── marketing.ts # createLandingPageCopy, createSocialPost
│   └── index.ts        # Mastra configuration
├── routes/
│   ├── game.ts         # Game persistence API
│   └── integrations.ts # GitHub & Linear import API
└── index.ts            # Express server with endpoints
```

### External Integrations

**GitHub Issues Import:**
```bash
GET /api/integrations/github/issues?repo=owner/repo&state=open
# Optional: X-GitHub-Token header for private repos
```

**Linear Issues Import:**
```bash
GET /api/integrations/linear/issues?teamId=xxx
# Required: X-Linear-API-Key header
```

Auto-detection maps labels to task types:
- `bug` → 🐛 Bug fix task
- `design` → 🎨 Design task
- `urgent`/`critical` → 🔴 Critical priority
- `high`/`priority` → 🟠 High priority

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Option 1: Start game only (simulation mode)
pnpm dev

# Option 2: Start game + Mastra AI server (full AI power!)
pnpm dev:all

# Option 3: Start servers separately
pnpm dev          # Frontend on :5173
pnpm dev:server   # Mastra server on :3001

# Build for production
pnpm build
```

### Environment Setup

For AI features, set your OpenAI API key:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or configure it in the game's Settings screen.

---

## 🎮 Controls

**Game Speed**
| Key | Action |
|-----|--------|
| `Space` | Pause/Resume |
| `1` | Normal speed |
| `2` | Fast speed |
| `3` | Turbo speed |

**Selection (RTS-style)**
| Key | Action |
|-----|--------|
| `Click` | Select employee |
| `Ctrl+Click` | Add to selection |
| `I` | Select all idle |
| `Esc` | Clear selection |

**Navigation**
| Key | Action |
|-----|--------|
| `H` | Hire screen |
| `T` | Tasks board |
| `C` | Code view |

**Quick Actions**
| Action | How |
|--------|-----|
| Assign task | Select employee(s), click task |
| Approve review | Click "✓ Approve" on review tasks |
| Boost morale | Click 🍕 Boost ($1,000) |

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] TUI component system
- [x] Game state management
- [x] Basic screens and navigation

### Phase 2: Core Gameplay ✅
- [x] RTS-style Command Center
- [x] Employee hiring and management
- [x] Task creation and assignment
- [x] Unit selection and hotkeys
- [x] Activity feed and minimap
- [x] Resource management (money, time)
- [x] Project progress tracking

### Phase 3: AI Integration ✅
- [x] Mastra agent framework
- [x] Real code generation
- [x] 12+ AI tools
- [x] Fallback modes (Server → API → Simulation)

### Phase 3.5: External Integrations ✅
- [x] Task Queue with continuous execution
- [x] GitHub Issues import
- [x] Linear Issues import
- [x] Auto-assign to idle employees
- [x] Priority and type auto-detection

### Phase 4: Full RTS Experience ✅
- [x] Unified top bar with view switcher
- [x] Control groups (Ctrl+1-9 to save, 4-9 to recall)
- [x] Rally points for auto-assignment
- [x] Tech tree / company upgrades (13 upgrades across 4 categories)
- [x] Minimap with real-time activity events
- [x] Multiple view modes (Dashboard, Command Center, Queue)
- [x] Production pipeline visualization

### Phase 4.5: Game Polish ✅
- [x] **Achievements System** - 25 achievements across 6 categories
  - Founder, Team Building, Shipping, Money, Speed, Secret
  - Progressive achievements with progress bars
  - Rarity tiers: Common, Uncommon, Rare, Epic, Legendary
- [x] **Enhanced Event System** - 15+ random events with choices
  - Opportunities, Challenges, Neutral, Crisis categories
  - Multiple-choice responses with consequences
  - Events affect morale, productivity, money
- [x] **Event Panel** - Floating alerts with actionable buttons
- [x] **Trophy Room** - Dedicated achievements screen
- [x] **CSS Animations** - Glowing legendary achievements, slide-in alerts

### Phase 5: Productivity Focus ✅
- [x] **🤖 Autopilot Mode** - Let the AI team work completely autonomously
  - Auto-hires employees when needed
  - Auto-generates tasks via PM
  - Auto-approves code reviews
  - Auto-boosts morale when low
- [x] **🎯 Focus Mode** - Hide all distractions
  - Auto-dismisses event alerts
  - Hides notification popups
  - Disables random events
  - Clean, minimal UI
- [x] **Toggle Controls** - Quick buttons in top bar
  - One-click Autopilot toggle
  - One-click Focus Mode toggle
- [x] **Events are optional** - Can be disabled entirely

### Phase 5.5: Real AI Execution ✅
- [x] **AI Work Queue** - Background AI task execution
  - Tasks queued automatically when assigned
  - Processes asynchronously without blocking game
  - Retry logic for failed tasks
- [x] **Artifacts System** - Store all AI-generated content
  - Code, designs, copy, documents, analysis
  - View all artifacts in dedicated Artifacts screen (A key)
  - Filter by type, sort by recency
- [x] **Agent Memory** - Employees remember past work
  - Memories stored per employee
  - Specializations learned from completed tasks
  - Experience and context for future work
  - View in Team → Employee Details
- [x] **Live AI Status** - See AI work in progress
  - Status banner shows current task
  - Queue size indicator
  - Model info display

### Phase 6: Advanced Features
- [ ] Multiple project types (web, mobile, API)
- [ ] Company events and challenges
- [ ] Investor meetings
- [ ] Product launches

### Phase 5: Multiplayer
- [ ] Co-founder mode
- [ ] Team collaboration
- [ ] Shared repositories

---

## 🧪 Testing

The game includes a comprehensive test suite using **Vitest**:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

**Test Coverage (111 tests):**
| Module | Coverage | Description |
|--------|----------|-------------|
| `src/lib/pm/pmBrain.ts` | **~98%** | PM brain logic, product state analysis |
| `src/store/gameStore.ts` | **~40%** | Core game mechanics, state management |
| `src/components/ArtifactsPanel.tsx` | **~77%** | Artifacts viewer component |
| `src/types/*.ts` | **100%** | Type definitions |

**Unit Tests (96 tests):**
- ✅ Project creation
- ✅ Employee hiring/firing
- ✅ Task creation, assignment, completion
- ✅ Game tick progression
- ✅ Mission creation and lifecycle
- ✅ PM brain evaluation and proposals
- ✅ Task queue operations
- ✅ Control groups
- ✅ AI Work Queue (queueing, prioritization)
- ✅ Task Artifacts (creation, storage)
- ✅ Agent Memory (storage, retrieval, specializations)
- ✅ UI Components (ArtifactsPanel, EmployeeMemory)

**Integration Tests (15 tests):**
- ✅ Full game startup flow (idea → hire → task → assign)
- ✅ Task lifecycle (create → assign → progress → review → done)
- ✅ AI work queue prioritization
- ✅ Mission workflow with tasks
- ✅ PM Brain proposals (approve/reject)
- ✅ Employee progression and memory
- ✅ Complete game session simulation
- ✅ RTS control groups
- ✅ Epics system

---

## 🤝 Contributing

This is an open-source project! We welcome contributions of all kinds:
- 🐛 Bug fixes
- ✨ New features
- 🎨 UI improvements
- 📚 Documentation

---

## 🚀 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/founder-mode)

1. Click the button above or run `vercel` in the project root
2. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - PostgreSQL connection string (use Vercel Postgres or Supabase)
   - `OPENAI_API_KEY` - For AI features (optional, users can add their own)
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` - For GitHub OAuth

### Manual Deployment

```bash
# Build the frontend
pnpm build

# The output is in dist/ - deploy to any static host
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (server) | PostgreSQL connection string |
| `OPENAI_API_KEY` | No | Default API key for AI features |
| `VITE_API_URL` | Yes | API server URL |
| `GITHUB_CLIENT_ID` | No | For GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | No | For GitHub OAuth |
| `FRONTEND_URL` | Yes (server) | Frontend URL for OAuth redirects |

### Local Development

```bash
# Start PostgreSQL (optional, for persistence)
docker-compose up -d

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start frontend only
pnpm dev

# Start with backend server (for AI/persistence)
pnpm dev:all
```

### Mobile Support

The game is fully responsive and works great on mobile devices:
- Bottom navigation bar for quick access
- Touch-friendly controls
- Optimized for phones and tablets
- Works offline (game state saved locally)

---

## 📜 License

MIT License - Build something awesome!

---

<p align="center">
  <i>"Move fast and build things."</i>
  <br><br>
  Made with ☕ and questionable decisions
</p>
