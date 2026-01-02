import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createQuestion = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    leetcodeUrl: v.optional(v.string()),
    examples: v.array(
      v.object({
        input: v.string(),
        output: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
      java: v.string(),
    }),
    constraints: v.optional(v.array(v.string())),
    testCases: v.array(
      v.object({
        input: v.string(),
        expectedOutput: v.string(),
        isHidden: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Validate required fields
    if (!args.title || args.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (!args.description || args.description.trim() === "") {
      throw new Error("Description is required");
    }
    if (args.testCases.length === 0) {
      throw new Error("At least one test case is required");
    }

    try {
      const questionId = await ctx.db.insert("questions", {
        title: args.title.trim(),
        description: args.description.trim(),
        difficulty: args.difficulty,
        leetcodeUrl: args.leetcodeUrl?.trim() || undefined,
        examples: args.examples,
        starterCode: args.starterCode,
        constraints: args.constraints || [],
        testCases: args.testCases,
        createdBy: identity.subject,
        createdAt: Date.now(),
      });

      console.log("Question created successfully:", questionId);
      return questionId;
    } catch (error) {
      console.error("Error creating question:", error);
      throw new Error(
        `Failed to create question: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export const getAllQuestions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const questions = await ctx.db.query("questions").collect();
    return questions;
  },
});

export const getQuestionsByCreator = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_created_by", (q) => q.eq("createdBy", identity.subject))
      .collect();

    return questions;
  },
});

export const getQuestionById = query({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deleteQuestion = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const question = await ctx.db.get(args.id);
    if (!question) throw new Error("Question not found");

    // Only allow creator to delete
    if (question.createdBy !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own questions");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

