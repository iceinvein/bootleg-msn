import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// Extend Window interface to include Tauri global
declare global {
	interface Window {
		__TAURI__?: unknown;
		__TAURI_INTERNALS__?: unknown;
	}
}

export type NotificationPermission =
	| "granted"
	| "denied"
	| "prompt"
	| "prompt-with-rationale";

export type NotificationType = "message" | "contact_request" | "group_invite";

export type NotificationData = {
	id: string;
	title: string;
	body: string;
	chatId?: string;
	senderId?: string;
	notificationType: NotificationType;
	timestamp: number;
};

export type NotificationSettings = {
	enabled: boolean;
	soundEnabled: boolean;
	showPreview: boolean;
	suppressWhenFocused: boolean;
	quietHoursEnabled: boolean;
	quietHoursStart?: string; // "22:00"
	quietHoursEnd?: string; // "08:00"
};

export type NavigationEventData = {
	route: string;
};

export type EventData = NavigationEventData | Record<string, unknown>;

export class TauriNotificationService {
	private static instance: TauriNotificationService;
	private eventListeners: Map<string, Array<(data: EventData) => void>> =
		new Map();

	private constructor() {
		this.setupEventListeners();
	}

	static getInstance(): TauriNotificationService {
		if (!TauriNotificationService.instance) {
			TauriNotificationService.instance = new TauriNotificationService();
		}
		return TauriNotificationService.instance;
	}

	private async setupEventListeners() {
		try {
			// Listen for notification click events from Tauri
			await listen("notification-clicked", (event) => {
				const notificationId = event.payload as string;
				this.handleNotificationClick(notificationId);
			});

			// Listen for frontend navigation events
			await listen("show-contact-requests", () => {
				this.emit("navigate", { route: "/contact-requests" });
			});

			await listen("show-group-invites", () => {
				this.emit("navigate", { route: "/group-invites" });
			});
		} catch (error) {
			console.error("Failed to setup notification event listeners:", error);
		}
	}

	/**
	 * Request notification permission from the system
	 */
	async requestPermission(): Promise<NotificationPermission> {
		try {
			const permission = await invoke<string>(
				"request_notification_permission",
			);
			return permission as NotificationPermission;
		} catch (error) {
			console.error("Failed to request notification permission:", error);
			return "denied";
		}
	}

	/**
	 * Check current notification permission status
	 */
	async checkPermission(): Promise<NotificationPermission> {
		try {
			const permission = await invoke<string>("check_notification_permission");
			return permission as NotificationPermission;
		} catch (error) {
			console.error("Failed to check notification permission:", error);
			return "denied";
		}
	}

	/**
	 * Show a native desktop notification
	 */
	async showNotification(data: NotificationData): Promise<void> {
		try {
			const notificationData = {
				id: data.id,
				title: data.title,
				body: data.body,
				chat_id: data.chatId,
				sender_id: data.senderId,
				notification_type: data.notificationType,
				timestamp: data.timestamp,
			};

			await invoke("show_notification", { notificationData });
		} catch (error) {
			console.error("Failed to show notification:", error);
			throw error;
		}
	}

	/**
	 * Handle notification click (called internally)
	 */
	private async handleNotificationClick(notificationId: string): Promise<void> {
		try {
			await invoke("handle_notification_click", { notificationId });
		} catch (error) {
			console.error("Failed to handle notification click:", error);
		}
	}

	/**
	 * Save notification settings
	 */
	async saveSettings(settings: NotificationSettings): Promise<void> {
		try {
			await invoke("save_notification_settings", { settings });
		} catch (error) {
			console.error("Failed to save notification settings:", error);
			throw error;
		}
	}

	/**
	 * Load notification settings
	 */
	async loadSettings(): Promise<NotificationSettings> {
		try {
			const settings = await invoke<NotificationSettings>(
				"load_notification_settings",
			);
			return settings;
		} catch (error) {
			console.error("Failed to load notification settings:", error);
			// Return default settings on error
			return {
				enabled: true,
				soundEnabled: true,
				showPreview: true,
				suppressWhenFocused: true,
				quietHoursEnabled: false,
			};
		}
	}

	/**
	 * Clear all pending notifications
	 */
	async clearAllNotifications(): Promise<void> {
		try {
			await invoke("clear_all_notifications");
		} catch (error) {
			console.error("Failed to clear notifications:", error);
			throw error;
		}
	}

	/**
	 * Create a message notification
	 */
	async notifyNewMessage(
		messageId: string,
		senderName: string,
		messageContent: string,
		chatId: string,
		senderId: string,
	): Promise<void> {
		const notification: NotificationData = {
			id: `message-${messageId}`,
			title: `New message from ${senderName}`,
			body: messageContent,
			chatId,
			senderId,
			notificationType: "message",
			timestamp: Date.now(),
		};

		await this.showNotification(notification);
	}

	/**
	 * Create a contact request notification
	 */
	async notifyContactRequest(
		requestId: string,
		requesterName: string,
		requesterEmail: string,
	): Promise<void> {
		const notification: NotificationData = {
			id: `contact-request-${requestId}`,
			title: "New Contact Request",
			body: `${requesterName} (${requesterEmail}) wants to add you as a contact`,
			senderId: requestId,
			notificationType: "contact_request",
			timestamp: Date.now(),
		};

		await this.showNotification(notification);
	}

	/**
	 * Create a group invite notification
	 */
	async notifyGroupInvite(
		inviteId: string,
		groupName: string,
		inviterName: string,
	): Promise<void> {
		const notification: NotificationData = {
			id: `group-invite-${inviteId}`,
			title: "Group Invitation",
			body: `${inviterName} invited you to join "${groupName}"`,
			senderId: inviteId,
			notificationType: "group_invite",
			timestamp: Date.now(),
		};

		await this.showNotification(notification);
	}

	/**
	 * Event system for frontend integration
	 */
	on(event: string, callback: (data: EventData) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.push(callback);
		}
	}

	off(event: string, callback: (data: EventData) => void): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	private emit(event: string, data: EventData): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((callback) => callback(data));
		}
	}

	/**
	 * Check if we're runningin Tauri environment
	 */
	static isTauriEnvironment(): boolean {
		return (
			typeof window !== "undefined" &&
			(window.__TAURI__ !== undefined ||
				window.__TAURI_INTERNALS__ !== undefined)
		);
	}
}

// Export singleton instance
export const tauriNotifications = TauriNotificationService.getInstance();
