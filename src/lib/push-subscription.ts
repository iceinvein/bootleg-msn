// Web Push subscription helper
// Subscribes the current browser to push using a VAPID public key and
// posts the subscription to a Netlify Function endpoint.

export type PushSubscriptionJSON = {
	endpoint: string;
	expirationTime: number | null;
	keys: { p256dh: string; auth: string };
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export async function ensurePushSubscription(
	vapidPublicKey: string,
): Promise<PushSubscriptionJSON | null> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		console.warn("Push not supported in this browser");
		return null;
	}

	const registration = await navigator.serviceWorker.getRegistration();
	if (!registration) {
		console.warn("Service worker not registered; cannot subscribe to push");
		return null;
	}

	let subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		const appServerKey = urlBase64ToUint8Array(vapidPublicKey);
		// Pass ArrayBuffer to satisfy BufferSource typing across TS/dom versions
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: appServerKey.buffer as ArrayBuffer,
		});
	}

	const json = subscription.toJSON() as PushSubscriptionJSON;

	// POST to Netlify function to register (placeholder; add persistence later)
	try {
		await fetch("/.netlify/functions/subscribe", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ subscription: json }),
		});
	} catch (e) {
		console.warn("Failed to notify backend about push subscription", e);
	}

	return json;
}
