import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  GameActions,
  GameScreen,
  GameSpeed,
  Employee,
  EmployeeRole,
  EmployeeSkillLevel,
  Task,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskArtifact,
  ActivityLogEntry,
  QueuedTaskItem,
  Mission,
  MissionStatus,
  MissionPriority,
  MissionCommit,
  Epic,
  EpicStatus,
  ProductPhase,
  PMThought,
  PMBrainState,
  PMProposal,
  AIWorkItem,
  AgentMemory,
} from '../types';
import { 
  analyzeProductState, 
  evaluateNextMissions, 
  generatePMThoughts,
} from '../lib/pm/pmBrain';
import type { RallyPoint, MinimapEvent } from '../types/rts';
import type { ActiveEvent } from '../types/events';
import { DEFAULT_UPGRADES } from '../types/rts';
import { DEFAULT_ACHIEVEMENTS } from '../types/achievements';
import type { GameEvent as StoryEvent } from '../types/events';
import { DEFAULT_EVENTS } from '../types/events';
import {
  EMPLOYEE_TEMPLATES,
  FIRST_NAMES,
  LAST_NAMES,
  EVENT_DEFINITIONS,
  AI_MODELS,
} from '../types';
import type { AIProvider } from '../types';
import { aiService } from '../lib/ai';

// Task ideas that PMs can generate
const PM_TASK_IDEAS = [
  { title: 'User authentication flow', type: 'feature' as TaskType },
  { title: 'Dashboard analytics widget', type: 'feature' as TaskType },
  { title: 'Mobile responsive design', type: 'design' as TaskType },
  { title: 'API rate limiting', type: 'infrastructure' as TaskType },
  { title: 'Onboarding tutorial', type: 'feature' as TaskType },
  { title: 'Dark mode support', type: 'design' as TaskType },
  { title: 'Email notification system', type: 'feature' as TaskType },
  { title: 'Performance optimization', type: 'infrastructure' as TaskType },
  { title: 'Social media sharing', type: 'marketing' as TaskType },
  { title: 'User settings page', type: 'feature' as TaskType },
  { title: 'Search functionality', type: 'feature' as TaskType },
  { title: 'Landing page redesign', type: 'marketing' as TaskType },
  { title: 'Database backup system', type: 'infrastructure' as TaskType },
  { title: 'Accessibility improvements', type: 'design' as TaskType },
  { title: 'Payment integration', type: 'feature' as TaskType },
  { title: 'Admin dashboard', type: 'feature' as TaskType },
  { title: 'SEO optimization', type: 'marketing' as TaskType },
  { title: 'Error logging system', type: 'infrastructure' as TaskType },
  { title: 'User feedback form', type: 'feature' as TaskType },
  { title: 'Animation polish', type: 'design' as TaskType },
];

// Helper to generate random employee name
function generateEmployeeName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Helper to generate random productivity/morale
function generateRandomStat(base: number, variance: number): number {
  return Math.min(100, Math.max(0, base + Math.floor(Math.random() * variance * 2) - variance));
}

// Initial game state
const initialState: GameState = {
  screen: 'landing', // Start with landing page for new users
  gameSpeed: 'paused',
  tick: 0,
  startedAt: new Date(),
  money: 100000, // Start with $100k
  runway: 12, // 12 months runway
  project: null,
  employees: [],
  tasks: [],
  stats: {
    totalRevenue: 0,
    totalExpenses: 0,
    tasksCompleted: 0,
    linesOfCodeGenerated: 0,
    commitsCreated: 0,
    featuresShipped: 0,
  },
  aiSettings: {
    enabled: false,
    apiKey: null,
    provider: 'openai',
    model: 'gpt-4o-mini',
    providerKeys: {},
  },
  selectedEmployeeId: null,
  selectedTaskId: null,
  notifications: [],
  // RTS State
  activityLog: [],
  selectedEmployeeIds: [],
  isPaused: false,
  showCommandPalette: false,
  
  // Task Queue
  taskQueue: {
    items: [],
    autoAssignEnabled: true,
    lastProcessedAt: 0,
  },
  integrations: {
    github: { enabled: false, repo: null },
    linear: { enabled: false, teamId: null },
  },
  
  // RTS Features
  controlGroups: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, employeeIds: [] })),
  rallyPoints: [
    { taskType: 'feature', targetEmployeeIds: [], enabled: false },
    { taskType: 'bug', targetEmployeeIds: [], enabled: false },
    { taskType: 'design', targetEmployeeIds: [], enabled: false },
    { taskType: 'marketing', targetEmployeeIds: [], enabled: false },
    { taskType: 'infrastructure', targetEmployeeIds: [], enabled: false },
  ] as RallyPoint[],
  upgrades: DEFAULT_UPGRADES,
  alerts: [],
  minimapActivity: [],
  
  // Achievements & Events
  achievements: DEFAULT_ACHIEVEMENTS,
  activeEvents: [] as ActiveEvent[],
  totalPlayTime: 0,
  sessionStartTime: Date.now(),
  
  // Focus & Autopilot - Let users build without distractions
  focusMode: false,
  autopilot: false,
  eventsEnabled: true, // Can be disabled if distracting
  
  // Missions (PM-created feature branches as git worktrees)
  missions: [],
  activeMissionId: null,
  
  // PM Brain (continuous product thinking - human in the loop)
  pmBrain: {
    enabled: true,
    thoughts: [],
    proposals: [], // Suggestions awaiting player approval
    epics: [],
    productState: null,
    lastEvaluation: 0,
    evaluationInterval: 120, // Evaluate every 2 minutes of game time
  } as PMBrainState,
  
  // AI Work Queue
  aiWorkQueue: [],
  aiWorkInProgress: null,
};

