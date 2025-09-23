import { Bell, BellOff, Clock, Eye, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationSettings as NotificationSettingsType } from "@/lib/tauri-notifications";

type NotificationSettingsProps = {
	className?: string;
};

export function NotificationSettings({ className }: NotificationSettingsProps) {
	const {
		permission,
		requestPermission,
		settings,
		updateSettings,
		isSupported,
		isLoading,
		error,
	} = useNotifications();

	const [localSettings, setLocalSettings] =
		useState<NotificationSettingsType | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Initialize local settings when settings are loaded
	useEffect(() => {
		if (settings) {
			setLocalSettings({ ...settings });
		}
	}, [settings]);

	const handlePermissionRequest = async () => {
		try {
			const newPermission = await requestPermission();
			if (newPermission === "granted") {
				toast.success("Notification permission granted!");
			} else if (newPermission === "denied") {
				toast.error(
					"Notification permission denied. You can enable it in your system settings.",
				);
			}
		} catch (err) {
			toast.error("Failed to request notification permission");
		}
	};

	const handleSaveSettings = async () => {
		if (!localSettings) return;

		try {
			setIsSaving(true);
			await updateSettings(localSettings);
			toast.success("Notification settings saved!");
		} catch (err) {
			toast.error("Failed to save notification settings");
		} finally {
			setIsSaving(false);
		}
	};

	const handleSettingChange = (
		key: keyof NotificationSettingsType,
		value: boolean | string | undefined,
	) => {
		if (!localSettings) return;

		setLocalSettings({
			...localSettings,
			[key]: value,
		});
	};

	const getPermissionBadge = () => {
		switch (permission) {
			case "granted":
				return (
					<Badge variant="default" className="bg-green-500">
						<Bell className="mr-1 h-3 w-3" />
						Granted
					</Badge>
				);
			case "denied":
				return (
					<Badge variant="destructive">
						<BellOff className="mr-1 h-3 w-3" />
						Denied
					</Badge>
				);
			case "prompt":
			case "prompt-with-rationale":
				return (
					<Badge variant="secondary">
						<Bell className="mr-1 h-3 w-3" />
						Prompt Required
					</Badge>
				);
			default:
				return (
					<Badge variant="secondary">
						<Bell className="mr-1 h-3 w-3" />
						Unknown
					</Badge>
				);
		}
	};

	if (!isSupported) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BellOff className="h-5 w-5" />
						Desktop Notifications
					</CardTitle>
					<CardDescription>
						Desktop notifications are only available in the native desktop app.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5" />
						Desktop Notifications
					</CardTitle>
					<CardDescription>Loading notification settings...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BellOff className="h-5 w-5 text-red-500" />
						Desktop Notifications
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bell className="h-5 w-5" />
					Desktop Notifications
				</CardTitle>
				<CardDescription>
					Configure how you receive notifications in the desktop app.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Permission Status */}
				<div className="flex items-center justify-between">
					<div>
						<Label className="font-medium text-base">Permission Status</Label>
						<p className="text-muted-foreground text-sm">
							System permission to show notifications
						</p>
					</div>
					<div className="flex items-center gap-2">
						{getPermissionBadge()}
						{permission !== "granted" && (
							<Button onClick={handlePermissionRequest} size="sm">
								Request Permission
							</Button>
						)}
					</div>
				</div>

				{permission === "granted" && localSettings && (
					<>
						{/* Enable Notifications */}
						<div className="flex items-center justify-between">
							<div>
								<Label
									htmlFor="notifications-enabled"
									className="font-medium text-base"
								>
									Enable Notifications
								</Label>
								<p className="text-muted-foreground text-sm">
									Receive desktop notifications for new messages and events
								</p>
							</div>
							<Switch
								id="notifications-enabled"
								checked={localSettings.enabled}
								onCheckedChange={(checked) =>
									handleSettingChange("enabled", checked)
								}
							/>
						</div>

						{localSettings.enabled && (
							<>
								{/* Sound Notifications */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{localSettings.soundEnabled ? (
											<Volume2 className="h-4 w-4" />
										) : (
											<VolumeX className="h-4 w-4" />
										)}
										<div>
											<Label
												htmlFor="sound-enabled"
												className="font-medium text-base"
											>
												Sound Notifications
											</Label>
											<p className="text-muted-foreground text-sm">
												Play sound when notifications appear
											</p>
										</div>
									</div>
									<Switch
										id="sound-enabled"
										checked={localSettings.soundEnabled}
										onCheckedChange={(checked) =>
											handleSettingChange("soundEnabled", checked)
										}
									/>
								</div>

								{/* Show Preview */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Eye className="h-4 w-4" />
										<div>
											<Label
												htmlFor="show-preview"
												className="font-medium text-base"
											>
												Show Message Preview
											</Label>
											<p className="text-muted-foreground text-sm">
												Display message content in notifications
											</p>
										</div>
									</div>
									<Switch
										id="show-preview"
										checked={localSettings.showPreview}
										onCheckedChange={(checked) =>
											handleSettingChange("showPreview", checked)
										}
									/>
								</div>

								{/* Suppress When Focused */}
								<div className="flex items-center justify-between">
									<div>
										<Label
											htmlFor="suppress-focused"
											className="font-medium text-base"
										>
											Suppress When App is Active
										</Label>
										<p className="text-muted-foreground text-sm">
											Don't show notifications when the app window is focused
										</p>
									</div>
									<Switch
										id="suppress-focused"
										checked={localSettings.suppressWhenFocused}
										onCheckedChange={(checked) =>
											handleSettingChange("suppressWhenFocused", checked)
										}
									/>
								</div>

								{/* Quiet Hours */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4" />
											<div>
												<Label
													htmlFor="quiet-hours"
													className="font-medium text-base"
												>
													Quiet Hours
												</Label>
												<p className="text-muted-foreground text-sm">
													Disable notifications during specific hours
												</p>
											</div>
										</div>
										<Switch
											id="quiet-hours"
											checked={localSettings.quietHoursEnabled}
											onCheckedChange={(checked) =>
												handleSettingChange("quietHoursEnabled", checked)
											}
										/>
									</div>

									{localSettings.quietHoursEnabled && (
										<div className="ml-6 grid grid-cols-2 gap-4">
											<div>
												<Label
													htmlFor="quiet-start"
													className="font-medium text-sm"
												>
													Start Time
												</Label>
												<Input
													id="quiet-start"
													type="time"
													value={localSettings.quietHoursStart || "22:00"}
													onChange={(e) =>
														handleSettingChange(
															"quietHoursStart",
															e.target.value,
														)
													}
													className="mt-1"
												/>
											</div>
											<div>
												<Label
													htmlFor="quiet-end"
													className="font-medium text-sm"
												>
													End Time
												</Label>
												<Input
													id="quiet-end"
													type="time"
													value={localSettings.quietHoursEnd || "08:00"}
													onChange={(e) =>
														handleSettingChange("quietHoursEnd", e.target.value)
													}
													className="mt-1"
												/>
											</div>
										</div>
									)}
								</div>
							</>
						)}

						{/* Save Button */}
						<div className="flex justify-end border-t pt-4">
							<Button
								onClick={handleSaveSettings}
								disabled={isSaving}
								className="min-w-24"
							>
								{isSaving ? "Saving..." : "Save Settings"}
							</Button>
						</div>
					</>
				)}

				{permission === "denied" && (
					<Alert>
						<AlertDescription>
							Notifications are disabled. To enable them, please allow
							notifications for MSN Messenger in your system settings, then
							click "Request Permission" above.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
