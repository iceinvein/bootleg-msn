import { v } from "convex/values";
import {
	internalMutation,
	mutation,
	type QueryCtx,
	query,
} from "./_generated/server";

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
	returns: v.object({
		version: v.string(),
		timestamp: v.number(),
	}),
	handler: async (ctx) => {
		const latestDeployment = await ctx.db
			.query("deploymentInfo")
			.withIndex("by_timestamp")
			.order("desc")
			.first();

		if (!latestDeployment) {
			return { version: "unknown", timestamp: 0 };
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

// Helper to fetch the latest deployment record
async function getLatestDeployment(ctx: QueryCtx) {
	return await ctx.db
		.query("deploymentInfo")
		.withIndex("by_timestamp")
		.order("desc")
		.first();
}

// Robust semantic version comparison
// Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareSemanticVersions(v1: string, v2: string): number {
	// Normalize versions by removing 'v' prefix and handling edge cases
	const normalize = (version: string): string => {
		return version.replace(/^v/, "").trim();
	};

	const version1 = normalize(v1);
	const version2 = normalize(v2);

	// Handle exact matches
	if (version1 === version2) {
		return 0;
	}

	// Split into parts and convert to numbers
	const parts1 = version1.split(".").map((part) => {
		const num = parseInt(part, 10);
		return Number.isNaN(num) ? 0 : num;
	});
	const parts2 = version2.split(".").map((part) => {
		const num = parseInt(part, 10);
		return Number.isNaN(num) ? 0 : num;
	});

	// Compare each part
	const maxLength = Math.max(parts1.length, parts2.length);
	for (let i = 0; i < maxLength; i++) {
		const part1 = parts1[i] || 0;
		const part2 = parts2[i] || 0;

		if (part1 > part2) return 1;
		if (part1 < part2) return -1;
	}

	return 0;
}

export const checkForUpdates = query({
	args: {
		clientVersion: v.string(),
	},
	returns: v.object({
		hasUpdate: v.boolean(),
		latestVersion: v.string(),
		debugInfo: v.string(),
	}),
	handler: async (ctx, args) => {
		try {
			const latestDeployment = await getLatestDeployment(ctx);

			if (!latestDeployment) {
				return {
					hasUpdate: false,
					latestVersion: "unknown",
					debugInfo: "No deployment info found in database",
				};
			}

			const comparisonResult = compareSemanticVersions(
				latestDeployment.version,
				args.clientVersion,
			);

			const hasUpdate = comparisonResult > 0;

			return {
				hasUpdate,
				latestVersion: latestDeployment.version,
				debugInfo: `Compared ${latestDeployment.version} vs ${args.clientVersion} = ${comparisonResult} (${hasUpdate ? "update available" : "up to date"})`,
			};
		} catch (error) {
			// Fail safe - don't show updates if there's an error
			return {
				hasUpdate: false,
				latestVersion: "error",
				debugInfo: `Error checking for updates: ${error}`,
			};
		}
	},
});
