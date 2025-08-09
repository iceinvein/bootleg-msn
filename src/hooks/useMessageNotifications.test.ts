import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import { useMessageNotifications } from "./useMessageNotifications";
import { $selectedChat } from "@/stores/contact";
import { chatWindowHelpers } from "@/stores/chatWindows";

// Mock dependencies
vi.mock("sonner", () => ({
	toast: vi.fn(),
}));

vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
}));

vi.mock("@/stores/contact", () => ({
	$selectedChat: {
		set: vi.fn(),
	},
}));

vi.mock("@/stores/chatWindows", () => ({
	chatWindowHelpers: {
		setMainWindowActiveChat: vi.fn(),
		isChatActiveAnywhere: vi.fn(),
	},
}));

// Mock Convex API
const mockUseQuery = vi.fn();
const mockUseStore = vi.fn();

beforeEach(async () => {
	vi.clearAllMocks();

	// Setup default mocks
	const { useQuery } = await import("convex/react");
	const { useStore } = await import("@nanostores/react");

	vi.mocked(useQuery).mockImplementation(mockUseQuery);
	vi.mocked(useStore).mockImplementation(mockUseStore);

	// Default return values
	mockUseStore.mockReturnValue(null);
	mockUseQuery.mockReturnValue(null);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useMessageNotifications", () => {
	const mockUser = {
		_id: "user1" as any,
		name: "Test User",
		email: "test@example.com",
	};

	const mockContacts = [
		{
			_id: "contact1" as any,
			contactUserId: "user2" as any,
			nickname: "Alice",
			user: {
				_id: "user2" as any,
				name: "Alice Smith",
				email: "alice@example.com",
			},
		},
	];

	const mockGroups = [
		{
			_id: "group1" as any,
			name: "Test Group",
		},
	];

	const mockDirectMessage = {
		_id: "msg1" as any,
		senderId: "user2" as any,
		receiverId: "user1" as any,
		content: "Hello there!",
		messageType: "text" as const,
		isRead: false,
		_creationTime: Date.now(),
		sender: {
			_id: "user2" as any,
			name: "Alice Smith",
			email: "alice@example.com",
		},
		isFromMe: false,
	};

	const mockGroupMessage = {
		_id: "msg2" as any,
		senderId: "user2" as any,
		groupId: "group1" as any,
		content: "Hello group!",
		messageType: "text" as const,
		isRead: false,
		_creationTime: Date.now(),
		sender: {
			_id: "user2" as any,
			name: "Alice Smith",
			email: "alice@example.com",
		},
		isFromMe: false,
	};

	it("should initialize without errors", () => {
		mockUseQuery
			.mockReturnValueOnce(mockUser) // user
			.mockReturnValueOnce([]) // allMessages
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		const { result } = renderHook(() => useMessageNotifications());

		expect(result.current).toBeDefined();
		// The hook returns an object with these functions
		expect(result.current).toHaveProperty("addChatWindow");
		expect(result.current).toHaveProperty("removeChatWindow");
		expect(result.current).toHaveProperty("isChatActive");
	});

	it("should not show notifications for messages from current user", async () => {
		const messageFromSelf = {
			...mockDirectMessage,
			senderId: "user1" as any,
			isFromMe: true,
		};

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user
			.mockReturnValueOnce([messageFromSelf]) // allMessages
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		renderHook(() => useMessageNotifications());

		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});
	});

	it("should not show notifications for system messages", async () => {
		const systemMessage = {
			...mockDirectMessage,
			messageType: "system" as const,
			content: "User joined the chat",
		};

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user
			.mockReturnValueOnce([systemMessage]) // allMessages
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		renderHook(() => useMessageNotifications());

		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});
	});

	it("should show notification for new direct message when chat is not active", async () => {
		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(false);

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user (first render)
			.mockReturnValueOnce([]) // allMessages (first render)
			.mockReturnValueOnce(mockContacts) // contacts (first render)
			.mockReturnValueOnce(mockGroups) // groups (first render)
			.mockReturnValueOnce(mockUser) // user (second render)
			.mockReturnValueOnce([mockDirectMessage]) // allMessages (second render)
			.mockReturnValueOnce(mockContacts) // contacts (second render)
			.mockReturnValueOnce(mockGroups); // groups (second render)

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message
		rerender();

		await waitFor(() => {
			expect(toast).toHaveBeenCalledWith(
				"Alice",
				expect.objectContaining({
					description: "Hello there!",
					action: expect.objectContaining({
						label: "Open",
					}),
					duration: 5000,
				}),
			);
		});
	});

	it("should show notification for new group message when chat is not active", async () => {
		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(false);

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user (first render)
			.mockReturnValueOnce([]) // allMessages (first render)
			.mockReturnValueOnce(mockContacts) // contacts (first render)
			.mockReturnValueOnce(mockGroups) // groups (first render)
			.mockReturnValueOnce(mockUser) // user (second render)
			.mockReturnValueOnce([mockGroupMessage]) // allMessages (second render)
			.mockReturnValueOnce(mockContacts) // contacts (second render)
			.mockReturnValueOnce(mockGroups); // groups (second render)

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message
		rerender();

		await waitFor(() => {
			expect(toast).toHaveBeenCalledWith(
				"Alice Smith in Test Group",
				expect.objectContaining({
					description: "Hello group!",
					action: expect.objectContaining({
						label: "Open",
					}),
					duration: 5000,
				}),
			);
		});
	});

	it("should not show notification when chat is active", async () => {
		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(true);

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user (first render)
			.mockReturnValueOnce([]) // allMessages (first render)
			.mockReturnValueOnce(mockContacts) // contacts (first render)
			.mockReturnValueOnce(mockGroups) // groups (first render)
			.mockReturnValueOnce(mockUser) // user (second render)
			.mockReturnValueOnce([mockDirectMessage]) // allMessages (second render)
			.mockReturnValueOnce(mockContacts) // contacts (second render)
			.mockReturnValueOnce(mockGroups); // groups (second render)

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message but chat is active
		rerender();

		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});
	});

	it("should truncate long messages in notifications", async () => {
		const longMessage = {
			...mockDirectMessage,
			content: "This is a very long message that should be truncated because it exceeds the 50 character limit for toast notifications",
		};

		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(false);

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user (first render)
			.mockReturnValueOnce([]) // allMessages (first render)
			.mockReturnValueOnce(mockContacts) // contacts (first render)
			.mockReturnValueOnce(mockGroups) // groups (first render)
			.mockReturnValueOnce(mockUser) // user (second render)
			.mockReturnValueOnce([longMessage]) // allMessages (second render)
			.mockReturnValueOnce(mockContacts) // contacts (second render)
			.mockReturnValueOnce(mockGroups); // groups (second render)

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message
		rerender();

		await waitFor(() => {
			expect(toast).toHaveBeenCalledWith(
				"Alice",
				expect.objectContaining({
					description: "This is a very long message that should be truncat...",
				}),
			);
		});
	});

	it("should handle file messages correctly", async () => {
		const fileMessage = {
			...mockDirectMessage,
			messageType: "file" as const,
			content: "document.pdf",
		};

		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(false);

		mockUseQuery
			.mockReturnValueOnce(mockUser) // user (first render)
			.mockReturnValueOnce([]) // allMessages (first render)
			.mockReturnValueOnce(mockContacts) // contacts (first render)
			.mockReturnValueOnce(mockGroups) // groups (first render)
			.mockReturnValueOnce(mockUser) // user (second render)
			.mockReturnValueOnce([fileMessage]) // allMessages (second render)
			.mockReturnValueOnce(mockContacts) // contacts (second render)
			.mockReturnValueOnce(mockGroups); // groups (second render)

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message
		rerender();

		await waitFor(() => {
			expect(toast).toHaveBeenCalledWith(
				"Alice",
				expect.objectContaining({
					description: "📎 Sent a file",
				}),
			);
		});
	});

	it("should update main window active chat when selectedChat changes", () => {
		const selectedContact = {
			contact: mockContacts[0],
			group: null,
		};

		mockUseStore.mockReturnValue(selectedContact);
		mockUseQuery
			.mockReturnValueOnce(mockUser)
			.mockReturnValueOnce([])
			.mockReturnValueOnce(mockContacts)
			.mockReturnValueOnce(mockGroups);

		renderHook(() => useMessageNotifications());

		expect(chatWindowHelpers.setMainWindowActiveChat).toHaveBeenCalledWith({
			type: "contact",
			id: mockContacts[0].contactUserId,
			name: "Alice",
		});
	});

	it("should open chat when notification action is clicked", async () => {
		vi.mocked(chatWindowHelpers.isChatActiveAnywhere).mockReturnValue(false);

		mockUseQuery
			.mockReturnValueOnce(mockUser)
			.mockReturnValueOnce([])
			.mockReturnValueOnce(mockContacts)
			.mockReturnValueOnce(mockGroups)
			.mockReturnValueOnce(mockUser)
			.mockReturnValueOnce([mockDirectMessage])
			.mockReturnValueOnce(mockContacts)
			.mockReturnValueOnce(mockGroups);

		const { rerender } = renderHook(() => useMessageNotifications());

		// First render - initialize
		await waitFor(() => {
			expect(toast).not.toHaveBeenCalled();
		});

		// Second render - new message
		rerender();

		await waitFor(() => {
			expect(toast).toHaveBeenCalled();
		});

		// Simulate clicking the action button
		const toastCall = vi.mocked(toast).mock.calls[0];
		const toastOptions = toastCall[1];
		
		act(() => {
			toastOptions.action.onClick();
		});

		expect($selectedChat.set).toHaveBeenCalledWith({
			contact: mockContacts[0],
			group: null,
		});
	});
});
