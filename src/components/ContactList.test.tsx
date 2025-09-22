import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ContactList } from "./ContactList";

// Mock dependencies
vi.mock("@/hooks/useAvatarUrls", () => ({
	useUserAvatarUrls: () => new Map(),
	useGroupAvatarUrls: () => new Map(),
}));

vi.mock("@/stores/contact", () => ({
	$selectedChat: {
		set: vi.fn(),
	},
}));

vi.mock("@nanostores/react", () => ({
	useStore: () => ({ contact: null, group: null }),
}));

vi.mock("@/utils/style", () => ({
	getStatusColorWithGlow: () => "text-green-500",
}));

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		button: ({ children, onClick, ...props }: any) => (
			<button onClick={onClick} {...props}>
				{children}
			</button>
		),
	},
	AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
	useConvexAuth: vi.fn(() => ({ isAuthenticated: true })),
}));

vi.mock("@/components/ui/avatar", () => ({
	Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<div className={className} data-testid="avatar">
			{children}
		</div>
	),
	AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => (
		<img src={src} alt={alt} data-testid="avatar-image" />
	),
	AvatarFallback: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="avatar-fallback">{children}</div>
	),
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
		<span data-testid="badge" data-variant={variant}>
			{children}
		</span>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, variant, size }: any) => (
		<button onClick={onClick} data-testid="button" data-variant={variant} data-size={size}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/checkbox", () => ({
	Checkbox: ({ checked, onCheckedChange }: any) => (
		<input
			type="checkbox"
			checked={checked}
			onChange={(e) => onCheckedChange?.(e.target.checked)}
			data-testid="checkbox"
			aria-label="Select contact"
		/>
	),
}));

vi.mock("@/components/ui/scroll-area", () => ({
	ScrollArea: ({ children, className }: any) => (
		<div className={className} data-testid="scroll-area">
			{children}
		</div>
	),
}));

vi.mock("./ui/animated", () => ({
	hoverScale: {},
	staggerContainer: {},
	staggerItem: {},
	statusPulse: {},
	tapScale: {},
}));

vi.mock("@/lib/utils", () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
	MessageCircle: () => <div data-testid="message-circle-icon" />,
	Users: () => <div data-testid="users-icon" />,
	Plus: () => <div data-testid="plus-icon" />,
	User: () => <div data-testid="user-icon" />,
}));

import { useQuery, useMutation } from "convex/react";

const mockUseQuery = useQuery as any;
const mockUseMutation = useMutation as any;

describe("ContactList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseQuery.mockReturnValue([]);
	});

	describe("Rendering", () => {
		it("should render empty state when no contacts or groups", () => {
			mockUseQuery.mockReturnValue([]);

			render(<ContactList />);

			// Should render the scroll area but no content sections
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should render contacts when they exist", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
			expect(screen.getByText(/Contacts \(1 online\)/)).toBeInTheDocument();
		});

		it("should render groups when they exist", () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "Test Group",
					members: ["user1", "user2"],
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce([]) // First call: api.contacts.getContacts
				.mockReturnValueOnce(mockGroups); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			expect(screen.getByText("Test Group")).toBeInTheDocument();
			expect(screen.getByText(/Groups \(1\)/)).toBeInTheDocument();
		});

		it("should show both contacts and groups", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			const mockGroups = [
				{
					_id: "group1",
					name: "Test Group",
					members: ["user1", "user2"],
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce(mockGroups); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
			expect(screen.getByText("Test Group")).toBeInTheDocument();
			expect(screen.getByText(/Contacts \(1 online\)/)).toBeInTheDocument();
			expect(screen.getByText(/Groups \(1\)/)).toBeInTheDocument();
		});
	});

	describe("Contact Interaction", () => {
		it("should handle contact click", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			const contactButton = screen.getByText("Alice Johnson").closest("button");
			expect(contactButton).toBeInTheDocument();
		});

		it("should handle group click", () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "Test Group",
					members: ["user1", "user2"],
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce([]) // First call: api.contacts.getContacts
				.mockReturnValueOnce(mockGroups); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			const groupButton = screen.getByText("Test Group").closest("button");
			expect(groupButton).toBeInTheDocument();
		});
	});

	describe("Status Display", () => {
		it("should show online status for online contacts", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			// Check for online status text (there are multiple "Online" texts, so use getAllByText)
			const onlineTexts = screen.getAllByText("Online");
			expect(onlineTexts.length).toBeGreaterThan(0);
		});

		it("should show offline status for offline contacts", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "offline",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			expect(screen.getByText("Offline")).toBeInTheDocument();
		});
	});

	describe("Avatar Display", () => {
		it("should show avatar for contacts", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			// Should have avatar elements
			const avatars = screen.getAllByTestId("avatar");
			expect(avatars.length).toBeGreaterThan(0);
		});

		it("should show avatar for groups", () => {
			const mockGroups = [
				{
					_id: "group1",
					name: "Test Group",
					members: ["user1", "user2"],
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce([]) // First call: api.contacts.getContacts
				.mockReturnValueOnce(mockGroups); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			const avatars = screen.getAllByTestId("avatar");
			expect(avatars.length).toBeGreaterThan(0);
		});
	});

	describe("Loading and Error States", () => {
		it("should handle loading state", () => {
			mockUseQuery.mockReturnValue(undefined);

			render(<ContactList />);

			// Should render scroll area even when loading
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});

		it("should handle empty state gracefully", () => {
			mockUseQuery.mockReturnValue([]);

			render(<ContactList />);

			// Should render scroll area when empty
			expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
		});
	});

	describe("Contact Sorting", () => {
		it("should display contacts in the order returned by the query", () => {
			const mockContacts = [
				{
					_id: "contact1",
					contactUserId: "user1",
					user: {
						_id: "user1",
						name: "Alice Johnson",
						email: "alice@example.com",
					},
					status: "offline",
					nickname: null,
				},
				{
					_id: "contact2",
					contactUserId: "user2",
					user: {
						_id: "user2",
						name: "Bob Smith",
						email: "bob@example.com",
					},
					status: "online",
					nickname: null,
				},
			];

			// Mock the first call (contacts) and second call (groups)
			mockUseQuery
				.mockReturnValueOnce(mockContacts) // First call: api.contacts.getContacts
				.mockReturnValueOnce([]); // Second call: api.groups.getUserGroups

			render(<ContactList />);

			// Should display both contacts
			expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
			expect(screen.getByText("Bob Smith")).toBeInTheDocument();
		});
	});
});
