import { MessageCircle, User } from "lucide-react";
import type { CustomThemeConfig } from "@/hooks/useThemeCustomization";
import { cn } from "@/lib/utils";

type ThemePreviewProps = {
	config: CustomThemeConfig;
	className?: string;
};

export function ThemePreview({ config, className }: ThemePreviewProps) {
	const previewStyle = {
		"--preview-primary": config.colors.primary,
		"--preview-secondary": config.colors.secondary,
		"--preview-accent": config.colors.accent,
		"--preview-gradient": `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.accent} 100%)`,
	} as React.CSSProperties;

	return (
		<div
			className={cn("rounded-lg border bg-muted/30 p-4", className)}
			style={previewStyle}
		>
			<div className="space-y-3">
				{/* Header Preview */}
				<div
					className={cn(
						"rounded-lg p-3 text-white shadow-md",
						config.glassmorphism.enabled ? "bg-white/20 backdrop-blur-sm" : "",
					)}
					style={{
						background: config.glassmorphism.enabled
							? `${config.colors.primary}40`
							: config.colors.primary,
					}}
				>
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30">
							<User className="h-3 w-3" />
						</div>
						<span className="font-medium text-sm">John Doe</span>
						<div className="ml-auto h-2 w-2 rounded-full bg-green-400 shadow-sm" />
					</div>
				</div>

				{/* Contact List Preview */}
				<div className="space-y-1">
					<div className="px-2 text-muted-foreground text-xs uppercase tracking-wide">
						Contacts (2 online)
					</div>
					{["Alice Smith", "Bob Johnson"].map((name, index) => (
						<div
							key={name}
							className={cn(
								"flex cursor-pointer items-center gap-2 rounded-md p-2 transition-all",
								config.glassmorphism.enabled
									? "hover:bg-white/10 hover:backdrop-blur-sm"
									: "hover:bg-muted/50",
								index === 0 && config.glassmorphism.enabled
									? "backdrop-blur-sm"
									: "",
								index === 0 && !config.glassmorphism.enabled
									? "bg-primary/10"
									: "",
							)}
							style={
								index === 0
									? {
											background: config.glassmorphism.enabled
												? `${config.colors.secondary}20`
												: undefined,
										}
									: undefined
							}
						>
							<div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
								<User className="h-2 w-2" />
							</div>
							<span className="text-xs">{name}</span>
							<div
								className={cn(
									"ml-auto h-1.5 w-1.5 rounded-full",
									index === 0 ? "bg-green-400" : "bg-yellow-400",
								)}
							/>
						</div>
					))}
				</div>

				{/* Message Bubbles Preview */}
				<div className="space-y-2">
					<div className="flex justify-start">
						<div
							className={cn(
								"max-w-[80%] rounded-lg px-2 py-1 text-xs",
								config.glassmorphism.enabled
									? "border border-white/20 bg-background/60 backdrop-blur-sm"
									: "bg-muted",
							)}
						>
							Hey there! How are you?
						</div>
					</div>
					<div className="flex justify-end">
						<div
							className="max-w-[80%] rounded-lg px-2 py-1 text-white text-xs shadow-sm"
							style={{
								background: `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.accent} 100%)`,
							}}
						>
							I'm doing great! Thanks for asking 😊
						</div>
					</div>
				</div>

				{/* Input Preview */}
				<div
					className={cn(
						"rounded-lg border p-2 text-xs",
						config.glassmorphism.enabled
							? "border-white/30 bg-background/40 backdrop-blur-sm"
							: "border-border bg-background",
					)}
				>
					<div className="flex items-center gap-2">
						<MessageCircle className="h-3 w-3 text-muted-foreground" />
						<span className="text-muted-foreground">Type a message...</span>
					</div>
				</div>

				{/* Glassmorphism Indicator */}
				{config.glassmorphism.enabled && (
					<div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
						<div className="h-1 w-1 rounded-full bg-primary" />
						<span>Glassmorphism: {config.glassmorphism.intensity}</span>
						<div className="h-1 w-1 rounded-full bg-primary" />
					</div>
				)}
			</div>
		</div>
	);
}
