import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get recent activity for a game save
export const listActivity = query({
  args: { 
    gameSaveId: v.id('gameSaves'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('activityLog')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.gameSaveId))
      .order('desc');
    
    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.take(100); // Default to last 100 entries
  },
});

// Add activity log entry
export const logActivity = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('activityLog', args);
  },
});

// Clear old activity (keep last N entries)
export const pruneActivity = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    keepCount: v.number(),
  },
  handler: async (ctx, args) => {
    const allLogs = await ctx.db
      .query('activityLog')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.gameSaveId))
      .order('desc')
      .collect();

    // Delete entries beyond the keep count
    const toDelete = allLogs.slice(args.keepCount);
    
    for (const log of toDelete) {
      await ctx.db.delete(log._id);
    }
    
    return toDelete.length;
  },
});
