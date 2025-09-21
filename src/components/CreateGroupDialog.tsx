import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { cubicBezier, motion } from "framer-motion";
import { Search, User, Users, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getStatusColor } from "@/utils/style";

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
			setIsOpen(false);
			handleReset();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create group",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleContact = (contactUserId: Id<"users">) => {
		setSelectedMembers((prev) =>
			prev.includes(contactUserId)
				? prev.filter((id) => id !== contactUserId)
				: [...prev, contactUserId],
		);
	};

	const removeSelectedMember = (contactUserId: Id<"users">) => {
		setSelectedMembers((prev) => prev.filter((id) => id !== contactUserId));
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
				glass={true}
			>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center space-x-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<Users className="h-5 w-5 text-primary" />
						</div>
						<div>
							<span className="font-semibold text-lg">Create Group Chat</span>
							<p className="font-normal text-muted-foreground text-sm">
								Start a conversation with your contacts
							</p>
						</div>
					</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<motion.form
					onSubmit={handleSubmit}
					className="mt-4 flex flex-1 flex-col space-y-6 overflow-hidden"
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
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="groupName" className="font-medium text-sm">
									Group Name <span className="text-destructive">*</span>
								</Label>
								<Input
									id="groupName"
									placeholder="This is group"
									value={groupName}
									onChange={(e) => setGroupName(e.target.value)}
									required
									maxLength={50}
									className="h-11"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description" className="font-medium text-sm">
									Description{" "}
									<span className="text-muted-foreground">(Optional)</span>
								</Label>
								<Textarea
									id="description"
									placeholder="What's this group about?"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
									className="resize-none"
									maxLength={200}
								/>
							</div>
						</div>
					</motion.div>

					{/* Members Selection */}
					<motion.div
						className="flex min-h-0 flex-1 flex-col space-y-4"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{
							duration: 0.15,
							delay: 0.1,
							ease: cubicBezier(0, 0, 0.58, 1),
						}}
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="font-medium text-sm">Add Members</Label>
								{selectedMembers.length > 0 && (
									<Badge variant="secondary" className="text-xs">
										{selectedMembers.length} selected
									</Badge>
								)}
							</div>

							{/* Selected Members Chips */}
							{selectedMembers.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{selectedMembers.map((contactUserId) => {
										const contact = contacts?.find(
											(c) => c.contactUserId === contactUserId,
										);
										if (!contact) return null;

										return (
											<Badge
												key={contactUserId}
												variant="outline"
												className="flex items-center gap-1 px-2 py-1"
											>
												<span className="text-xs">
													{contact.nickname ?? contact.user?.name ?? "Unknown"}
												</span>
												<button
													type="button"
													onClick={() => removeSelectedMember(contactUserId)}
													className="ml-1 rounded-full p-0.5 hover:bg-muted"
													aria-label={`Remove ${contact.nickname ?? contact.user?.name ?? "contact"} from selection`}
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										);
									})}
								</div>
							)}

							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search contacts..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-11 pl-10"
								/>
							</div>
						</div>

						<ScrollArea className="max-h-64 min-h-[200px] flex-1 rounded-lg border p-2">
							{filteredContacts?.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									<Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
									<p className="text-sm">No contacts found</p>
								</div>
							) : (
								<div className="space-y-1">
									{filteredContacts?.map((contact) => {
										if (!contact.user || !contact.contactUserId) return null;

										const isSelected = selectedMembers.includes(
											contact.contactUserId,
										);

										return (
											<button
												type="button"
												key={contact._id}
												className={`flex w-full cursor-pointer items-center space-x-3 rounded-lg p-3 text-left transition-all hover:bg-accent/50 ${
													isSelected
														? "bg-primary/10 ring-1 ring-primary/20"
														: ""
												}`}
												onClick={() => toggleContact(contact.contactUserId)}
											>
												<div
													className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
														isSelected
															? "border-primary bg-primary text-primary-foreground"
															: "border-input bg-background"
													}`}
												>
													{isSelected && (
														<svg
															className="h-3 w-3"
															fill="currentColor"
															viewBox="0 0 20 20"
															aria-label="Checked"
														>
															<title>Checked</title>
															<path
																fillRule="evenodd"
																d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																clipRule="evenodd"
															/>
														</svg>
													)}
												</div>
												<div className="relative">
													<Avatar className="h-10 w-10">
														{contact.user.image ? (
															<AvatarImage src={contact.user.image} />
														) : (
															<AvatarFallback>
																<User className="h-5 w-5" />
															</AvatarFallback>
														)}
													</Avatar>
													<div
														className={`-bottom-0.5 -right-0.5 absolute h-3 w-3 rounded-full border-2 border-background ${getStatusColor(contact.status)}`}
													/>
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium text-sm">
														{contact.nickname ??
															contact.user.name ??
															contact.user.email ??
															"Unknown User"}
													</p>
													<p className="truncate text-muted-foreground text-xs">
														{contact.status === "online"
															? "Online"
															: contact.status === "away"
																? "Away"
																: contact.status === "busy"
																	? "Busy"
																	: "Offline"}
													</p>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</ScrollArea>
					</motion.div>

					<ResponsiveDialogFooter className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-between">
						<motion.div
							className="flex w-full flex-col gap-3 sm:flex-row sm:justify-between"
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
								className="order-1 sm:order-none"
								disabled={isLoading}
							>
								Reset
							</Button>
							<div className="flex gap-3 sm:gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsOpen(false)}
									disabled={isLoading}
									className="flex-1 sm:flex-none"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									className="msn-gradient flex-1 text-white hover:opacity-90 sm:flex-none"
									disabled={
										!groupName.trim() ||
										selectedMembers.length === 0 ||
										isLoading
									}
								>
									Create ({selectedMembers.length})
								</Button>
							</div>
						</motion.div>
					</ResponsiveDialogFooter>
				</motion.form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
