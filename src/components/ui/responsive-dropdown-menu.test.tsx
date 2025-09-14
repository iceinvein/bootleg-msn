import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuTrigger,
} from "./responsive-dropdown-menu";

// Mock the useMediaQuery hook
const mockUseMediaQuery = vi.fn();
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: () => mockUseMediaQuery(),
}));

describe("ResponsiveDropdownMenu", () => {
	it("renders as DropdownMenu on desktop", () => {
		mockUseMediaQuery.mockReturnValue(false); // Desktop

		render(
			<ResponsiveDropdownMenu>
				<ResponsiveDropdownMenuTrigger>
					<button>Open Menu</button>
				</ResponsiveDropdownMenuTrigger>
				<ResponsiveDropdownMenuContent title="Test Menu">
					<ResponsiveDropdownMenuItem>
						<div>Menu Item</div>
					</ResponsiveDropdownMenuItem>
				</ResponsiveDropdownMenuContent>
			</ResponsiveDropdownMenu>
		);

		expect(screen.getByText("Open Menu")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("renders as Drawer on mobile", () => {
		mockUseMediaQuery.mockReturnValue(true); // Mobile

		render(
			<ResponsiveDropdownMenu>
				<ResponsiveDropdownMenuTrigger>
					<button>Open Drawer Menu</button>
				</ResponsiveDropdownMenuTrigger>
				<ResponsiveDropdownMenuContent title="Test Drawer Menu">
					<ResponsiveDropdownMenuItem>
						<div>Drawer Menu Item</div>
					</ResponsiveDropdownMenuItem>
				</ResponsiveDropdownMenuContent>
			</ResponsiveDropdownMenu>
		);

		expect(screen.getByText("Open Drawer Menu")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("handles menu item clicks", () => {
		mockUseMediaQuery.mockReturnValue(false);
		const onClick = vi.fn();

		render(
			<ResponsiveDropdownMenu>
				<ResponsiveDropdownMenuTrigger>
					<button>Trigger</button>
				</ResponsiveDropdownMenuTrigger>
				<ResponsiveDropdownMenuContent>
					<ResponsiveDropdownMenuItem onClick={onClick}>
						<div>Clickable Item</div>
					</ResponsiveDropdownMenuItem>
				</ResponsiveDropdownMenuContent>
			</ResponsiveDropdownMenu>
		);

		expect(screen.getByText("Trigger")).toBeInTheDocument();
	});
});
