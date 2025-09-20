import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Clock, Inbox, Send, User, UserCheck, UserX } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { formatTime } from "@/utils/data";

export interface ContactRequest {
	id: string;
	email: string;
	name: string;
	avatar: string;
	message: string;
	timestamp: Date;
	type: "incoming" | "outgoing";
	status: "pending" | "accepted" | "declined";
}

interface ContactRequestsProps {
	children: React.ReactNode;
}

export default function ContactRequestsDialog({
	children,
}: ContactRequestsProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { signOut } = useAuthActions();

	const currentUser = useQuery(api.auth.loggedInUser);
	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);
	const pendingUserIds: Id<"users">[] | undefined = pendingRequests?.map(
		(r) => r.userId as Id<"users">,
	);
	const sentUserIds: Id<"users">[] | undefined = sentRequests?.map(
		(r) => r.contactUserId as Id<"users">,
	);
	const avatarMapPending = useUserAvatarUrls(pendingUserIds);
	const avatarMapSent = useUserAvatarUrls(sentUserIds);
	const acceptContactRequest = useMutation(api.contacts.acceptContactRequest);
	const rejectContactRequest = useMutation(api.contacts.rejectContactRequest);
	const cancelSentRequest = useMutation(api.contacts.cancelSentRequest);

	const handleAccept = async (contactId: Id<"contacts">) => {
		try {
			setIsLoading(true);

			if (!currentUser) {
				toast.error("Please sign in again");
				await signOut();
				return;
			}

			await acceptContactRequest({ contactId });
			toast.success("Contact request accepted!");
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("Not authenticated")) {
					toast.error("Session expired. Please sign in again.");
					await signOut();
				} else if (error.message.includes("unauthorized")) {
					toast.error("You are not authorized to accept this request.");
				} else if (error.message.includes("not pending")) {
					toast.error("This request has already been processed.");
				} else {
					toast.error(error.message);
				}
			} else {
				toast.error("Failed to accept request");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleReject = async (contactId: Id<"contacts">) => {
		try {
			setIsLoading(true);
			await rejectContactRequest({ contactId });
			toast.success("Contact request rejected");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to reject request",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = async (contactId: Id<"contacts">) => {
		if (confirm("Are you sure you want to cancel this contact request?")) {
			try {
				setIsLoading(true);
				await cancelSentRequest({ contactId });
				toast.success("Contact request cancelled");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to cancel request",
				);
			} finally {
				setIsLoading(false);
				setIsOpen(false);
			}
		}
	};

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent className="max-h-[80vh] sm:max-w-2xl">
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center space-x-2">
						<UserCheck className="h-5 w-5 text-primary" />
						<span>Contact Requests</span>
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Manage your incoming and outgoing contact requests.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<Tabs defaultValue="incoming" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger
							value="incoming"
							className="flex items-center space-x-2"
						>
							<Inbox className="h-4 w-4" />
							<span>Incoming ({pendingRequests?.length ?? 0})</span>
						</TabsTrigger>
						<TabsTrigger
							value="outgoing"
							className="flex items-center space-x-2"
						>
							<Send className="h-4 w-4" />
							<span>Outgoing ({sentRequests?.length ?? 0})</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="incoming" className="mt-4">
						<ScrollArea className="h-96">
							{currentUser ? (
								pendingRequests?.length === 0 ? (
									<div className="py-8 text-center text-muted-foreground">
										<Inbox className="mx-auto mb-2 h-12 w-12 opacity-50" />
										<p>No incoming requests</p>
									</div>
								) : (
									<div className="space-y-3">
										{pendingRequests?.map((request) => (
											<div
												key={request._id}
												className="flex items-start space-x-3 rounded-lg border border-info bg-info/10 p-4"
											>
												<Avatar className="h-12 w-12">
													{(() => {
														const url = avatarMapPending.get(request.userId);
														return url ? (
															<AvatarImage src={url} />
														) : (
															<AvatarFallback delayMs={0}>
																<User className="h-12 w-12" />
															</AvatarFallback>
														);
													})()}
												</Avatar>
												<div className="min-w-0 flex-1">
													<div className="mb-1 flex items-center space-x-2">
														<h4 className="font-semibold text-foreground text-sm">
															{request.user?.email}
														</h4>
														<Badge variant="secondary" className="text-xs">
															{formatTime(request._creationTime)}
														</Badge>
													</div>
													<p className="mb-1 text-muted-foreground text-xs">
														{request.user?.email}
													</p>
													{/* {request.message && (
													<p className="mb-3 rounded border-blue-400 border-l-4 bg-white p-2 text-gray-700 text-sm dark:bg-gray-700 dark:text-gray-300">
														"{request.message}"
													</p>
												)} */}
													<div className="mt-3 flex space-x-2">
														<Button
															size="sm"
															onClick={() => handleAccept(request._id)}
															className="bg-success text-success-foreground hover:bg-success/90"
															disabled={isLoading || !currentUser}
														>
															<UserCheck className="mr-1 h-3 w-3" />
															Accept
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleReject(request._id)}
															className="border-destructive text-destructive hover:bg-destructive/10"
															disabled={isLoading || !currentUser}
														>
															<UserX className="mr-1 h-3 w-3" />
															Decline
														</Button>
													</div>
												</div>
											</div>
										))}
									</div>
								)
							) : (
								<div className="py-8 text-center text-muted-foreground">
									<User className="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>Please sign in to view contact requests</p>
								</div>
							)}
						</ScrollArea>
					</TabsContent>

					<TabsContent value="outgoing" className="mt-4">
						<ScrollArea className="h-96">
							{currentUser ? (
								sentRequests?.length === 0 ? (
									<div className="py-8 text-center text-muted-foreground">
										<Send className="mx-auto mb-2 h-12 w-12 opacity-50" />
										<p>No outgoing requests</p>
									</div>
								) : (
									<div className="space-y-3">
										{sentRequests?.map((request) => (
											<div
												key={request._id}
												className="flex items-start space-x-3 rounded-lg border border-warning bg-warning/10 p-4"
											>
												<Avatar className="h-12 w-12">
													{(() => {
														const url = avatarMapSent.get(
															request.contactUserId,
														);
														return url ? (
															<AvatarImage src={url} />
														) : (
															<AvatarFallback delayMs={0}>
																<User className="h-12 w-12" />
															</AvatarFallback>
														);
													})()}
												</Avatar>
												<div className="min-w-0 flex-1">
													<div className="mb-1 flex items-center space-x-2">
														<h4 className="font-semibold text-foreground text-sm">
															{request.nickname ?? request.user?.email}
														</h4>
														<Badge
															variant="outline"
															className="flex items-center space-x-1 text-xs"
														>
															<Clock className="h-3 w-3" />
															<span>Pending</span>
														</Badge>
														<Badge variant="secondary" className="text-xs">
															{formatTime(request._creationTime)}
														</Badge>
													</div>
													<p className="mb-1 text-muted-foreground text-xs">
														{request.user?.email}
													</p>
													{/* {request.message && (
													<p className="mb-3 rounded border-yellow-400 border-l-4 bg-white p-2 text-gray-700 text-sm dark:bg-gray-700 dark:text-gray-300">
														"{request.message}"
													</p>
												)} */}
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleCancel(request._id)}
														className="mt-3"
														disabled={isLoading || !currentUser}
													>
														<UserX className="mr-1 h-3 w-3" />
														Cancel Request
													</Button>
												</div>
											</div>
										))}
									</div>
								)
							) : (
								<div className="py-8 text-center text-muted-foreground">
									<User className="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>Please sign in to view sent requests</p>
								</div>
							)}
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
