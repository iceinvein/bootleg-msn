import type { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { atom, computed } from "nanostores";

export type Contact = FunctionReturnType<
	typeof api.contacts.getContacts
>[number];

export type Group = FunctionReturnType<typeof api.groups.getUserGroups>[number];

type SelectedChat = {
	contact: Contact | null;
	group: Group | null;
};

// Core selected chat store
export const $selectedChat = atom<SelectedChat | null>(null);

// Chat loading states
export const $isMessagesLoading = atom<boolean>(false);
export const $isTypingIndicatorLoading = atom<boolean>(false);

// Typing indicators
export const $contactIsTyping = atom<{ isTyping: boolean } | null>(null);
export const $groupIsTyping = atom<Array<{
	_id: string;
	user?: { name?: string; email?: string } | null;
}> | null>(null);

// Derived stores for commonly used values
export const $selectedUserId = computed(
	$selectedChat,
	(chat) => chat?.contact?.contactUserId,
);

export const $selectedGroupId = computed(
	$selectedChat,
	(chat) => chat?.group?._id,
);

export const $chatDisplayName = computed($selectedChat, (chat) => {
	if (!chat) return "Unknown User";

	return (
		chat.contact?.nickname ??
		chat.contact?.user?.name ??
		chat.contact?.user?.email ??
		chat.group?.name ??
		"Unknown User"
	);
});

export const $canNudge = computed($selectedChat, (chat) =>
	Boolean(chat?.contact),
);

// File upload context
export const $fileUploadContext = computed(
	[$selectedUserId, $selectedGroupId],
	(userId, groupId) => ({
		receiverId: userId as Id<"users"> | undefined,
		groupId: groupId as Id<"groups"> | undefined,
	}),
);
