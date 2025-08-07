import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
	getCurrentUser,
	logUserActivity,
	sanitizeCSS,
	validateHexColor,
} from "./utils";
import {
	createThemeValidator,
	fontSizeValidator,
	messageStyleValidator,
	updateThemeValidator,
} from "./validators";

// Create a new theme
export const createTheme = mutation({
	args: createThemeValidator,
	returns: v.id("userThemes"),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		// Validate colors
		if (!validateHexColor(args.primaryColor)) {
			throw new Error("Invalid primary color format");
		}
		if (!validateHexColor(args.accentColor)) {
			throw new Error("Invalid accent color format");
		}
		if (args.backgroundColor && !validateHexColor(args.backgroundColor)) {
			throw new Error("Invalid background color format");
		}

		// Validate opacity
		if (args.backgroundOpacity < 0 || args.backgroundOpacity > 1) {
			throw new Error("Background opacity must be between 0 and 1");
		}

		// Sanitize custom CSS
		const sanitizedCSS = args.customCSS
			? sanitizeCSS(args.customCSS)
			: undefined;

		// If this is set as default, unset other default themes
		if (args.isDefault) {
			const existingDefaults = await ctx.db
				.query("userThemes")
				.withIndex("by_user_and_default", (q) =>
					q.eq("userId", user._id).eq("isDefault", true),
				)
				.collect();

			for (const theme of existingDefaults) {
				await ctx.db.patch(theme._id, { isDefault: false });
			}
		}

		const now = Date.now();
		const themeId = await ctx.db.insert("userThemes", {
			userId: user._id,
			themeName: args.themeName,
			primaryColor: args.primaryColor,
			accentColor: args.accentColor,
			backgroundColor: args.backgroundColor,
			backgroundImage: args.backgroundImage,
			backgroundOpacity: args.backgroundOpacity,
			messageStyle: args.messageStyle,
			fontFamily: args.fontFamily,
			fontSize: args.fontSize,
			customCSS: sanitizedCSS,
			isDefault: args.isDefault ?? false,
			isPublic: args.isPublic ?? false,
			createdAt: now,
			updatedAt: now,
		});

		await logUserActivity(
			ctx,
			user._id,
			"create_theme",
			`Created theme: ${args.themeName}`,
		);

		return themeId;
	},
});

// Get user's themes
export const getUserThemes = query({
	args: {},
	returns: v.array(
		v.object({
			_id: v.id("userThemes"),
			themeName: v.string(),
			primaryColor: v.string(),
			accentColor: v.string(),
			backgroundColor: v.optional(v.string()),
			backgroundImage: v.optional(v.id("_storage")),
			backgroundOpacity: v.number(),
			messageStyle: messageStyleValidator,
			fontFamily: v.optional(v.string()),
			fontSize: fontSizeValidator,
			customCSS: v.optional(v.string()),
			isDefault: v.boolean(),
			isPublic: v.boolean(),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		return await ctx.db
			.query("userThemes")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();
	},
});

// Get user's default theme
export const getDefaultTheme = query({
	args: {},
	returns: v.union(
		v.object({
			_id: v.id("userThemes"),
			themeName: v.string(),
			primaryColor: v.string(),
			accentColor: v.string(),
			backgroundColor: v.optional(v.string()),
			backgroundImage: v.optional(v.id("_storage")),
			backgroundOpacity: v.number(),
			messageStyle: messageStyleValidator,
			fontFamily: v.optional(v.string()),
			fontSize: fontSizeValidator,
			customCSS: v.optional(v.string()),
			isDefault: v.boolean(),
			isPublic: v.boolean(),
			createdAt: v.number(),
			updatedAt: v.number(),
		}),
		v.null(),
	),
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);

		return await ctx.db
			.query("userThemes")
			.withIndex("by_user_and_default", (q) =>
				q.eq("userId", user._id).eq("isDefault", true),
			)
			.unique();
	},
});

