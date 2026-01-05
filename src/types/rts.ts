/**
 * RTS Game Mechanics - Control Groups, Rally Points, Tech Tree
 */

// Control Groups (like StarCraft Ctrl+1-9)
export interface ControlGroup {
  id: number; // 1-9
  employeeIds: string[];
  name?: string;
}

// Rally Points - where new tasks of a type go
export interface RallyPoint {
  taskType: 'feature' | 'bug' | 'design' | 'marketing' | 'infrastructure';
  targetEmployeeIds: string[]; // Employees who will auto-receive these tasks
  enabled: boolean;
}

// Tech Tree / Company Upgrades
export type UpgradeCategory = 'engineering' | 'culture' | 'tools' | 'processes';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  cost: number;
  unlocked: boolean;
  purchased: boolean;
  requires?: string[]; // Prerequisite upgrade IDs
  effects: UpgradeEffect[];
}

export interface UpgradeEffect {
  type: 'productivity' | 'morale' | 'cost' | 'speed' | 'quality' | 'capacity' | 'unlock';
  value: number; // Percentage modifier or absolute value
  target?: string; // Specific role or 'all'
}

// Production Stats for metrics
export interface ProductionStats {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  avgCompletionTime: number; // in ticks
  velocity: number; // tasks per day
  codeQuality: number; // 0-100
  technicalDebt: number; // 0-100
  teamHealth: number; // 0-100 (avg morale)
}

// Alert System
export interface GameAlert {
  id: string;
  type: 'warning' | 'danger' | 'opportunity' | 'info';
  title: string;
  message: string;
  timestamp: number;
  dismissed: boolean;
  action?: {
    label: string;
    screen?: string;
    callback?: string;
  };
}

// RTS State Extension
export interface RTSState {
  controlGroups: ControlGroup[];
  rallyPoints: RallyPoint[];
  upgrades: Upgrade[];
  productionStats: ProductionStats;
  alerts: GameAlert[];
  currentView: 'dashboard' | 'command' | 'queue' | 'tech';
  minimapActivity: MinimapEvent[];
}

// Minimap events for visualization
export interface MinimapEvent {
  id: string;
  type: 'task_start' | 'task_complete' | 'hire' | 'bug' | 'deploy' | 'alert';
  x: number; // 0-100 position
  y: number;
  timestamp: number;
  label?: string;
}

// Default upgrades tree
export const DEFAULT_UPGRADES: Upgrade[] = [
  // Engineering
  {
    id: 'better-ide',
    name: 'Better IDE',
    description: '+10% engineering productivity',
    category: 'engineering',
    icon: '💻',
    cost: 5000,
    unlocked: true,
    purchased: false,
    effects: [{ type: 'productivity', value: 10, target: 'engineer' }],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    description: '+15% task completion speed',
    category: 'engineering',
    icon: '🔄',
    cost: 10000,
    unlocked: true,
    purchased: false,
    requires: ['better-ide'],
    effects: [{ type: 'speed', value: 15, target: 'all' }],
  },
  {
    id: 'code-review',
    name: 'Code Review Process',
    description: '+20% code quality, -5% speed',
    category: 'engineering',
    icon: '👀',
    cost: 8000,
    unlocked: true,
    purchased: false,
    effects: [
      { type: 'quality', value: 20, target: 'all' },
      { type: 'speed', value: -5, target: 'all' },
    ],
  },
  {
    id: 'testing-suite',
    name: 'Automated Testing',
    description: '-30% bugs, +10% completion time',
    category: 'engineering',
    icon: '🧪',
    cost: 15000,
    unlocked: false,
    purchased: false,
    requires: ['ci-cd'],
    effects: [{ type: 'quality', value: 30, target: 'all' }],
  },

  // Culture
  {
    id: 'free-snacks',
    name: 'Free Snacks',
    description: '+5% morale for all',
    category: 'culture',
    icon: '🍪',
    cost: 2000,
    unlocked: true,
    purchased: false,
    effects: [{ type: 'morale', value: 5, target: 'all' }],
  },
  {
    id: 'remote-work',
    name: 'Remote Work',
    description: '+10% morale, +5% productivity',
    category: 'culture',
    icon: '🏠',
    cost: 5000,
    unlocked: true,
    purchased: false,
    requires: ['free-snacks'],
    effects: [
      { type: 'morale', value: 10, target: 'all' },
      { type: 'productivity', value: 5, target: 'all' },
    ],
  },
  {
    id: 'equity-program',
    name: 'Equity Program',
    description: '+20% morale, -10% salary cost',
    category: 'culture',
    icon: '📈',
    cost: 20000,
    unlocked: false,
    purchased: false,
    requires: ['remote-work'],
    effects: [
      { type: 'morale', value: 20, target: 'all' },
      { type: 'cost', value: -10, target: 'all' },
    ],
  },

  // Tools
  {
    id: 'design-system',
    name: 'Design System',
    description: '+25% designer productivity',
    category: 'tools',
    icon: '🎨',
    cost: 8000,
    unlocked: true,
    purchased: false,
    effects: [{ type: 'productivity', value: 25, target: 'designer' }],
  },
  {
    id: 'analytics',
    name: 'Analytics Platform',
    description: '+15% PM productivity',
    category: 'tools',
    icon: '📊',
    cost: 6000,
    unlocked: true,
    purchased: false,
    effects: [{ type: 'productivity', value: 15, target: 'pm' }],
  },
  {
    id: 'ai-copilot',
    name: 'AI Copilot',
    description: '+30% all productivity',
    category: 'tools',
    icon: '🤖',
    cost: 50000,
    unlocked: false,
    purchased: false,
    requires: ['better-ide', 'ci-cd', 'testing-suite'],
    effects: [{ type: 'productivity', value: 30, target: 'all' }],
  },

  // Processes
  {
    id: 'standups',
    name: 'Daily Standups',
    description: '+5% team coordination',
    category: 'processes',
    icon: '🧍',
    cost: 1000,
    unlocked: true,
    purchased: false,
    effects: [{ type: 'speed', value: 5, target: 'all' }],
  },
  {
    id: 'sprints',
    name: 'Sprint Planning',
    description: '+10% task estimation accuracy',
    category: 'processes',
    icon: '🏃',
    cost: 3000,
    unlocked: true,
    purchased: false,
    requires: ['standups'],
    effects: [{ type: 'speed', value: 10, target: 'all' }],
  },
  {
    id: 'okrs',
    name: 'OKR Framework',
    description: '+15% all productivity',
    category: 'processes',
    icon: '🎯',
    cost: 10000,
    unlocked: false,
    purchased: false,
    requires: ['sprints'],
    effects: [{ type: 'productivity', value: 15, target: 'all' }],
  },
];
