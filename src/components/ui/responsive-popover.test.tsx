import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ResponsivePopover,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
} from "./responsive-popover";

// Mock the useMediaQuery hook
const mockUseMediaQuery = vi.fn();
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: () => mockUseMediaQuery(),
}));

describe("ResponsivePopover", () => {
	it("renders as Popover on desktop", () => {
		mockUseMediaQuery.mockReturnValue(false); // Desktop

		render(
			<ResponsivePopover>
				<ResponsivePopoverTrigger>
					<button>Open Popover</button>
				</ResponsivePopoverTrigger>
				<ResponsivePopoverContent title="Test Popover">
					<div>Popover Content</div>
				</ResponsivePopoverContent>
			</ResponsivePopover>
		);

		expect(screen.getByText("Open Popover")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("renders as Drawer on mobile", () => {
		mockUseMediaQuery.mockReturnValue(true); // Mobile

		render(
			<ResponsivePopover>
				<ResponsivePopoverTrigger>
					<button>Open Drawer</button>
				</ResponsivePopoverTrigger>
				<ResponsivePopoverContent title="Test Drawer">
					<div>Drawer Content</div>
				</ResponsivePopoverContent>
			</ResponsivePopover>
		);

		expect(screen.getByText("Open Drawer")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("handles open state changes", () => {
		mockUseMediaQuery.mockReturnValue(false);
		const onOpenChange = vi.fn();

		render(
			<ResponsivePopover open={true} onOpenChange={onOpenChange}>
				<ResponsivePopoverTrigger>
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
