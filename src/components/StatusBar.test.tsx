import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusBar } from "./StatusBar";

// Mock Convex hooks
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

// Mock avatar hooks
vi.mock("@/hooks/useAvatarUrls", () => ({
	useUserAvatarUrls: vi.fn(() => new Map()),
}));

// Mock overlay hook
const openSpy = vi.fn();
vi.mock("@/hooks/useOverlays", () => ({
	useOverlays: () => ({ open: openSpy }),
}));

vi.mock("./StatusMessage", () => ({
	StatusMessage: ({
		initialStatus,
		onSave,
	}: {
		initialStatus: string;
		onSave: (message: string) => void;
	}) => (
		<div data-testid="status-message">
			<span>{initialStatus || "No status"}</span>
			<button onClick={() => onSave("New status")}>Update Status</button>
		</div>
	),
}));

vi.mock("./StatusSelector", () => ({
	StatusSelector: ({
		currentStatus,
		onStatusChange,
	}: {
		currentStatus: string;
		onStatusChange: (status: string) => void;
	}) => (
		<div data-testid="status-selector">
			<span>Current: {currentStatus}</span>
			<button onClick={() => onStatusChange("away")}>Change to Away</button>
			<button onClick={() => onStatusChange("busy")}>Change to Busy</button>
			<button onClick={() => onStatusChange("invisible")}>
				Change to Invisible
			</button>
		</div>
	),
}));

// Mock Radix UI Avatar components
vi.mock("@radix-ui/react-avatar", () => ({
	Avatar: ({
		children,
		className,
		title,
		...props
	}: {
		children: React.ReactNode;
		className?: string;
		title?: string;
		[key: string]: any;
	}) => (
		<div data-testid="avatar" className={className} title={title} {...props}>
			{children}
		</div>
	),
	AvatarImage: ({ src }: { src: string }) => (
		<img data-testid="avatar-image" src={src} alt="Avatar" />
	),
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="avatar-fallback">{children}</div>
	),
}));

vi.mock("./ui/badge", () => ({
	Badge: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<span data-testid="badge" className={className}>
			{children}
		</span>
	),
}));

vi.mock("./ui/button", () => ({
	Button: (props: any) => (
		<button data-testid="button" {...props}>
			{props.children}
		</button>
	),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	Settings: () => <div data-testid="settings-icon" />,
	User: () => <div data-testid="user-icon" />,
	UserCheck: () => <div data-testid="user-check-icon" />,
	UserPlus: () => <div data-testid="user-plus-icon" />,
	Users: () => <div data-testid="users-icon" />,
}));

