/**
 * Tests for MessageContent component
 * 
 * Tests cover:
 * - Text message rendering
 * - Emoji message rendering
 * - System message rendering
 * - YouTube URL detection and embedding
 * - CSS class application
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MessageContent } from "./MessageContent";

// Mock YouTube utilities
vi.mock("../utils/youtubeUtils", () => ({
	containsYouTubeUrl: vi.fn(),
	replaceYouTubeUrls: vi.fn(),
}));

// Mock YouTubeEmbed component
vi.mock("./YouTubeEmbed", () => ({
	YouTubeEmbed: ({ video }: { video: { videoId: string; title: string } }) => (
		<div data-testid="youtube-embed" data-video-id={video.videoId}>
			{video.title}
		</div>
	),
}));

describe("MessageContent", () => {
	describe("text messages", () => {
		it("should render regular text message", () => {
			render(
				<MessageContent
					content="Hello world"
					messageType="text"
				/>
			);

			expect(screen.getByText("Hello world")).toBeInTheDocument();
			expect(screen.getByText("Hello world")).toHaveClass("break-words");
		});

		it("should apply custom className", () => {
			render(
				<MessageContent
					content="Hello world"
					messageType="text"
					className="custom-class"
				/>
			);

			expect(screen.getByText("Hello world")).toHaveClass("break-words", "custom-class");
		});

		it("should handle text with YouTube URLs", async () => {
			const { containsYouTubeUrl, replaceYouTubeUrls } = await import("../utils/youtubeUtils");
			
			vi.mocked(containsYouTubeUrl).mockReturnValue(true);
			vi.mocked(replaceYouTubeUrls).mockReturnValue({
				text: "Check this out: [YOUTUBE_VIDEO_0]",
				videos: [{
					videoId: "dQw4w9WgXcQ",
					thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
					embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
					url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				}],
			});

			render(
				<MessageContent
					content="Check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
					messageType="text"
				/>
			);

			expect(screen.getByTestId("youtube-embed")).toBeInTheDocument();
			expect(screen.getByTestId("youtube-embed")).toHaveAttribute("data-video-id", "dQw4w9WgXcQ");
		});

		it("should handle text without YouTube URLs", async () => {
			const { containsYouTubeUrl } = await import("../utils/youtubeUtils");
			
			vi.mocked(containsYouTubeUrl).mockReturnValue(false);

			render(
				<MessageContent
					content="Just regular text"
					messageType="text"
				/>
			);

			expect(screen.getByText("Just regular text")).toBeInTheDocument();
			expect(screen.queryByTestId("youtube-embed")).not.toBeInTheDocument();
		});
	});

	describe("emoji messages", () => {
		it("should render emoji message with large text", () => {
			render(
				<MessageContent
					content="😀😃😄"
					messageType="emoji"
				/>
			);

			const emojiElement = screen.getByText("😀😃😄");
			expect(emojiElement).toBeInTheDocument();
			expect(emojiElement).toHaveClass("text-3xl");
		});

		it("should render emoji-only text message with large text", () => {
			render(
				<MessageContent
					content="🎉"
					messageType="text"
					isEmojiOnly={true}
				/>
			);

			const emojiElement = screen.getByText("🎉");
			expect(emojiElement).toBeInTheDocument();
			expect(emojiElement).toHaveClass("text-3xl");
		});

		it("should apply custom className to emoji message", () => {
			render(
				<MessageContent
					content="🚀"
					messageType="emoji"
					className="custom-emoji-class"
				/>
			);

			const emojiElement = screen.getByText("🚀");
			expect(emojiElement).toHaveClass("text-3xl", "custom-emoji-class");
		});
	});

	describe("system messages", () => {
		it("should render system message with gray text", () => {
			render(
				<MessageContent
					content="User joined the chat"
					messageType="system"
				/>
			);

			const systemElement = screen.getByText("User joined the chat");
			expect(systemElement).toBeInTheDocument();
			expect(systemElement).toHaveClass("text-gray-600");
		});

		it("should apply custom className to system message", () => {
			render(
				<MessageContent
					content="System notification"
					messageType="system"
					className="custom-system-class"
				/>
			);

			const systemElement = screen.getByText("System notification");
			expect(systemElement).toHaveClass("text-gray-600", "custom-system-class");
		});
	});

	describe("file messages", () => {
		it("should render file message as regular text", () => {
			render(
				<MessageContent
					content="File uploaded: document.pdf"
					messageType="file"
				/>
			);

			expect(screen.getByText("File uploaded: document.pdf")).toBeInTheDocument();
			expect(screen.getByText("File uploaded: document.pdf")).toHaveClass("break-words");
		});
	});

	describe("edge cases", () => {
		it("should handle empty content", () => {
			const { container } = render(
				<MessageContent
					content=""
					messageType="text"
				/>
			);

			// Should render empty div with break-words class
			const messageDiv = container.querySelector('.break-words');
			expect(messageDiv).toBeInTheDocument();
		});

		it("should handle very long text content", () => {
			const longText = "A".repeat(1000);
			
			render(
				<MessageContent
					content={longText}
					messageType="text"
				/>
			);

			expect(screen.getByText(longText)).toBeInTheDocument();
			expect(screen.getByText(longText)).toHaveClass("break-words");
		});

		it("should handle special characters in content", () => {
			const specialContent = "Special chars: <>&\"'";
			
			render(
				<MessageContent
					content={specialContent}
					messageType="text"
				/>
			);

			expect(screen.getByText(specialContent)).toBeInTheDocument();
		});

		it("should handle multiple YouTube videos in text", async () => {
			const { containsYouTubeUrl, replaceYouTubeUrls } = await import("../utils/youtubeUtils");
			
			vi.mocked(containsYouTubeUrl).mockReturnValue(true);
			vi.mocked(replaceYouTubeUrls).mockReturnValue({
				text: "Video 1: [YOUTUBE_VIDEO_0] and Video 2: [YOUTUBE_VIDEO_1]",
				videos: [
					{
						videoId: "video1",
						thumbnailUrl: "https://img.youtube.com/vi/video1/maxresdefault.jpg",
						embedUrl: "https://www.youtube-nocookie.com/embed/video1",
						url: "https://www.youtube.com/watch?v=video1",
					},
					{
						videoId: "video2", 
						thumbnailUrl: "https://img.youtube.com/vi/video2/maxresdefault.jpg",
						embedUrl: "https://www.youtube-nocookie.com/embed/video2",
						url: "https://www.youtube.com/watch?v=video2",
					},
				],
			});

			render(
				<MessageContent
					content="Video 1: https://www.youtube.com/watch?v=video1 and Video 2: https://www.youtube.com/watch?v=video2"
					messageType="text"
				/>
			);

			const embeds = screen.getAllByTestId("youtube-embed");
			expect(embeds).toHaveLength(2);
			expect(embeds[0]).toHaveAttribute("data-video-id", "video1");
			expect(embeds[1]).toHaveAttribute("data-video-id", "video2");
		});
	});
});
