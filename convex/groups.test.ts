import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("Groups Database Operations", () => {
	describe("createGroup", () => {
		it("should create a group successfully", async () => {
			const t = convexTest(schema, modules);

			// Create test users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create contacts first (required for group membership)
			await t.run(async (ctx) => {
				await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user2Id,
					status: "accepted",
				});
			});

			// Create group
			const groupId = await t.withIdentity({ subject: user1Id }).mutation(api.groups.createGroup, {
				name: "Test Group",
				description: "A test group",
				isPrivate: false,
				memberIds: [user2Id],
			});

			expect(groupId).toBeTruthy();

			// Verify group was created
			const group = await t.run(async (ctx) => {
				return await ctx.db.get(groupId);
			});

			expect(group).toBeTruthy();
			expect(group?.name).toBe("Test Group");
			expect(group?.description).toBe("A test group");
			expect(group?.createdBy).toBe(user1Id);
			expect(group?.isPrivate).toBe(false);
			expect(group?.memberCount).toBe(2);

			// Verify group members were created
			const members = await t.run(async (ctx) => {
				return await ctx.db
					.query("groupMembers")
					.withIndex("by_group", (q) => q.eq("groupId", groupId))
					.collect();
			});

			expect(members).toHaveLength(2);
			
			// Check creator is admin
			const creatorMember = members.find(m => m.userId === user1Id);
			expect(creatorMember?.role).toBe("admin");
			
			// Check other member is member
			const otherMember = members.find(m => m.userId === user2Id);
			expect(otherMember?.role).toBe("member");

			// Verify system message was created
			const messages = await t.run(async (ctx) => {
				return await ctx.db
					.query("messages")
					.filter((q) => q.eq(q.field("groupId"), groupId))
					.collect();
			});

			expect(messages).toHaveLength(1);
			expect(messages[0].messageType).toBe("system");
			expect(messages[0].content).toBe("Group created");
		});

		it("should throw error when not authenticated", async () => {
			const t = convexTest(schema, modules);

			await expect(
				t.mutation(api.groups.createGroup, {
					name: "Test Group",
					isPrivate: false,
					memberIds: [],
				})
			).rejects.toThrow("Not authenticated");
		});
	});

	describe("addGroupMembers", () => {
		it("should add members to group successfully", async () => {
			const t = convexTest(schema, modules);

			// Create test users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			const user3Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Charlie",
					email: "charlie@example.com",
				});
			});

			// Create contacts
			await t.run(async (ctx) => {
				await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user2Id,
					status: "accepted",
				});
				await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user3Id,
					status: "accepted",
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					createdBy: user1Id,
					isPrivate: false,
					memberCount: 1,
				});
			});

			// Add creator as admin
			await t.run(async (ctx) => {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "admin",
					joinedAt: Date.now(),
				});
			});

			// Add members
			await t.withIdentity({ subject: user1Id }).mutation(api.groups.addGroupMembers, {
				groupId,
				memberIds: [user2Id, user3Id],
			});

			// Verify members were added
			const members = await t.run(async (ctx) => {
				return await ctx.db
					.query("groupMembers")
					.withIndex("by_group", (q) => q.eq("groupId", groupId))
					.collect();
			});

			expect(members).toHaveLength(3);
			expect(members.some(m => m.userId === user2Id)).toBe(true);
			expect(members.some(m => m.userId === user3Id)).toBe(true);

			// Verify system message was created
			const messages = await t.run(async (ctx) => {
				return await ctx.db
					.query("messages")
					.filter((q) => q.eq(q.field("groupId"), groupId))
					.collect();
			});

			expect(messages.length).toBeGreaterThan(0);
			expect(messages.some(m => m.messageType === "system" && m.content?.includes("added"))).toBe(true);
		});

		it("should throw error when not group admin", async () => {
			const t = convexTest(schema, modules);

			// Create test users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					createdBy: user1Id,
					isPrivate: false,
					memberCount: 2,
				});
			});

			// Add user2 as regular member
			await t.run(async (ctx) => {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});
			});

			await expect(
				t.withIdentity({ subject: user2Id }).mutation(api.groups.addGroupMembers, {
					groupId,
					memberIds: [user1Id],
				})
			).rejects.toThrow("Only group admins can add members");
		});
	});

	describe("getUserGroups", () => {
		it("should return user's groups", async () => {
			const t = convexTest(schema, modules);

			// Create test user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					description: "A test group",
					createdBy: userId,
					isPrivate: false,
					memberCount: 1,
				});
			});

			// Add user as member
			await t.run(async (ctx) => {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId,
					role: "admin",
					joinedAt: Date.now(),
				});
			});

			// Get groups
			const groups = await t.withIdentity({ subject: userId }).query(api.groups.getUserGroups, {});

			expect(groups).toHaveLength(1);
			expect(groups[0]?.name).toBe("Test Group");
			expect(groups[0]?.description).toBe("A test group");
			expect(groups[0]?.memberCount).toBe(1);
		});

		it("should return empty array when not authenticated", async () => {
			const t = convexTest(schema, modules);

			const groups = await t.query(api.groups.getUserGroups, {});

			expect(groups).toEqual([]);
		});
	});

	describe("getGroupMembers", () => {
		it("should return group members for authorized user", async () => {
			const t = convexTest(schema, modules);

			// Create test users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					createdBy: user1Id,
					isPrivate: false,
					memberCount: 2,
				});
			});

			// Add members
			await t.run(async (ctx) => {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "admin",
					joinedAt: Date.now(),
				});
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user2Id,
					role: "member",
					joinedAt: Date.now(),
				});
			});

			// Get group members
			const members = await t.withIdentity({ subject: user1Id }).query(api.groups.getGroupMembers, {
				groupId,
			});

			expect(members).toHaveLength(2);
			expect(members.some(m => m.user?.name === "Alice")).toBe(true);
			expect(members.some(m => m.user?.name === "Bob")).toBe(true);
		});

		it("should return empty array for non-member", async () => {
			const t = convexTest(schema, modules);

			// Create test users
			const user1Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			const user2Id = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create group
			const groupId = await t.run(async (ctx) => {
				return await ctx.db.insert("groups", {
					name: "Test Group",
					createdBy: user1Id,
					isPrivate: false,
					memberCount: 1,
				});
			});

			// Add only user1 as member
			await t.run(async (ctx) => {
				await ctx.db.insert("groupMembers", {
					groupId,
					userId: user1Id,
					role: "admin",
					joinedAt: Date.now(),
				});
			});

			// Try to get members as non-member
			const members = await t.withIdentity({ subject: user2Id }).query(api.groups.getGroupMembers, {
				groupId,
			});

			expect(members).toEqual([]);
		});
	});
});
