import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get all employees for a game save
export const listEmployees = query({
  args: { gameSaveId: v.id('gameSaves') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('employees')
      .withIndex('by_game_save', (q) => q.eq('gameSaveId', args.gameSaveId))
      .collect();
  },
});

// Add an employee
export const addEmployee = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    empId: v.string(),
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
    avatarEmoji: v.string(),
    salary: v.number(),
    productivity: v.number(),
    morale: v.number(),
    hiredAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('employees', {
      ...args,
      status: 'idle',
      currentTaskId: undefined,
    });
  },
});

// Update an employee
export const updateEmployee = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    empId: v.string(),
    status: v.optional(v.union(
      v.literal('idle'),
      v.literal('working'),
      v.literal('blocked'),
      v.literal('on_break')
    )),
    productivity: v.optional(v.number()),
    morale: v.optional(v.number()),
    currentTaskId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { gameSaveId, empId, ...updates } = args;
    
    const employee = await ctx.db
      .query('employees')
      .withIndex('by_emp_id', (q) => 
        q.eq('gameSaveId', gameSaveId).eq('empId', empId)
      )
      .first();

    if (employee) {
      await ctx.db.patch(employee._id, updates);
    }
  },
});

// Remove an employee
export const removeEmployee = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    empId: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query('employees')
      .withIndex('by_emp_id', (q) => 
        q.eq('gameSaveId', args.gameSaveId).eq('empId', args.empId)
      )
      .first();

    if (employee) {
      await ctx.db.delete(employee._id);
    }
  },
});

// Batch update employees (for game tick)
export const batchUpdateEmployees = mutation({
  args: {
    gameSaveId: v.id('gameSaves'),
    updates: v.array(v.object({
      empId: v.string(),
      status: v.optional(v.union(
        v.literal('idle'),
        v.literal('working'),
        v.literal('blocked'),
        v.literal('on_break')
      )),
      productivity: v.optional(v.number()),
      morale: v.optional(v.number()),
      currentTaskId: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const { empId, ...changes } = update;
      
      const employee = await ctx.db
        .query('employees')
        .withIndex('by_emp_id', (q) => 
          q.eq('gameSaveId', args.gameSaveId).eq('empId', empId)
        )
        .first();

      if (employee) {
        await ctx.db.patch(employee._id, changes);
      }
    }
  },
});
