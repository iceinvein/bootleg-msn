/**
 * Tests for TypingIndicator component
 * 
 * Tests cover:
 * - Basic rendering with and without user name
 * - Accessibility attributes
 * - Animation structure
 * - CSS classes and styling
 * - Edge cases with user names
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypingIndicator } from "./TypingIndicator";

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, className, role, ...props }: any) => (
			<div className={className} role={role} {...props}>
				{children}
			</div>
		),
		span: ({ children, className, ...props }: any) => (
			<span className={className} {...props}>
				{children}
			</span>
		),
	},
	cubicBezier: vi.fn(() => "cubic-bezier"),
}));

describe("TypingIndicator", () => {
	describe("basic rendering", () => {
		it("should render typing indicator without user name", () => {
			render(<TypingIndicator />);

			expect(screen.getByText("Someone is typing...")).toBeInTheDocument();
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		it("should render typing indicator with user name", () => {
			render(<TypingIndicator userName="Alice" />);

			expect(screen.getByText("Alice is typing...")).toBeInTheDocument();
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		it("should render typing dots", () => {
			render(<TypingIndicator userName="Alice" />);

			// Should have the typing bubble container
			const bubble = screen.getByText("Alice is typing...").previousElementSibling;
			expect(bubble).toHaveClass("message-bubble-received");

			// Should have three dots (represented as divs with specific classes)
			const dots = bubble?.querySelectorAll(".h-2.w-2.rounded-full.bg-muted-foreground");
			expect(dots).toHaveLength(3);
		});
	});

	describe("accessibility", () => {
		it("should have proper ARIA attributes", () => {
			render(<TypingIndicator userName="Alice" />);

			const statusElement = screen.getByRole("status");
			expect(statusElement).toHaveAttribute("aria-live", "polite");
		});

		it("should be announced to screen readers", () => {
			render(<TypingIndicator userName="Bob" />);

			const statusElement = screen.getByRole("status");
			expect(statusElement).toBeInTheDocument();
			
			// The text should be accessible
			expect(screen.getByText("Bob is typing...")).toBeInTheDocument();
		});

		it("should handle screen reader announcements for anonymous typing", () => {
			render(<TypingIndicator />);

			const statusElement = screen.getByRole("status");
			expect(statusElement).toBeInTheDocument();
			expect(screen.getByText("Someone is typing...")).toBeInTheDocument();
		});
	});

	describe("styling and layout", () => {
		it("should have proper container classes", () => {
			render(<TypingIndicator />);

			const container = screen.getByRole("status");
			expect(container).toHaveClass("flex", "flex-col", "items-start", "gap-1");
		});

		it("should apply custom className", () => {
			render(<TypingIndicator className="custom-class" />);

			const container = screen.getByRole("status");
			expect(container).toHaveClass("custom-class");
		});

		it("should have proper typing bubble styling", () => {
			render(<TypingIndicator userName="Alice" />);

			const bubble = screen.getByText("Alice is typing...").previousElementSibling;
			expect(bubble).toHaveClass(
				"message-bubble-received",
				"flex",
				"items-center",
				"space-x-1",
				"rounded-2xl",
				"px-3",
				"py-2"
			);
		});

		it("should have proper text styling", () => {
			render(<TypingIndicator userName="Alice" />);

			const text = screen.getByText("Alice is typing...");
			expect(text).toHaveClass("text-muted-foreground", "text-xs", "md:text-sm");
		});

		it("should have proper dot styling", () => {
			render(<TypingIndicator userName="Alice" />);

			const bubble = screen.getByText("Alice is typing...").previousElementSibling;
			const dots = bubble?.querySelectorAll("div");
			
			dots?.forEach(dot => {
				expect(dot).toHaveClass("h-2", "w-2", "rounded-full", "bg-muted-foreground");
			});
		});
	});

	describe("user name handling", () => {
		it("should handle long user names", () => {
			const longName = "VeryLongUserNameThatMightCauseLayoutIssues";
			
			render(<TypingIndicator userName={longName} />);

			expect(screen.getByText(`${longName} is typing...`)).toBeInTheDocument();
		});

		it("should handle special characters in user name", () => {
			const specialName = "User@123!";
			
			render(<TypingIndicator userName={specialName} />);

			expect(screen.getByText(`${specialName} is typing...`)).toBeInTheDocument();
		});

		it("should handle empty user name", () => {
			render(<TypingIndicator userName="" />);

			expect(screen.getByText("Someone is typing...")).toBeInTheDocument();
		});

		it("should handle undefined user name", () => {
			render(<TypingIndicator userName={undefined} />);

			expect(screen.getByText("Someone is typing...")).toBeInTheDocument();
		});

		it("should handle user name with only whitespace", () => {
			render(<TypingIndicator userName="   " />);

			// The component preserves whitespace in the username
			expect(screen.getByText((content) => content.includes("is typing..."))).toBeInTheDocument();
		});
	});

	describe("responsive design", () => {
		it("should have responsive text sizing", () => {
			render(<TypingIndicator userName="Alice" />);

			const text = screen.getByText("Alice is typing...");
			expect(text).toHaveClass("text-xs", "md:text-sm");
		});

		it("should maintain proper spacing on different screen sizes", () => {
			render(<TypingIndicator />);

			const container = screen.getByRole("status");
			expect(container).toHaveClass("gap-1");

			const bubble = screen.getByText("Someone is typing...").previousElementSibling;
			expect(bubble).toHaveClass("space-x-1");
		});
	});

	describe("animation structure", () => {
		it("should have proper motion div structure", () => {
			render(<TypingIndicator userName="Alice" />);

			// Container should be a motion div
			const container = screen.getByRole("status");
			expect(container).toBeInTheDocument();

			// Text should be a motion span
			const text = screen.getByText("Alice is typing...");
			expect(text.tagName).toBe("SPAN");
		});

		it("should have dots as motion divs", () => {
			render(<TypingIndicator userName="Alice" />);

			const bubble = screen.getByText("Alice is typing...").previousElementSibling;
			const dots = bubble?.querySelectorAll("div");
			
			expect(dots).toHaveLength(3);
			dots?.forEach(dot => {
				expect(dot.tagName).toBe("DIV");
			});
		});
	});

	describe("edge cases", () => {
		it("should handle null user name", () => {
			render(<TypingIndicator userName={null as any} />);

			expect(screen.getByText("Someone is typing...")).toBeInTheDocument();
		});

		it("should handle numeric user name", () => {
			render(<TypingIndicator userName={123 as any} />);

			expect(screen.getByText("123 is typing...")).toBeInTheDocument();
		});

		it("should handle user name with HTML entities", () => {
			const htmlName = "User<script>alert('test')</script>";
			
			render(<TypingIndicator userName={htmlName} />);

			// Should render as text, not execute HTML
			expect(screen.getByText(`${htmlName} is typing...`)).toBeInTheDocument();
		});

		it("should handle very long user names gracefully", () => {
			const veryLongName = "A".repeat(1000);
			
			render(<TypingIndicator userName={veryLongName} />);

			expect(screen.getByText(`${veryLongName} is typing...`)).toBeInTheDocument();
		});
	});

	describe("component composition", () => {
		it("should render all required elements", () => {
			render(<TypingIndicator userName="Alice" />);

			// Should have status container
			expect(screen.getByRole("status")).toBeInTheDocument();
			
			// Should have typing bubble
			const bubble = screen.getByText("Alice is typing...").previousElementSibling;
			expect(bubble).toBeInTheDocument();
			
			// Should have typing text
			expect(screen.getByText("Alice is typing...")).toBeInTheDocument();
			
			// Should have three dots
			const dots = bubble?.querySelectorAll(".h-2.w-2.rounded-full.bg-muted-foreground");
			expect(dots).toHaveLength(3);
		});

		it("should maintain proper element hierarchy", () => {
			render(<TypingIndicator userName="Alice" />);

			const container = screen.getByRole("status");
			const bubble = container.querySelector(".message-bubble-received");
			const text = screen.getByText("Alice is typing...");

			expect(container).toContainElement(bubble as HTMLElement);
			expect(container).toContainElement(text);
		});
	});
});
