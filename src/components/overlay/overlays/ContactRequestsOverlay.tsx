import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Inbox, Mail, Send, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContactRequestsOverlayProps } from "@/types/overlay";
import { formatTime } from "@/utils/data";

export function ContactRequestsOverlay({
	onClose,
}: ContactRequestsOverlayProps & { onClose?: () => void }) {
	const { signOut } = useAuthActions();
	const currentUser = useQuery(api.auth.loggedInUser);
	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);
	const sentInvitations = useQuery(api.invitations.getSentInvitations);

	const acceptContactRequest = useMutation(api.contacts.acceptContactRequest);
	const rejectContactRequest = useMutation(api.contacts.rejectContactRequest);
	const cancelSentRequest = useMutation(api.contacts.cancelSentRequest);
	const cancelInvitation = useMutation(api.invitations.cancelInvitation);

	async function handleAccept(contactId: Id<"contacts">) {
		try {
			if (!currentUser) {
				toast.error("Please sign in again");
				await signOut();
				return;
			}
			await acceptContactRequest({ contactId });
			toast.success("Contact request accepted!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to accept request",
			);
		}
	}

	async function handleReject(contactId: Id<"contacts">) {
		try {
			await rejectContactRequest({ contactId });
			toast.success("Contact request rejected");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to reject request",
			);
		}
	}

	async function handleCancel(contactId: Id<"contacts">) {
		try {
			await cancelSentRequest({ contactId });
			toast.success("Contact request cancelled");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to cancel request",
			);
		}
	}

	async function handleCancelInvitation(invitationId: Id<"invitations">) {
		try {
			await cancelInvitation({ invitationId });
			toast.success("Invitation cancelled");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to cancel invitation",
			);
		}
	}

	return (
		<ResponsiveDialog
			open={true}
			onOpenChange={(o) => {
				if (!o) onClose?.();
			}}
		>
			<ResponsiveDialogContent className="max-h-[80vh] sm:max-w-2xl">
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center gap-2">
						<UserCheck className="h-5 w-5 text-primary" />
						Contact Requests
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Manage your incoming and outgoing contact requests and invitations.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<Tabs defaultValue="incoming" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="incoming" className="flex items-center gap-2">
							<Inbox className="h-4 w-4" /> Incoming (
							{pendingRequests?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="outgoing" className="flex items-center gap-2">
							<Send className="h-4 w-4" /> Outgoing ({sentRequests?.length ?? 0}
							)
						</TabsTrigger>
						<TabsTrigger
							value="invitations"
							className="flex items-center gap-2"
						>
							<Mail className="h-4 w-4" /> Invitations (
							{sentInvitations?.length ?? 0})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="incoming" className="mt-4">
						<ScrollArea className="h-[420px] pr-1">
							{(pendingRequests?.length ?? 0) === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									No incoming requests
								</div>
							) : (
								<ul className="space-y-2">
									{pendingRequests?.map((r) => (
										<li
											key={r._id}
											className="flex items-center justify-between rounded border p-3"
										>
											<div>
												<div className="font-medium">
													{r.user?.name ?? r.user?.email ?? "Unknown"}
												</div>
												<div className="text-muted-foreground text-xs">
													{formatTime(r._creationTime)}
												</div>
											</div>
											<div className="flex gap-2">
												<Button size="sm" onClick={() => handleAccept(r._id)}>
													Accept
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleReject(r._id)}
												>
													Decline
												</Button>
											</div>
										</li>
									))}
								</ul>
							)}
						</ScrollArea>
					</TabsContent>

					<TabsContent value="outgoing" className="mt-4">
						<ScrollArea className="h-[420px] pr-1">
							{(sentRequests?.length ?? 0) === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									No outgoing requests
								</div>
							) : (
								<ul className="space-y-2">
									{sentRequests?.map((r) => (
										<li
											key={r._id}
											className="flex items-center justify-between rounded border p-3"
										>
											<div>
												<div className="font-medium">
													{r.nickname ??
														r.user?.name ??
														r.user?.email ??
														"Unknown"}
												</div>
												<div className="text-muted-foreground text-xs">
													Pending · {formatTime(r._creationTime)}
												</div>
											</div>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleCancel(r._id)}
											>
												<UserX className="mr-1 h-3 w-3" /> Cancel
											</Button>
										</li>
									))}
								</ul>
							)}
						</ScrollArea>
					</TabsContent>

					<TabsContent value="invitations" className="mt-4">
						<ScrollArea className="h-[420px] pr-1">
							{(sentInvitations?.length ?? 0) === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									No invitations sent yet
								</div>
							) : (
								<ul className="space-y-2">
									{sentInvitations?.map((inv) => (
										<li
											key={inv._id}
											className="flex items-center justify-between rounded border p-3"
										>
											<div>
												<div className="font-medium">
													{inv.inviteeName || inv.inviteeEmail}
												</div>
												<div className="text-muted-foreground text-xs">
													{inv.status} · {formatTime(inv.createdAt)}
												</div>
											</div>
											{inv.status === "pending" && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleCancelInvitation(inv._id)}
												>
													Cancel
												</Button>
											)}
										</li>
									))}
								</ul>
							)}
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
