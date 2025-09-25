import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GroupInfoOverlay } from "./GroupInfoOverlay";

const mockOpen = vi.fn();

vi.mock("@/hooks/useOverlays", () => ({
	useOverlays: () => ({ open: mockOpen }),
}));
vi.mock("@/hooks/useAvatarUrls", () => ({
	useGroupAvatarUrls: vi.fn(() => new Map()),
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
}));

vi.mock("@/components/ui/avatar", () => ({
	Avatar: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="avatar">{children}</div>
	),
	AvatarImage: ({ src }: { src: string }) => (
		<img data-testid="avatar-image" src={src} />
	),
}));
vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick }: any) => (
		<button data-testid="button" onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock("lucide-react", () => ({
	Info: () => <div />,
	Users: () => <div />,
	UserPlus: () => <div />,
	Pencil: () => <div />,
}));

const mockGroup = { _id: "g1" as any, name: "Test Group", description: "Desc" };

describe("GroupInfoOverlay", () => {
	beforeEach(() => {
		mockOpen.mockClear();
	});

	it("renders header and group info", () => {
		render(<GroupInfoOverlay group={mockGroup} onClose={vi.fn()} />);
		expect(screen.getByTestId("dialog-title")).toHaveTextContent("Group Info");
		expect(screen.getByText("Test Group")).toBeInTheDocument();
		expect(screen.getByText("Desc")).toBeInTheDocument();
	});

	it("opens Add Members overlay when clicking action", () => {
		render(<GroupInfoOverlay group={mockGroup} onClose={vi.fn()} />);
		const btn = screen
			.getAllByTestId("button")
			.find((b) => b.textContent?.includes("Add Members"))!;
		fireEvent.click(btn);
		expect(mockOpen).toHaveBeenCalledWith(
			expect.objectContaining({ type: "ADD_MEMBERS" }),
		);
	});
});
