// ============================================
// FOUNDER MODE - Core Type Definitions
// ============================================

// Re-export integration types
export * from './integrations';

// Re-export mission types (import first for use in this file)
import type { 
  Mission as MissionType,
  MissionStatus as MissionStatusType,
  MissionPriority as MissionPriorityType,
  MissionCommit as MissionCommitType,
  FileDiff as FileDiffType,
  Epic as EpicType,
  EpicStatus as EpicStatusType,
  ProductPhase as ProductPhaseType,
  PMThought as PMThoughtType,
  ProductState as ProductStateType,
  PMBrainState as PMBrainStateType,
  PMProposal as PMProposalType,
  ProposalType as ProposalTypeType,
  ProposalStatus as ProposalStatusType,
} from './missions';

export type Mission = MissionType;
export type MissionStatus = MissionStatusType;
export type MissionPriority = MissionPriorityType;
export type MissionCommit = MissionCommitType;
export type FileDiff = FileDiffType;
export type Epic = EpicType;
export type EpicStatus = EpicStatusType;
export type ProductPhase = ProductPhaseType;
export type PMThought = PMThoughtType;
export type ProductState = ProductStateType;
export type PMBrainState = PMBrainStateType;
export type PMProposal = PMProposalType;
export type ProposalType = ProposalTypeType;
export type ProposalStatus = ProposalStatusType;
export { MISSION_TEMPLATES } from './missions';

// Import and re-export achievement types
import type { 
  Achievement as AchievementType,
  AchievementCategory as AchievementCategoryType,
  AchievementTrigger as AchievementTriggerType,
} from './achievements';
export type Achievement = AchievementType;
export type AchievementCategory = AchievementCategoryType;
export type AchievementTrigger = AchievementTriggerType;
export { DEFAULT_ACHIEVEMENTS, RARITY_COLORS } from './achievements';

// Import and re-export event types (using StoryEvent to avoid conflict with legacy GameEvent)
import type {
  GameEvent as StoryEventDef,
  EventCategory as EventCategoryType,
  EventEffect as EventEffectType,
  EventChoice as EventChoiceType,
  ActiveEvent as ActiveEventType,
} from './events';
export type StoryEvent = StoryEventDef;
export type EventCategory = EventCategoryType;
export type EventEffect = EventEffectType;
export type EventChoice = EventChoiceType;
export type ActiveEvent = ActiveEventType;
export { DEFAULT_EVENTS } from './events';

// Import and re-export RTS types
import type { 
  ControlGroup as ControlGroupType, 
  RallyPoint as RallyPointType, 
  Upgrade as UpgradeType, 
  UpgradeCategory as UpgradeCategoryType,
  UpgradeEffect as UpgradeEffectType,
  ProductionStats as ProductionStatsType,
  GameAlert as GameAlertType,
  RTSState as RTSStateType,
  MinimapEvent as MinimapEventType,
} from './rts';
export type ControlGroup = ControlGroupType;
export type RallyPoint = RallyPointType;
export type Upgrade = UpgradeType;
export type UpgradeCategory = UpgradeCategoryType;
export type UpgradeEffect = UpgradeEffectType;
export type ProductionStats = ProductionStatsType;
export type GameAlert = GameAlertType;
export type RTSState = RTSStateType;
export type MinimapEvent = MinimapEventType;
export { DEFAULT_UPGRADES } from './rts';

// Task Queue for RTS-style continuous execution
export interface TaskQueue {
  items: QueuedTaskItem[];
  autoAssignEnabled: boolean;
  lastProcessedAt: number;
}

export interface QueuedTaskItem {
  id: string;
  taskId?: string; // If already created as a Task
  externalId?: string;
  source: 'github' | 'linear' | 'manual';
  sourceUrl?: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  queuePosition: number;
  autoAssign: boolean;
  preferredRole?: 'engineer' | 'designer' | 'pm' | 'marketer';
  addedAt: number;
  status: 'queued' | 'ready' | 'assigned' | 'completed';
}

// RTS Activity Log Entry
export interface ActivityLogEntry {
  id: string;
  tick: number;
  timestamp: number;
  message: string;
  type: 'work' | 'hire' | 'task' | 'event' | 'money' | 'complete' | 'system' | 'project' | 'ai';
  employeeId?: string;
  taskId?: string;
}

