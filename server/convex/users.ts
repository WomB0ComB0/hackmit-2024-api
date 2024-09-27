import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createUser = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
    });
    return userId;
  },
});

export const updateUser = mutation({
  args: { id: v.id('users'), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      email: args.email,
    });
  },
});
// jh7f62ac553yk7v6mtzfkqsk7971k63f
export const deleteUser = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getUser = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});
