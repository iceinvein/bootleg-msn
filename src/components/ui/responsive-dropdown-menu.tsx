import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";
import { Button } from "./button";
import { X } from "lucide-react";

type ResponsiveDropdownMenuProps = {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

type ResponsiveDropdownMenuTriggerProps = {
	children: React.ReactNode;
	asChild?: boolean;
	className?: string;
};

type ResponsiveDropdownMenuContentProps = {
	children: React.ReactNode;
	className?: string;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	title?: string;
	showCloseButton?: boolean;
};

type ResponsiveDropdownMenuItemProps = {
	children: React.ReactNode;
	onClick?: () => void;
	className?: string;
	disabled?: boolean;
};

type ResponsiveDropdownMenuLabelProps = {
	children: React.ReactNode;
	className?: string;
};

type ResponsiveDropdownMenuSeparatorProps = {
	className?: string;
};

// Context to share the mobile state
const ResponsiveDropdownMenuContext = React.createContext<{
	isMobile: boolean;
}>({
	isMobile: false,
});

function ResponsiveDropdownMenu({
	children,
	open,
	onOpenChange,
}: ResponsiveDropdownMenuProps) {
	const isMobile = useMediaQuery("(max-width: 768px)");

	const contextValue = React.useMemo(
		() => ({ isMobile }),
		[isMobile]
	);

	if (isMobile) {
		return (
			<ResponsiveDropdownMenuContext.Provider value={contextValue}>
				<Drawer open={open} onOpenChange={onOpenChange}>
					{children}
				</Drawer>
			</ResponsiveDropdownMenuContext.Provider>
		);
	}

	return (
		<ResponsiveDropdownMenuContext.Provider value={contextValue}>
			<DropdownMenu open={open} onOpenChange={onOpenChange}>
				{children}
			</DropdownMenu>
		</ResponsiveDropdownMenuContext.Provider>
	);
}

function ResponsiveDropdownMenuTrigger({
	children,
	asChild,
	className,
}: ResponsiveDropdownMenuTriggerProps) {
	const { isMobile } = React.useContext(ResponsiveDropdownMenuContext);

	if (isMobile) {
		return (
			<DrawerTrigger asChild={asChild} className={className}>
				{children}
			</DrawerTrigger>
		);
	}

	return (
		<DropdownMenuTrigger asChild={asChild} className={className}>
			{children}
		</DropdownMenuTrigger>
	);
}

function ResponsiveDropdownMenuContent({
	children,
	className,
	align = "center",
	side = "bottom",
	sideOffset = 4,
	title,
	showCloseButton = true,
}: ResponsiveDropdownMenuContentProps) {
	const { isMobile } = React.useContext(ResponsiveDropdownMenuContext);

	if (isMobile) {
		return (
			<DrawerContent className={`p-4 pb-8 ${className || ""}`}>
				<div className="flex flex-col max-h-[80vh] overflow-hidden">
					{(title || showCloseButton) && (
						<DrawerHeader className="pb-4 flex flex-row items-center justify-between">
							{title && <DrawerTitle>{title}</DrawerTitle>}
							{showCloseButton && (
								<DrawerClose asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 rounded-full"
									>
										<X className="h-4 w-4" />
										<span className="sr-only">Close</span>
									</Button>
								</DrawerClose>
							)}
						</DrawerHeader>
					)}
					<div className="flex-1 overflow-auto space-y-1">
						{children}
					</div>
				</div>
			</DrawerContent>
		);
	}

	return (
		<DropdownMenuContent
			className={className}
			align={align}
			side={side}
			sideOffset={sideOffset}
		>
			{children}
		</DropdownMenuContent>
	);
}

function ResponsiveDropdownMenuItem({
	children,
	onClick,
	className,
	disabled,
}: ResponsiveDropdownMenuItemProps) {
	const { isMobile } = React.useContext(ResponsiveDropdownMenuContext);

	if (isMobile) {
		return (
			<DrawerClose asChild>
				<Button
					variant="ghost"
					className={`w-full justify-start h-auto p-3 text-left font-normal ${className || ""}`}
					onClick={onClick}
					disabled={disabled}
				>
					{children}
				</Button>
			</DrawerClose>
		);
	}

	return (
		<DropdownMenuItem onClick={onClick} className={className} disabled={disabled}>
			{children}
		</DropdownMenuItem>
	);
}

function ResponsiveDropdownMenuLabel({
	children,
	className,
}: ResponsiveDropdownMenuLabelProps) {
	const { isMobile } = React.useContext(ResponsiveDropdownMenuContext);

	if (isMobile) {
		return (
			<div className={`px-3 py-2 text-sm font-medium text-muted-foreground ${className || ""}`}>
				{children}
			</div>
		);
	}

	return (
		<DropdownMenuLabel className={className}>
			{children}
		</DropdownMenuLabel>
	);
}

function ResponsiveDropdownMenuSeparator({
	className,
}: ResponsiveDropdownMenuSeparatorProps) {
	const { isMobile } = React.useContext(ResponsiveDropdownMenuContext);

	if (isMobile) {
		return <div className={`my-2 h-px bg-border ${className || ""}`} />;
	}

	return <DropdownMenuSeparator className={className} />;
}

export {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuTrigger,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuLabel,
	ResponsiveDropdownMenuSeparator,
	ResponsiveDropdownMenuContext,
};
