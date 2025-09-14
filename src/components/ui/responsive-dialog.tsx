import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";

type ResponsiveDialogProps = {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

type ResponsiveDialogTriggerProps = {
	children: React.ReactNode;
	asChild?: boolean;
};

type ResponsiveDialogContentProps = {
	children: React.ReactNode;
	className?: string;
	glass?: boolean;
	showCloseButton?: boolean;
	animationType?: "scale" | "slideDown" | "fade";
};

type ResponsiveDialogHeaderProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveDialogTitleProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveDialogDescriptionProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveDialogCloseProps = {
	children: React.ReactNode;
	asChild?: boolean;
};

type ResponsiveDialogFooterProps = {
	children: React.ReactNode;
	className?: string;
};

// Context to share the mobile state
const ResponsiveDialogContext = React.createContext<{
	isMobile: boolean;
}>({
	isMobile: false,
});

function ResponsiveDialog({
	children,
	open,
	onOpenChange,
}: ResponsiveDialogProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	const contextValue = React.useMemo(
		() => ({ isMobile }),
		[isMobile]
	);

	if (isMobile) {
		return (
			<ResponsiveDialogContext.Provider value={contextValue}>
				<Drawer open={open} onOpenChange={onOpenChange}>
					{children}
				</Drawer>
			</ResponsiveDialogContext.Provider>
		);
	}

	return (
		<ResponsiveDialogContext.Provider value={contextValue}>
			<Dialog open={open} onOpenChange={onOpenChange}>
				{children}
			</Dialog>
		</ResponsiveDialogContext.Provider>
	);
}

function ResponsiveDialogTrigger({
	children,
	asChild,
}: ResponsiveDialogTriggerProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
	}

	return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}

function ResponsiveDialogContent({
	children,
	className,
	glass,
	showCloseButton,
	animationType,
}: ResponsiveDialogContentProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		// Remove height constraints and add mobile-optimized classes for drawer
		const mobileClassName = className
			?.replace(/max-h-\[[^\]]+\]/g, '') // Remove max-height constraints
			?.replace(/h-\[[^\]]+\]/g, '') // Remove height constraints
			+ ' flex flex-col max-h-[90vh] overflow-hidden'; // Add flex layout and scrolling

		return (
			<DrawerContent className={mobileClassName}>
				<div className="p-4 flex-1 overflow-y-auto" data-vaul-no-drag="true">
					{children}
				</div>
			</DrawerContent>
		);
	}

	return (
		<DialogContent
			className={className}
			glass={glass}
			showCloseButton={showCloseButton}
			animationType={animationType}
		>
			{children}
		</DialogContent>
	);
}

function ResponsiveDialogHeader({
	children,
	className,
}: ResponsiveDialogHeaderProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return (
			<DrawerHeader className={`${className} pb-4`}>
				{children}
			</DrawerHeader>
		);
	}

	return <DialogHeader className={className}>{children}</DialogHeader>;
}

function ResponsiveDialogTitle({
	children,
	className,
}: ResponsiveDialogTitleProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return <DrawerTitle className={className}>{children}</DrawerTitle>;
	}

	return <DialogTitle className={className}>{children}</DialogTitle>;
}

function ResponsiveDialogDescription({
	children,
	className,
}: ResponsiveDialogDescriptionProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return <DrawerDescription className={className}>{children}</DrawerDescription>;
	}

	return <DialogDescription className={className}>{children}</DialogDescription>;
}

function ResponsiveDialogClose({
	children,
	asChild,
}: ResponsiveDialogCloseProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
	}

	return <DialogClose asChild={asChild}>{children}</DialogClose>;
}

function ResponsiveDialogFooter({
	children,
	className,
}: ResponsiveDialogFooterProps) {
	const { isMobile } = React.useContext(ResponsiveDialogContext);

	if (isMobile) {
		return (
			<div className={`flex flex-col gap-3 pt-4 ${className || ''}`}>
				{children}
			</div>
		);
	}

	// Use DialogFooter from the original dialog component
	return <DialogFooter className={className}>{children}</DialogFooter>;
}

export {
	ResponsiveDialog,
	ResponsiveDialogTrigger,
	ResponsiveDialogContent,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogDescription,
	ResponsiveDialogClose,
	ResponsiveDialogFooter,
};
