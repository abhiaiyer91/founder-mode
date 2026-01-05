# 🎮 Founder Mode

> *Build a real startup. Ship real code. Play the game.*

**Founder Mode** is a startup simulation game where you play as a solo founder building your company from the ground up. But here's the twist: your AI team actually writes real code that gets committed to GitHub. It's not just a game—it's a development tool disguised as one.

Think *RollerCoaster Tycoon* meets *Y Combinator*, with a retro terminal UI aesthetic.

![Founder Mode](https://img.shields.io/badge/status-alpha-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![React](https://img.shields.io/badge/React-19-cyan)

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

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── tui/                 # Terminal UI components
│   │   ├── Terminal.tsx     # Main terminal container
│   │   ├── Window.tsx       # Draggable windows
│   │   ├── Input.tsx        # Text input with cursor
│   │   ├── Menu.tsx         # Selectable menus
│   │   └── ProgressBar.tsx  # ASCII progress bars
│   ├── screens/             # Game screens
│   │   ├── StartScreen.tsx  # Idea input
│   │   ├── OfficeScreen.tsx # Main game view
│   │   ├── TeamScreen.tsx   # Team management
│   │   ├── TasksScreen.tsx  # Task board
│   │   └── CodeScreen.tsx   # View generated code
│   └── game/                # Game entities
│       ├── Employee.tsx     # Team member cards
│       └── Task.tsx         # Task items
├── hooks/
│   ├── useGame.ts           # Main game state
│   ├── useTeam.ts           # Team management
│   └── useTasks.ts          # Task management
├── types/
│   └── index.ts             # TypeScript interfaces
├── context/
│   └── GameContext.tsx      # Global game state
└── services/
    ├── ai.ts                # AI agent integration
    └── git.ts               # Git/GitHub operations
```

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start the game
pnpm dev

# Build for production
pnpm build
```

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate menus |
| `Enter` | Select / Confirm |
| `Esc` | Back / Cancel |
| `Tab` | Switch panels |
| `H` | Hire menu |
| `T` | Tasks view |
| `C` | Code view |
| `G` | Git status |

---

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] TUI component system
- [x] Game state management
- [x] Basic screens and navigation

### Phase 2: Core Gameplay 🚧
- [ ] Employee hiring and management
- [ ] Task creation and assignment
- [ ] Resource management (money, time)
- [ ] Project progress tracking

### Phase 3: AI Integration
- [ ] Connect to AI coding agents
- [ ] Real code generation
- [ ] Git commit integration
- [ ] Code review simulation

### Phase 4: Advanced Features
- [ ] Multiple project types (web, mobile, API)
- [ ] Company events and challenges
- [ ] Investor meetings
- [ ] Product launches

### Phase 5: Multiplayer
- [ ] Co-founder mode
- [ ] Team collaboration
- [ ] Shared repositories

---

## 🤝 Contributing

This is an open-source project! We welcome contributions of all kinds:
- 🐛 Bug fixes
- ✨ New features
- 🎨 UI improvements
- 📚 Documentation

---

## 📜 License

MIT License - Build something awesome!

---

<p align="center">
  <i>"Move fast and build things."</i>
  <br><br>
  Made with ☕ and questionable decisions
</p>
