import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { LogOut, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { ThemePreview } from "./ThemePreview";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "./ui/responsive-dialog";
import { Separator } from "./ui/separator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { VersionInfo } from "./VersionInfo";

interface SettingsDialogProps {
	children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
	const user = useQuery(api.auth.loggedInUser);
	const updateUserName = useMutation(api.auth.updateUserName);
	const { signOut } = useAuthActions();
	const { theme, setTheme } = useTheme();
	const { config, presets, applyPreset } = useThemeCustomization();
	const [name, setName] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdateName = async () => {
		if (!name.trim()) return;

		setIsUpdating(true);
		try {
			await updateUserName({ name: name.trim() });
		} catch (error) {
			console.error("Failed to update name:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	useEffect(() => {
		setName(user?.name ?? "");
	}, [user]);

	return (
		<ResponsiveDialog>
			<ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
			<ResponsiveDialogContent
				className="flex max-h-[85vh] max-w-4xl flex-col"
				glass={true}
			>
				<ResponsiveDialogHeader className="flex-shrink-0">
					<ResponsiveDialogTitle>Settings</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Manage your account settings and preferences.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<Tabs
					defaultValue="account"
					className="flex w-full flex-col overflow-hidden"
				>
					<TabsList className="grid w-full flex-shrink-0 grid-cols-3">
						<TabsTrigger value="account">Account</TabsTrigger>
						<TabsTrigger value="appearance">Appearance</TabsTrigger>
						<TabsTrigger value="about">About</TabsTrigger>
					</TabsList>

					<div className="mt-4 flex-1 overflow-y-auto px-1">
						<TabsContent value="account" className="mt-0 space-y-4 pb-4">
							{/* Profile Settings */}
							<div className="space-y-2">
								<Label htmlFor="name">Display Name</Label>
								<div className="flex items-center space-x-2">
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Enter your display name"
									/>
									<Button
										onClick={handleUpdateName}
										disabled={isUpdating || !name.trim() || name === user?.name}
										size="sm"
									>
										{isUpdating ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>

							{/* Account Info */}
							<div className="space-y-2">
								<Label>Email</Label>
								<div className="text-gray-600 text-sm dark:text-gray-400">
									{user?.email || "Not set"}
								</div>
							</div>

							<Separator />

							{/* Actions */}
							<div className="flex justify-end">
								<Button
									variant="destructive"
									onClick={() => void signOut()}
									className="flex items-center space-x-2"
								>
									<LogOut className="h-4 w-4" />
									<span>Sign Out</span>
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="appearance" className="mt-0 space-y-6 pb-4">
							{/* Theme Mode */}
							<div className="space-y-3">
								<Label className="font-semibold text-base">Theme Mode</Label>
								<div className="flex gap-2">
									<Button
										variant={theme === "light" ? "default" : "outline"}
										size="sm"
										onClick={() => setTheme("light")}
										className="flex items-center gap-2"
									>
										<Sun className="h-4 w-4" />
										Light
									</Button>
									<Button
										variant={theme === "dark" ? "default" : "outline"}
										size="sm"
										onClick={() => setTheme("dark")}
										className="flex items-center gap-2"
									>
										<Moon className="h-4 w-4" />
										Dark
									</Button>
									<Button
										variant={theme === "system" ? "default" : "outline"}
										size="sm"
										onClick={() => setTheme("system")}
										className="flex items-center gap-2"
									>
										<Palette className="h-4 w-4" />
										System
									</Button>
								</div>
							</div>

							<Separator />

							{/* Color Themes */}
							<div className="space-y-3">
								<Label className="font-semibold text-base">Color Themes</Label>
								<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
									{Object.entries(presets).map(([key, preset]) => (
										<Card
											key={key}
											className={`cursor-pointer transition-all hover:scale-[1.02] ${
												config.preset === key
													? "shadow-lg ring-2 ring-primary"
													: "hover:shadow-md"
											}`}
											onClick={() => applyPreset(key)}
										>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm">{preset.name}</CardTitle>
											</CardHeader>
											<CardContent className="pt-0">
												<div className="mb-2 flex gap-1">
													<div
														className="h-3 w-3 rounded-full border"
														style={{
															backgroundColor: preset.colors.primary,
														}}
													/>
													<div
														className="h-3 w-3 rounded-full border"
														style={{
															backgroundColor: preset.colors.secondary,
														}}
													/>
													<div
														className="h-3 w-3 rounded-full border"
														style={{
															backgroundColor: preset.colors.accent,
														}}
													/>
												</div>
												<p className="text-muted-foreground text-xs">
													{preset.description}
												</p>
											</CardContent>
										</Card>
									))}
								</div>
							</div>

							{/* Live Preview */}
							<div className="space-y-3">
								<Label className="font-semibold text-base">Live Preview</Label>
								<div className="flex justify-center">
									<ThemePreview config={config} />
								</div>
							</div>
						</TabsContent>

						<TabsContent value="about" className="mt-0 space-y-4 pb-4">
							{/* Version Info */}
							<div className="space-y-2">
								<Label>Version Information</Label>
								<VersionInfo />
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
