import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const updateDeploymentInfo = internalMutation({
	args: {
		version: v.string(),
		timestamp: v.number(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Insert new deployment info
		await ctx.db.insert("deploymentInfo", {
			version: args.version,
			timestamp: args.timestamp,
		});

		// Keep only the last 10 deployment records to avoid clutter
		const allDeployments = await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.collect();

		if (allDeployments.length > 10) {
			const deploymentsToDelete = allDeployments.slice(10);
			for (const deployment of deploymentsToDelete) {
				await ctx.db.delete(deployment._id);
			}
		}
	},
});

// Client-side mutation for development/testing purposes
export const updateDeploymentInfoClient = mutation({
	args: {
		version: v.string(),
		timestamp: v.optional(v.number()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const timestamp = args.timestamp ?? Date.now();

		// Insert new deployment info
		await ctx.db.insert("deploymentInfo", {
			version: args.version,
			timestamp: timestamp,
		});

		// Keep only the last 10 deployment records to avoid clutter
		const allDeployments = await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.collect();

		if (allDeployments.length > 10) {
			const deploymentsToDelete = allDeployments.slice(10);
			for (const deployment of deploymentsToDelete) {
				await ctx.db.delete(deployment._id);
			}
		}
	},
});

export const getCurrentVersion = query({
	args: {},
	returns: v.union(
		v.object({
			version: v.string(),
			timestamp: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const latestDeployment = await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.first();

		if (!latestDeployment) {
			return null;
		}

		return {
			version: latestDeployment.version,
			timestamp: latestDeployment.timestamp,
		};
	},
});

// FUTURE: DEPLOYMENT_ANALYTICS - Deployment history tracking for admin dashboard
export const getDeploymentHistory = query({
	args: {
		limit: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			_id: v.id("deploymentInfo"),
			version: v.string(),
			timestamp: v.number(),
			_creationTime: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 5;

		return await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.take(limit);
	},
});
export const checkForUpdates = query({
	args: {
		clientVersion: v.string(),
		clientTimestamp: v.number(),
	},
	returns: v.union(
		v.object({
			hasUpdate: v.boolean(),
			latestVersion: v.string(),
			latestTimestamp: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const latestDeployment = await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.first();

		if (!latestDeployment) {
			return null;
		}

		// Check if there's a newer version available
		const hasUpdate = latestDeployment.timestamp > args.clientTimestamp;

		return {
			hasUpdate,
			latestVersion: latestDeployment.version,
			latestTimestamp: latestDeployment.timestamp,
		};
	},
});
