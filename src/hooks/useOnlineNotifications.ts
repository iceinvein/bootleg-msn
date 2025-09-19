import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { browserNotifications } from "@/lib/browser-notifications";

interface ContactStatus {
	contactId: string;
	status: string;
	name: string;
	lastSeen: number;
}

export function useOnlineNotifications() {
	// Get current contacts with their status
	const contacts = useQuery(api.contacts.getContacts);

	// Use refs to track previous statuses and processed sign-ins
	const previousStatusesRef = useRef<Map<string, ContactStatus>>(new Map());
	const processedSignInsRef = useRef<Set<string>>(new Set());

	// Play online sound
	const playOnlineSound = useCallback(() => {
		try {
			const audio = new Audio("/sounds/online.mp3");
			audio.volume = 0.6;

			// Handle both loading and playback errors gracefully
			audio.addEventListener("error", () => {
				console.warn("Online sound file not found or could not be loaded");
			});

			audio.play().catch((error) => {
				console.warn("Could not play online sound:", error);
			});
		} catch (error) {
			console.warn("Could not initialize online sound:", error);
		}
	}, []);

	// Process contact status changes
	useEffect(() => {
		if (!contacts || contacts.length === 0) {
			return;
		}

		const currentStatuses = new Map<string, ContactStatus>();
		const newSignIns: ContactStatus[] = [];

		// Build current status map and detect changes
		contacts.forEach((contact) => {
			if (!contact.user?._id) return;

			const contactStatus: ContactStatus = {
				contactId: contact.user._id,
				status: contact.status,
				name:
					contact.nickname ??
					contact.user.name ??
					contact.user.email ??
					"Unknown User",
				lastSeen: contact.lastSeen ?? Date.now(),
			};

			currentStatuses.set(contact.user._id, contactStatus);

			// Check if this is a new sign-in
			const previousStatus = previousStatusesRef.current.get(contact.user._id);

			if (previousStatus) {
				// Detect transition from offline to online
				const wasOffline = previousStatus.status === "offline";
				const isNowOnline = contact.status === "online";

				// Also check if they were offline for more than 30 seconds to avoid false positives
				const wasOfflineLongEnough =
					Date.now() - previousStatus.lastSeen > 30000;

				if (wasOffline && isNowOnline && wasOfflineLongEnough) {
					// Create a unique key for this sign-in event
					const signInKey = `${contact.user._id}-${contact.lastSeen}`;

					if (!processedSignInsRef.current.has(signInKey)) {
						newSignIns.push(contactStatus);
						processedSignInsRef.current.add(signInKey);
					}
				}
			}
		});

		// Update previous statuses for next comparison
		previousStatusesRef.current = currentStatuses;

		// Process new sign-ins
		if (newSignIns.length > 0) {
			newSignIns.forEach((contact) => {
				// Play sound
				playOnlineSound();

				// Show toast notification
				toast.success(`${contact.name} is now online`, {
					duration: 4000,
					description: "Your contact has signed in",
				});

				// Show browser notification
				browserNotifications
					.notifyContactOnline(contact.contactId, contact.name)
					.catch(console.warn);
			});
		}
	}, [contacts, playOnlineSound]); // React to contact changes

	// Clean up old processed sign-ins (keep only last hour)
	useEffect(() => {
		const cleanup = setInterval(
			() => {
				const oneHourAgo = Date.now() - 60 * 60 * 1000;
				const filtered = new Set<string>();

				processedSignInsRef.current.forEach((key) => {
					// Extract timestamp from key (format: userId-timestamp)
					const timestamp = parseInt(key.split("-").pop() || "0", 10);
					if (timestamp > oneHourAgo) {
						filtered.add(key);
					}
				});

				processedSignInsRef.current = filtered;
			},
			5 * 60 * 1000,
		); // Clean up every 5 minutes

		return () => clearInterval(cleanup);
	}, []);

	return {
		// Expose the play function for manual testing
		playOnlineSound,
	};
}
