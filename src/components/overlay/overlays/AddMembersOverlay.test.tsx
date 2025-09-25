import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddMembersOverlay } from "./AddMembersOverlay";

vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(() => ({ group: { _id: "group1" } })),
}));

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
	useQuery: () => mockUseQuery(),
	useMutation: () => mockUseMutation(),
}));

vi.mock("@/components/ui/responsive-dialog", () => ({
	ResponsiveDialog: ({
		children,
		open,
		onOpenChange,
	}: {
		children: React.ReactNode;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => (
		<div data-testid="responsive-dialog" data-open={open}>
			<button onClick={() => onOpenChange(!open)}>Toggle Dialog</button>
			{children}
		</div>
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
	ResponsiveDialogDescription: ({
		children,
	}: {
		children: React.ReactNode;
	}) => <p data-testid="dialog-description">{children}</p>,
	ResponsiveDialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-footer">{children}</div>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({ placeholder, value, onChange, ...props }: any) => (
		<input
			data-testid={`input-${placeholder.toLowerCase().replace(/\s+/g, "-")}`}
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
			data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, "-")}`}
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
		<img data-testid="avatar-image" src={src} />
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

vi.mock("lucide-react", () => ({
	UserPlus: () => <div />,
	Search: () => <div />,
	User: () => <div />,
	Users: () => <div />,
	CheckSquare: () => <div />,
	Square: () => <div />,
}));

vi.mock("@/hooks/useAvatarUrls", () => ({
	useUserAvatarUrls: vi.fn(() => new Map()),
}));
vi.mock("@/utils/style", () => ({ getStatusColor: vi.fn(() => "green") }));

const contacts = [
	{
		_id: "c1" as any,
		contactUserId: "u1" as any,
		user: { name: "Alice", email: "alice@example.com" },
		nickname: "Alice",
		status: "accepted" as const,
	},
	{
		_id: "c2" as any,
		contactUserId: "u2" as any,
		user: { name: "Bob", email: "bob@example.com" },
		nickname: "Bob",
		status: "accepted" as const,
	},
];
const members = [{ _id: "m1" as any, userId: "u3" as any }];

describe("AddMembersOverlay", () => {
	beforeEach(() => {
		mockUseQuery.mockImplementation((q: any) => {
			const s = q?.toString?.() ?? "";
			if (s.includes("getContacts")) return contacts;
			if (s.includes("getGroupMembers")) return members;
			return [];
		});
		mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue(undefined));
	});

	it("renders header and basic structure", () => {
		render(<AddMembersOverlay onClose={vi.fn()} />);
		expect(screen.getByTestId("dialog-title")).toHaveTextContent(
			"Add Members to Group",
		);
		expect(screen.getByTestId("dialog-description")).toBeInTheDocument();
		expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
	});

	it("shows search input and disabled submit initially", () => {
		render(<AddMembersOverlay onClose={vi.fn()} />);
		expect(screen.getByTestId("input-search-contacts...")).toBeInTheDocument();
		const addBtn = screen.getByTestId("button-add-,0,-member,s");
		expect(addBtn).toBeDisabled();
	});
});
