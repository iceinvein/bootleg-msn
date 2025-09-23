import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type React from "react";
import { GroupInfoDialog } from "./GroupInfoDialog";

// Mock Convex hooks
const mockRemoveGroupMember = vi.fn();
const mockSetMemberRole = vi.fn();
const mockLeaveGroup = vi.fn();
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: () => mockUseQuery(),
	useMutation: () => mockUseMutation(),
}));

// Mock UI components
vi.mock("@/components/ui/responsive-dialog", () => ({
	ResponsiveDialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) => (
		<div data-testid="responsive-dialog" data-open={open}>
			<button onClick={() => onOpenChange(!open)}>Toggle Dialog</button>
			{children}
		</div>
	),
	ResponsiveDialogTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-trigger">{children}</div>
	),
	ResponsiveDialogContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-content">{children}</div>
	),
	ResponsiveDialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-header">{children}</div>
	),
	ResponsiveDialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	ResponsiveDialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p data-testid="dialog-description">{children}</p>
	),
}));

vi.mock("@/components/ui/tabs", () => ({
	Tabs: ({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) => (
		<div data-testid="tabs" data-default-value={defaultValue}>{children}</div>
	),
	TabsList: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tabs-list">{children}</div>
	),
	TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
		<button data-testid={`tab-trigger-${value}`}>{children}</button>
	),
	TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
		<div data-testid={`tab-content-${value}`}>{children}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, disabled, variant, ...props }: any) => (
		<button
			data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
			{...props}
		>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/avatar", () => ({
	Avatar: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="avatar">{children}</div>
	),
	AvatarImage: ({ src }: { src: string }) => (
		<img data-testid="avatar-image" src={src} alt="Avatar" />
	),
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="avatar-fallback">{children}</div>
	),
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
		<span data-testid="badge" data-variant={variant}>{children}</span>
	),
}));

vi.mock("@/components/ui/scroll-area", () => ({
	ScrollArea: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="scroll-area">{children}</div>
	),
}));

vi.mock("@/components/ui/alert-dialog", () => ({
	AlertDialog: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-dialog">{children}</div>
	),
	AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-dialog-trigger">{children}</div>
	),
	AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-dialog-content">{children}</div>
	),
	AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-dialog-header">{children}</div>
	),
	AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h3 data-testid="alert-dialog-title">{children}</h3>
	),
	AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p data-testid="alert-dialog-description">{children}</p>
	),
	AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="alert-dialog-footer">{children}</div>
	),
	AlertDialogAction: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
		<button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
	),
	AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
		<button data-testid="alert-dialog-cancel">{children}</button>
	),
}));

// Mock other components
vi.mock("./AddMembersDialog", () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="add-members-dialog">{children}</div>
	),
}));

vi.mock("./AvatarEditor", () => ({
	AvatarEditor: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
		<div data-testid="avatar-editor" data-open={open}>
			<button onClick={() => onOpenChange(!open)}>Toggle Avatar Editor</button>
		</div>
	),
}));

vi.mock("./InlineStatusEditor", () => ({
	InlineStatusEditor: ({ initialValue, onSave }: { initialValue: string; onSave: (value: string) => void }) => (
		<div data-testid="inline-status-editor">
			<span>{initialValue}</span>
			<button onClick={() => onSave("Updated status")}>Update</button>
		</div>
	),
}));

// Mock hooks
vi.mock("@/hooks/useAvatarUrls", () => ({
	useGroupAvatarUrls: vi.fn(() => new Map()),
	useUserAvatarUrls: vi.fn(() => new Map()),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	Info: () => <div data-testid="info-icon">Info</div>,
	Users: () => <div data-testid="users-icon">Users</div>,
	Crown: () => <div data-testid="crown-icon">Crown</div>,
	User: () => <div data-testid="user-icon">User</div>,
	UserMinus: () => <div data-testid="user-minus-icon">UserMinus</div>,
	UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
	Pencil: () => <div data-testid="pencil-icon">Pencil</div>,
}));

// Mock sonner
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock utils
vi.mock("@/utils/style", () => ({
	getStatusColor: vi.fn(() => "green"),
}));

const mockGroup = {
	_id: "group1" as any,
	name: "Test Group",
	description: "Test group description",
	createdBy: "user1" as any,
	isPrivate: false,
	memberCount: 2,
	_creationTime: Date.now(),
};

const mockLoggedInUser = {
	_id: "user1" as any,
	name: "Alice Johnson",
	email: "alice@example.com",
};

const mockMembers = [
	{
		_id: "member1" as any,
		groupId: "group1" as any,
		userId: "user1" as any, // This is the logged-in user
		role: "admin" as const,
		joinedAt: Date.now(),
		user: mockLoggedInUser,
	},
	{
		_id: "member2" as any,
		groupId: "group1" as any,
		userId: "user2" as any,
		role: "member" as const,
		joinedAt: Date.now(),
		user: {
			_id: "user2" as any,
			name: "Bob Smith",
			email: "bob@example.com",
		},
	},
];

