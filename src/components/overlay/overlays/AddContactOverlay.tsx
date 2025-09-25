/**
 * AddContactOverlay Component
 *
 * A responsive overlay for adding contacts that works with the overlay system.
 * Uses Drawer on mobile and Dialog on desktop for optimal UX.
 *
 * Features:
 * - Contact request mode for existing users
 * - Invitation mode for non-existing users
 * - Form validation with React Hook Form
 * - Responsive design (drawer on mobile, dialog on desktop)
 * - Proper overlay system integration
 */

// Constants
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation } from "convex/react";
import { Mail, User, UserPlus } from "lucide-react";
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
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AddContactOverlayProps } from "@/types/overlay";
import { api } from "../../../../convex/_generated/api";

// Form schema
const formSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	nickname: z.string().optional(),
	message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Dialog modes
type DialogMode = "contactRequest" | "invitation";

// Dialog configuration
const DIALOG_CONFIG = {
	contactRequest: {
		title: "Add Contact",
		description: "Send a contact request to connect with someone.",
		buttonText: "Send Request",
		icon: UserPlus,
	},
	invitation: {
		title: "Invite to MSN Messenger",
		description:
			"This person will receive an invitation to join MSN Messenger.",
		buttonText: "Send Invitation",
		icon: Mail,
	},
} as const;

/**
 * AddContactOverlay Component
 *
 * Responsive overlay for adding contacts with proper close handling
 */
export function AddContactOverlay({
	onContactAdded: _onContactAdded,
	onClose,
}: AddContactOverlayProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [dialogMode, setDialogMode] = useState<DialogMode>("contactRequest");
	const [isOpen, setIsOpen] = useState(true);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			nickname: "",
			message: "",
		},
	});

	// Convex mutations and actions
	const sendContactRequest = useMutation(api.contacts.sendContactRequest);
	const sendInvitation = useAction(api.invitations.sendInvitation);

	// Handle dialog close
	const handleDialogClose = useCallback(
		(open: boolean) => {
			if (!open) {
				setIsOpen(false);
				onClose?.();
				setDialogMode("contactRequest");
			}
		},
		[onClose],
	);

	/**
	 * Handle form submission
	 */
	const onSubmit = useCallback(
		async (data: FormData) => {
			if (isLoading) return;

			setIsLoading(true);
			try {
				if (dialogMode === "contactRequest") {
					await sendContactRequest({
						contactEmail: data.email,
						nickname: data.nickname || undefined,
					});
					toast.success("Contact request sent successfully!");
				} else {
					await sendInvitation({
						inviteeEmail: data.email,
						inviteeName: data.nickname || undefined,
						message: data.message || undefined,
					});
					toast.success("Invitation sent successfully!");
				}

				// Reset form and close dialog
				form.reset();
				handleDialogClose(false);
			} catch (error) {
				console.error("Error:", error);
				if (
					error instanceof Error &&
					error.message.includes("User not found")
				) {
					// Switch to invitation mode
					setDialogMode("invitation");
					toast.info("User not found. Switching to invitation mode.");
				} else {
					toast.error("Failed to send request. Please try again.");
				}
			} finally {
				setIsLoading(false);
			}
		},
		[
			dialogMode,
			sendContactRequest,
			sendInvitation,
			form,
			isLoading,
			handleDialogClose,
		],
	);

	const currentConfig = DIALOG_CONFIG[dialogMode];
	const IconComponent = currentConfig.icon;

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={handleDialogClose}>
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
												This person hasn't signed up for MSN Messenger yet.
												We'll send them an invitation to join!
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
						onClick={() => handleDialogClose(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					{!isLoading && (
						<Button
							type="submit"
							onClick={form.handleSubmit(onSubmit)}
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
