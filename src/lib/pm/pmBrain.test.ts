/**
 * PM Brain Tests
 * 
 * Tests for:
 * - Product state analysis
 * - PM thought generation
 * - Mission evaluation and suggestion
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeProductState,
  generatePMThoughts,
  evaluateNextMissions,
  MISSION_GENERATION_TEMPLATES,
  EPIC_TEMPLATES,
} from './pmBrain';
import type { Task, Mission, Employee, Project } from '../../types';

describe('PM Brain - analyzeProductState', () => {
  it('should return default MVP state for no tasks', () => {
    const project: Project = {
      id: 'test',
      name: 'Test App',
      description: 'A test app',
      createdAt: 0,
    };
    
    const result = analyzeProductState(project, [], [], 0);
    
    expect(result.phase).toBe('mvp');
    expect(result.featureCount).toBe(0);
    expect(result.hasAuth).toBe(false);
    expect(result.hasDatabase).toBe(false);
  });

  it('should detect auth features from task titles', () => {
    const project: Project = {
      id: 'test',
      name: 'Test App',
      description: 'A test app',
      createdAt: 0,
    };
    
    const tasks: Task[] = [
      {
        id: '1',
        title: 'User authentication login system',
        description: 'Login system',
        type: 'feature',
        status: 'done',
        priority: 'high',
        assigneeId: null,
        estimatedTicks: 500,
        progressTicks: 500,
        createdAt: 0,
        updatedAt: 0,
        completedAt: 100,
      },
    ];
    
    const result = analyzeProductState(project, tasks, [], 100);
    
    expect(result.hasAuth).toBe(true);
    expect(result.featureCount).toBe(1);
  });

  it('should determine MVP phase with few features', () => {
    const project: Project = {
      id: 'test',
      name: 'New Startup',
      description: 'Just starting',
      createdAt: 0,
    };
    
    const tasks: Task[] = [
      {
        id: '1',
        title: 'Landing page',
        description: '',
        type: 'feature',
        status: 'done',
        priority: 'high',
        assigneeId: null,
        estimatedTicks: 200,
        progressTicks: 200,
        createdAt: 0,
        updatedAt: 0,
        completedAt: 100,
      },
    ];
    
    const result = analyzeProductState(project, tasks, [], 100);
    expect(result.phase).toBe('mvp');
  });

  it('should determine growth phase with core and growth features', () => {
    const project: Project = {
      id: 'test',
      name: 'Growing App',
      description: 'Established product',
      createdAt: 0,
    };
    
    // Need: hasAuth, hasDatabase, hasAPI, hasUI (at least 2) + growth features (at least 1)
    const tasks: Task[] = [
      { id: '1', title: 'User login auth', description: '', type: 'feature', status: 'done', priority: 'high', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '2', title: 'Database schema setup', description: '', type: 'feature', status: 'done', priority: 'high', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '3', title: 'Landing page hero', description: '', type: 'feature', status: 'done', priority: 'medium', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
    ];
    
    const result = analyzeProductState(project, tasks, [], 100);
    expect(result.phase).toBe('growth');
  });

  it('should determine scale phase with many core and growth features', () => {
    const project: Project = {
      id: 'test',
      name: 'Mature Product',
      description: 'Well established',
      createdAt: 0,
    };
    
    // Need: 3+ core features (auth, database, api, ui) + 2+ growth features (landing, pricing, onboarding, analytics)
    const tasks: Task[] = [
      { id: '1', title: 'User login auth system', description: '', type: 'feature', status: 'done', priority: 'high', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '2', title: 'Database postgres schema', description: '', type: 'feature', status: 'done', priority: 'high', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '3', title: 'API REST endpoint routes', description: '', type: 'feature', status: 'done', priority: 'high', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '4', title: 'Marketing landing hero page', description: '', type: 'feature', status: 'done', priority: 'medium', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
      { id: '5', title: 'Pricing stripe subscription', description: '', type: 'feature', status: 'done', priority: 'medium', assigneeId: null, estimatedTicks: 200, progressTicks: 200, createdAt: 0, updatedAt: 0, completedAt: 100 },
    ];
    
    const result = analyzeProductState(project, tasks, [], 100);
    expect(result.phase).toBe('scale');
  });

  it('should count bugs correctly', () => {
    const project: Project = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      createdAt: 0,
    };
    
    const tasks: Task[] = [
      { id: '1', title: 'Bug 1', description: '', type: 'bug', status: 'todo', priority: 'high', assigneeId: null, estimatedTicks: 100, progressTicks: 0, createdAt: 0, updatedAt: 0, completedAt: null },
      { id: '2', title: 'Bug 2', description: '', type: 'bug', status: 'in_progress', priority: 'medium', assigneeId: 'e1', estimatedTicks: 100, progressTicks: 50, createdAt: 0, updatedAt: 0, completedAt: null },
      { id: '3', title: 'Bug 3', description: '', type: 'bug', status: 'done', priority: 'low', assigneeId: null, estimatedTicks: 100, progressTicks: 100, createdAt: 0, updatedAt: 0, completedAt: 100 }, // This one is fixed
    ];
    
    const result = analyzeProductState(project, tasks, [], 100);
    expect(result.bugCount).toBe(2); // Only non-done bugs
  });
});

describe('PM Brain - generatePMThoughts', () => {
  const createProductState = (overrides = {}) => ({
    phase: 'mvp' as const,
    hasAuth: false,
    hasDatabase: false,
    hasAPI: false,
    hasUI: false,
    hasLanding: false,
    hasPricing: false,
    hasOnboarding: false,
    hasAnalytics: false,
    hasTesting: false,
    hasCI: false,
    hasDocumentation: false,
    featureCount: 0,
    bugCount: 0,
    techDebtScore: 0,
    userFeedbackScore: 50,
    ...overrides,
  });
  
  it('should generate observation about product phase', () => {
    const productState = createProductState({ featureCount: 2 });
    const employees: Employee[] = [];
    
    const thoughts = generatePMThoughts(productState, [], [], employees);
    
    const observations = thoughts.filter(t => t.type === 'observation');
    expect(observations.length).toBeGreaterThan(0);
    expect(observations.some(t => t.message.toLowerCase().includes('mvp'))).toBe(true);
  });

  it('should generate priority thought when no active missions', () => {
    const productState = createProductState({ featureCount: 1 });
    const employees: Employee[] = [
      { id: 'e1', name: 'Alice', role: 'engineer', salary: 5000, status: 'idle', avatarEmoji: '👩‍💻', currentTaskId: null, hiredAt: 0, aiModel: null, aiProvider: null, memory: [], tasksCompleted: 0, totalTicksWorked: 0, specializations: [] },
    ];
    
    const thoughts = generatePMThoughts(productState, [], [], employees);
    
    const priorities = thoughts.filter(t => t.type === 'priority');
    expect(priorities.some(t => t.message.toLowerCase().includes('mission'))).toBe(true);
  });

  it('should generate thought about idle employees', () => {
    const productState = createProductState();
    const employees: Employee[] = [
      { id: 'e1', name: 'Alice', role: 'engineer', salary: 5000, status: 'idle', avatarEmoji: '👩‍💻', currentTaskId: null, hiredAt: 0, aiModel: null, aiProvider: null, memory: [], tasksCompleted: 0, totalTicksWorked: 0, specializations: [] },
      { id: 'e2', name: 'Bob', role: 'engineer', salary: 5000, status: 'idle', avatarEmoji: '👨‍💻', currentTaskId: null, hiredAt: 0, aiModel: null, aiProvider: null, memory: [], tasksCompleted: 0, totalTicksWorked: 0, specializations: [] },
    ];
    
    const thoughts = generatePMThoughts(productState, [], [], employees);
    
    expect(thoughts.some(t => t.message.includes('idle'))).toBe(true);
  });

  it('should generate thought about bugs', () => {
    const productState = createProductState({ bugCount: 3 });
    const employees: Employee[] = [];
    
    const thoughts = generatePMThoughts(productState, [], [], employees);
    
    expect(thoughts.some(t => t.message.toLowerCase().includes('bug'))).toBe(true);
  });

  it('should generate high tech debt warning', () => {
    const productState = createProductState({ techDebtScore: 70 });
    const employees: Employee[] = [];
    
    const thoughts = generatePMThoughts(productState, [], [], employees);
    
    expect(thoughts.some(t => t.message.toLowerCase().includes('tech debt'))).toBe(true);
  });
});

describe('PM Brain - evaluateNextMissions', () => {
  const createProductState = (overrides = {}) => ({
    phase: 'mvp' as const,
    hasAuth: false,
    hasDatabase: false,
    hasAPI: false,
    hasUI: false,
    hasLanding: false,
    hasPricing: false,
    hasOnboarding: false,
    hasAnalytics: false,
    hasTesting: false,
    hasCI: false,
    hasDocumentation: false,
    featureCount: 0,
    bugCount: 0,
    techDebtScore: 0,
    userFeedbackScore: 50,
    ...overrides,
  });
  
  it('should suggest database mission when no database exists', () => {
    const productState = createProductState();
    
    const missions = evaluateNextMissions(productState, []);
    
    expect(missions.length).toBeGreaterThan(0);
    const dbMission = missions.find(m => 
      m.name.toLowerCase().includes('database')
    );
    expect(dbMission).toBeDefined();
  });

  it('should not suggest auth mission if auth feature exists', () => {
    const productState = createProductState({
      hasAuth: true,
      hasDatabase: true,
      phase: 'growth',
    });
    
    const existingMissions: Mission[] = [
      {
        id: 'auth-mission',
        name: 'User Authentication',
        description: 'Login system',
        status: 'completed',
        priority: 'high',
        createdAt: 0,
        startedAt: 0,
        completedAt: 100,
        taskIds: [],
        branchName: 'mission/auth',
        baseBranch: 'main',
        worktreePath: null,
        commits: [],
        pullRequestUrl: null,
      },
    ];
    
    const missions = evaluateNextMissions(productState, existingMissions);
    
    const authMission = missions.find(m => 
      m.name.toLowerCase() === 'user authentication'
    );
    expect(authMission).toBeUndefined();
  });

  it('should suggest growth features in growth phase', () => {
    const productState = createProductState({
      phase: 'growth',
      hasAuth: true,
      hasDatabase: true,
      hasAPI: true,
    });
    
    const missions = evaluateNextMissions(productState, []);
    
    expect(missions.length).toBeGreaterThan(0);
    // Should have suggestions for growth phase
    expect(missions.some(m => m.priority === 'high' || m.priority === 'medium')).toBe(true);
  });

  it('should limit suggestions to max count', () => {
    const productState = createProductState();
    
    const missions = evaluateNextMissions(productState, [], 2);
    
    // Should respect max count
    expect(missions.length).toBeLessThanOrEqual(2);
  });
});

describe('PM Brain - MISSION_GENERATION_TEMPLATES', () => {
  it('should have valid template structure', () => {
    for (const template of MISSION_GENERATION_TEMPLATES) {
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.priority).toMatch(/critical|high|medium|low/);
      expect(template.tasks).toBeDefined();
      expect(template.tasks.length).toBeGreaterThan(0);
      expect(template.requiredCondition).toBeDefined();
      expect(typeof template.requiredCondition).toBe('function');
    }
  });

  it('should have tasks with proper structure', () => {
    for (const template of MISSION_GENERATION_TEMPLATES) {
      for (const task of template.tasks) {
        expect(task.title).toBeDefined();
        // Task types used in templates: feature, bug, design, marketing, infrastructure
        expect(task.type).toMatch(/feature|bug|design|marketing|infrastructure/);
        expect(task.estimatedTicks).toBeGreaterThan(0);
      }
    }
  });
});

describe('PM Brain - EPIC_TEMPLATES', () => {
  it('should have valid epic template structure', () => {
    for (const epic of EPIC_TEMPLATES) {
      expect(epic.name).toBeDefined();
      expect(epic.description).toBeDefined();
      expect(epic.phase).toMatch(/mvp|growth|scale|mature/);
      expect(epic.status).toBeDefined();
      expect(epic.priority).toMatch(/critical|high|medium|low/);
    }
  });
});
