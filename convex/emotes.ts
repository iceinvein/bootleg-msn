import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, logUserActivity } from "./utils";
import { consumeEmoteValidator, sendEmoteValidator } from "./validators";

// Send a full-screen emote (e.g., screen crack) to another user
export const sendEmote = mutation({
	args: sendEmoteValidator,
	returns: v.union(v.id("emotes"), v.null()),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// For now, only allow direct emotes (no groups yet)
		if (args.conversationType !== "direct") {
			throw new Error("Only direct emotes are supported");
		}

		const emoteId = await ctx.db.insert("emotes", {
			fromUserId: user._id,
			toUserId: args.toUserId,
			emoteType: args.emoteType,
			conversationId: args.conversationId,
			conversationType: args.conversationType,
			consumed: false,
			createdAt: Date.now(),
		});

		await logUserActivity(
			ctx,
			user._id,
			"send_emote",
			`Sent ${args.emoteType} emote`,
			{
				contactId: args.toUserId as unknown as string,
				feature: "emotes",
			},
		);

		return emoteId;
	},
});

// Get latest pending (unconsumed) emote for a direct chat with otherUserId
export const getPendingEmoteForDirectChat = query({
	args: { otherUserId: v.id("users") },
	returns: v.union(
		v.object({
			_id: v.id("emotes"),
			fromUserId: v.id("users"),
			toUserId: v.id("users"),
			emoteType: v.string(),
			createdAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const pending = await ctx.db
			.query("emotes")
			.filter((q) =>
				q.and(
					q.eq(q.field("toUserId"), user._id),
					q.eq(q.field("fromUserId"), args.otherUserId),
					q.eq(q.field("consumed"), false),
					q.eq(q.field("conversationType"), "direct"),
				),
			)
			.order("desc")
			.first();

		if (!pending) return null;

		return {
			_id: pending._id,
			fromUserId: pending.fromUserId,
			toUserId: pending.toUserId,
			emoteType: pending.emoteType,
			createdAt: pending.createdAt,
		} as const;
	},
});

// Mark an emote as consumed (only recipient can consume)
export const consumeEmote = mutation({
	args: consumeEmoteValidator,
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		const emote = await ctx.db.get(args.emoteId);
		if (!emote) throw new Error("Emote not found");
		if (emote.toUserId !== user._id)
			throw new Error("Not authorized to consume emote");
		if (emote.consumed) return true;

		await ctx.db.patch(args.emoteId, {
			consumed: true,
			consumedAt: Date.now(),
		});
		return true;
	},
});
