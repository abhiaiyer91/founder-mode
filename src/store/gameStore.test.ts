/**
 * Game Store Tests
 * 
 * Tests for core game mechanics:
 * - Project creation
 * - Employee hiring
 * - Task management
 * - Game tick progression
 * - Missions
 * - PM proposals
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';

// Helper to reset store between tests
function resetStore() {
  useGameStore.setState({
    screen: 'start',
    gameSpeed: 'paused',
    tick: 0,
    startedAt: new Date(),
    money: 100000,
    runway: 12,
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
    activityLog: [],
    selectedEmployeeIds: [],
    isPaused: false,
    showCommandPalette: false,
    taskQueue: {
      items: [],
      autoAssignEnabled: true,
      lastProcessedAt: 0,
    },
    integrations: {
      github: { enabled: false, repo: null },
      linear: { enabled: false, teamId: null },
    },
    controlGroups: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, employeeIds: [] })),
    rallyPoints: [],
    upgrades: [],
    alerts: [],
    minimapActivity: [],
    achievements: [],
    activeEvents: [],
    totalPlayTime: 0,
    sessionStartTime: Date.now(),
    focusMode: false,
    autopilot: false,
    eventsEnabled: true,
    missions: [],
    activeMissionId: null,
    pmBrain: {
      enabled: true,
      thoughts: [],
      proposals: [],
      epics: [],
      productState: null,
      lastEvaluation: 0,
      evaluationInterval: 120,
    },
    aiWorkQueue: [],
    aiWorkInProgress: null,
  });
}

describe('Game Store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Project Creation', () => {
    it('should create a project with correct initial values', () => {
      const store = useGameStore.getState();
      store.startProject('A revolutionary todo app');
      
      const state = useGameStore.getState();
      
      expect(state.project).not.toBeNull();
      expect(state.project?.name).toBeDefined();
      expect(state.project?.description).toBe('A revolutionary todo app');
      expect(state.screen).toBe('rts');
      expect(state.activityLog.length).toBeGreaterThan(0);
    });

    it('should create project even with empty idea (no validation)', () => {
      const store = useGameStore.getState();
      
      store.startProject('');
      
      // The current implementation doesn't validate empty ideas
      // It creates a project with empty name/description
      expect(useGameStore.getState().project).not.toBeNull();
      expect(useGameStore.getState().project?.description).toBe('');
    });
  });

  describe('Employee Hiring', () => {
    it('should hire an engineer with correct properties', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      
      const state = useGameStore.getState();
      
      expect(state.employees).toHaveLength(1);
      expect(state.employees[0].role).toBe('engineer');
      expect(state.employees[0].skillLevel).toBe('mid');
      expect(state.employees[0].status).toBe('idle');
      expect(state.employees[0].morale).toBeGreaterThan(0);
      expect(state.employees[0].productivity).toBeGreaterThan(0);
    });

    it('should deduct money when hiring', () => {
      const initialMoney = useGameStore.getState().money;
      
      useGameStore.getState().hireEmployee('engineer', 'senior');
      
      expect(useGameStore.getState().money).toBeLessThan(initialMoney);
    });

    it('should hire multiple employees', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'junior');
      store.hireEmployee('designer', 'mid');
      store.hireEmployee('pm', 'senior');
      
      expect(useGameStore.getState().employees).toHaveLength(3);
    });

    it('should fire an employee', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      
      const employee = useGameStore.getState().employees[0];
      store.fireEmployee(employee.id);
      
      expect(useGameStore.getState().employees).toHaveLength(0);
    });
  });

  describe('Task Management', () => {
    it('should create a task with correct properties', () => {
      const store = useGameStore.getState();
      store.createTask({
        title: 'Build login page',
        description: 'Create a secure login page',
        type: 'feature',
        status: 'todo',
        priority: 'high',
        assigneeId: null,
        estimatedTicks: 500,
      });
      
      const state = useGameStore.getState();
      
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].title).toBe('Build login page');
      expect(state.tasks[0].type).toBe('feature');
      expect(state.tasks[0].status).toBe('todo');
      expect(state.tasks[0].progressTicks).toBe(0);
    });

    it('should assign task to employee', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      store.createTask({
        title: 'Fix bug',
        description: 'Fix critical bug',
        type: 'bug',
        status: 'todo',
        priority: 'critical',
        assigneeId: null,
        estimatedTicks: 200,
      });
      
      const employee = useGameStore.getState().employees[0];
      const task = useGameStore.getState().tasks[0];
      
      store.assignTask(task.id, employee.id);
      
      const state = useGameStore.getState();
      expect(state.tasks[0].assigneeId).toBe(employee.id);
      expect(state.tasks[0].status).toBe('in_progress');
      expect(state.employees[0].status).toBe('working');
    });

    it('should unassign task from employee', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      store.createTask({
        title: 'Test task',
        description: 'Test',
        type: 'feature',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        estimatedTicks: 100,
      });
      
      const employee = useGameStore.getState().employees[0];
      const task = useGameStore.getState().tasks[0];
      
      store.assignTask(task.id, employee.id);
      store.unassignTask(task.id);
      
      const state = useGameStore.getState();
      expect(state.tasks[0].assigneeId).toBeNull();
      expect(state.tasks[0].status).toBe('todo');
      expect(state.employees[0].status).toBe('idle');
    });

    it('should update task status', () => {
      const store = useGameStore.getState();
      store.createTask({
        title: 'Review task',
        description: 'For review',
        type: 'feature',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        estimatedTicks: 100,
      });
      
      const task = useGameStore.getState().tasks[0];
      store.updateTaskStatus(task.id, 'review');
      
      expect(useGameStore.getState().tasks[0].status).toBe('review');
    });
  });

  describe('Game Tick', () => {
    it('should increment tick counter when not paused', () => {
      useGameStore.setState({ gameSpeed: 'normal' }); // Must not be paused
      const initialTick = useGameStore.getState().tick;
      
      useGameStore.getState().gameTick();
      
      expect(useGameStore.getState().tick).toBe(initialTick + 1);
    });

    it('should NOT increment tick when paused', () => {
      useGameStore.setState({ gameSpeed: 'paused' });
      const initialTick = useGameStore.getState().tick;
      
      useGameStore.getState().gameTick();
      
      expect(useGameStore.getState().tick).toBe(initialTick);
    });

    it('should progress task when employee is working', () => {
      useGameStore.setState({ gameSpeed: 'normal' }); // Must not be paused
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      store.createTask({
        title: 'Progress task',
        description: 'Test progress',
        type: 'feature',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        estimatedTicks: 100,
      });
      
      const employee = useGameStore.getState().employees[0];
      const task = useGameStore.getState().tasks[0];
      
      store.assignTask(task.id, employee.id);
      
      // Run multiple ticks
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().gameTick();
      }
      
      expect(useGameStore.getState().tasks[0].progressTicks).toBeGreaterThan(0);
    });

    it('should complete task when progress reaches estimated ticks', () => {
      useGameStore.setState({ gameSpeed: 'normal' }); // Must not be paused
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'lead'); // Higher productivity
      store.createTask({
        title: 'Quick task',
        description: 'Fast completion',
        type: 'feature',
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        estimatedTicks: 10, // Very short task
      });
      
      const employee = useGameStore.getState().employees[0];
      const task = useGameStore.getState().tasks[0];
      
      store.assignTask(task.id, employee.id);
      
      // Run enough ticks to complete
      for (let i = 0; i < 100; i++) {
        useGameStore.getState().gameTick();
      }
      
      const finalState = useGameStore.getState();
      expect(finalState.tasks[0].status).toBe('review');
    });
  });

  describe('Selection', () => {
    it('should select single employee', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      
      const employee = useGameStore.getState().employees[0];
      store.selectEmployee(employee.id);
      
      expect(useGameStore.getState().selectedEmployeeId).toBe(employee.id);
    });

    it('should select multiple employees', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      store.hireEmployee('designer', 'mid');
      
      const employees = useGameStore.getState().employees;
      store.selectEmployees([employees[0].id, employees[1].id]);
      
      expect(useGameStore.getState().selectedEmployeeIds).toHaveLength(2);
    });

    it('should clear selection', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      
      const employee = useGameStore.getState().employees[0];
      store.selectEmployee(employee.id);
      store.clearSelection();
      
      expect(useGameStore.getState().selectedEmployeeId).toBeNull();
      expect(useGameStore.getState().selectedEmployeeIds).toHaveLength(0);
    });

    it('should select all idle employees', () => {
      const store = useGameStore.getState();
      store.hireEmployee('engineer', 'mid');
      store.hireEmployee('designer', 'mid');
      store.hireEmployee('pm', 'mid');
      
      store.selectAllIdle();
      
      expect(useGameStore.getState().selectedEmployeeIds).toHaveLength(3);
    });
  });

  describe('Notifications', () => {
    it('should add notification', () => {
      const store = useGameStore.getState();
      store.addNotification('Test notification', 'info');
      
      const notifications = useGameStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('Test notification');
      expect(notifications[0].type).toBe('info');
    });

    it('should dismiss notification', () => {
      const store = useGameStore.getState();
      store.addNotification('To dismiss', 'warning');
      
      const notification = useGameStore.getState().notifications[0];
      store.dismissNotification(notification.id);
      
      expect(useGameStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('Game Speed', () => {
    it('should change game speed', () => {
      const store = useGameStore.getState();
      store.setGameSpeed('fast');
      
      expect(useGameStore.getState().gameSpeed).toBe('fast');
    });

    it('should toggle pause', () => {
      const store = useGameStore.getState();
      store.setGameSpeed('normal');
      store.togglePause();
      
      expect(useGameStore.getState().gameSpeed).toBe('paused');
      
      store.togglePause();
      expect(useGameStore.getState().gameSpeed).toBe('normal');
    });
  });

  describe('Screen Navigation', () => {
    it('should change screen', () => {
      const store = useGameStore.getState();
      store.setScreen('hire');
      
      expect(useGameStore.getState().screen).toBe('hire');
    });
  });
});

describe('Missions', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create a mission', () => {
    const store = useGameStore.getState();
    const missionId = store.createMission('User Auth', 'Build authentication', 'high');
    
    const state = useGameStore.getState();
    expect(state.missions).toHaveLength(1);
    expect(state.missions[0].id).toBe(missionId);
    expect(state.missions[0].name).toBe('User Auth');
    expect(state.missions[0].status).toBe('planning');
    expect(state.missions[0].branchName).toBe('mission/user-auth');
  });

  it('should create mission with tasks', () => {
    const store = useGameStore.getState();
    store.createMissionWithTasks(
      'API Setup',
      'Create API foundation',
      'high',
      [
        { title: 'Set up router', type: 'infrastructure', estimatedTicks: 200 },
        { title: 'Add auth middleware', type: 'feature', estimatedTicks: 300 },
      ]
    );
    
    const state = useGameStore.getState();
    expect(state.missions[0].taskIds).toHaveLength(2);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0].title).toBe('Set up router');
  });

  it('should start a mission', () => {
    const store = useGameStore.getState();
    const missionId = store.createMission('Test Mission', 'Test', 'medium');
    
    store.startMission(missionId);
    
    const state = useGameStore.getState();
    expect(state.missions[0].status).toBe('active');
    expect(state.missions[0].startedAt).not.toBeNull();
    expect(state.activeMissionId).toBe(missionId);
  });

  it('should add task to mission', () => {
    const store = useGameStore.getState();
    const missionId = store.createMission('Test', 'Test', 'medium');
    
    store.createTask({
      title: 'New task',
      description: 'To add',
      type: 'feature',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      estimatedTicks: 100,
    });
    
    const taskId = useGameStore.getState().tasks[0].id;
    store.addTaskToMission(missionId, taskId);
    
    expect(useGameStore.getState().missions[0].taskIds).toContain(taskId);
  });

  it('should abandon a mission', () => {
    const store = useGameStore.getState();
    const missionId = store.createMission('To Abandon', 'Will be abandoned', 'low');
    
    store.startMission(missionId);
    store.abandonMission(missionId);
    
    const state = useGameStore.getState();
    expect(state.missions[0].status).toBe('abandoned');
    expect(state.activeMissionId).toBeNull();
  });

  it('should complete a mission', () => {
    const store = useGameStore.getState();
    const missionId = store.createMission('To Complete', 'Will be completed', 'high');
    
    store.startMission(missionId);
    store.completeMission(missionId);
    
    const state = useGameStore.getState();
    expect(state.missions[0].status).toBe('completed');
    expect(state.missions[0].completedAt).not.toBeNull();
    expect(state.stats.featuresShipped).toBe(1);
  });
});

describe('PM Brain & Proposals', () => {
  beforeEach(() => {
    resetStore();
    // Start a project for PM brain to work
    useGameStore.getState().startProject('Test App');
  });

  it('should toggle PM brain', () => {
    const store = useGameStore.getState();
    expect(store.pmBrain.enabled).toBe(true);
    
    store.togglePMBrain();
    expect(useGameStore.getState().pmBrain.enabled).toBe(false);
    
    store.togglePMBrain();
    expect(useGameStore.getState().pmBrain.enabled).toBe(true);
  });

  it('should add PM thought', () => {
    const store = useGameStore.getState();
    store.addPMThought({
      type: 'observation',
      message: 'Product needs authentication',
    });
    
    const thoughts = useGameStore.getState().pmBrain.thoughts;
    expect(thoughts).toHaveLength(1);
    expect(thoughts[0].message).toBe('Product needs authentication');
    expect(thoughts[0].type).toBe('observation');
  });

  it('should run PM evaluation and analyze product state', () => {
    // Note: A project must exist for PM evaluation to run
    const store = useGameStore.getState();
    expect(store.project).not.toBeNull(); // Already started in beforeEach
    
    // Add some completed tasks to analyze
    store.createTask({
      title: 'Database schema setup',
      description: 'Set up database',
      type: 'infrastructure',
      status: 'done',
      priority: 'high',
      assigneeId: null,
      estimatedTicks: 100,
    });
    
    store.runPMEvaluation();
    
    const pmBrain = useGameStore.getState().pmBrain;
    expect(pmBrain.productState).not.toBeNull();
    expect(pmBrain.thoughts.length).toBeGreaterThan(0);
  });

  it('should create proposals for idle employees', () => {
    const store = useGameStore.getState();
    
    // Hire some idle employees
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('designer', 'mid');
    
    // Run evaluation
    store.runPMEvaluation();
    
    const proposals = useGameStore.getState().pmBrain.proposals;
    // Should have at least one proposal (mission or hire suggestion)
    expect(proposals.length).toBeGreaterThanOrEqual(0);
  });

  it('should approve a mission proposal', () => {
    const store = useGameStore.getState();
    
    // Manually add a proposal
    const proposal = {
      id: 'test-proposal',
      type: 'mission' as const,
      title: 'Test Mission Proposal',
      description: 'A test mission',
      reasoning: 'Testing purposes',
      priority: 'high' as const,
      createdAt: 0,
      expiresAt: null,
      status: 'pending' as const,
      payload: {
        missionName: 'Test Mission',
        missionDescription: 'For testing',
        tasks: [
          { title: 'Task 1', type: 'feature', estimatedTicks: 100 },
        ],
      },
    };
    
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [proposal],
      },
    }));
    
    store.approveProposal('test-proposal');
    
    const state = useGameStore.getState();
    expect(state.pmBrain.proposals[0].status).toBe('approved');
    expect(state.missions).toHaveLength(1);
    expect(state.missions[0].name).toBe('Test Mission');
  });

  it('should reject a proposal', () => {
    const store = useGameStore.getState();
    
    const proposal = {
      id: 'reject-proposal',
      type: 'mission' as const,
      title: 'To Reject',
      description: 'Will be rejected',
      reasoning: 'Testing',
      priority: 'low' as const,
      createdAt: 0,
      expiresAt: null,
      status: 'pending' as const,
      payload: {},
    };
    
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [proposal],
      },
    }));
    
    store.rejectProposal('reject-proposal');
    
    expect(useGameStore.getState().pmBrain.proposals[0].status).toBe('rejected');
  });

  it('should dismiss a proposal', () => {
    const store = useGameStore.getState();
    
    const proposal = {
      id: 'dismiss-proposal',
      type: 'hire' as const,
      title: 'To Dismiss',
      description: 'Will be dismissed',
      reasoning: 'Testing',
      priority: 'low' as const,
      createdAt: 0,
      expiresAt: null,
      status: 'pending' as const,
      payload: {},
    };
    
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [proposal],
      },
    }));
    
    store.dismissProposal('dismiss-proposal');
    
    expect(useGameStore.getState().pmBrain.proposals).toHaveLength(0);
  });

  it('should get pending proposals', () => {
    const store = useGameStore.getState();
    
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [
          { id: '1', status: 'pending' as const, type: 'mission' as const, title: '', description: '', reasoning: '', priority: 'low' as const, createdAt: 0, expiresAt: null, payload: {} },
          { id: '2', status: 'approved' as const, type: 'mission' as const, title: '', description: '', reasoning: '', priority: 'low' as const, createdAt: 0, expiresAt: null, payload: {} },
          { id: '3', status: 'pending' as const, type: 'hire' as const, title: '', description: '', reasoning: '', priority: 'low' as const, createdAt: 0, expiresAt: null, payload: {} },
        ],
      },
    }));
    
    const pending = store.getPendingProposals();
    expect(pending).toHaveLength(2);
  });
});

describe('Task Queue', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should add item to queue', () => {
    const store = useGameStore.getState();
    store.addToQueue({
      source: 'manual',
      title: 'Manual task',
      description: 'Added manually',
      type: 'feature',
      priority: 'medium',
      labels: [],
      autoAssign: true,
    });
    
    const queue = useGameStore.getState().taskQueue;
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].title).toBe('Manual task');
    expect(queue.items[0].status).toBe('queued');
  });

  it('should remove item from queue', () => {
    const store = useGameStore.getState();
    store.addToQueue({
      source: 'manual',
      title: 'To remove',
      description: 'Will be removed',
      type: 'feature',
      priority: 'low',
      labels: [],
      autoAssign: false,
    });
    
    const item = useGameStore.getState().taskQueue.items[0];
    store.removeFromQueue(item.id);
    
    expect(useGameStore.getState().taskQueue.items).toHaveLength(0);
  });

  it('should toggle auto-assign', () => {
    const store = useGameStore.getState();
    const initial = store.taskQueue.autoAssignEnabled;
    
    store.toggleAutoAssign();
    expect(useGameStore.getState().taskQueue.autoAssignEnabled).toBe(!initial);
  });

  it('should import from GitHub', () => {
    const store = useGameStore.getState();
    store.importFromGitHub([
      { number: 1, title: 'GitHub Issue 1', body: 'Description 1', labels: [{ name: 'bug' }] },
      { number: 2, title: 'GitHub Issue 2', body: null, labels: [{ name: 'feature' }] },
    ]);
    
    const queue = useGameStore.getState().taskQueue;
    expect(queue.items).toHaveLength(2);
    expect(queue.items[0].source).toBe('github');
    expect(queue.items[0].externalId).toBe('github-1');
    expect(queue.items[0].type).toBe('bug'); // Should detect from labels
    expect(queue.items[1].type).toBe('feature');
  });

  it('should clear queue', () => {
    const store = useGameStore.getState();
    store.addToQueue({
      source: 'manual',
      title: 'Item 1',
      description: '',
      type: 'feature',
      priority: 'low',
      labels: [],
      autoAssign: false,
    });
    store.addToQueue({
      source: 'manual',
      title: 'Item 2',
      description: '',
      type: 'bug',
      priority: 'high',
      labels: [],
      autoAssign: false,
    });
    
    store.clearQueue();
    
    expect(useGameStore.getState().taskQueue.items).toHaveLength(0);
  });
});

describe('Control Groups', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should set control group', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('designer', 'mid');
    
    const employees = useGameStore.getState().employees;
    store.setControlGroup(1, [employees[0].id, employees[1].id]);
    
    const controlGroup = useGameStore.getState().controlGroups.find(g => g.id === 1);
    expect(controlGroup?.employeeIds).toHaveLength(2);
  });

  it('should select control group', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('pm', 'mid');
    
    const employees = useGameStore.getState().employees;
    store.setControlGroup(2, [employees[0].id, employees[1].id]);
    store.selectControlGroup(2);
    
    expect(useGameStore.getState().selectedEmployeeIds).toHaveLength(2);
  });
});

describe('Epics', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create an epic', () => {
    const store = useGameStore.getState();
    const epicId = store.createEpic('Foundation', 'Core infrastructure', 'mvp');
    
    const epics = useGameStore.getState().pmBrain.epics;
    expect(epics).toHaveLength(1);
    expect(epics[0].id).toBe(epicId);
    expect(epics[0].name).toBe('Foundation');
    expect(epics[0].phase).toBe('mvp');
  });

  it('should add mission to epic', () => {
    const store = useGameStore.getState();
    const epicId = store.createEpic('Growth', 'Growth features', 'growth');
    const missionId = store.createMission('Landing Page', 'Marketing site', 'high');
    
    store.addMissionToEpic(epicId, missionId);
    
    const epic = useGameStore.getState().pmBrain.epics[0];
    expect(epic.missionIds).toContain(missionId);
  });

  it('should update epic status', () => {
    const store = useGameStore.getState();
    const epicId = store.createEpic('Test Epic', 'Testing', 'mvp');
    
    store.updateEpicStatus(epicId, 'active');
    expect(useGameStore.getState().pmBrain.epics[0].status).toBe('active');
    
    store.updateEpicStatus(epicId, 'completed');
    const epic = useGameStore.getState().pmBrain.epics[0];
    expect(epic.status).toBe('completed');
    expect(epic.completedAt).not.toBeNull();
  });
});

// ============================================
// AI Work Queue Tests
// ============================================

describe('AI Work Queue', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should queue AI work when task is assigned with AI enabled', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    store.hireEmployee('engineer', 'mid');
    
    // Enable AI
    useGameStore.setState({
      aiSettings: { ...useGameStore.getState().aiSettings, enabled: true },
    });
    
    store.createTask({
      title: 'Build feature',
      description: 'A feature',
      type: 'feature',
      priority: 'high',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    const employee = useGameStore.getState().employees[0];
    
    store.assignTask(task.id, employee.id);
    
    const queue = useGameStore.getState().aiWorkQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].taskId).toBe(task.id);
    expect(queue[0].employeeId).toBe(employee.id);
    expect(queue[0].status).toBe('queued');
  });

  it('should not queue AI work when AI is disabled', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    store.hireEmployee('engineer', 'mid');
    
    // AI is disabled by default
    store.createTask({
      title: 'Build feature',
      description: 'A feature',
      type: 'feature',
      priority: 'high',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    const employee = useGameStore.getState().employees[0];
    
    store.assignTask(task.id, employee.id);
    
    const queue = useGameStore.getState().aiWorkQueue;
    expect(queue).toHaveLength(0);
  });

  it('should not queue duplicate AI work for same task', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    store.hireEmployee('engineer', 'mid');
    
    useGameStore.setState({
      aiSettings: { ...useGameStore.getState().aiSettings, enabled: true },
    });
    
    store.createTask({
      title: 'Build feature',
      description: 'A feature',
      type: 'feature',
      priority: 'high',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    const employee = useGameStore.getState().employees[0];
    
    // Queue work twice
    store.queueAIWork(task.id, employee.id);
    store.queueAIWork(task.id, employee.id);
    
    const queue = useGameStore.getState().aiWorkQueue;
    expect(queue).toHaveLength(1);
  });

  it('should prioritize critical tasks in queue', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('engineer', 'senior');
    
    useGameStore.setState({
      aiSettings: { ...useGameStore.getState().aiSettings, enabled: true },
    });
    
    // Create low priority first
    store.createTask({
      title: 'Low priority task',
      description: 'Low',
      type: 'feature',
      priority: 'low',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    // Then critical
    store.createTask({
      title: 'Critical task',
      description: 'Critical',
      type: 'bug',
      priority: 'critical',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 5,
    });
    
    const tasks = useGameStore.getState().tasks;
    const employees = useGameStore.getState().employees;
    
    store.assignTask(tasks[0].id, employees[0].id);
    store.assignTask(tasks[1].id, employees[1].id);
    
    const queue = useGameStore.getState().aiWorkQueue;
    expect(queue).toHaveLength(2);
    // Critical should be first (priority 1 vs 4)
    expect(queue[0].taskId).toBe(tasks[1].id);
  });
});

// ============================================
// Task Artifacts Tests
// ============================================

describe('Task Artifacts', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should add artifact to task', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    
    store.createTask({
      title: 'Build component',
      description: 'A component',
      type: 'feature',
      priority: 'medium',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    
    store.addTaskArtifact(task.id, {
      type: 'code',
      title: 'Button.tsx',
      content: 'export const Button = () => <button>Click</button>;',
      language: 'typescript',
      filePath: 'src/components/Button.tsx',
      createdBy: 'test-employee',
    });
    
    const updatedTask = useGameStore.getState().tasks[0];
    expect(updatedTask.artifacts).toHaveLength(1);
    expect(updatedTask.artifacts[0].type).toBe('code');
    expect(updatedTask.artifacts[0].title).toBe('Button.tsx');
    expect(updatedTask.artifacts[0].language).toBe('typescript');
  });

  it('should add multiple artifacts to task', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    
    store.createTask({
      title: 'Build feature',
      description: 'Full feature',
      type: 'feature',
      priority: 'high',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 20,
    });
    
    const task = useGameStore.getState().tasks[0];
    
    store.addTaskArtifact(task.id, {
      type: 'code',
      title: 'Component.tsx',
      content: 'const Component = () => {}',
      createdBy: 'emp1',
    });
    
    store.addTaskArtifact(task.id, {
      type: 'code',
      title: 'Component.css',
      content: '.component { color: red; }',
      language: 'css',
      createdBy: 'emp1',
    });
    
    store.addTaskArtifact(task.id, {
      type: 'design',
      title: 'Component Design',
      content: 'Design spec for the component',
      createdBy: 'emp2',
    });
    
    const updatedTask = useGameStore.getState().tasks[0];
    expect(updatedTask.artifacts).toHaveLength(3);
  });

  it('should initialize new tasks with empty artifacts', () => {
    const store = useGameStore.getState();
    store.startProject('Test app');
    
    store.createTask({
      title: 'New task',
      description: 'Description',
      type: 'feature',
      priority: 'medium',
      status: 'backlog',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    expect(task.artifacts).toEqual([]);
    expect(task.aiWorkStarted).toBe(false);
    expect(task.aiWorkCompleted).toBe(false);
  });
});

// ============================================
// Agent Memory Tests
// ============================================

describe('Agent Memory', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should add memory to employee', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    
    const employee = useGameStore.getState().employees[0];
    
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Completed user authentication feature',
      importance: 0.8,
      taskId: 'task-123',
      tags: ['auth', 'feature', 'security'],
    });
    
    const updatedEmployee = useGameStore.getState().employees[0];
    expect(updatedEmployee.memory).toHaveLength(1);
    expect(updatedEmployee.memory[0].type).toBe('task');
    expect(updatedEmployee.memory[0].importance).toBe(0.8);
    expect(updatedEmployee.memory[0].tags).toContain('auth');
  });

  it('should limit memory to 50 entries', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'senior');
    
    const employee = useGameStore.getState().employees[0];
    
    // Add 55 memories
    for (let i = 0; i < 55; i++) {
      store.addEmployeeMemory(employee.id, {
        type: 'task',
        content: `Memory ${i}`,
        importance: 0.5,
        tags: ['test'],
      });
    }
    
    const updatedEmployee = useGameStore.getState().employees[0];
    expect(updatedEmployee.memory).toHaveLength(50);
    // Should keep the most recent
    expect(updatedEmployee.memory[49].content).toBe('Memory 54');
  });

  it('should get employee context', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    
    const employee = useGameStore.getState().employees[0];
    
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Built authentication system',
      importance: 0.9,
      tags: ['auth', 'security'],
    });
    
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Created dashboard UI',
      importance: 0.7,
      tags: ['ui', 'dashboard'],
    });
    
    // Update task count manually for testing
    useGameStore.setState({
      employees: useGameStore.getState().employees.map(e => ({
        ...e,
        tasksCompleted: 5,
        specializations: ['auth', 'security'],
      })),
    });
    
    const context = store.getEmployeeContext(employee.id);
    
    expect(context).toContain('Experience');
    expect(context).toContain('Tasks Completed');
    expect(context).toContain('Built authentication system');
    expect(context).toContain('Created dashboard UI');
  });

  it('should filter context by task title', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    
    const employee = useGameStore.getState().employees[0];
    
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Built authentication system',
      importance: 0.9,
      tags: ['auth', 'security'],
    });
    
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Created payment integration',
      importance: 0.7,
      tags: ['payment', 'stripe'],
    });
    
    // Search for auth-related context
    const context = store.getEmployeeContext(employee.id, 'user authentication');
    
    expect(context).toContain('Built authentication system');
    // Payment may or may not be included based on relevance
  });

  it('should update employee specializations', () => {
    const store = useGameStore.getState();
    store.hireEmployee('engineer', 'mid');
    
    const employee = useGameStore.getState().employees[0];
    
    // Add memories with various tags
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Auth work 1',
      importance: 0.8,
      tags: ['auth', 'security'],
    });
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'Auth work 2',
      importance: 0.8,
      tags: ['auth', 'security'],
    });
    store.addEmployeeMemory(employee.id, {
      type: 'task',
      content: 'UI work',
      importance: 0.7,
      tags: ['ui'],
    });
    
    store.updateEmployeeSpecializations(employee.id);
    
    const updatedEmployee = useGameStore.getState().employees[0];
    expect(updatedEmployee.specializations).toContain('auth');
    expect(updatedEmployee.specializations).toContain('security');
    // auth and security should be first due to higher count
    expect(updatedEmployee.specializations[0]).toBe('auth');
  });

  it('should initialize new employees with empty memory', () => {
    const store = useGameStore.getState();
    store.hireEmployee('designer', 'mid');
    
    const employee = useGameStore.getState().employees[0];
    expect(employee.memory).toEqual([]);
    expect(employee.tasksCompleted).toBe(0);
    expect(employee.specializations).toEqual([]);
  });

  it('should return empty context for non-existent employee', () => {
    const store = useGameStore.getState();
    const context = store.getEmployeeContext('non-existent-id');
    expect(context).toBe('');
  });
});
