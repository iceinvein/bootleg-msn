/* Lightweight overlay debug logger. Enable with localStorage.setItem('overlayDebug','1') or window.__OVERLAY_DEBUG__=true */

export type OverlayDebugEvent =
	| "overlay.open"
	| "overlay.close"
	| "overlay.closeAll"
	| "overlay.replaceTop"
	| "overlay.updateProps"
	| "url.update"
	| "url.clear"
	| "url.navigateWithOverlay"
	| "sync.urlToOverlay.openFromUrl"
	| "sync.urlToOverlay.closeAll"
	| "sync.overlayToUrl.updateUrl"
	| "sync.suppressedReopen"
	| "sync.conflict.detected"
	| "sync.conflict.resolved"
	| "router.popstate"
	| "init.fromUrl";

function enabled(): boolean {
	// biome-ignore lint/suspicious/noExplicitAny: just for debugging
	const w = globalThis as any;
	return (
		w?.__OVERLAY_DEBUG__ === true ||
		(typeof localStorage !== "undefined" &&
			localStorage.getItem("overlayDebug") === "1")
	);
}

function now() {
	try {
		return new Date().toISOString();
	} catch {
		return Date.now().toString();
	}
}

export function overlayDebugLog(
	event: OverlayDebugEvent,
	data: Record<string, unknown> = {},
) {
	if (!enabled()) return;
	// Best-effort shallow clone URLSearchParams
	const norm: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(data)) {
		if (v instanceof URLSearchParams) {
			norm[k] = v.toString();
			// biome-ignore lint/suspicious/noExplicitAny: just for debugging
		} else if (v && typeof v === "object" && "toString" in (v as any)) {
			try {
				// biome-ignore lint/suspicious/noExplicitAny: just for debugging
				norm[k] = (v as any).toString();
			} catch {
				norm[k] = v;
			}
		} else {
			norm[k] = v;
		}
	}
	// eslint-disable-next-line no-console
	console.log(`[OverlayDebug] ${now()} ${event}`, norm);
}

export function overlayDebugEnabled() {
	return enabled();
}
