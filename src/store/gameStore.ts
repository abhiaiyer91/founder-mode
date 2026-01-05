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
  ActivityLogEntry,
  QueuedTaskItem,
  Mission,
  MissionStatus,
  MissionPriority,
  MissionCommit,
} from '../types';
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
} from '../types';
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
  screen: 'start',
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
  configureAI: (apiKey: string) => {
    aiService.configure(apiKey);
    set({
      aiSettings: {
        ...get().aiSettings,
        enabled: true,
        apiKey,
      },
    });
    get().addNotification('🤖 AI agents activated! Your team is now powered by AI.', 'success');
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

        // Update task with generated code
        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: result.code,
                filesCreated: result.files.map(f => f.path),
                progressTicks: t.estimatedTicks, // Complete immediately
                status: 'review' as TaskStatus,
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

        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: result.css,
                progressTicks: t.estimatedTicks,
                status: 'review' as TaskStatus,
              }
            : t
        );

        set({ tasks: updatedTasks });
        get().addNotification(`🎨 ${assignee.name} completed design for "${task.title}"!`, 'success');
      } else if (assignee.role === 'marketer') {
        const result = await aiService.marketerCreateContent(
          state.project?.name || 'Product',
          state.project?.idea || '',
          'landing-page'
        );

        const updatedTasks = state.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                codeGenerated: `${result.headline}\n\n${result.content}\n\nCTA: ${result.cta}`,
                progressTicks: t.estimatedTicks,
                status: 'review' as TaskStatus,
              }
            : t
        );

        set({ tasks: updatedTasks });
        get().addNotification(`📢 ${assignee.name} created marketing content!`, 'success');
      }
    } catch (error) {
      console.error('AI work error:', error);
      get().addNotification(`⚠️ AI encountered an error. Falling back to simulation.`, 'warning');
    }
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
      const newTasks = tasksToCreate.map(t => ({
        id: uuidv4(),
        ...t,
        progressTicks: 0,
        createdAt: state.tick,
        completedAt: null,
        codeGenerated: null,
        filesCreated: [],
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
      }),
      // Rehydrate with default UI state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset UI state on load
          state.screen = state.project ? 'rts' : 'start';
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
