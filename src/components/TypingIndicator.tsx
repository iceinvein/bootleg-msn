import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
	className?: string;
	userName?: string;
}

const dotVariants = {
	initial: {
		y: 0,
		opacity: 0.4,
	},
	animate: {
		y: [-4, 0, -4],
		opacity: [0.4, 1, 0.4],
		transition: {
			duration: 1.2,
			repeat: Infinity,
			ease: "easeInOut",
		},
	},
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
			ease: [0.4, 0, 0.2, 1],
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

export function TypingIndicator({ className, userName }: TypingIndicatorProps) {
	return (
		<motion.div
			className={cn("flex items-center space-x-2 px-4 py-2", className)}
			variants={containerVariants}
			initial="initial"
			animate="animate"
			exit="exit"
		>
			<div className="message-bubble-received flex items-center space-x-1 px-3 py-2">
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
			{userName && (
				<motion.span
					className="text-muted-foreground text-xs"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
				>
					{userName} is typing...
				</motion.span>
			)}
		</motion.div>
	);
}
