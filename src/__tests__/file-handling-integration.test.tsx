/**
 * Integration tests for file handling functionality
 *
 * Tests cover:
 * - Complete file upload flow from UI to backend
 * - File message display and interaction
 * - Error handling across the entire flow
 * - File type detection and appropriate display
 * - File size validation and user feedback
 * - Cross-component integration
 */

import type { Id } from "@convex/_generated/dataModel";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Convex functions and API - use vi.hoisted to avoid hoisting issues
const { mockGenerateUploadUrl, mockSendFileMessage, mockUseQuery, mockApi } =
	vi.hoisted(() => {
		const mockGenerateUploadUrl = vi.fn();
		const mockSendFileMessage = vi.fn();
		const mockUseQuery = vi.fn();

		const mockApi = {
			files: {
				generateUploadUrl: mockGenerateUploadUrl,
				sendFileMessage: mockSendFileMessage,
				getFileUrl: vi.fn(),
			},
		};

		return {
			mockGenerateUploadUrl,
			mockSendFileMessage,
			mockUseQuery,
			mockApi,
		};
	});

vi.mock("convex/react", () => ({
	useMutation: vi.fn((mutation) => {
		// Check if the mutation is for generateUploadUrl
		if (mutation === mockApi.files.generateUploadUrl) {
			return mockGenerateUploadUrl;
		}
		// Check if the mutation is for sendFileMessage
		if (mutation === mockApi.files.sendFileMessage) {
			return mockSendFileMessage;
		}
		return vi.fn();
	}),
	useQuery: mockUseQuery,
}));

