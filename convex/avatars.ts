import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const setUserAvatar = mutation({
	args: { fileId: v.id("_storage") },
	handler: async (ctx, { fileId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("userAvatars")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, { fileId, updatedAt: Date.now() });
		} else {
			await ctx.db.insert("userAvatars", {
				userId,
				fileId,
				updatedAt: Date.now(),
			});
		}
	},
});

export const clearUserAvatar = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("userAvatars")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existing) await ctx.db.delete(existing._id);
	},
});

export const getManyUserAvatars = query({
	args: { userIds: v.array(v.id("users")) },
	handler: async (ctx, { userIds }) => {
		// Fetch all rows for provided users
		const results: { userId: Id<"users">; url: string | null }[] = [];
		for (const userId of userIds) {
			const row = await ctx.db
				.query("userAvatars")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.unique();
			if (row) {
				const url = await ctx.storage.getUrl(row.fileId);
				results.push({ userId, url });
			} else {
				results.push({ userId, url: null });
			}
		}
		return results;
	},
});

export const setGroupAvatar = mutation({
	args: { groupId: v.id("groups"), fileId: v.id("_storage") },
	handler: async (ctx, { groupId, fileId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		// verify user is group admin or member
		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", groupId).eq("userId", userId),
			)
			.unique();
		if (!membership) throw new Error("Not a member of this group");
		if (membership.role !== "admin")
			throw new Error("Only admins can change group avatar");

		const existing = await ctx.db
			.query("groupAvatars")
			.withIndex("by_group", (q) => q.eq("groupId", groupId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, { fileId, updatedAt: Date.now() });
		} else {
			await ctx.db.insert("groupAvatars", {
				groupId,
				fileId,
				updatedAt: Date.now(),
			});
		}
	},
});

export const clearGroupAvatar = mutation({
	args: { groupId: v.id("groups") },
	handler: async (ctx, { groupId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const membership = await ctx.db
			.query("groupMembers")
			.withIndex("by_group_and_user", (q) =>
				q.eq("groupId", groupId).eq("userId", userId),
			)
			.unique();
		if (!membership) throw new Error("Not a member of this group");
		if (membership.role !== "admin")
			throw new Error("Only admins can change group avatar");

		const existing = await ctx.db
			.query("groupAvatars")
			.withIndex("by_group", (q) => q.eq("groupId", groupId))
			.unique();

		if (existing) await ctx.db.delete(existing._id);
	},
});

export const getManyGroupAvatars = query({
	args: { groupIds: v.array(v.id("groups")) },
	handler: async (ctx, { groupIds }) => {
		const results: { groupId: Id<"groups">; url: string | null }[] = [];
		for (const groupId of groupIds) {
			const row = await ctx.db
				.query("groupAvatars")
				.withIndex("by_group", (q) => q.eq("groupId", groupId))
				.unique();
			if (row) {
				const url = await ctx.storage.getUrl(row.fileId);
				results.push({ groupId, url });
			} else {
				results.push({ groupId, url: null });
			}
		}
		return results;
	},
});
