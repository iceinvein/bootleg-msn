import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeCapacitor } from "./lib/capacitor-init";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

// Initialize Capacitor for mobile platforms
initializeCapacitor();

createRoot(rootElement).render(
	<ConvexAuthProvider client={convex}>
		<App />
	</ConvexAuthProvider>,
);
