import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Game state schema for Founder Mode
export default defineSchema({
  // Users table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    // Auth provider info
    tokenIdentifier: v.string(),
  })
    .index('by_token', ['tokenIdentifier'])
    .index('by_email', ['email']),

  // Game saves - one per user
  gameSaves: defineTable({
    userId: v.id('users'),
    name: v.string(), // Save slot name
    
    // Game progress
    tick: v.number(),
    money: v.number(),
    runway: v.number(),
    
    // Project
    project: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      idea: v.string(),
      techStack: v.array(v.string()),
      repository: v.optional(v.string()),
      createdAt: v.number(),
    })),
    
    // Stats
    stats: v.object({
      totalRevenue: v.number(),
      totalExpenses: v.number(),
      tasksCompleted: v.number(),
      linesOfCodeGenerated: v.number(),
      commitsCreated: v.number(),
      featuresShipped: v.number(),
    }),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_name', ['userId', 'name']),

  // Employees - separate table for real-time updates
  employees: defineTable({
    gameSaveId: v.id('gameSaves'),
    
    // Employee data
    empId: v.string(), // Client-side UUID
    name: v.string(),
    role: v.union(
      v.literal('engineer'),
      v.literal('designer'),
      v.literal('pm'),
      v.literal('marketer')
    ),
    skillLevel: v.union(
      v.literal('junior'),
      v.literal('mid'),
      v.literal('senior'),
      v.literal('lead')
    ),
    status: v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('blocked'),
      v.literal('on_break')
    ),
    avatarEmoji: v.string(),
    salary: v.number(),
    productivity: v.number(),
    morale: v.number(),
    currentTaskId: v.optional(v.string()),
    hiredAt: v.number(),
  })
    .index('by_game_save', ['gameSaveId'])
    .index('by_emp_id', ['gameSaveId', 'empId']),

  // Tasks - separate table for real-time updates
  tasks: defineTable({
    gameSaveId: v.id('gameSaves'),
    
    // Task data
    taskId: v.string(), // Client-side UUID
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal('feature'),
      v.literal('bug'),
      v.literal('design'),
      v.literal('marketing'),
      v.literal('infrastructure')
    ),
    status: v.union(
      v.literal('backlog'),
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    ),
    assigneeId: v.optional(v.string()),
    estimatedTicks: v.number(),
    progressTicks: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    codeGenerated: v.optional(v.string()),
    filesCreated: v.array(v.string()),
  })
    .index('by_game_save', ['gameSaveId'])
    .index('by_task_id', ['gameSaveId', 'taskId'])
    .index('by_status', ['gameSaveId', 'status']),

  // Activity log
  activityLog: defineTable({
    gameSaveId: v.id('gameSaves'),
    
    tick: v.number(),
    message: v.string(),
    type: v.union(
      v.literal('work'),
      v.literal('hire'),
      v.literal('task'),
      v.literal('event'),
      v.literal('money'),
      v.literal('complete'),
      v.literal('system')
    ),
    employeeId: v.optional(v.string()),
    taskId: v.optional(v.string()),
  })
    .index('by_game_save', ['gameSaveId'])
    .index('by_game_save_tick', ['gameSaveId', 'tick']),
});
