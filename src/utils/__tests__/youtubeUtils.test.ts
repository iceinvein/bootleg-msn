/**
 * Tests for YouTube utility functions
 */

import { describe, it, expect } from "vitest";
import {
	extractYouTubeVideoId,
	containsYouTubeUrl,
	getYouTubeVideoInfo,
	replaceYouTubeUrls,
	type YouTubeVideoInfo,
} from "../youtubeUtils";

describe("youtubeUtils", () => {
	describe("extractYouTubeVideoId", () => {
		it("should extract video ID from standard YouTube URLs", () => {
			expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		});

		it("should extract video ID from youtu.be URLs", () => {
			expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("http://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		});

		it("should extract video ID from embed URLs", () => {
			expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		});

		it("should extract video ID from v/ URLs", () => {
			expect(extractYouTubeVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("youtube.com/v/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
		});

		it("should handle URLs with additional parameters", () => {
			expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmRdnEQy")).toBe("dQw4w9WgXcQ");
			expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=30")).toBe("dQw4w9WgXcQ");
		});

		it("should return null for invalid URLs", () => {
			expect(extractYouTubeVideoId("https://www.google.com")).toBe(null);
			expect(extractYouTubeVideoId("https://www.vimeo.com/123456")).toBe(null);
			expect(extractYouTubeVideoId("not a url")).toBe(null);
			expect(extractYouTubeVideoId("")).toBe(null);
		});

		it("should handle edge cases", () => {
			expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=")).toBe(null);
			expect(extractYouTubeVideoId("https://youtu.be/")).toBe(null);
		});
	});

	describe("containsYouTubeUrl", () => {
		it("should return true for text containing YouTube URLs", () => {
			expect(containsYouTubeUrl("Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
			expect(containsYouTubeUrl("Short link: https://youtu.be/dQw4w9WgXcQ")).toBe(true);
			expect(containsYouTubeUrl("Embed: https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
		});

		it("should return true for URLs without protocol", () => {
			expect(containsYouTubeUrl("Check out: www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
			expect(containsYouTubeUrl("Short: youtu.be/dQw4w9WgXcQ")).toBe(true);
		});

		it("should return false for text without YouTube URLs", () => {
			expect(containsYouTubeUrl("Just some regular text")).toBe(false);
			expect(containsYouTubeUrl("https://www.google.com")).toBe(false);
			expect(containsYouTubeUrl("")).toBe(false);
		});

		it("should handle multiple URLs in text", () => {
			const text = "First video: https://youtu.be/abc123 and second: https://www.youtube.com/watch?v=def456";
			expect(containsYouTubeUrl(text)).toBe(true);
		});

		it("should be case insensitive", () => {
			expect(containsYouTubeUrl("Check out: YOUTUBE.COM/watch?v=dQw4w9WgXcQ")).toBe(true);
			expect(containsYouTubeUrl("Short: YOUTU.BE/dQw4w9WgXcQ")).toBe(true);
		});
	});

	describe("getYouTubeVideoInfo", () => {
		it("should return video info for valid YouTube URLs", () => {
			const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const info = getYouTubeVideoInfo(url);

			expect(info).toEqual({
				videoId: "dQw4w9WgXcQ",
				url: url,
				thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
				embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
			});
		});

		it("should return video info for youtu.be URLs", () => {
			const url = "https://youtu.be/dQw4w9WgXcQ";
			const info = getYouTubeVideoInfo(url);

			expect(info).toEqual({
				videoId: "dQw4w9WgXcQ",
				url: url,
				thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
				embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
			});
		});

		it("should return null for invalid URLs", () => {
			expect(getYouTubeVideoInfo("https://www.google.com")).toBe(null);
			expect(getYouTubeVideoInfo("not a url")).toBe(null);
			expect(getYouTubeVideoInfo("")).toBe(null);
		});

		it("should generate correct thumbnail and embed URLs", () => {
			const info = getYouTubeVideoInfo("https://www.youtube.com/watch?v=abc123");
			
			expect(info?.thumbnailUrl).toBe("https://img.youtube.com/vi/abc123/maxresdefault.jpg");
			expect(info?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc123");
		});
	});

	describe("replaceYouTubeUrls", () => {
		it("should replace single YouTube URL with placeholder", () => {
			const text = "Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const result = replaceYouTubeUrls(text);

			expect(result.text).toBe("Check out this video: [YOUTUBE_VIDEO_0]");
			expect(result.videos).toHaveLength(1);
			expect(result.videos[0].videoId).toBe("dQw4w9WgXcQ");
		});

		it("should replace multiple YouTube URLs with placeholders", () => {
			const text = "First: https://youtu.be/abc123 and second: https://www.youtube.com/watch?v=def456";
			const result = replaceYouTubeUrls(text);

			expect(result.text).toBe("First: [YOUTUBE_VIDEO_0] and second: [YOUTUBE_VIDEO_1]");
			expect(result.videos).toHaveLength(2);
			expect(result.videos[0].videoId).toBe("abc123");
			expect(result.videos[1].videoId).toBe("def456");
		});

		it("should handle text without YouTube URLs", () => {
			const text = "Just some regular text";
			const result = replaceYouTubeUrls(text);

			expect(result.text).toBe(text);
			expect(result.videos).toHaveLength(0);
		});

		it("should handle empty text", () => {
			const result = replaceYouTubeUrls("");

			expect(result.text).toBe("");
			expect(result.videos).toHaveLength(0);
		});

		it("should preserve video info in returned array", () => {
			const text = "Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			const result = replaceYouTubeUrls(text);

			expect(result.videos[0]).toEqual({
				videoId: "dQw4w9WgXcQ",
				url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
				embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
			});
		});

		it("should handle URLs with parameters", () => {
			const text = "Video: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLtest";
			const result = replaceYouTubeUrls(text);

			expect(result.text).toBe("Video: [YOUTUBE_VIDEO_0]");
			expect(result.videos).toHaveLength(1);
			expect(result.videos[0].videoId).toBe("dQw4w9WgXcQ");
		});

		it("should handle mixed content", () => {
			const text = "Text before https://youtu.be/abc123 text between https://www.youtube.com/watch?v=def456 text after";
			const result = replaceYouTubeUrls(text);

			expect(result.text).toBe("Text before [YOUTUBE_VIDEO_0] text between [YOUTUBE_VIDEO_1] text after");
			expect(result.videos).toHaveLength(2);
		});
	});
});
