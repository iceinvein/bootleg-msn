/**
 * Browser Desktop Notifications Service
 * Handles system notifications for web browsers (Chrome, Firefox, Safari, etc.)
 * Works alongside existing toast notifications
 */

export interface BrowserNotificationData {
	action?: string;
	messageId?: string;
	chatId?: string;
	senderId?: string;
	requestId?: string;
	requesterEmail?: string;
	inviteId?: string;
	groupName?: string;
	[key: string]: unknown;
}

export interface BrowserNotificationOptions {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	tag?: string;
	data?: BrowserNotificationData;
	requireInteraction?: boolean;
	silent?: boolean;
	actions?: Array<{
		action: string;
		title: string;
		icon?: string;
	}>;
}

export interface BrowserNotificationSettings {
	enabled: boolean;
	showPreview: boolean;
	suppressWhenFocused: boolean;
	sound: boolean;
	quietHoursEnabled: boolean;
	quietHoursStart?: string;
	quietHoursEnd?: string;
}

class BrowserNotificationService {
	private settings: BrowserNotificationSettings = {
		enabled: true,
		showPreview: true,
		suppressWhenFocused: false, // Changed default to false for better UX
		sound: true,
		quietHoursEnabled: false,
	};

	private readonly STORAGE_KEY = "browser-notification-settings";
	private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

	constructor() {
		this.loadSettings();
		this.initializeServiceWorker();
	}

	/**
	 * Check if browser notifications are supported
	 */
	get isSupported(): boolean {
		return "Notification" in window;
	}

	/**
	 * Check if we're in a browser environment (not Tauri)
	 */
	get isBrowserEnvironment(): boolean {
		return typeof window !== "undefined" && !window.__TAURI__;
	}

	/**
	 * Get current notification permission
	 */
	get permission(): NotificationPermission {
		return this.isSupported ? Notification.permission : "denied";
	}

	/**
	 * Check if notifications can be shown
	 */
	get canNotify(): boolean {
		return (
			this.isBrowserEnvironment &&
			this.isSupported &&
			this.permission === "granted" &&
			this.settings.enabled
		);
	}

	/**
	 * Request notification permission
	 */
	async requestPermission(): Promise<NotificationPermission> {
		if (!this.isSupported) {
			return "denied";
		}

		if (this.permission === "granted") {
			return "granted";
		}

		try {
			const permission = await Notification.requestPermission();
			return permission;
		} catch (error) {
			console.error("Failed to request notification permission:", error);
			return "denied";
		}
	}

