import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { CombinedMessage } from "@/hooks/useOptimisticMessages";
import { cn } from "@/lib/utils";
import { Message } from "../Message";
import { NudgeMessage } from "../NudgeMessage";
import { TypingIndicator } from "../TypingIndicator";
import { ChatMessagesSkeleton } from "../ui/loading";
import { ScrollArea } from "../ui/scroll-area";

// Use the exact type that useOptimisticMessages returns
export type ChatMessage = CombinedMessage;

// Minimal type for ConversationNudge to avoid importing API types here
export type ConversationNudge = {
	_id: string;
	fromUser?: { name?: string; email?: string } | null;
	nudgeType: "nudge" | "buzz";
	createdAt: number;
	isFromMe?: boolean;
};

export interface ChatMessagesProps {
	messages: ChatMessage[] | undefined;
	isLoading: boolean;
	conversationNudges?: ConversationNudge[] | undefined;
	selectedChat: {
		contact: {
			nickname?: string;
			user?: { name?: string; email?: string } | null;
		} | null;
		group: { name: string } | null;
	} | null;
	contactIsTyping?: boolean;
	groupIsTyping?:
		| Array<{ _id: string; user?: { name?: string; email?: string } | null }>
		| undefined;
}

export function ChatMessages({
	messages,
	isLoading,
	conversationNudges,
	selectedChat,
	contactIsTyping,
	groupIsTyping,
}: ChatMessagesProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const combined = useMemo(() => {
		type CombinedItem =
			| { type: "nudge"; time: number; data: ConversationNudge }
			| { type: "message"; time: number; data: ChatMessage };

		const nudgeItems: CombinedItem[] = (conversationNudges ?? []).map((n) => ({
			type: "nudge",
			time: n.createdAt,
			data: n,
		}));
		const messageItems: CombinedItem[] = (messages ?? []).map((m) => ({
			type: "message",
			time: m._creationTime,
			data: m as ChatMessage,
		}));
		return [...messageItems, ...nudgeItems].sort((a, b) => a.time - b.time);
	}, [conversationNudges, messages]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: we want to scroll to the end when the number of items changes
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [combined.length]);

	return (
		<div className="chat-messages-container">
			<ScrollArea className="h-full p-3 md:p-4">
				<div className="space-y-1">
					{isLoading && (
						<ChatMessagesSkeleton
							variant={selectedChat?.group ? "group" : "dm"}
						/>
					)}

					{!isLoading && (!messages || messages.length === 0) && (
						<div className="py-8 text-center text-gray-500">
							<MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-400 opacity-50 md:h-12 md:w-12 dark:text-gray-500" />
							<p className="text-sm md:text-base">
								Start a conversation with{" "}
								{selectedChat?.contact?.nickname ||
									selectedChat?.contact?.user?.name ||
									selectedChat?.contact?.user?.email ||
									selectedChat?.group?.name}
							</p>
						</div>
					)}

					{combined.map((item, idx) => {
						if (item.type === "nudge") {
							const n = item.data as ConversationNudge;
							return (
								<div key={`nudge-${n._id}`} className="mt-6 md:mt-8">
									<NudgeMessage
										senderName={n.fromUser?.name ?? "Unknown User"}
										nudgeType={n.nudgeType}
										timestamp={n.createdAt}
										isOwn={Boolean(n.isFromMe)}
									/>
								</div>
							);
						}

						// Compute consecutive vs previous message in combined list
						let prevMsg: ChatMessage | null = null;
						for (let j = idx - 1; j >= 0; j--) {
							if (combined[j].type === "message") {
								prevMsg = combined[j].data as ChatMessage;
								break;
							}
						}
						const m = item.data as ChatMessage;
						const isConsecutive = Boolean(
							prevMsg &&
								prevMsg.senderId === m.senderId &&
								m._creationTime - prevMsg._creationTime < 5 * 60 * 1000,
						);

						return (
							<div
								key={
									"clientKey" in m &&
									typeof (m as Record<string, unknown>).clientKey === "string"
										? ((m as Record<string, unknown>).clientKey as string)
										: (m._id as string)
								}
								className={cn(isConsecutive ? "mt-1" : "mt-6 md:mt-8")}
							>
								<Message message={m} isConsecutive={isConsecutive} />
							</div>
						);
					})}

					{contactIsTyping && (
						<div className="flex justify-start">
							<TypingIndicator
								className="ml-2 max-w-[85%] md:max-w-xs lg:max-w-md"
								userName={
									selectedChat?.contact?.nickname ||
									selectedChat?.contact?.user?.name ||
									selectedChat?.contact?.user?.email ||
									"Unknown User"
								}
							/>
						</div>
					)}

					{!!groupIsTyping?.length && (
						<div className="flex justify-start">
							<div className="flex flex-col space-y-2">
								{groupIsTyping.map((indicator) => (
									<TypingIndicator
										key={indicator._id}
										className="ml-8 max-w-[85%] md:ml-10 md:max-w-xs lg:max-w-md"
										userName={
											indicator.user?.name ||
											indicator.user?.email ||
											"Unknown User"
										}
									/>
								))}
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>
		</div>
	);
}
