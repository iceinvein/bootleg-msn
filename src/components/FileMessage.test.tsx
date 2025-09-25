/**
 * Tests for FileMessage component
 *
 * Tests cover:
 * - Loading state when file URL is not available
 * - Image file rendering with click to open
 * - Video file rendering with controls
 * - PDF file rendering with download link
 * - Generic file rendering with download link
 * - File size formatting
 */

import type { Id } from "@convex/_generated/dataModel";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileMessage } from "./FileMessage";

// Mock Convex
const mockUseQuery = vi.hoisted(() => vi.fn());
vi.mock("convex/react", () => ({
	useQuery: mockUseQuery,
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
	api: {
		files: {
			getFileUrl: vi.fn(),
		},
	},
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
	value: mockWindowOpen,
	writable: true,
});

describe("FileMessage", () => {
	const mockFileId = "file123" as Id<"_storage">;
	const mockFileUrl = "https://example.com/file.jpg";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("loading state", () => {
		it("should show loading skeleton when file URL is not available", () => {
			mockUseQuery.mockReturnValue(undefined);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.jpg"
					fileType="image/jpeg"
					fileSize={1024}
				/>,
			);

			// Should show loading skeleton
			const skeletonElements = screen
				.getAllByRole("generic")
				.filter((el) => el.classList.contains("animate-pulse"));
			expect(skeletonElements.length).toBeGreaterThan(0);
			expect(skeletonElements[0]).toHaveClass("animate-pulse");
		});
	});

	describe("image files", () => {
		it("should render image with click to open functionality", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.jpg"
					fileType="image/jpeg"
					fileSize={2048}
				/>,
			);

			const image = screen.getByAltText("test.jpg");
			expect(image).toBeInTheDocument();
			expect(image).toHaveAttribute("src", mockFileUrl);

			const button = screen.getByRole("button");
			expect(button).toHaveAttribute("title", "Click to open image in new tab");

			// Test click functionality
			fireEvent.click(button);
			expect(mockWindowOpen).toHaveBeenCalledWith(mockFileUrl, "_blank");

			// Check file info
			expect(screen.getByText("test.jpg • 2 KB")).toBeInTheDocument();
		});

		it("should handle different image formats", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			const { rerender } = render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.png"
					fileType="image/png"
					fileSize={1024}
				/>,
			);

			expect(screen.getByAltText("test.png")).toBeInTheDocument();

			rerender(
				<FileMessage
					fileId={mockFileId}
					fileName="test.gif"
					fileType="image/gif"
					fileSize={1024}
				/>,
			);

			expect(screen.getByAltText("test.gif")).toBeInTheDocument();
		});
	});

	describe("video files", () => {
		it("should render video with controls", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.mp4"
					fileType="video/mp4"
					fileSize={5242880} // 5MB
				/>,
			);

			const video = document.querySelector("video");
			expect(video).toBeInTheDocument();
			expect(video).toHaveAttribute("src", mockFileUrl);
			expect(video).toHaveAttribute("controls");
			expect(video).toHaveAttribute("preload", "metadata");

			// Check file info
			expect(screen.getByText("test.mp4 • 5 MB")).toBeInTheDocument();

			// Check accessibility track
			const track = video?.querySelector("track");
			expect(track).toHaveAttribute("kind", "captions");
			expect(track).toHaveAttribute("label", "No captions available");
		});

		it("should handle different video formats", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			const { rerender } = render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.webm"
					fileType="video/webm"
					fileSize={1024}
				/>,
			);

			expect(document.querySelector("video")).toBeInTheDocument();

			rerender(
				<FileMessage
					fileId={mockFileId}
					fileName="test.mov"
					fileType="video/quicktime"
					fileSize={1024}
				/>,
			);

			expect(document.querySelector("video")).toBeInTheDocument();
		});
	});

	describe("PDF files", () => {
		it("should render PDF with download link and PDF icon", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="document.pdf"
					fileType="application/pdf"
					fileSize={1048576} // 1MB
				/>,
			);

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", mockFileUrl);
			expect(link).toHaveAttribute("download", "document.pdf");

			expect(screen.getByText("document.pdf")).toBeInTheDocument();
			expect(screen.getByText("1 MB")).toBeInTheDocument();

			// Should have PDF-specific styling
			const iconContainer = document.querySelector(".bg-blue-100");
			expect(iconContainer?.querySelector("svg")).toHaveClass("text-red-600");
		});
	});

	describe("generic files", () => {
		it("should render generic file with download link", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="document.docx"
					fileType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
					fileSize={512000}
				/>,
			);

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("href", mockFileUrl);
			expect(link).toHaveAttribute("download", "document.docx");

			expect(screen.getByText("document.docx")).toBeInTheDocument();
			expect(screen.getByText("500 KB")).toBeInTheDocument();
		});

		it("should render text files", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="readme.txt"
					fileType="text/plain"
					fileSize={256}
				/>,
			);

			expect(screen.getByRole("link")).toBeInTheDocument();
			expect(screen.getByText("readme.txt")).toBeInTheDocument();
			expect(screen.getByText("256 Bytes")).toBeInTheDocument();
		});
	});

	describe("file size formatting", () => {
		it("should format file sizes correctly", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			const testCases = [
				{ size: 0, expected: "0 Bytes" },
				{ size: 512, expected: "512 Bytes" },
				{ size: 1024, expected: "1 KB" },
				{ size: 1536, expected: "1.5 KB" },
				{ size: 1048576, expected: "1 MB" },
				{ size: 1073741824, expected: "1 GB" },
				{ size: 2147483648, expected: "2 GB" },
			];

			testCases.forEach(({ size, expected }) => {
				const { rerender } = render(
					<FileMessage
						fileId={mockFileId}
						fileName="test.txt"
						fileType="text/plain"
						fileSize={size}
					/>,
				);

				expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();

				// Clean up for next iteration
				rerender(<div />);
			});
		});
	});

	describe("accessibility", () => {
		it("should have proper alt text for images", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="vacation-photo.jpg"
					fileType="image/jpeg"
					fileSize={1024}
				/>,
			);

			expect(screen.getByAltText("vacation-photo.jpg")).toBeInTheDocument();
		});

		it("should have proper focus management for interactive elements", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.jpg"
					fileType="image/jpeg"
					fileSize={1024}
				/>,
			);

			const button = screen.getByRole("button");
			expect(button).toHaveClass(
				"focus:outline-none",
				"focus:ring-2",
				"focus:ring-blue-500",
			);
		});

		it("should have proper link attributes for downloads", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="document.pdf"
					fileType="application/pdf"
					fileSize={1024}
				/>,
			);

			const link = screen.getByRole("link");
			expect(link).toHaveAttribute("download");
		});
	});

	describe("edge cases", () => {
		it("should handle very long file names", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);
			const longFileName = `${"a".repeat(100)}.txt`;

			render(
				<FileMessage
					fileId={mockFileId}
					fileName={longFileName}
					fileType="text/plain"
					fileSize={1024}
				/>,
			);

			expect(screen.getByText(longFileName)).toBeInTheDocument();
		});

		it("should handle zero file size", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="empty.txt"
					fileType="text/plain"
					fileSize={0}
				/>,
			);

			expect(screen.getByText("empty.txt")).toBeInTheDocument();
			expect(screen.getByText("0 Bytes")).toBeInTheDocument();
		});

		it("should handle unknown file types", () => {
			mockUseQuery.mockReturnValue(mockFileUrl);

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="unknown.xyz"
					fileType="application/octet-stream"
					fileSize={1024}
				/>,
			);

			// Should render as generic file
			expect(screen.getByRole("link")).toBeInTheDocument();
			expect(screen.getByText("unknown.xyz")).toBeInTheDocument();
		});
	});
});
