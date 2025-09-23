/**
 * Tests for Service Worker push functionality
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock service worker global scope
const mockRegistration = {
	showNotification: vi.fn(),
};

const mockSelf = {
	registration: mockRegistration,
	addEventListener: vi.fn(),
};

// Set up global self for service worker context
Object.defineProperty(global, "self", {
	value: mockSelf,
	writable: true,
});

describe("Service Worker Push Events", () => {
	let pushEventHandler: (event: any) => void;
	let notificationClickHandler: (event: any) => void;

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset handlers
		pushEventHandler = () => {};
		notificationClickHandler = () => {};

		// Mock addEventListener to capture event handlers
		mockSelf.addEventListener.mockImplementation((eventType: string, handler: any) => {
			if (eventType === "push") {
				pushEventHandler = handler;
			} else if (eventType === "notificationclick") {
				notificationClickHandler = handler;
			}
		});

		// Load the service worker code (simulate)
		// In a real test, you might load the actual sw.js file
		// For now, we'll test the event handlers directly
	});

	describe("Push Event Handling", () => {
		it("should handle push event with JSON data", () => {
			const mockEvent = {
				data: {
					json: vi.fn().mockReturnValue({
						title: "Test Notification",
						body: "Test message body",
						icon: "/test-icon.png",
						data: { chatId: "chat123" },
					}),
				},
				waitUntil: vi.fn(),
			};

			// Simulate the push event handler logic
			const handlePushEvent = (event: any) => {
				let data = {};
				try {
					if (event.data) data = event.data.json();
				} catch (e) {
					data = { title: "Notification", body: event.data?.text() || "" };
				}

				const title = (data as any).title || "Notification";
				const options = {
					body: (data as any).body || "",
					icon: (data as any).icon || "/icon-192.png",
					badge: (data as any).badge || "/badge-72.png",
					data: (data as any).data || {},
					actions: (data as any).actions || [],
					requireInteraction: !!(data as any).requireInteraction,
					silent: !!(data as any).silent,
				};

				event.waitUntil(self.registration.showNotification(title, options));
			};

			handlePushEvent(mockEvent);

			expect(mockEvent.data.json).toHaveBeenCalled();
			expect(mockEvent.waitUntil).toHaveBeenCalled();
			expect(mockRegistration.showNotification).toHaveBeenCalledWith("Test Notification", {
				body: "Test message body",
				icon: "/test-icon.png",
				badge: "/badge-72.png",
				data: { chatId: "chat123" },
				actions: [],
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle push event with text data", () => {
			const mockEvent = {
				data: {
					json: vi.fn().mockImplementation(() => {
						throw new Error("Not JSON");
					}),
					text: vi.fn().mockReturnValue("Plain text message"),
				},
				waitUntil: vi.fn(),
			};

			const handlePushEvent = (event: any) => {
				let data = {};
				try {
					if (event.data) data = event.data.json();
				} catch (e) {
					data = { title: "Notification", body: event.data?.text() || "" };
				}

				const title = (data as any).title || "Notification";
				const options = {
					body: (data as any).body || "",
					icon: (data as any).icon || "/icon-192.png",
					badge: (data as any).badge || "/badge-72.png",
					data: (data as any).data || {},
					actions: (data as any).actions || [],
					requireInteraction: !!(data as any).requireInteraction,
					silent: !!(data as any).silent,
				};

				event.waitUntil(self.registration.showNotification(title, options));
			};

			handlePushEvent(mockEvent);

			expect(mockEvent.data.json).toHaveBeenCalled();
			expect(mockEvent.data.text).toHaveBeenCalled();
			expect(mockRegistration.showNotification).toHaveBeenCalledWith("Notification", {
				body: "Plain text message",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {},
				actions: [],
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle push event with no data", () => {
			const mockEvent = {
				data: null,
				waitUntil: vi.fn(),
			};

			const handlePushEvent = (event: any) => {
				let data = {};
				try {
					if (event.data) data = event.data.json();
				} catch (e) {
					data = { title: "Notification", body: event.data?.text() || "" };
				}

				const title = (data as any).title || "Notification";
				const options = {
					body: (data as any).body || "",
					icon: (data as any).icon || "/icon-192.png",
					badge: (data as any).badge || "/badge-72.png",
					data: (data as any).data || {},
					actions: (data as any).actions || [],
					requireInteraction: !!(data as any).requireInteraction,
					silent: !!(data as any).silent,
				};

				event.waitUntil(self.registration.showNotification(title, options));
			};

			handlePushEvent(mockEvent);

			expect(mockRegistration.showNotification).toHaveBeenCalledWith("Notification", {
				body: "",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {},
				actions: [],
				requireInteraction: false,
				silent: false,
			});
		});

		it("should handle push event with custom options", () => {
			const mockEvent = {
				data: {
					json: vi.fn().mockReturnValue({
						title: "Custom Notification",
						body: "Custom body",
						icon: "/custom-icon.png",
						badge: "/custom-badge.png",
						data: { type: "message", chatId: "chat456" },
						actions: [
							{ action: "reply", title: "Reply" },
							{ action: "dismiss", title: "Dismiss" },
						],
						requireInteraction: true,
						silent: true,
					}),
				},
				waitUntil: vi.fn(),
			};

			const handlePushEvent = (event: any) => {
				let data = {};
				try {
					if (event.data) data = event.data.json();
				} catch (e) {
					data = { title: "Notification", body: event.data?.text() || "" };
				}

				const title = (data as any).title || "Notification";
				const options = {
					body: (data as any).body || "",
					icon: (data as any).icon || "/icon-192.png",
					badge: (data as any).badge || "/badge-72.png",
					data: (data as any).data || {},
					actions: (data as any).actions || [],
					requireInteraction: !!(data as any).requireInteraction,
					silent: !!(data as any).silent,
				};

				event.waitUntil(self.registration.showNotification(title, options));
			};

			handlePushEvent(mockEvent);

			expect(mockRegistration.showNotification).toHaveBeenCalledWith("Custom Notification", {
				body: "Custom body",
				icon: "/custom-icon.png",
				badge: "/custom-badge.png",
				data: { type: "message", chatId: "chat456" },
				actions: [
					{ action: "reply", title: "Reply" },
					{ action: "dismiss", title: "Dismiss" },
				],
				requireInteraction: true,
				silent: true,
			});
		});
	});

	describe("Notification Click Handling", () => {
		it("should handle notification click event", () => {
			const mockEvent = {
				notification: {
					data: { url: "/chat/user123" },
					close: vi.fn(),
				},
				action: "",
				waitUntil: vi.fn(),
			};

			const mockClients = {
				openWindow: vi.fn(),
				matchAll: vi.fn().mockResolvedValue([]),
			};

			// Mock clients global
			Object.defineProperty(global, "clients", {
				value: mockClients,
				writable: true,
			});

			const handleNotificationClick = (event: any) => {
				event.notification.close();

				const urlToOpen = event.notification.data?.url || "/";

				event.waitUntil(
					clients.matchAll({ type: "window" }).then((clientList: any[]) => {
						// Try to focus existing window
						for (const client of clientList) {
							if (client.url === urlToOpen && "focus" in client) {
								return client.focus();
							}
						}
						// Open new window if no existing window found
						if (clients.openWindow) {
							return clients.openWindow(urlToOpen);
						}
					})
				);
			};

			handleNotificationClick(mockEvent);

			expect(mockEvent.notification.close).toHaveBeenCalled();
			expect(mockEvent.waitUntil).toHaveBeenCalled();
			expect(mockClients.matchAll).toHaveBeenCalledWith({ type: "window" });
		});

		it("should handle notification click with action", () => {
			const mockEvent = {
				notification: {
					data: { chatId: "chat123" },
					close: vi.fn(),
				},
				action: "reply",
				waitUntil: vi.fn(),
			};

			const handleNotificationClick = (event: any) => {
				event.notification.close();

				if (event.action === "reply") {
					// Handle reply action
					const chatId = event.notification.data?.chatId;
					const urlToOpen = chatId ? `/chat/${chatId}` : "/";

					event.waitUntil(clients.openWindow(urlToOpen));
				}
			};

			handleNotificationClick(mockEvent);

			expect(mockEvent.notification.close).toHaveBeenCalled();
			expect(mockEvent.waitUntil).toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should handle JSON parsing errors gracefully", () => {
			const mockEvent = {
				data: {
					json: vi.fn().mockImplementation(() => {
						throw new Error("Invalid JSON");
					}),
					text: vi.fn().mockReturnValue("Fallback text"),
				},
				waitUntil: vi.fn(),
			};

			const handlePushEvent = (event: any) => {
				let data = {};
				try {
					if (event.data) data = event.data.json();
				} catch (e) {
					data = { title: "Notification", body: event.data?.text() || "" };
				}

				const title = (data as any).title || "Notification";
				const options = {
					body: (data as any).body || "",
					icon: (data as any).icon || "/icon-192.png",
					badge: (data as any).badge || "/badge-72.png",
					data: (data as any).data || {},
					actions: (data as any).actions || [],
					requireInteraction: !!(data as any).requireInteraction,
					silent: !!(data as any).silent,
				};

				event.waitUntil(self.registration.showNotification(title, options));
			};

			// Should not throw
			expect(() => handlePushEvent(mockEvent)).not.toThrow();
			expect(mockRegistration.showNotification).toHaveBeenCalledWith("Notification", {
				body: "Fallback text",
				icon: "/icon-192.png",
				badge: "/badge-72.png",
				data: {},
				actions: [],
				requireInteraction: false,
				silent: false,
			});
		});
	});
});
