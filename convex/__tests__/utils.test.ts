/**
 * Tests for Convex utility functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConvexTestingHelper } from "convex/testing";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	validateVoiceMessage,
	validateBackgroundImage,
	validateHexColor,
	validateTimezone,
	getBackupExpiryDate,
	generateSearchVector,
} from "../utils";
import {
	MAX_VOICE_MESSAGE_SIZE,
	MAX_VOICE_MESSAGE_DURATION,
	MIN_VOICE_MESSAGE_DURATION,
	MAX_BACKGROUND_IMAGE_SIZE,
	BACKUP_EXPIRY_DAYS,
} from "../validators";

describe("Convex utils", () => {
	describe("validateVoiceMessage", () => {
		it("should pass validation for valid voice messages", () => {
			expect(() => {
				validateVoiceMessage(
					60, // 60 seconds (within limits)
					5 * 1024 * 1024, // 5MB
					"audio/webm"
				);
			}).not.toThrow();

			expect(() => {
				validateVoiceMessage(
					30, // 30 seconds (within limits)
					1 * 1024 * 1024, // 1MB
					"audio/mp4"
				);
			}).not.toThrow();
		});

		it("should throw error for messages that are too short", () => {
			expect(() => {
				validateVoiceMessage(
					MIN_VOICE_MESSAGE_DURATION - 1,
					1 * 1024 * 1024,
					"audio/webm"
				);
			}).toThrow("Voice message too short");
		});

		it("should throw error for messages that are too long", () => {
			expect(() => {
				validateVoiceMessage(
					MAX_VOICE_MESSAGE_DURATION + 1,
					1 * 1024 * 1024,
					"audio/webm"
				);
			}).toThrow("Voice message too long");
		});

		it("should throw error for files that are too large", () => {
			expect(() => {
				validateVoiceMessage(
					60, // Valid duration
					MAX_VOICE_MESSAGE_SIZE + 1,
					"audio/webm"
				);
			}).toThrow("Voice message file too large");
		});

		it("should throw error for unsupported audio formats", () => {
			expect(() => {
				validateVoiceMessage(
					60, // Valid duration
					1 * 1024 * 1024,
					"audio/flac" // Unsupported format
				);
			}).toThrow("Unsupported audio format");

			expect(() => {
				validateVoiceMessage(
					60, // Valid duration
					1 * 1024 * 1024,
					"video/mp4" // Wrong type
				);
			}).toThrow("Unsupported audio format");
		});

		it("should accept all supported audio formats", () => {
			const supportedFormats = [
				"audio/webm",
				"audio/mp4",
				"audio/mpeg",
				"audio/wav", // This is actually supported
				"audio/ogg",
			];

			supportedFormats.forEach(format => {
				expect(() => {
					validateVoiceMessage(60, 1 * 1024 * 1024, format);
				}).not.toThrow();
			});
		});
	});

	describe("validateBackgroundImage", () => {
		it("should pass validation for valid background images", () => {
			expect(() => {
				validateBackgroundImage(
					2 * 1024 * 1024, // 2MB
					"image/jpeg"
				);
			}).not.toThrow();

			expect(() => {
				validateBackgroundImage(
					1 * 1024 * 1024, // 1MB
					"image/png"
				);
			}).not.toThrow();
		});

		it("should throw error for images that are too large", () => {
			expect(() => {
				validateBackgroundImage(
					MAX_BACKGROUND_IMAGE_SIZE + 1,
					"image/jpeg"
				);
			}).toThrow("Background image too large");
		});

		it("should throw error for unsupported image formats", () => {
			expect(() => {
				validateBackgroundImage(
					1 * 1024 * 1024,
					"image/bmp"
				);
			}).toThrow("Unsupported image format");

			expect(() => {
				validateBackgroundImage(
					1 * 1024 * 1024,
					"video/mp4"
				);
			}).toThrow("Unsupported image format");
		});

		it("should accept all supported image formats", () => {
			const supportedFormats = [
				"image/jpeg",
				"image/jpg",
				"image/png",
				"image/gif",
				"image/webp",
			];

			supportedFormats.forEach(format => {
				expect(() => {
					validateBackgroundImage(1 * 1024 * 1024, format);
				}).not.toThrow();
			});
		});
	});

	describe("validateHexColor", () => {
		it("should return true for valid hex colors", () => {
			expect(validateHexColor("#FF0000")).toBe(true);
			expect(validateHexColor("#00FF00")).toBe(true);
			expect(validateHexColor("#0000FF")).toBe(true);
			expect(validateHexColor("#ffffff")).toBe(true);
			expect(validateHexColor("#000000")).toBe(true);
			expect(validateHexColor("#123ABC")).toBe(true);
		});

		it("should return true for valid 3-character hex colors", () => {
			expect(validateHexColor("#F00")).toBe(true);
			expect(validateHexColor("#0F0")).toBe(true);
			expect(validateHexColor("#00F")).toBe(true);
			expect(validateHexColor("#fff")).toBe(true);
			expect(validateHexColor("#000")).toBe(true);
			expect(validateHexColor("#1A3")).toBe(true);
		});

		it("should return false for invalid hex colors", () => {
			expect(validateHexColor("FF0000")).toBe(false); // Missing #
			expect(validateHexColor("#GG0000")).toBe(false); // Invalid character
			expect(validateHexColor("#FF00")).toBe(false); // Wrong length
			expect(validateHexColor("#FF00000")).toBe(false); // Too long
			expect(validateHexColor("#")).toBe(false); // Just #
			expect(validateHexColor("")).toBe(false); // Empty string
			expect(validateHexColor("red")).toBe(false); // Color name
		});

		it("should handle edge cases", () => {
			expect(validateHexColor("#")).toBe(false);
			expect(validateHexColor("#F")).toBe(false);
			expect(validateHexColor("#FF")).toBe(false);
			expect(validateHexColor("#FFFF")).toBe(false);
			expect(validateHexColor("#FFFFF")).toBe(false);
		});
	});

	describe("validateTimezone", () => {
		it("should return true for valid timezones", () => {
			expect(validateTimezone("America/New_York")).toBe(true);
			expect(validateTimezone("Europe/London")).toBe(true);
			expect(validateTimezone("Asia/Tokyo")).toBe(true);
			expect(validateTimezone("UTC")).toBe(true);
			expect(validateTimezone("GMT")).toBe(true);
		});

		it("should return false for invalid timezones", () => {
			expect(validateTimezone("Invalid/Timezone")).toBe(false);
			expect(validateTimezone("")).toBe(false);
			expect(validateTimezone("Not_A_Timezone")).toBe(false);
			expect(validateTimezone("America/Invalid_City")).toBe(false);
		});

		it("should handle common timezone formats", () => {
			const validTimezones = [
				"America/Los_Angeles",
				"America/Chicago",
				"America/New_York",
				"Europe/London",
				"Europe/Paris",
				"Europe/Berlin",
				"Asia/Tokyo",
				"Asia/Shanghai",
				"Australia/Sydney",
				"Pacific/Auckland",
			];

			validTimezones.forEach(timezone => {
				expect(validateTimezone(timezone)).toBe(true);
			});
		});
	});

	describe("getBackupExpiryDate", () => {
		it("should return a future timestamp", () => {
			const now = Date.now();
			const expiryDate = getBackupExpiryDate();
			
			expect(expiryDate).toBeGreaterThan(now);
		});

		it("should return a date that is BACKUP_EXPIRY_DAYS in the future", () => {
			const now = Date.now();
			const expiryDate = getBackupExpiryDate();
			const expectedExpiry = now + BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
			
			// Allow for small timing differences (within 1 second)
			expect(Math.abs(expiryDate - expectedExpiry)).toBeLessThan(1000);
		});

		it("should return consistent results for calls made close together", () => {
			const expiry1 = getBackupExpiryDate();
			const expiry2 = getBackupExpiryDate();
			
			// Should be very close (within 10ms)
			expect(Math.abs(expiry1 - expiry2)).toBeLessThan(10);
		});
	});

	describe("generateSearchVector", () => {
		it("should convert text to lowercase", () => {
			expect(generateSearchVector("HELLO WORLD")).toBe("hello world");
			expect(generateSearchVector("Mixed Case Text")).toBe("mixed case text");
		});

		it("should remove punctuation and special characters", () => {
			expect(generateSearchVector("Hello, world!")).toBe("hello world");
			expect(generateSearchVector("Test@#$%^&*()text")).toBe("test text");
			// Note: underscores are treated as word characters, so they remain
			expect(generateSearchVector("one-two_three")).toBe("one two_three");
		});

		it("should filter out short words", () => {
			expect(generateSearchVector("a big test of it")).toBe("big test");
			expect(generateSearchVector("I am a developer")).toBe("developer");
		});

		it("should handle multiple spaces", () => {
			expect(generateSearchVector("hello    world")).toBe("hello world");
			expect(generateSearchVector("test   with   spaces")).toBe("test with spaces");
		});

		it("should handle empty and whitespace-only strings", () => {
			expect(generateSearchVector("")).toBe("");
			expect(generateSearchVector("   ")).toBe("");
			expect(generateSearchVector("\t\n")).toBe("");
		});

		it("should preserve words longer than 2 characters", () => {
			expect(generateSearchVector("cat dog elephant")).toBe("cat dog elephant");
			expect(generateSearchVector("programming javascript typescript")).toBe("programming javascript typescript");
		});

		it("should handle mixed content", () => {
			const input = "Hello! This is a test message with @mentions and #hashtags.";
			const expected = "hello this test message with mentions and hashtags";
			expect(generateSearchVector(input)).toBe(expected);
		});

		it("should handle numbers and alphanumeric content", () => {
			expect(generateSearchVector("test123 hello456")).toBe("test123 hello456");
			expect(generateSearchVector("version 2.0 update")).toBe("version update");
		});
	});
});
