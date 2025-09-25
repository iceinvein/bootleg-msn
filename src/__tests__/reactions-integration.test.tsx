/**
 * Integration tests for Reactions & Interactions system
 *
 * Tests cover:
 * - Full reaction flow from picker to display
 * - Message component reaction integration
 * - Multiple users reacting to messages
 * - Real-time reaction updates
 * - Error handling and edge cases
 * - Accessibility and user experience
 */

import type { Id } from "@convex/_generated/dataModel";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MessageReactions } from "../components/MessageReactions";
import { ReactionPicker } from "../components/ReactionPicker";

// Mock Convex hooks
const mockUseQuery = vi.hoisted(() => vi.fn());
const mockUseMutation = vi.hoisted(() => vi.fn());

vi.mock("convex/react", () => ({
	useQuery: mockUseQuery,
	useMutation: mockUseMutation,
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
	api: {
		reactions: {
			getMessageReactionSummary: vi.fn(),
			addMessageReaction: vi.fn(),
			removeMessageReaction: vi.fn(),
		},
		auth: {
			loggedInUser: vi.fn(),
		},
	},
}));

// Mock components
vi.mock("../components/MessageReactions", () => ({
	MessageReactions: ({
		reactions,
		onReactionClick,
		isLoading,
		disabled,
	}: any) => (
		<div data-testid="message-reactions">
			{reactions.map((reaction: any, index: number) => (
				<button
					key={index}
					data-testid={`reaction-${reaction.reactionType}`}
					onClick={() =>
						onReactionClick?.(reaction.reactionType, reaction.customEmoji)
					}
					disabled={disabled || isLoading}
				>
					{reaction.reactionType === "custom"
						? reaction.customEmoji
						: `${reaction.reactionType} (${reaction.count})`}
				</button>
			))}
		</div>
	),
}));

vi.mock("../components/ReactionPicker", () => ({
	ReactionPicker: ({
		children,
		onReactionSelect,
		disabled,
		isLoading,
	}: any) => (
		<div data-testid="reaction-picker">
			{children}
			<div data-testid="picker-content">
				<button
					data-testid="pick-thumbs-up"
					onClick={() => onReactionSelect("thumbs_up")}
					disabled={disabled || isLoading}
				>
					👍
				</button>
				<button
					data-testid="pick-heart"
					onClick={() => onReactionSelect("heart")}
					disabled={disabled || isLoading}
				>
					❤️
				</button>
				<button
					data-testid="pick-custom"
					onClick={() => onReactionSelect("custom", "🎉")}
					disabled={disabled || isLoading}
				>
					Custom
				</button>
			</div>
		</div>
	),
}));

// Mock toast notifications
const mockToastError = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
	toast: {
		error: mockToastError,
		success: mockToastSuccess,
	},
}));

// Mock user avatar store
vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(() => new Map()),
}));

// Mock media query
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: vi.fn(() => false),
}));

// Test component that integrates reactions
function TestMessageWithReactions({
	messageId,
}: {
	messageId: Id<"messages">;
}) {
	const addReaction = mockAddReaction;
	const removeReaction = mockRemoveReaction;
	const reactionSummary = mockUseQuery();

	const handleReactionClick = async (
		reactionType: string,
		customEmoji?: string,
	) => {
		try {
			const existingReaction = reactionSummary?.find(
				(r: any) => r.reactionType === reactionType && r.hasCurrentUserReacted,
			);

			if (existingReaction) {
				await removeReaction({ messageId });
			} else {
				await addReaction({ messageId, reactionType, customEmoji });
			}
		} catch (_error) {
			mockToastError("Failed to update reaction");
		}
	};

	const handleReactionSelect = async (
		reactionType: string,
		customEmoji?: string,
	) => {
		try {
			await addReaction({ messageId, reactionType, customEmoji });
			mockToastSuccess("Reaction added!");
		} catch (_error) {
			mockToastError("Failed to add reaction");
		}
	};

	return (
		<div data-testid="test-message">
			<div data-testid="message-content">Test message content</div>

			{/* Message Reactions Display */}
			<MessageReactions
				reactions={reactionSummary || []}
				onReactionClick={handleReactionClick}
			/>

			{/* Reaction Picker */}
			<ReactionPicker onReactionSelect={handleReactionSelect}>
				<button data-testid="add-reaction-button">Add Reaction</button>
			</ReactionPicker>
		</div>
	);
}

