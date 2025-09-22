import { useCallback, useEffect, useState } from "react";
import {
	type BrowserNotificationSettings,
	browserNotifications,
} from "../lib/browser-notifications";

export type UseBrowserNotificationsReturn = {
	// Permission management
	permission: NotificationPermission;
	requestPermission: () => Promise<NotificationPermission>;

	// Settings management
	settings: BrowserNotificationSettings;
	updateSettings: (settings: Partial<BrowserNotificationSettings>) => void;

	// Notification methods
	notifyNewMessage: (
		messageId: string,
		senderName: string,
		content: string,
		chatId: string,
		senderId: string,
	) => Promise<void>;
	notifyContactRequest: (
		requestId: string,
		requesterName: string,
		requesterEmail: string,
	) => Promise<void>;
	notifyGroupInvite: (
		inviteId: string,
		groupName: string,
		inviterName: string,
	) => Promise<void>;

	// Utility methods
	clearAllNotifications: () => Promise<void>;
	isSupported: boolean;
	canNotify: boolean;
	isBrowserEnvironment: boolean;
};

export function useBrowserNotifications(): UseBrowserNotificationsReturn {
	const [permission, setPermission] = useState<NotificationPermission>(
		browserNotifications.permission,
	);
	const [settings, setSettings] = useState<BrowserNotificationSettings>(
		browserNotifications.getSettings(),
	);

	// Update permission state when it changes
	useEffect(() => {
		const checkPermission = () => {
			setPermission(browserNotifications.permission);
		};

		// Check permission periodically (in case user changes it in browser settings)
		const interval = setInterval(checkPermission, 5000);

		return () => clearInterval(interval);
	}, []);

	// Listen for notification actions from service worker
	useEffect(() => {
		const handleNotificationAction = (event: CustomEvent) => {
			const { action, data } = event.detail;
			console.log("Notification action received:", action, data);

			// You can dispatch these to your app's routing/state management
			// For example, if using React Router:
			// navigate(`/chat/${data.chatId}`);
		};

		// Listen for service worker messages
		const handleServiceWorkerMessage = (event: MessageEvent) => {
			if (event.data?.type === "NOTIFICATION_ACTION") {
				handleNotificationAction(
					new CustomEvent("notification-action", {
						detail: { action: event.data.action, data: event.data.data },
					}),
				);
			}
		};

		window.addEventListener(
			"notification-action",
			handleNotificationAction as EventListener,
		);
		navigator.serviceWorker?.addEventListener(
			"message",
			handleServiceWorkerMessage,
		);

		return () => {
			window.removeEventListener(
				"notification-action",
				handleNotificationAction as EventListener,
			);
			navigator.serviceWorker?.removeEventListener(
				"message",
				handleServiceWorkerMessage,
			);
		};
	}, []);

	const requestPermission =
		useCallback(async (): Promise<NotificationPermission> => {
			const result = await browserNotifications.requestPermission();
			setPermission(result);
			return result;
		}, []);

	const updateSettings = useCallback(
		(newSettings: Partial<BrowserNotificationSettings>) => {
			browserNotifications.updateSettings(newSettings);
			setSettings(browserNotifications.getSettings());
		},
		[],
	);

	const notifyNewMessage = useCallback(
		async (
			messageId: string,
			senderName: string,
			content: string,
			chatId: string,
			senderId: string,
		): Promise<void> => {
			await browserNotifications.notifyNewMessage(
				messageId,
				senderName,
				content,
				chatId,
				senderId,
			);
		},
		[],
	);

	const notifyContactRequest = useCallback(
		async (
			requestId: string,
			requesterName: string,
			requesterEmail: string,
		): Promise<void> => {
			await browserNotifications.notifyContactRequest(
				requestId,
				requesterName,
				requesterEmail,
			);
		},
		[],
	);

	const notifyGroupInvite = useCallback(
		async (
			inviteId: string,
			groupName: string,
			inviterName: string,
		): Promise<void> => {
			await browserNotifications.notifyGroupInvite(
				inviteId,
				groupName,
				inviterName,
			);
		},
		[],
	);

	const clearAllNotifications = useCallback(async (): Promise<void> => {
		await browserNotifications.clearAllNotifications();
	}, []);

	return {
		permission,
		requestPermission,
		settings,
		updateSettings,
		notifyNewMessage,
		notifyContactRequest,
		notifyGroupInvite,
		clearAllNotifications,
		isSupported: browserNotifications.isSupported,
		canNotify: browserNotifications.canNotify,
		isBrowserEnvironment: browserNotifications.isBrowserEnvironment,
	};
}
