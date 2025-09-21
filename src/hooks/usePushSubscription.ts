import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import type { PushSubscriptionJSON } from "../lib/push-subscription";

function isPushSubscriptionJSON(x: unknown): x is PushSubscriptionJSON {
	if (!x || typeof x !== "object") return false;
	const obj = x as Record<string, unknown>;
	const keys = obj.keys as Record<string, unknown> | undefined;
	return (
		typeof obj.endpoint === "string" &&
		!!keys &&
		typeof keys.p256dh === "string" &&
		typeof keys.auth === "string"
	);
}

export function usePushSubscription() {
	const upsert = useMutation(api.push.upsertSubscription);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				if (!("serviceWorker" in navigator) || !("PushManager" in window))
					return;
				if (Notification.permission !== "granted") return;

				// Ensure SW and subscription exist
				await navigator.serviceWorker.register("/sw.js");
				const reg = await navigator.serviceWorker.ready;
				let sub = await reg.pushManager.getSubscription();

				if (!sub) {
					// Attempt to subscribe if app exposes VAPID key at build time
					const vapid = import.meta.env?.VITE_VAPID_PUBLIC_KEY;
					if (!vapid) return;
					const { ensurePushSubscription } = await import(
						"../lib/push-subscription"
					);
					const created = await ensurePushSubscription(vapid);
					if (!created || cancelled) return;
					// Reload the PushSubscription from the reg to get a PushSubscription object
					sub = await reg.pushManager.getSubscription();
				}

				if (!sub || cancelled) return;
				const raw = sub.toJSON();
				if (isPushSubscriptionJSON(raw)) {
					await upsert({
						endpoint: raw.endpoint,
						p256dh: raw.keys.p256dh,
						auth: raw.keys.auth,
					});
				} else {
					console.warn("PushSubscription JSON had unexpected shape", raw);
				}
			} catch (e) {
				// Best-effort; ignore
				console.warn("Push subscription setup failed:", e);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [upsert]);
}
