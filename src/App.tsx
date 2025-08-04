import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
// import { DeploymentManager } from "./components/DeploymentManager";
// import { EmailTestComponent } from "./components/EmailTestComponent";
import { EnhancedSignInForm } from "./components/EnhancedSignInForm";
import { MessengerApp } from "./components/MessengerApp";
import { ThemeProvider } from "./components/theme-provider";
import { UpdateNotification } from "./components/UpdateNotification";
import { Toaster } from "./components/ui/sonner";

function App() {
	return (
		<ThemeProvider defaultTheme="dark">
			<main className="min-h-screen">
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
					{/* {import.meta.env.DEV && <DeploymentManager />} */}
				</Authenticated>

				<Toaster />

				{/* {import.meta.env.DEV && <EmailTestComponent />} */}
			</main>
		</ThemeProvider>
	);
}

export default App;
