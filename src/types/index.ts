import type { RallyPoint, MinimapEvent, Upgrade } from './rts';
import type { Achievement } from './achievements';
import type { ActiveEvent } from './events';

// Type definitions for Founder Mode game

// AI Provider Types
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

// AI Model metadata
export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  capabilities: string[];
}

// Available AI models
export const AI_MODELS: AIModel[] = [
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    capabilities: ['coding', 'reasoning', 'vision'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    capabilities: ['coding', 'fast'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
    capabilities: ['coding', 'reasoning'],
  },
  // Anthropic
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    capabilities: ['coding', 'reasoning', 'long-context'],
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    capabilities: ['coding', 'reasoning', 'long-context'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
    capabilities: ['fast', 'coding'],
  },
  // Google
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    contextWindow: 1000000,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
    capabilities: ['fast', 'coding', 'long-context'],
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    contextWindow: 2000000,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    capabilities: ['reasoning', 'long-context', 'vision'],
  },
  // Groq
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    contextWindow: 128000,
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
    capabilities: ['fast', 'coding'],
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    contextWindow: 32768,
    costPer1kInput: 0.00024,
    costPer1kOutput: 0.00024,
    capabilities: ['fast'],
  },
];

// Founder info
export interface Founder {
  name: string;
  title: string;
  avatarEmoji: string;
}

// Employee Types (simplified: 3 core roles)
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
  // System prompt configuration
  systemPrompt: string; // Base archetype prompt for this employee
  customPrompt: string; // User-added instructions (appended to system prompt)
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

// Game Flow Phase - tracks the onboarding/gameplay progression
export type GamePhase = 
  | 'new'           // Just started, no project yet
  | 'hire_pm'       // Project created, need to hire PM first
  | 'ideate'        // PM hired, breaking down idea into tasks
  | 'hire_engineer' // Ideation done, need engineer to start building
  | 'playing';      // Full game mode - all core roles in place

// Game State
export type GameScreen = 
  | 'title' 
  | 'onboarding'   // Initial project setup
  | 'hire_pm'      // First gate: hire a PM to start
  | 'ideate'       // Chat with PM to break down vision into tasks
  | 'hire_engineer'// Second gate: hire engineer to start building
  | 'office' 
  | 'hire' 
  | 'team' 
  | 'tasks' 
  | 'inbox' 
  | 'settings'
  | 'artifacts'    // View generated code/content
  | 'work'         // Watch AI work in real-time
  | 'git'          // Git history view
  | 'mission-control';  // Mission management

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'ultra';

// Activity Log for seeing what happened
export interface ActivityLogEntry {
  tick: number;
  message: string;
  type: 'hire' | 'fire' | 'task' | 'task_complete' | 'money' | 'idea' | 'system' | 'ai' | 'git';
  employeeId?: string;
  taskId?: string;
}

// AI Settings
export interface AISettings {
  apiKey: string | null;
  providerKeys: Partial<Record<AIProvider, string>>;
  provider: AIProvider;
  model: string;
  enabled: boolean;
}

// Notification
export interface GameNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

// Game Statistics
export interface GameStats {
  tasksCompleted: number;
  moneyEarned: number;
  moneySpent: number;
  employeesHired: number;
  employeesFired: number;
  linesOfCodeGenerated: number;
  commitsCreated: number;
}

// Task Queue - for backlog management
export interface QueuedTaskItem {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  estimatedTicks: number;
  source: 'manual' | 'github' | 'linear' | 'ai';
  sourceId?: string; // Original issue number/ID
  queuePosition: number;
  addedAt: number;
  status: 'queued' | 'converting' | 'converted';
}

// Mission Types - for strategic goals
export type MissionStatus = 'draft' | 'active' | 'blocked' | 'completed' | 'abandoned';
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MissionCommit {
  id: string;
  hash: string;
  message: string;
  artifactId: string;
  taskId: string;
  createdAt: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  taskIds: string[];        // Tasks that belong to this mission
  commits: MissionCommit[]; // Commits made for this mission
  branchName: string | null; // Git branch for this mission
  prUrl: string | null;     // GitHub PR URL
  prNumber: number | null;  // GitHub PR number
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

// Epic Types - for long-term product phases
export type EpicStatus = 'planning' | 'active' | 'completed' | 'on_hold';

export interface Epic {
  id: string;
  name: string;
  description: string;
  phase: ProductPhase;
  status: EpicStatus;
  missionIds: string[];
  createdAt: number;
  targetCompletionTick: number | null;
}

// Product Phase - lifecycle stages
export type ProductPhase = 'mvp' | 'beta' | 'launch' | 'growth' | 'scale';

// PM Brain Types
export interface PMThought {
  id: string;
  type: 'observation' | 'recommendation' | 'concern' | 'celebration';
  content: string;
  confidence: number; // 0-1
  timestamp: number;
  relatedTaskIds?: string[];
  relatedMissionIds?: string[];
}

export interface PMBrainState {
  enabled: boolean;
  lastEvaluation: number | null;
  evaluationInterval: number; // ticks between evaluations
  currentFocus: string | null;
  recentThoughts: PMThought[];
}

// PM Proposal - for human-in-the-loop decisions
export interface PMProposal {
  id: string;
  type: 'new_mission' | 'priority_change' | 'task_suggestion' | 'concern';
  title: string;
  description: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  createdAt: number;
  payload: {
    missionId?: string;
    taskId?: string;
    suggestedPriority?: MissionPriority;
    suggestedTasks?: Array<{
      title: string;
      type: TaskType;
      estimatedTicks: number;
    }>;
  };
}

// AI Work Queue - for real-time AI task tracking
export interface AIWorkItem {
  id: string;
  taskId: string;
  employeeId: string;
  status: 'queued' | 'working' | 'completed' | 'failed';
  startedAt: number | null;
  completedAt: number | null;
  error?: string;
}

// Git Repository (in-memory representation)
export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  files: string[];
  taskId?: string;
  artifactId?: string;
}

