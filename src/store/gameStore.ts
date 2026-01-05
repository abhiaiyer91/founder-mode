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
} from '../types';
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
      screen: 'command', // Go to RTS-style Command Center
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
        activityLog: state.activityLog.slice(0, 50), // Keep last 50 entries
      }),
      // Rehydrate with default UI state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset UI state on load
          state.screen = state.project ? 'command' : 'start';
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
