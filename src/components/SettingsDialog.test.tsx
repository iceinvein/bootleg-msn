import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsDialog } from "./SettingsDialog";

// Mock Convex hooks
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

// Mock auth hooks
vi.mock("@convex-dev/auth/react", () => ({
	useAuthActions: vi.fn(() => ({
		signOut: vi.fn(),
	})),
}));

// Mock theme hooks
vi.mock("@/components/theme-provider", () => ({
	useTheme: vi.fn(() => ({
		theme: "light",
		setTheme: vi.fn(),
	})),
}));

// Mock avatar hooks
vi.mock("@/hooks/useAvatarUrls", () => ({
	useUserAvatarUrls: vi.fn(() => new Map()),
}));

// Mock theme customization hooks
vi.mock("@/hooks/useThemeCustomization", () => ({
	useThemeCustomization: vi.fn(() => ({
		config: {},
		presets: [],
		applyPreset: vi.fn(),
	})),
}));

// Mock child components
vi.mock("./AvatarEditor", () => ({
	AvatarEditor: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
		<div data-testid="avatar-editor" data-open={open}>
			<button onClick={() => onOpenChange(false)}>Close Avatar Editor</button>
		</div>
	),
}));

vi.mock("./BrowserNotificationSettings", () => ({
	BrowserNotificationSettings: () => (
		<div data-testid="browser-notification-settings">Notification Settings</div>
	),
}));

vi.mock("./ThemePreview", () => ({
	ThemePreview: ({ config }: { config: any }) => (
		<div data-testid="theme-preview">Theme Preview</div>
	),
}));

vi.mock("./VersionInfo", () => ({
	VersionInfo: () => (
		<div data-testid="version-info">Version Info</div>
	),
}));

// Mock UI components
vi.mock("./ui/responsive-dialog", () => ({
	ResponsiveDialog: ({ children, open, onOpenChange }: any) => (
		<div data-testid="responsive-dialog" data-open={open}>
			<button onClick={() => onOpenChange?.(!open)}>Toggle Dialog</button>
			{children}
		</div>
	),
	ResponsiveDialogTrigger: ({ children }: any) => (
		<div data-testid="dialog-trigger">{children}</div>
	),
	ResponsiveDialogContent: ({ children }: any) => (
		<div data-testid="dialog-content">{children}</div>
	),
	ResponsiveDialogHeader: ({ children }: any) => (
		<div data-testid="dialog-header">{children}</div>
	),
	ResponsiveDialogTitle: ({ children }: any) => (
		<div data-testid="dialog-title">{children}</div>
	),
	ResponsiveDialogDescription: ({ children }: any) => (
		<div data-testid="dialog-description">{children}</div>
	),
}));

vi.mock("./ui/tabs", () => ({
	Tabs: ({ children, value, onValueChange }: any) => (
		<div data-testid="tabs" data-value={value}>
			<button onClick={() => onValueChange?.("account")}>Account Tab</button>
			<button onClick={() => onValueChange?.("notifications")}>Notifications Tab</button>
			<button onClick={() => onValueChange?.("appearance")}>Appearance Tab</button>
			<button onClick={() => onValueChange?.("about")}>About Tab</button>
			{children}
		</div>
	),
	TabsList: ({ children }: any) => (
		<div data-testid="tabs-list">{children}</div>
	),
	TabsTrigger: ({ children, value }: any) => (
		<button data-testid={`tab-trigger-${value}`} data-value={value}>{children}</button>
	),
	TabsContent: ({ children, value }: any) => (
		<div data-testid={`tab-content-${value}`} data-value={value}>{children}</div>
	),
}));

vi.mock("./ui/avatar", () => ({
	Avatar: ({ children, className }: any) => (
		<div data-testid="avatar" className={className}>{children}</div>
	),
	AvatarImage: ({ src }: any) => (
		<img data-testid="avatar-image" src={src} alt="Avatar" />
	),
	AvatarFallback: ({ children }: any) => (
		<div data-testid="avatar-fallback">{children}</div>
	),
}));

vi.mock("./ui/button", () => ({
	Button: ({ children, onClick, variant }: any) => (
		<button data-testid="button" onClick={onClick} data-variant={variant}>
			{children}
		</button>
	),
}));

vi.mock("./ui/input", () => ({
	Input: ({ value, onChange, placeholder }: any) => (
		<input 
			data-testid="input" 
			value={value} 
			onChange={onChange} 
			placeholder={placeholder}
		/>
	),
}));

vi.mock("./ui/label", () => ({
	Label: ({ children }: any) => (
		<label data-testid="label">{children}</label>
	),
}));

