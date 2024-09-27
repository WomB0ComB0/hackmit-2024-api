import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // Add other user fields as needed
  }).index('by_email', ['email']),

  transactions: defineTable({
    userId: v.id('users'),
    amount: v.number(),
    productCategory: v.string(),
    customerLocation: v.string(),
    accountAgeDays: v.number(),
    transactionDate: v.string(),
    isFraudulent: v.boolean(),
    fraudExplanation: v.string(),
  }).index('by_userId', ['userId']),
});
