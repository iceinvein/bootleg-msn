import { useStore } from "@nanostores/react";
import { motion } from "framer-motion";
import { Send, Smile, Zap } from "lucide-react";
import {
	$canNudge,
	$chatDisplayName,
	$fileUploadContext,
} from "@/stores/contact";
import { EmojiPicker } from "../EmojiPicker";
import { FileUpload } from "../FileUpload";
import { fadeInUp, hoverScale, tapScale } from "../ui/animated";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type ChatComposerProps = {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: (e: React.FormEvent) => void;
	onEmojiSelect: (emoji: string) => void;
	onSendNudge: () => void;
	isNudgeSending: boolean;
	cooldownRemaining: number;
	onFileUploaded?: () => void;
};

export function ChatComposer({
	value,
	onChange,
	onSubmit,
	onEmojiSelect,
	onSendNudge,
	isNudgeSending,
	cooldownRemaining,
	onFileUploaded,
}: ChatComposerProps) {
	const canNudge = useStore($canNudge);
	const chatDisplayName = useStore($chatDisplayName);
	const fileUploadContext = useStore($fileUploadContext);

	const placeholder = `Message ${chatDisplayName}...`;
	return (
		<div className="chat-input">
			<motion.div
				className="glass mx-4 mb-4 rounded-2xl p-3 md:p-4"
				variants={fadeInUp}
				initial="initial"
				animate="animate"
			>
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
					)}
					<Input
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