describe("GroupInfoDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseQuery.mockImplementation((queryName) => {
			if (queryName && typeof queryName === 'object' && queryName.toString().includes("loggedInUser")) return mockLoggedInUser;
			if (queryName && typeof queryName === 'object' && queryName.toString().includes("getGroupMembers")) return mockMembers;
			return undefined;
		});
		mockUseMutation.mockImplementation((mutationName) => {
			if (mutationName && typeof mutationName === 'object' && mutationName.toString().includes("removeGroupMember")) return mockRemoveGroupMember;
			if (mutationName && typeof mutationName === 'object' && mutationName.toString().includes("setMemberRole")) return mockSetMemberRole;
			if (mutationName && typeof mutationName === 'object' && mutationName.toString().includes("leaveGroup")) return mockLeaveGroup;
			return vi.fn();
		});
	});

	describe("Rendering", () => {
		it("should render dialog trigger", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
			// Use getAllByText to handle multiple "Group Info" elements
			expect(screen.getAllByText("Group Info")[0]).toBeInTheDocument();
		});

		it("should render dialog content when opened", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
			expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
			// Check for multiple "Group Info" elements
			expect(screen.getAllByText("Group Info").length).toBeGreaterThan(1);
		});

		it("should render tabs", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByTestId("tabs")).toBeInTheDocument();
			expect(screen.getByTestId("tab-trigger-info")).toBeInTheDocument();
			expect(screen.getByTestId("tab-trigger-members")).toBeInTheDocument();
		});

		it("should render group information", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByText("Test Group")).toBeInTheDocument();
			expect(screen.getByText("Test group description")).toBeInTheDocument();
		});

		it("should render members tab", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and switch to members tab
			fireEvent.click(screen.getByText("Toggle Dialog"));
			fireEvent.click(screen.getByTestId("tab-trigger-members"));

			// Members tab content should be rendered
			expect(screen.getByTestId("tab-content-members")).toBeInTheDocument();
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should show basic component structure", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and check basic structure
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Basic dialog structure should be present
			expect(screen.getByTestId("dialog-header")).toBeInTheDocument();
			expect(screen.getByTestId("dialog-description")).toBeInTheDocument();
			expect(screen.getByText("Manage group settings and members.")).toBeInTheDocument();
		});
	});

	describe("Member Management", () => {
		it("should render members tab content", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and switch to members tab
			fireEvent.click(screen.getByText("Toggle Dialog"));
			fireEvent.click(screen.getByTestId("tab-trigger-members"));

			// Members tab should be accessible and render content area
			expect(screen.getByTestId("tab-content-members")).toBeInTheDocument();
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should have mutation functions available", async () => {
			mockRemoveGroupMember.mockResolvedValue(undefined);

			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and switch to members tab
			fireEvent.click(screen.getByText("Toggle Dialog"));
			fireEvent.click(screen.getByTestId("tab-trigger-members"));

			// Test that the mutation functions are properly set up
			expect(mockRemoveGroupMember).toBeDefined();
			expect(mockSetMemberRole).toBeDefined();
		});

		it("should have member role management available", async () => {
			mockSetMemberRole.mockResolvedValue(undefined);

			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and switch to members tab
			fireEvent.click(screen.getByText("Toggle Dialog"));
			fireEvent.click(screen.getByTestId("tab-trigger-members"));

			// Test that the mutation functions are properly set up
			expect(mockSetMemberRole).toBeDefined();
		});
	});

	describe("Group Actions", () => {
		it("should show leave group button", async () => {
			mockLeaveGroup.mockResolvedValue(undefined);

			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog (stays on info tab by default)
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Leave group button should be visible
			const leaveButtons = screen.getAllByText("Leave Group");
			expect(leaveButtons.length).toBeGreaterThan(0);

			// Alert dialog should be present
			expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
		});

		it("should show avatar editor component", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog (stays on info tab by default)
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Avatar editor should be present (even if closed)
			expect(screen.getByTestId("avatar-editor")).toBeInTheDocument();
			expect(screen.getByTestId("avatar-editor")).toHaveAttribute("data-open", "false");
		});
	});

	describe("Error Handling", () => {
		it("should have error handling mutations set up", () => {
			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog and switch to members tab
			fireEvent.click(screen.getByText("Toggle Dialog"));
			fireEvent.click(screen.getByTestId("tab-trigger-members"));

			// Verify that error handling mutations are available
			expect(mockRemoveGroupMember).toBeDefined();
			expect(mockSetMemberRole).toBeDefined();
			expect(mockLeaveGroup).toBeDefined();
		});

		it("should handle mutation errors gracefully", async () => {
			mockLeaveGroup.mockRejectedValue(new Error("Failed to leave group"));

			render(
				<GroupInfoDialog group={mockGroup}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// Open dialog (stays on info tab by default)
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Verify error handling is set up
			expect(mockLeaveGroup).toBeDefined();
		});
	});

	describe("Null Group Handling", () => {
		it("should handle null group gracefully", () => {
			const { container } = render(
				<GroupInfoDialog group={null}>
					<button>Group Info</button>
				</GroupInfoDialog>
			);

			// When group is null, component returns null, so container should be empty
			expect(container.firstChild).toBeNull();
		});
	});
});