// Employee Types
export type EmployeeRole = 'engineer' | 'designer' | 'pm' | 'marketer';

export type EmployeeStatus = 'idle' | 'working' | 'blocked' | 'on_break';

export type EmployeeSkillLevel = 'junior' | 'mid' | 'senior' | 'lead';

// Memory entry for agent recall
export interface AgentMemory {
  id: string;
  type: 'task' | 'learning' | 'preference' | 'context';
  content: string;
  importance: number; // 0-1 for retrieval ranking
  createdAt: number;
  taskId?: string; // Associated task if any
  tags: string[];
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  skillLevel: EmployeeSkillLevel;
  status: EmployeeStatus;
  avatarEmoji: string;
  salary: number; // Monthly salary
  productivity: number; // 0-100
  morale: number; // 0-100
  currentTaskId: string | null;
  hiredAt: number; // Game tick when hired
  // AI Model configuration (null = use global default)
  aiModel: string | null;
  aiProvider: AIProvider | null;
  // Agent memory - remembers past work
  memory: AgentMemory[];
  tasksCompleted: number;
  specializations: string[]; // Areas they've worked on most
  // System prompt configuration
  systemPrompt: string; // Base archetype prompt for this employee
  customPrompt: string; // User-added instructions (appended to system prompt)
}

// Task Types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskType = 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';

// AI-generated artifacts from task work
export interface TaskArtifact {
  id: string;
  type: 'code' | 'design' | 'copy' | 'document' | 'analysis';
  title: string;
  content: string;
  language?: string; // For code: 'typescript', 'css', etc.
  filePath?: string; // Suggested file path
  createdAt: number;
  createdBy: string; // Employee ID
  modelUsed?: string; // AI model that generated this
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  estimatedTicks: number; // How many game ticks to complete
  progressTicks: number; // Current progress
  createdAt: number; // Game tick when created
  completedAt: number | null;
  // AI-generated content
  codeGenerated: string | null; // Legacy: Generated code snippet
  filesCreated: string[]; // Legacy: File paths created/modified
  artifacts: TaskArtifact[]; // New: All generated artifacts
  aiWorkStarted: boolean; // Has AI started working?
  aiWorkCompleted: boolean; // Has AI finished?
}

// Project Types
export type ProjectType = 
  | 'frontend'    // React, Vue, static sites
  | 'backend'     // APIs, servers
  | 'fullstack'   // Both frontend and backend
  | 'cli'         // Command-line tools
  | 'library'     // NPM packages, libraries
  | 'mobile'      // React Native, mobile apps
  | 'other';      // Anything else

export interface Project {
  id: string;
  name: string;
  description: string;
  idea: string; // Original founder idea
  techStack: string[];
  projectType: ProjectType; // What kind of project is this?
  repository: string | null; // GitHub repo URL
  createdAt: number;
}

// Game State
export type GameScreen = 
  | 'landing'      // Landing page for new users
  | 'auth'         // Login/signup
  | 'start' 
  | 'rts'          // Isometric RTS view (Civ/Warcraft style) - NEW DEFAULT
  | 'campus'       // Isometric campus view (Phaser 3) - Visual startup HQ
  | 'dashboard'    // Clean split-view
  | 'command'      // TUI-style command center
  | 'queue'        // Task queue / import view
  | 'missions'     // PM missions (git worktrees)
  | 'artifacts'    // AI-generated code/content viewer
  | 'preview'      // Live code preview - see your app running!
  | 'tech'         // Tech tree / upgrades
  | 'achievements' // Trophy room
  | 'office' 
  | 'team' 
  | 'hire' 
  | 'tasks' 
  | 'code' 
  | 'git' 
  | 'settings';

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'turbo';

export interface GameStats {
  totalRevenue: number;
  totalExpenses: number;
  tasksCompleted: number;
  linesOfCodeGenerated: number;
  commitsCreated: number;
  featuresShipped: number;
}

// AI Model Configuration
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  costPer1kTokens: number; // in cents
  capabilities: ('code' | 'design' | 'marketing' | 'pm' | 'fast' | 'vision')[];
  description: string;
}

