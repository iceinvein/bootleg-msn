import { useStore } from "@nanostores/react";
import { motion } from "framer-motion";
import { Send, Smile, Stars, Zap } from "lucide-react";
import { useEffect, useRef } from "react";

import {
	$canNudge,
	$chatDisplayName,
	$fileUploadContext,
	$selectedChat,
} from "@/stores/contact";
import { EmojiPicker } from "../EmojiPicker";
import { FileUpload } from "../FileUpload";
import { fadeInUp, hoverScale, tapScale } from "../ui/animated";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuLabel,
	ResponsiveDropdownMenuSeparator,
	ResponsiveDropdownMenuTrigger,
} from "../ui/responsive-dropdown-menu";

export type ChatComposerProps = {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: (e: React.FormEvent) => void;
	onEmojiSelect: (emoji: string) => void;
	onSendNudge: () => void;
	onSendEmote?: (type: "screen_crack") => void;
	isNudgeSending: boolean;
	cooldownRemaining: number;
	onFileUploaded?: () => void;
	replyDraft?: {
		authorDisplayName?: string;
		authorEmail?: string;
		createdAt: number;
		kind: "text" | "emoji" | "file" | "system" | "image" | "video" | "audio";
		textSnippet?: string;
	} | null;
	onCancelReply?: () => void;
};

export function ChatComposer({
	value,
	onChange,
	onSubmit,
	onEmojiSelect,
	onSendNudge,
	onSendEmote,
	isNudgeSending,
	cooldownRemaining,
	onFileUploaded,
	replyDraft,
	onCancelReply,
}: ChatComposerProps) {
	const canNudge = useStore($canNudge);
	const chatDisplayName = useStore($chatDisplayName);
	const contactName = useStore($selectedChat)?.contact?.user?.name;
	const fileUploadContext = useStore($fileUploadContext);

	const placeholder = `Message ${chatDisplayName}...`;

	// Ref for the input field to enable focusing
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when reply draft is set
	useEffect(() => {
		if (replyDraft && inputRef.current) {
			inputRef.current.focus();
		}
	}, [replyDraft]);

	return (
		<div className="chat-input">
			<motion.div
				className="glass mx-4 mb-4 rounded-2xl p-3 md:p-4"
				variants={fadeInUp}
				initial="initial"
				animate="animate"
			>
				{/* Reply preview pill */}
				{replyDraft && (
					<div className="mb-2 flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 p-2">
						<div className="mt-0.5 h-8 w-0.5 flex-shrink-0 rounded bg-primary/60" />
						<div className="min-w-0 flex-1">
							<div className="font-medium text-muted-foreground text-xs">
								{replyDraft.authorDisplayName ||
									replyDraft.authorEmail ||
									"Unknown"}
							</div>
							<div className="line-clamp-2 truncate text-xs">
								{replyDraft.textSnippet ||
									(replyDraft.kind === "image"
										? "Image"
										: replyDraft.kind === "video"
											? "Video"
											: replyDraft.kind === "audio"
												? "Audio"
												: replyDraft.kind === "file"
													? "File"
													: "Message")}
							</div>
						</div>
						<button
							type="button"
							onClick={onCancelReply}
							className="text-muted-foreground hover:text-foreground"
						>
							×
						</button>
					</div>
				)}
				<form onSubmit={onSubmit} className="flex items-center space-x-2">
					<motion.div whileHover={hoverScale} whileTap={tapScale}>
						<FileUpload
							receiverId={fileUploadContext.receiverId}
							groupId={fileUploadContext.groupId}
							onFileUploaded={onFileUploaded}
						/>
					</motion.div>
					<EmojiPicker onEmojiSelect={onEmojiSelect}>
						<motion.div whileHover={hoverScale} whileTap={tapScale}>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
							>
								<Smile className="h-3 w-3 md:h-4 md:w-4" />
							</Button>
						</motion.div>
					</EmojiPicker>
					{canNudge && (
						<>
							<motion.div whileHover={hoverScale} whileTap={tapScale}>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
									onClick={onSendNudge}
									disabled={isNudgeSending || cooldownRemaining > 0}
									title={
										cooldownRemaining > 0
											? `Wait ${cooldownRemaining}s before sending another nudge`
											: "Send a nudge"
									}
								>
									<Zap
										className={`h-3 w-3 md:h-4 md:w-4 ${cooldownRemaining > 0 ? "opacity-50" : ""}`}
									/>
								</Button>
							</motion.div>
							{/* Emotes dropdown (desktop: Radix dropdown, mobile: Drawer) */}
							<ResponsiveDropdownMenu>
								<ResponsiveDropdownMenuTrigger asChild>
									<motion.div whileHover={hoverScale} whileTap={tapScale}>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
											title="Send an emote"
										>
											<Stars className="h-3 w-3 md:h-4 md:w-4" />
										</Button>
									</motion.div>
								</ResponsiveDropdownMenuTrigger>
								<ResponsiveDropdownMenuContent title="Emotes">
									<ResponsiveDropdownMenuItem
										onClick={() => {
											onSendEmote?.("screen_crack");
										}}
									>
										Shoot {contactName ? `${contactName}'s` : "their"} screen
									</ResponsiveDropdownMenuItem>
									<ResponsiveDropdownMenuSeparator />
									<ResponsiveDropdownMenuLabel className="text-muted-foreground text-xs">
										More emotes coming soon
									</ResponsiveDropdownMenuLabel>
								</ResponsiveDropdownMenuContent>
							</ResponsiveDropdownMenu>
						</>
					)}
					<Input
						ref={inputRef}
						value={value}
						onChange={onChange}
						placeholder={placeholder}
						className="h-9 flex-1 rounded-full border-input bg-background text-foreground text-sm focus:border-ring md:h-10 md:text-base"
					/>
					<motion.div whileHover={hoverScale} whileTap={tapScale}>
						<Button
							type="submit"
							size="sm"
							className="msn-gradient h-8 w-8 flex-shrink-0 rounded-full text-white hover:opacity-90 md:h-10 md:w-10"
						>
							<Send className="h-3 w-3 md:h-4 md:w-4" />
						</Button>
					</motion.div>
				</form>
			</motion.div>
		</div>
	);
}
