import {
	ExternalLink,
	Menu,
	MessageSquare,
	Minimize2,
	Settings,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuSeparator,
	ResponsiveDropdownMenuTrigger,
} from "@/components/ui/responsive-dropdown-menu";
import { useChatWindows, useSystemTray, useTauri } from "@/hooks/useTauri";

type TauriMenuProps = {
	onOpenSettings?: () => void;
	onOpenContacts?: () => void;
	onNewChat?: () => void;
};

export function TauriMenu({
	onOpenSettings,
	onOpenContacts,
	onNewChat,
}: TauriMenuProps) {
	const { isTauri } = useTauri();
	const { minimizeToTray } = useSystemTray();
	const { openChatWindow } = useChatWindows();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Don't render if not in Tauri
	if (!isTauri) return null;

	const handleMinimizeToTray = async () => {
		try {
			await minimizeToTray();
			setIsMenuOpen(false);
		} catch (error) {
			console.error("Failed to minimize to tray:", error);
		}
	};

	const handleNewChatWindow = async () => {
		try {
			// This would typically be called with actual chat data
			// For now, we'll just demonstrate the functionality
			await openChatWindow("demo-chat", "Demo Contact");
			setIsMenuOpen(false);
		} catch (error) {
			console.error("Failed to open chat window:", error);
		}
	};

	const handleMenuAction = (action: () => void) => {
		action();
		setIsMenuOpen(false);
	};

	return (
		<div className="tauri-menu">
			<ResponsiveDropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<ResponsiveDropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						aria-label="Application menu"
					>
						<Menu className="h-4 w-4" />
					</Button>
				</ResponsiveDropdownMenuTrigger>
				<ResponsiveDropdownMenuContent
					align="start"
					className="w-56"
					title="Application Menu"
				>
					<ResponsiveDropdownMenuItem
						onClick={() => handleMenuAction(onNewChat || (() => {}))}
					>
						<MessageSquare className="mr-2 h-4 w-4" />
						New Chat
					</ResponsiveDropdownMenuItem>

					<ResponsiveDropdownMenuItem onClick={handleNewChatWindow}>
						<ExternalLink className="mr-2 h-4 w-4" />
						New Chat Window
					</ResponsiveDropdownMenuItem>

					<ResponsiveDropdownMenuSeparator />

					<ResponsiveDropdownMenuItem
						onClick={() => handleMenuAction(onOpenContacts || (() => {}))}
					>
						<Users className="mr-2 h-4 w-4" />
						Manage Contacts
					</ResponsiveDropdownMenuItem>

					<ResponsiveDropdownMenuItem
						onClick={() => handleMenuAction(onOpenSettings || (() => {}))}
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</ResponsiveDropdownMenuItem>

					<ResponsiveDropdownMenuSeparator />

					<ResponsiveDropdownMenuItem onClick={handleMinimizeToTray}>
						<Minimize2 className="mr-2 h-4 w-4" />
						Minimize to Tray
					</ResponsiveDropdownMenuItem>
				</ResponsiveDropdownMenuContent>
			</ResponsiveDropdownMenu>
		</div>
	);
}

// Window controls for custom title bar (if needed)
export function TauriWindowControls() {
	const { isTauri, platform } = useTauri();
	const { minimizeToTray } = useSystemTray();

	// Don't render if not in Tauri or on macOS (which has native controls)
	if (!isTauri || platform === "macos") return null;

	const handleMinimize = async () => {
		try {
			await minimizeToTray();
		} catch (error) {
			console.error("Failed to minimize window:", error);
		}
	};

	const handleClose = async () => {
		try {
			// The close event is handled by Rust backend to minimize to tray
			window.close();
		} catch (error) {
			console.error("Failed to close window:", error);
		}
	};

	return (
		<div className="tauri-window-controls flex items-center space-x-1">
			<Button
				variant="ghost"
				size="sm"
				className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
				onClick={handleMinimize}
				aria-label="Minimize"
			>
				<Minimize2 className="h-3 w-3" />
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white"
				onClick={handleClose}
				aria-label="Close"
			>
				<X className="h-3 w-3" />
			</Button>
		</div>
	);
}
