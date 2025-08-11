import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
import {
	CheckSquare,
	Search,
	Square,
	User,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { $selectedChat } from "@/stores/contact";
import { getStatusColor } from "@/utils/style";

interface AddMembersDialogProps {
	children: React.ReactNode;
}

export default function AddMembersDialog({ children }: AddMembersDialogProps) {
	const selectedChat = useStore($selectedChat);

	const groupId = selectedChat?.group?._id;

	const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const contacts = useQuery(api.contacts.getContacts);
	const existingMembers = useQuery(
		api.groups.getGroupMembers,
		groupId ? { groupId } : "skip",
	);
	const addGroupMembers = useMutation(api.groups.addGroupMembers);

	// Filter out contacts who are already members
	const availableContacts = contacts?.filter(
		(contact) =>
			!existingMembers?.some(
				(member) => member.userId === contact.contactUserId,
			),
	);

	const filteredContacts =
		availableContacts?.filter(
			(contact) =>
				contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				contact.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				contact.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
		) ?? [];

	const handleMemberToggle = (contactUserId: Id<"users">) => {
		setSelectedMembers((prev) =>
			prev.includes(contactUserId)
				? prev.filter((id) => id !== contactUserId)
				: [...prev, contactUserId],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedMembers.length > 0 && groupId) {
			try {
				await addGroupMembers({
					groupId,
					memberIds: selectedMembers,
				});
				setSelectedMembers([]);
				setSearchQuery("");
				setIsOpen(false);
			} catch (error) {
				console.error("Failed to add members:", error);
			}
		}
	};

	const handleReset = () => {
		setSelectedMembers([]);
		setSearchQuery("");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[90vh] border-gray-200 bg-white sm:max-w-2xl dark:border-gray-600 dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
						<UserPlus className="h-5 w-5 text-blue-600" />
						<span>Add Members to Group</span>
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						Select contacts to add to this group chat.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Search Bar */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="font-semibold text-base text-gray-700 dark:text-gray-300">
								Available Contacts ({selectedMembers.length} selected)
							</Label>
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
								<Input
									placeholder="Search contacts..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-64 border-gray-300 bg-white pl-10 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
								/>
							</div>
						</div>

						{/* Members List */}
						<ScrollArea className="h-80 rounded-lg border bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
							{filteredContacts.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									{availableContacts?.length === 0 ? (
										<>
											<Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
											<p className="text-sm">
												All contacts are already in this group
											</p>
										</>
									) : (
										<>
											<Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
											<p className="text-sm">
												No contacts found matching "{searchQuery}"
											</p>
										</>
									)}
								</div>
							) : (
								<div className="space-y-2">
									{filteredContacts.map((contact) => (
										<button
											type="button"
											key={contact._id}
											className={`flex w-full cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-600 ${
												selectedMembers.includes(contact.contactUserId)
													? "border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
													: ""
											}`}
											onClick={() => handleMemberToggle(contact.contactUserId)}
										>
											{selectedMembers.includes(contact.contactUserId) ? (
												<CheckSquare className="h-5 w-5" />
											) : (
												<Square className="h-5 w-5" />
											)}
											<div className="relative">
												<Avatar className="h-10 w-10">
													<User className="h-10 w-10" />
												</Avatar>
												<div
													className={`-bottom-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-white ${getStatusColor(contact.status)}`}
												/>
											</div>
											<div className="ml-2">
												<p className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
													{contact.nickname ??
														contact.user?.name ??
														contact.user?.email ??
														"Unknown User"}
												</p>
												{contact.statusMessage && (
													<p className="truncate text-gray-500 text-xs dark:text-gray-400">
														{contact.statusMessage}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</ScrollArea>
					</div>

					{/* Selected Members Preview */}
					{selectedMembers.length > 0 && (
						<div className="space-y-3">
							<Label className="font-semibold text-gray-700 text-sm dark:text-gray-300">
								Selected Members ({selectedMembers.length})
							</Label>
							<div className="flex flex-wrap gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
								{selectedMembers.map((memberId) => {
									const contact = contacts?.find(
										(c) => c.contactUserId === memberId,
									);
									if (!contact) return null;
									return (
										<div
											key={memberId}
											className="flex items-center space-x-2 rounded-full border bg-white px-3 py-1 dark:bg-gray-700"
										>
											<Avatar className="h-6 w-6">
												<User className="h-6 w-6" />
											</Avatar>
											<span className="font-medium text-gray-900 text-sm dark:text-gray-100">
												{contact.nickname ??
													contact.user?.name ??
													contact.user?.email ??
													"Unknown User"}
											</span>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												onClick={() => handleMemberToggle(memberId)}
												className="h-4 w-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
											>
												×
											</Button>
										</div>
									);
								})}
							</div>
						</div>
					)}

					<DialogFooter className="flex justify-between">
						<Button type="button" variant="outline" onClick={handleReset}>
							Clear Selection
						</Button>
						<div className="space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
								disabled={selectedMembers.length === 0}
							>
								Add {selectedMembers.length} Member
								{selectedMembers.length !== 1 ? "s" : ""}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
