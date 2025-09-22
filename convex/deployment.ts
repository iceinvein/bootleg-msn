import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
	action,
	internalMutation,
	internalQuery,
	query,
} from "./_generated/server";

// ===== Build-based deployment tracking =====

export const beginDeployment = internalMutation({
	args: {
		buildId: v.string(),
		version: v.optional(v.string()),
		commit: v.optional(v.string()),
		channel: v.string(),
		timestamp: v.optional(v.number()),
		forceDeployment: v.optional(v.boolean()),
	},
	handler: async (ctx, a) => {
		await ctx.db.insert("deploymentReleases", {
			buildId: a.buildId,
			version: a.version,
			commit: a.commit,
			channel: a.channel,
			status: "publishing",
			timestamp: a.timestamp ?? Date.now(),
			forceDeployment: a.forceDeployment ?? false,
		});
	},
});

export const internalLatestReleaseForChannel = internalQuery({
	args: { channel: v.string() },
	handler: async (ctx, a) => {
		return await ctx.db
			.query("deploymentReleases")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", a.channel))
			.order("desc")
			.first();
	},
});

export const internalMarkReleaseLive = internalMutation({
	args: { id: v.id("deploymentReleases") },
	handler: async (ctx, a) => {
		await ctx.db.patch(a.id, { status: "live" });
	},
});

// Helper mutation for verifyAndPublish action
export const markReleaseAsLive = internalMutation({
	args: { buildId: v.string(), channel: v.string() },
	returns: v.boolean(),
	handler: async (ctx, a) => {
		const latest = await ctx.db
			.query("deploymentReleases")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", a.channel))
			.order("desc")
			.first();

		if (latest && latest.buildId === a.buildId) {
			await ctx.db.patch(latest._id, { status: "live" });
			return true;
		}
		return false;
	},
});

export const verifyAndPublish = action({
	args: {
		buildId: v.string(),
		channel: v.string(),
		buildJsonUrl: v.string(), // e.g., https://site/build.json
		timeoutMs: v.optional(v.number()),
		intervalMs: v.optional(v.number()),
	},
	handler: async (ctx, a) => {
		const timeout = a.timeoutMs ?? 10 * 60 * 1000; // 10 minutes to accommodate Netlify build
		const interval = a.intervalMs ?? 5000;
		const start = Date.now();

		async function fetchRemoteBuildId(): Promise<string | null> {
			try {
				const res = await fetch(a.buildJsonUrl, {
					cache: "no-store",
					headers: { "cache-control": "no-store" },
				});
				if (!res.ok) return null;
				const j = await res.json();
				return typeof j?.buildId === "string" ? j.buildId : null;
			} catch {
				return null;
			}
		}

		while (Date.now() - start < timeout) {
			const remote = await fetchRemoteBuildId();
			if (remote === a.buildId) {
				// Build verified - mark as live
				console.log(`Build ${a.buildId} verified for channel ${a.channel}`);
				const marked = await ctx.runMutation(
					internal.deployment.markReleaseAsLive,
					{ buildId: a.buildId, channel: a.channel },
				);
				if (marked) {
					console.log(
						`Build ${a.buildId} marked as live on channel ${a.channel}`,
					);
					return { ok: true } as const;
				} else {
					console.error(`Failed to mark build ${a.buildId} as live`);
					return { ok: false as const, error: "failed_to_mark_live" };
				}
			}
			await new Promise((r) => setTimeout(r, interval));
		}

		// Timeout - but still try to mark as live (deployment might be working even if verification failed)
		console.log(
			`Verification timed out for build ${a.buildId}, but marking as live anyway`,
		);
		const marked = await ctx.runMutation(
			internal.deployment.markReleaseAsLive,
			{ buildId: a.buildId, channel: a.channel },
		);
		if (marked) {
			console.log(
				`Build ${a.buildId} marked as live on channel ${a.channel} (after timeout)`,
			);
			return { ok: true, warning: "verification_timeout" } as const;
		} else {
			console.error(`Failed to mark build ${a.buildId} as live after timeout`);
			return { ok: false as const, error: "timeout_and_failed_to_mark_live" };
		}
	},
});

