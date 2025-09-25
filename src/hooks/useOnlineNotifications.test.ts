import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnlineNotifications } from "./useOnlineNotifications";

// Mock Convex
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => mockUseQuery()),
}));

// Mock toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
	},
}));

// Mock browser notifications
vi.mock("@/lib/browser-notifications", () => ({
	browserNotifications: {
		getSettings: vi.fn(() => ({ sound: true })),
		notifyContactOnline: vi.fn(),
	},
}));

// Mock Audio API
const mockPlay = vi.fn();
const mockAudio = {
	play: mockPlay,
	volume: 0.6,
	addEventListener: vi.fn(),
};

Object.defineProperty(window, "Audio", {
	writable: true,
	value: vi.fn(() => mockAudio),
});

describe("useOnlineNotifications", () => {
	let mockToastSuccess: any;
	let mockNotifyContactOnline: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockUseQuery.mockReturnValue([]);
		mockPlay.mockResolvedValue(undefined);

		// Get the mocked functions
		const { toast } = await import("sonner");
		const { browserNotifications } = await import(
			"@/lib/browser-notifications"
		);
		mockToastSuccess = vi.mocked(toast.success);
		mockNotifyContactOnline = vi.mocked(
			browserNotifications.notifyContactOnline,
		);

		mockNotifyContactOnline.mockResolvedValue(undefined);
	});

	describe("Initialization", () => {
		it("should initialize without errors", () => {
			const { result } = renderHook(() => useOnlineNotifications());

			expect(result.current).toBeDefined();
			expect(result.current.playOnlineSound).toBeInstanceOf(Function);
		});

		it("should not process notifications when no contacts", () => {
			mockUseQuery.mockReturnValue(null);

			renderHook(() => useOnlineNotifications());

			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockNotifyContactOnline).not.toHaveBeenCalled();
		});

		it("should not process notifications when contacts array is empty", () => {
			mockUseQuery.mockReturnValue([]);

			renderHook(() => useOnlineNotifications());

			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockNotifyContactOnline).not.toHaveBeenCalled();
		});
	});

	describe("Contact Status Detection", () => {
		const mockContacts = [
			{
				_id: "contact1",
				contactUserId: "user1",
				user: {
					_id: "user1",
					name: "Alice Johnson",
					email: "alice@example.com",
				},
				status: "offline",
				lastSeen: Date.now() - 10 * 60 * 1000, // 10 minutes ago
			},
		];

		it("should detect when contact comes online", async () => {
			const { rerender } = renderHook(() => useOnlineNotifications());

			// Initially offline
			mockUseQuery.mockReturnValue(mockContacts);
			rerender();

			// Now online
			const onlineContacts = [
				{
					...mockContacts[0],
					status: "online",
					lastSeen: Date.now(),
				},
			];
			mockUseQuery.mockReturnValue(onlineContacts);
			rerender();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledWith(
					"Alice Johnson is now online",
					{
						duration: 4000,
						description: "Your contact has signed in",
					},
				);
			});

			expect(mockNotifyContactOnline).toHaveBeenCalledWith(
				"user1",
				"Alice Johnson",
			);
		});

		it("should not notify for contacts already online", async () => {
			const onlineContacts = [
				{
					...mockContacts[0],
					status: "online",
					lastSeen: Date.now(),
				},
			];

			mockUseQuery.mockReturnValue(onlineContacts);
			renderHook(() => useOnlineNotifications());

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 0));
			});

			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockNotifyContactOnline).not.toHaveBeenCalled();
		});

		it("should handle multiple contacts coming online", async () => {
			const multipleContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: { _id: "user1", name: "Alice", email: "alice@example.com" },
					status: "offline",
					lastSeen: Date.now() - 10 * 60 * 1000,
				},
				{
					_id: "contact2",
					contactUserId: "user2",
					user: { _id: "user2", name: "Bob", email: "bob@example.com" },
					status: "offline",
					lastSeen: Date.now() - 15 * 60 * 1000,
				},
			];

			const { rerender } = renderHook(() => useOnlineNotifications());

			// Initially offline
			mockUseQuery.mockReturnValue(multipleContacts);
			rerender();

			// Both come online
			const onlineContacts = multipleContacts.map((contact) => ({
				...contact,
				status: "online",
				lastSeen: Date.now(),
			}));
			mockUseQuery.mockReturnValue(onlineContacts);
			rerender();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledTimes(2);
			});

			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Alice is now online",
				expect.any(Object),
			);
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Bob is now online",
				expect.any(Object),
			);
			expect(mockNotifyContactOnline).toHaveBeenCalledTimes(2);
		});

		it("should not notify for status changes other than coming online", async () => {
			const { rerender } = renderHook(() => useOnlineNotifications());

			// Initially online
			const onlineContacts = [
				{
					...mockContacts[0],
					status: "online",
					lastSeen: Date.now(),
				},
			];
			mockUseQuery.mockReturnValue(onlineContacts);
			rerender();

			// Change to away
			const awayContacts = [
				{
					...onlineContacts[0],
					status: "away",
				},
			];
			mockUseQuery.mockReturnValue(awayContacts);
			rerender();

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 0));
			});

			expect(mockToastSuccess).not.toHaveBeenCalled();
			expect(mockNotifyContactOnline).not.toHaveBeenCalled();
		});
	});

	describe("Sound Notifications", () => {
		it("should play sound when contact comes online", async () => {
			const mockContact = {
				_id: "contact1",
				contactUserId: "user1",
				user: { _id: "user1", name: "Alice", email: "alice@example.com" },
				status: "offline",
				lastSeen: Date.now() - 10 * 60 * 1000,
			};

			const { result, rerender } = renderHook(() => useOnlineNotifications());

			// Initially offline
			mockUseQuery.mockReturnValue([mockContact]);
			rerender();

			// Now online
			mockUseQuery.mockReturnValue([
				{
					...mockContact,
					status: "online",
					lastSeen: Date.now(),
				},
			]);
			rerender();

			await waitFor(() => {
				expect(window.Audio).toHaveBeenCalledWith("/sounds/online.mp3");
				expect(mockPlay).toHaveBeenCalled();
			});
		});

		it("should handle sound play errors gracefully", async () => {
			mockPlay.mockRejectedValue(new Error("Audio play failed"));

			const { result } = renderHook(() => useOnlineNotifications());

			await act(async () => {
				result.current.playOnlineSound();
			});

			expect(mockPlay).toHaveBeenCalled();
			// Should not throw error
		});

		it("should handle audio loading errors gracefully", async () => {
			const mockAddEventListener = vi.fn((event, callback) => {
				if (event === "error") {
					callback();
				}
			});
			mockAudio.addEventListener = mockAddEventListener;

			const { result } = renderHook(() => useOnlineNotifications());

			await act(async () => {
				result.current.playOnlineSound();
			});

			expect(mockAddEventListener).toHaveBeenCalledWith(
				"error",
				expect.any(Function),
			);
		});

		it("should respect sound settings", async () => {
			const { browserNotifications } = await import(
				"@/lib/browser-notifications"
			);
			vi.mocked(browserNotifications.getSettings).mockReturnValue({
				sound: false,
			});

			const { result } = renderHook(() => useOnlineNotifications());

			await act(async () => {
				result.current.playOnlineSound();
			});

			expect(window.Audio).not.toHaveBeenCalled();
			expect(mockPlay).not.toHaveBeenCalled();
		});
	});

	describe("Duplicate Prevention", () => {
		it("should not notify twice for the same sign-in event", async () => {
			const mockContact = {
				_id: "contact1",
				contactUserId: "user1",
				user: { _id: "user1", name: "Alice", email: "alice@example.com" },
				status: "offline",
				lastSeen: Date.now() - 10 * 60 * 1000,
			};

			const { rerender } = renderHook(() => useOnlineNotifications());

			// Initially offline
			mockUseQuery.mockReturnValue([mockContact]);
			rerender();

			// Come online
			const onlineContacts = [
				{
					...mockContact,
					status: "online",
					lastSeen: Date.now(),
				},
			];
			mockUseQuery.mockReturnValue(onlineContacts);
			rerender();

			await waitFor(() => {
				expect(mockToastSuccess).toHaveBeenCalledTimes(1);
			});

			// Trigger another render with same data
			rerender();

			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 0));
			});

			// Should still only be called once
			expect(mockToastSuccess).toHaveBeenCalledTimes(1);
		});
	});

	describe("Error Handling", () => {
		it("should handle browser notification errors gracefully", async () => {
			const mockContact = {
				_id: "contact1",
				contactUserId: "user1",
				user: { _id: "user1", name: "Alice", email: "alice@example.com" },
				status: "offline",
				lastSeen: Date.now() - 10 * 60 * 1000,
			};

			mockNotifyContactOnline.mockRejectedValue(
				new Error("Notification failed"),
			);

			const { rerender } = renderHook(() => useOnlineNotifications());

			// Initially offline
			mockUseQuery.mockReturnValue([mockContact]);
			rerender();

			// Now online
			mockUseQuery.mockReturnValue([
				{
					...mockContact,
					status: "online",
					lastSeen: Date.now(),
				},
			]);
			rerender();

			await waitFor(() => {
				expect(mockNotifyContactOnline).toHaveBeenCalled();
			});

			// Should still show toast even if browser notification fails
			expect(mockToastSuccess).toHaveBeenCalled();
		});

		it("should handle malformed contact data gracefully", async () => {
			const malformedContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					// Missing user object
					status: "online",
					lastSeen: Date.now(),
				},
			];

			mockUseQuery.mockReturnValue(malformedContacts);

			expect(() => renderHook(() => useOnlineNotifications())).not.toThrow();
		});
	});
});
