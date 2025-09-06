import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";
import { CapacitorIntegration } from "./components/CapacitorIntegration";
import { EnhancedSignInForm } from "./components/EnhancedSignInForm";
import { MessengerApp } from "./components/MessengerApp";
import { MobileProvider } from "./components/MobileProvider";
import { OAuthCallback } from "./components/OAuthCallback";
import { TauriIntegration, TauriStyles } from "./components/TauriIntegration";
import { ThemeProvider } from "./components/theme-provider";
import { UpdateNotification } from "./components/UpdateNotification";
import { UpdateNotificationTest } from "./components/UpdateNotificationTest";
import { Toaster } from "./components/ui/sonner";
import { Platform } from "./utils/platform";

function App() {
	const [isOAuthCallback, setIsOAuthCallback] = useState(false);

	useEffect(() => {
		// Only check for OAuth callback on mobile/desktop platforms
		// Web platforms use Convex Auth server-side OAuth
		if (Platform.supportsSystemBrowser()) {
			const urlParams = new URLSearchParams(window.location.search);
			const hasOAuthParams = urlParams.has("code") || urlParams.has("error");
			setIsOAuthCallback(hasOAuthParams);
		}
	}, []);

	const handleOAuthComplete = () => {
		setIsOAuthCallback(false);
	};

	return (
		<ThemeProvider defaultTheme="dark">
			<MobileProvider>
				<TauriIntegration>
					<CapacitorIntegration />
					<TauriStyles />
					<main className="min-h-screen">
						{isOAuthCallback ? (
							<OAuthCallback onComplete={handleOAuthComplete} />
						) : (
							<>
								<AuthLoading>
									<div className="flex min-h-screen items-center justify-center">
										<div className="h-12 w-12 animate-spin rounded-full border-white border-b-2"></div>
									</div>
								</AuthLoading>

								<Unauthenticated>
									<EnhancedSignInForm />
								</Unauthenticated>

								<Authenticated>
									<MessengerApp />
									<UpdateNotification />
									{import.meta.env.DEV && <UpdateNotificationTest />}
								</Authenticated>
							</>
						)}

						<Toaster />
					</main>
				</TauriIntegration>
			</MobileProvider>
		</ThemeProvider>
	);
}

export default App;
