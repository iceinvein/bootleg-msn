import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Toaster } from "sonner";
import { DeploymentManager } from "./components/DeploymentManager";
import { EnhancedSignInForm } from "./components/EnhancedSignInForm";
import { MessengerApp } from "./components/MessengerApp";
import { ThemeProvider } from "./components/theme-provider";
import { UpdateNotification } from "./components/UpdateNotification";

function App() {
	return (
		<ThemeProvider defaultTheme="dark">
			<main className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
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
					<DeploymentManager />
				</Authenticated>

				<Toaster
					position="top-right"
					toastOptions={{
						style: {
							background: "#363636",
							color: "#fff",
						},
					}}
				/>
			</main>
		</ThemeProvider>
	);
}

export default App;