// Update a theme
export const updateTheme = mutation({
	args: updateThemeValidator,
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const theme = await ctx.db.get(args.themeId);
		if (!theme) {
			throw new Error("Theme not found");
		}

		if (theme.userId !== user._id) {
			throw new Error("Not authorized to update this theme");
		}

		// Validate colors if provided
		if (args.primaryColor && !validateHexColor(args.primaryColor)) {
			throw new Error("Invalid primary color format");
		}
		if (args.accentColor && !validateHexColor(args.accentColor)) {
			throw new Error("Invalid accent color format");
		}
		if (args.backgroundColor && !validateHexColor(args.backgroundColor)) {
			throw new Error("Invalid background color format");
		}

		// Validate opacity if provided
		if (
			args.backgroundOpacity !== undefined &&
			(args.backgroundOpacity < 0 || args.backgroundOpacity > 1)
		) {
			throw new Error("Background opacity must be between 0 and 1");
		}

		// If this is being set as default, unset other default themes
		if (args.isDefault) {
			const existingDefaults = await ctx.db
				.query("userThemes")
				.withIndex("by_user_and_default", (q) =>
					q.eq("userId", user._id).eq("isDefault", true),
				)
				.collect();

			for (const defaultTheme of existingDefaults) {
				if (defaultTheme._id !== args.themeId) {
					await ctx.db.patch(defaultTheme._id, { isDefault: false });
				}
			}
		}

		// Build updates object
		const updates: Partial<{
			themeName: string;
			primaryColor: string;
			accentColor: string;
			backgroundColor: string;
			backgroundImage: Id<"_storage">;
			backgroundOpacity: number;
			messageStyle: "bubbles" | "classic" | "minimal";
			fontFamily: string;
			fontSize: "small" | "medium" | "large";
			customCSS: string;
			isDefault: boolean;
			isPublic: boolean;
			updatedAt: number;
		}> = { updatedAt: Date.now() };

		if (args.themeName !== undefined) updates.themeName = args.themeName;
		if (args.primaryColor !== undefined)
			updates.primaryColor = args.primaryColor;
		if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
		if (args.backgroundColor !== undefined)
			updates.backgroundColor = args.backgroundColor;
		if (args.backgroundImage !== undefined)
			updates.backgroundImage = args.backgroundImage;
		if (args.backgroundOpacity !== undefined)
			updates.backgroundOpacity = args.backgroundOpacity;
		if (args.messageStyle !== undefined)
			updates.messageStyle = args.messageStyle;
		if (args.fontFamily !== undefined) updates.fontFamily = args.fontFamily;
		if (args.fontSize !== undefined) updates.fontSize = args.fontSize;
		if (args.customCSS !== undefined)
			updates.customCSS = sanitizeCSS(args.customCSS);
		if (args.isDefault !== undefined) updates.isDefault = args.isDefault;
		if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

		await ctx.db.patch(args.themeId, updates);

		await logUserActivity(
			ctx,
			user._id,
			"update_theme",
			`Updated theme: ${theme.themeName}`,
		);
	},
});

// Delete a theme
export const deleteTheme = mutation({
	args: { themeId: v.id("userThemes") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const theme = await ctx.db.get(args.themeId);
		if (!theme) {
			throw new Error("Theme not found");
		}

		if (theme.userId !== user._id) {
			throw new Error("Not authorized to delete this theme");
		}

		if (theme.isDefault) {
			throw new Error("Cannot delete the default theme");
		}

		await ctx.db.delete(args.themeId);

		await logUserActivity(
			ctx,
			user._id,
			"delete_theme",
			`Deleted theme: ${theme.themeName}`,
		);
	},
});

// Set theme as default
export const setDefaultTheme = mutation({
	args: { themeId: v.id("userThemes") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);

		const theme = await ctx.db.get(args.themeId);
		if (!theme) {
			throw new Error("Theme not found");
		}

		if (theme.userId !== user._id) {
			throw new Error("Not authorized to modify this theme");
		}

		// Unset other default themes
		const existingDefaults = await ctx.db
			.query("userThemes")
			.withIndex("by_user_and_default", (q) =>
				q.eq("userId", user._id).eq("isDefault", true),
			)
			.collect();

		for (const defaultTheme of existingDefaults) {
			await ctx.db.patch(defaultTheme._id, { isDefault: false });
		}

		// Set this theme as default
		await ctx.db.patch(args.themeId, {
			isDefault: true,
			updatedAt: Date.now(),
		});

		await logUserActivity(
			ctx,
			user._id,
			"set_default_theme",
			`Set default theme: ${theme.themeName}`,
		);
	},
});
