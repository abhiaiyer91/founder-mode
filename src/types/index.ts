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

// Employee Types (simplified to 3 core roles)
export type EmployeeRole = 'engineer' | 'designer' | 'pm';

export type EmployeeStatus = 'idle' | 'working' | 'blocked' | 'on_break';

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
  status: EmployeeStatus;
  avatarEmoji: string;
  salary: number; // Monthly salary
  currentTaskId: string | null;
  hiredAt: number; // Game tick when hired
  // AI Model configuration
  aiModel: string | null;
  aiProvider: AIProvider | null;
  // Agent memory - remembers past work
  memory: AgentMemory[];
  tasksCompleted: number;
  totalTicksWorked: number; // Total ticks spent working on tasks
  specializations: string[]; // Areas they've worked on most
}

/**
 * Calculate employee productivity based on actual work done.
 * Returns 0-100 representing tasks completed per time unit.
 * New employees start at 0 and build up as they complete tasks.
 */
export function calculateProductivity(employee: Employee): number {
  if (employee.tasksCompleted === 0) return 0;
  if (employee.totalTicksWorked === 0) return 0;
  
  // Base calculation: tasks per 1000 ticks, scaled to 0-100
  // Assuming ~100 ticks per task is "average", so 10 tasks per 1000 ticks = 100%
  const tasksPerThousandTicks = (employee.tasksCompleted / employee.totalTicksWorked) * 1000;
  const productivity = Math.min(100, Math.round(tasksPerThousandTicks * 10));
  
  return productivity;
}

// Task Types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskType = 'feature' | 'bug' | 'design' | 'infrastructure';

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

// Saved Project - stores project metadata for the project list
export interface SavedProject {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  createdAt: number;
  lastPlayedAt: number;
  tick: number; // Progress indicator
  money: number;
  employeeCount: number;
  tasksCompleted: number;
}

// Game Flow Phase - tracks the onboarding/gameplay progression
export type GamePhase = 
  | 'new'           // Just started, no project yet
  | 'hire_pm'       // Project created, need to hire PM first
  | 'ideate'        // PM hired, breaking down idea into tasks
  | 'hire_engineer' // Ideation done, need engineer to start building
  | 'playing';      // Full game mode - all core roles in place

// Game State
export type GameScreen = 
  | 'landing'      // Landing page for new users
  | 'auth'         // Login/signup
  | 'start'        // Start new project
  | 'projects'     // Project list - continue a saved project
  | 'hire_pm'      // First gate: hire a PM to start
  | 'ideate'       // Chat with PM to break down vision into tasks
  | 'hire_engineer'// Second gate: hire engineer to start building
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
  phase: GamePhase; // Current game flow phase
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
  setPhase: (phase: GamePhase) => void;
  
  // Game Control
  gameTick: () => void;
  togglePause: () => void;
  
  // Project
  startProject: (idea: string) => void;
  
  // Ideation Phase
  completeIdeation: () => void; // Called when PM finishes breaking down vision
  
  // Team
  hireEmployee: (role: EmployeeRole, aiProvider?: AIProvider, aiModel?: string) => void;
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

// Employee Templates for Hiring (simplified: 3 roles, flat salaries)
export interface EmployeeTemplate {
  role: EmployeeRole;
  baseSalary: number;
  title: string;
  description: string;
}

export const EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  { 
    role: 'pm', 
    baseSalary: 8000, 
    title: 'Product Manager',
    description: 'Breaks down your idea into actionable tasks and manages priorities.',
  },
  { 
    role: 'designer', 
    baseSalary: 7000, 
    title: 'Designer',
    description: 'Creates UI/UX designs and generates CSS for your product.',
  },
  { 
    role: 'engineer', 
    baseSalary: 10000, 
    title: 'Engineer',
    description: 'Writes code, builds features, and fixes bugs.',
  },
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
