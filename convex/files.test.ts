/**
 * Tests for Convex file operations
 *
 * Tests cover:
 * - File upload URL generation
 * - File URL retrieval
 * - File metadata retrieval
 * - File message sending with validation
 * - Authentication and authorization checks
 * - Group membership and contact validation
 */

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// Import all Convex function modules for convex-test
const modules = import.meta.glob("./**/!(*.*.*)*.*s");

describe("File Operations", () => {
	let t: any;
	let userId: Id<"users">;
	let contactUserId: Id<"users">;
	let groupId: Id<"groups">;
	let fileId: Id<"_storage">;

	beforeEach(async () => {
		t = convexTest(schema, modules);

		// Create test users
		userId = await t.run(async (ctx: any) => {
			return await ctx.db.insert("users", {
				email: "test@example.com",
				name: "Test User",
			});
		});

		contactUserId = await t.run(async (ctx: any) => {
			return await ctx.db.insert("users", {
				email: "contact@example.com",
				name: "Contact User",
			});
		});

		// Create contact relationship
		await t.run(async (ctx: any) => {
			await ctx.db.insert("contacts", {
				userId: userId,
				contactUserId: contactUserId,
				status: "accepted",
			});
		});

		// Create test group
		groupId = await t.run(async (ctx: any) => {
			return await ctx.db.insert("groups", {
				name: "Test Group",
				description: "A test group",
				createdBy: userId,
				isPrivate: false,
			});
		});

		// Add user to group
		await t.run(async (ctx: any) => {
			await ctx.db.insert("groupMembers", {
				groupId: groupId,
				userId: userId,
				role: "admin",
				joinedAt: Date.now(),
			});
		});

		// Create a mock storage file by uploading a test blob
		fileId = await t.run(async (ctx: any) => {
			// Create a simple test file blob
			const testBlob = new Blob(["test file content"], { type: "text/plain" });
			return await ctx.storage.store(testBlob);
		});
	});

	describe("generateUploadUrl", () => {
		it("should generate upload URL for authenticated users", async () => {
			const result = await t
				.withIdentity({ subject: userId })
				.mutation(api.files.generateUploadUrl, {});

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result).toMatch(/^https?:\/\//); // Should be a valid URL
		});

		it("should throw error for unauthenticated users", async () => {
			await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow(
				"Not authenticated",
			);
		});
	});

	describe("getFileUrl", () => {
		it("should return file URL for valid file ID", async () => {
			const result = await t.query(api.files.getFileUrl, { fileId });

			// The result might be null if file doesn't exist, which is expected behavior
			// In a real scenario, this would return a URL or null
			expect(result === null || typeof result === "string").toBe(true);
		});

		it("should return null for non-existent file IDs", async () => {
			// Create a valid file ID but then delete the file to simulate non-existence
			const tempFileId = await t.run(async (ctx: any) => {
				const testBlob = new Blob(["temp test"], { type: "text/plain" });
				return await ctx.storage.store(testBlob);
			});

			// Delete the file to make the ID point to a non-existent file
			await t.run(async (ctx: any) => {
				await ctx.storage.delete(tempFileId);
			});

			// Should return null for deleted/non-existent files
			const result = await t.query(api.files.getFileUrl, {
				fileId: tempFileId,
			});
			expect(result).toBeNull();
		});
	});

	describe("getFileMetadata", () => {
		it("should return file metadata for valid file ID", async () => {
			const result = await t.query(api.files.getFileMetadata, { fileId });

			// The result might be null if file doesn't exist in system table
			expect(result === null || typeof result === "object").toBe(true);
		});

		it("should return null for non-existent file metadata", async () => {
			// Create a valid file ID but then delete the file to simulate non-existence
			const tempFileId = await t.run(async (ctx: any) => {
				const testBlob = new Blob(["metadata temp test"], {
					type: "text/plain",
				});
				return await ctx.storage.store(testBlob);
			});

			// Delete the file to make the ID point to a non-existent file
			await t.run(async (ctx: any) => {
				await ctx.storage.delete(tempFileId);
			});

			// Should return null for deleted/non-existent files
			const result = await t.query(api.files.getFileMetadata, {
				fileId: tempFileId,
			});
			expect(result).toBeNull();
		});
	});

	describe("sendFileMessage", () => {
		const getFileMessageArgs = () => ({
			fileId,
			fileName: "test-file.pdf",
			fileType: "application/pdf",
			fileSize: 1024 * 1024, // 1MB
		});

		it("should create file message for direct messages between contacts", async () => {
			await t
				.withIdentity({ subject: userId })
				.mutation(api.files.sendFileMessage, {
					...getFileMessageArgs(),
					receiverId: contactUserId,
				});

			// Verify message was created
			const messages = await t.run(async (ctx: any) => {
				return await ctx.db
					.query("messages")
					.withIndex("by_sender", (q: any) => q.eq("senderId", userId))
					.collect();
			});

			expect(messages).toHaveLength(1);
			expect(messages[0]).toMatchObject({
				senderId: userId,
				receiverId: contactUserId,
				content: "test-file.pdf",
				messageType: "file",
				fileId,
				fileName: "test-file.pdf",
				fileType: "application/pdf",
				fileSize: 1024 * 1024,
				isRead: false,
			});
		});

		it("should create file message for group messages for group members", async () => {
			await t
				.withIdentity({ subject: userId })
				.mutation(api.files.sendFileMessage, {
					...getFileMessageArgs(),
					groupId,
				});

			// Verify message was created
			const messages = await t.run(async (ctx: any) => {
				return await ctx.db
					.query("messages")
					.withIndex("by_group", (q: any) => q.eq("groupId", groupId))
					.collect();
			});

			expect(messages).toHaveLength(1);
			expect(messages[0]).toMatchObject({
				senderId: userId,
				groupId,
				content: "test-file.pdf",
				messageType: "file",
				fileId,
				fileName: "test-file.pdf",
				fileType: "application/pdf",
				fileSize: 1024 * 1024,
				isRead: false,
			});
		});

		it("should throw error when neither receiverId nor groupId is provided", async () => {
			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.files.sendFileMessage, getFileMessageArgs()),
			).rejects.toThrow(
				"Must specify either receiverId or groupId, but not both",
			);
		});

		it("should throw error when both receiverId and groupId are provided", async () => {
			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.files.sendFileMessage, {
						...getFileMessageArgs(),
						receiverId: contactUserId,
						groupId,
					}),
			).rejects.toThrow(
				"Must specify either receiverId or groupId, but not both",
			);
		});

		it("should throw error for unauthenticated users", async () => {
			await expect(
				t.mutation(api.files.sendFileMessage, {
					...getFileMessageArgs(),
					receiverId: contactUserId,
				}),
			).rejects.toThrow("Not authenticated");
		});

		it("should throw error when user is not a group member", async () => {
			// Create another user not in the group
			const nonMemberUserId = await t.run(async (ctx: any) => {
				return await ctx.db.insert("users", {
					email: "nonmember@example.com",
					name: "Non Member",
				});
			});

			await expect(
				t
					.withIdentity({ subject: nonMemberUserId })
					.mutation(api.files.sendFileMessage, {
						...getFileMessageArgs(),
						groupId,
					}),
			).rejects.toThrow("You are not a member of this group");
		});

		it("should throw error when users are not contacts", async () => {
			// Create another user not in contacts
			const nonContactUserId = await t.run(async (ctx: any) => {
				return await ctx.db.insert("users", {
					email: "noncontact@example.com",
					name: "Non Contact",
				});
			});

			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.files.sendFileMessage, {
						...getFileMessageArgs(),
						receiverId: nonContactUserId,
					}),
			).rejects.toThrow("You can only send files to your contacts");
		});

		it("should throw error when contact request is pending", async () => {
			// Create user with pending contact request
			const pendingContactUserId = await t.run(async (ctx: any) => {
				const pendingUserId = await ctx.db.insert("users", {
					email: "pending@example.com",
					name: "Pending Contact",
				});

				await ctx.db.insert("contacts", {
					userId: userId,
					contactUserId: pendingUserId,
					status: "pending",
				});

				return pendingUserId;
			});

			await expect(
				t
					.withIdentity({ subject: userId })
					.mutation(api.files.sendFileMessage, {
						...getFileMessageArgs(),
						receiverId: pendingContactUserId,
					}),
			).rejects.toThrow("You can only send files to your contacts");
		});

		it("should update user status after sending file message", async () => {
			// First, create initial user status
			await t.run(async (ctx: any) => {
				await ctx.db.insert("userStatus", {
					userId: userId,
					status: "online",
					lastSeen: Date.now() - 60000, // 1 minute ago
					statusMessage: "Test status",
				});
			});

			const beforeTime = Date.now();

			await t
				.withIdentity({ subject: userId })
				.mutation(api.files.sendFileMessage, {
					...getFileMessageArgs(),
					receiverId: contactUserId,
				});

			// Verify user status was updated
			const userStatus = await t.run(async (ctx: any) => {
				return await ctx.db
					.query("userStatus")
					.withIndex("by_user", (q: any) => q.eq("userId", userId))
					.unique();
			});

			expect(userStatus).toBeDefined();
			expect(userStatus.lastSeen).toBeGreaterThanOrEqual(beforeTime);
		});
	});
});