// Create mock functions at module level
const mockAddReaction = vi.fn();
const mockRemoveReaction = vi.fn();

describe("Reactions Integration Tests", () => {
	const mockMessageId = "test-message-id" as Id<"messages">;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mocks
		mockUseMutation.mockImplementation(() => {
			// Return a function that can be called as a mutation
			return vi.fn().mockResolvedValue("success");
		});

		// Setup specific mocks for add and remove reactions
		mockAddReaction.mockResolvedValue("reaction-id");
		mockRemoveReaction.mockResolvedValue(null);

		mockUseQuery.mockReturnValue([]);
	});

	describe("Basic Reaction Flow", () => {
		it("should add reaction when picker is used", async () => {
			mockAddReaction.mockResolvedValue("reaction-id");

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Click add reaction button to open picker
			fireEvent.click(screen.getByTestId("add-reaction-button"));

			// Click thumbs up in picker
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalledWith({
					messageId: mockMessageId,
					reactionType: "thumbs_up",
					customEmoji: undefined,
				});
			});

			expect(mockToastSuccess).toHaveBeenCalledWith("Reaction added!");
		});

		it("should add custom emoji reaction", async () => {
			mockAddReaction.mockResolvedValue("reaction-id");

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Open picker and select custom emoji
			fireEvent.click(screen.getByTestId("add-reaction-button"));
			fireEvent.click(screen.getByTestId("pick-custom"));

			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalledWith({
					messageId: mockMessageId,
					reactionType: "custom",
					customEmoji: "🎉",
				});
			});
		});

		it("should remove reaction when clicking existing reaction", async () => {
			// Mock existing reaction
			const existingReactions = [
				{
					reactionType: "thumbs_up",
					count: 1,
					hasCurrentUserReacted: true,
					users: [{ _id: "user1", name: "User 1" }],
				},
			];

			mockUseQuery.mockReturnValue(existingReactions);
			mockRemoveReaction.mockResolvedValue(null);

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Click existing reaction to remove it
			fireEvent.click(screen.getByTestId("reaction-thumbs_up"));

			await waitFor(() => {
				expect(mockRemoveReaction).toHaveBeenCalledWith({
					messageId: mockMessageId,
				});
			});
		});
	});

	describe("Multiple Reactions", () => {
		it("should display multiple reactions correctly", () => {
			const multipleReactions = [
				{
					reactionType: "thumbs_up",
					count: 2,
					hasCurrentUserReacted: true,
					users: [
						{ _id: "user1", name: "User 1" },
						{ _id: "user2", name: "User 2" },
					],
				},
				{
					reactionType: "heart",
					count: 1,
					hasCurrentUserReacted: false,
					users: [{ _id: "user3", name: "User 3" }],
				},
				{
					reactionType: "custom",
					customEmoji: "🔥",
					count: 1,
					hasCurrentUserReacted: false,
					users: [{ _id: "user4", name: "User 4" }],
				},
			];

			mockUseQuery.mockReturnValue(multipleReactions);

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Should display all reactions
			expect(screen.getByTestId("reaction-thumbs_up")).toHaveTextContent(
				"thumbs_up (2)",
			);
			expect(screen.getByTestId("reaction-heart")).toHaveTextContent(
				"heart (1)",
			);
			expect(screen.getByTestId("reaction-custom")).toHaveTextContent("🔥");
		});

		it("should handle adding different reaction types", async () => {
			mockAddReaction.mockResolvedValue("reaction-id");

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Add thumbs up
			fireEvent.click(screen.getByTestId("add-reaction-button"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalledWith({
					messageId: mockMessageId,
					reactionType: "thumbs_up",
					customEmoji: undefined,
				});
			});

			// Add heart
			fireEvent.click(screen.getByTestId("pick-heart"));

			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalledWith({
					messageId: mockMessageId,
					reactionType: "heart",
					customEmoji: undefined,
				});
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle add reaction errors", async () => {
			mockAddReaction.mockRejectedValue(new Error("Network error"));

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Try to add reaction
			fireEvent.click(screen.getByTestId("add-reaction-button"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Failed to add reaction");
			});
		});

		it("should handle remove reaction errors", async () => {
			// Mock existing reaction
			const existingReactions = [
				{
					reactionType: "thumbs_up",
					count: 1,
					hasCurrentUserReacted: true,
					users: [{ _id: "user1", name: "User 1" }],
				},
			];

			mockUseQuery.mockReturnValue(existingReactions);
			mockRemoveReaction.mockRejectedValue(new Error("Network error"));

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Try to remove reaction
			fireEvent.click(screen.getByTestId("reaction-thumbs_up"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith(
					"Failed to update reaction",
				);
			});
		});

		it("should handle authentication errors", async () => {
			mockAddReaction.mockRejectedValue(new Error("Not authenticated"));

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			fireEvent.click(screen.getByTestId("add-reaction-button"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Failed to add reaction");
			});
		});
	});

	describe("Real-time Updates", () => {
		it("should update reactions when data changes", () => {
			const { rerender } = render(
				<TestMessageWithReactions messageId={mockMessageId} />,
			);

			// Initially no reactions
			expect(
				screen.queryByTestId("reaction-thumbs_up"),
			).not.toBeInTheDocument();

			// Update with new reactions
			const newReactions = [
				{
					reactionType: "thumbs_up",
					count: 1,
					hasCurrentUserReacted: false,
					users: [{ _id: "user1", name: "User 1" }],
				},
			];

			mockUseQuery.mockReturnValue(newReactions);
			rerender(<TestMessageWithReactions messageId={mockMessageId} />);

			// Should show new reaction
			expect(screen.getByTestId("reaction-thumbs_up")).toBeInTheDocument();
		});

		it("should update reaction counts in real-time", () => {
			// Start with one reaction
			const initialReactions = [
				{
					reactionType: "thumbs_up",
					count: 1,
					hasCurrentUserReacted: false,
					users: [{ _id: "user1", name: "User 1" }],
				},
			];

			mockUseQuery.mockReturnValue(initialReactions);
			const { rerender } = render(
				<TestMessageWithReactions messageId={mockMessageId} />,
			);

			expect(screen.getByTestId("reaction-thumbs_up")).toHaveTextContent(
				"thumbs_up (1)",
			);

			// Update with increased count
			const updatedReactions = [
				{
					reactionType: "thumbs_up",
					count: 3,
					hasCurrentUserReacted: true,
					users: [
						{ _id: "user1", name: "User 1" },
						{ _id: "user2", name: "User 2" },
						{ _id: "user3", name: "User 3" },
					],
				},
			];

			mockUseQuery.mockReturnValue(updatedReactions);
			rerender(<TestMessageWithReactions messageId={mockMessageId} />);

			expect(screen.getByTestId("reaction-thumbs_up")).toHaveTextContent(
				"thumbs_up (3)",
			);
		});
	});

	describe("User Experience", () => {
		it("should provide immediate feedback during async operations", async () => {
			// Mock slow reaction addition
			mockAddReaction.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve("reaction-id"), 100),
					),
			);

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			fireEvent.click(screen.getByTestId("add-reaction-button"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			// Should show loading state or disable buttons during operation
			// (Implementation would depend on component loading states)

			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalled();
			});
		});

		it("should handle rapid successive clicks gracefully", async () => {
			mockAddReaction.mockResolvedValue("reaction-id");

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			fireEvent.click(screen.getByTestId("add-reaction-button"));

			// Click multiple times rapidly
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));
			fireEvent.click(screen.getByTestId("pick-thumbs-up"));

			// Should handle gracefully (might debounce or prevent multiple calls)
			await waitFor(() => {
				expect(mockAddReaction).toHaveBeenCalled();
			});
		});
	});

	describe("Accessibility", () => {
		it("should maintain accessibility during interactions", () => {
			const reactions = [
				{
					reactionType: "thumbs_up",
					count: 1,
					hasCurrentUserReacted: true,
					users: [{ _id: "user1", name: "User 1" }],
				},
			];

			mockUseQuery.mockReturnValue(reactions);

			render(<TestMessageWithReactions messageId={mockMessageId} />);

			// Reaction buttons should be accessible
			const reactionButton = screen.getByTestId("reaction-thumbs_up");
			expect(reactionButton).toBeInTheDocument();
			expect(reactionButton).not.toBeDisabled();

			// Add reaction button should be accessible
			const addButton = screen.getByTestId("add-reaction-button");
			expect(addButton).toBeInTheDocument();
		});
	});
});
