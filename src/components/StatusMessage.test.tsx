import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StatusMessage } from "./StatusMessage";

// Mock UI components
vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, size, variant, className }: any) => (
		<button
			data-testid="button"
			onClick={onClick}
			data-size={size}
			data-variant={variant}
			className={className}
		>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onChange,
		onKeyDown,
		onBlur,
		placeholder,
		maxLength,
		className,
		...props
	}: any) => (
		<input
			data-testid="input"
			value={value}
			onChange={onChange}
			onKeyDown={onKeyDown}
			onBlur={onBlur}
			placeholder={placeholder}
			maxLength={maxLength}
			className={className}
			{...props}
		/>
	),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	Check: () => <div data-testid="check-icon" />,
	Edit3: () => <div data-testid="edit-icon" />,
	X: () => <div data-testid="x-icon" />,
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
	cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("StatusMessage", () => {
	const mockOnSave = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Display Mode", () => {
		it("should render initial status", () => {
			render(
				<StatusMessage initialStatus="Working from home" onSave={mockOnSave} />,
			);

			expect(screen.getByText("Working from home")).toBeInTheDocument();
			expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
		});

		it("should show placeholder when no initial status", () => {
			render(<StatusMessage initialStatus="" onSave={mockOnSave} />);

			expect(screen.getByText("What's on your mind?")).toBeInTheDocument();
		});

		it("should show custom placeholder", () => {
			render(
				<StatusMessage
					initialStatus=""
					onSave={mockOnSave}
					placeholder="Custom placeholder"
				/>,
			);

			expect(screen.getByText("Custom placeholder")).toBeInTheDocument();
		});

		it("should apply custom className", () => {
			render(
				<StatusMessage
					initialStatus="Test status"
					onSave={mockOnSave}
					className="custom-class"
				/>,
			);

			const button = screen.getByRole("button");
			expect(button).toHaveClass("custom-class");
		});
	});

	describe("Edit Mode", () => {
		it("should enter edit mode when clicked", () => {
			render(
				<StatusMessage initialStatus="Working from home" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			expect(screen.getByTestId("input")).toBeInTheDocument();
			expect(screen.getByTestId("check-icon")).toBeInTheDocument();
			expect(screen.getByTestId("x-icon")).toBeInTheDocument();
		});

		it("should focus and select input when entering edit mode", () => {
			render(
				<StatusMessage initialStatus="Working from home" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			expect(input).toHaveFocus();
		});

		it("should show current status in input", () => {
			render(
				<StatusMessage initialStatus="Working from home" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			expect(input).toHaveValue("Working from home");
		});

		it("should update input value when typing", () => {
			render(
				<StatusMessage initialStatus="Working from home" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "New status" } });

			expect(input).toHaveValue("New status");
		});

		it("should respect maxLength prop", () => {
			render(
				<StatusMessage initialStatus="" onSave={mockOnSave} maxLength={50} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("maxLength", "50");
		});
	});

	describe("Save Functionality", () => {
		it("should save when Enter key is pressed", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "New status" } });
			fireEvent.keyDown(input, { key: "Enter" });

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("New status");
			});

			// Should exit edit mode
			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			expect(screen.getByText("New status")).toBeInTheDocument();
		});

		it("should save when check button is clicked", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "New status" } });

			const checkButton = screen.getByTestId("check-icon").closest("button");
			fireEvent.click(checkButton!);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("New status");
			});

			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			expect(screen.getByText("New status")).toBeInTheDocument();
		});

		it("should save when input loses focus", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "New status" } });
			fireEvent.blur(input);

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("New status");
			});
		});

		it("should trim whitespace when saving", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "  New status  " } });
			fireEvent.keyDown(input, { key: "Enter" });

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("New status");
			});
		});

		it("should not call onSave if status hasn't changed", async () => {
			render(<StatusMessage initialStatus="Same status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.keyDown(input, { key: "Enter" });

			await waitFor(() => {
				expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			});

			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should handle empty status after trimming", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "   " } });
			fireEvent.keyDown(input, { key: "Enter" });

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("");
			});

			expect(screen.getByText("What's on your mind?")).toBeInTheDocument();
		});
	});

	describe("Cancel Functionality", () => {
		it("should cancel when Escape key is pressed", () => {
			render(
				<StatusMessage initialStatus="Original status" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "Changed status" } });
			fireEvent.keyDown(input, { key: "Escape" });

			// Should exit edit mode without saving
			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			expect(screen.getByText("Original status")).toBeInTheDocument();
			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should cancel when X button is clicked", () => {
			render(
				<StatusMessage initialStatus="Original status" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "Changed status" } });

			const cancelButton = screen.getByTestId("x-icon").closest("button");
			fireEvent.click(cancelButton!);

			// Should exit edit mode without saving
			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			expect(screen.getByText("Original status")).toBeInTheDocument();
			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should restore original value when canceling", () => {
			render(
				<StatusMessage initialStatus="Original status" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "Changed status" } });
			fireEvent.keyDown(input, { key: "Escape" });

			// Click to edit again
			const newButton = screen.getByRole("button");
			fireEvent.click(newButton);

			const newInput = screen.getByTestId("input");
			expect(newInput).toHaveValue("Original status");
		});
	});

	describe("Keyboard Navigation", () => {
		it("should save when Enter key is pressed", async () => {
			render(<StatusMessage initialStatus="Old status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "New status" } });
			fireEvent.keyDown(input, { key: "Enter" });

			await waitFor(() => {
				expect(mockOnSave).toHaveBeenCalledWith("New status");
			});

			// Should exit edit mode
			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
		});

		it("should cancel when Escape key is pressed", () => {
			render(
				<StatusMessage initialStatus="Original status" onSave={mockOnSave} />,
			);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "Changed status" } });
			fireEvent.keyDown(input, { key: "Escape" });

			// Should exit edit mode without saving
			expect(screen.queryByTestId("input")).not.toBeInTheDocument();
			expect(screen.getByText("Original status")).toBeInTheDocument();
			expect(mockOnSave).not.toHaveBeenCalled();
		});

		it("should not handle other keys", () => {
			render(<StatusMessage initialStatus="Test status" onSave={mockOnSave} />);

			const button = screen.getByRole("button");
			fireEvent.click(button);

			const input = screen.getByTestId("input");
			fireEvent.keyDown(input, { key: "a" });

			// Should still be in edit mode
			expect(screen.getByTestId("input")).toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("should handle very long status messages", () => {
			const longStatus = "A".repeat(200);

			render(<StatusMessage initialStatus={longStatus} onSave={mockOnSave} />);

			expect(screen.getByText(longStatus)).toBeInTheDocument();
		});

		it("should handle special characters in status", () => {
			const specialStatus = "Status with émojis 🎉 and symbols @#$%";

			render(
				<StatusMessage initialStatus={specialStatus} onSave={mockOnSave} />,
			);

			expect(screen.getByText(specialStatus)).toBeInTheDocument();
		});

		it("should handle null/undefined initial status", () => {
			render(<StatusMessage initialStatus={null as any} onSave={mockOnSave} />);

			expect(screen.getByText("What's on your mind?")).toBeInTheDocument();
		});
	});
});
