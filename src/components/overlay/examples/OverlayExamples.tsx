/**
 * OverlayExamples Component
 *
 * This component demonstrates how to use the overlay system throughout the app.
 * It provides examples of all overlay types and integration patterns.
 */

import { Button } from "@/components/ui/button";
import { useOverlays } from "@/hooks/useOverlays";
import { useOverlayUrl } from "@/hooks/useOverlayUrl";

export function OverlayExamples() {
	const { open } = useOverlays();
	const { generateShareUrl } = useOverlayUrl();

	/**
	 * Example: Confirmation Dialog
	 */
	const showConfirmDialog = () => {
		open({
			type: "CONFIRM",
			props: {
				title: "Delete Item",
				message:
					"Are you sure you want to delete this item? This action cannot be undone.",
				variant: "warning",
				confirmText: "Delete",
				cancelText: "Cancel",
				onConfirm: () => {
					console.log("Item deleted!");
					// Add your delete logic here
				},
				onCancel: () => {
					console.log("Deletion cancelled");
				},
			},
		});
	};

	/**
	 * Example: Information Dialog
	 */
	const showInfoDialog = () => {
		open({
			type: "INFO",
			props: {
				title: "Welcome!",
				content:
					"Welcome to the MSN Messenger overlay system. This is an information dialog.",
				buttonText: "Got it",
				onAction: () => {
					console.log("Info acknowledged");
				},
			},
		});
	};

	/**
	 * Example: Settings Dialog
	 */
	const showSettingsDialog = () => {
		open({
			type: "SETTINGS",
			props: {
				onClose: () => {
					console.log("Settings closed");
				},
			},
		});
	};

	/**
	 * Example: Create Group Dialog
	 */
	const showCreateGroupDialog = () => {
		open({
			type: "CREATE_GROUP",
			props: {
				onGroupCreated: (group) => {
					console.log("Group created:", group);
				},
			},
		});
	};

	/**
	 * Example: Sheet/Drawer
	 */
	const showSheet = () => {
		open({
			type: "SHEET",
			props: {
				title: "Information Sheet",
				content:
					"This is a sheet/drawer overlay that slides up from the bottom.",
				side: "bottom",
			},
		});
	};

	/**
	 * Example: Theme Selector
	 */
	const showThemeSelector = () => {
		open({
			type: "THEME_SELECTOR",
			props: {
				onThemeSelect: (theme) => {
					console.log("Theme selected:", theme);
				},
			},
		});
	};

	/**
	 * Example: Emoji Picker
	 */
	const showEmojiPicker = () => {
		open({
			type: "EMOJI_PICKER",
			props: {
				onEmojiSelect: (emoji) => {
					console.log("Emoji selected:", emoji);
				},
			},
		});
	};

	/**
	 * Example: Shareable URL
	 */
	const shareOverlay = () => {
		const _overlayId = open({
			type: "INFO",
			props: {
				title: "Shareable Overlay",
				content: "This overlay can be shared via URL!",
				buttonText: "Close",
			},
			persistInUrl: true, // Enable URL persistence
		});

		// Generate shareable URL
		const shareUrl = generateShareUrl();
		console.log("Shareable URL:", shareUrl);

		// Copy to clipboard if available
		if (navigator.clipboard) {
			navigator.clipboard.writeText(shareUrl);
			console.log("URL copied to clipboard!");
		}
	};

	return (
		<div className="space-y-4 p-6">
			<h2 className="font-bold text-2xl">Overlay System Examples</h2>
			<p className="text-muted-foreground">
				Click the buttons below to see different overlay types in action.
			</p>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
				<Button onClick={showConfirmDialog} variant="destructive">
					Confirm Dialog
				</Button>

				<Button onClick={showInfoDialog} variant="default">
					Info Dialog
				</Button>

				<Button onClick={showSettingsDialog} variant="outline">
					Settings
				</Button>

				<Button onClick={showCreateGroupDialog} variant="secondary">
					Create Group
				</Button>

				<Button onClick={showSheet} variant="ghost">
					Sheet/Drawer
				</Button>

				<Button onClick={showThemeSelector} variant="outline">
					Theme Selector
				</Button>

				<Button onClick={showEmojiPicker} variant="secondary">
					Emoji Picker
				</Button>

				<Button onClick={shareOverlay} variant="default">
					Shareable Overlay
				</Button>
			</div>

			<div className="mt-8 rounded-lg bg-muted p-4">
				<h3 className="font-semibold">Integration Features:</h3>
				<ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground text-sm">
					<li>✅ URL synchronization for deep linking</li>
					<li>✅ Browser back/forward navigation support</li>
					<li>✅ Keyboard shortcuts (ESC to close)</li>
					<li>✅ Mobile-friendly responsive design</li>
					<li>✅ Accessibility support</li>
					<li>✅ Animation and glass effects</li>
					<li>✅ Z-index stacking management</li>
					<li>✅ TypeScript type safety</li>
				</ul>
			</div>
		</div>
	);
}
