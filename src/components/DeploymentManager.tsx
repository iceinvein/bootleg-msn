import { useCallback, useEffect } from "react";

// This component should only be used in development/admin contexts
export function DeploymentManager() {
	// TODO: The deployment API doesn't expose client-side functions for triggering deployments
	// This component is currently disabled until proper API is available

	const handleNewDeployment = useCallback(async () => {
		const version = `1.0.${Date.now()}`;
		console.log("Simulated deployment update:", version);
		// TODO: Implement actual deployment trigger when API is available
	}, []);

	// Auto-trigger deployment update in development
	useEffect(() => {
		// Only in development mode
		if (import.meta.env.DEV) {
			// Simulate a new deployment after 60 seconds for testing
			const timer = setTimeout(() => {
				handleNewDeployment();
			}, 60000);

			return () => clearTimeout(timer);
		}
	}, [handleNewDeployment]);

	// This component doesn't render anything in production
	if (!import.meta.env.DEV) {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 z-50">
			<button
				type="button"
				onClick={handleNewDeployment}
				className="rounded bg-red-500 px-3 py-2 font-medium text-sm text-white hover:bg-red-600"
			>
				Simulate New Deployment
			</button>
		</div>
	);
}
