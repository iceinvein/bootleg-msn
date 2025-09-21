import { api } from "@convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation } from "convex/react";
import { Mail, Send, User, UserPlus } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

// Constants
const DEFAULT_MESSAGE = "Hi! I'd like to add you to my contact list.";
const USER_NOT_FOUND_ERROR = "User has not signed up yet";

// Form validation schema
const formSchema = z.object({
	email: z
		.email("Please enter a valid email address")
		.nonempty("Email is required"),
	nickname: z.string().optional(),
	message: z.string().optional(),
});

// Configuration for different dialog modes
const DIALOG_CONFIG = {
	contactRequest: {
		icon: UserPlus,
		title: "Add New Contact",
		description: "Send a contact request to someone you'd like to chat with.",
		buttonText: "Send Request",
		successMessage: (autoAccepted: boolean) =>
			autoAccepted
				? "Contact added! They had already sent you a request."
				: "Contact request sent! Waiting for them to accept.",
	},
	invitation: {
		icon: Send,
		title: "Invite to Join",
		description:
			"This person hasn't joined MSN Messenger yet. Send them an invitation!",
		buttonText: "Send Invitation",
		successMessage: () =>
			"Invitation sent! They'll receive an email to join MSN Messenger.",
	},
};

type AddContactDialogProps = {
	children: React.ReactNode;
};

type DialogMode = "contactRequest" | "invitation";
type FormData = z.infer<typeof formSchema>;

export default function AddContactDialog({ children }: AddContactDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<DialogMode>("contactRequest");

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			nickname: "",
			message: DEFAULT_MESSAGE,
		},
	});

	const sendContactRequest = useMutation(api.contacts.sendContactRequest);
	const sendInvitation = useAction(api.invitations.sendInvitation);

	// Utility functions
	const extractErrorMessage = (error: unknown): string =>
		error instanceof Error ? error.message : String(error);

	const resetFormAndDialog = useCallback(() => {
		form.reset();
		setDialogMode("contactRequest");
		setIsOpen(false);
	}, [form]);

	const withLoading = useCallback(async (asyncFn: () => Promise<void>) => {
		setIsLoading(true);
		try {
			await asyncFn();
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Get current dialog configuration
	const currentConfig =
		dialogMode === "invitation"
			? DIALOG_CONFIG.invitation
			: DIALOG_CONFIG.contactRequest;
	const IconComponent = currentConfig.icon;

	const onSubmit = async (data: FormData) => {
		await withLoading(async () => {
			setDialogMode("contactRequest");

			try {
				const result = await sendContactRequest({
					contactEmail: data.email.trim(),
					nickname: data.nickname?.trim() || undefined,
				});

				toast.success(
					DIALOG_CONFIG.contactRequest.successMessage(result.autoAccepted),
				);
				resetFormAndDialog();
			} catch (error) {
				const errorMessage = extractErrorMessage(error);

				if (errorMessage.includes(USER_NOT_FOUND_ERROR)) {
					setDialogMode("invitation");
				} else {
					toast.error(errorMessage || "Failed to send contact request");
				}
			}
		});
	};

	const handleSendInvitation = async () => {
		const values = form.getValues();
		if (!values.email.trim()) return;

		await withLoading(async () => {
			try {
				await sendInvitation({
					inviteeEmail: values.email.trim(),
					inviteeName: values.nickname?.trim() || undefined,
					message: values.message?.trim() || undefined,
				});

				toast.success(DIALOG_CONFIG.invitation.successMessage());
				resetFormAndDialog();
			} catch (error) {
				toast.error(extractErrorMessage(error) || "Failed to send invitation");
			}
		});
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
						<IconComponent className="h-5 w-5 text-primary" />
						<span>{currentConfig.title}</span>
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription className="mb-4">
						{currentConfig.description}
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="nickname"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center space-x-2">
										<User className="h-4 w-4" />
										<span>Nickname (Optional)</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Friend"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center space-x-2">
										<Mail className="h-4 w-4" />
										<span>Email Address</span>
									</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="friend@example.com"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Personal Message (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Add a personal message..."
											rows={3}
											className="resize-none"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{dialogMode === "invitation" && (
							<div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
								<div className="flex">
									<div className="ml-3">
										<h3 className="font-medium text-sm text-yellow-800">
											User not found
										</h3>
										<div className="mt-2 text-sm text-yellow-700">
											<p>
												This email address isn't registered yet. Would you like
												to invite them to join MSN Messenger?
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</form>
				</Form>

				<ResponsiveDialogFooter className="mt-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							setIsOpen(false);
							setDialogMode("contactRequest");
						}}
						disabled={isLoading}
					>
						Cancel
					</Button>
					{dialogMode === "invitation" ? (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogMode("contactRequest")}
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
								<IconComponent className="mr-2 h-4 w-4" />
								{currentConfig.buttonText}
							</Button>
						</>
					) : (
						<Button
							type="submit"
							className="msn-gradient text-white hover:opacity-90"
							disabled={isLoading}
						>
							<IconComponent className="mr-2 h-4 w-4" />
							{currentConfig.buttonText}
						</Button>
					)}
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
