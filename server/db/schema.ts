/**
 * Database Schema - Drizzle ORM
 * 
 * Defines all tables for Founder Mode game persistence.
 */

import { pgTable, text, integer, timestamp, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Users
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  gameSaves: many(gameSaves),
  sessions: many(sessions),
}));

// ============================================
// Sessions (for better-auth)
// ============================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ============================================
// Game Saves
// ============================================

export const gameSaves = pgTable('game_saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  
  // Game state
  tick: integer('tick').notNull().default(0),
  money: integer('money').notNull().default(100000),
  runway: integer('runway').notNull().default(12),
  
  // Project (stored as JSON)
  project: jsonb('project'),
  
  // Stats (stored as JSON)
  stats: jsonb('stats').notNull().default({
    totalRevenue: 0,
    totalExpenses: 0,
    tasksCompleted: 0,
    linesOfCodeGenerated: 0,
    commitsCreated: 0,
    featuresShipped: 0,
  }),
  
  // AI settings (stored as JSON, without sensitive data)
  aiSettings: jsonb('ai_settings'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const gameSavesRelations = relations(gameSaves, ({ one, many }) => ({
  user: one(users, {
    fields: [gameSaves.userId],
    references: [users.id],
  }),
  employees: many(employees),
  tasks: many(tasks),
  activityLogs: many(activityLogs),
}));

// ============================================
// Employees
// ============================================

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameSaveId: uuid('game_save_id').notNull().references(() => gameSaves.id, { onDelete: 'cascade' }),
  
  // Employee data
  empId: varchar('emp_id', { length: 36 }).notNull(), // Client-side UUID
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // engineer, designer, pm, marketer
  skillLevel: varchar('skill_level', { length: 50 }).notNull(), // junior, mid, senior, lead
  status: varchar('status', { length: 50 }).notNull().default('idle'), // idle, working, blocked, on_break
  avatarEmoji: varchar('avatar_emoji', { length: 10 }).notNull(),
  salary: integer('salary').notNull(),
  productivity: integer('productivity').notNull().default(70),
  morale: integer('morale').notNull().default(80),
  currentTaskId: varchar('current_task_id', { length: 36 }),
  hiredAt: integer('hired_at').notNull(), // Game tick
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employeesRelations = relations(employees, ({ one }) => ({
  gameSave: one(gameSaves, {
    fields: [employees.gameSaveId],
    references: [gameSaves.id],
  }),
}));

// ============================================
// Tasks
// ============================================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameSaveId: uuid('game_save_id').notNull().references(() => gameSaves.id, { onDelete: 'cascade' }),
  
  // Task data
  taskId: varchar('task_id', { length: 36 }).notNull(), // Client-side UUID
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull().default(''),
  type: varchar('type', { length: 50 }).notNull(), // feature, bug, design, marketing, infrastructure
  status: varchar('status', { length: 50 }).notNull().default('backlog'), // backlog, todo, in_progress, review, done
  priority: varchar('priority', { length: 50 }).notNull().default('medium'), // low, medium, high, critical
  assigneeId: varchar('assignee_id', { length: 36 }),
  estimatedTicks: integer('estimated_ticks').notNull(),
  progressTicks: integer('progress_ticks').notNull().default(0),
  taskCreatedAt: integer('task_created_at').notNull(), // Game tick
  completedAt: integer('completed_at'),
  codeGenerated: text('code_generated'),
  filesCreated: jsonb('files_created').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  gameSave: one(gameSaves, {
    fields: [tasks.gameSaveId],
    references: [gameSaves.id],
  }),
}));

// ============================================
// Activity Log
// ============================================

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameSaveId: uuid('game_save_id').notNull().references(() => gameSaves.id, { onDelete: 'cascade' }),
  
  tick: integer('tick').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // work, hire, task, event, money, complete, system
  employeeId: varchar('employee_id', { length: 36 }),
  taskId: varchar('task_id', { length: 36 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  gameSave: one(gameSaves, {
    fields: [activityLogs.gameSaveId],
    references: [gameSaves.id],
  }),
}));

// ============================================
// Type exports
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GameSave = typeof gameSaves.$inferSelect;
export type NewGameSave = typeof gameSaves.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
