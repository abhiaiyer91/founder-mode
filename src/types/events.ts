/**
 * Enhanced Random Events System
 */

export type EventCategory = 'opportunity' | 'challenge' | 'neutral' | 'crisis';

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: EventCategory;
  probability: number; // 0-1, chance of occurring when triggered
  duration?: number; // Ticks the event lasts
  effects: EventEffect[];
  choices?: EventChoice[];
  requirements?: EventRequirement[];
}

export interface EventEffect {
  type: 
    | 'money' 
    | 'morale' 
    | 'productivity' 
    | 'employee_leave' 
    | 'employee_join'
    | 'task_speed'
    | 'unlock';
  value: number;
  target?: 'all' | 'random' | string; // Employee ID or role
  duration?: number; // Ticks
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
  cost?: number;
}

export interface EventRequirement {
  type: 'money' | 'employees' | 'tasks_done' | 'week';
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;
}

export interface ActiveEvent {
  eventId: string;
  startTick: number;
  endTick?: number;
  choiceMade?: string;
  effects: EventEffect[];
}

// Default events
export const DEFAULT_EVENTS: GameEvent[] = [
  // Opportunities
  {
    id: 'viral-tweet',
    name: 'Viral Tweet! 🐦',
    description: 'Your product got mentioned by a tech influencer! Morale is through the roof.',
    icon: '🐦',
    category: 'opportunity',
    probability: 0.3,
    effects: [
      { type: 'morale', value: 15, target: 'all' },
      { type: 'money', value: 5000 },
    ],
  },
  {
    id: 'investor-interest',
    name: 'Investor Interest 💼',
    description: 'A VC wants to chat about your startup!',
    icon: '💼',
    category: 'opportunity',
    probability: 0.2,
    requirements: [{ type: 'tasks_done', operator: '>=', value: 10 }],
    effects: [], // Choices handle effects
    choices: [
      {
        id: 'take-meeting',
        label: 'Take the meeting',
        description: 'Spend time but might get funding',
        effects: [
          { type: 'productivity', value: -10, target: 'all', duration: 480 },
          { type: 'money', value: 25000 },
        ],
      },
      {
        id: 'focus-product',
        label: 'Stay focused on product',
        description: 'Keep building, investors can wait',
        effects: [
          { type: 'morale', value: 5, target: 'all' },
          { type: 'productivity', value: 10, target: 'all', duration: 240 },
        ],
      },
    ],
  },
  {
    id: 'hackathon-win',
    name: 'Hackathon Win! 🏆',
    description: 'Your team won a local hackathon!',
    icon: '🏆',
    category: 'opportunity',
    probability: 0.15,
    requirements: [{ type: 'employees', operator: '>=', value: 2 }],
    effects: [
      { type: 'money', value: 10000 },
      { type: 'morale', value: 20, target: 'all' },
    ],
  },
  {
    id: 'great-review',
    name: 'Great Code Review 👏',
    description: 'An engineer wrote exceptionally clean code today.',
    icon: '👏',
    category: 'opportunity',
    probability: 0.4,
    requirements: [{ type: 'employees', operator: '>=', value: 1 }],
    effects: [
      { type: 'morale', value: 10, target: 'random' },
      { type: 'productivity', value: 5, target: 'random', duration: 480 },
    ],
  },
  {
    id: 'referral-bonus',
    name: 'Employee Referral 🤝',
    description: 'Your employee referred a friend. Hiring them is discounted!',
    icon: '🤝',
    category: 'opportunity',
    probability: 0.25,
    requirements: [{ type: 'employees', operator: '>=', value: 2 }],
    effects: [
      { type: 'money', value: 3000 },
    ],
  },

  // Challenges
  {
    id: 'production-bug',
    name: 'Production Bug! 🐛',
    description: 'A critical bug was found in production. All hands on deck!',
    icon: '🐛',
    category: 'challenge',
    probability: 0.35,
    requirements: [{ type: 'tasks_done', operator: '>=', value: 5 }],
    effects: [
      { type: 'morale', value: -10, target: 'all' },
      { type: 'task_speed', value: -20, target: 'all', duration: 240 },
    ],
    choices: [
      {
        id: 'overtime',
        label: 'Work overtime to fix it',
        description: 'Fix fast but hurt morale',
        effects: [
          { type: 'morale', value: -15, target: 'all' },
          { type: 'task_speed', value: 30, target: 'all', duration: 120 },
        ],
      },
      {
        id: 'steady-fix',
        label: 'Fix it properly',
        description: 'Take time to do it right',
        effects: [
          { type: 'task_speed', value: -10, target: 'all', duration: 480 },
        ],
      },
    ],
  },
  {
    id: 'employee-burnout',
    name: 'Burnout Warning ⚠️',
    description: 'An employee is showing signs of burnout.',
    icon: '😫',
    category: 'challenge',
    probability: 0.3,
    requirements: [{ type: 'employees', operator: '>=', value: 1 }],
    effects: [
      { type: 'morale', value: -20, target: 'random' },
      { type: 'productivity', value: -30, target: 'random', duration: 480 },
    ],
    choices: [
      {
        id: 'vacation',
        label: 'Give them time off',
        description: 'Paid vacation, they\'ll recover',
        effects: [
          { type: 'money', value: -2000 },
          { type: 'morale', value: 30, target: 'random' },
        ],
        cost: 2000,
      },
      {
        id: 'push-through',
        label: 'Push through',
        description: 'Risk them quitting',
        effects: [
          { type: 'morale', value: -10, target: 'random' },
        ],
      },
    ],
  },
  {
    id: 'server-down',
    name: 'Servers Down! 🔥',
    description: 'Your infrastructure is having issues.',
    icon: '🔥',
    category: 'challenge',
    probability: 0.2,
    requirements: [{ type: 'week', operator: '>=', value: 2 }],
    effects: [
      { type: 'task_speed', value: -50, target: 'all', duration: 120 },
    ],
    choices: [
      {
        id: 'pay-premium',
        label: 'Pay for premium support',
        description: 'Expensive but fast',
        effects: [
          { type: 'money', value: -5000 },
        ],
        cost: 5000,
      },
      {
        id: 'diy-fix',
        label: 'Fix it ourselves',
        description: 'Engineers work on infra',
        effects: [
          { type: 'task_speed', value: -30, target: 'all', duration: 240 },
        ],
      },
    ],
  },
  {
    id: 'competitor-launch',
    name: 'Competitor Launch 👀',
    description: 'A competitor just launched something similar!',
    icon: '👀',
    category: 'challenge',
    probability: 0.15,
    requirements: [{ type: 'week', operator: '>=', value: 3 }],
    effects: [
      { type: 'morale', value: -5, target: 'all' },
    ],
    choices: [
      {
        id: 'pivot',
        label: 'Pivot slightly',
        description: 'Differentiate from them',
        effects: [
          { type: 'productivity', value: -20, target: 'all', duration: 480 },
          { type: 'morale', value: 10, target: 'all' },
        ],
      },
      {
        id: 'stay-course',
        label: 'Stay the course',
        description: 'We were here first!',
        effects: [
          { type: 'productivity', value: 10, target: 'all', duration: 240 },
        ],
      },
    ],
  },

  // Neutral events
  {
    id: 'coffee-machine',
    name: 'Coffee Machine Broke ☕',
    description: 'The office coffee machine is broken.',
    icon: '☕',
    category: 'neutral',
    probability: 0.4,
    effects: [
      { type: 'productivity', value: -5, target: 'all', duration: 120 },
    ],
    choices: [
      {
        id: 'buy-new',
        label: 'Buy a fancy new one',
        description: '$500 but everyone\'s happy',
        effects: [
          { type: 'money', value: -500 },
          { type: 'morale', value: 10, target: 'all' },
        ],
        cost: 500,
      },
      {
        id: 'starbucks',
        label: 'Send people to Starbucks',
        description: 'Expense it!',
        effects: [
          { type: 'money', value: -200 },
        ],
        cost: 200,
      },
    ],
  },
  {
    id: 'team-lunch',
    name: 'Team Lunch 🍕',
    description: 'Someone suggested a team lunch.',
    icon: '🍕',
    category: 'neutral',
    probability: 0.35,
    requirements: [{ type: 'employees', operator: '>=', value: 2 }],
    effects: [], // Choices handle effects
    choices: [
      {
        id: 'fancy',
        label: 'Go somewhere fancy',
        description: '$50 per person',
        effects: [
          { type: 'money', value: -500 },
          { type: 'morale', value: 15, target: 'all' },
        ],
        cost: 500,
      },
      {
        id: 'pizza',
        label: 'Order pizza',
        description: 'Classic startup move',
        effects: [
          { type: 'money', value: -100 },
          { type: 'morale', value: 5, target: 'all' },
        ],
        cost: 100,
      },
      {
        id: 'skip',
        label: 'Skip it, we\'re busy',
        description: 'Stay focused',
        effects: [
          { type: 'morale', value: -5, target: 'all' },
        ],
      },
    ],
  },
  {
    id: 'remote-friday',
    name: 'Remote Friday? 🏠',
    description: 'Team wants to work from home on Friday.',
    icon: '🏠',
    category: 'neutral',
    probability: 0.3,
    requirements: [{ type: 'employees', operator: '>=', value: 1 }],
    effects: [], // Choices handle effects
    choices: [
      {
        id: 'allow',
        label: 'Allow it',
        description: 'Happy team!',
        effects: [
          { type: 'morale', value: 10, target: 'all' },
          { type: 'productivity', value: -5, target: 'all', duration: 480 },
        ],
      },
      {
        id: 'deny',
        label: 'Need everyone in office',
        description: 'Important week',
        effects: [
          { type: 'morale', value: -10, target: 'all' },
          { type: 'productivity', value: 5, target: 'all', duration: 480 },
        ],
      },
    ],
  },

  // Crisis events (rare but impactful)
  {
    id: 'key-employee-quit',
    name: 'Key Employee Quitting! 😱',
    description: 'Your best performer is considering leaving!',
    icon: '😱',
    category: 'crisis',
    probability: 0.1,
    requirements: [{ type: 'employees', operator: '>=', value: 3 }],
    effects: [], // Choices handle effects
    choices: [
      {
        id: 'counter-offer',
        label: 'Make a counter offer',
        description: 'Raise their salary 50%',
        effects: [
          { type: 'money', value: -5000 },
          { type: 'morale', value: 20, target: 'random' },
        ],
        cost: 5000,
      },
      {
        id: 'let-go',
        label: 'Wish them well',
        description: 'They might leave',
        effects: [
          { type: 'employee_leave', value: 1, target: 'random' },
          { type: 'morale', value: -15, target: 'all' },
        ],
      },
    ],
  },
  {
    id: 'data-breach',
    name: 'Security Incident! 🔒',
    description: 'A potential security vulnerability was discovered.',
    icon: '🔒',
    category: 'crisis',
    probability: 0.1,
    requirements: [{ type: 'week', operator: '>=', value: 4 }],
    effects: [
      { type: 'task_speed', value: -100, target: 'all', duration: 60 },
    ],
    choices: [
      {
        id: 'security-audit',
        label: 'Full security audit',
        description: 'Expensive but thorough',
        effects: [
          { type: 'money', value: -10000 },
          { type: 'morale', value: 10, target: 'all' },
        ],
        cost: 10000,
      },
      {
        id: 'quick-patch',
        label: 'Quick patch',
        description: 'Fix it and move on',
        effects: [
          { type: 'task_speed', value: -30, target: 'all', duration: 240 },
        ],
      },
    ],
  },
];
