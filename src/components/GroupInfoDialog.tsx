import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
	Crown,
	Info,
	Settings,
	User,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Group } from "@/stores/contact";
import { getStatusColor } from "@/utils/style";
import AddMembersDialog from "./AddMembersDialog";
import { InlineStatusEditor } from "./InlineStatusEditor";

interface GroupInfoDialogProps {
	group: Group;
	children: React.ReactNode;
}

export function GroupInfoDialog({ group, children }: GroupInfoDialogProps) {
	const [isOpen, setIsOpen] = useState(false);

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

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[90vh] border-gray-200 bg-white sm:max-w-2xl dark:border-gray-600 dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
						<Info className="h-5 w-5 text-blue-600" />
						<span>Group Info</span>
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						Manage group settings and members.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="info" className="w-full">
					<TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
						<TabsTrigger value="info">Group Info</TabsTrigger>
						<TabsTrigger value="members">
							Members ({members?.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="info" className="mt-4 space-y-6">
						{/* Group Header */}
						<div className="flex items-center space-x-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
							<Avatar className="h-16 w-16 border-2 border-white shadow-md">
								<Users className="h-16 w-16" />
							</Avatar>
							<div className="flex-1">
								<InlineStatusEditor
									initialStatus={group?.name ?? ""}
									onSave={() => {
										if (!group) return;
										// TODO: update group name
									}}
									placeholder="Group name"
									className="rounded px-2 py-1 font-bold text-gray-900 text-xl hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
									maxLength={50}
								/>
								{group?.description && (
									<InlineStatusEditor
										initialStatus={group.description}
										onSave={() => {
											// TODO: update group description
										}}
										placeholder="Add a description..."
										className="mt-1 rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
										maxLength={200}
									/>
								)}
								<div className="mt-2 flex items-center space-x-4 text-gray-500 text-sm dark:text-gray-400">
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
										className="flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<div className="relative">
											<Avatar className="h-12 w-12">
												<User className="h-8 w-8" />
											</Avatar>
											<div
												className={`-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center space-x-2">
												<p className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
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
											<p className="text-gray-500 text-xs dark:text-gray-400">
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
													className="border-red-300 text-red-600 text-xs hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
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
			</DialogContent>
		</Dialog>
	);
}
