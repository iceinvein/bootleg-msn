import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { browserNotifications } from "@/lib/browser-notifications";

type ReceivedNudge = FunctionReturnType<
	typeof api.nudges.getReceivedNudges
>[number];

export type UseNudgeReturn = {
	// Send nudge
	sendNudge: (
		toUserId: Id<"users">,
		nudgeType?: "nudge" | "buzz",
	) => Promise<void>;
	canSendNudge: (toUserId: Id<"users">) => Promise<boolean>;

	// Nudge state
	isSending: boolean;
	cooldownRemaining: number;

	// Shake animation
	triggerShake: () => void;
	isShaking: boolean;

	// Recent nudges
	recentNudges: ReceivedNudge[];
};

export function useNudge(): UseNudgeReturn {
	const [isSending, setIsSending] = useState(false);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);
	const [isShaking, setIsShaking] = useState(false);

	const isMobile = useMediaQuery("(max-width: 768px)");
	// Use DOM timer IDs to avoid NodeJS.Timeout type mismatches in browser
	const cooldownIntervalRef = useRef<number | null>(null);
	const shakeTimeoutRef = useRef<number | null>(null);

	// Mutations and queries
	const sendNudgeMutation = useMutation(api.nudges.sendNudge);
	const convex = useConvex();

	// Use a stable timestamp for the query to avoid constant re-renders
	const [queryTimestamp] = useState(() => Date.now() - 5 * 60 * 1000); // Last 5 minutes from hook creation

	const recentNudges =
		(useQuery(api.nudges.getReceivedNudges, {
			limit: 10,
			since: queryTimestamp,
		}) as ReceivedNudge[] | undefined) ?? ([] as ReceivedNudge[]);

	// Play nudge sound
	const playNudgeSound = useCallback(() => {
		try {
			const settings = browserNotifications.getSettings();
			if (!settings.sound) return;
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
		shakeTimeoutRef.current = window.setTimeout(
			() => {
				setIsShaking(false);
			},
			isMobile ? 600 : 800,
		);
	}, [isShaking, isMobile, playNudgeSound]);

	// Send nudge function
	const sendNudge = useCallback(
		async (toUserId: Id<"users">, nudgeType: "nudge" | "buzz" = "nudge") => {
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
		async (toUserId: Id<"users">): Promise<boolean> => {
			try {
				const result = await convex.query(api.nudges.canSendNudgeToUser, {
					toUserId,
				});
				return result?.canSend ?? false;
			} catch (error) {
				console.error("Failed to check nudge availability:", error);
				return false;
			}
		},
		[convex],
	);

	// Handle cooldown timer
	useEffect(() => {
		if (cooldownRemaining > 0) {
			cooldownIntervalRef.current = window.setInterval(() => {
				setCooldownRemaining((prev) => {
					if (prev <= 1) {
						if (cooldownIntervalRef.current) {
							window.clearInterval(cooldownIntervalRef.current);
						}
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (cooldownIntervalRef.current) {
				window.clearInterval(cooldownIntervalRef.current);
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
				const senderDisplayName =
					latestNudge.fromUser.name ||
					latestNudge.fromUser.email ||
					"Unknown User";
				toast.info(
					`${senderDisplayName} sent you a ${latestNudge.nudgeType}!`,
					{
						duration: 3000,
					},
				);

				// Show browser notification
				const senderName =
					latestNudge.fromUser.name ||
					latestNudge.fromUser.email ||
					"Unknown User";
				const chatIdString =
					latestNudge.conversationId ??
					(latestNudge.fromUserId as unknown as string);
				browserNotifications
					.notifyNudge(
						String(latestNudge._id as unknown as string),
						senderName,
						latestNudge.nudgeType,
						chatIdString,
						String(latestNudge.fromUserId as unknown as string),
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
				window.clearTimeout(shakeTimeoutRef.current);
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
