// Tauri API integration for MSN Messenger
import { invoke } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type WindowConfig = {
	width: number;
	height: number;
	x?: number;
	y?: number;
	maximized: boolean;
	minimized: boolean;
};

export type TauriCommands = {
	create_chat_window: (chatId: string, contactName: string) => Promise<void>;
	close_chat_window: (chatId: string) => Promise<void>;
	minimize_to_tray: () => Promise<void>;
	restore_from_tray: () => Promise<void>;
	update_unread_count: (count: number) => Promise<void>;
	save_window_state: (
		windowLabel: string,
		config: WindowConfig,
	) => Promise<void>;
	load_window_state: (windowLabel: string) => Promise<WindowConfig | null>;
	handle_deep_links: (url: string) => Promise<void>;
};

// Wrapper functions for Tauri commands
export const tauriApi = {
	async createChatWindow(chatId: string, contactName: string): Promise<void> {
		return invoke("create_chat_window", { chatId, contactName });
	},

	async closeChatWindow(chatId: string): Promise<void> {
		return invoke("close_chat_window", { chatId });
	},

	async minimizeToTray(): Promise<void> {
		return invoke("minimize_to_tray");
	},

	async restoreFromTray(): Promise<void> {
		return invoke("restore_from_tray");
	},

	async updateUnreadCount(count: number): Promise<void> {
		return invoke("update_unread_count", { count });
	},

	async saveWindowState(
		windowLabel: string,
		config: WindowConfig,
	): Promise<void> {
		return invoke("save_window_state", { windowLabel, config });
	},

	async loadWindowState(windowLabel: string): Promise<WindowConfig | null> {
		return invoke("load_window_state", { windowLabel });
	},

	async handleDeepLinks(url: string): Promise<void> {
		return invoke("handle_deep_links", { url });
	},
};

// Window management utilities
export const windowManager = {
	async getCurrentWindowConfig(): Promise<WindowConfig> {
		const currentWindow = getCurrentWindow();
		const size = await currentWindow.innerSize();
		const position = await currentWindow.innerPosition();
		const isMaximized = await currentWindow.isMaximized();
		const isMinimized = await currentWindow.isMinimized();

		return {
			width: size.width,
			height: size.height,
			x: position.x,
			y: position.y,
			maximized: isMaximized,
			minimized: isMinimized,
		};
	},

	async saveCurrentWindowState(windowLabel: string): Promise<void> {
		const config = await this.getCurrentWindowConfig();
		await tauriApi.saveWindowState(windowLabel, config);
	},

	async restoreWindowState(windowLabel: string): Promise<void> {
		const config = await tauriApi.loadWindowState(windowLabel);
		if (config) {
			const currentWindow = getCurrentWindow();

			if (config.maximized) {
				await currentWindow.maximize();
			} else {
				await currentWindow.setSize(
					new LogicalSize(config.width, config.height),
				);
				if (config.x !== undefined && config.y !== undefined) {
					await currentWindow.setPosition(
						new LogicalPosition(config.x, config.y),
					);
				}
			}
		}
	},
};

// Event listeners for Tauri events
export const tauriEvents = {
	async onWindowClose(callback: () => void) {
		return listen("tauri://close-requested", callback);
	},

	async onWindowFocus(callback: () => void) {
		return listen("tauri://focus", callback);
	},

	async onWindowBlur(callback: () => void) {
		return listen("tauri://blur", callback);
	},

	async onDeepLink(callback: (url: string) => void) {
		return listen("deep-link", (event) => {
			callback(event.payload as string);
		});
	},
};

// Utility to check if running in Tauri (v2-focused)
export const isTauri = (): boolean => {
	if (typeof window === "undefined") return false;
	const w = window as unknown as Record<string, unknown>;
	// Tauri v2 internals or invoke bridge
	if ("__TAURI_INTERNALS__" in w) return true;
	const wAny = w as Record<string, unknown> & { __TAURI_INVOKE__?: unknown };
	if (typeof wAny.__TAURI_INVOKE__ === "function") return true;
	// Fallback: user agent (Tauri sets UA to contain "Tauri")
	return navigator?.userAgent?.includes?.("Tauri") || false;
};

// Platform detection
export const getPlatform = (): "windows" | "macos" | "linux" | "web" => {
	if (!isTauri()) return "web";
	const userAgent = navigator.userAgent.toLowerCase();
	if (userAgent.includes("win")) return "windows";
	if (userAgent.includes("mac")) return "macos";
	if (userAgent.includes("linux")) return "linux";
	return "web";
};
