import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./popover";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";

type ResponsivePopoverProps = {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

type ResponsivePopoverTriggerProps = {
	children: React.ReactNode;
	asChild?: boolean;
	disabled?: boolean;
	className?: string;
};

type ResponsivePopoverContentProps = {
	children: React.ReactNode;
	className?: string;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	title?: string;
	showCloseButton?: boolean;
};

// Context to share the mobile state
const ResponsivePopoverContext = React.createContext<{
	isMobile: boolean;
}>({
	isMobile: false,
});

function ResponsivePopover({
	children,
	open,
	onOpenChange,
}: ResponsivePopoverProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	const contextValue = React.useMemo(
		() => ({ isMobile }),
		[isMobile]
	);

	if (isMobile) {
		return (
			<ResponsivePopoverContext.Provider value={contextValue}>
				<Drawer open={open} onOpenChange={onOpenChange}>
					{children}
				</Drawer>
			</ResponsivePopoverContext.Provider>
		);
	}

	return (
		<ResponsivePopoverContext.Provider value={contextValue}>
			<Popover open={open} onOpenChange={onOpenChange}>
				{children}
			</Popover>
		</ResponsivePopoverContext.Provider>
	);
}

function ResponsivePopoverTrigger({
	children,
	asChild,
	disabled,
	className,
}: ResponsivePopoverTriggerProps) {
	const { isMobile } = React.useContext(ResponsivePopoverContext);

	if (isMobile) {
		return (
			<DrawerTrigger asChild={asChild} disabled={disabled} className={className}>
				{children}
			</DrawerTrigger>
		);
	}

	return (
		<PopoverTrigger asChild={asChild} disabled={disabled} className={className}>
			{children}
		</PopoverTrigger>
	);
}

function ResponsivePopoverContent({
	children,
	className,
	align = "center",
	side = "bottom",
	sideOffset = 4,
	title,
	showCloseButton = false,
}: ResponsivePopoverContentProps) {
	const { isMobile } = React.useContext(ResponsivePopoverContext);

	if (isMobile) {
		// Remove width constraints for mobile and ensure full width
		const mobileClassName = className
			?.replace(/w-\d+/g, '') // Remove width classes like w-80, w-96, etc.
			?.replace(/max-w-\[[^\]]+\]/g, '') // Remove max-width constraints
			?.replace(/min-w-\[[^\]]+\]/g, '') // Remove min-width constraints
			+ ' w-full'; // Ensure full width on mobile

		return (
			<DrawerContent className={`p-4 pb-8 ${mobileClassName || "w-full"}`}>
				<div className="flex flex-col max-h-[80vh] overflow-hidden">
					{(title || showCloseButton) && (
						<DrawerHeader className="pb-4">
							{title && <DrawerTitle>{title}</DrawerTitle>}
							{showCloseButton && (
								<DrawerClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
									<span className="sr-only">Close</span>
								</DrawerClose>
							)}
						</DrawerHeader>
					)}
					<div className="flex-1 overflow-auto">
						{children}
					</div>
				</div>
			</DrawerContent>
		);
	}

	return (
		<PopoverContent
			className={className}
			align={align}
			side={side}
			sideOffset={sideOffset}
		>
			{children}
		</PopoverContent>
	);
}

export {
	ResponsivePopover,
	ResponsivePopoverTrigger,
	ResponsivePopoverContent,
	ResponsivePopoverContext,
};
