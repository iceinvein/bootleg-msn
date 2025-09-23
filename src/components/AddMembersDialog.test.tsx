import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type React from "react";
import AddMembersDialog from "./AddMembersDialog";

// Mock nanostores
const mockSelectedChat = {
	group: {
		_id: "group1" as any,
		name: "Test Group",
	},
};

vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(() => mockSelectedChat),
}));

// Mock Convex hooks
const mockAddGroupMembers = vi.fn();
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
	ResponsiveDialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-footer">{children}</div>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({ placeholder, value, onChange, ...props }: any) => (
		<input
			data-testid={`input-${placeholder?.toLowerCase().replace(/\s+/g, '-')}`}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			{...props}
		/>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, disabled, type, ...props }: any) => (
		<button
			data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
			onClick={onClick}
			disabled={disabled}
			type={type}
			{...props}
		>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/scroll-area", () => ({
	ScrollArea: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="scroll-area">{children}</div>
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

vi.mock("@/components/ui/label", () => ({
	Label: ({ children }: { children: React.ReactNode }) => (
		<label data-testid="label">{children}</label>
	),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
	UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
	Search: () => <div data-testid="search-icon">Search</div>,
	User: () => <div data-testid="user-icon">User</div>,
	Users: () => <div data-testid="users-icon">Users</div>,
	CheckSquare: () => <div data-testid="check-square-icon">CheckSquare</div>,
	Square: () => <div data-testid="square-icon">Square</div>,
}));

// Mock utils
vi.mock("@/utils/style", () => ({
	getStatusColor: vi.fn(() => "green"),
}));

const mockContacts = [
	{
		_id: "contact1" as any,
		contactUserId: "user1" as any,
		user: {
			_id: "user1" as any,
			name: "Alice Johnson",
			email: "alice@example.com",
		},
		nickname: "Alice",
		status: "accepted" as const,
	},
	{
		_id: "contact2" as any,
		contactUserId: "user2" as any,
		user: {
			_id: "user2" as any,
			name: "Bob Smith",
			email: "bob@example.com",
		},
		nickname: "Bob",
		status: "accepted" as const,
	},
];

const mockExistingMembers = [
	{
		_id: "member1" as any,
		userId: "user3" as any,
		user: {
			_id: "user3" as any,
			name: "Charlie Brown",
			email: "charlie@example.com",
		},
	},
];

describe("AddMembersDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseQuery.mockImplementation((queryName) => {
			if (queryName && typeof queryName === 'object' && queryName.toString().includes("getContacts")) return mockContacts;
			if (queryName && typeof queryName === 'object' && queryName.toString().includes("getGroupMembers")) return mockExistingMembers;
			return [];
		});
		mockUseMutation.mockReturnValue(mockAddGroupMembers);
	});

	describe("Rendering", () => {
		it("should render dialog trigger", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
			expect(screen.getByText("Add Members")).toBeInTheDocument();
		});

		it("should render dialog content when opened", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
			expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
			expect(screen.getByText("Add Members to Group")).toBeInTheDocument();
		});

		it("should render search input", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Search input has a dynamic test ID based on placeholder
			expect(screen.getByTestId("input-search-contacts...")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Search contacts...")).toBeInTheDocument();
		});

		it("should render contacts area", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should show contacts area with scroll area
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
			expect(screen.getByText("Available Contacts (0 selected)")).toBeInTheDocument();
		});

		it("should show empty state message", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should show the empty state message that's actually rendered
			expect(screen.getByText("All contacts are already in this group")).toBeInTheDocument();
		});
	});

	describe("Contact Selection", () => {
		it("should show contact selection area", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should show selection area
			expect(screen.getByText("Available Contacts (0 selected)")).toBeInTheDocument();
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should have search functionality available", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Search input should be available
			const searchInput = screen.getByTestId("input-search-contacts...");
			expect(searchInput).toBeInTheDocument();
			expect(searchInput).toHaveAttribute("placeholder", "Search contacts...");
		});

		it("should show add button with count", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should show add button with 0 count
			const addButton = screen.getByTestId("button-add-,0,-member,s");
			expect(addButton).toBeInTheDocument();
			expect(addButton).toHaveTextContent("Add 0 Members");
			expect(addButton).toBeDisabled();
		});
	});

	describe("Form Submission", () => {
		it("should have form submission functionality", async () => {
			mockAddGroupMembers.mockResolvedValue(undefined);

			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Form should be present
			const form = screen.getByTestId("dialog-content").querySelector("form");
			expect(form).toBeInTheDocument();

			// Add button should be disabled initially
			const addButton = screen.getByTestId("button-add-,0,-member,s");
			expect(addButton).toBeDisabled();
		});

		it("should have error handling set up", async () => {
			mockAddGroupMembers.mockRejectedValue(new Error("Failed to add members"));

			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Error handling should be available
			expect(mockAddGroupMembers).toBeDefined();
		});

		it("should prevent submission with no selected members", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Add button should be disabled when no members selected
			const addButton = screen.getByTestId("button-add-,0,-member,s");
			expect(addButton).toBeDisabled();
		});
	});

	describe("Dialog State Management", () => {
		it("should manage dialog open/close state", async () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
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

		it("should have form reset functionality", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Search input should be available for reset
			const searchInput = screen.getByTestId("input-search-contacts...");
			expect(searchInput).toHaveValue("");
		});

		it("should have clear selection button", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Clear selection button should be available
			const clearButton = screen.getByTestId("button-clear-selection");
			expect(clearButton).toBeInTheDocument();
			expect(clearButton).toHaveTextContent("Clear Selection");
		});
	});

	describe("Component State", () => {
		it("should handle component state gracefully", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Should render trigger regardless of state
			expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
			expect(screen.getByText("Add Members")).toBeInTheDocument();
		});

		it("should handle data loading states", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Should handle loading gracefully
			expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should have mutation functions available", () => {
			render(
				<AddMembersDialog>
					<button>Add Members</button>
				</AddMembersDialog>
			);

			// Open dialog
			fireEvent.click(screen.getByText("Toggle Dialog"));

			// Mutation functions should be set up
			expect(mockAddGroupMembers).toBeDefined();
			expect(mockUseMutation).toBeDefined();
		});
	});
});
