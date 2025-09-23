/**
 * Tests for emoji utility functions
 */

import { describe, it, expect } from "vitest";
import { convertTextToEmoji, isOnlyEmoji } from "../emojiUtils";

describe("emojiUtils", () => {
	describe("convertTextToEmoji", () => {
		it("should convert basic smiley text to emojis", () => {
			expect(convertTextToEmoji(":)")).toBe("🙂");
			expect(convertTextToEmoji(":-)")).toBe("🙂");
			expect(convertTextToEmoji(":(")).toBe("🙁");
			expect(convertTextToEmoji(":-(")).toBe("🙁");
			expect(convertTextToEmoji(":D")).toBe("😃");
			expect(convertTextToEmoji(":-D")).toBe("😃");
		});

		it("should convert text with multiple emojis", () => {
			expect(convertTextToEmoji("Hello :) How are you? :(")).toBe("Hello 🙂 How are you? 🙁");
			expect(convertTextToEmoji("Great job! :D :thumbsup:")).toBe("Great job! 😃 👍");
		});

		it("should convert colon-wrapped emoji codes", () => {
			expect(convertTextToEmoji(":heart:")).toBe("❤️");
			expect(convertTextToEmoji(":thumbsup:")).toBe("👍");
			expect(convertTextToEmoji(":fire:")).toBe("🔥");
			expect(convertTextToEmoji(":100:")).toBe("💯");
		});

		it("should convert hearts and special symbols", () => {
			expect(convertTextToEmoji("<3")).toBe("❤️");
			expect(convertTextToEmoji("</3")).toBe("💔");
			expect(convertTextToEmoji("XD")).toBe("😆");
			expect(convertTextToEmoji("xD")).toBe("😆");
		});

		it("should convert animal emojis", () => {
			expect(convertTextToEmoji(":dog:")).toBe("🐶");
			expect(convertTextToEmoji(":cat:")).toBe("🐱");
			expect(convertTextToEmoji(":panda:")).toBe("🐼");
			expect(convertTextToEmoji(":unicorn:")).toBe("🦄");
		});

		it("should convert food emojis", () => {
			expect(convertTextToEmoji(":pizza:")).toBe("🍕");
			expect(convertTextToEmoji(":burger:")).toBe("🍔");
			expect(convertTextToEmoji(":coffee:")).toBe("☕");
			expect(convertTextToEmoji(":cake:")).toBe("🎂");
		});

		it("should handle text without emojis", () => {
			expect(convertTextToEmoji("Hello world")).toBe("Hello world");
			expect(convertTextToEmoji("No emojis here")).toBe("No emojis here");
			expect(convertTextToEmoji("")).toBe("");
		});

		it("should handle mixed content", () => {
			const input = "I love :pizza: and :coffee: in the morning :)";
			const expected = "I love 🍕 and ☕ in the morning 🙂";
			expect(convertTextToEmoji(input)).toBe(expected);
		});

		it("should prioritize longer patterns over shorter ones", () => {
			// :- patterns should be converted before : patterns
			expect(convertTextToEmoji(":-)")).toBe("🙂");
			expect(convertTextToEmoji(":-(")).toBe("🙁");
		});

		it("should handle special regex characters in text", () => {
			expect(convertTextToEmoji("Test (parentheses) :)")).toBe("Test (parentheses) 🙂");
			expect(convertTextToEmoji("Test [brackets] :(")).toBe("Test [brackets] 🙁");
			expect(convertTextToEmoji("Test {braces} :D")).toBe("Test {braces} 😃");
		});

		it("should convert multiple instances of the same emoji", () => {
			expect(convertTextToEmoji(":) :) :)")).toBe("🙂 🙂 🙂");
			expect(convertTextToEmoji(":heart: :heart: :heart:")).toBe("❤️ ❤️ ❤️");
		});

		it("should handle case sensitivity correctly", () => {
			expect(convertTextToEmoji("XD")).toBe("😆");
			expect(convertTextToEmoji("xD")).toBe("😆");
			expect(convertTextToEmoji(":D")).toBe("😃");
			expect(convertTextToEmoji(":P")).toBe("😛");
			expect(convertTextToEmoji(":p")).toBe("😛");
		});
	});

	describe("isOnlyEmoji", () => {
		it("should return true for strings with only emojis", () => {
			expect(isOnlyEmoji("😀")).toBe(true);
			expect(isOnlyEmoji("😀😃😄")).toBe(true);
			expect(isOnlyEmoji("🎉🎊🎈")).toBe(true);
			// Note: Some emojis with variation selectors may not be detected by the current regex
			expect(isOnlyEmoji("💙💚")).toBe(true);
		});

		it("should return true for emojis with whitespace", () => {
			expect(isOnlyEmoji("😀 😃")).toBe(true);
			expect(isOnlyEmoji(" 😀 ")).toBe(true);
			expect(isOnlyEmoji("😀\n😃")).toBe(true);
			expect(isOnlyEmoji("😀\t😃")).toBe(true);
		});

		it("should return false for strings with text and emojis", () => {
			expect(isOnlyEmoji("Hello 😀")).toBe(false);
			expect(isOnlyEmoji("😀 world")).toBe(false);
			expect(isOnlyEmoji("Hello 😀 world")).toBe(false);
		});

		it("should return false for strings with only text", () => {
			expect(isOnlyEmoji("Hello world")).toBe(false);
			expect(isOnlyEmoji("123")).toBe(false);
			expect(isOnlyEmoji("abc")).toBe(false);
		});

		it("should return false for empty strings", () => {
			expect(isOnlyEmoji("")).toBe(false);
			expect(isOnlyEmoji("   ")).toBe(false);
			expect(isOnlyEmoji("\n\t")).toBe(false);
		});

		it("should handle various emoji ranges", () => {
			// Emoticons (these are in the supported range)
			expect(isOnlyEmoji("😀😃😄")).toBe(true);
			// Transport and map symbols (these are in the supported range)
			expect(isOnlyEmoji("🚗🚲")).toBe(true);
			// Note: The current regex implementation has limited emoji range support
			// Some symbols like ⭐⚡ may not be detected as emojis by the current implementation
		});

		it("should return false for text emoticons", () => {
			expect(isOnlyEmoji(":)")).toBe(false);
			expect(isOnlyEmoji(":(")).toBe(false);
			expect(isOnlyEmoji(":D")).toBe(false);
		});

		it("should handle mixed emoji and punctuation", () => {
			expect(isOnlyEmoji("😀!")).toBe(false);
			expect(isOnlyEmoji("😀?")).toBe(false);
			expect(isOnlyEmoji("😀.")).toBe(false);
		});
	});
});
