import { Eye, Palette, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { ThemePreview } from "./ThemePreview";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "./ui/responsive-dialog";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function ThemeCustomizer() {
	const {
		config,
		presets,
		updateConfig,
		applyPreset,
		resetToDefault,
		isGlassmorphismSupported,
	} = useThemeCustomization();
	const [isOpen, setIsOpen] = useState(false);

	const handleColorChange = (colorType: string, value: string) => {
		updateConfig({
			colors: {
				...config.colors,
				[colorType]: value,
			},
		});
	};

	const handleGlassmorphismChange = (
		property: string,
		value: boolean | string,
	) => {
		updateConfig({
			glassmorphism: {
				...config.glassmorphism,
				[property]: value,
			},
		});
	};

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
			<ResponsiveDialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="border-border bg-background/80 backdrop-blur-md"
				>
					<Palette className="h-4 w-4" />
					<span className="sr-only">Customize theme</span>
				</Button>
			</ResponsiveDialogTrigger>
			<ResponsiveDialogContent className="max-w-2xl" glass={true}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center gap-2">
						<Sparkles className="msn-gradient-text h-5 w-5" />
						MSN Theme Customizer
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Personalize your MSN Messenger experience with custom colors and
						glassmorphism effects
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div>
						<Tabs defaultValue="presets" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="presets">Presets</TabsTrigger>
								<TabsTrigger value="colors">Colors</TabsTrigger>
								<TabsTrigger value="effects">Effects</TabsTrigger>
							</TabsList>

							<TabsContent value="presets" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									{Object.entries(presets).map(([key, preset]) => (
										<Card
											key={key}
											className={`cursor-pointer transition-all hover:scale-105 ${
												config.preset === key
													? "msn-gradient ring-2 ring-primary"
													: "border-border bg-background/60 backdrop-blur-sm"
											}`}
											onClick={() => applyPreset(key)}
										>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm">{preset.name}</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="mb-2 text-muted-foreground text-xs">
													{preset.description}
												</p>
												<div className="flex gap-1">
													<div
														className="h-4 w-4 rounded-full border"
														style={{ backgroundColor: preset.colors.primary }}
													/>
													<div
														className="h-4 w-4 rounded-full border"
														style={{ backgroundColor: preset.colors.secondary }}
													/>
													<div
														className="h-4 w-4 rounded-full border"
														style={{ backgroundColor: preset.colors.accent }}
													/>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</TabsContent>

							<TabsContent value="colors" className="space-y-4">
								<div className="grid grid-cols-1 gap-4">
									<div className="space-y-2">
										<Label htmlFor="primary-color">Primary Color</Label>
										<div className="flex items-center gap-2">
											<input
												id="primary-color"
												type="color"
												value={config.colors.primary}
												onChange={(e) =>
													handleColorChange("primary", e.target.value)
												}
												className="h-8 w-12 cursor-pointer rounded border"
												title="Select primary color"
												aria-label="Primary color picker"
											/>
											<span className="font-mono text-sm">
												{config.colors.primary}
											</span>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="secondary-color">Secondary Color</Label>
										<div className="flex items-center gap-2">
											<input
												id="secondary-color"
												type="color"
												value={config.colors.secondary}
												onChange={(e) =>
													handleColorChange("secondary", e.target.value)
												}
												className="h-8 w-12 cursor-pointer rounded border"
												title="Select secondary color"
												aria-label="Secondary color picker"
											/>
											<span className="font-mono text-sm">
												{config.colors.secondary}
											</span>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="accent-color">Accent Color</Label>
										<div className="flex items-center gap-2">
											<input
												id="accent-color"
												type="color"
												value={config.colors.accent}
												onChange={(e) =>
													handleColorChange("accent", e.target.value)
												}
												className="h-8 w-12 cursor-pointer rounded border"
												title="Select accent color"
												aria-label="Accent color picker"
											/>
											<span className="font-mono text-sm">
												{config.colors.accent}
											</span>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="effects" className="space-y-4">
								{isGlassmorphismSupported ? (
									<>
										<div className="flex items-center justify-between">
											<div className="space-y-0.5">
												<Label>Enable Glassmorphism</Label>
												<p className="text-muted-foreground text-xs">
													Add modern glass effects to UI elements
												</p>
											</div>
											<Switch
												checked={config.glassmorphism.enabled}
												onCheckedChange={(checked) =>
													handleGlassmorphismChange("enabled", checked)
												}
											/>
										</div>

										{config.glassmorphism.enabled && (
											<>
												<div className="space-y-2">
													<Label>Glass Intensity</Label>
													<div className="flex gap-2">
														{["subtle", "medium", "strong"].map((intensity) => (
															<Button
																key={intensity}
																variant={
																	config.glassmorphism.intensity === intensity
																		? "default"
																		: "outline"
																}
																size="sm"
																onClick={() =>
																	handleGlassmorphismChange(
																		"intensity",
																		intensity,
																	)
																}
																className="capitalize"
															>
																{intensity}
															</Button>
														))}
													</div>
												</div>

												<div className="space-y-2">
													<Label>Blur Amount</Label>
													<div className="flex gap-2">
														{["sm", "md", "lg", "xl"].map((blur) => (
															<Button
																key={blur}
																variant={
																	config.glassmorphism.blur === blur
																		? "default"
																		: "outline"
																}
																size="sm"
																onClick={() =>
																	handleGlassmorphismChange("blur", blur)
																}
																className="uppercase"
															>
																{blur}
															</Button>
														))}
													</div>
												</div>
											</>
										)}
									</>
								) : (
									<Card className="border-border bg-background/60 backdrop-blur-sm">
										<CardContent className="pt-6">
											<div className="flex items-center gap-2 text-muted-foreground">
												<Eye className="h-4 w-4" />
												<p className="text-sm">
													Glassmorphism effects are not supported in your
													browser
												</p>
											</div>
										</CardContent>
									</Card>
								)}
							</TabsContent>
						</Tabs>
					</div>

					{/* Live Preview */}
					<div className="space-y-2">
						<h3 className="font-medium text-sm">Live Preview</h3>
						<ThemePreview config={config} />
					</div>
				</div>

				<div className="flex justify-between pt-4">
					<Button variant="outline" onClick={resetToDefault}>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reset to Default
					</Button>
					<Button onClick={() => setIsOpen(false)} className="msn-gradient">
						Apply Changes
					</Button>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