describe("StatusBar", () => {
	const mockUser = {
		_id: "user1" as any,
		_creationTime: Date.now(),
		name: "John Doe",
		email: "john@example.com",
	};

	let mockUseQuery: any;
	let mockUseMutation: any;
	let mockUpdateStatus: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Get the mocked functions
		const { useQuery, useMutation } = await import("convex/react");
		mockUseQuery = vi.mocked(useQuery);
		mockUseMutation = vi.mocked(useMutation);
		mockUpdateStatus = vi.fn();

		mockUseMutation.mockReturnValue(mockUpdateStatus);
		mockUseQuery.mockReturnValue([]);
	});

	describe("Rendering", () => {
		it("should render user information", () => {
			render(<StatusBar user={mockUser} />);

			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByTestId("avatar")).toBeInTheDocument();
		});

		it("should render with fallback name when user name is null", () => {
			const userWithoutName = { ...mockUser, name: null } as any;
			render(<StatusBar user={userWithoutName} />);

			expect(screen.getByText("You")).toBeInTheDocument();
		});

		it("should render status selector", () => {
			render(<StatusBar user={mockUser} />);

			expect(screen.getByTestId("status-selector")).toBeInTheDocument();
			expect(screen.getByText("Current: online")).toBeInTheDocument();
		});

		it("should render status message component", () => {
			render(<StatusBar user={mockUser} />);

			expect(screen.getByTestId("status-message")).toBeInTheDocument();
		});

		it("should render action buttons", () => {
			render(<StatusBar user={mockUser} />);

			// Buttons should be present
			expect(screen.getByTitle("Add contact")).toBeInTheDocument();
			expect(screen.getByTitle("Check Invites")).toBeInTheDocument();
			expect(screen.getByTitle("Create Group Chat")).toBeInTheDocument();
			expect(screen.getByTitle("Settings")).toBeInTheDocument();
		});

		it("should open settings from settings button without initial tab", () => {
			render(<StatusBar user={mockUser} />);
			openSpy.mockClear();
			fireEvent.click(screen.getByTitle("Settings"));
			expect(openSpy).toHaveBeenCalled();
			const call = openSpy.mock.calls.find((c) => c[0]?.type === "SETTINGS");
			expect(call).toBeTruthy();
			expect(call?.[0]?.props?.initialTab).toBeUndefined();
		});
	});

	describe("Status Management", () => {
		it("should handle status changes", async () => {
			render(<StatusBar user={mockUser} />);

			const changeToAwayButton = screen.getByText("Change to Away");
			fireEvent.click(changeToAwayButton);

			await waitFor(() => {
				expect(mockUpdateStatus).toHaveBeenCalledWith({
					status: "away",
					statusMessage: "",
				});
			});
		});

		it("should handle status message changes", async () => {
			render(<StatusBar user={mockUser} />);

			const updateStatusButton = screen.getByText("Update Status");
			fireEvent.click(updateStatusButton);

			await waitFor(() => {
				expect(mockUpdateStatus).toHaveBeenCalledWith({
					status: "online",
					statusMessage: "New status",
				});
			});
		});

		it("should handle multiple status changes", async () => {
			render(<StatusBar user={mockUser} />);

			// Change to busy first
			const changeToBusyButton = screen.getByText("Change to Busy");
			fireEvent.click(changeToBusyButton);

			await waitFor(() => {
				expect(mockUpdateStatus).toHaveBeenCalledWith({
					status: "busy",
					statusMessage: "",
				});
			});

			// Then change to invisible
			const changeToInvisibleButton = screen.getByText("Change to Invisible");
			fireEvent.click(changeToInvisibleButton);

			await waitFor(() => {
				expect(mockUpdateStatus).toHaveBeenCalledWith({
					status: "invisible",
					statusMessage: "",
				});
			});
		});
	});

	describe("Contact Requests Badge", () => {
		it("should show badge when there are pending requests", () => {
			mockUseQuery
				.mockReturnValueOnce([{ _id: "req1" }]) // pendingRequests
				.mockReturnValueOnce([]); // sentRequests

			render(<StatusBar user={mockUser} />);

			const badges = screen.getAllByTestId("badge");
			expect(badges.length).toBeGreaterThan(0);
		});

		it("should show badge when there are sent requests", () => {
			mockUseQuery
				.mockReturnValueOnce([]) // pendingRequests
				.mockReturnValueOnce([{ _id: "req1" }]); // sentRequests

			render(<StatusBar user={mockUser} />);

			const badges = screen.getAllByTestId("badge");
			expect(badges.length).toBeGreaterThan(0);
		});

		it("should show combined count for pending and sent requests", () => {
			mockUseQuery
				.mockReturnValueOnce([{ _id: "req1" }, { _id: "req2" }]) // pendingRequests
				.mockReturnValueOnce([{ _id: "req3" }]); // sentRequests

			render(<StatusBar user={mockUser} />);

			const badges = screen.getAllByTestId("badge");
			expect(badges.length).toBeGreaterThan(0);
		});

		it("should not show badge when there are no requests", () => {
			mockUseQuery
				.mockReturnValueOnce([]) // pendingRequests
				.mockReturnValueOnce([]); // sentRequests

			render(<StatusBar user={mockUser} />);

			// Should still render the invites button but without badge
			expect(screen.getByTitle("Check Invites")).toBeInTheDocument();
			expect(screen.queryByTestId("badge")).toBeNull();
		});
	});

	describe("Avatar Display", () => {
		it("should show avatar image when available", async () => {
			const { useUserAvatarUrls } = await import("@/hooks/useAvatarUrls");
			vi.mocked(useUserAvatarUrls).mockReturnValue(
				new Map([["user1" as any, "https://example.com/avatar.jpg"]]),
			);

			render(<StatusBar user={mockUser} />);

			expect(screen.getByTestId("avatar-image")).toBeInTheDocument();
			expect(screen.getByTestId("avatar-image")).toHaveAttribute(
				"src",
				"https://example.com/avatar.jpg",
			);
		});

		it("should show fallback when no avatar available", async () => {
			const { useUserAvatarUrls } = await import("@/hooks/useAvatarUrls");
			vi.mocked(useUserAvatarUrls).mockReturnValue(new Map());

			render(<StatusBar user={mockUser} />);

			expect(screen.getByTestId("avatar-fallback")).toBeInTheDocument();
			expect(screen.getByTestId("user-icon")).toBeInTheDocument();
		});

		it("should open settings with account tab when clicking avatar", () => {
			render(<StatusBar user={mockUser} />);
			openSpy.mockClear();
			fireEvent.click(screen.getByTestId("avatar"));
			expect(openSpy).toHaveBeenCalled();
			const call = openSpy.mock.calls.find((c) => c[0]?.type === "SETTINGS");
			expect(call?.[0]?.props?.initialTab).toBe("account");
		});

		it("should have clickable styling on avatar", () => {
			render(<StatusBar user={mockUser} />);

			const avatar = screen.getByTestId("avatar");
			expect(avatar).toHaveClass("cursor-pointer");
			expect(avatar).toHaveClass("hover:opacity-80");
			expect(avatar).toHaveClass("transition-opacity");
		});

		it("should have proper accessibility attributes on avatar", () => {
			render(<StatusBar user={mockUser} />);

			const avatar = screen.getByTestId("avatar");
			expect(avatar).toHaveAttribute("title", "Open Settings");
			expect(avatar).toHaveAttribute("aria-label", "Open Settings");
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing user data gracefully", () => {
			const incompleteUser = { _id: "user1" } as any;

			expect(() => render(<StatusBar user={incompleteUser} />)).not.toThrow();
		});

		it("should handle null user name gracefully", () => {
			const userWithNullName = { ...mockUser, name: null } as any;

			render(<StatusBar user={userWithNullName} />);

			expect(screen.getByText("You")).toBeInTheDocument();
		});

		it("should handle undefined user name gracefully", () => {
			const userWithUndefinedName = { ...mockUser, name: undefined };

			render(<StatusBar user={userWithUndefinedName} />);

			expect(screen.getByText("You")).toBeInTheDocument();
		});
	});
});
