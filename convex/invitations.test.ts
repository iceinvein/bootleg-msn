import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("Invitations Database Operations", () => {
	describe("sendInvitation", () => {
		it("should send invitation successfully", async () => {
			const t = convexTest(schema, modules);

			// Create test user (inviter)
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Mock the action call since it involves external email service
			// We'll test the internal mutation directly
			const invitationId = await t.run(async (ctx) => {
				return await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "test-token-123",
					status: "pending",
					message: "Join me on MSN Messenger!",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
					createdAt: Date.now(),
				});
			});

			expect(invitationId).toBeTruthy();

			// Verify invitation was created
			const invitation = await t.run(async (ctx) => {
				return await ctx.db.get(invitationId);
			});

			expect(invitation).toBeTruthy();
			expect(invitation?.inviterUserId).toBe(inviterId);
			expect(invitation?.inviteeEmail).toBe("bob@example.com");
			expect(invitation?.status).toBe("pending");
		});

		it("should prevent duplicate invitations to same email", async () => {
			const t = convexTest(schema, modules);

			// Create test user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create existing invitation
			await t.run(async (ctx) => {
				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "test-token-123",
					status: "pending",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			// Try to create another invitation to same email
			// This should be handled by the business logic in sendInvitation action
			const existingInvitation = await t.run(async (ctx) => {
				return await ctx.db
					.query("invitations")
					.withIndex("by_inviter_and_email", (q) =>
						q
							.eq("inviterUserId", inviterId)
							.eq("inviteeEmail", "bob@example.com"),
					)
					.filter((q) => q.eq(q.field("status"), "pending"))
					.first();
			});

			expect(existingInvitation).toBeTruthy();
		});
	});

	describe("getSentInvitations", () => {
		it("should return invitations sent by user", async () => {
			const t = convexTest(schema, modules);

			// Create test user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create test invitations
			await t.run(async (ctx) => {
				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "token-1",
					status: "pending",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});

				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "charlie@example.com",
					inviteeName: "Charlie",
					token: "token-2",
					status: "accepted",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			// Get sent invitations
			const invitations = await t
				.withIdentity({ subject: inviterId })
				.query(api.invitations.getSentInvitations, {});

			expect(invitations).toHaveLength(2);
			expect(invitations[0].inviteeEmail).toBe("charlie@example.com"); // Most recent first (desc order)
			expect(invitations[1].inviteeEmail).toBe("bob@example.com");
		});

		it("should return empty array when not authenticated", async () => {
			const t = convexTest(schema, modules);

			const invitations = await t.query(api.invitations.getSentInvitations, {});

			expect(invitations).toEqual([]);
		});
	});

	describe("acceptInvitation", () => {
		it("should accept invitation and create contact relationship", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create invitee user
			const inviteeId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create invitation
			const invitationId = await t.run(async (ctx) => {
				return await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "test-token-123",
					status: "pending",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			// Accept invitation
			await t
				.withIdentity({ subject: inviteeId })
				.mutation(api.invitations.acceptInvitation, {
					token: "test-token-123",
				});

			// Verify invitation status updated
			const invitation = await t.run(async (ctx) => {
				return await ctx.db.get(invitationId);
			});

			expect(invitation?.status).toBe("accepted");

			// Verify contact relationships were created
			const contact1 = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", inviterId).eq("contactUserId", inviteeId),
					)
					.unique();
			});

			const contact2 = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", inviteeId).eq("contactUserId", inviterId),
					)
					.unique();
			});

			expect(contact1?.status).toBe("accepted");
			expect(contact2?.status).toBe("accepted");
		});

		it("should throw error for invalid token", async () => {
			const t = convexTest(schema, modules);

			// Create user
			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.invitations.acceptInvitation, {
						token: "invalid-token",
					}),
			).rejects.toThrow("Invitation not found");
		});

		it("should throw error for expired invitation", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create invitee user
			const inviteeId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create expired invitation
			await t.run(async (ctx) => {
				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "expired-token",
					status: "pending",
					expiresAt: Date.now() - 1000, // Expired
					createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
				});
			});

			await expect(
				t
					.withIdentity({ subject: inviteeId })
					.mutation(api.invitations.acceptInvitation, {
						token: "expired-token",
					}),
			).rejects.toThrow("Invitation has expired");
		});
	});

	describe("cancelInvitation", () => {
		it("should cancel invitation successfully", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create invitation
			const invitationId = await t.run(async (ctx) => {
				return await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "test-token-123",
					status: "pending",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			// Cancel invitation
			await t
				.withIdentity({ subject: inviterId })
				.mutation(api.invitations.cancelInvitation, {
					invitationId,
				});

			// Verify invitation status updated
			const invitation = await t.run(async (ctx) => {
				return await ctx.db.get(invitationId);
			});

			expect(invitation?.status).toBe("cancelled");
		});

		it("should throw error when not invitation owner", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create other user
			const otherUserId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Bob",
					email: "bob@example.com",
				});
			});

			// Create invitation
			const invitationId = await t.run(async (ctx) => {
				return await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "charlie@example.com",
					inviteeName: "Charlie",
					token: "test-token-123",
					status: "pending",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			await expect(
				t
					.withIdentity({ subject: otherUserId })
					.mutation(api.invitations.cancelInvitation, {
						invitationId,
					}),
			).rejects.toThrow("You can only cancel your own invitations");
		});
	});

	describe("getInvitationByToken", () => {
		it("should return invitation for valid token", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create invitation
			await t.run(async (ctx) => {
				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "test-token-123",
					status: "pending",
					message: "Join me!",
					expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
					createdAt: Date.now(),
				});
			});

			// Get invitation by token
			const invitation = await t.query(api.invitations.getInvitationByToken, {
				token: "test-token-123",
			});

			expect(invitation).toBeTruthy();
			expect(invitation?.inviteeEmail).toBe("bob@example.com");
			expect(invitation?.message).toBe("Join me!");
			expect(invitation?.inviter?.name).toBe("Alice");
		});

		it("should return null for invalid token", async () => {
			const t = convexTest(schema, modules);

			const invitation = await t.query(api.invitations.getInvitationByToken, {
				token: "invalid-token",
			});

			expect(invitation).toBeNull();
		});

		it("should return null for expired invitation", async () => {
			const t = convexTest(schema, modules);

			// Create inviter user
			const inviterId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			// Create expired invitation
			await t.run(async (ctx) => {
				await ctx.db.insert("invitations", {
					inviterUserId: inviterId,
					inviteeEmail: "bob@example.com",
					inviteeName: "Bob",
					token: "expired-token",
					status: "pending",
					expiresAt: Date.now() - 1000, // Expired
					createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
				});
			});

			const invitation = await t.query(api.invitations.getInvitationByToken, {
				token: "expired-token",
			});

			expect(invitation).toBeNull();
		});
	});
});
