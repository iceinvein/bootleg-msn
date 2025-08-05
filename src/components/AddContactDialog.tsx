import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Mail, UserPlus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";

interface AddContactDialogProps {
	children: React.ReactNode;
}

export function AddContactDialog({ children }: AddContactDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const [email, setEmail] = useState("");
	const [nickname, setNickname] = useState("");
	const [message, setMessage] = useState(
		"Hi! I'd like to add you to my contact list.",
	);
	const [isOpen, setIsOpen] = useState(false);

	const sendContactRequest = useMutation(api.contacts.sendContactRequest);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setIsLoading(true);
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
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to send contact request",
			);
		} finally {
			setIsLoading(false);
			setIsOpen(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md dark:border-gray-600 dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle className="flex items-center space-x-2">
						<UserPlus className="h-5 w-5 text-blue-600" />
						<span>Add New Contact</span>
					</DialogTitle>
					<DialogDescription>
						Send a contact request to someone you'd like to chat with.
					</DialogDescription>
				</DialogHeader>
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
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsOpen(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
							disabled={isLoading}
						>
							Send Request
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
