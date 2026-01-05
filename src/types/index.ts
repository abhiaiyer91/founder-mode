// ============================================
// FOUNDER MODE - Core Type Definitions
// ============================================

// Re-export integration types
export * from './integrations';

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
  type: 'work' | 'hire' | 'task' | 'event' | 'money' | 'complete' | 'system';
  employeeId?: string;
  taskId?: string;
}

// Employee Types
export type EmployeeRole = 'engineer' | 'designer' | 'pm' | 'marketer';

export type EmployeeStatus = 'idle' | 'working' | 'blocked' | 'on_break';

export type EmployeeSkillLevel = 'junior' | 'mid' | 'senior' | 'lead';

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
}

// Task Types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskType = 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';

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
  codeGenerated: string | null; // Generated code snippet
  filesCreated: string[]; // File paths created/modified
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description: string;
  idea: string; // Original founder idea
  techStack: string[];
  repository: string | null; // GitHub repo URL
  createdAt: number;
}

// Game State
export type GameScreen = 
  | 'auth'         // Login/signup
  | 'start' 
  | 'rts'          // Isometric RTS view (Civ/Warcraft style) - NEW DEFAULT
  | 'dashboard'    // Clean split-view
  | 'command'      // TUI-style command center
  | 'queue'        // Task queue / import view
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

export interface AISettings {
  enabled: boolean;
  apiKey: string | null;
  provider: 'openai' | 'anthropic';
  model: string;
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
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'progressTicks' | 'completedAt' | 'codeGenerated' | 'filesCreated'>) => void;
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
  configureAI: (apiKey: string) => void;
  disableAI: () => void;
  aiWorkOnTask: (taskId: string) => Promise<void>;
  
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
}

// Employee Templates for Hiring
export interface EmployeeTemplate {
  role: EmployeeRole;
  skillLevel: EmployeeSkillLevel;
  baseSalary: number;
  emoji: string;
  title: string;
}

export const EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  { role: 'engineer', skillLevel: 'junior', baseSalary: 5000, emoji: '👨‍💻', title: 'Junior Engineer' },
  { role: 'engineer', skillLevel: 'mid', baseSalary: 8000, emoji: '👩‍💻', title: 'Software Engineer' },
  { role: 'engineer', skillLevel: 'senior', baseSalary: 12000, emoji: '🧑‍💻', title: 'Senior Engineer' },
  { role: 'engineer', skillLevel: 'lead', baseSalary: 15000, emoji: '👨‍🔬', title: 'Lead Engineer' },
  { role: 'designer', skillLevel: 'junior', baseSalary: 4000, emoji: '🎨', title: 'Junior Designer' },
  { role: 'designer', skillLevel: 'mid', baseSalary: 6000, emoji: '🎨', title: 'Product Designer' },
  { role: 'designer', skillLevel: 'senior', baseSalary: 9000, emoji: '🎨', title: 'Senior Designer' },
  { role: 'pm', skillLevel: 'junior', baseSalary: 5000, emoji: '📊', title: 'Associate PM' },
  { role: 'pm', skillLevel: 'mid', baseSalary: 7000, emoji: '📊', title: 'Product Manager' },
  { role: 'pm', skillLevel: 'senior', baseSalary: 11000, emoji: '📊', title: 'Senior PM' },
  { role: 'marketer', skillLevel: 'junior', baseSalary: 3500, emoji: '📢', title: 'Marketing Associate' },
  { role: 'marketer', skillLevel: 'mid', baseSalary: 5000, emoji: '📢', title: 'Growth Marketer' },
  { role: 'marketer', skillLevel: 'senior', baseSalary: 8000, emoji: '📢', title: 'Head of Marketing' },
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
