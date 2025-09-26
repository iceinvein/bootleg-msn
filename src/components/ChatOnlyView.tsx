import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Chat } from "./Chat";

export function ChatOnlyView() {
	const [searchParams] = useSearchParams();

	const handleClose = useCallback(async () => {
		// Prefer closing the Tauri window when present; otherwise noop
		try {
			// Lazy import to avoid bundling on web
			const mod = await import("@tauri-apps/api/window");
			const win = mod.getCurrentWindow();
			await win.close();
		} catch {
			// Not in Tauri or close failed; as a fallback, try window.close()
			try {
				window.close();
			} catch {}
		}
	}, []);

	// Optional: we could guard to ensure ?chat is present
	const hasChat = !!searchParams.get("chat");

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 overflow-hidden">
				{/* Render chat only; header's close button will close window */}
				<div className="min-h-0 flex-1">
					<Chat onCloseOverride={handleClose} hideBack />
				</div>
			</div>
			{!hasChat && (
				<div className="p-4 text-center text-muted-foreground text-sm">
					Waiting for chat to load...
				</div>
			)}
		</div>
	);
}
