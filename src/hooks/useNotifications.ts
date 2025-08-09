import { useCallback, useEffect, useState } from "react";
import {
	type NotificationPermission,
	type NotificationSettings,
	TauriNotificationService,
	tauriNotifications,
} from "@/lib/tauri-notifications";

export type UseNotificationsReturn = {
	// Permission management
	permission: NotificationPermission;
	requestPermission: () => Promise<NotificationPermission>;

	// Settings management
	settings: NotificationSettings | null;
	updateSettings: (settings: NotificationSettings) => Promise<void>;

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
	isLoading: boolean;
	error: string | null;
};

export function useNotifications(): UseNotificationsReturn {
	const [permission, setPermission] =
		useState<NotificationPermission>("denied");
	const [settings, setSettings] = useState<NotificationSettings | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const isSupported = TauriNotificationService.isTauriEnvironment();

	// Initialize notification service
	useEffect(() => {
		if (!isSupported) {
			setIsLoading(false);
			return;
		}

		const initialize = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Check current permission
				const currentPermission = await tauriNotifications.checkPermission();
				setPermission(currentPermission);

				// Load settings
				const currentSettings = await tauriNotifications.loadSettings();
				setSettings(currentSettings);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to initialize notifications",
				);
				console.error("Failed to initialize notifications:", err);
			} finally {
				setIsLoading(false);
			}
		};

		initialize();
	}, [isSupported]);

	// Request notification permission
	const requestPermission =
		useCallback(async (): Promise<NotificationPermission> => {
			if (!isSupported) {
				return "denied";
			}

			try {
				setError(null);
				const newPermission = await tauriNotifications.requestPermission();
				setPermission(newPermission);
				return newPermission;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to request permission";
				setError(errorMessage);
				console.error("Failed to request notification permission:", err);
				return "denied";
			}
		}, [isSupported]);

	// Update notification settings
	const updateSettings = useCallback(
		async (newSettings: NotificationSettings): Promise<void> => {
			if (!isSupported) {
				return;
			}

			try {
				setError(null);
				await tauriNotifications.saveSettings(newSettings);
				setSettings(newSettings);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to update settings";
				setError(errorMessage);
				console.error("Failed to update notification settings:", err);
				throw err;
			}
		},
		[isSupported],
	);

	// Notification methods
	const notifyNewMessage = useCallback(
		async (
			messageId: string,
			senderName: string,
			content: string,
			chatId: string,
			senderId: string,
		): Promise<void> => {
			if (!isSupported || permission !== "granted" || !settings?.enabled) {
				return;
			}

			try {
				await tauriNotifications.notifyNewMessage(
					messageId,
					senderName,
					content,
					chatId,
					senderId,
				);
			} catch (err) {
				console.error("Failed to show message notification:", err);
				// Don't throw here to avoid disrupting message flow
			}
		},
		[isSupported, permission, settings?.enabled],
	);

	const notifyContactRequest = useCallback(
		async (
			requestId: string,
			requesterName: string,
			requesterEmail: string,
		): Promise<void> => {
			if (!isSupported || permission !== "granted" || !settings?.enabled) {
				return;
			}

			try {
				await tauriNotifications.notifyContactRequest(
					requestId,
					requesterName,
					requesterEmail,
				);
			} catch (err) {
				console.error("Failed to show contact request notification:", err);
			}
		},
		[isSupported, permission, settings?.enabled],
	);

	const notifyGroupInvite = useCallback(
		async (
			inviteId: string,
			groupName: string,
			inviterName: string,
		): Promise<void> => {
			if (!isSupported || permission !== "granted" || !settings?.enabled) {
				return;
			}

			try {
				await tauriNotifications.notifyGroupInvite(
					inviteId,
					groupName,
					inviterName,
				);
			} catch (err) {
				console.error("Failed to show group invite notification:", err);
			}
		},
		[isSupported, permission, settings?.enabled],
	);

	const clearAllNotifications = useCallback(async (): Promise<void> => {
		if (!isSupported) {
			return;
		}

		try {
			await tauriNotifications.clearAllNotifications();
		} catch (err) {
			console.error("Failed to clear notifications:", err);
			throw err;
		}
	}, [isSupported]);

	return {
		permission,
		requestPermission,
		settings,
		updateSettings,
		notifyNewMessage,
		notifyContactRequest,
		notifyGroupInvite,
		clearAllNotifications,
		isSupported,
		isLoading,
		error,
	};
}