export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, costPer1kTokens: 0.5, capabilities: ['code', 'design', 'marketing', 'pm', 'vision'], description: 'Most capable, best for complex tasks' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, costPer1kTokens: 0.015, capabilities: ['code', 'design', 'marketing', 'pm', 'fast'], description: 'Fast and cheap, good for most tasks' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000, costPer1kTokens: 1.0, capabilities: ['code', 'design', 'marketing', 'pm', 'vision'], description: 'Previous flagship, still very capable' },
  { id: 'o1-preview', name: 'o1 Preview', provider: 'openai', contextWindow: 128000, costPer1kTokens: 1.5, capabilities: ['code', 'pm'], description: 'Advanced reasoning for complex problems' },
  { id: 'o1-mini', name: 'o1 Mini', provider: 'openai', contextWindow: 128000, costPer1kTokens: 0.3, capabilities: ['code', 'fast'], description: 'Fast reasoning model' },
  
  // Anthropic Models
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextWindow: 200000, costPer1kTokens: 0.3, capabilities: ['code', 'design', 'marketing', 'pm'], description: 'Excellent for coding and analysis' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000, costPer1kTokens: 0.3, capabilities: ['code', 'design', 'marketing', 'pm'], description: 'Great balance of speed and capability' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: 200000, costPer1kTokens: 0.025, capabilities: ['code', 'fast'], description: 'Fastest Claude, great for simple tasks' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextWindow: 200000, costPer1kTokens: 1.5, capabilities: ['code', 'design', 'marketing', 'pm'], description: 'Most capable Claude for complex tasks' },
  
  // Google Models
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', contextWindow: 1000000, costPer1kTokens: 0.01, capabilities: ['code', 'design', 'marketing', 'pm', 'fast', 'vision'], description: 'Fast multimodal with huge context' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', contextWindow: 2000000, costPer1kTokens: 0.125, capabilities: ['code', 'design', 'marketing', 'pm', 'vision'], description: 'Massive 2M context window' },
  
  // Groq Models (Fast inference)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', contextWindow: 128000, costPer1kTokens: 0.059, capabilities: ['code', 'marketing', 'fast'], description: 'Fast open-source model via Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', contextWindow: 32768, costPer1kTokens: 0.024, capabilities: ['code', 'fast'], description: 'Very fast mixture of experts' },
  
  // Local Models (Ollama)
  { id: 'llama3.2', name: 'Llama 3.2 (Local)', provider: 'ollama', contextWindow: 128000, costPer1kTokens: 0, capabilities: ['code', 'fast'], description: 'Run locally with Ollama - FREE' },
  { id: 'codellama', name: 'Code Llama (Local)', provider: 'ollama', contextWindow: 16000, costPer1kTokens: 0, capabilities: ['code', 'fast'], description: 'Specialized for code - FREE' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder (Local)', provider: 'ollama', contextWindow: 16000, costPer1kTokens: 0, capabilities: ['code', 'fast'], description: 'Great for coding - FREE' },
];

export interface AISettings {
  enabled: boolean;
  apiKey: string | null;
  provider: AIProvider;
  model: string; // Global default model
  // Provider-specific API keys
  providerKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
    groq?: string;
    ollamaUrl?: string; // e.g., http://localhost:11434
  };
}

export interface GameState {
  // Meta
  screen: GameScreen;
  gameSpeed: GameSpeed;
  tick: number; // Game time unit
  startedAt: Date;
  
  // Resources
  money: number;
  runway: number; // Months of runway left
  
  // Entities
  project: Project | null;
  employees: Employee[];
  tasks: Task[];
  
  // Stats
  stats: GameStats;
  
  // AI Settings
  aiSettings: AISettings;
  
  // UI State
  selectedEmployeeId: string | null;
  selectedTaskId: string | null;
  notifications: GameNotification[];
  
  // RTS State
  activityLog: ActivityLogEntry[];
  selectedEmployeeIds: string[]; // Multi-select for RTS
  isPaused: boolean;
  showCommandPalette: boolean;
  
  // Task Queue
  taskQueue: TaskQueue;
  integrations: {
    github: {
      enabled: boolean;
      repo: string | null;
    };
    linear: {
      enabled: boolean;
      teamId: string | null;
    };
  };
  
  // RTS Features
  controlGroups: ControlGroup[];
  rallyPoints: RallyPoint[];
  upgrades: Upgrade[];
  alerts: GameAlert[];
  minimapActivity: MinimapEvent[];
  
