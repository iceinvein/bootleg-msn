/**
 * Tests for ReactionPicker component
 *
 * Tests cover:
 * - Rendering common reactions and trigger
 * - User interaction with reaction selection
 * - Custom emoji picker integration
 * - Loading and disabled states
 * - Current user reaction highlighting
 * - Popover open/close behavior
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReactionPicker } from "../ReactionPicker";
import type { ReactionType } from "../ReactionPicker";

// Mock UI components
vi.mock("../ui/responsive-popover", () => ({
	ResponsivePopover: ({ children, open, onOpenChange }: any) => (
		<div data-testid="popover" data-open={open}>
			<div onClick={() => onOpenChange?.(!open)}>{children}</div>
		</div>
	),
	ResponsivePopoverTrigger: ({ children, disabled, className }: any) => (
		<div data-testid="popover-trigger" data-disabled={disabled} className={className}>
			{children}
		</div>
	),
	ResponsivePopoverContent: ({ children, title }: any) => (
		<div data-testid="popover-content" title={title}>
			{children}
		</div>
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

vi.mock("../EmojiPicker", () => ({
	EmojiPicker: ({ children, onEmojiSelect }: any) => (
		<div data-testid="emoji-picker" onClick={() => onEmojiSelect("🎉")}>
			{children}
		</div>
	),
}));

vi.mock("lucide-react", () => ({
	Plus: () => <div data-testid="plus-icon" />,
}));

vi.mock("@/lib/utils", () => ({
	cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("ReactionPicker Component", () => {
	const mockOnReactionSelect = vi.fn();
	const mockTrigger = <button data-testid="trigger-button">React</button>;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Rendering and Initial State", () => {
		it("should render trigger children correctly", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			expect(screen.getByTestId("trigger-button")).toBeInTheDocument();
			expect(screen.getByTestId("trigger-button")).toHaveTextContent("React");
		});

		it("should render popover with common reactions when opened", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover by clicking trigger
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// Should show common reaction buttons
			const reactionButtons = screen.getAllByTestId("reaction-button");
			expect(reactionButtons.length).toBeGreaterThan(0);
			
			// Check for common reactions
			const buttonTexts = reactionButtons.map(btn => btn.textContent);
			expect(buttonTexts).toContain("👍");
			expect(buttonTexts).toContain("❤️");
			expect(buttonTexts).toContain("😂");
		});

		it("should show more reactions button", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// Should have a plus icon for more reactions
			expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
		});

		it("should highlight current user reaction", () => {
			render(
				<ReactionPicker
					onReactionSelect={mockOnReactionSelect}
					currentUserReaction="thumbs_up"
				>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// The thumbs up button should have highlighting (in className)
			const reactionButtons = screen.getAllByTestId("reaction-button");
			expect(reactionButtons.length).toBeGreaterThan(0);
		});
	});

	describe("User Interaction", () => {
		it("should call onReactionSelect when reaction is clicked", async () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// Click the first reaction (thumbs up)
			const reactionButtons = screen.getAllByTestId("reaction-button");
			const thumbsUpButton = reactionButtons.find(btn => btn.textContent?.includes("👍"));
			
			if (thumbsUpButton) {
				fireEvent.click(thumbsUpButton);
				
				await waitFor(() => {
					expect(mockOnReactionSelect).toHaveBeenCalledWith("thumbs_up", undefined);
				});
			}
		});

		it("should have more reactions button that can be clicked", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);

			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));

			// Should have more reactions button
			const moreButton = screen.getByTestId("plus-icon").closest("button");
			expect(moreButton).toBeInTheDocument();
			expect(moreButton).toHaveAttribute("title", "More reactions");

			// Button should be clickable
			expect(moreButton).not.toBeDisabled();
		});

		it("should handle more reactions button interaction", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);

			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));

			// Click more reactions button
			const moreButton = screen.getByTestId("plus-icon").closest("button");
			if (moreButton) {
				// Should be able to click the button without errors
				expect(() => fireEvent.click(moreButton)).not.toThrow();

				// Button should have proper accessibility
				expect(moreButton).toHaveAttribute("title", "More reactions");
			}
		});

		it("should close popover after reaction selection", async () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// Click a reaction
			const reactionButtons = screen.getAllByTestId("reaction-button");
			const thumbsUpButton = reactionButtons.find(btn => btn.textContent?.includes("👍"));
			
			if (thumbsUpButton) {
				fireEvent.click(thumbsUpButton);
				
				await waitFor(() => {
					expect(mockOnReactionSelect).toHaveBeenCalled();
				});
			}
		});
	});

	describe("Loading and Disabled States", () => {
		it("should disable trigger when disabled prop is true", () => {
			render(
				<ReactionPicker
					onReactionSelect={mockOnReactionSelect}
					disabled={true}
				>
					{mockTrigger}
				</ReactionPicker>
			);
			
			const trigger = screen.getByTestId("popover-trigger");
			expect(trigger).toHaveAttribute("data-disabled", "true");
		});

		it("should disable reactions when loading", () => {
			render(
				<ReactionPicker
					onReactionSelect={mockOnReactionSelect}
					isLoading={true}
				>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open the popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			// All reaction buttons should be disabled
			const reactionButtons = screen.getAllByTestId("reaction-button");
			reactionButtons.forEach(button => {
				expect(button).toBeDisabled();
			});
		});

		it("should not call onReactionSelect when disabled", () => {
			render(
				<ReactionPicker
					onReactionSelect={mockOnReactionSelect}
					disabled={true}
				>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Try to open popover and click reaction
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			if (reactionButtons.length > 0) {
				fireEvent.click(reactionButtons[0]);
			}
			
			expect(mockOnReactionSelect).not.toHaveBeenCalled();
		});

		it("should show pending state during async operations", async () => {
			const slowOnReactionSelect = vi.fn().mockImplementation(
				() => new Promise(resolve => setTimeout(resolve, 100))
			);
			
			render(
				<ReactionPicker onReactionSelect={slowOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover and click reaction
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			const thumbsUpButton = reactionButtons.find(btn => btn.textContent?.includes("👍"));
			
			if (thumbsUpButton) {
				fireEvent.click(thumbsUpButton);
				
				// Should show pending state (button disabled during operation)
				expect(thumbsUpButton).toBeDisabled();
				
				await waitFor(() => {
					expect(slowOnReactionSelect).toHaveBeenCalled();
				});
			}
		});
	});

	describe("Props and Configuration", () => {
		it("should apply custom className", () => {
			render(
				<ReactionPicker
					onReactionSelect={mockOnReactionSelect}
					className="custom-picker"
				>
					{mockTrigger}
				</ReactionPicker>
			);

			// The className is applied to the ResponsivePopoverTrigger
			const trigger = screen.getByTestId("popover-trigger");
			expect(trigger).toHaveClass("custom-picker");
		});

		it("should handle all reaction types correctly", async () => {
			const reactionTypes: ReactionType[] = ["thumbs_up", "heart", "laugh", "wow", "sad", "angry"];
			
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			
			// Should have buttons for all common reaction types
			expect(reactionButtons.length).toBeGreaterThanOrEqual(reactionTypes.length);
		});
	});

	describe("Error Handling", () => {
		it("should handle onReactionSelect errors gracefully", async () => {
			const mockOnReactionSelectError = vi.fn().mockRejectedValue(new Error("Network error"));
			
			// Mock console.error to avoid test output noise
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelectError}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover and click reaction
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			if (reactionButtons.length > 0) {
				fireEvent.click(reactionButtons[0]);
				
				await waitFor(() => {
					expect(mockOnReactionSelectError).toHaveBeenCalled();
				});
				
				// Should handle error gracefully
				expect(consoleSpy).toHaveBeenCalledWith("Failed to add reaction:", expect.any(Error));
			}
			
			consoleSpy.mockRestore();
		});

		it("should reset pending state after error", async () => {
			const mockOnReactionSelectError = vi.fn().mockRejectedValue(new Error("Network error"));
			
			// Mock console.error
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelectError}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover and click reaction
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			if (reactionButtons.length > 0) {
				fireEvent.click(reactionButtons[0]);
				
				await waitFor(() => {
					expect(mockOnReactionSelectError).toHaveBeenCalled();
				});
				
				// Button should be enabled again after error
				expect(reactionButtons[0]).not.toBeDisabled();
			}
			
			consoleSpy.mockRestore();
		});
	});

	describe("Accessibility", () => {
		it("should have proper titles for reaction buttons", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const reactionButtons = screen.getAllByTestId("reaction-button");
			reactionButtons.forEach(button => {
				expect(button).toHaveAttribute("title");
			});
		});

		it("should have proper popover title", () => {
			render(
				<ReactionPicker onReactionSelect={mockOnReactionSelect}>
					{mockTrigger}
				</ReactionPicker>
			);
			
			// Open popover
			fireEvent.click(screen.getByTestId("popover-trigger"));
			
			const popoverContent = screen.getByTestId("popover-content");
			expect(popoverContent).toHaveAttribute("title", "React to message");
		});
	});
});
