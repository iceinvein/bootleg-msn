import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useBuildInfo, useServerBuildInfo } from "../hooks";

const CHANNEL = (import.meta.env.VITE_CHANNEL as string) || "prod";

export function ForceUpdateOverlay() {
	// Get current app's embedded build info (actual running version)
	const { buildInfo } = useBuildInfo();

	// Get server's latest build info for comparison (automatically fetches periodically)
	const { serverBuildInfo } = useServerBuildInfo();

	// Check for admin force update policy (timestamp-based)
	const adminForceUpdate = useQuery(
		api.deployment.checkForceUpdatePolicy,
		buildInfo
			? {
					clientBuildTimestamp: buildInfo.timestamp,
					channel: CHANNEL,
				}
			: "skip",
	);

	// Check for force deployment (build-ID-based)
	const buildUpdate = useQuery(
		api.deployment.checkForUpdatesByBuild,
		buildInfo
			? {
					clientBuildId: buildInfo.buildId,
					channel: CHANNEL,
				}
			: "skip",
	);

	// Note: serverBuildInfo hook automatically handles periodic fetching

	// Check if update is needed and it's a force deployment
	const hasForceDeployment =
		buildInfo &&
		serverBuildInfo &&
		buildInfo.buildId !== serverBuildInfo.buildId &&
		buildUpdate?.forceDeployment;

	// Show overlay for either admin force update OR force deployment
	const shouldShowOverlay = adminForceUpdate?.mustUpdate || hasForceDeployment;

	if (!shouldShowOverlay) return null;

	const message = hasForceDeployment
		? "A critical update is required. Please refresh to continue."
		: adminForceUpdate?.forceMessage ||
			"A new version of the app is required. Please update to continue.";

	const onUpdate = async () => {
		try {
			const reg = await navigator.serviceWorker?.getRegistration();
			if (reg?.waiting) {
				const done = new Promise<void>((resolve) => {
					navigator.serviceWorker.addEventListener(
						"controllerchange",
						() => resolve(),
						{ once: true },
					);
				});
				reg.waiting.postMessage({ type: "SKIP_WAITING" });
				await done;
			}
		} catch {}
		window.location.reload();
	};

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-6">
			<div className="max-w-md rounded-lg border border-white/10 bg-zinc-900 p-5 text-white shadow-xl">
				<h2 className="font-semibold text-lg">Update required</h2>
				<p className="mt-2 text-sm text-white/80">{message}</p>
				<div className="mt-4 flex justify-end gap-3">
					<button
						type="button"
						onClick={onUpdate}
						className="rounded bg-blue-600 px-4 py-2 font-medium text-sm hover:bg-blue-500"
					>
						Update now
					</button>
				</div>
			</div>
		</div>
	);
}
