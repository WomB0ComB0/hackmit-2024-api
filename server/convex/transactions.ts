import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createTransaction = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    productCategory: v.string(),
    customerLocation: v.string(),
    accountAgeDays: v.number(),
    transactionDate: v.string(),
    isFraudulent: v.optional(v.boolean()),
    fraudExplanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert('transactions', {
      ...args,
      isFraudulent: args.isFraudulent || false,
      fraudExplanation: args.fraudExplanation || '',
    });
    return transactionId;
  },
});

export const getTransaction = query({
  args: { id: v.id('transactions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id('transactions'),
    amount: v.optional(v.number()),
    productCategory: v.optional(v.string()),
    customerLocation: v.optional(v.string()),
    accountAgeDays: v.optional(v.number()),
    transactionDate: v.optional(v.string()),
    isFraudulent: v.optional(v.boolean()),
    fraudExplanation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    await ctx.db.patch(id, updateFields);
    return await ctx.db.get(id);
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id('transactions') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getUserTransactions = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();
  },
});
