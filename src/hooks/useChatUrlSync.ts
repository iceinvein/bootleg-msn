import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useStore } from "@nanostores/react";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { $selectedChat } from "@/stores/contact";

/**
 * Synchronize selected chat with URL (?chat=contact:<userId> | group:<groupId>)
 * - URL -> State: On load or URL change, selects the chat referenced in ?chat
 * - State -> URL: When the selected chat changes anywhere, reflect it in ?chat
 * - Notification bridge: Listens for "notification-action" and opens chat via URL
 * - Mobile bridge: Listens for Capacitor events to navigate to chat/group
 */
export function useChatUrlSync() {
	const [searchParams, setSearchParams] = useSearchParams();
	const chatOnlyMode = (searchParams.get("window") ?? "") === "chat";
	const selectedChat = useStore($selectedChat);

	// Minimal data needed to resolve a chatId to objects
	const contacts = useQuery(api.contacts.getContacts);
	const groups = useQuery(api.groups.getUserGroups);

	// Cache last applied chat param to avoid redundant work/loops
	const lastAppliedChatParamRef = useRef<string | null>(null);
	// Suppress state->URL writes when we are applying URL->state to avoid loops
	const suppressStateToUrlRef = useRef<boolean>(false);

	const chatParam = searchParams.get("chat");

	const parsedChat = useMemo(() => {
		if (!chatParam)
			return null as null | { type: "contact" | "group"; id: string };
		// Accept both new (type:id) and backward-compat simple id (assume contact)
		const [maybeType, maybeId] = chatParam.split(":");
		if (maybeId) {
			if (maybeType === "contact" || maybeType === "group") {
				return { type: maybeType, id: maybeId } as const;
			}
		}
		// Fallback: treat as contact id
		return { type: "contact", id: chatParam } as const;
	}, [chatParam]);

	// URL -> State: open/close chat based on URL
	useEffect(() => {
		// Defer until data is ready
		if (parsedChat && !contacts && !groups) return;

		// If we already applied this exact param, skip
		const normalized = parsedChat
			? `${parsedChat.type}:${parsedChat.id}`
			: null;
		if (normalized === lastAppliedChatParamRef.current) return;

		if (!parsedChat) {
			// Clear selection if URL removed chat
			if (selectedChat?.contact || selectedChat?.group) {
				suppressStateToUrlRef.current = true;
				$selectedChat.set({ contact: null, group: null });
				// allow next microtask to clear the suppression
				setTimeout(() => {
					suppressStateToUrlRef.current = false;
				}, 0);
			}
			lastAppliedChatParamRef.current = null;
			return;
		}

		// Ensure necessary data is loaded for the specific type before resolving
		if (parsedChat.type === "group") {
			if (!groups) return; // wait until groups are loaded
			const group = groups?.find(
				(g) => g?._id === (parsedChat.id as unknown as Id<"groups">),
			);
			if (group) {
				if (selectedChat?.group?._id !== group._id) {
					suppressStateToUrlRef.current = true;
					$selectedChat.set({ contact: null, group });
					setTimeout(() => {
						suppressStateToUrlRef.current = false;
					}, 0);
				}
				lastAppliedChatParamRef.current = `group:${group._id}`;
			}
			return;
		}

		// contact case
		if (!contacts) return; // wait until contacts are loaded
		const contact = contacts?.find(
			(c) => c.contactUserId === (parsedChat.id as unknown as Id<"users">),
		);
		if (contact) {
			if (selectedChat?.contact?._id !== contact._id) {
				suppressStateToUrlRef.current = true;
				$selectedChat.set({ contact, group: null });
				setTimeout(() => {
					suppressStateToUrlRef.current = false;
				}, 0);
			}
			lastAppliedChatParamRef.current = `contact:${contact.contactUserId}`;
		}
	}, [parsedChat, contacts, groups, selectedChat]);

	// State -> URL: reflect selection in search params
	useEffect(() => {
		// If we are currently applying URL -> state, suppress state -> URL to avoid loops
		if (suppressStateToUrlRef.current) return;

		// If the URL already has a chat param that we haven't applied yet,
		// defer any state->URL writes to avoid wiping it before data loads.
		if (chatParam && lastAppliedChatParamRef.current !== chatParam) {
			return;
		}

		// Determine desired param from selection
		const nextParam = selectedChat?.group
			? `group:${selectedChat.group._id}`
			: selectedChat?.contact
				? `contact:${selectedChat.contact.contactUserId}`
				: null;

		// If already matches, no-op
		if (nextParam === (searchParams.get("chat") || null)) return;

		const next = new URLSearchParams(searchParams);
		if (nextParam) {
			next.set("chat", nextParam);
			// In chat-only windows, never push history entries; otherwise push
			setSearchParams(next, { replace: chatOnlyMode });
			lastAppliedChatParamRef.current = nextParam;
		} else {
			// Remove chat param
			next.delete("chat");
			setSearchParams(next, { replace: chatOnlyMode });
			lastAppliedChatParamRef.current = null;
		}
	}, [selectedChat, searchParams, setSearchParams, chatOnlyMode, chatParam]);

	// Listen for notification actions (from SW or direct notifications)
	useEffect(() => {
		const handleNotificationAction = (evt: Event) => {
			const { action, data } = (evt as CustomEvent).detail || {};
			if (action === "openChat" && data?.chatId) {
				const next = new URLSearchParams(searchParams);
				next.set("chat", String(data.chatId));
				setSearchParams(next, { replace: chatOnlyMode });
			}
		};

		// From browser-notifications fallback and SW bridge
		window.addEventListener(
			"notification-action",
			handleNotificationAction as EventListener,
		);

		return () => {
			window.removeEventListener(
				"notification-action",
				handleNotificationAction as EventListener,
			);
		};
	}, [searchParams, setSearchParams, chatOnlyMode]);

	// Bridge Service Worker messages -> window events for notification actions
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;

		const handler = (
			event: MessageEvent<{ type?: string; action?: string; data?: unknown }>,
		) => {
			const data = event?.data;
			if (data && data.type === "NOTIFICATION_ACTION") {
				// Normalize to the same window-level event our hook already handles
				const { action, data: detailData } = data as {
					action?: string;
					data?: unknown;
				};
				window.dispatchEvent(
					new CustomEvent("notification-action", {
						detail: { action, data: detailData },
					}) as Event,
				);
			}
		};

		navigator.serviceWorker.addEventListener(
			"message",
			handler as EventListener,
		);
		return () => {
			navigator.serviceWorker.removeEventListener(
				"message",
				handler as EventListener,
			);
		};
	}, []);

	// Listen for Capacitor mobile navigation events (native notification taps)
	useEffect(() => {
		const onNavigateToChat = (evt: Event) => {
			const { chatId } = (evt as CustomEvent).detail || {};
			if (!chatId) return;
			const next = new URLSearchParams(searchParams);
			next.set("chat", String(chatId));
			setSearchParams(next, { replace: chatOnlyMode });
		};
		const onNavigateToGroup = (evt: Event) => {
			const { groupId } = (evt as CustomEvent).detail || {};
			if (!groupId) return;
			const next = new URLSearchParams(searchParams);
			next.set("chat", `group:${String(groupId)}`);
			setSearchParams(next, { replace: chatOnlyMode });
		};

		window.addEventListener(
			"navigate-to-chat",
			onNavigateToChat as EventListener,
		);
		window.addEventListener(
			"navigate-to-group",
			onNavigateToGroup as EventListener,
		);

		return () => {
			window.removeEventListener(
				"navigate-to-chat",
				onNavigateToChat as EventListener,
			);
			window.removeEventListener(
				"navigate-to-group",
				onNavigateToGroup as EventListener,
			);
		};
	}, [searchParams, setSearchParams, chatOnlyMode]);
}
