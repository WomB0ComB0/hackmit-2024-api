import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const createTransaction = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    productCategory: v.string(),
    customerLocation: v.string(),
    accountAgeDays: v.number(),
    transactionDate: v.string(),
    isFraudulent: v.boolean(),
    fraudExplanation: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log('Attempting to insert transaction:', args);
      const transactionId = await ctx.db.insert('transactions', args);
      console.log('Transaction inserted successfully:', transactionId);
      return transactionId;
    } catch (error) {
      console.error('Error inserting transaction:', error);
      console.error('Transaction data:', args);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

export const storeTempTransaction = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    productCategory: v.string(),
    customerLocation: v.string(),
    accountAgeDays: v.number(),
    transactionDate: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('Storing temporary transaction:', args);
    const tempId = await ctx.db.insert('tempTransactions', { ...args, isFraudulent: false, fraudExplanation: '' });
    console.log('Temporary transaction stored successfully:', tempId);
    return tempId;
  },
});

export const updateTempTransactionWithFraudPrediction = mutation({
  args: {
    tempId: v.id('tempTransactions'),
    isFraudulent: v.boolean(),
    fraudExplanation: v.string(),
  },
  handler: async (ctx, args) => {
    const tempTransaction = await ctx.db.get(args.tempId);
    if (!tempTransaction) {
      throw new Error('Temporary transaction not found');
    }
    await ctx.db.patch(args.tempId, {
      isFraudulent: args.isFraudulent,
      fraudExplanation: args.fraudExplanation,
    });
  },
});

export const updateTempTransactionWithError = mutation({
  args: {
    tempId: v.id('tempTransactions'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tempId, {
      fraudExplanation: args.error,
    });
  },
});

export const finalizeTempTransaction = mutation({
  args: { tempId: v.id('tempTransactions') },
  handler: async (ctx, args) => {
    console.log('Attempting to finalize transaction with tempId:', args.tempId);
    const tempTransaction = await ctx.db.get(args.tempId);
    if (!tempTransaction) {
      console.error('Temporary transaction not found for tempId:', args.tempId);
      throw new Error('Temporary transaction not found');
    }
    console.log('Found temporary transaction:', tempTransaction);
    const { _id, _creationTime, ...transactionData } = tempTransaction;
    console.log('Inserting final transaction with data:', transactionData);
    const transactionId = await ctx.db.insert('transactions', transactionData);
    console.log('Inserted final transaction with ID:', transactionId);
    await ctx.db.delete(args.tempId);
    console.log('Deleted temporary transaction');
    return transactionId;
  },
});

export const getAllTransactions = query({
  handler: async (ctx) => {
    return await ctx.db.query('transactions').collect();
  },
});

export const getTransactionById = query({
  args: { id: v.id('transactions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTransactionsByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect();
  },
});
