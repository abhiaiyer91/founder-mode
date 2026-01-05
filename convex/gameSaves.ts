import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all game saves for a user
export const listSaves = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gameSaves')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

// Get a specific game save
export const getSave = query({
  args: { saveId: v.id('gameSaves') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.saveId);
  },
});

// Create a new game save
export const createSave = mutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
    project: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      idea: v.string(),
      techStack: v.array(v.string()),
      repository: v.optional(v.string()),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const saveId = await ctx.db.insert('gameSaves', {
      userId: args.userId,
      name: args.name,
      tick: 0,
      money: 100000,
      runway: 12,
      project: args.project,
      stats: {
        totalRevenue: 0,
        totalExpenses: 0,
        tasksCompleted: 0,
        linesOfCodeGenerated: 0,
        commitsCreated: 0,
        featuresShipped: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    return saveId;
  },
});

// Update game save
export const updateSave = mutation({
  args: {
    saveId: v.id('gameSaves'),
    tick: v.optional(v.number()),
    money: v.optional(v.number()),
    runway: v.optional(v.number()),
    project: v.optional(v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      idea: v.string(),
      techStack: v.array(v.string()),
      repository: v.optional(v.string()),
      createdAt: v.number(),
    })),
    stats: v.optional(v.object({
      totalRevenue: v.number(),
      totalExpenses: v.number(),
      tasksCompleted: v.number(),
      linesOfCodeGenerated: v.number(),
      commitsCreated: v.number(),
      featuresShipped: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { saveId, ...updates } = args;
    
    await ctx.db.patch(saveId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a game save (and all related data)
export const deleteSave = mutation({
  args: { saveId: v.id('gameSaves') },
  handler: async (ctx, args) => {
    // Delete all employees
    const employees = await ctx.db
      .query('employees')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.saveId))
      .collect();
    
    for (const emp of employees) {
      await ctx.db.delete(emp._id);
    }

    // Delete all tasks
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.saveId))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete activity log
    const logs = await ctx.db
      .query('activityLog')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.saveId))
      .collect();
    
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // Delete the save itself
    await ctx.db.delete(args.saveId);
  },
});
