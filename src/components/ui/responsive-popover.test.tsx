import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ResponsivePopover,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
} from "./responsive-popover";

// Mock the useMediaQuery hook
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: vi.fn(() => false), // Default to desktop
}));

describe("ResponsivePopover", () => {
	it("handles open state changes", () => {
		const onOpenChange = vi.fn();

		render(
			<ResponsivePopover open={true} onOpenChange={onOpenChange}>
				<ResponsivePopoverTrigger asChild>
					<button>Trigger</button>
				</ResponsivePopoverTrigger>
				<ResponsivePopoverContent>
					<div>Content</div>
				</ResponsivePopoverContent>
			</ResponsivePopover>
		);

		expect(screen.getByText("Trigger")).toBeInTheDocument();
	});
});
