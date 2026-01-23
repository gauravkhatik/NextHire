import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values"
import { title } from "process";


export default defineSchema({

  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("candidate"), v.literal("interviewer")),
    clerkId: v.string(),

  }).index("by_clerk_id",["clerkId"]),

  interviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
    questionIds: v.optional(v.array(v.id("questions"))), // Questions assigned to this interview
    aptitudeTestId: v.optional(v.id("aptitudeTests")), // Aptitude test assigned to this interview
  })
    .index("by_candidate_id", ["candidateId"])
    .index("by_stream_call_id", ["streamCallId"]),

    comments: defineTable({
    content: v.string(),
    rating: v.number(),
    interviewerId: v.string(),
    interviewId: v.id("interviews"),
  }).index("by_interview_id", ["interviewId"]),

  questions: defineTable({
    title: v.string(),
    description: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    leetcodeUrl: v.optional(v.string()),
    source: v.optional(v.union(v.literal("leetcode"), v.literal("custom"))), // Question source (optional for backward compatibility)
    examples: v.array(v.object({
      input: v.string(),
      output: v.string(),
      explanation: v.optional(v.string()),
    })),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
      java: v.string(),
      cpp: v.optional(v.string()),
    }),
    constraints: v.optional(v.array(v.string())),
    testCases: v.array(v.object({
      input: v.string(),
      expectedOutput: v.string(),
      isHidden: v.optional(v.boolean()),
    })),
    createdBy: v.string(), // interviewer clerkId
    createdAt: v.number(),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_difficulty", ["difficulty"]),

  aptitudeTests: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // in minutes
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctAnswer: v.number(), // index of correct option
      points: v.number(),
    })),
    totalPoints: v.number(),
    createdBy: v.string(), // interviewer clerkId
    createdAt: v.number(),
    isActive: v.boolean(),
    isQuestionSet: v.optional(v.boolean()), // If true, can be assigned during interviews
    assignedCandidates: v.optional(v.array(v.string())), // Array of candidate clerkIds who can take this test
  })
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"]),

  testAttempts: defineTable({
    testId: v.id("aptitudeTests"),
    candidateId: v.string(),
    answers: v.array(v.object({
      questionIndex: v.number(),
      selectedAnswer: v.number(),
      isCorrect: v.boolean(),
    })),
    score: v.number(),
    totalPoints: v.number(),
    percentage: v.number(),
    startedAt: v.number(),
    completedAt: v.number(),
    timeSpent: v.number(), // in seconds
  })
    .index("by_test_id", ["testId"])
    .index("by_candidate_id", ["candidateId"])
    .index("by_test_and_candidate", ["testId", "candidateId"]),

})


