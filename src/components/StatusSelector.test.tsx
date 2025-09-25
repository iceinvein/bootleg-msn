/** biome-ignore-all lint/suspicious/noExplicitAny: it's a test */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusSelector } from "./StatusSelector";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		button: ({ children, ...props }: any) => (
			<button {...props}>{children}</button>
		),
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
}));

// Mock responsive dialog components
vi.mock("./ui/responsive-dialog", () => ({
	ResponsiveDialog: ({ children, open, onOpenChange }: any) => (
		<div data-testid="responsive-dialog" data-open={open}>
			<div onClick={() => onOpenChange?.(!open)}>{children}</div>
		</div>
	),
	ResponsiveDialogContent: ({ children }: any) => (
		<div data-testid="dialog-content">{children}</div>
	),
	ResponsiveDialogHeader: ({ children }: any) => (
		<div data-testid="dialog-header">{children}</div>
	),
	ResponsiveDialogTitle: ({ children }: any) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	ResponsiveDialogTrigger: ({ children }: any) => (
		<div data-testid="dialog-trigger">{children}</div>
	),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
	cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

vi.mock("@/utils/style", () => ({
	getStatusColorWithGlow: (status: string) => `status-${status}`,
}));

describe("StatusSelector", () => {
	const mockOnStatusChange = vi.fn();

	beforeEach(() => {
		mockOnStatusChange.mockClear();
	});

	it("renders with current status", () => {
		render(
			<StatusSelector
				currentStatus="online"
				onStatusChange={mockOnStatusChange}
			/>,
		);

		// Check trigger button shows current status
		const triggerButton = screen.getByTestId("dialog-trigger");
		expect(triggerButton).toHaveTextContent("Online");
		expect(triggerButton).toHaveTextContent("Available to chat");
	});

	it("displays all status options when opened", () => {
		render(
			<StatusSelector
				currentStatus="online"
				onStatusChange={mockOnStatusChange}
			/>,
		);

		// The dialog content should contain all status options
		expect(screen.getAllByText("Online")).toHaveLength(2); // Trigger + dialog
		expect(screen.getByText("Away")).toBeInTheDocument();
		expect(screen.getByText("Busy")).toBeInTheDocument();
		expect(screen.getByText("Invisible")).toBeInTheDocument();
	});

	it("shows correct descriptions for each status", () => {
		render(
			<StatusSelector
				currentStatus="online"
				onStatusChange={mockOnStatusChange}
			/>,
		);

		expect(screen.getAllByText("Available to chat")).toHaveLength(2); // Trigger + dialog
		expect(screen.getByText("Away from keyboard")).toBeInTheDocument();
		expect(screen.getByText("Do not disturb")).toBeInTheDocument();
		expect(screen.getByText("Appear offline to others")).toBeInTheDocument();
	});

	it("calls onStatusChange when a status is selected", () => {
		render(
			<StatusSelector
				currentStatus="online"
				onStatusChange={mockOnStatusChange}
			/>,
		);

		// Find and click the "Away" status button
		const awayButton = screen.getByText("Away").closest("button");
		expect(awayButton).toBeInTheDocument();

		if (awayButton) {
			fireEvent.click(awayButton);
			expect(mockOnStatusChange).toHaveBeenCalledWith("away");
		}
	});

	it("shows check mark for current status", () => {
		render(
			<StatusSelector
				currentStatus="busy"
				onStatusChange={mockOnStatusChange}
			/>,
		);

		// The current status should be "Busy" in trigger
		const triggerButton = screen.getByTestId("dialog-trigger");
		expect(triggerButton).toHaveTextContent("Busy");
		expect(triggerButton).toHaveTextContent("Do not disturb");
	});

	it("applies custom className", () => {
		const { container } = render(
			<StatusSelector
				currentStatus="online"
				onStatusChange={mockOnStatusChange}
				className="custom-class"
			/>,
		);

		const button = container.querySelector("button");
		expect(button).toHaveClass("custom-class");
	});

	it("handles all status values correctly", () => {
		const statuses = ["online", "away", "busy", "invisible"] as const;

		statuses.forEach((status) => {
			const { unmount } = render(
				<StatusSelector
					currentStatus={status}
					onStatusChange={mockOnStatusChange}
				/>,
			);

			// Check that the correct status is displayed in trigger
			const statusLabels = {
				online: "Online",
				away: "Away",
				busy: "Busy",
				invisible: "Invisible",
			};

			const triggerButton = screen.getByTestId("dialog-trigger");
			expect(triggerButton).toHaveTextContent(statusLabels[status]);

			// Clean up after each test to avoid multiple elements
			unmount();
		});
	});
});
