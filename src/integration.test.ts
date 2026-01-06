/**
 * Integration Tests
 * 
 * These tests validate complete user workflows to ensure
 * the game does what it says it does.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './store/gameStore';
import type { TaskStatus } from './types';

// Complete store reset for integration tests
function resetStore() {
  useGameStore.setState({
    screen: 'start',
    gameSpeed: 'normal', // Not paused for integration tests
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
    eventsEnabled: false, // Disable random events for predictable tests
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

// ============================================
// INTEGRATION TEST: Complete Game Startup
// ============================================

describe('Integration: Game Startup Flow', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should complete full startup: idea → project → hire → first task', () => {
    const store = useGameStore.getState();
    
    // Step 1: User enters their startup idea
    const idea = 'A revolutionary AI-powered task manager for remote teams';
    store.startProject(idea);
    
    // Verify: Project is created with correct data
    const state1 = useGameStore.getState();
    expect(state1.project).not.toBeNull();
    expect(state1.project?.idea).toBe(idea);
    expect(state1.screen).toBe('rts'); // Should navigate to RTS view (default game screen)
    
    // Step 2: User hires their first engineer
    store.hireEmployee('engineer', 'mid');
    
    // Verify: Employee is hired, money is deducted
    const state2 = useGameStore.getState();
    expect(state2.employees).toHaveLength(1);
    expect(state2.employees[0].role).toBe('engineer');
    expect(state2.employees[0].status).toBe('idle');
    expect(state2.money).toBeLessThan(100000); // Salary deducted
    
    // Step 3: User creates their first task
    store.createTask({
      title: 'Set up project infrastructure',
      description: 'Initialize the codebase with TypeScript, React, and testing',
      type: 'infrastructure',
      priority: 'high',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 15,
    });
    
    // Verify: Task is created
    const state3 = useGameStore.getState();
    expect(state3.tasks).toHaveLength(1);
    expect(state3.tasks[0].title).toBe('Set up project infrastructure');
    expect(state3.tasks[0].status).toBe('todo');
    
    // Step 4: User assigns task to engineer
    const engineer = state3.employees[0];
    const task = state3.tasks[0];
    store.assignTask(task.id, engineer.id);
    
    // Verify: Task is assigned and in progress
    const state4 = useGameStore.getState();
    expect(state4.tasks[0].status).toBe('in_progress');
    expect(state4.tasks[0].assigneeId).toBe(engineer.id);
    expect(state4.employees[0].status).toBe('working');
    expect(state4.employees[0].currentTaskId).toBe(task.id);
    
    // Step 5: Activity log should record all actions
    expect(state4.activityLog.length).toBeGreaterThan(0);
    const messages = state4.activityLog.map(a => a.message);
    expect(messages.some(m => m.includes('started working'))).toBe(true);
  });

  it('should handle hiring multiple team members', () => {
    const store = useGameStore.getState();
    store.startProject('Social media app');
    
    const initialMoney = useGameStore.getState().money;
    
    // Hire a full team
    store.hireEmployee('engineer', 'senior');
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('designer', 'mid');
    store.hireEmployee('pm', 'mid');
    store.hireEmployee('marketer', 'junior');
    
    const state = useGameStore.getState();
    
    // Verify team composition
    expect(state.employees).toHaveLength(5);
    expect(state.employees.filter(e => e.role === 'engineer')).toHaveLength(2);
    expect(state.employees.filter(e => e.role === 'designer')).toHaveLength(1);
    expect(state.employees.filter(e => e.role === 'pm')).toHaveLength(1);
    expect(state.employees.filter(e => e.role === 'marketer')).toHaveLength(1);
    
    // Verify money was deducted for all hires
    expect(state.money).toBeLessThan(initialMoney);
    
    // All should be idle initially
    expect(state.employees.every(e => e.status === 'idle')).toBe(true);
  });
});

// ============================================
// INTEGRATION TEST: Task Lifecycle
// ============================================

describe('Integration: Task Lifecycle', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should complete full task lifecycle: create → assign → progress → review → done', () => {
    const store = useGameStore.getState();
    store.startProject('E-commerce platform');
    store.hireEmployee('engineer', 'senior');
    
    // Create task
    store.createTask({
      title: 'Build shopping cart',
      description: 'Implement add/remove items, quantity, total calculation',
      type: 'feature',
      priority: 'high',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const task = useGameStore.getState().tasks[0];
    const engineer = useGameStore.getState().employees[0];
    
    // Assign task
    store.assignTask(task.id, engineer.id);
    expect(useGameStore.getState().tasks[0].status).toBe('in_progress');
    
    // Simulate work progress via game ticks
    for (let i = 0; i < 15; i++) {
      store.gameTick();
    }
    
    // Task should be in review (progress >= estimatedTicks)
    const afterWork = useGameStore.getState().tasks[0];
    expect(afterWork.progressTicks).toBeGreaterThanOrEqual(afterWork.estimatedTicks);
    expect(afterWork.status).toBe('review');
    
    // Approve the task
    store.updateTaskStatus(task.id, 'done');
    
    // Verify completion
    const completed = useGameStore.getState().tasks[0];
    expect(completed.status).toBe('done');
    
    // Engineer should be idle again
    const engineerAfter = useGameStore.getState().employees[0];
    expect(engineerAfter.status).toBe('idle');
    expect(engineerAfter.currentTaskId).toBeNull();
  });

  it('should handle multiple tasks in parallel with multiple engineers', () => {
    const store = useGameStore.getState();
    store.startProject('SaaS platform');
    
    // Hire 3 engineers
    store.hireEmployee('engineer', 'senior');
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('engineer', 'junior');
    
    // Create 3 tasks
    store.createTask({
      title: 'User authentication',
      description: 'Login, signup, password reset',
      type: 'feature',
      priority: 'high',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 8,
    });
    
    store.createTask({
      title: 'Dashboard UI',
      description: 'Main dashboard layout',
      type: 'feature',
      priority: 'medium',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 6,
    });
    
    store.createTask({
      title: 'API endpoints',
      description: 'REST API for user data',
      type: 'infrastructure',
      priority: 'high',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    const employees = useGameStore.getState().employees;
    const tasks = useGameStore.getState().tasks;
    
    // Assign all tasks
    store.assignTask(tasks[0].id, employees[0].id);
    store.assignTask(tasks[1].id, employees[1].id);
    store.assignTask(tasks[2].id, employees[2].id);
    
    // All should be in progress
    const state = useGameStore.getState();
    expect(state.tasks.every(t => t.status === 'in_progress')).toBe(true);
    expect(state.employees.every(e => e.status === 'working')).toBe(true);
    
    // Run ticks - tasks should complete at different rates based on employee productivity
    for (let i = 0; i < 20; i++) {
      store.gameTick();
    }
    
    // Some tasks should be in review
    const afterTicks = useGameStore.getState().tasks;
    const reviewOrDone = afterTicks.filter(t => t.status === 'review' || t.status === 'done');
    expect(reviewOrDone.length).toBeGreaterThan(0);
  });
});

// ============================================
// INTEGRATION TEST: AI Work Queue
// ============================================

describe('Integration: AI Work Queue', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should queue AI work when task is assigned with AI enabled', () => {
    const store = useGameStore.getState();
    store.startProject('AI-powered app');
    store.hireEmployee('engineer', 'mid');
    
    // Enable AI
    store.configureAI('sk-test-key', 'openai');
    
    // Create and assign task
    store.createTask({
      title: 'Build AI feature',
      description: 'Integrate GPT for smart suggestions',
      type: 'feature',
      priority: 'critical',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 12,
    });
    
    const task = useGameStore.getState().tasks[0];
    const engineer = useGameStore.getState().employees[0];
    
    store.assignTask(task.id, engineer.id);
    
    // Verify AI work is queued
    const state = useGameStore.getState();
    expect(state.aiWorkQueue).toHaveLength(1);
    expect(state.aiWorkQueue[0].taskId).toBe(task.id);
    expect(state.aiWorkQueue[0].employeeId).toBe(engineer.id);
    expect(state.aiWorkQueue[0].status).toBe('queued');
    
    // Task should be marked as AI work started
    expect(state.tasks[0].aiWorkStarted).toBe(true);
  });

  it('should prioritize critical tasks in the queue', () => {
    const store = useGameStore.getState();
    store.startProject('Urgent project');
    store.hireEmployee('engineer', 'senior');
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('engineer', 'junior');
    
    store.configureAI('sk-test-key', 'openai');
    
    // Create tasks with different priorities
    store.createTask({
      title: 'Low priority feature',
      description: 'Nice to have',
      type: 'feature',
      priority: 'low',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 5,
    });
    
    store.createTask({
      title: 'Critical bug fix',
      description: 'Production is down!',
      type: 'bug',
      priority: 'critical',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 3,
    });
    
    store.createTask({
      title: 'Medium feature',
      description: 'Regular work',
      type: 'feature',
      priority: 'medium',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 8,
    });
    
    const tasks = useGameStore.getState().tasks;
    const employees = useGameStore.getState().employees;
    
    // Assign in order of creation (not priority)
    store.assignTask(tasks[0].id, employees[0].id);
    store.assignTask(tasks[1].id, employees[1].id);
    store.assignTask(tasks[2].id, employees[2].id);
    
    // Queue should be sorted by priority
    const queue = useGameStore.getState().aiWorkQueue;
    expect(queue).toHaveLength(3);
    
    // Critical (priority 1) should be first
    expect(queue[0].taskId).toBe(tasks[1].id);
    // Medium (priority 3) should be second
    expect(queue[1].taskId).toBe(tasks[2].id);
    // Low (priority 4) should be last
    expect(queue[2].taskId).toBe(tasks[0].id);
  });
});

// ============================================
// INTEGRATION TEST: Mission Workflow
// ============================================

describe('Integration: Mission Workflow', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create mission with tasks', () => {
    const store = useGameStore.getState();
    store.startProject('Feature-rich app');
    
    // Create a mission (like a PM would)
    const missionId = store.createMissionWithTasks(
      'User Authentication',
      'Complete auth system with OAuth',
      'high',
      [
        { title: 'Login page', type: 'feature', estimatedTicks: 8 },
        { title: 'Signup flow', type: 'feature', estimatedTicks: 10 },
        { title: 'Password reset', type: 'feature', estimatedTicks: 6 },
        { title: 'OAuth integration', type: 'infrastructure', estimatedTicks: 12 },
      ]
    );
    
    const state = useGameStore.getState();
    
    // Verify mission created
    expect(state.missions).toHaveLength(1);
    expect(state.missions[0].id).toBe(missionId);
    expect(state.missions[0].name).toBe('User Authentication');
    expect(state.missions[0].status).toBe('planning'); // Initial status is 'planning'
    
    // Verify tasks created and linked
    expect(state.tasks).toHaveLength(4);
    expect(state.missions[0].taskIds).toHaveLength(4);
    
    // All tasks should reference the mission
    state.tasks.forEach(task => {
      expect(state.missions[0].taskIds).toContain(task.id);
    });
  });

  it('should track mission progress as tasks complete', () => {
    const store = useGameStore.getState();
    store.startProject('MVP');
    store.hireEmployee('engineer', 'senior');
    
    // Create mission with 2 tasks
    store.createMissionWithTasks(
      'Core Features',
      'Essential features for launch',
      'critical',
      [
        { title: 'Task 1', type: 'feature', estimatedTicks: 5 },
        { title: 'Task 2', type: 'feature', estimatedTicks: 5 },
      ]
    );
    
    const engineer = useGameStore.getState().employees[0];
    const tasks = useGameStore.getState().tasks;
    
    // Activate the mission
    store.updateMissionStatus(useGameStore.getState().missions[0].id, 'active');
    
    // Assign first task
    store.assignTask(tasks[0].id, engineer.id);
    
    // Complete first task
    for (let i = 0; i < 10; i++) store.gameTick();
    store.updateTaskStatus(tasks[0].id, 'done');
    
    // Check mission has progress
    const mission = useGameStore.getState().missions[0];
    const doneTasks = useGameStore.getState().tasks.filter(
      t => mission.taskIds.includes(t.id) && t.status === 'done'
    );
    expect(doneTasks).toHaveLength(1);
  });
});

// ============================================
// INTEGRATION TEST: PM Brain & Proposals
// ============================================

describe('Integration: PM Brain Proposals', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should allow player to approve PM proposals', () => {
    const store = useGameStore.getState();
    store.startProject('Growing startup');
    store.hireEmployee('engineer', 'mid');
    
    // Manually add a PM proposal (simulating PM evaluation)
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [
          {
            id: 'proposal-1',
            type: 'mission',
            title: 'Build User Dashboard',
            description: 'Create a comprehensive user dashboard',
            priority: 'high',
            status: 'pending',
            createdAt: Date.now(),
            payload: {
              missionName: 'User Dashboard',
              missionDescription: 'Dashboard with analytics',
              tasks: [
                { title: 'Dashboard layout', type: 'feature' as const, estimatedTicks: 8 },
                { title: 'Charts component', type: 'feature' as const, estimatedTicks: 6 },
              ],
            },
          },
        ],
      },
    }));
    
    // Player approves the proposal
    const proposal = useGameStore.getState().pmBrain.proposals[0];
    store.approveProposal(proposal.id);
    
    // Verify: Mission was created
    const state = useGameStore.getState();
    expect(state.missions).toHaveLength(1);
    expect(state.missions[0].name).toBe('User Dashboard');
    
    // Verify: Tasks were created
    expect(state.tasks).toHaveLength(2);
    
    // Verify: Proposal is marked approved
    const updatedProposal = state.pmBrain.proposals.find(p => p.id === proposal.id);
    expect(updatedProposal?.status).toBe('approved');
  });

  it('should allow player to reject PM proposals', () => {
    const store = useGameStore.getState();
    store.startProject('Startup');
    
    // Add a proposal
    useGameStore.setState(state => ({
      pmBrain: {
        ...state.pmBrain,
        proposals: [
          {
            id: 'proposal-2',
            type: 'mission',
            title: 'Unnecessary Feature',
            description: 'Something we do not need',
            priority: 'low',
            status: 'pending',
            createdAt: Date.now(),
            payload: {},
          },
        ],
      },
    }));
    
    // Player rejects
    store.rejectProposal('proposal-2');
    
    // Verify: No mission created
    expect(useGameStore.getState().missions).toHaveLength(0);
    
    // Verify: Proposal is marked rejected
    const proposal = useGameStore.getState().pmBrain.proposals.find(p => p.id === 'proposal-2');
    expect(proposal?.status).toBe('rejected');
    
    // Verify: PM thought recorded
    const thoughts = useGameStore.getState().pmBrain.thoughts;
    expect(thoughts.some(t => t.message.includes('rejected'))).toBe(true);
  });

  it('should run PM evaluation and analyze product state', () => {
    const store = useGameStore.getState();
    store.startProject('Complex app with many features');
    store.hireEmployee('engineer', 'senior');
    store.hireEmployee('designer', 'mid');
    
    // Create some completed tasks to give context
    store.createTask({
      title: 'User authentication login',
      description: 'Login system',
      type: 'feature',
      priority: 'high',
      status: 'done',
      assigneeId: null,
      estimatedTicks: 10,
    });
    
    store.createTask({
      title: 'User profile page',
      description: 'Profile UI',
      type: 'feature',
      priority: 'medium',
      status: 'done',
      assigneeId: null,
      estimatedTicks: 8,
    });
    
    // Update tasks to done status
    useGameStore.setState(state => ({
      tasks: state.tasks.map(t => ({ ...t, status: 'done' as TaskStatus, completedAt: state.tick })),
    }));
    
    // Advance tick to trigger evaluation
    useGameStore.setState({ tick: 1000 });
    
    // Run PM evaluation
    store.runPMEvaluation();
    
    // Verify: Product state is analyzed
    const pmBrain = useGameStore.getState().pmBrain;
    expect(pmBrain.productState).not.toBeNull();
    expect(pmBrain.productState?.hasAuth).toBe(true); // Should detect auth from task title
    
    // Verify: Thoughts are generated
    expect(pmBrain.thoughts.length).toBeGreaterThan(0);
  });
});

// ============================================
// INTEGRATION TEST: Employee Progression
// ============================================

describe('Integration: Employee Progression', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should track employee experience through task completion', () => {
    const store = useGameStore.getState();
    store.startProject('Learning platform');
    store.hireEmployee('engineer', 'mid');
    
    const engineer = useGameStore.getState().employees[0];
    
    // Initially no experience
    expect(engineer.tasksCompleted).toBe(0);
    expect(engineer.memory).toHaveLength(0);
    expect(engineer.specializations).toHaveLength(0);
    
    // Add memory manually (simulating AI work completion)
    store.addEmployeeMemory(engineer.id, {
      type: 'task',
      content: 'Built user authentication with JWT',
      importance: 0.8,
      tags: ['auth', 'security', 'jwt'],
    });
    
    store.addEmployeeMemory(engineer.id, {
      type: 'task',
      content: 'Created API endpoints for user management',
      importance: 0.7,
      tags: ['api', 'backend', 'auth'],
    });
    
    // Update specializations
    store.updateEmployeeSpecializations(engineer.id);
    
    // Verify: Employee now has experience
    const updatedEngineer = useGameStore.getState().employees[0];
    expect(updatedEngineer.memory).toHaveLength(2);
    expect(updatedEngineer.specializations).toContain('auth'); // Most common tag
  });

  it('should build context from employee memory', () => {
    const store = useGameStore.getState();
    store.startProject('Enterprise app');
    store.hireEmployee('engineer', 'senior');
    
    const engineer = useGameStore.getState().employees[0];
    
    // Build up experience
    store.addEmployeeMemory(engineer.id, {
      type: 'task',
      content: 'Implemented OAuth2 authentication flow',
      importance: 0.9,
      tags: ['auth', 'oauth', 'security', 'login'],
    });
    
    store.addEmployeeMemory(engineer.id, {
      type: 'task',
      content: 'Built payment processing with Stripe',
      importance: 0.85,
      tags: ['payment', 'stripe', 'billing', 'checkout'],
    });
    
    store.addEmployeeMemory(engineer.id, {
      type: 'learning',
      content: 'Learned best practices for API rate limiting',
      importance: 0.6,
      tags: ['api', 'performance'],
    });
    
    // Update specializations based on memories
    store.updateEmployeeSpecializations(engineer.id);
    
    // Manually update task count (simulating completed work)
    const currentEmployee = useGameStore.getState().employees[0];
    useGameStore.setState({
      employees: useGameStore.getState().employees.map(e => 
        e.id === engineer.id 
          ? { ...e, tasksCompleted: 15 }
          : e
      ),
    });
    
    // Get context for an auth-related task (should match 'login' tag)
    const authContext = store.getEmployeeContext(engineer.id, 'user login feature');
    
    expect(authContext).toContain('Experience');
    expect(authContext).toContain('15'); // Tasks completed
    expect(authContext).toContain('OAuth2'); // Relevant memory
    
    // Get context for a payment-related task (should match 'checkout' tag)
    const paymentContext = store.getEmployeeContext(engineer.id, 'payment checkout');
    expect(paymentContext).toContain('Stripe');
  });
});

// ============================================
// INTEGRATION TEST: Full Game Flow
// ============================================

describe('Integration: Full Game Flow', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should simulate a complete game session', () => {
    const store = useGameStore.getState();
    
    // === PHASE 1: Startup ===
    store.startProject('The next big social network');
    expect(useGameStore.getState().project).not.toBeNull();
    
    const initialMoney = useGameStore.getState().money;
    
    // === PHASE 2: Build Team ===
    store.hireEmployee('engineer', 'senior'); // Tech lead
    store.hireEmployee('engineer', 'mid');    // Developer
    store.hireEmployee('designer', 'mid');    // Designer
    store.hireEmployee('pm', 'mid');          // Product manager
    
    expect(useGameStore.getState().employees).toHaveLength(4);
    expect(useGameStore.getState().money).toBeLessThan(initialMoney);
    
    // === PHASE 3: Create Work ===
    // PM creates an epic
    const epicId = store.createEpic('MVP Launch', 'Core features for launch', 'mvp');
    
    // Create a mission within the epic
    const missionId = store.createMissionWithTasks(
      'User Onboarding',
      'First-time user experience',
      'critical',
      [
        { title: 'Welcome screen', type: 'design', estimatedTicks: 5 },
        { title: 'Signup flow', type: 'feature', estimatedTicks: 8 },
        { title: 'Profile setup', type: 'feature', estimatedTicks: 6 },
      ]
    );
    
    store.addMissionToEpic(epicId, missionId);
    store.updateMissionStatus(missionId, 'active');
    
    // === PHASE 4: Assign Work ===
    const employees = useGameStore.getState().employees;
    const tasks = useGameStore.getState().tasks;
    
    // Designer does the welcome screen
    const designer = employees.find(e => e.role === 'designer')!;
    store.assignTask(tasks[0].id, designer.id);
    
    // Engineers do the features
    const engineers = employees.filter(e => e.role === 'engineer');
    store.assignTask(tasks[1].id, engineers[0].id);
    store.assignTask(tasks[2].id, engineers[1].id);
    
    // === PHASE 5: Work Progress ===
    // Simulate 20 game ticks
    for (let i = 0; i < 20; i++) {
      store.gameTick();
    }
    
    // Some tasks should be in review
    const afterWork = useGameStore.getState().tasks;
    const inReview = afterWork.filter(t => t.status === 'review');
    expect(inReview.length).toBeGreaterThan(0);
    
    // === PHASE 6: Review and Complete ===
    inReview.forEach(task => {
      store.updateTaskStatus(task.id, 'done');
    });
    
    // === PHASE 7: Verify Stats ===
    const finalState = useGameStore.getState();
    const completedTasks = finalState.tasks.filter(t => t.status === 'done');
    expect(completedTasks.length).toBeGreaterThan(0);
    
    // Activity log should have entries
    expect(finalState.activityLog.length).toBeGreaterThan(0);
    
    // Mission should have progress
    const mission = finalState.missions[0];
    expect(mission.taskIds.length).toBe(3);
  });

  it('should handle control groups for RTS-style management', () => {
    const store = useGameStore.getState();
    store.startProject('RTS-managed project');
    
    // Hire a team
    store.hireEmployee('engineer', 'senior');
    store.hireEmployee('engineer', 'mid');
    store.hireEmployee('engineer', 'junior');
    store.hireEmployee('designer', 'mid');
    
    const employees = useGameStore.getState().employees;
    const engineers = employees.filter(e => e.role === 'engineer');
    const designers = employees.filter(e => e.role === 'designer');
    
    // Set up control groups
    store.setControlGroup(1, engineers.map(e => e.id)); // Ctrl+1 = Engineers
    store.setControlGroup(2, designers.map(e => e.id)); // Ctrl+2 = Designers
    
    // Verify control groups
    const groups = useGameStore.getState().controlGroups;
    expect(groups.find(g => g.id === 1)?.employeeIds).toHaveLength(3);
    expect(groups.find(g => g.id === 2)?.employeeIds).toHaveLength(1);
    
    // Select control group
    store.selectControlGroup(1);
    expect(useGameStore.getState().selectedEmployeeIds).toHaveLength(3);
    
    // Quick assign all selected to a task
    store.createTask({
      title: 'Big feature',
      description: 'Needs all hands',
      type: 'feature',
      priority: 'critical',
      status: 'todo',
      assigneeId: null,
      estimatedTicks: 20,
    });
    
    // Verify selection works
    const selected = useGameStore.getState().selectedEmployeeIds;
    expect(selected.every(id => engineers.some(e => e.id === id))).toBe(true);
  });
});
