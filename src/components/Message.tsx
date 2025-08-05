import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
	Check,
	Edit3,
	MoreHorizontal,
	SmilePlus,
	Trash2,
	User,
	X,
} from "lucide-react";
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
import { EmojiPicker } from "./EmojiPicker";

interface MessageProps {
	message: FunctionReturnType<typeof api.unifiedMessages.getMessages>[number];
}

export function Message({ message }: MessageProps) {
	const loggedInUser = useQuery(api.auth.loggedInUser);

	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
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
		<div
			className={`flex w-full ${ownsMessage ? "justify-end" : "justify-start"} overflow-visible`}
		>
			<div className="flex flex-col gap-1">
				<span className="text-accent-foreground/50 text-xs">
					{message.sender?.name ?? message.sender?.email}
				</span>
				<div
					className={cn(
						"relative flex max-w-[85%] items-center gap-2 space-x-2 overflow-visible md:max-w-xs lg:max-w-md",
						ownsMessage && "flex-row-reverse",
					)}
				>
					<Avatar className="h-6 w-6 border-2 border-accent-foreground md:h-8 md:w-8">
						<User className="h-6 w-6 md:h-8 md:w-8" />
					</Avatar>

					<div className="group relative overflow-visible">
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
						{ownsMessage && !isEditing && (
							<div
								className={cn(
									"absolute bottom-[calc(100%)] z-[9999] flex items-center space-x-1 rounded-full border-transparent bg-gray-800 p-1 shadow-lg transition-opacity duration-200 dark:bg-gray-900",
									ownsMessage ? "right-0" : "left-0",
									"pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
									isDropdownOpen && "pointer-events-auto opacity-100",
								)}
							>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										// TODO: implement reaction
									}}
									className="h-8 w-8 rounded-full p-0 text-lg hover:bg-gray-700"
								>
									👍
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										// TODO: implement reaction
									}}
									className="h-8 w-8 rounded-full p-0 text-lg hover:bg-gray-700"
								>
									❤️
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										// TODO: implement reaction
									}}
									className="h-8 w-8 rounded-full p-0 text-lg hover:bg-gray-700"
								>
									😂
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										// TODO: implement reaction
									}}
									className="h-8 w-8 rounded-full p-0 text-lg hover:bg-gray-700"
								>
									😮
								</Button>

								{/* Add Reaction Button (opens EmojiPicker) */}
								<EmojiPicker
									onEmojiSelect={() => {
										// TODO: implement reaction
									}}
								>
									<Button
										size="sm"
										variant="ghost"
										className="h-8 w-8 rounded-full p-0 text-gray-300 hover:bg-gray-700"
									>
										<SmilePlus className="h-4 w-4" />
									</Button>
								</EmojiPicker>

								{/* Separator only if there are edit/delete actions for user messages */}
								{ownsMessage && <div className="mx-1 h-6 w-px bg-gray-600" />}

								{/* Edit Button (only for user messages) */}
								{ownsMessage && (
									<Button
										size="sm"
										variant="ghost"
										onClick={handleEdit}
										className="h-8 w-8 rounded-full p-0 text-gray-300 hover:bg-gray-700"
									>
										<Edit3 className="h-4 w-4" />
									</Button>
								)}

								{/* More Options (Dropdown for Delete - only for user messages) */}
								{ownsMessage && (
									<DropdownMenu onOpenChange={setIsDropdownOpen}>
										<DropdownMenuTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												className="h-8 w-8 rounded-full p-0 text-gray-300 hover:bg-gray-700"
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-32 rounded-lg border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
										>
											<DropdownMenuItem
												onClick={handleDelete}
												className="text-red-600 text-sm dark:text-red-400"
											>
												<Trash2 className="mr-2 h-3 w-3" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
