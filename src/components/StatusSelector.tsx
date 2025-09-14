import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getStatusColorWithGlow } from "@/utils/style";
import { Button } from "./ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "./ui/responsive-dialog";

const statusOptions = [
	{ 
		value: "online", 
		label: "Online", 
		description: "Available to chat",
		color: "bg-green-500",
		emoji: "🟢" 
	},
	{ 
		value: "away", 
		label: "Away", 
		description: "Away from keyboard",
		color: "bg-yellow-500",
		emoji: "🟡" 
	},
	{ 
		value: "busy", 
		label: "Busy", 
		description: "Do not disturb",
		color: "bg-red-500",
		emoji: "🔴" 
	},
	{
		value: "invisible",
		label: "Invisible",
		description: "Appear offline to others",
		color: "bg-gray-500",
		emoji: "⚫",
	},
] as const;

type StatusValue = "online" | "away" | "busy" | "invisible";

interface StatusSelectorProps {
	currentStatus: StatusValue;
	onStatusChange: (status: StatusValue) => void;
	className?: string;
}

export function StatusSelector({ 
	currentStatus, 
	onStatusChange, 
	className 
}: StatusSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);

	const currentStatusOption = statusOptions.find(s => s.value === currentStatus) || statusOptions[0];

	const handleStatusSelect = (status: StatusValue) => {
		onStatusChange(status);
		setIsOpen(false);
	};

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
			<ResponsiveDialogTrigger asChild>
				<Button
					variant="ghost"
					className={cn(
						"glass w-full justify-between rounded-lg p-3 h-auto hover:shadow-md transition-all duration-200",
						className
					)}
				>
					<div className="flex items-center gap-3">
						<div className="relative">
							<div className={cn(
								"h-3 w-3 rounded-full border-2 border-background",
								getStatusColorWithGlow(currentStatus)
							)} />
						</div>
						<div className="flex flex-col items-start">
							<span className="font-medium text-sm">
								{currentStatusOption.label}
							</span>
							<span className="text-muted-foreground text-xs">
								{currentStatusOption.description}
							</span>
						</div>
					</div>
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				</Button>
			</ResponsiveDialogTrigger>

			<ResponsiveDialogContent className="sm:max-w-md">
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Change Status</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<div className="space-y-2 p-4">
					{statusOptions.map((status, index) => (
						<motion.button
							key={status.value}
							type="button"
							className={cn(
								"glass w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-md",
								currentStatus === status.value && "ring-2 ring-primary/40 bg-primary/5"
							)}
							onClick={() => handleStatusSelect(status.value)}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							<div className="relative">
								<div className={cn(
									"h-4 w-4 rounded-full border-2 border-background",
									getStatusColorWithGlow(status.value)
								)} />
							</div>
							
							<div className="flex-1 text-left">
								<div className="flex items-center gap-2">
									<span className="font-medium text-sm">
										{status.label}
									</span>
									<span className="text-lg">
										{status.emoji}
									</span>
								</div>
								<p className="text-muted-foreground text-xs">
									{status.description}
								</p>
							</div>

							{currentStatus === status.value && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className="text-primary"
								>
									<Check className="h-4 w-4" />
								</motion.div>
							)}
						</motion.button>
					))}
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
