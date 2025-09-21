import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { SignJWT } from "jose";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";

async function makePushJWT(claims: { scope: "send_push"; uid?: string }) {
	const secretStr = process.env.FUNCTION_JWT_SECRET || "";
	if (!secretStr) throw new Error("FUNCTION_JWT_SECRET not set");
	const secret = new TextEncoder().encode(secretStr);
	return await new SignJWT(claims)
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuer(process.env.CONVEX_SITE_URL ?? "convex")
		.setAudience("netlify:function:send-push")
		.setIssuedAt()
		.setExpirationTime("60s")
		.sign(secret);
}

// Queries used by actions (since actions cannot access ctx.db directly)
export const getUserSimple = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const u = await ctx.db.get(args.userId);
		return u ? { name: u.name ?? null, email: u.email ?? null } : null;
	},
});

export const getGroupSimple = query({
	args: { groupId: v.id("groups") },
	handler: async (ctx, args) => {
		const g = await ctx.db.get(args.groupId);
		return g ? { name: g.name ?? null } : null;
	},
});

export const listGroupMemberIds = query({
	args: { groupId: v.id("groups") },
	handler: async (ctx, args) => {
		const members = await ctx.db
			.query("groupMembers")
			.withIndex("by_group", (q) => q.eq("groupId", args.groupId))
			.collect();
		return members.map((m) => m.userId);
	},
});

export const listSubscriptionsByUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const subs = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();
		return subs.map((s) => ({
			endpoint: s.endpoint,
			p256dh: s.p256dh,
			auth: s.auth,
		}));
	},
});

export const upsertSubscription = mutation({
	args: {
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error("Not authenticated");

		const existing = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();

		if (existing) {
			// Only allow updating if the subscription belongs to the current user
			if (existing.userId !== userId) {
				throw new Error("Cannot update subscription belonging to another user");
			}
			await ctx.db.patch(existing._id, {
				p256dh: args.p256dh,
				auth: args.auth,
			});
			return existing._id;
		}

		return await ctx.db.insert("pushSubscriptions", {
			userId,
			endpoint: args.endpoint,
			p256dh: args.p256dh,
			auth: args.auth,
			createdAt: Date.now(),
		});
	},
});

export const notifyNewGroupMessage = action({
	args: {
		senderId: v.id("users"),
		groupId: v.id("groups"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const site = process.env.CONVEX_SITE_URL;
		if (!site) throw new Error("CONVEX_SITE_URL not set");

		// Load sender + group for display via queries
		const senderInfo = await ctx.runQuery(api.push.getUserSimple, {
			userId: args.senderId,
		});
		const senderName = (senderInfo?.name || senderInfo?.email) ?? "Someone";
		const groupInfo = await ctx.runQuery(api.push.getGroupSimple, {
			groupId: args.groupId,
		});
		const groupName = groupInfo?.name ?? "Group";

		// Load all group member ids and exclude sender
		const memberIds = (await ctx.runQuery(api.push.listGroupMemberIds, {
			groupId: args.groupId,
		})) as Id<"users">[];
		const recipientIds = memberIds.filter((uid) => uid !== args.senderId);

		if (!recipientIds.length) return;

		const payload = {
			title: `${groupName}: ${senderName}`,
			body: args.content.slice(0, 160),
			data: {
				action: "openChat",
				chatId: args.groupId,
				senderId: args.senderId,
			},
		};

		// For each recipient, send to all their subscriptions
		for (const uid of recipientIds) {
			const subs = (await ctx.runQuery(api.push.listSubscriptionsByUser, {
				userId: uid,
			})) as Array<{ endpoint: string; p256dh: string; auth: string }>;
			if (!subs.length) continue;

			// Deduplicate by endpoint to avoid duplicate sends
			const uniq = new Map<
				string,
				{ endpoint: string; p256dh: string; auth: string }
			>();
			for (const s of subs) if (!uniq.has(s.endpoint)) uniq.set(s.endpoint, s);

			const jwt = await makePushJWT({ scope: "send_push", uid: args.senderId });
			await Promise.all(
				Array.from(uniq.values()).map(async (s) => {
					const subscription = {
						endpoint: s.endpoint,
						keys: { p256dh: s.p256dh, auth: s.auth },
					};
					try {
						await fetch(`${site}/.netlify/functions/send-push`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${jwt}`,
							},
							body: JSON.stringify({ subscription, payload }),
						});
					} catch (e) {
						console.error("Failed to send group push:", e);
					}
				}),
			);
		}
	},
});

export const notifyNewDirectMessage = action({
	args: {
		senderId: v.id("users"),
		receiverId: v.id("users"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const site = process.env.CONVEX_SITE_URL;
		if (!site) throw new Error("CONVEX_SITE_URL not set");

		// Load sender for display name via query
		const senderInfo = await ctx.runQuery(api.push.getUserSimple, {
			userId: args.senderId,
		});
		const senderName = (senderInfo?.name || senderInfo?.email) ?? "Someone";

		// Find receiver's subscriptions via query
		const subs = (await ctx.runQuery(api.push.listSubscriptionsByUser, {
			userId: args.receiverId,
		})) as Array<{ endpoint: string; p256dh: string; auth: string }>;

		if (!subs.length) return;

		// Deduplicate by endpoint to avoid duplicate sends to same device
		const uniq = new Map<
			string,
			{ endpoint: string; p256dh: string; auth: string }
		>();
		for (const s of subs) if (!uniq.has(s.endpoint)) uniq.set(s.endpoint, s);

		const payload = {
			title: `New message from ${senderName}`,
			body: args.content.slice(0, 160),
			data: {
				action: "openChat",
				chatId: args.senderId,
				senderId: args.senderId,
			},
		};

		const jwt = await makePushJWT({ scope: "send_push", uid: args.senderId });
		await Promise.all(
			Array.from(uniq.values()).map(async (s) => {
				const subscription = {
					endpoint: s.endpoint,
					keys: { p256dh: s.p256dh, auth: s.auth },
				};
				try {
					await fetch(`${site}/.netlify/functions/send-push`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${jwt}`,
						},
						body: JSON.stringify({ subscription, payload }),
					});
				} catch (e) {
					console.error("Failed to send push:", e);
				}
			}),
		);
	},
});
