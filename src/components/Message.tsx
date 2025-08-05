import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Edit3, MoreHorizontal, User, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MessageProps {
	message: FunctionReturnType<typeof api.unifiedMessages.getMessages>[number];
}

export function Message({ message }: MessageProps) {
	const loggedInUser = useQuery(api.auth.loggedInUser);

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [isHovered, setIsHovered] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const ownsMessage = message.senderId === loggedInUser?._id;

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleEdit = () => {
		setEditContent(message.content);
		setIsEditing(true);
	};

	const handleSave = () => {
		const trimmedContent = editContent.trim();
		if (trimmedContent && trimmedContent !== message.content) {
			// TODO: update message
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditContent(message.content);
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

	const handleDelete = () => {
		// TODO: delete message
	};

	return (
		<button
			type="button"
			className={`flex w-full ${ownsMessage ? "justify-end" : "justify-start"} group`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex flex-col gap-1">
				<span className="text-accent-foreground/50 text-xs">
					{message.sender?.name ?? message.sender?.email}
				</span>
				<div
					className={cn(
						"relative flex max-w-[85%] items-center gap-2 space-x-2 md:max-w-xs lg:max-w-md",
						ownsMessage && "flex-row-reverse",
					)}
				>
					<Avatar className="h-6 w-6 border-2 border-accent-foreground md:h-8 md:w-8">
						<User className="h-6 w-6 md:h-8 md:w-8" />
					</Avatar>

					<div className="relative">
						{isEditing ? (
							<div className="flex items-center space-x-2 rounded-2xl border-2 border-blue-500 bg-white p-2 dark:bg-gray-700">
								<Input
									ref={inputRef}
									value={editContent}
									onChange={(e) => setEditContent(e.target.value)}
									onKeyDown={handleKeyDown}
									className="h-auto border-none bg-transparent p-0 text-gray-900 text-sm focus:ring-0 md:text-base dark:text-gray-100"
								/>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleSave}
									className="h-6 w-6 p-0"
								>
									<Check className="h-3 w-3" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleCancel}
									className="h-6 w-6 p-0"
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						) : (
							<div
								className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
									ownsMessage
										? "bg-blue-500 text-white"
										: "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
								}`}
							>
								<p className="break-words text-sm md:text-base">
									{message.content}
									{message.isEdited && (
										<span className="ml-2 text-xs opacity-70">(edited)</span>
									)}
								</p>
							</div>
						)}

						{/* Message actions - only show for user messages and when hovered */}
						{ownsMessage && isHovered && !isEditing && (
							<div
								className={`absolute top-0 ${ownsMessage ? "-translate-x-full left-0" : "right-0 translate-x-full"} flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100`}
							>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											className="h-6 w-6 bg-white p-0 shadow-md hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
										>
											<MoreHorizontal className="h-3 w-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-32">
										<DropdownMenuItem onClick={handleEdit} className="text-sm">
											<Edit3 className="mr-2 h-3 w-3" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleDelete}
											className="text-red-600 text-sm dark:text-red-400"
										>
											<X className="mr-2 h-3 w-3" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						)}
					</div>
				</div>
			</div>
		</button>
	);
}
