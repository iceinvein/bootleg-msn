/**
 * Tests for useOptimisticMessages hook
 * 
 * Tests cover:
 * - Adding optimistic messages
 * - Marking messages as sent/failed
 * - Removing and retrying messages
 * - Server message reconciliation
 * - Loading states
 * - Message combining and sorting
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOptimisticMessages } from "./useOptimisticMessages";
import type { Id } from "@convex/_generated/dataModel";

// Mock Convex
const mockUseQuery = vi.hoisted(() => vi.fn());
vi.mock("convex/react", () => ({
	useQuery: mockUseQuery,
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
	api: {
		messages: {
			getMessages: vi.fn(),
		},
		auth: {
			loggedInUser: vi.fn(),
		},
	},
}));

describe("useOptimisticMessages", () => {
	const mockCurrentUserId = "user123" as Id<"users">;
	const mockOtherUserId = "user456" as Id<"users">;
	const mockGroupId = "group789" as Id<"groups">;

	const mockCurrentUser = {
		_id: mockCurrentUserId,
		name: "Current User",
		email: "current@test.com",
		image: "avatar.jpg",
	};

	const mockServerMessage = {
		_id: "msg123" as Id<"messages">,
		_creationTime: Date.now(),
		senderId: mockCurrentUserId,
		receiverId: mockOtherUserId,
		content: "Hello world",
		messageType: "text" as const,
		isRead: false,
		sender: mockCurrentUser,
		isFromMe: true,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock implementations
		mockUseQuery.mockImplementation((query) => {
			if (query === "loggedInUser") {
				return mockCurrentUser;
			}
			return []; // Empty messages by default
		});
	});

	describe("initialization", () => {
		it("should initialize with empty messages when no server messages", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			expect(result.current.messages).toEqual([]);
			expect(result.current.isLoading).toBe(false);
		});

		it("should show loading state when server messages are undefined", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return undefined; // Loading state
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			expect(result.current.isLoading).toBe(true);
		});

		it("should return server messages when available", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [mockServerMessage];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0]).toEqual(mockServerMessage);
		});
	});

	describe("addOptimisticMessage", () => {
		it("should add an optimistic message", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			expect(optimisticId).toBeTruthy();
			expect(result.current.messages).toHaveLength(1);
			
			const message = result.current.messages[0];
			expect(message).toMatchObject({
				content: "Test message",
				messageType: "text",
				senderId: mockCurrentUserId,
				receiverId: mockOtherUserId,
				isFromMe: true,
				isOptimistic: true,
				isSending: false,
			});
		});

		it("should add optimistic message with file data", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			const fileData = {
				fileId: "file123" as Id<"_storage">,
				fileName: "test.jpg",
				fileType: "image/jpeg",
				fileSize: 1024,
			};

			act(() => {
				result.current.addOptimisticMessage("File message", "file", fileData);
			});

			expect(result.current.messages).toHaveLength(1);
			
			const message = result.current.messages[0];
			expect(message).toMatchObject({
				content: "File message",
				messageType: "file",
				...fileData,
			});
		});

		it("should return null when no current user", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return null;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: undefined,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			expect(optimisticId).toBeNull();
			expect(result.current.messages).toHaveLength(0);
		});

		it("should create unique IDs for multiple messages", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let id1: string | null = null;
			let id2: string | null = null;

			act(() => {
				id1 = result.current.addOptimisticMessage("Message 1");
				id2 = result.current.addOptimisticMessage("Message 2");
			});

			expect(id1).not.toEqual(id2);
			expect(result.current.messages).toHaveLength(2);
		});
	});

	describe("markOptimisticMessageSent", () => {
		it("should mark optimistic message as sent", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			// Initially not sending
			expect(result.current.messages[0]).toMatchObject({
				isSending: false,
			});

			act(() => {
				result.current.markOptimisticMessageSent(optimisticId!);
			});

			expect(result.current.messages[0]).toMatchObject({
				isSending: false,
			});
		});
	});

	describe("markOptimisticMessageFailed", () => {
		it("should mark optimistic message as failed with error", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			act(() => {
				result.current.markOptimisticMessageFailed(optimisticId!, "Network error");
			});

			expect(result.current.messages[0]).toMatchObject({
				sendError: "Network error",
			});
		});
	});

	describe("removeOptimisticMessage", () => {
		it("should remove optimistic message", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			expect(result.current.messages).toHaveLength(1);

			act(() => {
				result.current.removeOptimisticMessage(optimisticId!);
			});

			expect(result.current.messages).toHaveLength(0);
		});
	});

	describe("retryOptimisticMessage", () => {
		it("should retry failed optimistic message", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			// Mark as failed
			act(() => {
				result.current.markOptimisticMessageFailed(optimisticId!, "Network error");
			});

			expect(result.current.messages[0]).toMatchObject({
				sendError: "Network error",
				isSending: false,
			});

			// Retry
			act(() => {
				result.current.retryOptimisticMessage(optimisticId!);
			});

			expect(result.current.messages[0]).toMatchObject({
				sendError: undefined,
				isSending: true,
			});
		});
	});

	describe("server message reconciliation", () => {
		it("should remove optimistic message when server confirms it", async () => {
			let serverMessages: any[] = [];

			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return serverMessages;
			});

			const { result, rerender } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			// Add optimistic message
			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Test message");
			});

			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0]).toMatchObject({
				content: "Test message",
				isOptimistic: true,
			});

			// Simulate server confirmation
			const confirmedMessage = {
				_id: "confirmed123" as Id<"messages">,
				_creationTime: Date.now(),
				senderId: mockCurrentUserId,
				receiverId: mockOtherUserId,
				content: "Test message",
				messageType: "text" as const,
				isRead: false,
				sender: mockCurrentUser,
				isFromMe: true,
			};

			serverMessages = [confirmedMessage];
			rerender();

			// Wait for reconciliation
			await waitFor(() => {
				expect(result.current.messages).toHaveLength(1);
				expect(result.current.messages[0]).toMatchObject({
					_id: "confirmed123",
					content: "Test message",
				});
				expect(result.current.messages[0]).not.toHaveProperty("isOptimistic");
			});
		});

		it("should keep failed optimistic messages even when server has messages", async () => {
			let serverMessages: any[] = [];

			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return serverMessages;
			});

			const { result, rerender } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			// Add optimistic message and mark as failed
			let optimisticId: string | null = null;
			act(() => {
				optimisticId = result.current.addOptimisticMessage("Failed message");
				result.current.markOptimisticMessageFailed(optimisticId!, "Network error");
			});

			// Add server message with different content
			const serverMessage = {
				_id: "server123" as Id<"messages">,
				_creationTime: Date.now(),
				senderId: mockCurrentUserId,
				receiverId: mockOtherUserId,
				content: "Different message",
				messageType: "text" as const,
				isRead: false,
				sender: mockCurrentUser,
				isFromMe: true,
			};

			serverMessages = [serverMessage];
			rerender();

			await waitFor(() => {
				expect(result.current.messages).toHaveLength(2);

				// Should have both server message and failed optimistic message
				const serverMsg = result.current.messages.find(m => m.content === "Different message");
				const optimisticMsg = result.current.messages.find(m => m.content === "Failed message");

				expect(serverMsg).toBeDefined();
				expect(optimisticMsg).toBeDefined();
				expect(optimisticMsg).toMatchObject({
					sendError: "Network error",
					isOptimistic: true,
				});
			});
		});

		it("should combine and sort server and optimistic messages by creation time", () => {
			const baseTime = Date.now();

			const serverMessage1 = {
				_id: "server1" as Id<"messages">,
				_creationTime: baseTime,
				senderId: mockOtherUserId,
				receiverId: mockCurrentUserId,
				content: "Server message 1",
				messageType: "text" as const,
				isRead: false,
				sender: { _id: mockOtherUserId, name: "Other User" },
				isFromMe: false,
			};

			const serverMessage2 = {
				_id: "server2" as Id<"messages">,
				_creationTime: baseTime + 2000,
				senderId: mockOtherUserId,
				receiverId: mockCurrentUserId,
				content: "Server message 2",
				messageType: "text" as const,
				isRead: false,
				sender: { _id: mockOtherUserId, name: "Other User" },
				isFromMe: false,
			};

			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [serverMessage1, serverMessage2];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			// Add optimistic message between server messages
			act(() => {
				// Mock the creation time to be between server messages
				const originalNow = Date.now;
				Date.now = vi.fn(() => baseTime + 1000);

				result.current.addOptimisticMessage("Optimistic message");

				Date.now = originalNow;
			});

			expect(result.current.messages).toHaveLength(3);

			// Check order: server1, optimistic, server2
			expect(result.current.messages[0].content).toBe("Server message 1");
			expect(result.current.messages[1].content).toBe("Optimistic message");
			expect(result.current.messages[2].content).toBe("Server message 2");
		});

		it("should handle clock skew in server confirmation matching", async () => {
			let serverMessages: any[] = [];

			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return serverMessages;
			});

			const { result, rerender } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			const optimisticTime = Date.now();

			// Add optimistic message
			act(() => {
				// Mock creation time
				const originalNow = Date.now;
				Date.now = vi.fn(() => optimisticTime);

				result.current.addOptimisticMessage("Test message");

				Date.now = originalNow;
			});

			// Server message arrives slightly before optimistic time (clock skew)
			const serverMessage = {
				_id: "server123" as Id<"messages">,
				_creationTime: optimisticTime - 1000, // 1 second before optimistic
				senderId: mockCurrentUserId,
				receiverId: mockOtherUserId,
				content: "Test message",
				messageType: "text" as const,
				isRead: false,
				sender: mockCurrentUser,
				isFromMe: true,
			};

			serverMessages = [serverMessage];
			rerender();

			// Should still match and remove optimistic message
			await waitFor(() => {
				expect(result.current.messages).toHaveLength(1);
				expect(result.current.messages[0]._id).toBe("server123");
			});
		});
	});

	describe("edge cases", () => {
		it("should handle skip query parameter", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				if (query === "skip") return undefined;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					// No otherUserId or groupId provided
					currentUserId: mockCurrentUserId,
				})
			);

			expect(result.current.isLoading).toBe(false);
			expect(result.current.messages).toEqual([]);
		});

		it("should handle group messages", () => {
			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return [];
			});

			const { result } = renderHook(() =>
				useOptimisticMessages({
					groupId: mockGroupId,
					currentUserId: mockCurrentUserId,
				})
			);

			act(() => {
				result.current.addOptimisticMessage("Group message");
			});

			expect(result.current.messages[0]).toMatchObject({
				content: "Group message",
				groupId: mockGroupId,
				receiverId: undefined,
			});
		});

		it("should maintain stable keys for server messages", async () => {
			let serverMessages: any[] = [];

			mockUseQuery.mockImplementation((query) => {
				if (query === "loggedInUser") return mockCurrentUser;
				return serverMessages;
			});

			const { result, rerender } = renderHook(() =>
				useOptimisticMessages({
					otherUserId: mockOtherUserId,
					currentUserId: mockCurrentUserId,
				})
			);

			// Add optimistic message
			act(() => {
				result.current.addOptimisticMessage("Test message");
			});

			const optimisticMessage = result.current.messages[0];

			// Server confirms the message
			const serverMessage = {
				_id: "server123" as Id<"messages">,
				_creationTime: Date.now(),
				senderId: mockCurrentUserId,
				receiverId: mockOtherUserId,
				content: "Test message",
				messageType: "text" as const,
				isRead: false,
				sender: mockCurrentUser,
				isFromMe: true,
			};

			serverMessages = [serverMessage];
			rerender();

			await waitFor(() => {
				expect(result.current.messages).toHaveLength(1);
				const confirmedMessage = result.current.messages[0];

				// Should have clientKey for stable rendering
				expect(confirmedMessage).toHaveProperty("clientKey");
				expect((confirmedMessage as any).clientKey).toBe(optimisticMessage._id);
			});
		});
	});
});
