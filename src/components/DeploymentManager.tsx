import { useMutation } from "convex/react";
import { useCallback, useEffect } from "react";
import { api } from "../../convex/_generated/api";

// This component should only be used in development/admin contexts
export function DeploymentManager() {
	const updateDeploymentInfo = useMutation(api.deployment.updateDeploymentInfo);

	const handleNewDeployment = useCallback(async () => {
		const version = `1.0.${Date.now()}`;
		try {
			await updateDeploymentInfo({ version });
			console.log("Deployment info updated:", version);
		} catch (error) {
			console.error("Failed to update deployment info:", error);
		}
	}, [updateDeploymentInfo]);

	// Auto-trigger deployment update in development
	useEffect(() => {
		// Only in development mode
		if (import.meta.env.DEV) {
			// Simulate a new deployment after 15 seconds for testing
			const timer = setTimeout(() => {
				handleNewDeployment();
			}, 15000);

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
