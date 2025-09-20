import {
	Bell,
	BellOff,
	Clock,
	Eye,
	EyeOff,
	Settings,
	Volume2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useNotifications } from "@/hooks/useNotifications";

export function BrowserNotificationSettings() {
	const {
		permission,
		requestPermission,
		settings,
		updateSettings,
		isSupported,
		canNotify,
		isBrowserEnvironment,
	} = useBrowserNotifications();

	// Tauri notifications (desktop) — if supported, mirror the sound toggle
	const {
		settings: tauriSettings,
		updateSettings: updateTauriSettings,
		isSupported: isTauriSupported,
	} = useNotifications();

	const [isRequestingPermission, setIsRequestingPermission] = useState(false);

	const handleRequestPermission = async () => {
		setIsRequestingPermission(true);
		try {
			await requestPermission();
		} finally {
			setIsRequestingPermission(false);
		}
	};

	const handleTestNotification = async () => {
		if (!canNotify) return;

		// Show a test notification
		if ("Notification" in window) {
			new Notification("Test Notification", {
				body: "This is a test notification from MSN Messenger",
				icon: "/icon-192.png",
				tag: "test-notification",
			});
		}
	};

	const handleTestSound = async () => {
		try {
			const audio = new Audio("/sounds/message.mp3");
			audio.volume = 0.7;
			audio.currentTime = 0;
			await audio.play();
		} catch (e) {
			console.warn("Failed to play test sound:", e);
		}
	};

	// Don't show settings if not in browser environment
	if (!isBrowserEnvironment) {
		return null;
	}

	const getPermissionStatus = () => {
		switch (permission) {
			case "granted":
				return { text: "Granted", color: "bg-green-500", icon: Bell };
			case "denied":
				return { text: "Denied", color: "bg-red-500", icon: BellOff };
			default:
				return {
					text: "Not requested",
					color: "bg-yellow-500",
					icon: Settings,
				};
		}
	};

	const permissionStatus = getPermissionStatus();
	const StatusIcon = permissionStatus.icon;

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="h-5 w-5" />
					Browser Notifications
				</CardTitle>
				<CardDescription>
					Configure desktop notifications for when you're using the web version
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Permission Status */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<StatusIcon className="h-5 w-5" />
						<div>
							<Label className="font-medium text-base">Permission Status</Label>
							<p className="text-muted-foreground text-sm">
								{isSupported
									? "Browser notifications are supported"
									: "Browser notifications not supported"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge className={permissionStatus.color}>
							{permissionStatus.text}
						</Badge>
						{permission !== "granted" && isSupported && (
							<Button
								onClick={handleRequestPermission}
								disabled={isRequestingPermission || permission === "denied"}
								size="sm"
							>
								{isRequestingPermission
									? "Requesting..."
									: "Request Permission"}
							</Button>
						)}
					</div>
				</div>

				{permission === "denied" && (
					<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-800">
							Notifications are blocked. To enable them, click the notification
							icon in your browser's address bar or go to your browser settings
							and allow notifications for this site.
						</p>
					</div>
				)}

				{/* Settings (only show if permission is granted) */}
				{canNotify && (
					<>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Bell className="h-4 w-4" />
									<div>
										<Label htmlFor="notifications-enabled">
											Enable Notifications
										</Label>
										<p className="text-muted-foreground text-sm">
											Show desktop notifications for new messages
										</p>
									</div>
								</div>
								<Switch
									id="notifications-enabled"
									checked={settings.enabled}
									onCheckedChange={async (enabled) => {
										updateSettings({ enabled });
										if (isTauriSupported && tauriSettings) {
											await updateTauriSettings({ ...tauriSettings, enabled });
										}
									}}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Eye className="h-4 w-4" />
									<div>
										<Label htmlFor="show-preview">Show Message Preview</Label>
										<p className="text-muted-foreground text-sm">
											Display message content in notifications
										</p>
									</div>
								</div>
								<Switch
									id="show-preview"
									checked={settings.showPreview}
									onCheckedChange={async (showPreview) => {
										updateSettings({ showPreview });
										if (isTauriSupported && tauriSettings) {
											await updateTauriSettings({
												...tauriSettings,
												showPreview,
											});
										}
									}}
									disabled={!settings.enabled}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<EyeOff className="h-4 w-4" />
									<div>
										<Label htmlFor="suppress-focused">
											Suppress When Focused
										</Label>
										<p className="text-muted-foreground text-sm">
											Don't show notifications when the app is in focus
										</p>
									</div>
								</div>
								<Switch
									id="suppress-focused"
									checked={settings.suppressWhenFocused}
									onCheckedChange={async (suppressWhenFocused) => {
										updateSettings({ suppressWhenFocused });
										if (isTauriSupported && tauriSettings) {
											await updateTauriSettings({
												...tauriSettings,
												suppressWhenFocused,
											});
										}
									}}
									disabled={!settings.enabled}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Volume2 className="h-4 w-4" />
									<div>
										<Label htmlFor="sound-enabled">Play Sound</Label>
										<p className="text-muted-foreground text-sm">
											Play a sound for new message notifications
										</p>
									</div>
								</div>
								<Switch
									id="sound-enabled"
									checked={settings.sound}
									onCheckedChange={async (sound) => {
										updateSettings({ sound });
										if (isTauriSupported && tauriSettings) {
											await updateTauriSettings({
												...tauriSettings,
												soundEnabled: sound,
											});
										}
									}}
									disabled={!settings.enabled}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Clock className="h-4 w-4" />
									<div>
										<Label htmlFor="quiet-hours">Quiet Hours</Label>
										<p className="text-muted-foreground text-sm">
											Disable notifications during specific hours
										</p>
									</div>
								</div>
								<Switch
									id="quiet-hours"
									checked={settings.quietHoursEnabled}
									onCheckedChange={async (quietHoursEnabled) => {
										updateSettings({ quietHoursEnabled });
										if (isTauriSupported && tauriSettings) {
											await updateTauriSettings({
												...tauriSettings,
												quietHoursEnabled,
											});
										}
									}}
									disabled={!settings.enabled}
								/>
							</div>

							{settings.quietHoursEnabled && settings.enabled && (
								<div className="ml-7 space-y-3">
									<div className="flex items-center gap-4">
										<div className="flex-1">
											<Label htmlFor="quiet-start" className="text-sm">
												Start Time
											</Label>
											<Input
												id="quiet-start"
												type="time"
												value={settings.quietHoursStart || "22:00"}
												onChange={async (e) => {
													const quietHoursStart = e.target.value;
													updateSettings({ quietHoursStart });
													if (isTauriSupported && tauriSettings) {
														await updateTauriSettings({
															...tauriSettings,
															quietHoursStart,
														});
													}
												}}
												className="mt-1"
											/>
										</div>
										<div className="flex-1">
											<Label htmlFor="quiet-end" className="text-sm">
												End Time
											</Label>
											<Input
												id="quiet-end"
												type="time"
												value={settings.quietHoursEnd || "08:00"}
												onChange={async (e) => {
													const quietHoursEnd = e.target.value;
													updateSettings({ quietHoursEnd });
													if (isTauriSupported && tauriSettings) {
														await updateTauriSettings({
															...tauriSettings,
															quietHoursEnd,
														});
													}
												}}
												className="mt-1"
											/>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Test Notification / Sound */}
						<div className="flex items-center gap-2 border-t pt-4">
							<Button
								onClick={handleTestNotification}
								variant="outline"
								size="sm"
								disabled={!settings.enabled}
							>
								Send Test Notification
							</Button>
							<Button
								onClick={handleTestSound}
								variant="outline"
								size="sm"
								disabled={!settings.enabled}
							>
								Play Test Sound
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
