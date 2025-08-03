import { useMutation, useQuery } from "convex/react";
import { Clock, Inbox, Send, User, UserCheck, UserX } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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

export function ContactRequestsDialog({ children }: ContactRequestsProps) {
	const [isOpen, setIsOpen] = useState(false);

	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);
	const acceptContactRequest = useMutation(api.contacts.acceptContactRequest);
	const rejectContactRequest = useMutation(api.contacts.rejectContactRequest);
	const cancelSentRequest = useMutation(api.contacts.cancelSentRequest);

	const handleAccept = async (contactId: Id<"contacts">) => {
		try {
			await acceptContactRequest({ contactId });
			toast.success("Contact request accepted!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to accept request",
			);
		}
	};

	const handleReject = async (contactId: Id<"contacts">) => {
		try {
			await rejectContactRequest({ contactId });
			toast.success("Contact request rejected");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to reject request",
			);
		}
	};

	const handleCancel = async (contactId: Id<"contacts">) => {
		if (confirm("Are you sure you want to cancel this contact request?")) {
			try {
				await cancelSentRequest({ contactId });
				toast.success("Contact request cancelled");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to cancel request",
				);
			}
		}
	};

	const formatTime = (date: Date | number) => {
		if (typeof date === "number") {
			date = new Date(date);
		}
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[80vh] border-gray-200 bg-white sm:max-w-2xl dark:border-gray-600 dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
						<UserCheck className="h-5 w-5 text-blue-600" />
						<span>Contact Requests</span>
					</DialogTitle>
					<DialogDescription className="text-gray-600 dark:text-gray-400">
						Manage your incoming and outgoing contact requests.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="incoming" className="w-full">
					<TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
						<TabsTrigger
							value="incoming"
							className="flex items-center space-x-2 text-gray-600 data-[state=active]:bg-white dark:text-gray-300 dark:data-[state=active]:bg-gray-600"
						>
							<Inbox className="h-4 w-4" />
							<span>Incoming ({pendingRequests?.length ?? 0})</span>
						</TabsTrigger>
						<TabsTrigger
							value="outgoing"
							className="flex items-center space-x-2 text-gray-600 data-[state=active]:bg-white dark:text-gray-300 dark:data-[state=active]:bg-gray-600"
						>
							<Send className="h-4 w-4" />
							<span>Outgoing ({sentRequests?.length ?? 0})</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="incoming" className="mt-4">
						<ScrollArea className="h-96">
							{pendingRequests?.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<Inbox className="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>No incoming requests</p>
								</div>
							) : (
								<div className="space-y-3">
									{pendingRequests?.map((request) => (
										<div
											key={request._id}
											className="flex items-start space-x-3 rounded-lg border border-blue-700 bg-blue-50 p-4 dark:border-blue-200 dark:bg-blue-900/20"
										>
											<Avatar className="h-12 w-12">
												<User className="h-12 w-12" />
											</Avatar>
											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-center space-x-2">
													<h4 className="font-semibold text-gray-900 text-sm dark:text-gray-100">
														{request.user?.email}
													</h4>
													<Badge variant="secondary" className="text-xs">
														{formatTime(request._creationTime)}
													</Badge>
												</div>
												<p className="mb-1 text-gray-600 text-xs dark:text-gray-400">
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
														className="bg-green-600 text-white hover:bg-green-700"
													>
														<UserCheck className="mr-1 h-3 w-3" />
														Accept
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleReject(request._id)}
														className="border-red-300 text-red-600 hover:bg-red-50"
													>
														<UserX className="mr-1 h-3 w-3" />
														Decline
													</Button>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</TabsContent>

					<TabsContent value="outgoing" className="mt-4">
						<ScrollArea className="h-96">
							{sentRequests?.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<Send className="mx-auto mb-2 h-12 w-12 opacity-50" />
									<p>No outgoing requests</p>
								</div>
							) : (
								<div className="space-y-3">
									{sentRequests?.map((request) => (
										<div
											key={request._id}
											className="flex items-start space-x-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20"
										>
											<Avatar className="h-12 w-12">
												<User className="h-12 w-12" />
											</Avatar>
											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-center space-x-2">
													<h4 className="font-semibold text-gray-900 text-sm dark:text-gray-100">
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
												<p className="mb-1 text-gray-600 text-xs dark:text-gray-400">
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
													className="mt-3 border-gray-300 text-gray-600 hover:bg-gray-50"
												>
													<UserX className="mr-1 h-3 w-3" />
													Cancel Request
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
