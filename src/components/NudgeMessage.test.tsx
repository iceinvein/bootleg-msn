/**
 * Tests for NudgeMessage component
 *
 * Tests cover:
 * - Nudge message rendering (nudge vs buzz)
 * - Own vs received message text
 * - Timestamp formatting
 * - Animation and styling
 * - Emoji display
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NudgeMessage } from "./NudgeMessage";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, className, ...props }: any) => (
			<div className={className} {...props}>
				{children}
			</div>
		),
	},
}));

// Mock animated components
vi.mock("./ui/animated", () => ({
	bounceIn: {
		initial: { scale: 0 },
		animate: { scale: 1 },
	},
}));

describe("NudgeMessage", () => {
	const mockTimestamp = new Date("2024-01-15T14:30:00").getTime();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("nudge messages", () => {
		it("should render received nudge message", () => {
			render(
				<NudgeMessage
					senderName="Alice"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(
				screen.getByText("Alice sent you a nudge! 👋"),
			).toBeInTheDocument();
			expect(screen.getByText("02:30 PM")).toBeInTheDocument();
		});

		it("should render own nudge message", () => {
			render(
				<NudgeMessage
					senderName="Alice"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={true}
				/>,
			);

			expect(screen.getByText("You sent a nudge 👋")).toBeInTheDocument();
			expect(screen.getByText("02:30 PM")).toBeInTheDocument();
		});
	});

	describe("buzz messages", () => {
		it("should render received buzz message", () => {
			render(
				<NudgeMessage
					senderName="Bob"
					nudgeType="buzz"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(screen.getByText("Bob sent you a buzz! 📳")).toBeInTheDocument();
			expect(screen.getByText("02:30 PM")).toBeInTheDocument();
		});

		it("should render own buzz message", () => {
			render(
				<NudgeMessage
					senderName="Bob"
					nudgeType="buzz"
					timestamp={mockTimestamp}
					isOwn={true}
				/>,
			);

			expect(screen.getByText("You sent a buzz 📳")).toBeInTheDocument();
			expect(screen.getByText("02:30 PM")).toBeInTheDocument();
		});
	});

	describe("timestamp formatting", () => {
		it("should format timestamp correctly for different times", () => {
			const testCases = [
				{
					timestamp: new Date("2024-01-15T09:05:00").getTime(),
					expected: "09:05 AM",
				},
				{
					timestamp: new Date("2024-01-15T13:45:00").getTime(),
					expected: "01:45 PM",
				},
				{
					timestamp: new Date("2024-01-15T00:00:00").getTime(),
					expected: "12:00 AM",
				},
				{
					timestamp: new Date("2024-01-15T23:59:00").getTime(),
					expected: "11:59 PM",
				},
			];

			testCases.forEach(({ timestamp, expected }) => {
				const { rerender } = render(
					<NudgeMessage
						senderName="Test"
						nudgeType="nudge"
						timestamp={timestamp}
						isOwn={false}
					/>,
				);

				expect(screen.getByText(expected)).toBeInTheDocument();

				// Clean up for next iteration
				rerender(<div />);
			});
		});

		it("should handle edge case timestamps", () => {
			// Test with current timestamp
			const now = Date.now();
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={now}
					isOwn={false}
				/>,
			);

			// Should render some time format
			const timeElement = screen.getByText(/\d{2}:\d{2}\s?(AM|PM)/);
			expect(timeElement).toBeInTheDocument();
		});
	});

	describe("styling and layout", () => {
		it("should have proper CSS classes for styling", () => {
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			// Check container classes
			const container = screen
				.getByText("Test sent you a nudge! 👋")
				.closest("div");
			expect(container).toHaveClass(
				"flex",
				"items-center",
				"gap-2",
				"rounded-full",
				"px-4",
				"py-2",
				"text-sm",
			);

			// Check gradient background classes
			expect(container).toHaveClass(
				"bg-gradient-to-r",
				"from-yellow-100",
				"to-orange-100",
				"text-yellow-800",
			);

			// Check dark mode classes
			expect(container).toHaveClass(
				"dark:from-yellow-900/30",
				"dark:to-orange-900/30",
				"dark:text-yellow-200",
			);

			// Check border and shadow
			expect(container).toHaveClass(
				"border",
				"border-yellow-200",
				"dark:border-yellow-800/50",
				"shadow-sm",
			);
		});

		it("should center the message", () => {
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			const outerContainer = screen
				.getByText("Test sent you a nudge! 👋")
				.closest("div")?.parentElement;
			expect(outerContainer).toHaveClass("flex", "justify-center", "py-2");
		});

		it("should have proper text styling", () => {
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			const messageText = screen.getByText("Test sent you a nudge! 👋");
			expect(messageText).toHaveClass("font-medium");

			const timeText = screen.getByText("02:30 PM");
			expect(timeText).toHaveClass("text-xs", "opacity-70");
		});
	});

	describe("emoji display", () => {
		it("should display correct emoji for nudge", () => {
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(screen.getByText(/👋/)).toBeInTheDocument();
		});

		it("should display correct emoji for buzz", () => {
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="buzz"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(screen.getByText(/📳/)).toBeInTheDocument();
		});
	});

	describe("sender name handling", () => {
		it("should handle long sender names", () => {
			const longName = "VeryLongUserNameThatMightCauseLayoutIssues";

			render(
				<NudgeMessage
					senderName={longName}
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(
				screen.getByText(`${longName} sent you a nudge! 👋`),
			).toBeInTheDocument();
		});

		it("should handle special characters in sender name", () => {
			const specialName = "User@123!";

			render(
				<NudgeMessage
					senderName={specialName}
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			expect(
				screen.getByText(`${specialName} sent you a nudge! 👋`),
			).toBeInTheDocument();
		});

		it("should handle empty sender name", () => {
			render(
				<NudgeMessage
					senderName=""
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			// Use a more flexible matcher for empty sender name
			expect(
				screen.getByText((content, _element) => {
					return (
						content.includes("sent you a nudge! 👋") &&
						content.trim().startsWith("sent")
					);
				}),
			).toBeInTheDocument();
		});
	});

	describe("accessibility", () => {
		it("should be properly structured for screen readers", () => {
			render(
				<NudgeMessage
					senderName="Alice"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			// The message should be readable as a single unit
			const messageContainer = screen
				.getByText("Alice sent you a nudge! 👋")
				.closest("div");
			expect(messageContainer).toBeInTheDocument();

			// Time should be separate but related
			const timeElement = screen.getByText("02:30 PM");
			expect(timeElement).toBeInTheDocument();
		});

		it("should have semantic structure", () => {
			render(
				<NudgeMessage
					senderName="Alice"
					nudgeType="nudge"
					timestamp={mockTimestamp}
					isOwn={false}
				/>,
			);

			// Should have proper text hierarchy
			const messageText = screen.getByText("Alice sent you a nudge! 👋");
			const timeText = screen.getByText("02:30 PM");

			expect(messageText).toHaveClass("font-medium");
			expect(timeText).toHaveClass("text-xs");
		});
	});

	describe("edge cases", () => {
		it("should handle invalid timestamp gracefully", () => {
			// Test with invalid timestamp
			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={NaN}
					isOwn={false}
				/>,
			);

			// Should still render the message part
			expect(screen.getByText("Test sent you a nudge! 👋")).toBeInTheDocument();
		});

		it("should handle future timestamps", () => {
			const futureTimestamp = Date.now() + 86400000; // 1 day in future

			render(
				<NudgeMessage
					senderName="Test"
					nudgeType="nudge"
					timestamp={futureTimestamp}
					isOwn={false}
				/>,
			);

			expect(screen.getByText("Test sent you a nudge! 👋")).toBeInTheDocument();
			// Should still format the time
			expect(screen.getByText(/\d{2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument();
		});
	});
});
