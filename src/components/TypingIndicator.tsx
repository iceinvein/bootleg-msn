import { cubicBezier, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TypingIndicatorProps = {
	className?: string;
	userName?: string;
};

const containerVariants = {
	initial: {
		opacity: 0,
		scale: 0.8,
		y: 10,
	},
	animate: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: {
			duration: 0.3,
			ease: cubicBezier(0.4, 0, 0.2, 1),
			staggerChildren: 0.1,
		},
	},
	exit: {
		opacity: 0,
		scale: 0.8,
		y: 10,
		transition: {
			duration: 0.2,
		},
	},
};

// Three-dot bounce variants
const dotVariants = {
	initial: { y: 0, opacity: 0.5 },
	animate: {
		y: [-4, 0, -4],
		opacity: [0.5, 1, 0.5],
		transition: {
			duration: 1.2,
			repeat: Infinity,
			ease: cubicBezier(0.42, 0, 0.58, 1),
		},
	},
};

export function TypingIndicator({ className, userName }: TypingIndicatorProps) {
	return (
		<motion.div
			className={cn("flex flex-col items-start gap-1", className)}
			variants={containerVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			role="status"
			aria-live="polite"
		>
			{/* Three-dot typing bubble aligned like a received message */}
			<div className="message-bubble-received flex items-center space-x-1 rounded-2xl px-3 py-2">
				<motion.div
					className="h-2 w-2 rounded-full bg-muted-foreground"
					variants={dotVariants}
				/>
				<motion.div
					className="h-2 w-2 rounded-full bg-muted-foreground"
					variants={dotVariants}
					transition={{ delay: 0.2 }}
				/>
				<motion.div
					className="h-2 w-2 rounded-full bg-muted-foreground"
					variants={dotVariants}
					transition={{ delay: 0.4 }}
				/>
			</div>
			<motion.span
				className="text-muted-foreground text-xs md:text-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.15 }}
			>
				{userName ? `${userName} is typing...` : "Someone is typing..."}
			</motion.span>
		</motion.div>
	);
}
