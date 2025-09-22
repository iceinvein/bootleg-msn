import { Check, Edit3, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InlineStatusEditorProps = {
	initialStatus: string;
	onSave: (newStatus: string) => void;
	maxLength?: number;
	placeholder?: string;
	className?: string;
};

export function StatusMessage({
	initialStatus,
	onSave,
	maxLength = 100,
	placeholder = "What's on your mind?",
	className = "",
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
		if (trimmedStatus !== status) {
			setStatus(trimmedStatus);
			onSave(trimmedStatus);
		}
		setIsEditing(false);
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
			<div className="mt-1 flex w-full space-x-1">
				<Input
					ref={inputRef}
					value={tempStatus}
					onChange={(e) => setTempStatus(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSave}
					placeholder="Let them know what's up!"
					maxLength={maxLength}
					className="h-6 border-white! bg-white px-2 py-1 text-xs focus:border-white! focus:ring-1! focus:ring-white! md:h-7 md:text-sm"
				/>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleSave}
					className="h-6 w-6 p-0 text-white hover:bg-white/20"
				>
					<Check className="h-3 w-3 text-white" />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleCancel}
					className="h-6 w-6 p-0 text-white"
				>
					<X className="h-3 w-3" />
				</Button>
			</div>
		);
	}

	return (
		<button
			type="button"
			className={cn(
				"group flex w-full cursor-pointer items-center justify-between space-x-1 rounded px-1 py-0.5 transition-colors hover:bg-white/10",
				className,
			)}
			onClick={handleClick}
		>
			<p className="min-w-0 truncate text-xs opacity-90 md:text-sm">
				{status || placeholder}
			</p>
			<Edit3 className="h-3 w-3 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
		</button>
	);
}
