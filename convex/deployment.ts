import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Store the current deployment version/timestamp
export const getDeploymentInfo = query({
	args: {},
	handler: async (ctx) => {
		// Get the latest deployment info from the database
		const deploymentInfo = await ctx.db
			.query("deploymentInfo")
			.order("desc")
			.first();

		return (
			deploymentInfo || {
				version: "1.0.0",
				timestamp: Date.now(),
				_id: "" as Id<"deploymentInfo">,
				_creationTime: Date.now(),
			}
		);
	},
});

// Update deployment info when a new deployment happens
export const updateDeploymentInfo = mutation({
	args: {
		version: v.string(),
	},
	handler: async (ctx, args) => {
		// Insert new deployment info
		const deploymentId = await ctx.db.insert("deploymentInfo", {
			version: args.version,
			timestamp: Date.now(),
		});

		return deploymentId;
	},
});

// Check if client version is outdated
export const checkForUpdates = query({
	args: {
		clientVersion: v.string(),
		clientTimestamp: v.number(),
	},
	handler: async (ctx, args) => {
		const latestDeployment = await ctx.db
			.query("deploymentInfo")
			.order("desc")
			.first();

		if (!latestDeployment) {
			return { hasUpdate: false };
		}

		// Check if there's a newer deployment
		const hasUpdate = latestDeployment.timestamp > args.clientTimestamp;

		return {
			hasUpdate,
			latestVersion: latestDeployment.version,
			latestTimestamp: latestDeployment.timestamp,
		};
	},
});
