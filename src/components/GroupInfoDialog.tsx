import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
	Crown,
	Info,
	Pencil,
	Settings,
	User,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroupAvatarUrls, useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import type { Group } from "@/stores/contact";
import { getStatusColor } from "@/utils/style";
import AddMembersDialog from "./AddMembersDialog";
import { AvatarEditor } from "./AvatarEditor";
import { InlineStatusEditor } from "./InlineStatusEditor";

interface GroupInfoDialogProps {
	group: Group | null;
	children: React.ReactNode;
}

export function GroupInfoDialog({ group, children }: GroupInfoDialogProps) {
	const [isOpen, setIsOpen] = useState(false);

	// We'll keep hooks order stable and branch in render below.

	const loggedInUser = useQuery(api.auth.loggedInUser);
	const members = useQuery(
		api.groups.getGroupMembers,
		group?._id
			? {
					groupId: group._id,
				}
			: "skip",
	);

	const currentUser = members?.find((m) => m.userId === loggedInUser?._id);
	const avatarMap = useGroupAvatarUrls(group?._id ? [group._id] : undefined);
	const groupAvatarUrl = group?._id ? avatarMap.get(group._id) : undefined;
	// Resolve avatars for all members
	const memberUserIds = members?.map((m) => m.userId);
	const memberAvatarMap = useUserAvatarUrls(memberUserIds);
	const updateGroupDetails = useMutation(api.groups.updateGroupDetails);
	const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
	const isAdmin = currentUser?.role === "admin";
	const onlineMembers = members?.filter((m) => m.status === "online").length;

	const formatDate = (date?: Date | number | null) => {
		if (!date) return "";

		if (typeof date === "number") {
			date = new Date(date);
		}

		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (!group) {
		return null;
	}

	return (
		<>
			<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
				<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
				<ResponsiveDialogContent
					className="max-h-[90vh] sm:max-w-2xl"
					glass={true}
				>
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle className="flex items-center space-x-2">
							<Info className="h-5 w-5 text-primary" />
							<span>Group Info</span>
						</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Manage group settings and members.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>

					<Tabs defaultValue="info" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="info">Group Info</TabsTrigger>
							<TabsTrigger value="members">
								Members ({members?.length})
							</TabsTrigger>
						</TabsList>

						<TabsContent value="info" className="mt-4 space-y-6">
							{/* Group Header */}
							<div className="flex items-center space-x-4 rounded-lg border border-primary/20 bg-primary/10 p-4">
								<div className="relative">
									<Avatar className="h-16 w-16 border-2 border-background shadow-md">
										{groupAvatarUrl ? (
											<AvatarImage src={groupAvatarUrl} />
										) : (
											<Users className="h-16 w-16" />
										)}
									</Avatar>
									{isAdmin && (
										<button
											type="button"
											className="-bottom-2 -right-2 absolute rounded-full bg-primary p-1 text-primary-foreground shadow hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-ring"
											onClick={() => setAvatarEditorOpen(true)}
											aria-label="Edit avatar"
										>
											<Pencil className="h-4 w-4" />
										</button>
									)}
								</div>
								<div className="flex-1">
									{isAdmin ? (
										<InlineStatusEditor
											initialStatus={group?.name ?? ""}
											onSave={async (newName) => {
												const trimmed = newName.trim();
												if (!trimmed || trimmed === (group?.name ?? "")) return;
												try {
													await updateGroupDetails({
														groupId: group._id,
														name: trimmed,
													});
												} catch (e) {
													console.error("Failed to update group name", e);
												}
											}}
											placeholder="Group name"
											className="rounded px-2 py-1 font-bold text-foreground text-xl hover:bg-muted"
											maxLength={50}
										/>
									) : (
										<p className="rounded px-2 py-1 font-bold text-foreground text-xl">
											{group?.name}
										</p>
									)}

									{isAdmin ? (
										<InlineStatusEditor
											initialStatus={group?.description ?? ""}
											onSave={async (newDesc) => {
												const value = newDesc.trim();
												const normalized = value.length > 0 ? value : "";
												if (normalized === (group?.description ?? "")) return;
												try {
													await updateGroupDetails({
														groupId: group._id,
														description: normalized,
													});
												} catch (e) {
													console.error(
														"Failed to update group description",
														e,
													);
												}
											}}
											placeholder="Add a description..."
											className="mt-1 rounded px-2 py-1 text-muted-foreground hover:bg-muted"
											maxLength={200}
										/>
									) : group?.description ? (
										<p className="mt-1 rounded px-2 py-1 text-muted-foreground">
											{group.description}
										</p>
									) : null}

									<div className="mt-2 flex items-center space-x-4 text-muted-foreground text-sm">
										<span>{members?.length} members</span>
										<span>•</span>
										<span>{onlineMembers} online</span>
										<span>•</span>
										<span>Created {formatDate(group?._creationTime)}</span>
									</div>
								</div>
							</div>

							{/* Quick Actions */}
							<div className="grid grid-cols-2 gap-3">
								<AddMembersDialog>
									<Button
										variant="outline"
										className="flex items-center space-x-2 bg-transparent"
									>
										<UserPlus className="h-4 w-4" />
										<span>Add Members</span>
									</Button>
								</AddMembersDialog>
								{isAdmin && (
									<Button
										variant="outline"
										className="flex items-center space-x-2 bg-transparent"
									>
										<Settings className="h-4 w-4" />
										<span>Group Settings</span>
									</Button>
								)}
							</div>

							{/* Danger Zone */}
							<div className="border-t pt-4">
								<h4 className="mb-3 font-semibold text-red-600 dark:text-red-400">
									Danger Zone
								</h4>
								<Button
									variant="outline"
									className="border-red-300 bg-transparent text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
									onClick={() => {
										// TODO: leave group
									}}
								>
									<UserMinus className="mr-2 h-4 w-4" />
									Leave Group
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="members" className="mt-4">
							<div className="mb-4 flex flex-row-reverse">
								<Button
									variant="outline"
									className="flex items-center space-x-2 bg-transparent"
								>
									<UserPlus className="h-4 w-4" />
									<span>Add Members</span>
								</Button>
							</div>
							<ScrollArea className="h-96">
								<div className="space-y-2">
									{members?.map((member) => (
										<div
											key={member._id}
											className="flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
										>
											<div className="relative">
												<Avatar className="h-12 w-12">
													{memberAvatarMap.get(member.userId) ? (
														<AvatarImage
															src={memberAvatarMap.get(member.userId)}
														/>
													) : (
														<AvatarFallback delayMs={0}>
															<User className="h-8 w-8" />
														</AvatarFallback>
													)}
												</Avatar>
												<div
													className={`-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
												/>
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center space-x-2">
													<p className="truncate font-medium text-foreground text-sm">
														{member.user?.name ??
															member.user?.email ??
															"Unknown User"}
													</p>
													{member.role === "admin" && (
														<Badge
															variant="secondary"
															className="flex items-center space-x-1 text-xs"
														>
															<Crown className="h-3 w-3" />
															<span>Admin</span>
														</Badge>
													)}
													{member.userId === loggedInUser?._id && (
														<Badge variant="outline" className="text-xs">
															You
														</Badge>
													)}
												</div>
												<p className="text-muted-foreground text-xs">
													Joined {formatDate(member.joinedAt)}
												</p>
											</div>
											{isAdmin && member.userId !== loggedInUser?._id && (
												<div className="flex items-center space-x-1">
													{member.role !== "admin" && (
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																// TODO: promote to admin
															}}
															className="text-xs"
														>
															Make Admin
														</Button>
													)}
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															// TODO: remove member
														}}
														className="border-destructive text-destructive text-xs hover:bg-destructive/10"
													>
														Remove
													</Button>
												</div>
											)}
										</div>
									))}
								</div>
							</ScrollArea>
						</TabsContent>
					</Tabs>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
			{isAdmin && (
				<AvatarEditor
					open={avatarEditorOpen}
					onOpenChange={setAvatarEditorOpen}
					entity={{ type: "group", id: group._id }}
					currentAvatarUrl={groupAvatarUrl}
					previewShape="circle"
				/>
			)}
		</>
	);
}
