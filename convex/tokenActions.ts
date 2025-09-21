"use node";

import { randomBytes } from "node:crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateSecureToken = action({
	args: {},
	returns: v.string(),
	handler: async () => {
		return randomBytes(32).toString("hex");
	},
});
