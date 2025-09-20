import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { cubicBezier, motion } from "framer-motion";
import { Search, User, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface CreateGroupDialogProps {
	children: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const [groupName, setGroupName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const contacts = useQuery(api.contacts.getContacts);
	const createGroup = useMutation(api.groups.createGroup);

	const filteredContacts = contacts?.filter(
		(contact) =>
			contact.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!groupName.trim()) return;

		setIsLoading(true);
		try {
			await createGroup({
				name: groupName.trim(),
				description: description.trim() || undefined,
				isPrivate: false,
				memberIds: selectedMembers,
			});

			toast.success("Group created successfully!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create group",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleContact = (userId: Id<"users">) => {
		setSelectedMembers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleReset = () => {
		setGroupName("");
		setDescription("");
		setSelectedMembers([]);
		setSearchQuery("");
	};

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent
				className="max-h-[90vh] sm:max-w-2xl"
				animationType="fade"
			>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center space-x-2">
						<Users className="h-5 w-5 text-primary" />
						<span>Create Group Chat</span>
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Create a new group chat and invite your contacts to join.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<motion.form
					onSubmit={handleSubmit}
					className="flex flex-1 flex-col space-y-6 overflow-hidden"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2, ease: cubicBezier(0, 0, 0.58, 1) }}
				>
					{/* Group Info Section */}
					<motion.div
						className="space-y-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							duration: 0.15,
							delay: 0.05,
							ease: cubicBezier(0, 0, 0.58, 1),
						}}
					>
						<div className="flex items-center space-x-4">
							<div className="relative">
								<Avatar className="h-16 w-16 border-2 border-gray-200">
									<Users className="h-16 w-16" />
								</Avatar>
								{/* <Button
									type="button"
									size="sm"
									variant="outline"
									className="-bottom-1 -right-1 absolute h-6 w-6 rounded-full bg-transparent p-0"
								>
									<Camera className="h-3 w-3" />
								</Button> */}
							</div>
							<div className="flex-1 space-y-3">
								<div className="space-y-2">
									<Label
										htmlFor="groupName"
										className="text-gray-700 dark:text-gray-300"
									>
										Group Name *
									</Label>
									<Input
										id="groupName"
										placeholder="Enter group name..."
										value={groupName}
										onChange={(e) => setGroupName(e.target.value)}
										required
										maxLength={50}
										className="border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="description"
										className="text-gray-700 dark:text-gray-300"
									>
										Description (Optional)
									</Label>
									<Textarea
										id="description"
										placeholder="What's this group about?"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={2}
										className="resize-none border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
										maxLength={200}
									/>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Members Selection */}
					<motion.div
						className="flex min-h-0 flex-1 flex-col space-y-3"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							duration: 0.15,
							delay: 0.1,
							ease: cubicBezier(0, 0, 0.58, 1),
						}}
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<Label className="font-semibold text-base text-gray-700 dark:text-gray-300">
								Add Members ({selectedMembers.length} selected)
							</Label>
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
								<Input
									placeholder="Search contacts..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full border-gray-300 bg-white pl-10 text-gray-900 sm:w-64 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
								/>
							</div>
						</div>

						<ScrollArea className="max-h-64 min-h-[200px] flex-1 rounded-lg border bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
							{filteredContacts?.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
									<p className="text-sm">No contacts found</p>
								</div>
							) : (
								<div className="space-y-2">
									{filteredContacts?.map((contact) => {
										if (!contact.user || !contact.user._id) return null;

										return (
											<button
												type="button"
												key={contact?._id}
												className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-600 ${
													selectedMembers.includes(contact.user._id)
														? "border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
														: ""
												}`}
												onClick={() => toggleContact(contact.userId)}
											>
												<Checkbox
													checked={selectedMembers.includes(contact.userId)}
													onChange={() => toggleContact(contact.userId)}
												/>
												<Avatar className="h-10 w-10">
													<User className="h-10 w-10" />
												</Avatar>
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
														{contact.user.name}
													</p>
													<p className="truncate text-gray-500 text-xs dark:text-gray-400">
														{contact.statusMessage}
													</p>
												</div>
												<div
													className={`h-3 w-3 rounded-full ${
														contact.status === "online"
															? "bg-green-500"
															: contact.status === "away"
																? "bg-yellow-500"
																: contact.status === "busy"
																	? "bg-red-500"
																	: "bg-gray-400"
													}`}
												/>
											</button>
										);
									})}
								</div>
							)}
						</ScrollArea>
					</motion.div>

					<ResponsiveDialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
						<motion.div
							className="w-full"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: 0.15,
								delay: 0.15,
								ease: cubicBezier(0, 0, 0.58, 1),
							}}
						>
							<Button
								type="button"
								variant="outline"
								onClick={handleReset}
								className="w-full sm:w-auto"
							>
								Reset
							</Button>
							<div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsOpen(false)}
									disabled={isLoading}
									className="w-full sm:w-auto"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="msn-gradient w-full text-white hover:opacity-90 sm:w-auto"
									disabled={
										!groupName.trim() ||
										selectedMembers.length === 0 ||
										isLoading
									}
								>
									Create Group ({selectedMembers.length})
								</Button>
							</div>
						</motion.div>
					</ResponsiveDialogFooter>
				</motion.form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