vi.mock("@convex/_generated/api", () => ({
	api: mockApi,
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

// Mock fetch for file upload
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { DragDropZone } from "../components/DragDropZone";
import { FileMessage } from "../components/FileMessage";
// Import components after mocks
import { FileUpload } from "../components/FileUpload";

describe("File Handling Integration", () => {
	const mockReceiverId = "user123" as Id<"users">;
	const _mockGroupId = "group456" as Id<"groups">;
	const mockFileId = "file789" as Id<"_storage">;

	beforeEach(() => {
		vi.clearAllMocks();

		// Default successful mocks
		mockGenerateUploadUrl.mockResolvedValue(
			"https://upload.example.com/upload-url",
		);
		mockSendFileMessage.mockResolvedValue(undefined);
		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ storageId: mockFileId }),
		});
		mockUseQuery.mockReturnValue("https://example.com/file-url");
	});

	describe("Complete File Upload Flow", () => {
		it("should handle complete file upload and display flow", async () => {
			const onFileUploaded = vi.fn();

			// Render FileUpload component
			const { rerender } = render(
				<FileUpload
					receiverId={mockReceiverId}
					onFileUploaded={onFileUploaded}
				/>,
			);

			// Step 1: User selects file
			const fileInput = screen.getByLabelText("Upload file");
			const file = new File(["test content"], "test-document.pdf", {
				type: "application/pdf",
			});

			fireEvent.change(fileInput, { target: { files: [file] } });

			// Step 2: Verify upload flow
			await waitFor(() => {
				expect(mockGenerateUploadUrl).toHaveBeenCalled();
				expect(mockFetch).toHaveBeenCalledWith(
					"https://upload.example.com/upload-url",
					{
						method: "POST",
						headers: { "Content-Type": "application/pdf" },
						body: file,
					},
				);
				expect(mockSendFileMessage).toHaveBeenCalledWith({
					receiverId: mockReceiverId,
					groupId: undefined,
					fileId: mockFileId,
					fileName: "test-document.pdf",
					fileType: "application/pdf",
					fileSize: file.size,
				});
				expect(mockToastSuccess).toHaveBeenCalledWith(
					"File uploaded successfully!",
				);
				expect(onFileUploaded).toHaveBeenCalled();
			});

			// Step 3: Render FileMessage component to display the uploaded file
			rerender(
				<FileMessage
					fileId={mockFileId}
					fileName="test-document.pdf"
					fileType="application/pdf"
					fileSize={file.size}
				/>,
			);

			// Step 4: Verify file message display
			await waitFor(() => {
				expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
				expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {
					fileId: mockFileId,
				});
			});
		});

		it("should handle drag and drop upload flow", async () => {
			const onFileUploaded = vi.fn();

			// Render DragDropZone component
			render(
				<DragDropZone
					receiverId={mockReceiverId}
					onFileUploaded={onFileUploaded}
				>
					<div data-testid="drop-area">Drop files here</div>
				</DragDropZone>,
			);

			const dropArea = screen.getByTestId("drop-area").parentElement;
			const file = new File(["image data"], "photo.jpg", {
				type: "image/jpeg",
			});

			// Create proper drag and drop events
			fireEvent.drop(dropArea!, {
				dataTransfer: {
					files: [file],
				},
			});

			// Verify complete upload flow
			await waitFor(() => {
				expect(mockGenerateUploadUrl).toHaveBeenCalled();
				expect(mockSendFileMessage).toHaveBeenCalledWith({
					receiverId: mockReceiverId,
					groupId: undefined,
					fileId: mockFileId,
					fileName: "photo.jpg",
					fileType: "image/jpeg",
					fileSize: file.size,
				});
				expect(mockToastSuccess).toHaveBeenCalledWith(
					'File "photo.jpg" uploaded successfully!',
				);
				expect(onFileUploaded).toHaveBeenCalled();
			});
		});
	});

	describe("File Type Handling", () => {
		it("should handle image files correctly", async () => {
			render(
				<FileMessage
					fileId={mockFileId}
					fileName="photo.jpg"
					fileType="image/jpeg"
					fileSize={1024 * 1024}
				/>,
			);

			await waitFor(() => {
				const image = screen.getByRole("img", { name: "photo.jpg" });
				expect(image).toBeInTheDocument();
				expect(image).toHaveAttribute("src", "https://example.com/file-url");
			});
		});

		it("should handle video files correctly", async () => {
			render(
				<FileMessage
					fileId={mockFileId}
					fileName="video.mp4"
					fileType="video/mp4"
					fileSize={5 * 1024 * 1024}
				/>,
			);

			await waitFor(() => {
				const video = document.querySelector("video"); // Find video element directly
				expect(video).toBeInTheDocument();
				expect(video).toHaveAttribute("src", "https://example.com/file-url");
				expect(video).toHaveAttribute("controls");
			});
		});

		it("should handle PDF files correctly", async () => {
			render(
				<FileMessage
					fileId={mockFileId}
					fileName="document.pdf"
					fileType="application/pdf"
					fileSize={2 * 1024 * 1024}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText("document.pdf")).toBeInTheDocument();
				const downloadLink = screen.getByRole("link", {
					name: /download document.pdf/i,
				});
				expect(downloadLink).toBeInTheDocument();
				expect(downloadLink).toHaveAttribute(
					"href",
					"https://example.com/file-url",
				);
				expect(downloadLink).toHaveAttribute("download", "document.pdf");
			});
		});

		it("should handle generic files correctly", async () => {
			render(
				<FileMessage
					fileId={mockFileId}
					fileName="data.txt"
					fileType="text/plain"
					fileSize={1024}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText("data.txt")).toBeInTheDocument();
				expect(screen.getByText("1 KB")).toBeInTheDocument();
				const downloadLink = screen.getByRole("link", {
					name: /download data.txt/i,
				});
				expect(downloadLink).toBeInTheDocument();
			});
		});
	});

	describe("Error Handling Integration", () => {
		it("should handle upload URL generation failure gracefully", async () => {
			mockGenerateUploadUrl.mockRejectedValue(new Error("Server error"));

			render(<FileUpload receiverId={mockReceiverId} />);

			const fileInput = screen.getByLabelText("Upload file");
			const file = new File(["test"], "test.txt", { type: "text/plain" });

			fireEvent.change(fileInput, { target: { files: [file] } });

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Server error");
				expect(mockSendFileMessage).not.toHaveBeenCalled();
			});
		});

		it("should handle file upload failure gracefully", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			render(<FileUpload receiverId={mockReceiverId} />);

			const fileInput = screen.getByLabelText("Upload file");
			const file = new File(["test"], "test.txt", { type: "text/plain" });

			fireEvent.change(fileInput, { target: { files: [file] } });

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith("Upload failed");
				expect(mockSendFileMessage).not.toHaveBeenCalled();
			});
		});

		it("should handle message sending failure gracefully", async () => {
			mockSendFileMessage.mockRejectedValue(new Error("Database error"));

			render(<FileUpload receiverId={mockReceiverId} />);

			const fileInput = screen.getByLabelText("Upload file");
			const file = new File(["test"], "test.txt", { type: "text/plain" });

			fireEvent.change(fileInput, { target: { files: [file] } });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalled(); // Upload should succeed
				expect(mockToastError).toHaveBeenCalledWith("Database error");
			});
		});

		it("should handle file URL loading failure in FileMessage", async () => {
			mockUseQuery.mockReturnValue(null); // Simulate loading or error state

			render(
				<FileMessage
					fileId={mockFileId}
					fileName="test.txt"
					fileType="text/plain"
					fileSize={1024}
				/>,
			);

			// Should show loading skeleton when URL is not available
			expect(
				document.querySelector(".max-w-xs.rounded-lg.border"),
			).toBeInTheDocument(); // Loading skeleton container
			expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
		});
	});

	describe("File Size Validation Integration", () => {
		it("should prevent upload of oversized files across all components", async () => {
			const largeFile = new File(
				[new ArrayBuffer(11 * 1024 * 1024)], // 11MB
				"large-file.txt",
				{ type: "text/plain" },
			);

			// Test FileUpload component
			const { rerender } = render(<FileUpload receiverId={mockReceiverId} />);

			const fileInput = screen.getByLabelText("Upload file");
			fireEvent.change(fileInput, { target: { files: [largeFile] } });

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith(
					"File size must be less than 10MB",
				);
				expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
			});

			vi.clearAllMocks();

			// Test DragDropZone component
			rerender(
				<DragDropZone receiverId={mockReceiverId}>
					<div data-testid="drop-area">Drop files here</div>
				</DragDropZone>,
			);

			const dropArea = screen.getByTestId("drop-area").parentElement;

			fireEvent.drop(dropArea!, {
				dataTransfer: {
					files: [largeFile],
				},
			});

			await waitFor(() => {
				expect(mockToastError).toHaveBeenCalledWith(
					'File "large-file.txt" is too large. Maximum size is 10MB.',
				);
				expect(mockGenerateUploadUrl).not.toHaveBeenCalled();
			});
		});
	});

	describe("Multiple File Handling", () => {
		it("should handle multiple files dropped simultaneously", async () => {
			const files = [
				new File(["content 1"], "file1.txt", { type: "text/plain" }),
				new File(["content 2"], "file2.txt", { type: "text/plain" }),
				new File(["content 3"], "file3.txt", { type: "text/plain" }),
			];

			render(
				<DragDropZone receiverId={mockReceiverId}>
					<div data-testid="drop-area">Drop files here</div>
				</DragDropZone>,
			);

			const dropArea = screen.getByTestId("drop-area").parentElement;

			fireEvent.drop(dropArea!, {
				dataTransfer: {
					files,
				},
			});

			await waitFor(() => {
				expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(3);
				expect(mockSendFileMessage).toHaveBeenCalledTimes(3);
				expect(mockToastSuccess).toHaveBeenCalledTimes(3);
			});
		});
	});
});
