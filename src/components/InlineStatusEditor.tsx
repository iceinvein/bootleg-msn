import { Check, Edit3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InlineStatusEditorProps {
	initialStatus: string;
	onSave: (newStatus: string) => void;
	maxLength?: number;
	placeholder?: string;
	className?: string;
	textColor?: string;
}

export function InlineStatusEditor({
	initialStatus,
	onSave,
	maxLength = 100,
	placeholder = "What's on your mind?",
	className = "",
	textColor = "text-white",
}: InlineStatusEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [status, setStatus] = useState(initialStatus);
	const [tempStatus, setTempStatus] = useState(initialStatus);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = () => {
		const trimmedStatus = tempStatus.trim();
		setIsEditing(false);
		if (trimmedStatus !== status) {
			setStatus(trimmedStatus);
			onSave(trimmedStatus);
		}
	};

	const handleCancel = () => {
		setTempStatus(status);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};

	const handleClick = () => {
		if (!isEditing) {
			setTempStatus(status);
			setIsEditing(true);
		}
	};

	if (isEditing) {
		return (
			<div className="flex w-full items-center space-x-1">
				<Input
					ref={inputRef}
					value={tempStatus}
					onChange={(e) => setTempStatus(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					maxLength={maxLength}
					className="h-6 border-white/50 bg-white/90 px-2 py-1 text-gray-900 text-xs focus:border-white focus:ring-1 focus:ring-white md:h-7 md:text-sm dark:border-gray-600/50 dark:bg-gray-800/90 dark:text-gray-100 dark:focus:border-gray-400 dark:focus:ring-gray-400"
				/>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleSave}
					className={`h-6 w-6 p-0 ${textColor.includes("white") ? "text-white hover:bg-white/20" : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"}`}
				>
					<Check className="h-3 w-3" />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					className={`h-6 w-6 p-0 ${textColor.includes("white") ? "text-white hover:bg-white/20" : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"}`}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>
		);
	}

	return (
		<button
			type="button"
			className={`group flex cursor-pointer items-center space-x-1 rounded px-1 py-0.5 transition-colors hover:bg-white/10 ${className}`}
			onClick={handleClick}
		>
			<p
				className={`min-w-0 flex-1 truncate text-xs opacity-90 md:text-sm ${textColor}`}
			>
				{status || placeholder}
			</p>
			<Edit3
				className={`h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-60 ${textColor}`}
			/>
		</button>
	);
}
