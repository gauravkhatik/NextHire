import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();

    return interviews;
  },
});

export const getMyInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    try {
      // Use the index to query by candidateId
      const interviews = await ctx.db
        .query("interviews")
        .withIndex("by_candidate_id", (q) => q.eq("candidateId", identity.subject))
        .collect();

      // Filter to ensure exact match (handles any edge cases)
      const filteredInterviews = interviews.filter(
        (interview) => interview.candidateId === identity.subject
      );

      return filteredInterviews;
    } catch (error) {
      // Fallback: if index query fails, try a full table scan with filter
      console.error("Error querying interviews by index:", error);
      const allInterviews = await ctx.db.query("interviews").collect();
      return allInterviews.filter(
        (interview) => interview.candidateId === identity.subject
      );
    }
  },
});

export const getInterviewByStreamCallId = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();
  },
});

// Debug query to help identify ID mismatches
export const debugGetMyInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { identity: null, allInterviews: [], myInterviews: [] };

    const allInterviews = await ctx.db.query("interviews").collect();
    const myInterviews = allInterviews.filter(
      (interview) => interview.candidateId === identity.subject
    );

    return {
      identitySubject: identity.subject,
      allInterviews: allInterviews.map((i) => ({
        _id: i._id,
        title: i.title,
        candidateId: i.candidateId,
        matches: i.candidateId === identity.subject,
      })),
      myInterviews: myInterviews.map((i) => ({
        _id: i._id,
        title: i.title,
        candidateId: i.candidateId,
      })),
    };
  },
});

export const createInterview = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Validate required fields
    if (!args.title || args.title.trim() === "") {
      throw new Error("Title is required");
    }
    if (!args.candidateId) {
      throw new Error("Candidate ID is required");
    }
    if (!args.streamCallId) {
      throw new Error("Stream Call ID is required");
    }
    if (!args.interviewerIds || args.interviewerIds.length === 0) {
      throw new Error("At least one interviewer is required");
    }

    try {
      // Convert empty description string to undefined for optional field
      const description = args.description && args.description.trim() !== "" 
        ? args.description.trim() 
        : undefined;

      const interviewId = await ctx.db.insert("interviews", {
        title: args.title.trim(),
        description,
        startTime: args.startTime,
        status: args.status,
        streamCallId: args.streamCallId,
        candidateId: args.candidateId,
        interviewerIds: args.interviewerIds,
      });

      console.log("Interview created successfully:", interviewId);
      return interviewId;
    } catch (error) {
      console.error("Error creating interview:", error);
      throw new Error(`Failed to create interview: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const updateInterviewStatus = mutation({
  args: {
    id: v.id("interviews"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});