export interface GitBranch {
  name: string;
  headCommit: string;
  missionId?: string;
  createdAt: number;
}

export interface GitRepo {
  initialized: boolean;
  branches: GitBranch[];
  commits: GitCommit[];
  currentBranch: string;
  // GitHub integration
  remoteUrl: string | null;
  githubToken: string | null;
  lastPush: number | null;
}

// Main Game State
export interface GameState {
  // Core state
  founder: Founder | null;
  project: Project | null;
  employees: Employee[];
  tasks: Task[];
  money: number;
  tick: number;
  
  // UI State
  screen: GameScreen;
  phase: GamePhase; // Current game flow phase
  speed: GameSpeed;
  selectedEmployeeId: string | null;
  selectedTaskId: string | null;
  selectedMissionId: string | null;
  
  // Activity
  activityLog: ActivityLogEntry[];
  notifications: GameNotification[];
  stats: GameStats;
  
  // AI Integration
  aiSettings: AISettings;
  aiWorkQueue: AIWorkItem[];
  
  // Task Queue
  taskQueue: QueuedTaskItem[];
  autoAssign: boolean;
  
  // Missions & Epics
  missions: Mission[];
  activeMissionId: string | null;
  epics: Epic[];
  
  // PM Brain
  pmBrain: PMBrainState;
  pmProposals: PMProposal[];
  
  // Git
  gitRepo: GitRepo | null;
  
  // RTS Features
  controlGroups: Record<number, string[]>;
  rallyPoints: RallyPoint[];
  upgrades: Upgrade[];
  minimapEvents: MinimapEvent[];
  
  // Achievements & Events
  achievements: Achievement[];
  activeEvents: ActiveEvent[];
  eventHistory: string[];
}

// Game Actions
export interface GameActions {
  // Initialization
  initializeGame: (founder: Founder, project: Project) => void;
  resetGame: () => void;
  importState: (state: Partial<GameState>) => void;
  
  // Navigation
  setScreen: (screen: GameScreen) => void;
  setPhase: (phase: GamePhase) => void;
  
  // Ideation Phase
  completeIdeation: () => void; // Called when PM finishes breaking down vision
  
  // Time Management
  setSpeed: (speed: GameSpeed) => void;
  tick: () => void;
  
  // Employee Management
  hireEmployee: (role: EmployeeRole, provider: AIProvider, model: string) => void;
  fireEmployee: (id: string) => void;
  selectEmployee: (id: string | null) => void;
  updateEmployeePrompt: (employeeId: string, systemPrompt?: string, customPrompt?: string) => void;
  
  // Task Management
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'progressTicks' | 'codeGenerated' | 'filesCreated' | 'artifacts' | 'aiWorkStarted' | 'aiWorkCompleted'>) => void;
  assignTask: (taskId: string, employeeId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  selectTask: (id: string | null) => void;
  deleteTask: (taskId: string) => void;
  
  // Money
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  
  // Notifications & Logging
  addNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
  logActivity: (entry: Omit<ActivityLogEntry, 'tick'> & { tick?: number }) => void;
  
  // AI Configuration
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
  
  // Missions
  createMission: (
    title: string,
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
- type: One of "feature", "bug", "design", "infrastructure"
- priority: One of "low", "medium", "high", "critical"
- estimatedHours: A number

Respond ONLY with the JSON array, no other text.`,
};

export const EMPLOYEE_TEMPLATES: EmployeeTemplate[] = [
  { 
    role: 'pm', 
    baseSalary: 8000, 
    title: 'Product Manager',
    description: 'Breaks down your idea into actionable tasks and manages priorities.',
    systemPrompt: ROLE_BASE_PROMPTS.pm,
  },
  { 
    role: 'designer', 
    baseSalary: 7000, 
    title: 'Designer',
    description: 'Creates UI/UX designs and generates CSS for your product.',
    systemPrompt: ROLE_BASE_PROMPTS.designer,
  },
  { 
    role: 'engineer', 
    baseSalary: 10000, 
    title: 'Engineer',
    description: 'Writes code, implements features, and fixes bugs.',
    systemPrompt: ROLE_BASE_PROMPTS.engineer,
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
