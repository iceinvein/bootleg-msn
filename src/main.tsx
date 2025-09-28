import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { initializeCapacitor } from "./lib/capacitor-init";
import { AppRouter } from "./router";
import { Platform } from "./utils/platform";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

// Initialize Capacitor for mobile platforms
initializeCapacitor();

createRoot(rootElement).render(
	<ErrorBoundary>
		<ConvexAuthProvider
			client={convex}
			shouldHandleCode={() => {
				// Skip automatic OAuth code handling on desktop
				// We handle OAuth callbacks manually via deep links
				if (Platform.isDesktop()) {
					return false;
				}
				return true;
			}}
		>
			<AppRouter />
		</ConvexAuthProvider>
	</ErrorBoundary>,
);
