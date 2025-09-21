import { api } from "@convex/_generated/api";
import { useAction, useMutation } from "convex/react";
import { Mail, Send, UserPlus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
	ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";

interface AddContactDialogProps {
	children: React.ReactNode;
}

export default function AddContactDialog({ children }: AddContactDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const [email, setEmail] = useState("");
	const [nickname, setNickname] = useState("");
	const [message, setMessage] = useState(
		"Hi! I'd like to add you to my contact list.",
	);
	const [isOpen, setIsOpen] = useState(false);
	const [showInviteOption, setShowInviteOption] = useState(false);
	const [userNotFound, setUserNotFound] = useState(false);

	const sendContactRequest = useMutation(api.contacts.sendContactRequest);
	const sendInvitation = useAction(api.invitations.sendInvitation);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsLoading(true);
		setUserNotFound(false);
		setShowInviteOption(false);

		try {
			const result = await sendContactRequest({
				contactEmail: email.trim(),
				nickname: nickname.trim() || undefined,
			});

			if (result.autoAccepted) {
				toast.success("Contact added! They had already sent you a request.");
			} else {
				toast.success("Contact request sent! Waiting for them to accept.");
			}

			// Reset form and close dialog
			setEmail("");
			setNickname("");
			setMessage("Hi! I'd like to add you to my contact list.");
			setIsOpen(false);
		} catch (error) {
			// Get error message from Error instances
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			// Check if the error message contains "User has not signed up yet"
			// (Convex wraps the original error with additional debugging info)
			if (errorMessage.includes("User has not signed up yet")) {
				setUserNotFound(true);
				setShowInviteOption(true);
			} else {
				toast.error(errorMessage || "Failed to send contact request");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendInvitation = async () => {
		if (!email.trim()) return;

		setIsLoading(true);
		try {
			await sendInvitation({
				inviteeEmail: email.trim(),
				inviteeName: nickname.trim() || undefined,
				message: message.trim() || undefined,
			});

			toast.success(
				"Invitation sent! They'll receive an email to join MSN Messenger.",
			);

			// Reset form and close dialog
			setEmail("");
			setNickname("");
			setMessage("Hi! I'd like to add you to my contact list.");
			setUserNotFound(false);
			setShowInviteOption(false);
			setIsOpen(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to send invitation",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent
				className="sm:max-w-md"
				animationType="slideDown"
			>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center space-x-2">
						{showInviteOption ? (
							<>
								<Send className="h-5 w-5 text-primary" />
								<span>Invite to Join</span>
							</>
						) : (
							<>
								<UserPlus className="h-5 w-5 text-primary" />
								<span>Add New Contact</span>
							</>
						)}
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription className="mb-4">
						{showInviteOption
							? "This person hasn't joined MSN Messenger yet. Send them an invitation!"
							: "Send a contact request to someone you'd like to chat with."}
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email" className="flex items-center space-x-2">
							<Mail className="h-4 w-4" />
							<span>Nickname (Optional)</span>
						</Label>
						<Input
							id="nickname"
							type="text"
							placeholder="Friend"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email" className="flex items-center space-x-2">
							<Mail className="h-4 w-4" />
							<span>Email Address</span>
						</Label>
						<Input
							id="email"
							type="email"
							placeholder="friend@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="message">Personal Message (Optional)</Label>
						<Textarea
							id="message"
							placeholder="Add a personal message..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={3}
							className="resize-none"
							disabled={isLoading}
						/>
					</div>
					{userNotFound && (
						<div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
							<div className="flex">
								<div className="ml-3">
									<h3 className="font-medium text-sm text-yellow-800">
										User not found
									</h3>
									<div className="mt-2 text-sm text-yellow-700">
										<p>
											This email address isn't registered yet. Would you like to
											invite them to join MSN Messenger?
										</p>
									</div>
								</div>
							</div>
						</div>
					)}

					<ResponsiveDialogFooter>
						<div className="flex w-full gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsOpen(false);
									setUserNotFound(false);
									setShowInviteOption(false);
								}}
								disabled={isLoading}
							>
								Cancel
							</Button>
							{showInviteOption ? (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setUserNotFound(false);
											setShowInviteOption(false);
										}}
										disabled={isLoading}
									>
										Back
									</Button>
									<Button
										type="button"
										onClick={handleSendInvitation}
										className="msn-gradient text-white hover:opacity-90"
										disabled={isLoading}
									>
										<Send className="mr-2 h-4 w-4" />
										Send Invitation
									</Button>
								</>
							) : (
								<Button
									type="submit"
									className="msn-gradient text-white hover:opacity-90"
									disabled={isLoading}
								>
									<UserPlus className="mr-2 h-4 w-4" />
									Send Request
								</Button>
							)}
						</div>
					</ResponsiveDialogFooter>
				</form>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