vi.mock("./ui/separator", () => ({
	Separator: () => <div data-testid="separator" />,
}));

vi.mock("./ui/card", () => ({
	Card: ({ children }: any) => <div data-testid="card">{children}</div>,
	CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
	CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
	CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	LogOut: () => <div data-testid="logout-icon" />,
	Moon: () => <div data-testid="moon-icon" />,
	Palette: () => <div data-testid="palette-icon" />,
	Pencil: () => <div data-testid="pencil-icon" />,
	Sun: () => <div data-testid="sun-icon" />,
	User: () => <div data-testid="user-icon" />,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe("SettingsDialog", () => {
	const mockUser = {
		_id: "user1" as any,
		_creationTime: Date.now(),
		name: "John Doe",
		email: "john@example.com",
	};

	let mockUseQuery: any;
	let mockUseMutation: any;
	let mockUpdateUserName: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get the mocked functions
		const { useQuery, useMutation } = await import("convex/react");
		mockUseQuery = vi.mocked(useQuery);
		mockUseMutation = vi.mocked(useMutation);
		mockUpdateUserName = vi.fn();

		mockUseMutation.mockReturnValue(mockUpdateUserName);
		mockUseQuery.mockReturnValue(mockUser);
	});

	describe("Rendering", () => {
		it("should render dialog trigger", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
			expect(screen.getByText("Open Settings")).toBeInTheDocument();
		});

		it("should render dialog content when opened", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
			expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
			expect(screen.getByText("Settings")).toBeInTheDocument();
		});

		it("should render all tabs", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByTestId("tabs")).toBeInTheDocument();
			expect(screen.getByText("Account Tab")).toBeInTheDocument();
			expect(screen.getByText("Notifications Tab")).toBeInTheDocument();
			expect(screen.getByText("Appearance Tab")).toBeInTheDocument();
			expect(screen.getByText("About Tab")).toBeInTheDocument();
		});
	});

	describe("Initial Tab Functionality", () => {
		it("should default to account tab when no initialTab prop is provided", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			const tabs = screen.getByTestId("tabs");
			expect(tabs).toHaveAttribute("data-value", "account");
		});

		it("should open to specified initial tab", () => {
			render(
				<SettingsDialog initialTab="appearance">
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			const tabs = screen.getByTestId("tabs");
			expect(tabs).toHaveAttribute("data-value", "appearance");
		});

		it("should reset to initial tab when dialog reopens", async () => {
			render(
				<SettingsDialog initialTab="account">
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Switch to a different tab
			fireEvent.click(screen.getByText("About Tab"));

			// Close dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Reopen dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should be back to account tab
			await waitFor(() => {
				const tabs = screen.getByTestId("tabs");
				expect(tabs).toHaveAttribute("data-value", "account");
			});
		});

		it("should handle different initial tab values", () => {
			const { rerender } = render(
				<SettingsDialog initialTab="notifications">
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			let tabs = screen.getByTestId("tabs");
			expect(tabs).toHaveAttribute("data-value", "notifications");

			// Close dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Rerender with different initial tab
			rerender(
				<SettingsDialog initialTab="about">
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog again
			fireEvent.click(screen.getByText("Toggle Dialog"));

			tabs = screen.getByTestId("tabs");
			expect(tabs).toHaveAttribute("data-value", "about");
		});
	});

	describe("Tab Navigation", () => {
		it("should allow switching between tabs", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Initially on account tab
			let tabs = screen.getByTestId("tabs");
			expect(tabs).toHaveAttribute("data-value", "account");

			// Switch to notifications tab
			fireEvent.click(screen.getByText("Notifications Tab"));
			expect(tabs).toHaveAttribute("data-value", "notifications");

			// Switch to appearance tab
			fireEvent.click(screen.getByText("Appearance Tab"));
			expect(tabs).toHaveAttribute("data-value", "appearance");

			// Switch to about tab
			fireEvent.click(screen.getByText("About Tab"));
			expect(tabs).toHaveAttribute("data-value", "about");
		});
	});

	describe("Dialog State Management", () => {
		it("should manage dialog open/close state", () => {
			render(
				<SettingsDialog>
					<button>Open Settings</button>
				</SettingsDialog>
			);

			// Initially closed
			expect(screen.getByTestId("responsive-dialog")).toHaveAttribute("data-open", "false");

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));
			expect(screen.getByTestId("responsive-dialog")).toHaveAttribute("data-open", "true");

			// Close dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));
			expect(screen.getByTestId("responsive-dialog")).toHaveAttribute("data-open", "false");
		});
	});
});
