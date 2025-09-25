import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("Contacts Database Operations", () => {
	describe("sendContactRequest", () => {
		it("should send a contact request successfully", async () => {
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

			// Send contact request
			const result = await t
				.withIdentity({ subject: user1Id })
				.mutation(api.contacts.sendContactRequest, {
					contactEmail: "bob@example.com",
					nickname: "Bobby",
				});

			expect(result).toEqual({ autoAccepted: false });

			// Verify contact was created
			const contact = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", user1Id).eq("contactUserId", user2Id),
					)
					.unique();
			});

			expect(contact).toBeTruthy();
			expect(contact?.status).toBe("pending");
			expect(contact?.nickname).toBe("Bobby");
		});

		it("should auto-accept when reverse request exists", async () => {
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

			// User2 sends request to User1 first
			await t.run(async (ctx) => {
				await ctx.db.insert("contacts", {
					userId: user2Id,
					contactUserId: user1Id,
					status: "pending",
				});
			});

			// User1 sends request to User2 (should auto-accept)
			const result = await t
				.withIdentity({ subject: user1Id })
				.mutation(api.contacts.sendContactRequest, {
					contactEmail: "bob@example.com",
					nickname: "Bobby",
				});

			expect(result).toEqual({ autoAccepted: true });

			// Verify both contacts are accepted
			const contact1 = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", user1Id).eq("contactUserId", user2Id),
					)
					.unique();
			});

			const contact2 = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", user2Id).eq("contactUserId", user1Id),
					)
					.unique();
			});

			expect(contact1?.status).toBe("accepted");
			expect(contact2?.status).toBe("accepted");
		});

		it("should throw error when user not found", async () => {
			const t = convexTest(schema, modules);

			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.contacts.sendContactRequest, {
						contactEmail: "nonexistent@example.com",
					}),
			).rejects.toThrow("User has not signed up yet");
		});

		it("should throw error when trying to add self", async () => {
			const t = convexTest(schema, modules);

			const userId = await t.run(async (ctx) => {
				return await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
			});

			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.contacts.sendContactRequest, {
						contactEmail: "alice@example.com",
					}),
			).rejects.toThrow("Cannot add yourself as a contact");
		});

		it("should throw error when contact request already sent", async () => {
			const t = convexTest(schema, modules);

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

			// Create existing pending contact
			await t.run(async (ctx) => {
				await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user2Id,
					status: "pending",
				});
			});

			await expect(
				t
					.withIdentity({ subject: user1Id })
					.mutation(api.contacts.sendContactRequest, {
						contactEmail: "bob@example.com",
					}),
			).rejects.toThrow("Contact request already sent");
		});
		it("should throw error when not authenticated", async () => {
			const t = convexTest(schema, modules);

			await expect(
				t.mutation(api.contacts.sendContactRequest, {
					contactEmail: "bob@example.com",
				}),
			).rejects.toThrow("Not authenticated");
		});
	});

	describe("acceptContactRequest", () => {
		it("should accept contact request successfully", async () => {
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

			// Create pending contact request
			const contactId = await t.run(async (ctx) => {
				return await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user2Id,
					status: "pending",
				});
			});

			// Accept the request
			await t
				.withIdentity({ subject: user2Id })
				.mutation(api.contacts.acceptContactRequest, {
					contactId,
				});

			// Verify contact is accepted
			const contact = await t.run(async (ctx) => {
				return await ctx.db.get(contactId);
			});

			expect(contact?.status).toBe("accepted");

			// Verify reverse contact was created
			const reverseContact = await t.run(async (ctx) => {
				return await ctx.db
					.query("contacts")
					.withIndex("by_user_and_contact", (q) =>
						q.eq("userId", user2Id).eq("contactUserId", user1Id),
					)
					.unique();
			});

			expect(reverseContact).toBeTruthy();
			expect(reverseContact?.status).toBe("accepted");
		});

		it("should throw error when not authenticated", async () => {
			const t = convexTest(schema, modules);

			const contactId = await t.run(async (ctx) => {
				const userId = await ctx.db.insert("users", {
					name: "Alice",
					email: "alice@example.com",
				});
				return await ctx.db.insert("contacts", {
					userId,
					contactUserId: userId,
					status: "pending",
				});
			});

			await expect(
				t.mutation(api.contacts.acceptContactRequest, {
					contactId,
				}),
			).rejects.toThrow("Not authenticated");
		});
	});

	describe("getContacts", () => {
		it("should return accepted contacts with details", async () => {
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

			// Create accepted contact
			await t.run(async (ctx) => {
				await ctx.db.insert("contacts", {
					userId: user1Id,
					contactUserId: user2Id,
					status: "accepted",
					nickname: "Bobby",
				});
			});

			// Get contacts
			const contacts = await t
				.withIdentity({ subject: user1Id })
				.query(api.contacts.getContacts, {});

			expect(contacts).toHaveLength(1);
			expect(contacts[0].user?.name).toBe("Bob");
			expect(contacts[0].nickname).toBe("Bobby");
			// The status field is the user's online status, not contact relationship status
			expect(contacts[0].status).toBe("offline"); // User status defaults to offline
		});

		it("should return empty array when not authenticated", async () => {
			const t = convexTest(schema, modules);

			const contacts = await t.query(api.contacts.getContacts, {});

			expect(contacts).toEqual([]);
		});
	});
});
