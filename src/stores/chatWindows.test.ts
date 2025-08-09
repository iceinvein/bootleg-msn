import { describe, it, expect, beforeEach } from "vitest";
import { $activeChatWindows, $mainWindowActiveChat, chatWindowHelpers } from "./chatWindows";

describe("chatWindows store", () => {
	beforeEach(() => {
		// Reset stores before each test
		$activeChatWindows.set(new Set());
		$mainWindowActiveChat.set(null);
	});

	describe("chatWindowHelpers", () => {
		it("should generate correct chat keys", () => {
			const contactKey = chatWindowHelpers.getChatKey("contact", "user123" as any);
			const groupKey = chatWindowHelpers.getChatKey("group", "group456" as any);

			expect(contactKey).toBe("contact:user123");
			expect(groupKey).toBe("group:group456");
		});

		it("should add and remove chat windows", () => {
			const userId = "user123" as any;
			const groupId = "group456" as any;

			// Initially empty
			expect($activeChatWindows.get().size).toBe(0);

			// Add contact chat window
			chatWindowHelpers.addChatWindow("contact", userId);
			expect($activeChatWindows.get().has("contact:user123")).toBe(true);
			expect($activeChatWindows.get().size).toBe(1);

			// Add group chat window
			chatWindowHelpers.addChatWindow("group", groupId);
			expect($activeChatWindows.get().has("group:group456")).toBe(true);
			expect($activeChatWindows.get().size).toBe(2);

			// Remove contact chat window
			chatWindowHelpers.removeChatWindow("contact", userId);
			expect($activeChatWindows.get().has("contact:user123")).toBe(false);
			expect($activeChatWindows.get().has("group:group456")).toBe(true);
			expect($activeChatWindows.get().size).toBe(1);

			// Remove group chat window
			chatWindowHelpers.removeChatWindow("group", groupId);
			expect($activeChatWindows.get().size).toBe(0);
		});

		it("should check if chat window is active", () => {
			const userId = "user123" as any;
			const groupId = "group456" as any;

			// Initially not active
			expect(chatWindowHelpers.isChatWindowActive("contact", userId)).toBe(false);
			expect(chatWindowHelpers.isChatWindowActive("group", groupId)).toBe(false);

			// Add contact chat window
			chatWindowHelpers.addChatWindow("contact", userId);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId)).toBe(true);
			expect(chatWindowHelpers.isChatWindowActive("group", groupId)).toBe(false);

			// Add group chat window
			chatWindowHelpers.addChatWindow("group", groupId);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId)).toBe(true);
			expect(chatWindowHelpers.isChatWindowActive("group", groupId)).toBe(true);
		});

		it("should manage main window active chat", () => {
			const contactChat = {
				type: "contact" as const,
				id: "user123" as any,
				name: "Alice",
			};

			const groupChat = {
				type: "group" as const,
				id: "group456" as any,
				name: "Test Group",
			};

			// Initially null
			expect($mainWindowActiveChat.get()).toBe(null);
			expect(chatWindowHelpers.isMainWindowChatActive("contact", "user123" as any)).toBe(false);

			// Set contact chat as active
			chatWindowHelpers.setMainWindowActiveChat(contactChat);
			expect($mainWindowActiveChat.get()).toEqual(contactChat);
			expect(chatWindowHelpers.isMainWindowChatActive("contact", "user123" as any)).toBe(true);
			expect(chatWindowHelpers.isMainWindowChatActive("group", "group456" as any)).toBe(false);

			// Set group chat as active
			chatWindowHelpers.setMainWindowActiveChat(groupChat);
			expect($mainWindowActiveChat.get()).toEqual(groupChat);
			expect(chatWindowHelpers.isMainWindowChatActive("contact", "user123" as any)).toBe(false);
			expect(chatWindowHelpers.isMainWindowChatActive("group", "group456" as any)).toBe(true);

			// Clear active chat
			chatWindowHelpers.setMainWindowActiveChat(null);
			expect($mainWindowActiveChat.get()).toBe(null);
			expect(chatWindowHelpers.isMainWindowChatActive("contact", "user123" as any)).toBe(false);
			expect(chatWindowHelpers.isMainWindowChatActive("group", "group456" as any)).toBe(false);
		});

		it("should check if chat is active anywhere", () => {
			const userId = "user123" as any;
			const groupId = "group456" as any;

			// Initially not active anywhere
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(false);
			expect(chatWindowHelpers.isChatActiveAnywhere("group", groupId)).toBe(false);

			// Add to separate chat window
			chatWindowHelpers.addChatWindow("contact", userId);
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(true);
			expect(chatWindowHelpers.isChatActiveAnywhere("group", groupId)).toBe(false);

			// Set as main window active chat (should still be true)
			chatWindowHelpers.setMainWindowActiveChat({
				type: "contact",
				id: userId,
				name: "Alice",
			});
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(true);

			// Remove from separate chat window (should still be true due to main window)
			chatWindowHelpers.removeChatWindow("contact", userId);
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(true);

			// Clear main window active chat
			chatWindowHelpers.setMainWindowActiveChat(null);
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(false);

			// Test group chat in main window only
			chatWindowHelpers.setMainWindowActiveChat({
				type: "group",
				id: groupId,
				name: "Test Group",
			});
			expect(chatWindowHelpers.isChatActiveAnywhere("group", groupId)).toBe(true);
			expect(chatWindowHelpers.isChatActiveAnywhere("contact", userId)).toBe(false);
		});

		it("should clear all chat windows", () => {
			const userId1 = "user123" as any;
			const userId2 = "user456" as any;
			const groupId = "group789" as any;

			// Add multiple chat windows
			chatWindowHelpers.addChatWindow("contact", userId1);
			chatWindowHelpers.addChatWindow("contact", userId2);
			chatWindowHelpers.addChatWindow("group", groupId);

			expect($activeChatWindows.get().size).toBe(3);

			// Clear all
			chatWindowHelpers.clearAllChatWindows();
			expect($activeChatWindows.get().size).toBe(0);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId1)).toBe(false);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId2)).toBe(false);
			expect(chatWindowHelpers.isChatWindowActive("group", groupId)).toBe(false);
		});

		it("should handle duplicate additions gracefully", () => {
			const userId = "user123" as any;

			// Add same chat window multiple times
			chatWindowHelpers.addChatWindow("contact", userId);
			chatWindowHelpers.addChatWindow("contact", userId);
			chatWindowHelpers.addChatWindow("contact", userId);

			// Should only be added once
			expect($activeChatWindows.get().size).toBe(1);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId)).toBe(true);
		});

		it("should handle removal of non-existent chat windows gracefully", () => {
			const userId = "user123" as any;

			// Try to remove non-existent chat window
			chatWindowHelpers.removeChatWindow("contact", userId);

			// Should not cause errors
			expect($activeChatWindows.get().size).toBe(0);
			expect(chatWindowHelpers.isChatWindowActive("contact", userId)).toBe(false);
		});

		it("should distinguish between different chat types with same ID", () => {
			const id = "same123" as any;

			// Add both contact and group with same ID
			chatWindowHelpers.addChatWindow("contact", id);
			chatWindowHelpers.addChatWindow("group", id);

			expect($activeChatWindows.get().size).toBe(2);
			expect(chatWindowHelpers.isChatWindowActive("contact", id)).toBe(true);
			expect(chatWindowHelpers.isChatWindowActive("group", id)).toBe(true);

			// Remove only contact
			chatWindowHelpers.removeChatWindow("contact", id);

			expect($activeChatWindows.get().size).toBe(1);
			expect(chatWindowHelpers.isChatWindowActive("contact", id)).toBe(false);
			expect(chatWindowHelpers.isChatWindowActive("group", id)).toBe(true);
		});
	});
});
