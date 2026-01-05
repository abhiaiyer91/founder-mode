import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all tasks for a game save
export const listTasks = query({
  args: { gameSaveId: v.id('gameSaves') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('tasks')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.gameSaveId))
      .collect();
  },
});

// Get tasks by status
export const listTasksByStatus = query({
  args: { 
    gameSaveId: v.id('gameSaves'),
    status: v.union(
      v.literal('backlog'),
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done')
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('tasks')
      .withIndex('by_status', (q) => 
        q.eq('gameSaveId', args.gameSaveId).eq('status', args.status)
      )
      .collect();
  },
});

// Add a task
export const addTask = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    taskId: v.string(),
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
    estimatedTicks: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('tasks', {
      ...args,
      assigneeId: undefined,
      progressTicks: 0,
      completedAt: undefined,
      codeGenerated: undefined,
      filesCreated: [],
    });
  },
});

// Update a task
export const updateTask = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    taskId: v.string(),
    status: v.optional(v.union(
      v.literal('backlog'),
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done')
    )),
    assigneeId: v.optional(v.string()),
    progressTicks: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    codeGenerated: v.optional(v.string()),
    filesCreated: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { gameSaveId, taskId, ...updates } = args;
    
    const task = await ctx.db
      .query('tasks')
      .withIndex('by_task_id', (q) => 
        q.eq('gameSaveId', gameSaveId).eq('taskId', taskId)
      )
      .first();

    if (task) {
      await ctx.db.patch(task._id, updates);
    }
  },
});

// Batch update tasks (for game tick)
export const batchUpdateTasks = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    updates: v.array(v.object({
      taskId: v.string(),
      status: v.optional(v.union(
        v.literal('backlog'),
        v.literal('todo'),
        v.literal('in_progress'),
        v.literal('review'),
        v.literal('done')
      )),
      progressTicks: v.optional(v.number()),
      completedAt: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const { taskId, ...changes } = update;
      
      const task = await ctx.db
        .query('tasks')
        .withIndex('by_task_id', (q) => 
          q.eq('gameSaveId', args.gameSaveId).eq('taskId', taskId)
        )
        .first();

      if (task) {
        await ctx.db.patch(task._id, changes);
      }
    }
  },
});

// Delete a task
export const deleteTask = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query('tasks')
      .withIndex('by_task_id', (q) => 
        q.eq('gameSaveId', args.gameSaveId).eq('taskId', args.taskId)
      )
      .first();

    if (task) {
      await ctx.db.delete(task._id);
    }
  },
});
