import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createAptitudeTest = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        points: v.number(),
      })
    ),
    isQuestionSet: v.optional(v.boolean()), // If true, can be assigned during interviews
    assignedCandidates: v.optional(v.array(v.string())), // Array of candidate clerkIds
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (!args.title || args.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (args.questions.length === 0) {
      throw new Error("At least one question is required");
    }

    const totalPoints = args.questions.reduce((sum, q) => sum + q.points, 0);

    try {
      const testId = await ctx.db.insert("aptitudeTests", {
        title: args.title.trim(),
        description: args.description?.trim() || undefined,
        duration: args.duration,
        questions: args.questions,
        totalPoints,
        createdBy: identity.subject,
        createdAt: Date.now(),
        isActive: true,
        isQuestionSet: args.isQuestionSet || false,
        assignedCandidates: args.assignedCandidates || [],
      });

      return testId;
    } catch (error) {
      console.error("Error creating aptitude test:", error);
      throw new Error(
        `Failed to create test: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export const getAllAptitudeTests = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tests = await ctx.db.query("aptitudeTests").collect();
    return tests;
  },
});

export const getAptitudeTestsByCreator = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tests = await ctx.db
      .query("aptitudeTests")
      .withIndex("by_created_by", (q) => q.eq("createdBy", identity.subject))
      .collect();

    return tests;
  },
});

export const getActiveAptitudeTests = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const tests = await ctx.db
      .query("aptitudeTests")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter tests based on assigned candidates
    // If a test has assignedCandidates, only show it to those candidates
    // If no assignedCandidates, show it to everyone
    const filteredTests = tests.filter((test) => {
      if (!test.assignedCandidates || test.assignedCandidates.length === 0) {
        return true; // Available to all if no specific candidates assigned
      }
      return test.assignedCandidates.includes(identity.subject);
    });

    return filteredTests;
  },
});

export const getAptitudeTestById = query({
  args: { id: v.id("aptitudeTests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateAptitudeTest = mutation({
  args: {
    id: v.id("aptitudeTests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    questions: v.optional(
      v.array(
        v.object({
          question: v.string(),
          options: v.array(v.string()),
          correctAnswer: v.number(),
          points: v.number(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
    isQuestionSet: v.optional(v.boolean()),
    assignedCandidates: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const test = await ctx.db.get(args.id);
    if (!test) throw new Error("Test not found");

    if (test.createdBy !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own tests");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.description !== undefined) updates.description = args.description?.trim() || undefined;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.isQuestionSet !== undefined) updates.isQuestionSet = args.isQuestionSet;
    if (args.assignedCandidates !== undefined) updates.assignedCandidates = args.assignedCandidates;
    if (args.questions !== undefined) {
      updates.questions = args.questions;
      updates.totalPoints = args.questions.reduce((sum, q) => sum + q.points, 0);
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

export const deleteAptitudeTest = mutation({
  args: { id: v.id("aptitudeTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const test = await ctx.db.get(args.id);
    if (!test) throw new Error("Test not found");

    if (test.createdBy !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own tests");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const submitTestAttempt = mutation({
  args: {
    testId: v.id("aptitudeTests"),
    answers: v.array(
      v.object({
        questionIndex: v.number(),
        selectedAnswer: v.number(),
      })
    ),
    startedAt: v.number(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Calculate score
    let score = 0;
    const answersWithResults = args.answers.map((answer) => {
      const question = test.questions[answer.questionIndex];
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        score += question.points;
      }
      return {
        questionIndex: answer.questionIndex,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
      };
    });

    const percentage = (score / test.totalPoints) * 100;
    const timeSpent = args.completedAt - args.startedAt;

    const attemptId = await ctx.db.insert("testAttempts", {
      testId: args.testId,
      candidateId: identity.subject,
      answers: answersWithResults,
      score,
      totalPoints: test.totalPoints,
      percentage,
      startedAt: args.startedAt,
      completedAt: args.completedAt,
      timeSpent,
    });

    return attemptId;
  },
});

export const getTestAttemptsByCandidate = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const attempts = await ctx.db
      .query("testAttempts")
      .withIndex("by_candidate_id", (q) => q.eq("candidateId", identity.subject))
      .collect();

    return attempts;
  },
});

export const getTestAttemptByTestAndCandidate = query({
  args: { testId: v.id("aptitudeTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const attempt = await ctx.db
      .query("testAttempts")
      .withIndex("by_test_and_candidate", (q) => 
        q.eq("testId", args.testId).eq("candidateId", identity.subject)
      )
      .first();

    return attempt;
  },
});

export const getTestAttemptById = query({
  args: { id: v.id("testAttempts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTestAttemptsByTest = query({
  args: { testId: v.id("aptitudeTests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Only test creator can see all attempts
    if (test.createdBy !== identity.subject) {
      throw new Error("Unauthorized: Only test creator can view attempts");
    }

    const attempts = await ctx.db
      .query("testAttempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .collect();

    return attempts;
  },
});

