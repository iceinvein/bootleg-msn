import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { browserNotifications } from "@/lib/browser-notifications";

export interface NudgeData {
	_id: string;
	fromUserId: string;
	toUserId: string;
	nudgeType: "nudge" | "buzz";
	conversationId?: string;
	conversationType: "direct" | "group";
	createdAt: number;
	fromUser: {
		_id: string;
		name: string;
		image?: string;
	};
}

export interface UseNudgeReturn {
	// Send nudge
	sendNudge: (toUserId: string, nudgeType?: "nudge" | "buzz") => Promise<void>;
	canSendNudge: (toUserId: string) => Promise<boolean>;

	// Nudge state
	isSending: boolean;
	cooldownRemaining: number;

	// Shake animation
	triggerShake: () => void;
	isShaking: boolean;

	// Recent nudges
	recentNudges: NudgeData[];
}

export function useNudge(): UseNudgeReturn {
	const [isSending, setIsSending] = useState(false);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);
	const [isShaking, setIsShaking] = useState(false);

	const isMobile = useMediaQuery("(max-width: 768px)");
	const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Mutations and queries
	const sendNudgeMutation = useMutation(api.nudges.sendNudge);
	const canSendNudgeQuery = useMutation(api.nudges.canSendNudge);

	// Use a stable timestamp for the query to avoid constant re-renders
	const [queryTimestamp] = useState(() => Date.now() - 5 * 60 * 1000); // Last 5 minutes from hook creation

	const recentNudges =
		useQuery(api.nudges.getReceivedNudges, {
			limit: 10,
			since: queryTimestamp,
		}) || [];

	// Play nudge sound
	const playNudgeSound = useCallback(() => {
		try {
			const audio = new Audio("/sounds/nudge.mp3");
			audio.volume = 0.5;

			// Handle both loading and playback errors gracefully
			audio.addEventListener("error", () => {
				console.warn("Nudge sound file not found or could not be loaded");
			});

			audio.play().catch((error) => {
				console.warn("Could not play nudge sound:", error);
			});
		} catch (error) {
			console.warn("Could not initialize nudge sound:", error);
		}
	}, []);

	// Trigger shake animation
	const triggerShake = useCallback(() => {
		if (isShaking) return; // Prevent multiple shakes

		setIsShaking(true);
		playNudgeSound();

		// Clear existing timeout
		if (shakeTimeoutRef.current) {
			clearTimeout(shakeTimeoutRef.current);
		}

		// Stop shaking after animation duration
		shakeTimeoutRef.current = setTimeout(
			() => {
				setIsShaking(false);
			},
			isMobile ? 600 : 800,
		);
	}, [isShaking, isMobile, playNudgeSound]);

	// Send nudge function
	const sendNudge = useCallback(
		async (toUserId: string, nudgeType: "nudge" | "buzz" = "nudge") => {
			if (isSending) return;

			try {
				setIsSending(true);

				const nudgeId = await sendNudgeMutation({
					toUserId,
					nudgeType,
					conversationType: "direct",
				});

				if (nudgeId) {
					// Start cooldown timer
					setCooldownRemaining(30);

					toast.success(`${nudgeType === "buzz" ? "Buzz" : "Nudge"} sent!`, {
						duration: 2000,
					});
				}
			} catch (error) {
				console.error("Failed to send nudge:", error);
				toast.error(
					error instanceof Error ? error.message : "Failed to send nudge",
				);
			} finally {
				setIsSending(false);
			}
		},
		[isSending, sendNudgeMutation],
	);

	// Check if can send nudge
	const canSendNudge = useCallback(
		async (toUserId: string): Promise<boolean> => {
			try {
				const result = await canSendNudgeQuery({ toUserId });
				return result?.canSend ?? false;
			} catch (error) {
				console.error("Failed to check nudge cooldown:", error);
				return false;
			}
		},
		[canSendNudgeQuery],
	);

	// Handle cooldown timer
	useEffect(() => {
		if (cooldownRemaining > 0) {
			cooldownIntervalRef.current = setInterval(() => {
				setCooldownRemaining((prev) => {
					if (prev <= 1) {
						if (cooldownIntervalRef.current) {
							clearInterval(cooldownIntervalRef.current);
						}
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (cooldownIntervalRef.current) {
				clearInterval(cooldownIntervalRef.current);
			}
		};
	}, [cooldownRemaining]);

	// Track processed nudges to avoid duplicate processing
	const [processedNudgeIds, setProcessedNudgeIds] = useState<Set<string>>(
		new Set(),
	);

	// Listen for incoming nudges and trigger shake
	useEffect(() => {
		if (recentNudges.length > 0) {
			const latestNudge = recentNudges[0];

			// Skip if we've already processed this nudge
			if (processedNudgeIds.has(latestNudge._id)) {
				return;
			}

			const nudgeTime = latestNudge.createdAt;

			// Only trigger shake for very recent nudges (within last 30 seconds)
			if (Date.now() - nudgeTime < 30000) {
				// Mark as processed first to prevent re-processing
				setProcessedNudgeIds((prev) => new Set([...prev, latestNudge._id]));

				triggerShake();
				playNudgeSound();

				// Show toast notification
				toast.info(
					`${latestNudge.fromUser.name} sent you a ${latestNudge.nudgeType}!`,
					{
						duration: 3000,
					},
				);

				// Show browser notification
				browserNotifications
					.notifyNudge(
						latestNudge._id,
						latestNudge.fromUser.name,
						latestNudge.nudgeType,
						latestNudge.conversationId || latestNudge.fromUserId,
						latestNudge.fromUserId,
					)
					.catch(console.warn);
			}
		}
	}, [recentNudges, processedNudgeIds, triggerShake, playNudgeSound]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (cooldownIntervalRef.current) {
				clearInterval(cooldownIntervalRef.current);
			}
			if (shakeTimeoutRef.current) {
				clearTimeout(shakeTimeoutRef.current);
			}
		};
	}, []);

	return {
		sendNudge,
		canSendNudge,
		isSending,
		cooldownRemaining,
		triggerShake,
		isShaking,
		recentNudges,
	};
}