export const checkForUpdatesByBuild = query({
	args: { clientBuildId: v.string(), channel: v.string() },
	returns: v.object({
		hasUpdate: v.boolean(),
		latestBuildId: v.string(),
		version: v.optional(v.string()),
		status: v.string(),
		debugInfo: v.string(),
		forceDeployment: v.optional(v.boolean()),
	}),
	handler: async (ctx, a) => {
		const latest = await ctx.db
			.query("deploymentReleases")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", a.channel))
			.order("desc")
			.first();

		if (!latest) {
			return {
				hasUpdate: false,
				latestBuildId: "unknown",
				version: "unknown",
				status: "none",
				debugInfo: "No releases",
				forceDeployment: false,
			};
		}

		const hasUpdate =
			latest.status === "live" && latest.buildId !== a.clientBuildId;
		return {
			hasUpdate,
			latestBuildId: latest.buildId,
			version: latest.version,
			status: latest.status,
			debugInfo: `server=${latest.buildId} client=${a.clientBuildId} status=${latest.status}`,
			forceDeployment: latest.forceDeployment,
		};
	},
});

// ===== Force update policy =====
export const setAppPolicy = internalMutation({
	args: {
		channel: v.string(),
		minSupportedTimestamp: v.number(),
		forceMessage: v.optional(v.string()),
		updatedAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("appPolicies", {
			channel: args.channel,
			minSupportedTimestamp: args.minSupportedTimestamp,
			forceMessage: args.forceMessage,
			updatedAt: args.updatedAt ?? Date.now(),
		});
	},
});

export const getLatestAppPolicy = query({
	args: { channel: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("appPolicies")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", args.channel))
			.order("desc")
			.first();
	},
});

export const checkForUpdatesV2 = query({
	args: {
		clientBuildTimestamp: v.number(), // ms since epoch
		channel: v.string(),
	},
	returns: v.object({
		mustUpdate: v.boolean(),
		forceMessage: v.optional(v.string()),
		debugInfo: v.string(),
	}),
	handler: async (ctx, a) => {
		const policy = await ctx.db
			.query("appPolicies")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", a.channel))
			.order("desc")
			.first();

		const mustUpdate = !!(
			policy && a.clientBuildTimestamp < policy.minSupportedTimestamp
		);

		return {
			mustUpdate,
			forceMessage: policy?.forceMessage,
			debugInfo: `minTs=${policy?.minSupportedTimestamp ?? "n/a"} clientTs=${a.clientBuildTimestamp}`,
		};
	},
});

// Admin query for listing releases
export const listReleases = query({
	args: {
		channel: v.string(),
		limit: v.optional(v.number()),
		status: v.optional(
			v.array(
				v.union(
					v.literal("publishing"),
					v.literal("live"),
					v.literal("rolled_back"),
				),
			),
		),
	},
	returns: v.array(
		v.object({
			_id: v.id("deploymentReleases"),
			buildId: v.string(),
			version: v.optional(v.string()),
			commit: v.optional(v.string()),
			channel: v.string(),
			status: v.union(
				v.literal("publishing"),
				v.literal("live"),
				v.literal("rolled_back"),
			),
			timestamp: v.number(),
			_creationTime: v.number(),
			forceDeployment: v.optional(v.boolean()),
		}),
	),
	handler: async (ctx, args) => {
		const query = ctx.db
			.query("deploymentReleases")
			.withIndex("by_channel_and_time", (q) => q.eq("channel", args.channel))
			.order("desc");

		const results = await query.take(args.limit ?? 10);

		// Filter by status if provided
		if (args.status && args.status.length > 0) {
			const statusFilter = args.status;
			return results.filter((release) => statusFilter.includes(release.status));
		}

		return results;
	},
});