  // Achievements & Events
  achievements: Achievement[];
  activeEvents: ActiveEvent[];
  totalPlayTime: number; // in seconds
  sessionStartTime: number;
  
  // Focus & Autopilot
  focusMode: boolean; // Hide distractions, auto-dismiss events
  autopilot: boolean; // Full autonomous operation
  eventsEnabled: boolean; // Toggle random events
  
  // Missions (PM-created feature branches)
  missions: Mission[];
  activeMissionId: string | null;
  
  // PM Brain (continuous product thinking)
  pmBrain: PMBrainState;
  
  // AI Work Queue (tasks pending AI execution)
  aiWorkQueue: AIWorkItem[];
  aiWorkInProgress: string | null; // Task ID currently being processed
  
  // Git Repository (real-time code tracking)
  gitRepo: GitRepo | null;
  gitHubConnection: GitHubConnection;
}

// Git Types (virtual git repo that tracks all code)
export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  authorAvatar: string;
  timestamp: number;
  files: GitFile[];
  branch: string;
  taskId?: string;
  artifactId?: string;
}

export interface GitFile {
  path: string;
  content: string;
  language: string;
  action: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
}

export interface GitBranch {
  name: string;
  isDefault: boolean;
  commits: number;
  lastCommit: GitCommit | null;
  missionId?: string;
}

export interface GitRepo {
  name: string;
  description: string;
  defaultBranch: string;
  branches: GitBranch[];
  commits: GitCommit[];
  files: Map<string, string>;
  remoteUrl: string | null;
  isConnected: boolean;
  stats: {
    totalCommits: number;
    totalFiles: number;
    totalLines: number;
    contributors: string[];
  };
}

export interface GitHubConnection {
  connected: boolean;
  username: string | null;
  repoName: string | null;
  repoUrl: string | null;
  lastPush: number | null;
}

export interface AIWorkItem {
  id: string;
  taskId: string;
  employeeId: string;
  priority: number; // Lower = higher priority
  addedAt: number;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  retries: number;
}

export interface GameNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}

// Random Events
export type GameEventType = 
  | 'morale_boost'
  | 'morale_drop'
  | 'productivity_boost'
  | 'investor_interest'
  | 'bug_discovered'
  | 'team_lunch'
  | 'coffee_machine_broken'
  | 'competitor_launch'
  | 'viral_moment'
  | 'server_outage';

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  effect: () => void;
}

export const EVENT_DEFINITIONS: Omit<GameEvent, 'id' | 'effect'>[] = [
  {
    type: 'morale_boost',
    title: '🎉 Team Celebration!',
    description: 'The team had a great week! Morale increased for everyone.',
  },
  {
    type: 'morale_drop',
    title: '😔 Tough Week',
    description: 'Long hours are taking a toll. Team morale decreased.',
  },
  {
    type: 'productivity_boost',
    title: '☕ Coffee Upgrade',
    description: 'New espresso machine installed! Productivity boost for all.',
  },
  {
    type: 'investor_interest',
    title: '💰 Investor Interest',
    description: 'A VC noticed your progress! Bonus funding received.',
  },
  {
    type: 'bug_discovered',
    title: '🐛 Critical Bug Found',
    description: 'QA found a major bug. A new urgent task has been created.',
  },
  {
    type: 'team_lunch',
    title: '🍕 Team Lunch',
    description: 'Pizza Friday! Team bonding improves morale.',
  },
  {
    type: 'coffee_machine_broken',
    title: '☕ Coffee Machine Broken',
    description: 'The coffee machine is down! Productivity takes a small hit.',
  },
  {
    type: 'competitor_launch',
    title: '🚀 Competitor Launched',
    description: 'A competitor shipped a similar feature. Time to move faster!',
  },
  {
    type: 'viral_moment',
    title: '📈 Viral Moment',
    description: 'Your product got featured on social media! Excitement is high.',
  },
  {
    type: 'server_outage',
    title: '🔥 Server Issues',
    description: 'Cloud provider having issues. Infrastructure task created.',
  },
];

// Actions
export interface GameActions {
  // Navigation
  setScreen: (screen: GameScreen) => void;
  
  // Game Control
  setGameSpeed: (speed: GameSpeed) => void;
  gameTick: () => void;
  togglePause: () => void;
  
  // Project
  startProject: (idea: string) => void;
  
