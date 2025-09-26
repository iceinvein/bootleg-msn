import { useCallback, useEffect, useState } from "react";
import {
	getPlatform,
	isTauri,
	tauriApi,
	tauriEvents,
	windowManager,
} from "@/lib/tauri";

import { normalizeChatId } from "@/utils/chatId";

export type Platform = "windows" | "macos" | "linux" | "web";

export const useTauri = () => {
	const [isReady, setIsReady] = useState(false);
	const [platform, setPlatform] = useState<Platform>("web");

	useEffect(() => {
		if (isTauri()) {
			setPlatform(getPlatform());
			setIsReady(true);
		} else {
			setIsReady(true);
		}
	}, []);

	return {
		isReady,
		isTauri: isTauri(),
		platform,
		api: tauriApi,
		events: tauriEvents,
		windowManager,
	};
};

export const useWindowState = (windowLabel: string) => {
	const { windowManager: wm, isTauri: isTauriApp } = useTauri();

	const saveState = useCallback(async () => {
		if (isTauriApp) {
			await wm.saveCurrentWindowState(windowLabel);
		}
	}, [isTauriApp, wm, windowLabel]);

	const restoreState = useCallback(async () => {
		if (isTauriApp) {
			await wm.restoreWindowState(windowLabel);
		}
	}, [isTauriApp, wm, windowLabel]);

	useEffect(() => {
		if (isTauriApp) {
			// Restore window state on mount
			restoreState();

			// Save window state on unmount
			return () => {
				saveState();
			};
		}
	}, [isTauriApp, restoreState, saveState]);

	return { saveState, restoreState };
};

export const useUnreadCount = () => {
	const { api, isTauri: isTauriApp } = useTauri();

	const updateUnreadCount = useCallback(
		async (count: number) => {
			if (isTauriApp) {
				await api.updateUnreadCount(count);
			}
		},
		[api, isTauriApp],
	);

	return { updateUnreadCount };
};

export const useChatWindows = () => {
	const { api, isTauri: isTauriApp } = useTauri();

	const openChatWindow = useCallback(
		async (chatId: string, contactName: string) => {
			const normalized = normalizeChatId(chatId);
			if (isTauriApp) {
				await api.createChatWindow(normalized, contactName);
			} else {
				// Fallback for web - open a new tab in chat-only mode using our URL contract
				const url = `/?chat=${encodeURIComponent(normalized)}&window=chat`;
				window.open(url, "_blank");
			}
		},
		[api, isTauriApp],
	);

	const closeChatWindow = useCallback(
		async (chatId: string) => {
			if (isTauriApp) {
				const normalized = normalizeChatId(chatId);
				await api.closeChatWindow(normalized);
			}
		},
		[api, isTauriApp],
	);

	return { openChatWindow, closeChatWindow };
};

export const useSystemTray = () => {
	const { api, isTauri: isTauriApp } = useTauri();

	const minimizeToTray = useCallback(async () => {
		if (isTauriApp) {
			await api.minimizeToTray();
		}
	}, [api, isTauriApp]);

	const restoreFromTray = useCallback(async () => {
		if (isTauriApp) {
			await api.restoreFromTray();
		}
	}, [api, isTauriApp]);

	return { minimizeToTray, restoreFromTray };
};

export const useDeepLinks = () => {
	const { api, events, isTauri: isTauriApp } = useTauri();

	const handleDeepLink = useCallback(
		async (url: string) => {
			if (isTauriApp) {
				await api.handleDeepLinks(url);
			}
		},
		[api, isTauriApp],
	);

	useEffect(() => {
		if (isTauriApp) {
			const unlisten = events.onDeepLink(handleDeepLink);
			return () => {
				unlisten.then((fn) => fn());
			};
		}
	}, [events, handleDeepLink, isTauriApp]);

	return { handleDeepLink };
};