	/**
	 * Initialize service worker for better notification handling
	 */
	private async initializeServiceWorker() {
		if (!("serviceWorker" in navigator)) {
			return;
		}

		try {
			// Register service worker if it doesn't exist
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				this.serviceWorkerRegistration = registration;
			} else {
				// Register the service worker
				this.serviceWorkerRegistration =
					await navigator.serviceWorker.register("/sw.js");
				console.log("Service worker registered successfully");
			}
		} catch (error) {
			console.warn("Service worker registration failed:", error);
			// Continue without service worker
		}
	}

	/**
	 * Show a browser notification
	 */
	async showNotification(options: BrowserNotificationOptions): Promise<void> {
		if (!this.canNotify) {
			return;
		}

		// Check if window is focused and suppression is enabled
		if (this.settings.suppressWhenFocused && document.hasFocus()) {
			return;
		}

		// Check quiet hours
		if (this.isQuietHours()) {
			return;
		}

		const notificationOptions: NotificationOptions = {
			body: this.settings.showPreview ? options.body : "New message",
			icon: options.icon || "/icon-192.png",
			badge: options.badge || "/badge-72.png",
			tag: options.tag,
			data: options.data,
			requireInteraction: options.requireInteraction || false,
			silent: options.silent || !this.settings.sound,
		};

		try {
			let notification: Notification;

			// Use service worker if available for better reliability
			if (this.serviceWorkerRegistration) {
				await this.serviceWorkerRegistration.showNotification(
					options.title,
					notificationOptions,
				);
			} else {
				// Fallback to regular notification
				notification = new Notification(options.title, notificationOptions);

				// Handle click events
				notification.onclick = (event) => {
					event.preventDefault();
					window.focus();
					notification.close();

					// Handle custom data if provided
					if (options.data?.action) {
						this.handleNotificationAction(options.data.action, options.data);
					}
				};

				// Auto-close after 5 seconds unless requireInteraction is true
				if (!options.requireInteraction) {
					setTimeout(() => {
						notification.close();
					}, 5000);
				}
			}
		} catch (error) {
			console.error("Failed to show browser notification:", error);
		}
	}

	/**
	 * Show notification for new message
	 */
	async notifyNewMessage(
		messageId: string,
		senderName: string,
		content: string,
		chatId: string,
		senderId: string,
	): Promise<void> {
		await this.showNotification({
			title: `New message from ${senderName}`,
			body: content,
			tag: `message-${chatId}`, // Replaces previous notifications from same chat
			data: {
				action: "openChat",
				messageId,
				chatId,
				senderId,
			},
			requireInteraction: false,
		});
	}

	/**
	 * Show notification for contact request
	 */
	async notifyContactRequest(
		requestId: string,
		requesterName: string,
		requesterEmail: string,
	): Promise<void> {
		await this.showNotification({
			title: "New Contact Request",
			body: `${requesterName} (${requesterEmail}) wants to add you as a contact`,
			tag: `contact-request-${requestId}`,
			data: {
				action: "openContactRequests",
				requestId,
				requesterEmail,
			},
			requireInteraction: true,
			actions: [
				{
					action: "accept",
					title: "Accept",
				},
				{
					action: "decline",
					title: "Decline",
				},
			],
		});
	}

	/**
	 * Show notification for group invite
	 */
	async notifyGroupInvite(
		inviteId: string,
		groupName: string,
		inviterName: string,
	): Promise<void> {
		await this.showNotification({
			title: "Group Invitation",
			body: `${inviterName} invited you to join "${groupName}"`,
			tag: `group-invite-${inviteId}`,
			data: {
				action: "openGroupInvites",
				inviteId,
				groupName,
			},
			requireInteraction: true,
		});
	}

	/**
	 * Show notification for nudge
	 */
	async notifyNudge(
		nudgeId: string,
		senderName: string,
		nudgeType: "nudge" | "buzz",
		chatId: string,
		senderId: string,
	): Promise<void> {
		await this.showNotification({
			title: `${senderName} sent you a ${nudgeType}!`,
			body: nudgeType === "buzz" ? "Bzzzz! 📳" : "Hey! Pay attention! 👋",
			tag: `nudge-${chatId}`, // Replaces previous nudge notifications from same chat
			data: {
				action: "openChat",
				nudgeId,
				chatId,
				senderId,
			},
			requireInteraction: false,
			silent: false, // Always play sound for nudges
		});
	}

	/**
	 * Show notification for contact coming online
	 */
	async notifyContactOnline(
		contactId: string,
		contactName: string,
	): Promise<void> {
		await this.showNotification({
			title: `${contactName} is now online`,
			body: "Your contact has signed in",
			tag: `online-${contactId}`, // Replaces previous online notifications from same contact
			data: {
				action: "openChat",
				chatId: contactId,
				senderId: contactId,
			},
			requireInteraction: false,
			silent: false, // Play sound for sign-in notifications
		});
	}

	/**
	 * Handle notification actions
	 */
	private handleNotificationAction(
		action: string,
		data: BrowserNotificationData,
	) {
		switch (action) {
			case "openChat":
				// Emit custom event that the app can listen to
				window.dispatchEvent(
					new CustomEvent("notification-action", {
						detail: { action, data },
					}),
				);
				break;
			case "openContactRequests":
			case "openGroupInvites":
				window.dispatchEvent(
					new CustomEvent("notification-action", {
						detail: { action, data },
					}),
				);
				break;
			default:
				console.log("Unknown notification action:", action);
		}
	}

	/**
	 * Check if current time is within quiet hours
	 */
	private isQuietHours(): boolean {
		if (
			!this.settings.quietHoursEnabled ||
			!this.settings.quietHoursStart ||
			!this.settings.quietHoursEnd
		) {
			return false;
		}

		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();

		const [startHour, startMin] = this.settings.quietHoursStart
			.split(":")
			.map(Number);
		const [endHour, endMin] = this.settings.quietHoursEnd
			.split(":")
			.map(Number);

		const startTime = startHour * 60 + startMin;
		const endTime = endHour * 60 + endMin;

		if (startTime <= endTime) {
			// Same day range
			return currentTime >= startTime && currentTime <= endTime;
		} else {
			// Overnight range
			return currentTime >= startTime || currentTime <= endTime;
		}
	}

	/**
	 * Update notification settings
	 */
	updateSettings(newSettings: Partial<BrowserNotificationSettings>): void {
		this.settings = { ...this.settings, ...newSettings };
		this.saveSettings();
	}

	/**
	 * Get current settings
	 */
	getSettings(): BrowserNotificationSettings {
		return { ...this.settings };
	}

	/**
	 * Load settings from localStorage
	 */
	private loadSettings(): void {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				this.settings = { ...this.settings, ...JSON.parse(stored) };
			}
		} catch (error) {
			console.warn("Failed to load notification settings:", error);
		}
	}

	/**
	 * Save settings to localStorage
	 */
	private saveSettings(): void {
		try {
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
		} catch (error) {
			console.warn("Failed to save notification settings:", error);
		}
	}

	/**
	 * Clear all notifications (if supported)
	 */
	async clearAllNotifications(): Promise<void> {
		if (this.serviceWorkerRegistration) {
			try {
				const notifications =
					await this.serviceWorkerRegistration.getNotifications();
				for (const notification of notifications) {
					notification.close();
				}
			} catch (error) {
				console.warn("Failed to clear notifications:", error);
			}
		}
	}
}

// Export singleton instance
export const browserNotifications = new BrowserNotificationService();
