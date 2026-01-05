/**
 * Achievements System - Unlock badges for milestones
 */

export type AchievementCategory = 'founder' | 'team' | 'shipping' | 'money' | 'speed' | 'secret';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number; // 0-100 for progressive achievements
  target?: number; // Target value for progressive
  secret?: boolean; // Hidden until unlocked
}

export interface AchievementTrigger {
  type: 
    | 'task_complete'
    | 'employee_hire'
    | 'money_earned'
    | 'money_spent'
    | 'upgrade_purchase'
    | 'game_time'
    | 'speed_run'
    | 'special';
  value?: number;
  condition?: string;
}

// Default achievements
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Founder achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Start your first project',
    icon: '🚀',
    category: 'founder',
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'the-idea',
    name: 'The Idea',
    description: 'Name your startup',
    icon: '💡',
    category: 'founder',
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'solo-founder',
    name: 'Solo Founder',
    description: 'Complete a task with no employees',
    icon: '🦸',
    category: 'founder',
    rarity: 'rare',
    unlocked: false,
    secret: true,
  },

  // Team achievements
  {
    id: 'first-hire',
    name: 'First Hire',
    description: 'Hire your first employee',
    icon: '👋',
    category: 'team',
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'full-stack-team',
    name: 'Full Stack Team',
    description: 'Have an engineer, designer, PM, and marketer',
    icon: '👥',
    category: 'team',
    rarity: 'uncommon',
    unlocked: false,
  },
  {
    id: 'dream-team',
    name: 'Dream Team',
    description: 'Have 5 employees with 80%+ morale',
    icon: '⭐',
    category: 'team',
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'senior-staff',
    name: 'Senior Staff',
    description: 'Have 3 senior or lead employees',
    icon: '👔',
    category: 'team',
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'army',
    name: 'Army of Builders',
    description: 'Have 10 employees',
    icon: '🏰',
    category: 'team',
    rarity: 'epic',
    unlocked: false,
  },

  // Shipping achievements
  {
    id: 'first-ship',
    name: 'Ship It!',
    description: 'Complete your first task',
    icon: '📦',
    category: 'shipping',
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'bug-squasher',
    name: 'Bug Squasher',
    description: 'Complete 5 bug fixes',
    icon: '🐛',
    category: 'shipping',
    rarity: 'uncommon',
    unlocked: false,
    progress: 0,
    target: 5,
  },
  {
    id: 'feature-factory',
    name: 'Feature Factory',
    description: 'Complete 10 features',
    icon: '✨',
    category: 'shipping',
    rarity: 'uncommon',
    unlocked: false,
    progress: 0,
    target: 10,
  },
  {
    id: 'shipping-machine',
    name: 'Shipping Machine',
    description: 'Complete 50 tasks',
    icon: '🚂',
    category: 'shipping',
    rarity: 'rare',
    unlocked: false,
    progress: 0,
    target: 50,
  },
  {
    id: 'century',
    name: 'Century Club',
    description: 'Complete 100 tasks',
    icon: '💯',
    category: 'shipping',
    rarity: 'epic',
    unlocked: false,
    progress: 0,
    target: 100,
  },
  {
    id: 'mvp',
    name: 'MVP Ready',
    description: 'Reach 50% project completion',
    icon: '🎯',
    category: 'shipping',
    rarity: 'uncommon',
    unlocked: false,
  },
  {
    id: 'launch',
    name: 'Launch Day!',
    description: 'Reach 100% project completion',
    icon: '🎉',
    category: 'shipping',
    rarity: 'epic',
    unlocked: false,
  },

  // Money achievements
  {
    id: 'first-dollar',
    name: 'First Dollar',
    description: 'Earn $1,000',
    icon: '💵',
    category: 'money',
    rarity: 'common',
    unlocked: false,
  },
  {
    id: 'profitable',
    name: 'Profitable',
    description: 'Have $100,000 in the bank',
    icon: '💰',
    category: 'money',
    rarity: 'uncommon',
    unlocked: false,
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    description: 'Have $1,000,000 in the bank',
    icon: '🦄',
    category: 'money',
    rarity: 'legendary',
    unlocked: false,
  },
  {
    id: 'investor',
    name: 'Investor Ready',
    description: 'Purchase 5 upgrades',
    icon: '📈',
    category: 'money',
    rarity: 'uncommon',
    unlocked: false,
    progress: 0,
    target: 5,
  },
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'Never go below $5,000',
    icon: '🥾',
    category: 'money',
    rarity: 'rare',
    unlocked: false,
    secret: true,
  },

  // Speed achievements
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a task in under 30 seconds',
    icon: '⚡',
    category: 'speed',
    rarity: 'rare',
    unlocked: false,
  },
  {
    id: 'turbo-mode',
    name: 'Turbo Mode',
    description: 'Play at 3x speed for 5 minutes',
    icon: '🏎️',
    category: 'speed',
    rarity: 'uncommon',
    unlocked: false,
  },
  {
    id: 'all-nighter',
    name: 'All-Nighter',
    description: 'Play for 1 hour straight',
    icon: '🌙',
    category: 'speed',
    rarity: 'uncommon',
    unlocked: false,
  },
  {
    id: 'marathon',
    name: 'Marathon Session',
    description: 'Reach Week 10',
    icon: '🏃',
    category: 'speed',
    rarity: 'rare',
    unlocked: false,
  },

  // Secret achievements
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Play between midnight and 5am',
    icon: '🦉',
    category: 'secret',
    rarity: 'rare',
    unlocked: false,
    secret: true,
  },
  {
    id: 'easter-egg',
    name: 'Easter Egg',
    description: 'Find the hidden secret',
    icon: '🥚',
    category: 'secret',
    rarity: 'legendary',
    unlocked: false,
    secret: true,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Have all employees at 100% morale',
    icon: '✨',
    category: 'secret',
    rarity: 'legendary',
    unlocked: false,
    secret: true,
  },
];

// Rarity colors
export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};
