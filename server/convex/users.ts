import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const createUser = mutation({
  args: { id: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const userId = await ctx.db.insert('users', {
      id: args.id,
      name: args.name,
      email: args.email,
    });
    return userId;
  },
});

export const updateUser = mutation({
  args: { id: v.union(v.string(), v.id('users')), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { id: args.id });
    if (!user) {
      throw new Error('User not found');
    }
    await ctx.db.patch(user._id, {
      name: args.name,
      email: args.email,
    });
  },
});

export const deleteUser = mutation({
  args: { id: v.union(v.string(), v.id('users')) },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { id: args.id });
    if (!user) {
      throw new Error('User not found');
    }
    await ctx.db.delete(user._id);
  },
});

export const getUser = query({
  args: { id: v.union(v.string(), v.id('users')) },
  handler: async (ctx, args) => {
    if (typeof args.id === 'string') {
      return await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('id'), args.id))
        .first();
    } else {
      return await ctx.db.get(args.id);
    }
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
