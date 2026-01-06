/**
 * Database Schema - Drizzle ORM
 * 
 * Defines all tables for Founder Mode game persistence.
 */

import { pgTable, text, integer, timestamp, jsonb, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// Better Auth Tables (required by better-auth)
// ============================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations for Better Auth tables
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  gameSaves: many(gameSaves),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================
// Game Saves
// ============================================

export const gameSaves = pgTable('game_saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  user: one(user, {
    fields: [gameSaves.userId],
    references: [user.id],
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
  currentTaskId: varchar('current_task_id', { length: 36 }),
  hiredAt: integer('hired_at').notNull(), // Game tick
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  totalTicksWorked: integer('total_ticks_worked').notNull().default(0),
  
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

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type GameSave = typeof gameSaves.$inferSelect;
export type NewGameSave = typeof gameSaves.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
