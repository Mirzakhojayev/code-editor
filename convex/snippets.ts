import {v} from "convex/values";
import {mutation, query} from "./_generated/server";

export const createSnippet = mutation({
    args: {
        language: v.string(),
        code: v.string(),
        title: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("user is not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_user_id")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const snippetId = await ctx.db.insert("snippets", {
            userId: identity.subject,
            userName: user.name,
            title: args.title,
            language: args.language,
            code: args.code,
        });

        return snippetId;
    },
});

export const deleteSnippet = mutation({
    args: {
        snippetId: v.id("snippets"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const snippet = await ctx.db.get(args.snippetId);
        if (!snippet) throw new Error("Snippet not found");

        if (snippet.userId !== identity.subject) {
            throw new Error("You are not authorized to delete this snippet");
        }

        const comments = await ctx.db
            .query("snippetComments")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();

        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }

        const stars = await ctx.db
            .query("stars")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();

        for (const star of stars) {
            await ctx.db.delete(star._id);
        }

        await ctx.db.delete(args.snippetId);
    },
});

export const starSnippet = mutation({
    args: {
        snippetId: v.id("snippets"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("You are not authenticated");

        const existing = await ctx.db
            .query("stars")
            .withIndex("by_user_id_and_snippet_id")
            .filter(
                (q) =>
                    q.eq(q.field("userId"), identity.sbuject) &&
                    q.eq(q.field("snippetId"), args.snippetId)
            )
            .first();

        if (existing) {
            ctx.db.delete(existing._id);
        } else {
            ctx.db.insert("stars", {
                userId: identity.subject,
                snippetId: args.snippetId,
            });
        }
    },
});

export const addComment = mutation({
    args: {
        snippetId: v.id("snippets"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not Authorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_user_id")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("snippetComments", {
            snippetId: args.snippetId,
            userId: identity.subject,
            userName: user.name,
            content: args.content,
        });
    },
});

export const deleteComment = mutation({
    args: {commentId: v.id("snippetComments")},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        if (comment.userId !== identity.subject) {
            throw new Error("Not authorized to delete this comment");
        }

        await ctx.db.delete(args.commentId);
    },
});

export const getSnippets = query({
    handler: async (ctx) => {
        const snippets = await ctx.db.query("snippets").order("desc").collect();
        return snippets;
    },
});

export const getSnippetById = query({
    args: {snippetId: v.id("snippets")},
    handler: async (ctx, args) => {
        const snippet = await ctx.db.get(args.snippetId);
        if (!snippet) throw new Error("Snippet Not Found");

        return snippet;
    },
});

export const getComments = query({
    args: {snippetId: v.id("snippets")},
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("snippetComments")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .order("desc")
            .collect();

        return comments;
    },
});

export const isStarredSnippet = query({
    args: {
        snippetId: v.id("snippets"),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const star = await ctx.db
            .query("stars")
            .withIndex("by_user_id_and_snippet_id")
            .filter(
                (q) =>
                    q.eq(q.field("userId"), identity.subject) &&
                    q.eq(q.field("snippetId"), args.snippetId)
            )
            .first();

        return !!star;
    },
});

export const getSnippetCount = query({
    args: {snippetId: v.id("snippets")},
    handler: async (ctx, args) => {
        const stars = await ctx.db
            .query("stars")
            .withIndex("by_snippet_id")
            .filter((q) => q.eq(q.field("snippetId"), args.snippetId))
            .collect();

        return stars.length;
    },
});
