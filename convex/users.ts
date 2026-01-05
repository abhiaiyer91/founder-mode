import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get or create user from auth token
export const getOrCreateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      tokenIdentifier: args.tokenIdentifier,
      imageUrl: args.imageUrl,
    });

    return userId;
  },
});

// Get current user
export const getCurrentUser = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .first();
  },
});
