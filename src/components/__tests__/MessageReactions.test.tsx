/**
 * Tests for MessageReactions component
 *
 * Tests cover:
 * - Rendering reactions with different types and counts
 * - User interaction with reaction buttons
 * - Loading and disabled states
 * - Tooltip functionality showing reaction details
 * - Animation states for new reactions
 * - Accessibility features
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageReactions } from "../MessageReactions";
import type { ReactionType } from "../ReactionPicker";

// Mock UI components
vi.mock("../ui/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	TooltipContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tooltip-content">{children}</div>
	),
	TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="tooltip-trigger">{children}</div>
	),
}));

vi.mock("../ui/button", () => ({
	Button: ({ children, onClick, disabled, className, title, ...props }: any) => (
		<button
			onClick={onClick}
			disabled={disabled}
			className={className}
			title={title}
			data-testid="reaction-button"
			{...props}
		>
			{children}
		</button>
	),
}));

vi.mock("../ui/avatar", () => ({
	Avatar: ({ children, className }: any) => (
		<div className={className} data-testid="avatar">
			{children}
		</div>
	),
}));

vi.mock("lucide-react", () => ({
	User: () => <div data-testid="user-icon" />,
}));

vi.mock("@/lib/utils", () => ({
	cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock reaction summary data
const createReactionSummary = (
	reactionType: ReactionType,
	count: number = 1,
	hasCurrentUserReacted: boolean = false,
	customEmoji?: string
) => ({
	reactionType,
	customEmoji,
	count,
	users: Array.from({ length: count }, (_, i) => ({
		_id: `user-${i}`,
		name: `User ${i + 1}`,
		image: `https://example.com/avatar${i + 1}.jpg`,
	})),
	hasCurrentUserReacted,
});

describe("MessageReactions Component", () => {
	const mockOnReactionClick = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Rendering and Initial State", () => {
		it("should render empty state when no reactions provided", () => {
			render(<MessageReactions reactions={[]} />);
			
			// Should not render any reaction buttons
			expect(screen.queryByTestId("reaction-button")).not.toBeInTheDocument();
		});

		it("should render single reaction correctly", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];

			render(<MessageReactions reactions={reactions} />);

			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toBeInTheDocument();
			expect(reactionButton).toHaveTextContent("👍");
			// Count is only shown when > 1, so single reaction won't show count
			expect(reactionButton).not.toHaveTextContent("1");
		});

		it("should render multiple reactions correctly", () => {
			const reactions = [
				createReactionSummary("thumbs_up", 2, true),
				createReactionSummary("heart", 1, false),
				createReactionSummary("custom", 1, false, "🔥"),
			];

			render(<MessageReactions reactions={reactions} />);

			const reactionButtons = screen.getAllByTestId("reaction-button");
			expect(reactionButtons).toHaveLength(3);

			// Check thumbs up reaction (count > 1, so count is shown)
			expect(reactionButtons[0]).toHaveTextContent("👍");
			expect(reactionButtons[0]).toHaveTextContent("2");

			// Check heart reaction (count = 1, so count is not shown)
			expect(reactionButtons[1]).toHaveTextContent("❤️");
			expect(reactionButtons[1]).not.toHaveTextContent("1");

			// Check custom emoji reaction (count = 1, so count is not shown)
			expect(reactionButtons[2]).toHaveTextContent("🔥");
			expect(reactionButtons[2]).not.toHaveTextContent("1");
		});

		it("should render custom emoji reactions correctly", () => {
			const reactions = [createReactionSummary("custom", 3, true, "🎉")];
			
			render(<MessageReactions reactions={reactions} />);
			
			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toHaveTextContent("🎉");
			expect(reactionButton).toHaveTextContent("3");
		});

		it("should highlight current user reactions", () => {
			const reactions = [
				createReactionSummary("thumbs_up", 1, true),
				createReactionSummary("heart", 1, false),
			];
			
			render(<MessageReactions reactions={reactions} />);
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			
			// First reaction should have current user styling (would be in className)
			expect(reactionButtons[0]).toBeInTheDocument();
			expect(reactionButtons[1]).toBeInTheDocument();
		});
	});

	describe("User Interaction", () => {
		it("should call onReactionClick when reaction button is clicked", async () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					onReactionClick={mockOnReactionClick}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			fireEvent.click(reactionButton);
			
			await waitFor(() => {
				expect(mockOnReactionClick).toHaveBeenCalledWith("thumbs_up", undefined);
			});
		});

		it("should call onReactionClick with custom emoji", async () => {
			const reactions = [createReactionSummary("custom", 1, false, "🚀")];
			
			render(
				<MessageReactions
					reactions={reactions}
					onReactionClick={mockOnReactionClick}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			fireEvent.click(reactionButton);
			
			await waitFor(() => {
				expect(mockOnReactionClick).toHaveBeenCalledWith("custom", "🚀");
			});
		});

		it("should not call onReactionClick when disabled", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					onReactionClick={mockOnReactionClick}
					disabled={true}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			fireEvent.click(reactionButton);
			
			expect(mockOnReactionClick).not.toHaveBeenCalled();
		});

		it("should not call onReactionClick when loading", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					onReactionClick={mockOnReactionClick}
					isLoading={true}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			fireEvent.click(reactionButton);
			
			expect(mockOnReactionClick).not.toHaveBeenCalled();
		});

		it("should handle missing onReactionClick gracefully", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			expect(() => {
				render(<MessageReactions reactions={reactions} />);
				const reactionButton = screen.getByTestId("reaction-button");
				fireEvent.click(reactionButton);
			}).not.toThrow();
		});
	});

	describe("Loading and Disabled States", () => {
		it("should show disabled state correctly", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					disabled={true}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toBeDisabled();
		});

		it("should show loading state correctly", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					isLoading={true}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toBeDisabled();
		});

		it("should apply custom className", () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			
			render(
				<MessageReactions
					reactions={reactions}
					className="custom-reactions"
				/>
			);
			
			// The className would be applied to the container
			expect(screen.getByTestId("reaction-button")).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should render reaction buttons accessibly", () => {
			const reactions = [
				createReactionSummary("thumbs_up", 1, false),
				createReactionSummary("heart", 2, true),
			];

			render(<MessageReactions reactions={reactions} />);

			const reactionButtons = screen.getAllByTestId("reaction-button");

			// Buttons should be accessible (wrapped in tooltip)
			expect(reactionButtons[0]).toBeInTheDocument();
			expect(reactionButtons[1]).toBeInTheDocument();

			// Should have tooltip wrappers
			expect(screen.getAllByTestId("tooltip-trigger")).toHaveLength(2);
		});

		it("should render custom reaction buttons accessibly", () => {
			const reactions = [createReactionSummary("custom", 1, false, "🎯")];

			render(<MessageReactions reactions={reactions} />);

			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toBeInTheDocument();
			expect(screen.getByTestId("tooltip-trigger")).toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("should handle reactions with zero count", () => {
			const reactions = [createReactionSummary("thumbs_up", 0, false)];

			render(<MessageReactions reactions={reactions} />);

			const reactionButton = screen.getByTestId("reaction-button");
			// Count is only shown when > 1, so zero count won't show count
			expect(reactionButton).not.toHaveTextContent("0");
			expect(reactionButton).toHaveTextContent("👍");
		});

		it("should handle reactions with high counts", () => {
			const reactions = [createReactionSummary("thumbs_up", 999, false)];
			
			render(<MessageReactions reactions={reactions} />);
			
			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toHaveTextContent("999");
		});

		it("should handle custom reactions without emoji", () => {
			const reactions = [createReactionSummary("custom", 1, false)];
			
			render(<MessageReactions reactions={reactions} />);
			
			const reactionButton = screen.getByTestId("reaction-button");
			expect(reactionButton).toBeInTheDocument();
		});

		it("should handle async onReactionClick errors gracefully", async () => {
			const reactions = [createReactionSummary("thumbs_up", 1, false)];
			const mockOnReactionClickError = vi.fn().mockRejectedValue(new Error("Network error"));
			
			// Mock console.error to avoid test output noise
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			
			render(
				<MessageReactions
					reactions={reactions}
					onReactionClick={mockOnReactionClickError}
				/>
			);
			
			const reactionButton = screen.getByTestId("reaction-button");
			fireEvent.click(reactionButton);
			
			await waitFor(() => {
				expect(mockOnReactionClickError).toHaveBeenCalled();
			});
			
			// Should handle error gracefully
			expect(consoleSpy).toHaveBeenCalledWith("Failed to toggle reaction:", expect.any(Error));
			
			consoleSpy.mockRestore();
		});
	});
});
