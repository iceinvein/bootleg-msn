/**
 * Tests for TauriMenu component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriMenu, TauriWindowControls } from "../TauriMenu";

// Mock Tauri hooks
const mockMinimizeToTray = vi.fn();
const mockOpenChatWindow = vi.fn();
const mockUseTauri = vi.fn();
const mockUseSystemTray = vi.fn();
const mockUseChatWindows = vi.fn();

vi.mock("@/hooks/useTauri", () => ({
	useTauri: () => mockUseTauri(),
	useSystemTray: () => mockUseSystemTray(),
	useChatWindows: () => mockUseChatWindows(),
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, ...props }: any) => (
		<button onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/responsive-dropdown-menu", () => ({
	ResponsiveDropdownMenu: ({ children, open, onOpenChange }: any) => (
		<div data-testid="dropdown-menu" data-open={open}>
			{children}
		</div>
	),
	ResponsiveDropdownMenuTrigger: ({ children }: any) => (
		<div data-testid="dropdown-trigger">{children}</div>
	),
	ResponsiveDropdownMenuContent: ({ children, title }: any) => (
		<div data-testid="dropdown-content" title={title}>
			{children}
		</div>
	),
	ResponsiveDropdownMenuItem: ({ children, onClick }: any) => (
		<div data-testid="dropdown-item" onClick={onClick}>
			{children}
		</div>
	),
	ResponsiveDropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	Menu: () => <div data-testid="menu-icon" />,
	MessageSquare: () => <div data-testid="message-square-icon" />,
	ExternalLink: () => <div data-testid="external-link-icon" />,
	Users: () => <div data-testid="users-icon" />,
	Settings: () => <div data-testid="settings-icon" />,
	Minimize2: () => <div data-testid="minimize-icon" />,
	X: () => <div data-testid="x-icon" />,
}));

describe("TauriMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Default mock implementations
		mockUseTauri.mockReturnValue({
			isTauri: true,
			platform: "windows",
		});
		
		mockUseSystemTray.mockReturnValue({
			minimizeToTray: mockMinimizeToTray,
		});
		
		mockUseChatWindows.mockReturnValue({
			openChatWindow: mockOpenChatWindow,
		});
	});

	describe("Rendering", () => {
		it("should render menu when in Tauri environment", () => {
			render(<TauriMenu />);

			expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
			expect(screen.getByTestId("dropdown-trigger")).toBeInTheDocument();
			expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
		});

		it("should not render when not in Tauri environment", () => {
			mockUseTauri.mockReturnValue({
				isTauri: false,
				platform: "web",
			});

			const { container } = render(<TauriMenu />);
			expect(container.firstChild).toBeNull();
		});

		it("should render all menu items when open", () => {
			render(<TauriMenu />);

			expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();
			expect(screen.getAllByTestId("dropdown-item")).toHaveLength(5);
			expect(screen.getAllByTestId("dropdown-separator")).toHaveLength(2);
		});

		it("should render menu items with correct icons", () => {
			render(<TauriMenu />);

			expect(screen.getByTestId("message-square-icon")).toBeInTheDocument();
			expect(screen.getByTestId("external-link-icon")).toBeInTheDocument();
			expect(screen.getByTestId("users-icon")).toBeInTheDocument();
			expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
			expect(screen.getByTestId("minimize-icon")).toBeInTheDocument();
		});
	});

	describe("Menu Actions", () => {
		it("should call onNewChat when New Chat is clicked", () => {
			const mockOnNewChat = vi.fn();
			render(<TauriMenu onNewChat={mockOnNewChat} />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[0]); // First item is "New Chat"

			expect(mockOnNewChat).toHaveBeenCalledTimes(1);
		});

		it("should call openChatWindow when New Chat Window is clicked", async () => {
			render(<TauriMenu />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[1]); // Second item is "New Chat Window"

			await waitFor(() => {
				expect(mockOpenChatWindow).toHaveBeenCalledWith("demo-chat", "Demo Contact");
			});
		});

		it("should call onOpenContacts when Manage Contacts is clicked", () => {
			const mockOnOpenContacts = vi.fn();
			render(<TauriMenu onOpenContacts={mockOnOpenContacts} />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[2]); // Third item is "Manage Contacts"

			expect(mockOnOpenContacts).toHaveBeenCalledTimes(1);
		});

		it("should call onOpenSettings when Settings is clicked", () => {
			const mockOnOpenSettings = vi.fn();
			render(<TauriMenu onOpenSettings={mockOnOpenSettings} />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[3]); // Fourth item is "Settings"

			expect(mockOnOpenSettings).toHaveBeenCalledTimes(1);
		});

		it("should call minimizeToTray when Minimize to Tray is clicked", async () => {
			render(<TauriMenu />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[4]); // Fifth item is "Minimize to Tray"

			await waitFor(() => {
				expect(mockMinimizeToTray).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle minimizeToTray errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			mockMinimizeToTray.mockRejectedValue(new Error("Minimize failed"));

			render(<TauriMenu />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[4]); // Minimize to Tray

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to minimize to tray:", expect.any(Error));
			});

			consoleSpy.mockRestore();
		});

		it("should handle openChatWindow errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			mockOpenChatWindow.mockRejectedValue(new Error("Open window failed"));

			render(<TauriMenu />);

			const menuItems = screen.getAllByTestId("dropdown-item");
			fireEvent.click(menuItems[1]); // New Chat Window

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to open chat window:", expect.any(Error));
			});

			consoleSpy.mockRestore();
		});
	});

	describe("Accessibility", () => {
		it("should have proper aria-label for menu button", () => {
			render(<TauriMenu />);

			const menuButton = screen.getByLabelText("Application menu");
			expect(menuButton).toBeInTheDocument();
		});

		it("should have proper title for dropdown content", () => {
			render(<TauriMenu />);

			const dropdownContent = screen.getByTestId("dropdown-content");
			expect(dropdownContent).toHaveAttribute("title", "Application Menu");
		});
	});
});

describe("TauriWindowControls", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock window.close
		Object.defineProperty(window, "close", {
			value: vi.fn(),
			writable: true,
		});
		
		mockUseTauri.mockReturnValue({
			isTauri: true,
			platform: "windows",
		});
		
		mockUseSystemTray.mockReturnValue({
			minimizeToTray: mockMinimizeToTray,
		});
	});

	describe("Rendering", () => {
		it("should render window controls when in Tauri on Windows", () => {
			render(<TauriWindowControls />);

			expect(screen.getByLabelText("Minimize")).toBeInTheDocument();
			expect(screen.getByLabelText("Close")).toBeInTheDocument();
			expect(screen.getByTestId("minimize-icon")).toBeInTheDocument();
			expect(screen.getByTestId("x-icon")).toBeInTheDocument();
		});

		it("should render window controls when in Tauri on Linux", () => {
			mockUseTauri.mockReturnValue({
				isTauri: true,
				platform: "linux",
			});

			render(<TauriWindowControls />);

			expect(screen.getByLabelText("Minimize")).toBeInTheDocument();
			expect(screen.getByLabelText("Close")).toBeInTheDocument();
		});

		it("should not render when not in Tauri environment", () => {
			mockUseTauri.mockReturnValue({
				isTauri: false,
				platform: "web",
			});

			const { container } = render(<TauriWindowControls />);
			expect(container.firstChild).toBeNull();
		});

		it("should not render on macOS (native controls)", () => {
			mockUseTauri.mockReturnValue({
				isTauri: true,
				platform: "macos",
			});

			const { container } = render(<TauriWindowControls />);
			expect(container.firstChild).toBeNull();
		});
	});

	describe("Window Control Actions", () => {
		it("should call minimizeToTray when minimize button is clicked", async () => {
			render(<TauriWindowControls />);

			const minimizeButton = screen.getByLabelText("Minimize");
			fireEvent.click(minimizeButton);

			await waitFor(() => {
				expect(mockMinimizeToTray).toHaveBeenCalledTimes(1);
			});
		});

		it("should call window.close when close button is clicked", () => {
			render(<TauriWindowControls />);

			const closeButton = screen.getByLabelText("Close");
			fireEvent.click(closeButton);

			expect(window.close).toHaveBeenCalledTimes(1);
		});
	});

	describe("Error Handling", () => {
		it("should handle minimize errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			mockMinimizeToTray.mockRejectedValue(new Error("Minimize failed"));

			render(<TauriWindowControls />);

			const minimizeButton = screen.getByLabelText("Minimize");
			fireEvent.click(minimizeButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to minimize window:", expect.any(Error));
			});

			consoleSpy.mockRestore();
		});

		it("should handle close errors gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const mockClose = vi.fn().mockImplementation(() => {
				throw new Error("Close failed");
			});
			Object.defineProperty(window, "close", {
				value: mockClose,
				writable: true,
			});

			render(<TauriWindowControls />);

			const closeButton = screen.getByLabelText("Close");
			fireEvent.click(closeButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith("Failed to close window:", expect.any(Error));
			});

			consoleSpy.mockRestore();
		});
	});
});