// Create the store with persistence
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setScreen: (screen: GameScreen) => set({ screen }),

  // Game Control
  setGameSpeed: (speed: GameSpeed) => set({ gameSpeed: speed }),
  
  togglePause: () => {
    const state = get();
    if (state.gameSpeed === 'paused') {
      set({ gameSpeed: 'normal', isPaused: false });
    } else {
      set({ gameSpeed: 'paused', isPaused: true });
    }
  },

  gameTick: () => {
    const state = get();
    if (state.gameSpeed === 'paused') return;

    // Process employee work
    const updatedEmployees = state.employees.map(employee => {
      if (employee.status !== 'working' || !employee.currentTaskId) {
        return employee;
      }
      return employee;
    });

    // Process task progress
    const updatedTasks = state.tasks.map(task => {
      if (task.status !== 'in_progress' || !task.assigneeId) {
        return task;
      }

      const assignee = state.employees.find(e => e.id === task.assigneeId);
      if (!assignee) return task;

      // Calculate progress based on employee productivity
      const progressIncrement = assignee.productivity / 100;
      const newProgress = task.progressTicks + progressIncrement;

      if (newProgress >= task.estimatedTicks) {
        // Task goes to review
        get().logActivity({
          tick: state.tick,
          message: `${assignee.name} finished "${task.title}" → Ready for review`,
          type: 'work',
          employeeId: assignee.id,
          taskId: task.id,
        });
        return {
          ...task,
          progressTicks: task.estimatedTicks,
          status: 'review' as TaskStatus,
          completedAt: state.tick,
        };
      }

      return {
        ...task,
        progressTicks: newProgress,
      };
    });

    set({
      tick: state.tick + 1,
      employees: updatedEmployees,
      tasks: updatedTasks,
    });
  },

  // Project
  startProject: (idea: string) => {
    const projectName = idea.split(' ').slice(0, 3).join(' ');
    const tick = get().tick;
    set({
      project: {
        id: uuidv4(),
        name: projectName,
        description: idea,
        idea,
        techStack: ['TypeScript', 'React'],
        repository: null,
        createdAt: tick,
      },
      screen: 'rts', // Go to isometric RTS view (Civ/Warcraft style)
      gameSpeed: 'normal',
    });
    get().addNotification(`🚀 Started project: ${projectName}`, 'success');
    get().logActivity({
      tick,
      message: `Founded "${projectName}" - Let's build something great!`,
      type: 'system',
    });
  },

  // Team Management
  hireEmployee: (role: EmployeeRole, skillLevel: EmployeeSkillLevel) => {
    const template = EMPLOYEE_TEMPLATES.find(
      t => t.role === role && t.skillLevel === skillLevel
    );
    if (!template) return;

    const state = get();
    if (state.money < template.baseSalary) {
      get().addNotification('💸 Not enough money to hire!', 'error');
      return;
    }

    const baseProductivity = skillLevel === 'junior' ? 50 : 
                             skillLevel === 'mid' ? 70 : 
                             skillLevel === 'senior' ? 85 : 95;

    const newEmployee: Employee = {
      id: uuidv4(),
      name: generateEmployeeName(),
      role,
      skillLevel,
      status: 'idle',
      avatarEmoji: template.emoji,
      salary: template.baseSalary,
      productivity: generateRandomStat(baseProductivity, 10),
      morale: generateRandomStat(80, 15),
      currentTaskId: null,
      hiredAt: state.tick,
      aiModel: null, // Uses global default
      aiProvider: null,
      memory: [],
      tasksCompleted: 0,
      specializations: [],
    };

    set({
      employees: [...state.employees, newEmployee],
      money: state.money - template.baseSalary, // First month's salary upfront
    });

    get().addNotification(`👋 Hired ${newEmployee.name} as ${template.title}!`, 'success');
    get().logActivity({
      tick: state.tick,
      message: `Hired ${newEmployee.name} (${template.title})`,
      type: 'hire',
      employeeId: newEmployee.id,
    });
  },

  fireEmployee: (id: string) => {
    const state = get();
    const employee = state.employees.find(e => e.id === id);
    if (!employee) return;

    // Unassign any tasks
    const updatedTasks = state.tasks.map(task => 
      task.assigneeId === id 
        ? { ...task, assigneeId: null, status: 'todo' as TaskStatus }
        : task
    );

    set({
      employees: state.employees.filter(e => e.id !== id),
      tasks: updatedTasks,
      selectedEmployeeId: state.selectedEmployeeId === id ? null : state.selectedEmployeeId,
    });

    get().addNotification(`👋 ${employee.name} has left the company.`, 'info');
  },

  // Task Management
  createTask: (taskData) => {
    const state = get();
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      progressTicks: 0,
      createdAt: state.tick,
      completedAt: null,
      codeGenerated: null,
      filesCreated: [],
      artifacts: [],
      aiWorkStarted: false,
      aiWorkCompleted: false,
    };

    set({ tasks: [...state.tasks, newTask] });
    get().addNotification(`📋 Created task: ${newTask.title}`, 'info');
  },

  assignTask: (taskId: string, employeeId: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    const employee = state.employees.find(e => e.id === employeeId);
    
    if (!task || !employee) return;

    // Update task
    const updatedTasks = state.tasks.map(t =>
      t.id === taskId
        ? { ...t, assigneeId: employeeId, status: 'in_progress' as TaskStatus }
        : t
    );

    // Update employee
    const updatedEmployees = state.employees.map(e =>
      e.id === employeeId
        ? { ...e, status: 'working' as const, currentTaskId: taskId }
        : e
    );

    set({
      tasks: updatedTasks,
      employees: updatedEmployees,
    });

    get().addNotification(`✅ Assigned "${task.title}" to ${employee.name}`, 'success');
    
    // Queue AI work if AI is enabled
    if (state.aiSettings.enabled) {
      get().queueAIWork(taskId, employeeId);
    }
    
    get().logActivity({
      tick: state.tick,
      message: `${employee.name} started working on "${task.title}"`,
      type: 'work',
      employeeId: employee.id,
      taskId: task.id,
    });
  },

  updateTaskStatus: (taskId: string, status: TaskStatus) => {
    const state = get();
    
    const updatedTasks = state.tasks.map(t =>
      t.id === taskId ? { ...t, status } : t
    );

    // If task is done, free up the employee
    if (status === 'done') {
      const task = state.tasks.find(t => t.id === taskId);
      if (task?.assigneeId) {
        const updatedEmployees = state.employees.map(e =>
          e.id === task.assigneeId
            ? { ...e, status: 'idle' as const, currentTaskId: null }
            : e
        );
        set({
          tasks: updatedTasks,
          employees: updatedEmployees,
          stats: {
            ...state.stats,
            tasksCompleted: state.stats.tasksCompleted + 1,
          },
        });
        get().addNotification(`🎉 Task completed: ${task.title}`, 'success');
        get().logActivity({
          tick: state.tick,
          message: `✅ "${task.title}" completed!`,
          type: 'complete',
          employeeId: task.assigneeId || undefined,
          taskId: task.id,
        });
        return;
      }
    }

    set({ tasks: updatedTasks });
  },

  // Unassign task
  unassignTask: (taskId: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.assigneeId) return;

    const employee = state.employees.find(e => e.id === task.assigneeId);
    
    const updatedTasks = state.tasks.map(t =>
      t.id === taskId
        ? { ...t, assigneeId: null, status: 'todo' as TaskStatus }
        : t
    );

    const updatedEmployees = state.employees.map(e =>
      e.id === task.assigneeId
        ? { ...e, status: 'idle' as const, currentTaskId: null }
        : e
    );

    set({ tasks: updatedTasks, employees: updatedEmployees });
    
    if (employee) {
      get().logActivity({
        tick: state.tick,
        message: `${employee.name} unassigned from "${task.title}"`,
        type: 'task',
        employeeId: employee.id,
        taskId: task.id,
      });
    }
  },

  // Selection (RTS-style)
  selectEmployee: (id) => set({ 
    selectedEmployeeId: id,
    selectedEmployeeIds: id ? [id] : [],
  }),
  
  selectEmployees: (ids) => set({ 
    selectedEmployeeIds: ids,
    selectedEmployeeId: ids[0] || null,
  }),
  
  addToSelection: (id) => {
    const state = get();
    if (!state.selectedEmployeeIds.includes(id)) {
      set({ 
        selectedEmployeeIds: [...state.selectedEmployeeIds, id],
        selectedEmployeeId: id,
      });
    }
  },
  
  selectTask: (id) => set({ selectedTaskId: id }),
  
  clearSelection: () => set({ 
    selectedEmployeeId: null, 
    selectedEmployeeIds: [],
    selectedTaskId: null,
  }),
  
  selectAllIdle: () => {
    const state = get();
    const idleIds = state.employees
      .filter(e => e.status === 'idle')
      .map(e => e.id);
    set({ 
      selectedEmployeeIds: idleIds,
      selectedEmployeeId: idleIds[0] || null,
    });
    if (idleIds.length > 0) {
      get().addNotification(`Selected ${idleIds.length} idle employee(s)`, 'info');
    }
  },
  
  // Quick Commands (RTS hotkeys)
  quickAssignToTask: (taskId: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Find first selected idle employee that matches task type
    const roleForTask = task.type === 'feature' || task.type === 'bug' || task.type === 'infrastructure' 
      ? 'engineer'
      : task.type === 'design' 
      ? 'designer' 
      : task.type === 'marketing' 
      ? 'marketer' 
      : null;
    
    const selectedEmployee = state.employees.find(e => 
      state.selectedEmployeeIds.includes(e.id) && 
      e.status === 'idle' &&
      (!roleForTask || e.role === roleForTask)
    ) || state.employees.find(e => 
      state.selectedEmployeeIds.includes(e.id) && 
      e.status === 'idle'
    );
    
    if (selectedEmployee) {
      get().assignTask(taskId, selectedEmployee.id);
      get().logActivity({
        tick: state.tick,
        message: `Quick assigned: ${selectedEmployee.name} → "${task.title}"`,
        type: 'task',
        employeeId: selectedEmployee.id,
        taskId,
      });
    } else {
      get().addNotification('No suitable idle employee selected', 'warning');
    }
  },
  
  quickHire: (role: EmployeeRole) => {
    // Hire a mid-level employee of this role
    get().hireEmployee(role, 'mid');
  },
  
  boostMorale: () => {
    const state = get();
    if (state.money < 1000) {
      get().addNotification('Not enough money for team boost ($1,000 needed)', 'error');
      return;
    }
    
    const boostedEmployees = state.employees.map(e => ({
      ...e,
      morale: Math.min(100, e.morale + 20),
      productivity: Math.min(100, e.productivity + 5),
    }));
    
    set({ 
      employees: boostedEmployees,
      money: state.money - 1000,
    });
    
    get().addNotification('🍕 Team pizza party! Morale boosted (+20)', 'success');
    get().logActivity({
      tick: state.tick,
      message: 'Team morale boosted with pizza party',
      type: 'event',
    });
  },

  // Activity Log
  logActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    set(state => ({
      activityLog: [newEntry, ...state.activityLog].slice(0, 100), // Keep last 100 entries
    }));
  },
  
  // Command Palette
  toggleCommandPalette: () => set(state => ({ showCommandPalette: !state.showCommandPalette })),

  // Notifications
  addNotification: (message, type) => {
    const notification = {
      id: uuidv4(),
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 10),
    }));
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  // Random Events
  triggerRandomEvent: () => {
    const state = get();
    if (state.employees.length === 0) return;

    const eventDef = EVENT_DEFINITIONS[Math.floor(Math.random() * EVENT_DEFINITIONS.length)];
    
    // Apply event effects
    switch (eventDef.type) {
      case 'morale_boost':
      case 'team_lunch':
      case 'viral_moment': {
        const boostedEmployees = state.employees.map(e => ({
          ...e,
          morale: Math.min(100, e.morale + 15),
        }));
        set({ employees: boostedEmployees });
        break;
      }
      case 'morale_drop':
      case 'coffee_machine_broken': {
        const droppedEmployees = state.employees.map(e => ({
          ...e,
          morale: Math.max(0, e.morale - 10),
        }));
        set({ employees: droppedEmployees });
        break;
      }
      case 'productivity_boost': {
        const boostedEmployees = state.employees.map(e => ({
          ...e,
          productivity: Math.min(100, e.productivity + 10),
        }));
        set({ employees: boostedEmployees });
        break;
      }
      case 'investor_interest': {
        const bonus = 10000 + Math.floor(Math.random() * 15000);
        set({ money: state.money + bonus });
        get().addNotification(`💰 Received ${bonus.toLocaleString()} in bonus funding!`, 'success');
        break;
      }
      case 'bug_discovered': {
        get().createTask({
          title: 'Critical: Fix production bug',
          description: 'Users are reporting issues. High priority fix needed.',
          type: 'bug',
          priority: 'critical',
          status: 'todo',
          assigneeId: null,
          estimatedTicks: 50,
        });
        break;
      }
      case 'server_outage': {
        get().createTask({
          title: 'Infrastructure: Server stability',
          description: 'Improve server reliability and monitoring.',
          type: 'infrastructure',
          priority: 'high',
          status: 'todo',
          assigneeId: null,
          estimatedTicks: 80,
        });
        break;
      }
      case 'competitor_launch': {
        // Speed boost for a while - morale boost from competition
        const motivatedEmployees = state.employees.map(e => ({
          ...e,
          productivity: Math.min(100, e.productivity + 5),
        }));
        set({ employees: motivatedEmployees });
        break;
      }
    }

    get().addNotification(`${eventDef.title}: ${eventDef.description}`, 'info');
  },

  // PM Task Generation
  pmGenerateTask: () => {
    const state = get();
    const pms = state.employees.filter(e => e.role === 'pm' && e.status === 'idle');
    
    if (pms.length === 0) {
      get().addNotification('📊 No available PMs to generate tasks', 'warning');
      return;
    }

    // Get unused task ideas
    const existingTitles = state.tasks.map(t => t.title.toLowerCase());
    const availableIdeas = PM_TASK_IDEAS.filter(
      idea => !existingTitles.includes(idea.title.toLowerCase())
    );

    if (availableIdeas.length === 0) {
      get().addNotification('📊 PM has no new task ideas right now', 'info');
      return;
    }

    // PM generates task based on skill level
    const pm = pms[0];
    const numTasks = pm.skillLevel === 'senior' ? 3 : pm.skillLevel === 'mid' ? 2 : 1;
    
    for (let i = 0; i < Math.min(numTasks, availableIdeas.length); i++) {
      const idea = availableIdeas[Math.floor(Math.random() * availableIdeas.length)];
      const priorities: TaskPriority[] = ['low', 'medium', 'medium', 'high'];
      
      get().createTask({
        title: idea.title,
        description: `Task created by ${pm.name}`,
        type: idea.type,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: 'backlog',
        assigneeId: null,
        estimatedTicks: 60 + Math.floor(Math.random() * 80),
      });
    }

    get().addNotification(`📊 ${pm.name} added ${numTasks} task(s) to the backlog!`, 'success');
  },

  // AI Configuration
  configureAI: (apiKey: string, provider?: AIProvider) => {
    const currentProvider = provider || get().aiSettings.provider;
    aiService.configure(apiKey);
    set({
      aiSettings: {
        ...get().aiSettings,
        enabled: true,
        apiKey,
        provider: currentProvider,
        providerKeys: {
          ...get().aiSettings.providerKeys,
          [currentProvider]: apiKey,
        },
      },
    });
    get().addNotification(`🤖 AI agents activated with ${currentProvider.toUpperCase()}!`, 'success');
  },

  configureProviderKey: (provider: AIProvider, apiKey: string) => {
    set({
      aiSettings: {
        ...get().aiSettings,
        providerKeys: {
          ...get().aiSettings.providerKeys,
          [provider]: apiKey,
        },
      },
    });
    get().addNotification(`🔑 ${provider.toUpperCase()} API key saved.`, 'info');
  },

  setGlobalModel: (modelId: string) => {
    // Find the model to get its provider
    const model = AI_MODELS.find(m => m.id === modelId);
    if (model) {
      set({
        aiSettings: {
          ...get().aiSettings,
          model: modelId,
          provider: model.provider,
        },
      });
      get().addNotification(`🧠 Default model set to ${model.name}`, 'info');
    }
  },

  setEmployeeModel: (employeeId: string, modelId: string | null, provider?: AIProvider | null) => {
    set({
      employees: get().employees.map(e => 
        e.id === employeeId 
          ? { ...e, aiModel: modelId, aiProvider: provider ?? null }
          : e
      ),
    });
    
    const employee = get().employees.find(e => e.id === employeeId);
    if (employee) {
      if (modelId) {
        const model = AI_MODELS.find(m => m.id === modelId);
        get().addNotification(`🤖 ${employee.name} now uses ${model?.name || modelId}`, 'info');
      } else {
        get().addNotification(`🤖 ${employee.name} now uses global default model`, 'info');
      }
    }
  },

  disableAI: () => {
    aiService.disable();
    set({
      aiSettings: {
        ...get().aiSettings,
        enabled: false,
      },
    });
    get().addNotification('🤖 AI agents disabled. Running in simulation mode.', 'info');
  },

  // AI Task Execution
  aiWorkOnTask: async (taskId: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const assignee = state.employees.find(e => e.id === task.assigneeId);
    if (!assignee) return;

    get().addNotification(`🤖 ${assignee.name} is using AI to work on "${task.title}"...`, 'info');

    try {
      if (assignee.role === 'engineer') {
        const result = await aiService.engineerWorkOnTask(
          task,
          state.project?.idea || 'A startup project'
        );

        // Create artifacts for each generated file
        const newArtifacts: TaskArtifact[] = result.files.map((file, index) => ({
          id: uuidv4(),
          type: 'code' as const,
          title: file.path.split('/').pop() || `File ${index + 1}`,
          content: file.content,
          language: file.path.endsWith('.tsx') ? 'typescript' : 
                    file.path.endsWith('.ts') ? 'typescript' :
                    file.path.endsWith('.css') ? 'css' :
                    file.path.endsWith('.json') ? 'json' : 'text',
          filePath: file.path,
          createdAt: state.tick,
          createdBy: assignee.id,
          modelUsed: assignee.aiModel || state.aiSettings.model,
        }));

        // Update task with generated code and artifacts
        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: result.code,
                filesCreated: result.files.map(f => f.path),
                artifacts: [...t.artifacts, ...newArtifacts],
                progressTicks: t.estimatedTicks, // Complete immediately
                status: 'review' as TaskStatus,
                aiWorkCompleted: true,
              }
            : t
        );

        set({
          tasks: updatedTasks,
          stats: {
            ...state.stats,
            linesOfCodeGenerated: state.stats.linesOfCodeGenerated + result.code.split('\n').length,
            commitsCreated: state.stats.commitsCreated + 1,
          },
        });

        get().logActivity({
          tick: state.tick,
          message: `📦 ${assignee.name} generated ${newArtifacts.length} file(s) for "${task.title}"`,
          type: 'ai',
          employeeId: assignee.id,
          taskId,
        });

        // Add memory for the employee
        const tags = [
          task.type,
          ...result.files.map(f => f.path.split('/').pop()?.split('.')[0] || '').filter(Boolean),
        ];
        get().addEmployeeMemory(assignee.id, {
          type: 'task',
          content: `Completed ${task.type} task: "${task.title}" - Created ${result.files.length} files (${result.files.map(f => f.path).join(', ')})`,
          importance: task.priority === 'critical' ? 1 : task.priority === 'high' ? 0.8 : 0.5,
          taskId,
          tags,
        });
        
        // Update task count and specializations
        set(state => ({
          employees: state.employees.map(e =>
            e.id === assignee.id
              ? { ...e, tasksCompleted: e.tasksCompleted + 1 }
              : e
          ),
        }));
        get().updateEmployeeSpecializations(assignee.id);

        get().addNotification(`✨ ${assignee.name} completed "${task.title}" with AI!`, 'success');
      } else if (assignee.role === 'pm') {
        // PM uses AI to generate more tasks
        const newTasks = await aiService.pmGenerateTasks(
          state.project?.idea || 'A startup project',
          state.tasks.map(t => t.title),
          {
            engineers: state.employees.filter(e => e.role === 'engineer').length,
            designers: state.employees.filter(e => e.role === 'designer').length,
            marketers: state.employees.filter(e => e.role === 'marketer').length,
          }
        );

        for (const newTask of newTasks) {
          get().createTask({
            title: newTask.title,
            description: newTask.description,
            type: newTask.type,
            priority: newTask.priority,
            status: 'backlog',
            assigneeId: null,
            estimatedTicks: newTask.estimatedTicks,
          });
        }

        get().addNotification(`📊 ${assignee.name} created ${newTasks.length} new tasks with AI!`, 'success');
      } else if (assignee.role === 'designer') {
        const result = await aiService.designerCreateSpec(
          task.title,
          task.description
        );

        // Create design artifacts
        const designArtifact: TaskArtifact = {
          id: uuidv4(),
          type: 'design',
          title: `Design: ${task.title}`,
          content: `## Design Spec\n\n${result.description}\n\n## CSS\n\n\`\`\`css\n${result.css}\n\`\`\``,
          createdAt: state.tick,
          createdBy: assignee.id,
          modelUsed: assignee.aiModel || state.aiSettings.model,
        };

        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: result.css,
                artifacts: [...t.artifacts, designArtifact],
                progressTicks: t.estimatedTicks,
                status: 'review' as TaskStatus,
                aiWorkCompleted: true,
              }
            : t
        );

        set({ tasks: updatedTasks });

        get().logActivity({
          tick: state.tick,
          message: `🎨 ${assignee.name} created design for "${task.title}"`,
          type: 'ai',
          employeeId: assignee.id,
          taskId,
        });

        // Add memory
        get().addEmployeeMemory(assignee.id, {
          type: 'task',
          content: `Designed: "${task.title}" - ${result.description.slice(0, 100)}`,
          importance: task.priority === 'critical' ? 1 : task.priority === 'high' ? 0.8 : 0.5,
          taskId,
          tags: ['design', task.type, 'css', 'ui'],
        });
        set(state => ({
          employees: state.employees.map(e =>
            e.id === assignee.id
              ? { ...e, tasksCompleted: e.tasksCompleted + 1 }
              : e
          ),
        }));
        get().updateEmployeeSpecializations(assignee.id);

        get().addNotification(`🎨 ${assignee.name} completed design for "${task.title}"!`, 'success');
      } else if (assignee.role === 'marketer') {
        const result = await aiService.marketerCreateContent(
          state.project?.name || 'Product',
          state.project?.idea || '',
          'landing-page'
        );

        const fullContent = `# ${result.headline}\n\n${result.content}\n\n**CTA:** ${result.cta}`;

        // Create marketing artifacts
        const copyArtifact: TaskArtifact = {
          id: uuidv4(),
          type: 'copy',
          title: `Marketing: ${task.title}`,
          content: fullContent,
          createdAt: state.tick,
          createdBy: assignee.id,
          modelUsed: assignee.aiModel || state.aiSettings.model,
        };

        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: fullContent,
                artifacts: [...t.artifacts, copyArtifact],
                progressTicks: t.estimatedTicks,
                status: 'review' as TaskStatus,
                aiWorkCompleted: true,
              }
            : t
        );

        set({ tasks: updatedTasks });

        get().logActivity({
          tick: state.tick,
          message: `📝 ${assignee.name} created marketing content for "${task.title}"`,
          type: 'ai',
          employeeId: assignee.id,
          taskId,
        });

        // Add memory
        get().addEmployeeMemory(assignee.id, {
          type: 'task',
          content: `Created marketing: "${task.title}" - Headline: "${result.headline}"`,
          importance: task.priority === 'critical' ? 1 : task.priority === 'high' ? 0.8 : 0.5,
          taskId,
          tags: ['marketing', 'copy', 'content', task.type],
        });
        set(state => ({
          employees: state.employees.map(e =>
            e.id === assignee.id
              ? { ...e, tasksCompleted: e.tasksCompleted + 1 }
              : e
          ),
        }));
        get().updateEmployeeSpecializations(assignee.id);

        get().addNotification(`📢 ${assignee.name} created marketing content!`, 'success');
      }
    } catch (error) {
      console.error('AI work error:', error);
      get().addNotification(`⚠️ AI encountered an error. Falling back to simulation.`, 'warning');
    }
  },

  // ============================================
  // AI Work Queue - Background AI execution
  // ============================================

  queueAIWork: (taskId: string, employeeId: string) => {
    const state = get();
    const task = state.tasks.find(t => t.id === taskId);
    
    // Don't queue if already queued or AI work already done
    if (!task || task.aiWorkStarted) return;
    
    // Check if already in queue
    if (state.aiWorkQueue.some(w => w.taskId === taskId)) return;
    
    const workItem: AIWorkItem = {
      id: uuidv4(),
      taskId,
      employeeId,
      priority: task.priority === 'critical' ? 1 : task.priority === 'high' ? 2 : task.priority === 'medium' ? 3 : 4,
      addedAt: Date.now(),
      status: 'queued',
      retries: 0,
    };
    
    set({
      aiWorkQueue: [...state.aiWorkQueue, workItem].sort((a, b) => a.priority - b.priority),
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, aiWorkStarted: true } : t
      ),
    });
    
    get().logActivity({
      tick: state.tick,
      message: `🤖 Queued AI work for "${task.title}"`,
      type: 'ai',
      taskId,
    });
  },

  processAIWorkQueue: async () => {
    const state = get();
    
    // Skip if already processing or queue is empty or AI is disabled
    if (state.aiWorkInProgress || state.aiWorkQueue.length === 0 || !state.aiSettings.enabled) {
      return;
    }
    
    // Get next item
    const nextItem = state.aiWorkQueue.find(w => w.status === 'queued');
    if (!nextItem) return;
    
    // Mark as in progress
    set({
      aiWorkInProgress: nextItem.taskId,
      aiWorkQueue: state.aiWorkQueue.map(w =>
        w.id === nextItem.id ? { ...w, status: 'in_progress' as const } : w
      ),
    });
    
    try {
      // Execute AI work
      await get().aiWorkOnTask(nextItem.taskId);
      
      // Mark as completed
      set(state => ({
        aiWorkInProgress: null,
        aiWorkQueue: state.aiWorkQueue.filter(w => w.id !== nextItem.id),
        tasks: state.tasks.map(t =>
          t.id === nextItem.taskId ? { ...t, aiWorkCompleted: true } : t
        ),
      }));
      
    } catch (error) {
      console.error('AI work queue error:', error);
      
      // Retry or fail
      set(state => {
        const item = state.aiWorkQueue.find(w => w.id === nextItem.id);
        if (item && item.retries < 2) {
          return {
            aiWorkInProgress: null,
            aiWorkQueue: state.aiWorkQueue.map(w =>
              w.id === nextItem.id ? { ...w, status: 'queued' as const, retries: w.retries + 1 } : w
            ),
          };
        }
        return {
          aiWorkInProgress: null,
          aiWorkQueue: state.aiWorkQueue.filter(w => w.id !== nextItem.id),
        };
      });
    }
  },

  addTaskArtifact: (taskId: string, artifact: Omit<TaskArtifact, 'id' | 'createdAt'>) => {
    const state = get();
    const newArtifact: TaskArtifact = {
      ...artifact,
      id: uuidv4(),
      createdAt: state.tick,
    };
    
    set({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, artifacts: [...t.artifacts, newArtifact] }
          : t
      ),
    });
    
    get().logActivity({
      tick: state.tick,
      message: `📦 Generated ${artifact.type}: ${artifact.title}`,
      type: 'ai',
      taskId,
    });
  },

  // ============================================
  // Agent Memory - Employees remember past work
  // ============================================

  addEmployeeMemory: (employeeId: string, memory: Omit<AgentMemory, 'id' | 'createdAt'>) => {
    const state = get();
    const newMemory: AgentMemory = {
      ...memory,
      id: uuidv4(),
      createdAt: state.tick,
    };
    
    set({
      employees: state.employees.map(e =>
        e.id === employeeId
          ? { 
              ...e, 
              memory: [...e.memory, newMemory].slice(-50), // Keep last 50 memories
            }
          : e
      ),
    });
  },

  getEmployeeContext: (employeeId: string, taskTitle?: string) => {
    const state = get();
    const employee = state.employees.find(e => e.id === employeeId);
    if (!employee) return '';
    
    // Build context from memories
    const relevantMemories = employee.memory
      .filter(m => {
        if (!taskTitle) return true;
        // Prioritize memories with matching tags
        const lowerTitle = taskTitle.toLowerCase();
        return m.tags.some(tag => lowerTitle.includes(tag.toLowerCase())) ||
               m.content.toLowerCase().includes(lowerTitle);
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
    
    if (relevantMemories.length === 0) return '';
    
    const context = [
      `## ${employee.name}'s Experience`,
      '',
      `**Tasks Completed:** ${employee.tasksCompleted}`,
      `**Specializations:** ${employee.specializations.join(', ') || 'Generalist'}`,
      '',
      '### Recent Experience:',
      ...relevantMemories.map(m => `- ${m.content}`),
    ].join('\n');
    
    return context;
  },

  updateEmployeeSpecializations: (employeeId: string) => {
    const state = get();
    const employee = state.employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    // Count tags from memories to determine specializations
    const tagCounts: Record<string, number> = {};
    employee.memory.forEach(m => {
      m.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Top 5 most common tags become specializations
    const specializations = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    
    set({
      employees: state.employees.map(e =>
        e.id === employeeId
          ? { ...e, specializations }
          : e
      ),
    });
  },

  // ============================================
  // Task Queue - RTS-style continuous execution
  // ============================================
  
  addToQueue: (item) => {
    const state = get();
    const newItem: QueuedTaskItem = {
      ...item,
      id: uuidv4(),
      queuePosition: state.taskQueue.items.length,
      addedAt: Date.now(),
      status: 'queued',
    };
    
    set({
      taskQueue: {
        ...state.taskQueue,
        items: [...state.taskQueue.items, newItem],
      },
    });
    
    get().logActivity({
      tick: state.tick,
      message: `Added to queue: "${item.title}"`,
      type: 'task',
    });
  },
  
  removeFromQueue: (id) => {
    const state = get();
    const updatedItems = state.taskQueue.items
      .filter(item => item.id !== id)
      .map((item, index) => ({ ...item, queuePosition: index }));
    
    set({
      taskQueue: {
        ...state.taskQueue,
        items: updatedItems,
      },
    });
  },
  
  reorderQueue: (id, newPosition) => {
    const state = get();
    const items = [...state.taskQueue.items];
    const currentIndex = items.findIndex(item => item.id === id);
    
    if (currentIndex === -1) return;
    
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newPosition, 0, movedItem);
    
    const reorderedItems = items.map((item, index) => ({
      ...item,
      queuePosition: index,
    }));
    
    set({
      taskQueue: {
        ...state.taskQueue,
        items: reorderedItems,
      },
    });
  },
  
  processQueue: () => {
    const state = get();
    if (!state.taskQueue.autoAssignEnabled) return;
    
    // Find idle employees
    const idleEmployees = state.employees.filter(e => e.status === 'idle');
    if (idleEmployees.length === 0) return;
    
    // Find queued items ready for processing
    const queuedItems = state.taskQueue.items.filter(item => item.status === 'queued');
    if (queuedItems.length === 0) return;
    
    // Process queue items
    let updatedItems = [...state.taskQueue.items];
    const tasksToCreate: Array<{
      title: string;
      description: string;
      type: TaskType;
      priority: TaskPriority;
      status: TaskStatus;
      assigneeId: string | null;
      estimatedTicks: number;
    }> = [];
    const employeesToUpdate: Array<{ id: string; status: 'working'; currentTaskId: string }> = [];
    
    for (const item of queuedItems) {
      // Find suitable idle employee
      const preferredRole = item.preferredRole || (
        item.type === 'feature' || item.type === 'bug' || item.type === 'infrastructure' ? 'engineer' :
        item.type === 'design' ? 'designer' :
        item.type === 'marketing' ? 'marketer' : 'engineer'
      );
      
      const employee = idleEmployees.find(e => e.role === preferredRole) || idleEmployees[0];
      
      if (employee && item.autoAssign) {
        // Create task from queue item
        const taskId = uuidv4();
        const estimatedTicks = item.priority === 'critical' ? 40 :
                               item.priority === 'high' ? 60 :
                               item.priority === 'medium' ? 80 : 100;
        
        tasksToCreate.push({
          title: item.title,
          description: item.description,
          type: item.type,
          priority: item.priority,
          status: 'in_progress',
          assigneeId: employee.id,
          estimatedTicks,
        });
        
        employeesToUpdate.push({
          id: employee.id,
          status: 'working',
          currentTaskId: taskId,
        });
        
        // Update queue item status
        updatedItems = updatedItems.map(i => 
          i.id === item.id 
            ? { ...i, status: 'assigned' as const, taskId }
            : i
        );
        
        // Remove from available employees
        idleEmployees.splice(idleEmployees.indexOf(employee), 1);
        
        get().logActivity({
          tick: state.tick,
          message: `Queue: Auto-assigned "${item.title}" to ${employee.name}`,
          type: 'task',
          employeeId: employee.id,
        });
        
        if (idleEmployees.length === 0) break;
      }
    }
    
    // Apply updates
    if (tasksToCreate.length > 0) {
      const newTasks: Task[] = tasksToCreate.map(t => ({
        id: uuidv4(),
        ...t,
        progressTicks: 0,
        createdAt: state.tick,
        completedAt: null,
        codeGenerated: null,
        filesCreated: [],
        artifacts: [],
        aiWorkStarted: false,
        aiWorkCompleted: false,
      }));
      
      const updatedEmployees = state.employees.map(emp => {
        const update = employeesToUpdate.find(u => u.id === emp.id);
        return update ? { ...emp, ...update } : emp;
      });
      
      set({
        tasks: [...state.tasks, ...newTasks],
        employees: updatedEmployees,
        taskQueue: {
          ...state.taskQueue,
          items: updatedItems,
          lastProcessedAt: Date.now(),
        },
      });
    }
  },
  
  toggleAutoAssign: () => {
    const state = get();
    set({
      taskQueue: {
        ...state.taskQueue,
        autoAssignEnabled: !state.taskQueue.autoAssignEnabled,
      },
    });
    get().addNotification(
      state.taskQueue.autoAssignEnabled 
        ? '⏸️ Auto-assign paused' 
        : '▶️ Auto-assign enabled',
      'info'
    );
  },
  
  importFromGitHub: (issues) => {
    const state = get();
    
    const items: QueuedTaskItem[] = issues.map((issue, index) => {
      // Determine type from labels
      const labels = issue.labels.map(l => l.name.toLowerCase());
      const type: TaskType = 
        labels.includes('bug') ? 'bug' :
        labels.includes('design') ? 'design' :
        labels.includes('marketing') ? 'marketing' :
        labels.includes('infrastructure') || labels.includes('infra') ? 'infrastructure' :
        'feature';
      
      // Determine priority from labels
      const priority: TaskPriority =
        labels.includes('critical') || labels.includes('urgent') ? 'critical' :
        labels.includes('high') || labels.includes('priority') ? 'high' :
        labels.includes('low') ? 'low' :
        'medium';
      
      return {
        id: uuidv4(),
        externalId: `github-${issue.number}`,
        source: 'github' as const,
        sourceUrl: `https://github.com/${state.integrations.github.repo}/issues/${issue.number}`,
        title: issue.title,
        description: issue.body || '',
        type,
        priority,
        labels: issue.labels.map(l => l.name),
        queuePosition: state.taskQueue.items.length + index,
        autoAssign: true,
        addedAt: Date.now(),
        status: 'queued' as const,
      };
    });
    
    set({
      taskQueue: {
        ...state.taskQueue,
        items: [...state.taskQueue.items, ...items],
      },
    });
    
    get().addNotification(`📥 Imported ${items.length} issues from GitHub`, 'success');
    get().logActivity({
      tick: state.tick,
      message: `Imported ${items.length} issues from GitHub`,
      type: 'system',
    });
  },
  
  importFromLinear: (issues) => {
    const state = get();
    
    const items: QueuedTaskItem[] = issues.map((issue, index) => {
      // Determine type from labels
      const labels = issue.labels.map(l => l.name.toLowerCase());
      const type: TaskType = 
        labels.includes('bug') ? 'bug' :
        labels.includes('design') ? 'design' :
        labels.includes('marketing') ? 'marketing' :
        labels.includes('infrastructure') ? 'infrastructure' :
        'feature';
      
      // Priority: 0 = none, 1 = urgent, 2 = high, 3 = normal, 4 = low
      const priority: TaskPriority =
        issue.priority === 1 ? 'critical' :
        issue.priority === 2 ? 'high' :
        issue.priority === 4 ? 'low' :
        'medium';
      
      return {
        id: uuidv4(),
        externalId: `linear-${issue.id}`,
        source: 'linear' as const,
        sourceUrl: `https://linear.app/issue/${issue.identifier}`,
        title: `${issue.identifier}: ${issue.title}`,
        description: issue.description || '',
        type,
        priority,
        labels: issue.labels.map(l => l.name),
        queuePosition: state.taskQueue.items.length + index,
        autoAssign: true,
        addedAt: Date.now(),
        status: 'queued' as const,
      };
    });
    
    set({
      taskQueue: {
        ...state.taskQueue,
        items: [...state.taskQueue.items, ...items],
      },
    });
    
    get().addNotification(`📥 Imported ${items.length} issues from Linear`, 'success');
    get().logActivity({
      tick: state.tick,
      message: `Imported ${items.length} issues from Linear`,
      type: 'system',
    });
  },
  
  clearQueue: () => {
    set(state => ({
      taskQueue: {
        ...state.taskQueue,
        items: state.taskQueue.items.filter(i => i.status === 'assigned'),
      },
    }));
    get().addNotification('🗑️ Queue cleared', 'info');
  },

  // ============================================
  // RTS Features - Control Groups, Rally Points, Upgrades
  // ============================================
  
  setControlGroup: (groupId, employeeIds) => {
    const state = get();
    const newGroups = state.controlGroups.map(g => 
      g.id === groupId ? { ...g, employeeIds } : g
    );
    set({ controlGroups: newGroups });
    
    if (employeeIds.length > 0) {
      get().addNotification(`🎮 Control group ${groupId} set (${employeeIds.length} units)`, 'info');
    }
  },
  
  selectControlGroup: (groupId) => {
    const state = get();
    const group = state.controlGroups.find(g => g.id === groupId);
    if (group && group.employeeIds.length > 0) {
      set({ selectedEmployeeIds: group.employeeIds });
      get().addNotification(`🎮 Selected group ${groupId}`, 'info');
    }
  },
  
  setRallyPoint: (taskType, employeeIds) => {
    const state = get();
    const newRallyPoints = state.rallyPoints.map(rp => 
      rp.taskType === taskType 
        ? { ...rp, targetEmployeeIds: employeeIds, enabled: employeeIds.length > 0 }
        : rp
    );
    set({ rallyPoints: newRallyPoints });
    
    if (employeeIds.length > 0) {
      get().addNotification(`🚩 Rally point set: ${taskType} → ${employeeIds.length} employees`, 'info');
    }
  },
  
  purchaseUpgrade: (upgradeId) => {
    const state = get();
    const upgrade = state.upgrades.find(u => u.id === upgradeId);
    
    if (!upgrade) return;
    if (upgrade.purchased) {
      get().addNotification('Already purchased!', 'warning');
      return;
    }
    if (!upgrade.unlocked) {
      get().addNotification('Upgrade not unlocked yet!', 'warning');
      return;
    }
    if (state.money < upgrade.cost) {
      get().addNotification(`Not enough money! Need $${upgrade.cost.toLocaleString()}`, 'error');
      return;
    }
    
    // Purchase the upgrade
    const newUpgrades = state.upgrades.map(u => {
      if (u.id === upgradeId) {
        return { ...u, purchased: true };
      }
      // Unlock upgrades that require this one
      if (u.requires?.includes(upgradeId)) {
        const allRequirementsMet = u.requires.every((reqId: string) => {
          if (reqId === upgradeId) return true;
          const req = state.upgrades.find(up => up.id === reqId);
          return req?.purchased;
        });
        if (allRequirementsMet) {
          return { ...u, unlocked: true };
        }
      }
      return u;
    });
    
    set({
      money: state.money - upgrade.cost,
      upgrades: newUpgrades,
    });
    
    get().addNotification(`🎉 Purchased: ${upgrade.name}!`, 'success');
    get().logActivity({
      tick: state.tick,
      message: `Purchased upgrade: ${upgrade.name}`,
      type: 'money',
    });
    
    // Add minimap event
    get().addMinimapEvent({
      type: 'deploy',
      x: 50,
      y: 50,
      label: upgrade.name,
    });
  },
  
  dismissAlert: (alertId) => {
    set(state => ({
      alerts: state.alerts.map(a => 
        a.id === alertId ? { ...a, dismissed: true } : a
      ),
    }));
  },
  
  addMinimapEvent: (event) => {
    const state = get();
    const newEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: event.type,
      x: event.x,
      y: event.y,
      label: event.label,
    } satisfies MinimapEvent;
    
    // Keep last 50 events
    const newEvents = [newEvent, ...state.minimapActivity].slice(0, 50);
    set({ minimapActivity: newEvents });
  },

  // ============================================
  // Achievements & Events
  // ============================================
  
  unlockAchievement: (achievementId) => {
    const state = get();
    const achievement = state.achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.unlocked) return;
    
    const newAchievements = state.achievements.map(a =>
      a.id === achievementId
        ? { ...a, unlocked: true, unlockedAt: Date.now() }
        : a
    );
    
    set({ achievements: newAchievements });
    
    // Show achievement notification
    get().addNotification(`🏆 Achievement Unlocked: ${achievement.name}!`, 'success');
    get().logActivity({
      tick: state.tick,
      message: `Achievement unlocked: ${achievement.name}`,
      type: 'event',
    });
    
    // Add minimap event
    get().addMinimapEvent({
      type: 'deploy',
      x: Math.random() * 100,
      y: Math.random() * 100,
      label: `🏆 ${achievement.name}`,
    });
  },
  
  checkAchievements: () => {
    const state = get();
    const { achievements, employees, tasks, money, tick, project, upgrades } = state;
    
    // Helper to unlock
    const unlock = (id: string) => {
      const achievement = achievements.find(a => a.id === id);
      if (achievement && !achievement.unlocked) {
        get().unlockAchievement(id);
      }
    };
    
    // Check project start
    if (project) unlock('first-steps');
    if (project) unlock('the-idea');
    
    // Check team achievements
    if (employees.length >= 1) unlock('first-hire');
    if (employees.length >= 10) unlock('army');
    
    const hasEngineer = employees.some(e => e.role === 'engineer');
    const hasDesigner = employees.some(e => e.role === 'designer');
    const hasPM = employees.some(e => e.role === 'pm');
    const hasMarketer = employees.some(e => e.role === 'marketer');
    if (hasEngineer && hasDesigner && hasPM && hasMarketer) unlock('full-stack-team');
    
    const highMoraleCount = employees.filter(e => e.morale >= 80).length;
    if (highMoraleCount >= 5) unlock('dream-team');
    
    const seniorCount = employees.filter(e => e.skillLevel === 'senior' || e.skillLevel === 'lead').length;
    if (seniorCount >= 3) unlock('senior-staff');
    
    if (employees.every(e => e.morale === 100) && employees.length > 0) unlock('perfectionist');
    
    // Check shipping achievements
    const doneTasks = tasks.filter(t => t.status === 'done');
    if (doneTasks.length >= 1) unlock('first-ship');
    if (doneTasks.length >= 50) unlock('shipping-machine');
    if (doneTasks.length >= 100) unlock('century');
    
    const bugsFixed = doneTasks.filter(t => t.type === 'bug').length;
    const bugAchievement = achievements.find(a => a.id === 'bug-squasher');
    if (bugAchievement && !bugAchievement.unlocked) {
      if (bugsFixed >= 5) unlock('bug-squasher');
    }
    
    const featuresShipped = doneTasks.filter(t => t.type === 'feature').length;
    if (featuresShipped >= 10) unlock('feature-factory');
    
    // Check project progress
    const totalTasks = tasks.length;
    const doneCount = doneTasks.length;
    const progress = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;
    if (progress >= 50) unlock('mvp');
    if (progress >= 100 && totalTasks > 0) unlock('launch');
    
    // Check money achievements
    if (money >= 1000) unlock('first-dollar');
    if (money >= 100000) unlock('profitable');
    if (money >= 1000000) unlock('unicorn');
    
    const purchasedUpgrades = upgrades.filter(u => u.purchased).length;
    if (purchasedUpgrades >= 5) unlock('investor');
    
    // Check time achievements
    const days = Math.floor(tick / 480);
    const weeks = Math.floor(days / 7);
    if (weeks >= 10) unlock('marathon');
    
    // Check time of day (secret)
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlock('night-owl');
    
    // Update progressive achievements
    const newAchievements = state.achievements.map(a => {
      if (a.id === 'bug-squasher' && a.target) {
        return { ...a, progress: Math.min(bugsFixed, a.target) };
      }
      if (a.id === 'feature-factory' && a.target) {
        return { ...a, progress: Math.min(featuresShipped, a.target) };
      }
      if (a.id === 'shipping-machine' && a.target) {
        return { ...a, progress: Math.min(doneTasks.length, a.target) };
      }
      if (a.id === 'century' && a.target) {
        return { ...a, progress: Math.min(doneTasks.length, a.target) };
      }
      if (a.id === 'investor' && a.target) {
        return { ...a, progress: Math.min(purchasedUpgrades, a.target) };
      }
      return a;
    });
    
    set({ achievements: newAchievements });
  },
  
  triggerEvent: (eventId) => {
    const state = get();
    
    // Find event
    let event: StoryEvent | undefined;
    if (eventId) {
      event = DEFAULT_EVENTS.find(e => e.id === eventId);
    } else {
      // Random event based on probability
      const eligibleEvents = DEFAULT_EVENTS.filter(e => {
        // Check requirements
        if (e.requirements) {
          for (const req of e.requirements) {
            let value = 0;
            if (req.type === 'money') value = state.money;
            if (req.type === 'employees') value = state.employees.length;
            if (req.type === 'tasks_done') value = state.tasks.filter(t => t.status === 'done').length;
            if (req.type === 'week') value = Math.floor(state.tick / 480 / 7);
            
            const ops = {
              '>': () => value > req.value,
              '<': () => value < req.value,
              '>=': () => value >= req.value,
              '<=': () => value <= req.value,
              '==': () => value === req.value,
            };
            if (!ops[req.operator]()) return false;
          }
        }
        return Math.random() < e.probability;
      });
      
      if (eligibleEvents.length > 0) {
        event = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
      }
    }
    
    if (!event) return;
    
    // Create active event
    const activeEvent: ActiveEvent = {
      eventId: event.id,
      startTick: state.tick,
      effects: event.effects,
    };
    
    // Add alert for the event
    const alert = {
      id: uuidv4(),
      type: event.category === 'crisis' ? 'danger' as const : 
            event.category === 'opportunity' ? 'opportunity' as const :
            event.category === 'challenge' ? 'warning' as const : 'info' as const,
      title: event.name,
      message: event.description,
      timestamp: Date.now(),
      dismissed: false,
      action: event.choices ? {
        label: 'Make a choice',
        callback: event.id,
      } : undefined,
    };
    
    set({
      activeEvents: [...state.activeEvents, activeEvent],
      alerts: [...state.alerts, alert],
    });
    
    get().addNotification(`${event.icon} ${event.name}`, 
      event.category === 'opportunity' ? 'success' : 
      event.category === 'crisis' ? 'error' : 'warning'
    );
    
    get().logActivity({
      tick: state.tick,
      message: `Event: ${event.name}`,
      type: 'event',
    });
    
    // Apply immediate effects (if no choices)
    if (!event.choices) {
      for (const effect of event.effects) {
        get().applyEventEffect(effect);
      }
    }
  },
  
  makeEventChoice: (eventId, choiceId) => {
    const state = get();
    const event = DEFAULT_EVENTS.find(e => e.id === eventId);
    if (!event || !event.choices) return;
    
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;
    
    // Check if can afford
    if (choice.cost && state.money < choice.cost) {
      get().addNotification(`Not enough money! Need $${choice.cost}`, 'error');
      return;
    }
    
    // Apply effects
    for (const effect of choice.effects) {
      get().applyEventEffect(effect);
    }
    
    // Update active event
    const newActiveEvents = state.activeEvents.map(ae =>
      ae.eventId === eventId
        ? { ...ae, choiceMade: choiceId }
        : ae
    );
    
    // Dismiss alert
    const newAlerts = state.alerts.map(a =>
      a.action?.callback === eventId
        ? { ...a, dismissed: true }
        : a
    );
    
    set({
      activeEvents: newActiveEvents,
      alerts: newAlerts,
    });
    
    get().addNotification(`Choice made: ${choice.label}`, 'info');
  },
  
  applyEventEffect: (effect: { type: string; value: number; target?: string; duration?: number }) => {
    const state = get();
    
    if (effect.type === 'money') {
      set({ money: Math.max(0, state.money + effect.value) });
    }
    
    if (effect.type === 'morale') {
      let targetEmployees = state.employees;
      if (effect.target === 'random' && state.employees.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.employees.length);
        targetEmployees = [state.employees[randomIndex]];
      }
      
      const newEmployees = state.employees.map(e => {
        if (targetEmployees.includes(e)) {
          return { ...e, morale: Math.max(0, Math.min(100, e.morale + effect.value)) };
        }
        return e;
      });
      set({ employees: newEmployees });
    }
    
    if (effect.type === 'productivity') {
      let targetEmployees = state.employees;
      if (effect.target === 'random' && state.employees.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.employees.length);
        targetEmployees = [state.employees[randomIndex]];
      }
      
      const newEmployees = state.employees.map(e => {
        if (targetEmployees.includes(e)) {
          return { ...e, productivity: Math.max(0, Math.min(100, e.productivity + effect.value)) };
        }
        return e;
      });
      set({ employees: newEmployees });
    }
  },
  
  updatePlayTime: () => {
    const state = get();
    const now = Date.now();
    const sessionSeconds = Math.floor((now - state.sessionStartTime) / 1000);
    set({ totalPlayTime: state.totalPlayTime + 1 });
    
    // Check play time achievements
    if (sessionSeconds >= 3600) { // 1 hour
      get().unlockAchievement('all-nighter');
    }
  },

  // ============================================
  // Focus & Autopilot - Stay productive!
  // ============================================
  
  toggleFocusMode: () => {
    const state = get();
    const newFocusMode = !state.focusMode;
    
    // Auto-dismiss all alerts when entering focus mode
    if (newFocusMode) {
      set({
        focusMode: true,
        alerts: state.alerts.map(a => ({ ...a, dismissed: true })),
      });
      get().addNotification('🎯 Focus Mode ON - Distractions hidden', 'info');
    } else {
      set({ focusMode: false });
      get().addNotification('Focus Mode OFF', 'info');
    }
  },
  
  toggleAutopilot: () => {
    const state = get();
    const newAutopilot = !state.autopilot;
    
    set({ 
      autopilot: newAutopilot,
      // Auto-enable queue processing and focus mode with autopilot
      taskQueue: {
        ...state.taskQueue,
        autoAssignEnabled: newAutopilot ? true : state.taskQueue.autoAssignEnabled,
      },
      focusMode: newAutopilot ? true : state.focusMode,
      gameSpeed: newAutopilot ? 'fast' : state.gameSpeed,
    });
    
    if (newAutopilot) {
      get().addNotification('🤖 Autopilot ON - AI team working autonomously', 'success');
      get().logActivity({
        tick: state.tick,
        message: 'Autopilot engaged - AI team working autonomously',
        type: 'system',
      });
    } else {
      get().addNotification('Autopilot OFF - Manual control', 'info');
    }
  },
  
  toggleEvents: () => {
    const state = get();
    set({ eventsEnabled: !state.eventsEnabled });
    get().addNotification(
      state.eventsEnabled ? '🔕 Random events disabled' : '🔔 Random events enabled',
      'info'
    );
  },
  
  runAutopilot: () => {
    const state = get();
    if (!state.autopilot) return;
    
    // Auto-hire if we have money and few employees
    if (state.employees.length < 3 && state.money > 20000) {
      // Find a role we need
      const hasEngineer = state.employees.some(e => e.role === 'engineer');
      const hasDesigner = state.employees.some(e => e.role === 'designer');
      const hasPM = state.employees.some(e => e.role === 'pm');
      
      const neededRole = !hasEngineer ? 'engineer' : !hasDesigner ? 'designer' : !hasPM ? 'pm' : 'engineer';
      
      // Hire using existing function
      get().hireEmployee(neededRole, 'mid');
    }
    
    // Auto-generate tasks if queue is empty and we have a PM
    const hasPM = state.employees.some(e => e.role === 'pm');
    const queuedTasks = state.taskQueue.items.filter(i => i.status === 'queued').length;
    const todoTasks = state.tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
    
    if (hasPM && queuedTasks < 2 && todoTasks < 3) {
      get().pmGenerateTask();
    }
    
    // Auto-approve reviews
    const reviewTasks = state.tasks.filter(t => t.status === 'review');
    for (const task of reviewTasks) {
      get().updateTaskStatus(task.id, 'done');
      get().logActivity({
        tick: state.tick,
        message: `Auto-approved: "${task.title}"`,
        type: 'complete',
        taskId: task.id,
      });
    }
    
    // Auto-boost morale if low
    const avgMorale = state.employees.length > 0
      ? state.employees.reduce((sum, e) => sum + e.morale, 0) / state.employees.length
      : 100;
    
    if (avgMorale < 50 && state.money > 5000) {
      get().boostMorale();
    }
  },

  // ============================================
  // Missions (PM-created feature branches)
  // ============================================

  createMission: (name: string, description: string, priority: MissionPriority) => {
    const id = uuidv4();
    const branchName = `mission/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
    
    const mission: Mission = {
      id,
      name,
      description,
      priority,
      status: 'planning',
      branchName,
      worktreePath: null,
      baseBranch: 'main',
      taskIds: [],
      createdAt: get().tick,
      startedAt: null,
      completedAt: null,
      commits: [],
      pullRequestUrl: null,
      pullRequestNumber: null,
    };
    
    set(state => ({
      missions: [...state.missions, mission],
    }));
    
    get().logActivity({
      tick: get().tick,
      type: 'project',
      message: `📋 New mission created: ${name}`,
    });
    
    get().addNotification(`🎯 Mission "${name}" created`, 'success');
    
    return id;
  },

  startMission: (missionId: string) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, status: 'active' as MissionStatus, startedAt: state.tick }
          : m
      ),
      activeMissionId: missionId,
    }));
    
    const mission = get().missions.find(m => m.id === missionId);
    if (mission) {
      get().logActivity({
        tick: get().tick,
        type: 'project',
        message: `🚀 Mission started: ${mission.name}`,
      });
    }
  },

  setActiveMission: (missionId: string | null) => {
    set({ activeMissionId: missionId });
  },

  addTaskToMission: (missionId: string, taskId: string) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, taskIds: [...m.taskIds, taskId] }
          : m
      ),
    }));
  },

  removeTaskFromMission: (missionId: string, taskId: string) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, taskIds: m.taskIds.filter((id: string) => id !== taskId) }
          : m
      ),
    }));
  },

  updateMissionStatus: (missionId: string, status: MissionStatus) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId ? { ...m, status } : m
      ),
    }));
    
    const mission = get().missions.find(m => m.id === missionId);
    if (mission) {
      const statusEmoji: Record<MissionStatus, string> = {
        planning: '📋',
        active: '🚀',
        review: '👀',
        merging: '🔀',
        completed: '✅',
        abandoned: '🚫',
      };
      get().logActivity({
        tick: get().tick,
        type: 'project',
        message: `${statusEmoji[status]} Mission "${mission.name}" is now ${status}`,
      });
    }
  },

  addMissionCommit: (missionId: string, commit: MissionCommit) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, commits: [...m.commits, commit] }
          : m
      ),
      stats: {
        ...state.stats,
        commitsCreated: state.stats.commitsCreated + 1,
      },
    }));
  },

  setMissionPR: (missionId: string, prUrl: string, prNumber: number) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, pullRequestUrl: prUrl, pullRequestNumber: prNumber, status: 'review' as MissionStatus }
          : m
      ),
    }));
    
    get().addNotification(`🔗 Pull request created for mission`, 'success');
  },

  abandonMission: (missionId: string) => {
    set(state => ({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, status: 'abandoned' as MissionStatus }
          : m
      ),
      activeMissionId: state.activeMissionId === missionId ? null : state.activeMissionId,
    }));
    
    const mission = get().missions.find(m => m.id === missionId);
    if (mission) {
      get().addNotification(`🚫 Mission "${mission.name}" abandoned`, 'warning');
    }
  },

  completeMission: (missionId: string) => {
    const state = get();
    const mission = state.missions.find(m => m.id === missionId);
    
    set({
      missions: state.missions.map(m =>
        m.id === missionId
          ? { ...m, status: 'completed' as MissionStatus, completedAt: state.tick }
          : m
      ),
      activeMissionId: state.activeMissionId === missionId ? null : state.activeMissionId,
      stats: {
        ...state.stats,
        featuresShipped: state.stats.featuresShipped + 1,
      },
    });
    
    if (mission) {
      get().logActivity({
        tick: get().tick,
        type: 'project',
        message: `✅ Mission completed and merged: ${mission.name}`,
      });
      get().addNotification(`🎉 Mission "${mission.name}" completed and merged!`, 'success');
    }
  },

  // Create mission with pre-defined tasks
  createMissionWithTasks: (
    name: string, 
    description: string, 
    priority: MissionPriority,
    taskDefs: Array<{ title: string; type: TaskType; estimatedTicks: number }>
  ) => {
    const missionId = get().createMission(name, description, priority);
    
    // Create tasks for this mission
    taskDefs.forEach(taskDef => {
      const taskId = uuidv4();
      const task: Task = {
        id: taskId,
        title: taskDef.title,
        description: `Part of mission: ${name}`,
        type: taskDef.type,
        status: 'backlog',
        priority: priority === 'critical' ? 'high' : priority,
        assigneeId: null,
        estimatedTicks: taskDef.estimatedTicks,
        progressTicks: 0,
        createdAt: get().tick,
        completedAt: null,
        codeGenerated: null,
        filesCreated: [],
        artifacts: [],
        aiWorkStarted: false,
        aiWorkCompleted: false,
      };
      
      set(state => ({
        tasks: [...state.tasks, task],
        missions: state.missions.map(m =>
          m.id === missionId
            ? { ...m, taskIds: [...m.taskIds, taskId] }
            : m
        ),
      }));
    });
    
    return missionId;
  },

  // ============================================
  // PM Brain - Continuous Product Thinking
  // ============================================

  togglePMBrain: () => {
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        enabled: !state.pmBrain.enabled,
      },
    }));
    
    const enabled = get().pmBrain.enabled;
    get().addNotification(
      enabled ? '🧠 PM Brain activated' : '🧠 PM Brain deactivated',
      'info'
    );
  },

  runPMEvaluation: () => {
    const state = get();
    if (!state.project || !state.pmBrain.enabled) return;
    
    // Analyze current product state
    const productState = analyzeProductState(
      state.project,
      state.tasks,
      state.missions,
      state.tick
    );
    
    // Generate thoughts
    const thoughts = generatePMThoughts(
      productState,
      state.missions,
      state.tasks,
      state.employees
    );
    
    // Add thoughts to PM brain (keep last 20)
    const pmThoughts: PMThought[] = thoughts.map(t => ({
      ...t,
      id: uuidv4(),
    }));
    
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        productState,
        thoughts: [...pmThoughts, ...state.pmBrain.thoughts].slice(0, 20),
        lastEvaluation: state.tick,
      },
    }));
    
    // === HUMAN IN THE LOOP ===
    // Instead of auto-generating, create PROPOSALS for the player to approve
    const pendingTasks = state.tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
    const idleEmployees = state.employees.filter(e => e.status === 'idle').length;
    const activeMissions = state.missions.filter(m => m.status === 'active').length;
    const pendingProposals = state.pmBrain.proposals.filter(p => p.status === 'pending');
    
    // Only suggest if we need work AND don't have too many pending proposals
    if (idleEmployees > 0 && pendingTasks < idleEmployees && activeMissions < 2 && pendingProposals.length < 3) {
      const suggestions = evaluateNextMissions(productState, state.missions, 1);
      
      // Check we haven't already proposed this mission
      const proposedNames = new Set(pendingProposals.map(p => p.payload.missionName?.toLowerCase()));
      
      for (const template of suggestions) {
        if (proposedNames.has(template.name.toLowerCase())) continue;
        
        // Create a proposal for player approval
        const proposal: PMProposal = {
          id: uuidv4(),
          type: 'mission',
          title: `New Mission: ${template.name}`,
          description: template.description,
          reasoning: `Product is in ${productState.phase} phase. ${idleEmployees} employees are idle with only ${pendingTasks} pending tasks. This mission will advance the product.`,
          priority: template.priority,
          createdAt: state.tick,
          expiresAt: null, // Missions don't expire
          status: 'pending',
          payload: {
            missionName: template.name,
            missionDescription: template.description,
            tasks: template.tasks,
          },
        };
        
        set(state => ({
          pmBrain: {
            ...state.pmBrain,
            proposals: [proposal, ...state.pmBrain.proposals],
          },
        }));
        
        get().addPMThought({
          type: 'decision',
          message: `💡 Proposing mission: ${template.name}`,
        });
        
        get().addNotification(`🧠 PM suggests: ${template.name}`, 'info');
        
        break; // Only one proposal per evaluation
      }
    }
    
    // Suggest hiring if we have money but few employees
    if (state.employees.length < 3 && state.money > 30000 && !pendingProposals.some(p => p.type === 'hire')) {
      const neededRole = state.employees.length === 0 ? 'engineer' : 
        state.employees.filter(e => e.role === 'engineer').length === 0 ? 'engineer' :
        state.employees.filter(e => e.role === 'designer').length === 0 ? 'designer' : 'pm';
      
      const proposal: PMProposal = {
        id: uuidv4(),
        type: 'hire',
        title: `Hire a ${neededRole}`,
        description: `Your team is small. Consider hiring a ${neededRole} to increase capacity.`,
        reasoning: `Only ${state.employees.length} employees. Budget: $${state.money.toLocaleString()}. A ${neededRole} would help the team.`,
        priority: 'medium',
        createdAt: state.tick,
        expiresAt: null,
        status: 'pending',
        payload: {
          role: neededRole,
          skillLevel: 'mid',
        },
      };
      
      set(state => ({
        pmBrain: {
          ...state.pmBrain,
          proposals: [proposal, ...state.pmBrain.proposals],
        },
      }));
    }
  },

  addPMThought: (thought: Omit<PMThought, 'id' | 'timestamp'>) => {
    const newThought: PMThought = {
      ...thought,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        thoughts: [newThought, ...state.pmBrain.thoughts].slice(0, 20),
      },
    }));
  },

  createEpic: (name: string, description: string, phase: ProductPhase) => {
    const id = uuidv4();
    const epic: Epic = {
      id,
      name,
      description,
      status: 'planned',
      priority: 'high',
      missionIds: [],
      phase,
      createdAt: get().tick,
      completedAt: null,
    };
    
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        epics: [...state.pmBrain.epics, epic],
      },
    }));
    
    get().addPMThought({
      type: 'action',
      message: `📋 Created epic: ${name}`,
    });
    
    return id;
  },

  addMissionToEpic: (epicId: string, missionId: string) => {
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        epics: state.pmBrain.epics.map(e =>
          e.id === epicId
            ? { ...e, missionIds: [...e.missionIds, missionId] }
            : e
        ),
      },
    }));
  },

  updateEpicStatus: (epicId: string, status: EpicStatus) => {
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        epics: state.pmBrain.epics.map(e =>
          e.id === epicId
            ? { 
                ...e, 
                status,
                completedAt: status === 'completed' ? state.tick : e.completedAt,
              }
            : e
        ),
      },
    }));
  },

  // ============================================
  // PM Proposals - Human in the Loop
  // ============================================

  approveProposal: (proposalId: string) => {
    const state = get();
    const proposal = state.pmBrain.proposals.find(p => p.id === proposalId);
    
    if (!proposal || proposal.status !== 'pending') return;
    
    // Mark as approved
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: state.pmBrain.proposals.map(p =>
          p.id === proposalId ? { ...p, status: 'approved' as const } : p
        ),
      },
    }));
    
    // Execute the proposal
    switch (proposal.type) {
      case 'mission': {
        if (proposal.payload.missionName && proposal.payload.tasks) {
          get().createMissionWithTasks(
            proposal.payload.missionName,
            proposal.payload.missionDescription || '',
            proposal.priority,
            proposal.payload.tasks as Array<{ title: string; type: TaskType; estimatedTicks: number }>
          );
          get().addNotification(`✅ Approved: ${proposal.payload.missionName}`, 'success');
        }
        break;
      }
      
      case 'hire': {
        if (proposal.payload.role) {
          get().setScreen('hire');
          get().addNotification(`👋 Opening hiring for ${proposal.payload.role}`, 'info');
        }
        break;
      }
      
      case 'tech': {
        if (proposal.payload.upgradeId) {
          get().purchaseUpgrade(proposal.payload.upgradeId);
        }
        break;
      }
    }
    
    get().addPMThought({
      type: 'action',
      message: `✅ Player approved: ${proposal.title}`,
    });
  },

  rejectProposal: (proposalId: string) => {
    const state = get();
    const proposal = state.pmBrain.proposals.find(p => p.id === proposalId);
    
    if (!proposal) return;
    
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: state.pmBrain.proposals.map(p =>
          p.id === proposalId ? { ...p, status: 'rejected' as const } : p
        ),
      },
    }));
    
    get().addPMThought({
      type: 'action',
      message: `❌ Player rejected: ${proposal.title}`,
    });
  },

  dismissProposal: (proposalId: string) => {
    set(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: state.pmBrain.proposals.filter(p => p.id !== proposalId),
      },
    }));
  },

  getPendingProposals: () => {
    return get().pmBrain.proposals.filter(p => p.status === 'pending');
  },
    }),
    {
      name: 'founder-mode-game',
      storage: createJSONStorage(() => localStorage),
      // Only persist game state, not UI state
      partialize: (state) => ({
        tick: state.tick,
        money: state.money,
        runway: state.runway,
        project: state.project,
        employees: state.employees,
        tasks: state.tasks,
        stats: state.stats,
        aiSettings: {
          ...state.aiSettings,
          apiKey: null, // Don't persist API key in localStorage
        },
        activityLog: state.activityLog.slice(0, 50),
        taskQueue: state.taskQueue,
        integrations: state.integrations,
        controlGroups: state.controlGroups,
        rallyPoints: state.rallyPoints,
        upgrades: state.upgrades,
        achievements: state.achievements,
        totalPlayTime: state.totalPlayTime,
        focusMode: state.focusMode,
        autopilot: state.autopilot,
        eventsEnabled: state.eventsEnabled,
        missions: state.missions,
        activeMissionId: state.activeMissionId,
        pmBrain: {
          ...state.pmBrain,
          thoughts: state.pmBrain.thoughts.slice(0, 10), // Keep only recent thoughts
        },
        // Don't persist in-progress AI work (will be requeued)
        aiWorkQueue: state.aiWorkQueue.filter(w => w.status === 'queued').slice(0, 10),
        aiWorkInProgress: null,
      }),
      // Rehydrate with default UI state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset UI state on load
          state.screen = state.project ? 'rts' : 'landing'; // Show landing for new users
          state.gameSpeed = 'paused';
          state.selectedEmployeeId = null;
          state.selectedEmployeeIds = [];
          state.selectedTaskId = null;
          state.notifications = [];
          state.isPaused = true;
          state.showCommandPalette = false;
        }
      },
    }
  )
);

export default useGameStore;
