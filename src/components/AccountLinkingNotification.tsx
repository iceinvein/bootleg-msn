import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthMethods } from "@/hooks/useAuthMethods";

const providerNames = (provider: string) => {
	switch (provider) {
		case "google":
			return "Google";
		case "github":
			return "GitHub";
		case "apple":
			return "Apple";
		default:
			return provider;
	}
};

export function AccountLinkingNotification() {
	const { accountLinked, oauthProviders, isLoading } = useAuthMethods();
	const [hasShownToast, setHasShownToast] = useState(false);

	// Server-side tracking
	const hasShownBefore = useQuery(
		api.notificationSettings.hasShownAccountLinkingNotification,
	);
	const markAsShown = useMutation(
		api.notificationSettings.markAccountLinkingNotificationShown,
	);

	useEffect(() => {
		if (
			accountLinked &&
			!hasShownToast &&
			!isLoading &&
			hasShownBefore === false // Only show if server says we haven't shown it
		) {
			toast.success(
				`Account linked successfully! You can now sign in with ${oauthProviders
					.map(providerNames)
					.join(", ")} or your email/password.`,
				{
					duration: 8000,
					action: {
						label: "Got it",
						onClick: () => {},
					},
				},
			);

			// Mark as shown both locally and on server
			setHasShownToast(true);
			markAsShown().catch((error) => {
				console.error(
					"Failed to mark account linking notification as shown:",
					error,
				);
			});
		}
	}, [
		accountLinked,
		oauthProviders,
		hasShownToast,
		isLoading,
		hasShownBefore,
		markAsShown,
	]);

	return null;
}
