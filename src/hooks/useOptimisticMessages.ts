import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useState } from "react";

// Type for optimistic messages
type OptimisticMessage = {
	_id: string; // Temporary ID for optimistic messages
	_creationTime: number;
	senderId: Id<"users">;
	receiverId?: Id<"users">;
	groupId?: Id<"groups">;
	content: string;
	messageType: "text" | "emoji" | "file" | "system";
	isRead: boolean;
	isEdited?: boolean;
	editedAt?: number;
	isDeleted?: boolean;
	deletedAt?: number;
	fileId?: Id<"_storage">;
	fileName?: string;
	fileType?: string;
	fileSize?: number;
	sender?: {
		_id: Id<"users">;
		name?: string;
		email?: string;
		image?: string;
	};
	isFromMe: boolean;
	// Optimistic-specific fields
	isOptimistic: true;
	isSending: boolean;
	sendError?: string;
};

type ServerMessage = FunctionReturnType<
	typeof api.unifiedMessages.getMessages
>[number];
export type CombinedMessage = ServerMessage | OptimisticMessage;

interface UseOptimisticMessagesProps {
	otherUserId?: Id<"users">;
	groupId?: Id<"groups">;
	currentUserId?: Id<"users">;
}

export function useOptimisticMessages({
	otherUserId,
	groupId,
	currentUserId,
}: UseOptimisticMessagesProps) {
	// Get server messages
	const serverMessages = useQuery(
		api.unifiedMessages.getMessages,
		otherUserId ? { otherUserId } : groupId ? { groupId } : "skip",
	);

	// Loading state: undefined means the first query result hasn't arrived yet
	const isLoading =
		otherUserId || groupId ? serverMessages === undefined : false;

	// Local optimistic messages state
	const [optimisticMessages, setOptimisticMessages] = useState<
		OptimisticMessage[]
	>([]);

	// Maintain a stable key mapping so server-confirmed messages re-use the
	// original optimistic message key and do not remount/animate.
	const [stableServerKeyById, setStableServerKeyById] = useState<
		Map<string, string>
	>(new Map());

	// Get current user info for optimistic messages
	const currentUser = useQuery(api.auth.loggedInUser);

	// Clean up confirmed optimistic messages AND record stable keys for their server counterparts
	useEffect(() => {
		if (!serverMessages) return;

		// Matching logic: server message must be the same content/sender,
		// created shortly AFTER the optimistic (allow small negative fuzz for clock skew),
		// and the optimistic must not be errored.
		const TOLERANCE_MS = 15000;
		const EARLY_FUZZ_MS = 2000;
		const isServerConfirmationMatch = (
			serverMsg: ServerMessage,
			optimistic: OptimisticMessage,
		) => {
			if (optimistic.sendError) return false;
			if (optimistic.content !== serverMsg.content) return false;
			if (optimistic.senderId !== serverMsg.senderId) return false;
			const dt = serverMsg._creationTime - optimistic._creationTime;
			return dt >= -EARLY_FUZZ_MS && dt <= TOLERANCE_MS;
		};

		// Build a new mapping from server IDs to their corresponding optimistic IDs
		setStableServerKeyById((prevMap) => {
			let changed = false;
			const nextMap = new Map(prevMap);

			for (const serverMsg of serverMessages) {
				const match = optimisticMessages.find((opt) =>
					isServerConfirmationMatch(serverMsg, opt),
				);
				if (match) {
					const serverKey = serverMsg._id as unknown as string;
					const prevVal = nextMap.get(serverKey);
					if (prevVal !== match._id) {
						nextMap.set(serverKey, match._id);
						changed = true;
					}
				}
			}

			// Prune stale server IDs not present anymore
			const currentServerIds = new Set(
				serverMessages.map((m) => m._id as unknown as string),
			);
			for (const [serverId] of nextMap) {
				if (!currentServerIds.has(serverId)) {
					nextMap.delete(serverId);
					changed = true;
				}
			}

			return changed ? nextMap : prevMap;
		});

		// Remove confirmed optimistic messages from local state
		setOptimisticMessages((prev) => {
			const filtered = prev.filter((optimistic) => {
				// Keep messages that have errors
				if (optimistic.sendError) {
					return true;
				}

				// Remove messages that have been confirmed by server
				const isConfirmed = serverMessages.some((serverMsg) =>
					isServerConfirmationMatch(serverMsg, optimistic),
				);

				return !isConfirmed;
			});

			// Avoid state updates when unchanged to prevent update loops
			if (filtered.length === prev.length) {
				return prev; // preserve reference, no re-render
			}
			return filtered;
		});
	}, [serverMessages, optimisticMessages]);

	// Combine server messages with optimistic messages
	const combinedMessages = useMemo((): CombinedMessage[] => {
		if (!serverMessages) return optimisticMessages;

		const TOLERANCE_MS = 15000;
		const EARLY_FUZZ_MS = 2000;
		const isServerConfirmationMatch = (
			serverMsg: ServerMessage,
			optimistic: OptimisticMessage,
		) => {
			if (optimistic.sendError) return false;
			if (optimistic.content !== serverMsg.content) return false;
			if (optimistic.senderId !== serverMsg.senderId) return false;
			const dt = serverMsg._creationTime - optimistic._creationTime;
			return dt >= -EARLY_FUZZ_MS && dt <= TOLERANCE_MS;
		};

		// Track which optimistic messages have been confirmed by server
		const confirmedOptimisticIds = new Set<string>();
		for (const serverMsg of serverMessages) {
			for (const optimistic of optimisticMessages) {
				if (isServerConfirmationMatch(serverMsg, optimistic)) {
					confirmedOptimisticIds.add(optimistic._id);
				}
			}
		}

		// Filter out confirmed optimistic messages (by optimistic id)
		const pendingOptimistic = optimisticMessages.filter(
			(optimistic) => !confirmedOptimisticIds.has(optimistic._id),
		);

		// Combine server messages with pending optimistic messages
		const combined = [
			// Attach a stable clientKey to server messages so they re-use the optimistic key when present
			...serverMessages.map((m) => {
				const clientKey = stableServerKeyById.get(m._id as unknown as string);
				return clientKey
					? ({ ...m, clientKey } as unknown as CombinedMessage)
					: m;
			}),
			...pendingOptimistic,
		];

		return combined.sort((a, b) => a._creationTime - b._creationTime);
	}, [serverMessages, optimisticMessages, stableServerKeyById]);

	// Add optimistic message
	const addOptimisticMessage = useCallback(
		(
			content: string,
			messageType: "text" | "emoji" | "file" | "system" = "text",
			fileData?: {
				fileId: Id<"_storage">;
				fileName: string;
				fileType: string;
				fileSize: number;
			},
		) => {
			if (!currentUserId || !currentUser) return null;

			const now = Date.now();

			// Create a more stable optimistic ID based on content and timestamp
			// This helps with consistency if the same message is sent multiple times
			const contentHash = content.slice(0, 10).replace(/\s/g, "");
			const optimisticId = `opt-${now}-${contentHash}-${Math.random().toString(36).substring(2, 7)}`;

			const optimisticMessage: OptimisticMessage = {
				_id: optimisticId,
				_creationTime: now,
				senderId: currentUserId,
				receiverId: otherUserId,
				groupId,
				content,
				messageType,
				isRead: false,
				...fileData,
				sender: {
					_id: currentUserId,
					name: currentUser.name,
					email: currentUser.email,
					image: currentUser.image,
				},
				isFromMe: true,
				isOptimistic: true,
				isSending: false, // Make it look like it's already sent to prevent animations
			};

			setOptimisticMessages((prev) => [...prev, optimisticMessage]);
			return optimisticId;
		},
		[currentUserId, currentUser, otherUserId, groupId],
	);

	// Mark optimistic message as sent successfully
	// The message will automatically disappear when server confirms it
	const markOptimisticMessageSent = useCallback((optimisticId: string) => {
		setOptimisticMessages((prev) =>
			prev.map((msg) =>
				msg._id === optimisticId ? { ...msg, isSending: false } : msg,
			),
		);
	}, []);

	// Mark optimistic message as failed
	const markOptimisticMessageFailed = useCallback(
		(optimisticId: string, error: string) => {
			setOptimisticMessages((prev) =>
				prev.map((msg) =>
					msg._id === optimisticId ? { ...msg, sendError: error } : msg,
				),
			);
		},
		[],
	);

	// Remove optimistic message (for retry or cancel)
	const removeOptimisticMessage = useCallback((optimisticId: string) => {
		setOptimisticMessages((prev) =>
			prev.filter((msg) => msg._id !== optimisticId),
		);
	}, []);

	// Retry failed optimistic message
	const retryOptimisticMessage = useCallback((optimisticId: string) => {
		setOptimisticMessages((prev) =>
			prev.map((msg) =>
				msg._id === optimisticId
					? { ...msg, isSending: true, sendError: undefined }
					: msg,
			),
		);
	}, []);

	return {
		messages: combinedMessages,
		isLoading,
		addOptimisticMessage,
		markOptimisticMessageSent,
		markOptimisticMessageFailed,
		removeOptimisticMessage,
		retryOptimisticMessage,
	};
}
