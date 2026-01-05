import { create } from 'zustand';
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
} from '../types';
import {
  EMPLOYEE_TEMPLATES,
  FIRST_NAMES,
  LAST_NAMES,
} from '../types';

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
  selectedEmployeeId: null,
  selectedTaskId: null,
  notifications: [],
};

// Create the store
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  // Navigation
  setScreen: (screen: GameScreen) => set({ screen }),

  // Game Control
  setGameSpeed: (speed: GameSpeed) => set({ gameSpeed: speed }),

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
        // Task completed!
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
    set({
      project: {
        id: uuidv4(),
        name: projectName,
        description: idea,
        idea,
        techStack: ['TypeScript', 'React'],
        repository: null,
        createdAt: get().tick,
      },
      screen: 'office',
      gameSpeed: 'normal',
    });
    get().addNotification(`🚀 Started project: ${projectName}`, 'success');
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
        return;
      }
    }

    set({ tasks: updatedTasks });
  },

  // Selection
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  selectTask: (id) => set({ selectedTaskId: id }),

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
}));

export default useGameStore;
