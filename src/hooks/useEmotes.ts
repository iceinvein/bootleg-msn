import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useEmotes() {
	const sendEmoteMutation = useMutation(api.emotes.sendEmote);
	const consumeEmoteMutation = useMutation(api.emotes.consumeEmote);

	const sendScreenCrack = async (toUserId: Id<"users">) => {
		await sendEmoteMutation({
			toUserId,
			emoteType: "screen_crack",
			conversationType: "direct",
		});
	};

	return {
		sendScreenCrack,
		consumeEmote: consumeEmoteMutation,
		// Consumers can call useQuery(api.emotes.getPendingEmoteForDirectChat, { otherUserId })
		usePendingForDirectChat(otherUserId?: Id<"users"> | undefined) {
			return useQuery(
				api.emotes.getPendingEmoteForDirectChat,
				otherUserId ? { otherUserId } : "skip",
			);
		},
	} as const;
}
