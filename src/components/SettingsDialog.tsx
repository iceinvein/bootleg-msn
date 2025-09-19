import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { BrowserNotificationSettings } from "./BrowserNotificationSettings";
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

// Animation configurations
const tabTransition = {
	duration: 0.25,
	ease: "easeInOut" as const,
};

const itemTransition = {
	duration: 0.15,
	ease: "easeOut" as const,
};

export function SettingsDialog({ children }: SettingsDialogProps) {
	const user = useQuery(api.auth.loggedInUser);
	const updateUserName = useMutation(api.auth.updateUserName);
	const { signOut } = useAuthActions();
	const { theme, setTheme } = useTheme();
	const { config, presets, applyPreset } = useThemeCustomization();
	const [name, setName] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);
	const [activeTab, setActiveTab] = useState("account");

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
				<div className="flex flex-col">
					<ResponsiveDialogHeader className="flex-shrink-0">
						<ResponsiveDialogTitle>Settings</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Manage your account settings and preferences.
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex max-h-[calc(85vh-8rem)] w-full flex-col overflow-hidden"
					>
						<TabsList className="grid w-full flex-shrink-0 grid-cols-4">
							<TabsTrigger value="account">Account</TabsTrigger>
							<TabsTrigger value="notifications">Notifications</TabsTrigger>
							<TabsTrigger value="appearance">Appearance</TabsTrigger>
							<TabsTrigger value="about">About</TabsTrigger>
						</TabsList>

						<div className="mt-4 flex-1 overflow-y-auto px-1">
							<AnimatePresence mode="wait">
								{activeTab === "account" && (
									<motion.div
										key="account"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={tabTransition}
									>
										<TabsContent
											value="account"
											className="mt-0 space-y-4 pb-4"
										>
											{/* Profile Settings */}
											<motion.div
												className="space-y-2"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.05 }}
											>
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
														disabled={
															isUpdating || !name.trim() || name === user?.name
														}
														size="sm"
													>
														{isUpdating ? "Saving..." : "Save"}
													</Button>
												</div>
											</motion.div>

											{/* Account Info */}
											<motion.div
												className="space-y-2"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.1 }}
											>
												<Label>Email</Label>
												<div className="text-gray-600 text-sm dark:text-gray-400">
													{user?.email || "Not set"}
												</div>
											</motion.div>

											<Separator />

											{/* Actions */}
											<motion.div
												className="flex justify-end"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.15 }}
											>
												<Button
													variant="destructive"
													onClick={() => void signOut()}
													className="flex items-center space-x-2"
												>
													<LogOut className="h-4 w-4" />
													<span>Sign Out</span>
												</Button>
											</motion.div>
										</TabsContent>
									</motion.div>
								)}

								{activeTab === "notifications" && (
									<motion.div
										key="notifications"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={tabTransition}
									>
										<TabsContent
											value="notifications"
											className="mt-0 space-y-4 pb-4"
										>
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.05 }}
											>
												<BrowserNotificationSettings />
											</motion.div>
										</TabsContent>
									</motion.div>
								)}

								{activeTab === "appearance" && (
									<motion.div
										key="appearance"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={tabTransition}
									>
										<TabsContent
											value="appearance"
											className="mt-0 space-y-6 pb-4"
										>
											{/* Theme Mode */}
											<motion.div
												className="space-y-3"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.05 }}
											>
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ ...itemTransition, delay: 0.1 }}
												>
													<Label className="font-semibold text-base">
														Theme Mode
													</Label>
												</motion.div>
												<motion.div
													className="flex gap-2"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ ...itemTransition, delay: 0.15 }}
												>
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
												</motion.div>
											</motion.div>

											<Separator />

											{/* Color Themes */}
											<motion.div
												className="space-y-3"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.2 }}
											>
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ ...itemTransition, delay: 0.25 }}
												>
													<Label className="font-semibold text-base">
														Color Themes
													</Label>
												</motion.div>
												<motion.div
													className="grid grid-cols-2 gap-3 lg:grid-cols-3"
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													transition={{ ...itemTransition, delay: 0.3 }}
												>
													{Object.entries(presets).map(
														([key, preset], index) => (
															<motion.div
																key={key}
																initial={{ opacity: 0 }}
																animate={{ opacity: 1 }}
																whileHover={{
																	scale: 1.05,
																	transition: {
																		duration: 0.2,
																		ease: "easeOut",
																	},
																}}
																whileTap={{
																	scale: 0.95,
																	transition: {
																		duration: 0.1,
																		ease: "easeInOut",
																	},
																}}
																transition={{
																	...itemTransition,
																	delay: 0.35 + index * 0.02,
																}}
																className="h-full"
															>
																<Card
																	className={`flex h-full cursor-pointer flex-col transition-all duration-200 ${
																		config.preset === key
																			? "shadow-lg ring-2 ring-primary"
																			: "hover:shadow-md"
																	}`}
																	onClick={() => applyPreset(key)}
																>
																	<CardHeader className="flex-shrink-0 pb-2">
																		<CardTitle className="text-sm">
																			{preset.name}
																		</CardTitle>
																	</CardHeader>
																	<CardContent className="flex flex-1 flex-col justify-between pt-0">
																		<div className="mb-2 flex gap-1">
																			<div
																				className="h-3 w-3 rounded-full border"
																				style={{
																					backgroundColor:
																						preset.colors.primary,
																				}}
																			/>
																			<div
																				className="h-3 w-3 rounded-full border"
																				style={{
																					backgroundColor:
																						preset.colors.secondary,
																				}}
																			/>
																			<div
																				className="h-3 w-3 rounded-full border"
																				style={{
																					backgroundColor: preset.colors.accent,
																				}}
																			/>
																		</div>
																		<p className="line-clamp-3 text-muted-foreground text-xs">
																			{preset.description}
																		</p>
																	</CardContent>
																</Card>
															</motion.div>
														),
													)}
												</motion.div>
											</motion.div>

											{/* Live Preview */}
											<motion.div
												className="space-y-3"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.4 }}
											>
												<Label className="font-semibold text-base">
													Live Preview
												</Label>
												<div className="flex justify-center">
													<ThemePreview config={config} />
												</div>
											</motion.div>
										</TabsContent>
									</motion.div>
								)}

								{activeTab === "about" && (
									<motion.div
										key="about"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={tabTransition}
									>
										<TabsContent value="about" className="mt-0 space-y-4 pb-4">
											{/* Version Info */}
											<motion.div
												className="space-y-2"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ ...itemTransition, delay: 0.05 }}
											>
												<Label>Version Information</Label>
												<VersionInfo />
											</motion.div>
										</TabsContent>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</Tabs>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
