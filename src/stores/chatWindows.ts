import type { Id } from "@convex/_generated/dataModel";
import { atom } from "nanostores";

export type ActiveChat = {
	type: "contact" | "group";
	id: Id<"users"> | Id<"groups">;
	name: string;
};

// Store to track which chat windows are currently open/active
export const $activeChatWindows = atom<Set<string>>(new Set());

// Store to track the currently selected/focused chat in the main window
export const $mainWindowActiveChat = atom<ActiveChat | null>(null);

// Helper functions to manage active chat windows
export const chatWindowHelpers = {
	// Generate a unique key for a chat
	getChatKey(
		type: "contact" | "group",
		id: Id<"users"> | Id<"groups">,
	): string {
		return `${type}:${id}`;
	},

	// Add a chat window to the active set
	addChatWindow(type: "contact" | "group", id: Id<"users"> | Id<"groups">) {
		const key = this.getChatKey(type, id);
		const current = $activeChatWindows.get();
		const updated = new Set(current);
		updated.add(key);
		$activeChatWindows.set(updated);
	},

	// Remove a chat window from the active set
	removeChatWindow(type: "contact" | "group", id: Id<"users"> | Id<"groups">) {
		const key = this.getChatKey(type, id);
		const current = $activeChatWindows.get();
		const updated = new Set(current);
		updated.delete(key);
		$activeChatWindows.set(updated);
	},

	// Check if a chat window is currently active
	isChatWindowActive(
		type: "contact" | "group",
		id: Id<"users"> | Id<"groups">,
	): boolean {
		const key = this.getChatKey(type, id);
		return $activeChatWindows.get().has(key);
	},

	// Set the main window active chat
	setMainWindowActiveChat(chat: ActiveChat | null) {
		$mainWindowActiveChat.set(chat);
	},

	// Check if a chat is active in the main window
	isMainWindowChatActive(
		type: "contact" | "group",
		id: Id<"users"> | Id<"groups">,
	): boolean {
		const activeChat = $mainWindowActiveChat.get();
		if (!activeChat) return false;
		return activeChat.type === type && activeChat.id === id;
	},

	// Check if a chat is active anywhere (main window or separate chat window)
	isChatActiveAnywhere(
		type: "contact" | "group",
		id: Id<"users"> | Id<"groups">,
	): boolean {
		return (
			this.isChatWindowActive(type, id) || this.isMainWindowChatActive(type, id)
		);
	},

	// Clear all active chat windows (useful for cleanup)
	clearAllChatWindows() {
		$activeChatWindows.set(new Set());
	},
};
