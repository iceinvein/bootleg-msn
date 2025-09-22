import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "./responsive-dialog";

// Mock the useMediaQuery hook
vi.mock("@/hooks/useMediaQuery", () => ({
	useMediaQuery: vi.fn(),
}));

const mockUseMediaQuery = vi.mocked(
	await import("@/hooks/useMediaQuery")
).useMediaQuery;

describe("ResponsiveDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders as Dialog on desktop", () => {
		mockUseMediaQuery.mockReturnValue(false); // Desktop

		render(
			<ResponsiveDialog>
				<ResponsiveDialogTrigger asChild>
					<button>Open Dialog</button>
				</ResponsiveDialogTrigger>
				<ResponsiveDialogContent>
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>Test Title</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Test Description
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					<div>Dialog Content</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		);

		expect(screen.getByText("Open Dialog")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("renders as Drawer on mobile", () => {
		mockUseMediaQuery.mockReturnValue(true); // Mobile

		render(
			<ResponsiveDialog>
				<ResponsiveDialogTrigger asChild>
					<button>Open Drawer</button>
				</ResponsiveDialogTrigger>
				<ResponsiveDialogContent>
					<ResponsiveDialogHeader>
						<ResponsiveDialogTitle>Test Title</ResponsiveDialogTitle>
						<ResponsiveDialogDescription>
							Test Description
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
					<div>Drawer Content</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		);

		expect(screen.getByText("Open Drawer")).toBeInTheDocument();
		expect(mockUseMediaQuery).toHaveBeenCalledWith("(max-width: 768px)");
	});

	it("passes through open and onOpenChange props", () => {
		const onOpenChange = vi.fn();
		mockUseMediaQuery.mockReturnValue(false);

		render(
			<ResponsiveDialog open={true} onOpenChange={onOpenChange}>
				<ResponsiveDialogTrigger asChild>
					<button>Trigger</button>
				</ResponsiveDialogTrigger>
				<ResponsiveDialogContent>
					<div>Content</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		);

		expect(screen.getByText("Trigger")).toBeInTheDocument();
	});

	it("passes through glass and showCloseButton props to DialogContent", () => {
		mockUseMediaQuery.mockReturnValue(false); // Desktop

		render(
			<ResponsiveDialog open={true}>
				<ResponsiveDialogTrigger asChild>
					<button>Trigger</button>
				</ResponsiveDialogTrigger>
				<ResponsiveDialogContent glass={true} showCloseButton={false}>
					<div>Content with glass effect</div>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		);

		expect(screen.getByText("Content with glass effect")).toBeInTheDocument();
	});

	it("passes through className props", () => {
		mockUseMediaQuery.mockReturnValue(false);

		render(
			<ResponsiveDialog open={true}>
				<ResponsiveDialogTrigger asChild>
					<button>Trigger</button>
				</ResponsiveDialogTrigger>
				<ResponsiveDialogContent className="custom-class">
					<ResponsiveDialogHeader className="header-class">
						<ResponsiveDialogTitle className="title-class">
							Title
						</ResponsiveDialogTitle>
						<ResponsiveDialogDescription className="desc-class">
							Description
						</ResponsiveDialogDescription>
					</ResponsiveDialogHeader>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		);

		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
	});
});
