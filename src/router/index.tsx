import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "@/App";

/**
 * Router configuration for the MSN Messenger app.
 *
 * This is a simple single-route configuration since the app is primarily
 * a single-page application with authentication-based conditional rendering.
 * The main purpose of React Router here is to provide URL parameter support
 * for the overlay system (e.g., ?modal=editUser&userId=123).
 */
export const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		// Handle all routes at the root level since this is a SPA
		children: [],
	},
	// Catch-all route - redirect to root
	{
		path: "*",
		element: <App />,
	},
]);

/**
 * Router provider component that wraps the entire app.
 * This should be used in main.tsx to provide routing context.
 */
export function AppRouter() {
	return <RouterProvider router={router} />;
}