  // Team
  hireEmployee: (role: EmployeeRole, skillLevel: EmployeeSkillLevel) => void;
  fireEmployee: (id: string) => void;
  
  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'progressTicks' | 'completedAt' | 'codeGenerated' | 'filesCreated' | 'artifacts' | 'aiWorkStarted' | 'aiWorkCompleted'>) => void;
  assignTask: (taskId: string, employeeId: string) => void;
  unassignTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  
  // Selection (RTS-style)
  selectEmployee: (id: string | null) => void;
  selectEmployees: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  selectTask: (id: string | null) => void;
  clearSelection: () => void;
  selectAllIdle: () => void;
  
  // Quick Commands (RTS hotkeys)
  quickAssignToTask: (taskId: string) => void;
  quickHire: (role: EmployeeRole) => void;
  boostMorale: () => void;
  
  // Notifications
  addNotification: (message: string, type: GameNotification['type']) => void;
  dismissNotification: (id: string) => void;
  
  // Activity Log
  logActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  
  // Command Palette
  toggleCommandPalette: () => void;
  
  // Events
  triggerRandomEvent: () => void;
  
  // PM Actions
  pmGenerateTask: () => void;
  
  // AI
  configureAI: (apiKey: string, provider?: AIProvider) => void;
  configureProviderKey: (provider: AIProvider, apiKey: string) => void;
  setGlobalModel: (modelId: string) => void;
  setEmployeeModel: (employeeId: string, modelId: string | null, provider?: AIProvider | null) => void;
  updateEmployeePrompt: (employeeId: string, systemPrompt?: string, customPrompt?: string) => void;
  disableAI: () => void;
  aiWorkOnTask: (taskId: string) => Promise<void>;
  
  // AI Work Queue
  queueAIWork: (taskId: string, employeeId: string) => void;
  processAIWorkQueue: () => Promise<void>;
  addTaskArtifact: (taskId: string, artifact: Omit<TaskArtifact, 'id' | 'createdAt'>) => void;
  
  // Agent Memory
  addEmployeeMemory: (employeeId: string, memory: Omit<AgentMemory, 'id' | 'createdAt'>) => void;
  getEmployeeContext: (employeeId: string, taskTitle?: string) => string;
  updateEmployeeSpecializations: (employeeId: string) => void;
  
  // Task Queue
  addToQueue: (item: Omit<QueuedTaskItem, 'id' | 'queuePosition' | 'addedAt' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (id: string, newPosition: number) => void;
  processQueue: () => void;
  toggleAutoAssign: () => void;
  importFromGitHub: (issues: Array<{ number: number; title: string; body: string | null; labels: Array<{ name: string }> }>) => void;
  importFromLinear: (issues: Array<{ id: string; identifier: string; title: string; description: string | null; priority: number; labels: Array<{ name: string }> }>) => void;
  clearQueue: () => void;
  
  // RTS Features
  setControlGroup: (groupId: number, employeeIds: string[]) => void;
  selectControlGroup: (groupId: number) => void;
  setRallyPoint: (taskType: RallyPoint['taskType'], employeeIds: string[]) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  dismissAlert: (alertId: string) => void;
  addMinimapEvent: (event: Omit<MinimapEvent, 'id' | 'timestamp'>) => void;
  
  // Achievements & Events
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: () => void;
  triggerEvent: (eventId?: string) => void;
  makeEventChoice: (eventId: string, choiceId: string) => void;
  updatePlayTime: () => void;
  applyEventEffect: (effect: { type: string; value: number; target?: string; duration?: number }) => void;
  
  // Focus & Autopilot
  toggleFocusMode: () => void;
  toggleAutopilot: () => void;
  toggleEvents: () => void;
  runAutopilot: () => void; // Called each tick in autopilot mode
  
  // Missions (PM-created feature branches as git worktrees)
  createMission: (name: string, description: string, priority: MissionPriority) => string;
  createMissionWithTasks: (
    name: string, 
    description: string, 
    priority: MissionPriority,
    tasks: Array<{ title: string; type: TaskType; estimatedTicks: number }>
  ) => string;
  startMission: (missionId: string) => void;
  setActiveMission: (missionId: string | null) => void;
  addTaskToMission: (missionId: string, taskId: string) => void;
  removeTaskFromMission: (missionId: string, taskId: string) => void;
  updateMissionStatus: (missionId: string, status: MissionStatus) => void;
  addMissionCommit: (missionId: string, commit: MissionCommit) => void;
  setMissionPR: (missionId: string, prUrl: string, prNumber: number) => void;
  abandonMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  
  // PM Brain (continuous product thinking loop)
  togglePMBrain: () => void;
  runPMEvaluation: () => void;
  addPMThought: (thought: Omit<PMThought, 'id' | 'timestamp'>) => void;
  createEpic: (name: string, description: string, phase: ProductPhase) => string;
  addMissionToEpic: (epicId: string, missionId: string) => void;
  updateEpicStatus: (epicId: string, status: EpicStatus) => void;
  
  // PM Proposals (human-in-the-loop decisions)
  approveProposal: (proposalId: string) => void;
  rejectProposal: (proposalId: string) => void;
  dismissProposal: (proposalId: string) => void;
  getPendingProposals: () => PMProposal[];
  
  // Git Integration (real-time code tracking)
  initGitRepo: () => void;
  commitArtifact: (taskId: string, artifactId: string) => void;
  createGitBranch: (name: string, missionId?: string) => void;
  connectGitHub: (token: string, repoName: string) => Promise<boolean>;
  pushToGitHub: () => Promise<boolean>;
  disconnectGitHub: () => void;
}

