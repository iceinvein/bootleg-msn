import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { bounceIn } from "./ui/animated";

type NudgeMessageProps = {
	senderName: string;
	nudgeType: "nudge" | "buzz";
	timestamp: number;
	isOwn?: boolean;
};

export function NudgeMessage({
	senderName,
	nudgeType,
	timestamp,
	isOwn = false,
}: NudgeMessageProps) {
	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const nudgeText = isOwn
		? `You sent a ${nudgeType}`
		: `${senderName} sent you a ${nudgeType}!`;

	const nudgeEmoji = nudgeType === "buzz" ? "📳" : "👋";

	return (
		<motion.div
			className="flex justify-center py-2"
			variants={bounceIn}
			initial="initial"
			animate="animate"
		>
			<div
				className={cn(
					"flex items-center gap-2 rounded-full px-4 py-2 text-sm",
					"bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800",
					"dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-200",
					"border border-yellow-200 dark:border-yellow-800/50",
					"shadow-sm",
				)}
			>
				<motion.div
					animate={{
						rotate: [0, -10, 10, -10, 10, 0],
						scale: [1, 1.1, 1, 1.1, 1],
					}}
					transition={{
						duration: 0.6,
						ease: "easeInOut",
					}}
				>
					<Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
				</motion.div>

				<span className="font-medium">
					{nudgeText} {nudgeEmoji}
				</span>

				<span className="text-xs opacity-70">{formatTime(timestamp)}</span>
			</div>
		</motion.div>
	);
}
