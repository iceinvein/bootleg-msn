import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { X, Check, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface NotificationProps {
	id: string;
	title?: string;
	message: string;
	type?: "success" | "error" | "warning" | "info";
	duration?: number;
	onClose?: (id: string) => void;
	action?: {
		label: string;
		onClick: () => void;
	};
}

const notificationVariants = {
	initial: {
		opacity: 0,
		y: -50,
		scale: 0.9,
	},
	animate: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: 0.3,
			ease: cubicBezier(0.4, 0, 0.2, 1),
		},
	},
	exit: {
		opacity: 0,
		y: -20,
		scale: 0.95,
		transition: {
			duration: 0.2,
		},
	},
};

const iconVariants = {
	initial: { scale: 0, rotate: -180 },
	animate: { 
		scale: 1, 
		rotate: 0,
		transition: {
			delay: 0.1,
			duration: 0.3,
			ease: cubicBezier(0.68, -0.55, 0.265, 1.55)
		}
	}
};

const progressVariants = {
	initial: { width: "100%" },
	animate: (duration: number) => ({
		width: "0%",
		transition: {
			duration: duration / 1000,
			ease: cubicBezier(0, 0, 1, 1)
		}
	})
};

export function Notification({
	id,
	title,
	message,
	type = "info",
	duration = 5000,
	onClose,
	action
}: NotificationProps) {
	const icons = {
		success: Check,
		error: AlertCircle,
		warning: AlertTriangle,
		info: Info,
	};

	const colors = {
		success: "text-green-600 bg-green-50 border-green-200",
		error: "text-red-600 bg-red-50 border-red-200",
		warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
		info: "text-blue-600 bg-blue-50 border-blue-200",
	};

	const iconColors = {
		success: "text-green-600",
		error: "text-red-600",
		warning: "text-yellow-600",
		info: "text-blue-600",
	};

	const Icon = icons[type];

	return (
		<motion.div
			className={cn(
				"relative overflow-hidden rounded-lg border p-4 shadow-lg backdrop-blur-sm",
				colors[type]
			)}
			variants={notificationVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			layout
		>
			{/* Progress bar */}
			{duration > 0 && (
				<motion.div
					className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
					variants={progressVariants}
					initial="initial"
					animate="animate"
					custom={duration}
				/>
			)}

			<div className="flex items-start space-x-3">
				{/* Icon */}
				<motion.div
					variants={iconVariants}
					initial="initial"
					animate="animate"
				>
					<Icon className={cn("h-5 w-5", iconColors[type])} />
				</motion.div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					{title && (
						<motion.h4
							className="font-semibold text-sm"
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
						>
							{title}
						</motion.h4>
					)}
					<motion.p
						className="text-sm opacity-90"
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: title ? 0.15 : 0.1 }}
					>
						{message}
					</motion.p>

					{/* Action button */}
					{action && (
						<motion.div
							className="mt-2"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<Button
								size="sm"
								variant="outline"
								onClick={action.onClick}
								className="h-7 text-xs"
							>
								{action.label}
							</Button>
						</motion.div>
					)}
				</div>

				{/* Close button */}
				{onClose && (
					<motion.div
						initial={{ opacity: 0, scale: 0 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2 }}
					>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onClose(id)}
							className="h-6 w-6 p-0 hover:bg-current hover:bg-opacity-10"
						>
							<X className="h-3 w-3" />
						</Button>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

// Container for managing multiple notifications
interface NotificationContainerProps {
	notifications: NotificationProps[];
	position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

export function NotificationContainer({ 
	notifications, 
	position = "top-right" 
}: NotificationContainerProps) {
	const positionClasses = {
		"top-right": "top-4 right-4",
		"top-left": "top-4 left-4",
		"bottom-right": "bottom-4 right-4",
		"bottom-left": "bottom-4 left-4",
		"top-center": "top-4 left-1/2 -translate-x-1/2",
		"bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
	};

	return (
		<div className={cn(
			"fixed z-50 flex flex-col space-y-2 w-80 max-w-sm",
			positionClasses[position]
		)}>
			<AnimatePresence mode="popLayout">
				{notifications.map((notification) => (
					<Notification key={notification.id} {...notification} />
				))}
			</AnimatePresence>
		</div>
	);
}

// Hook for managing notifications (basic implementation)
export function useNotifications() {
	// This would typically be implemented with a global state manager
	// For now, it's a placeholder for the notification system
	const showNotification = (notification: Omit<NotificationProps, "id">) => {
		console.log("Show notification:", notification);
		// Implementation would add to global notification state
	};

	return { showNotification };
}