// Employee Templates for Hiring
export interface EmployeeTemplate {
  role: EmployeeRole;
  skillLevel: EmployeeSkillLevel;
  baseSalary: number;
  emoji: string;
  title: string;
  systemPrompt: string;
}

// Base prompts by role - these define the core archetype
export const ROLE_BASE_PROMPTS: Record<EmployeeRole, string> = {
  engineer: `You are a software engineer working at a startup. You write clean, efficient, and well-documented code.

Your responsibilities:
- Write production-quality code for features and bug fixes
- Follow best practices for React, TypeScript, and modern web development
- Consider performance, accessibility, and maintainability
- Write code that is easy to understand and modify

When given a task:
1. Understand the requirements fully
2. Plan your approach
3. Write clean, working code
4. Include helpful comments
5. Consider edge cases

Always respond with actual working code. Use React and TypeScript.
Format your response as a code block with the file path as a comment at the top.`,

  designer: `You are a product designer at a startup. You create beautiful, functional, and accessible interfaces.

Your responsibilities:
- Create modern, clean UI designs
- Write CSS that brings designs to life
- Ensure designs are accessible to all users
- Consider mobile responsiveness

Design principles you follow:
1. Simplicity - remove unnecessary complexity
2. Consistency - use patterns users recognize
3. Accessibility - design for everyone
4. Feedback - show users what's happening
5. Delight - add moments of joy

Respond with CSS code for the component. Use a dark terminal-style theme with:
- Background: #0a0e14
- Accent: #00ff88
- Text: #e6edf3
- Monospace fonts`,

  pm: `You are a product manager at a startup. You excel at breaking down complex ideas into actionable tasks.

Your responsibilities:
- Understand the product vision and user needs
- Break down features into clear, actionable tasks
- Prioritize work based on impact and effort
- Write clear task descriptions that engineers can understand

When creating tasks, respond with a JSON array of tasks. Each task should have:
- title: A clear, actionable title (start with a verb)
- description: Brief context
- type: One of "feature", "bug", "design", "marketing", "infrastructure"
- priority: One of "low", "medium", "high", "critical"
- estimatedHours: A number

Respond ONLY with the JSON array, no other text.`,

  marketer: `You are a growth marketer at a startup. You craft compelling messages that resonate with users.

Your responsibilities:
- Write persuasive landing page copy
- Create engaging social media content
- Understand the target audience deeply

Your writing principles:
1. Lead with benefits, not features
2. Be clear and concise
3. Create urgency without being pushy
4. Tell stories that connect emotionally
5. Always include a clear call to action

Respond with marketing copy including:
- A compelling headline
- Supporting subheadline
- Body copy (2-3 paragraphs)
- Call to action`,
};

