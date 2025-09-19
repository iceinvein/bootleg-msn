import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
	type ActionPerformed,
	type PushNotificationSchema,
	PushNotifications,
} from "@capacitor/push-notifications";

export type NotificationData = {
	chatId?: string;
	groupId?: string;
	messageId?: string;
	userId?: string;
	type?: "message" | "contact_request" | "group_invite" | "system";
	[key: string]: string | number | boolean | undefined;
};

export type MobileNotificationOptions = {
	title: string;
	body: string;
	id?: number;
	sound?: string;
	data?: NotificationData;
};

class MobileNotificationManager {
	private isNative = Capacitor.isNativePlatform();
	private initialized = false;

	async initialize() {
		if (!this.isNative || this.initialized) return;

		try {
			// Request permissions
			const localPermission = await LocalNotifications.requestPermissions();
			const pushPermission = await PushNotifications.requestPermissions();

			if (localPermission.display === "granted") {
				console.log("Local notifications permission granted");
			}

			if (pushPermission.receive === "granted") {
				console.log("Push notifications permission granted");

				// Register for push notifications
				await PushNotifications.register();

				// Listen for registration
				PushNotifications.addListener("registration", (token) => {
					console.log("Push registration success, token: ", token.value);
					// Send token to your backend server
					this.sendTokenToServer(token.value);
				});

				// Listen for registration errors
				PushNotifications.addListener("registrationError", (error) => {
					console.error("Push registration error: ", error);
				});

				// Listen for push notifications
				PushNotifications.addListener(
					"pushNotificationReceived",
					(notification) => {
						console.log("Push notification received: ", notification);
						// Handle foreground notification
						this.handleForegroundNotification(notification);
					},
				);

				// Listen for notification actions
				PushNotifications.addListener(
					"pushNotificationActionPerformed",
					(notification) => {
						console.log("Push notification action performed: ", notification);
						// Handle notification tap
						this.handleNotificationAction(notification);
					},
				);
			}

			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize mobile notifications:", error);
		}
	}

	async showLocalNotification(options: MobileNotificationOptions) {
		if (!this.isNative) {
			// Fallback to web notifications or toast
			this.showWebNotification(options);
			return;
		}

		try {
			await LocalNotifications.schedule({
				notifications: [
					{
						id: options.id ?? Date.now(),
						title: options.title,
						body: options.body,
						sound: options.sound ?? "beep.wav",
						extra: options.data,
						iconColor: "#0078d4",
						smallIcon: "ic_stat_icon_config_sample",
					},
				],
			});
		} catch (error) {
			console.error("Failed to show local notification:", error);
		}
	}

	async clearAllNotifications() {
		if (!this.isNative) return;

		try {
			await LocalNotifications.removeAllDeliveredNotifications();
		} catch (error) {
			console.error("Failed to clear notifications:", error);
		}
	}

	async setBadgeCount(count: number) {
		if (!this.isNative) return;

		try {
			// This would require a badge plugin or custom implementation
			console.log("Setting badge count to:", count);
		} catch (error) {
			console.error("Failed to set badge count:", error);
		}
	}

	private async sendTokenToServer(token: string) {
		try {
			// Send the token to your Convex backend
			// This would be implemented when push notifications are fully set up
			console.log("Would send token to server:", token);
		} catch (error) {
			console.error("Failed to send token to server:", error);
		}
	}

	private handleForegroundNotification(notification: PushNotificationSchema) {
		// Show a local notification when app is in foreground
		this.showLocalNotification({
			title: notification.title ?? "New Message",
			body: notification.body ?? "You have a new message",
			data: notification.data as NotificationData,
		});
	}

	private handleNotificationAction(notification: ActionPerformed) {
		// Handle notification tap - navigate to appropriate screen
		const data = notification.notification.data as NotificationData;

		if (data?.chatId) {
			// Navigate to chat
			window.dispatchEvent(
				new CustomEvent("navigate-to-chat", {
					detail: { chatId: data.chatId },
				}),
			);
		} else if (data?.groupId) {
			// Navigate to group
			window.dispatchEvent(
				new CustomEvent("navigate-to-group", {
					detail: { groupId: data.groupId },
				}),
			);
		}
	}

	private showWebNotification(options: MobileNotificationOptions) {
		// Use the browser notifications service for better integration
		import("./browser-notifications")
			.then(({ browserNotifications }) => {
				browserNotifications.showNotification({
					title: options.title,
					body: options.body,
					icon: "/icon-192.png",
					data: options.data,
					tag: options.id?.toString(),
				});
			})
			.catch(() => {
				// Fallback to basic notification if browser-notifications fails
				if ("Notification" in window && Notification.permission === "granted") {
					new Notification(options.title, {
						body: options.body,
						icon: "/icon-192.png",
						data: options.data,
					});
				} else {
					// Show toast notification as fallback
					console.log("Web notification:", options.title, options.body);
				}
			});
	}
}

export const mobileNotifications = new MobileNotificationManager();
