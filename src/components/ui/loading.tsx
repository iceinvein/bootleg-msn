import { motion, cubicBezier } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

interface LoadingDotsProps {
	className?: string;
}

interface LoadingPulseProps {
	className?: string;
}

// Modern spinning loader with MSN gradient
export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8", 
		lg: "h-12 w-12"
	};

	return (
		<motion.div
			className={cn(
				"rounded-full border-2 border-transparent gradient-primary",
				sizeClasses[size],
				className
			)}
			style={{
				background: `conic-gradient(from 0deg, var(--msn-blue), var(--msn-purple), var(--msn-blue))`,
				mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))",
				WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))"
			}}
			animate={{ rotate: 360 }}
			transition={{
				duration: 1,
				repeat: Infinity,
				ease: cubicBezier(0, 0, 1, 1)
			}}
		/>
	);
}

// Animated dots loader
export function LoadingDots({ className }: LoadingDotsProps) {
	const dotVariants = {
		initial: { y: 0, opacity: 0.4 },
		animate: {
			y: [-8, 0, -8],
			opacity: [0.4, 1, 0.4],
			transition: {
				duration: 1.2,
				repeat: Infinity,
				ease: cubicBezier(0.42, 0, 0.58, 1)
			}
		}
	};

	return (
		<div className={cn("flex items-center space-x-1", className)}>
			<motion.div
				className="h-2 w-2 rounded-full bg-primary"
				variants={dotVariants}
				initial="initial"
				animate="animate"
			/>
			<motion.div
				className="h-2 w-2 rounded-full bg-primary"
				variants={dotVariants}
				initial="initial"
				animate="animate"
				transition={{ delay: 0.2 }}
			/>
			<motion.div
				className="h-2 w-2 rounded-full bg-primary"
				variants={dotVariants}
				initial="initial"
				animate="animate"
				transition={{ delay: 0.4 }}
			/>
		</div>
	);
}

// Pulsing loader
export function LoadingPulse({ className }: LoadingPulseProps) {
	return (
		<motion.div
			className={cn(
				"h-4 w-4 rounded-full bg-primary",
				className
			)}
			animate={{
				scale: [1, 1.2, 1],
				opacity: [0.7, 1, 0.7]
			}}
			transition={{
				duration: 1.5,
				repeat: Infinity,
				ease: cubicBezier(0.42, 0, 0.58, 1)
			}}
		/>
	);
}

// Skeleton loader for content
interface SkeletonProps {
	className?: string;
	lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: lines }).map((_, i) => (
				<motion.div
					key={i}
					className="h-4 bg-muted rounded shimmer"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: i * 0.1 }}
					style={{
						width: i === lines - 1 ? "75%" : "100%"
					}}
				/>
			))}
		</div>
	);
}

// Message skeleton for chat loading
export function MessageSkeleton({ className }: { className?: string }) {
	return (
		<motion.div
			className={cn("flex items-start space-x-3 p-4", className)}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<motion.div
				className="h-10 w-10 rounded-full bg-muted shimmer"
				animate={{ scale: [1, 1.05, 1] }}
				transition={{ duration: 2, repeat: Infinity }}
			/>
			<div className="flex-1 space-y-2">
				<motion.div
					className="h-3 bg-muted rounded shimmer"
					style={{ width: "30%" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1 }}
				/>
				<motion.div
					className="h-4 bg-muted rounded shimmer"
					style={{ width: "80%" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				/>
				<motion.div
					className="h-4 bg-muted rounded shimmer"
					style={{ width: "60%" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
				/>
			</div>
		</motion.div>
	);
}

// Contact skeleton for contact list loading
export function ContactSkeleton({ className }: { className?: string }) {
	return (
		<motion.div
			className={cn("flex items-center space-x-3 p-3 rounded-lg", className)}
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3 }}
		>
			<motion.div
				className="h-12 w-12 rounded-full bg-muted shimmer"
				animate={{ scale: [1, 1.05, 1] }}
				transition={{ duration: 2, repeat: Infinity }}
			/>
			<div className="flex-1 space-y-2">
				<motion.div
					className="h-4 bg-muted rounded shimmer"
					style={{ width: "70%" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1 }}
				/>
				<motion.div
					className="h-3 bg-muted rounded shimmer"
					style={{ width: "50%" }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				/>
			</div>
		</motion.div>
	);
}