// Skill level modifiers that get prepended to the base prompt
export const SKILL_LEVEL_PROMPTS: Record<EmployeeSkillLevel, string> = {
  junior: `You are early in your career, eager to learn and grow. You may ask clarifying questions and prefer straightforward tasks. You focus on getting things done correctly, even if it takes a bit longer.`,
  
  mid: `You are an experienced professional with solid fundamentals. You work independently and deliver consistent quality. You balance speed with quality and can handle moderately complex tasks.`,
  
  senior: `You are a highly experienced professional with deep expertise. You mentor others, anticipate problems before they occur, and make architectural decisions. You optimize for long-term maintainability and write exemplary code/work.`,
  
  lead: `You are a technical leader who sets the direction for the team. You think strategically about how work fits into the bigger picture, establish best practices, and ensure quality across the team. You balance immediate needs with long-term vision.`,
};

// Helper to generate full system prompt for a template
export function generateEmployeeSystemPrompt(role: EmployeeRole, skillLevel: EmployeeSkillLevel): string {
  const skillModifier = SKILL_LEVEL_PROMPTS[skillLevel];
  const basePrompt = ROLE_BASE_PROMPTS[role];
  return `${skillModifier}\n\n${basePrompt}`;
}

export const EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  { role: 'engineer', skillLevel: 'junior', baseSalary: 5000, emoji: '👨‍💻', title: 'Junior Engineer', systemPrompt: generateEmployeeSystemPrompt('engineer', 'junior') },
  { role: 'engineer', skillLevel: 'mid', baseSalary: 8000, emoji: '👩‍💻', title: 'Software Engineer', systemPrompt: generateEmployeeSystemPrompt('engineer', 'mid') },
  { role: 'engineer', skillLevel: 'senior', baseSalary: 12000, emoji: '🧑‍💻', title: 'Senior Engineer', systemPrompt: generateEmployeeSystemPrompt('engineer', 'senior') },
  { role: 'engineer', skillLevel: 'lead', baseSalary: 15000, emoji: '👨‍🔬', title: 'Lead Engineer', systemPrompt: generateEmployeeSystemPrompt('engineer', 'lead') },
  { role: 'designer', skillLevel: 'junior', baseSalary: 4000, emoji: '🎨', title: 'Junior Designer', systemPrompt: generateEmployeeSystemPrompt('designer', 'junior') },
  { role: 'designer', skillLevel: 'mid', baseSalary: 6000, emoji: '🎨', title: 'Product Designer', systemPrompt: generateEmployeeSystemPrompt('designer', 'mid') },
  { role: 'designer', skillLevel: 'senior', baseSalary: 9000, emoji: '🎨', title: 'Senior Designer', systemPrompt: generateEmployeeSystemPrompt('designer', 'senior') },
  { role: 'pm', skillLevel: 'junior', baseSalary: 5000, emoji: '📊', title: 'Associate PM', systemPrompt: generateEmployeeSystemPrompt('pm', 'junior') },
  { role: 'pm', skillLevel: 'mid', baseSalary: 7000, emoji: '📊', title: 'Product Manager', systemPrompt: generateEmployeeSystemPrompt('pm', 'mid') },
  { role: 'pm', skillLevel: 'senior', baseSalary: 11000, emoji: '📊', title: 'Senior PM', systemPrompt: generateEmployeeSystemPrompt('pm', 'senior') },
  { role: 'marketer', skillLevel: 'junior', baseSalary: 3500, emoji: '📢', title: 'Marketing Associate', systemPrompt: generateEmployeeSystemPrompt('marketer', 'junior') },
  { role: 'marketer', skillLevel: 'mid', baseSalary: 5000, emoji: '📢', title: 'Growth Marketer', systemPrompt: generateEmployeeSystemPrompt('marketer', 'mid') },
  { role: 'marketer', skillLevel: 'senior', baseSalary: 8000, emoji: '📢', title: 'Head of Marketing', systemPrompt: generateEmployeeSystemPrompt('marketer', 'senior') },
];

// Name generator data
export const FIRST_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn',
  'Avery', 'Charlie', 'Dakota', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Jesse',
  'Kai', 'Logan', 'Max', 'Parker', 'Peyton', 'Reese', 'River', 'Rowan',
  'Sage', 'Skyler', 'Spencer', 'Sydney', 'Blake', 'Drew', 'Ellis', 'Frankie'
];

export const LAST_NAMES = [
  'Chen', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Lopez', 'Harris', 'Clark', 'Lewis',
  'Robinson', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Hill', 'Scott'
];
