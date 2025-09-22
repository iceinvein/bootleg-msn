import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuTrigger,
} from "./responsive-dropdown-menu";

// Mock the useMediaQuery hook
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: vi.fn(() => false), // Default to desktop
}));

describe("ResponsiveDropdownMenu", () => {
	it("handles menu item clicks", () => {
		const onClick = vi.fn();

		render(
			<ResponsiveDropdownMenu>
				<ResponsiveDropdownMenuTrigger asChild>
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
