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

	useEffect(() => {
		if (accountLinked && !hasShownToast && !isLoading) {
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
			setHasShownToast(true);
		}
	}, [accountLinked, oauthProviders, hasShownToast, isLoading]);

	return null;
}
