import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassVariants = cva(
	"backdrop-blur-md border border-white/20 shadow-lg",
	{
		variants: {
			variant: {
				default: "bg-background/80",
				subtle: "bg-background/60",
				strong: "bg-background/90",
				card: "bg-card/70",
				overlay: "bg-background/20",
			},
			blur: {
				none: "backdrop-blur-none",
				sm: "backdrop-blur-sm",
				md: "backdrop-blur-md",
				lg: "backdrop-blur-lg",
				xl: "backdrop-blur-xl",
			},
			rounded: {
				none: "rounded-none",
				sm: "rounded-sm",
				md: "rounded-md",
				lg: "rounded-lg",
				xl: "rounded-xl",
				"2xl": "rounded-2xl",
				full: "rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			blur: "md",
			rounded: "lg",
		},
	},
);

export interface GlassProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof glassVariants> {
	asChild?: boolean;
}

const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
	({ className, variant, blur, rounded, asChild = false, ...props }, ref) => {
		const Comp = asChild ? React.Fragment : "div";

		if (asChild) {
			return (
				<div
					ref={ref}
					className={cn(glassVariants({ variant, blur, rounded }), className)}
					{...props}
				/>
			);
		}

		return (
			<Comp
				ref={ref}
				className={cn(glassVariants({ variant, blur, rounded }), className)}
				{...props}
			/>
		);
	},
);
Glass.displayName = "Glass";

// Glass Card Component
const GlassCard = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: "default" | "subtle" | "strong";
		blur?: "sm" | "md" | "lg" | "xl";
	}
>(({ className, variant = "card", blur = "md", ...props }, ref) => (
	<Glass
		ref={ref}
		variant={variant}
		blur={blur}
		rounded="xl"
		className={cn("p-6 shadow-xl", className)}
		{...props}
	/>
));
GlassCard.displayName = "GlassCard";

// Glass Modal/Dialog Overlay
const GlassOverlay = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		blur?: "sm" | "md" | "lg" | "xl";
	}
>(({ className, blur = "lg", ...props }, ref) => (
	<Glass
		ref={ref}
		variant="overlay"
		blur={blur}
		rounded="none"
		className={cn("fixed inset-0 z-50", className)}
		{...props}
	/>
));
GlassOverlay.displayName = "GlassOverlay";

// Glass Button variant
const GlassButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: "default" | "subtle" | "strong";
		blur?: "sm" | "md" | "lg";
		size?: "sm" | "md" | "lg";
	}
>(
	(
		{ className, variant = "subtle", blur = "sm", size = "md", ...props },
		ref,
	) => {
		const sizeClasses = {
			sm: "px-3 py-1.5 text-sm",
			md: "px-4 py-2 text-base",
			lg: "px-6 py-3 text-lg",
		};

		return (
			<button
				ref={ref}
				className={cn(
					glassVariants({ variant, blur, rounded: "lg" }),
					"transition-all duration-200 hover:scale-105 hover:shadow-xl",
					"focus:outline-none focus:ring-2 focus:ring-primary/50",
					"active:scale-95",
					sizeClasses[size],
					className,
				)}
				{...props}
			/>
		);
	},
);
GlassButton.displayName = "GlassButton";

// Glass Navigation/Sidebar
const GlassNav = React.forwardRef<
	HTMLElement,
	React.HTMLAttributes<HTMLElement> & {
		variant?: "default" | "subtle" | "strong";
		blur?: "sm" | "md" | "lg" | "xl";
	}
>(({ className, variant = "default", blur = "lg", ...props }, ref) => (
	<nav
		ref={ref}
		className={cn(
			glassVariants({ variant, blur, rounded: "none" }),
			"border-r border-white/10",
			className,
		)}
		{...props}
	/>
));
GlassNav.displayName = "GlassNav";

// Glass Input wrapper
const GlassInput = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: "default" | "subtle";
		blur?: "sm" | "md";
	}
>(({ className, variant = "subtle", blur = "sm", ...props }, ref) => (
	<Glass
		ref={ref}
		variant={variant}
		blur={blur}
		rounded="lg"
		className={cn("border-white/30 focus-within:border-primary/50", className)}
		{...props}
	/>
));
GlassInput.displayName = "GlassInput";

export {
	Glass,
	GlassCard,
	GlassOverlay,
	GlassButton,
	GlassNav,
	GlassInput,
	glassVariants,
};
