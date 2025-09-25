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
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { $selectedChat } from "@/stores/contact";
import type { AddMembersOverlayProps } from "@/types/overlay";
import { getStatusColor } from "@/utils/style";

export function AddMembersOverlay({
	onClose,
	groupId: groupIdProp,
}: AddMembersOverlayProps & { onClose?: () => void }) {
	const selectedChat = useStore($selectedChat);
	const groupId = groupIdProp ?? selectedChat?.group?._id;

	const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const contacts = useQuery(api.contacts.getContacts);
	const existingMembers = useQuery(
		api.groups.getGroupMembers,
		groupId ? { groupId } : "skip",
	);
	const addGroupMembers = useMutation(api.groups.addGroupMembers);

	const availableContacts = useMemo(
		() =>
			contacts?.filter(
				(contact) =>
					!existingMembers?.some(
						(member) => member.userId === contact.contactUserId,
					),
			) ?? [],
		[contacts, existingMembers],
	);

	const filteredContacts = useMemo(
		() =>
			availableContacts.filter(
				(contact) =>
					contact.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					contact.user?.name
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					contact.user?.email
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()),
			),
		[availableContacts, searchQuery],
	);

	const contactUserIds = useMemo(
		() => availableContacts.map((c) => c.contactUserId),
		[availableContacts],
	);
	const avatarUrls = useUserAvatarUrls(contactUserIds);

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
				await addGroupMembers({ groupId, memberIds: selectedMembers });
				setSelectedMembers([]);
				setSearchQuery("");
				onClose?.();
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
		<ResponsiveDialog
			open={true}
			onOpenChange={(open) => {
				if (!open) onClose?.();
			}}
		>
			<ResponsiveDialogContent className="max-h-[90vh] sm:max-w-2xl">
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center space-x-2">
						<UserPlus className="h-5 w-5 text-primary" />
						<span>Add Members to Group</span>
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Select contacts to add to this group chat.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="font-semibold text-base">
								Available Contacts ({selectedMembers.length} selected)
							</Label>
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
								<Input
									placeholder="Search contacts..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-64 pl-10"
								/>
							</div>
						</div>

						<ScrollArea className="h-80 rounded-lg border p-2">
							{filteredContacts.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									{availableContacts.length === 0 ? (
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
											className={`flex w-full cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all hover:bg-muted ${
												selectedMembers.includes(contact.contactUserId)
													? "border border-primary/30 bg-primary/10"
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
													{(() => {
														const url = avatarUrls.get(contact.contactUserId);
														return url ? (
															<AvatarImage src={url} />
														) : (
															<AvatarFallback delayMs={0}>
																<User className="h-10 w-10" />
															</AvatarFallback>
														);
													})()}
												</Avatar>
												<div
													className={`-bottom-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-background ${getStatusColor(contact.status)}`}
												/>
											</div>
											<div className="ml-2">
												<p className="truncate font-medium text-sm">
													{contact.nickname ??
														contact.user?.name ??
														contact.user?.email ??
														"Unknown User"}
												</p>
												{contact.statusMessage && (
													<p className="truncate text-muted-foreground text-xs">
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

					{selectedMembers.length > 0 && (
						<div className="space-y-3">
							<Label className="font-semibold text-sm">
								Selected Members ({selectedMembers.length})
							</Label>
							<div className="flex flex-wrap gap-2 rounded-lg border p-3">
								{selectedMembers.map((memberId) => {
									const contact = contacts?.find(
										(c) => c.contactUserId === memberId,
									);
									if (!contact) return null;
									return (
										<div
											key={memberId}
											className="flex items-center space-x-2 rounded-full border px-3 py-1"
										>
											<Avatar className="h-6 w-6">
												{contact.user?.image ? (
													<AvatarImage src={contact.user.image} />
												) : (
													<AvatarFallback delayMs={0}>
														<User className="h-6 w-6" />
													</AvatarFallback>
												)}
											</Avatar>
											<span className="font-medium text-sm">
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
												className="h-4 w-4 p-0"
											>
												×
											</Button>
										</div>
									);
								})}
							</div>
						</div>
					)}

					<ResponsiveDialogFooter className="flex justify-between">
						<Button type="button" variant="outline" onClick={handleReset}>
							Clear Selection
						</Button>
						<div className="space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onClose?.()}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={selectedMembers.length === 0}>
								Add {selectedMembers.length} Member
								{selectedMembers.length !== 1 ? "s" : ""}
							</Button>
						</div>
					</ResponsiveDialogFooter>
				</form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
