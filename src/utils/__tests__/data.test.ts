/**
 * Tests for data utility functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatTime } from "../data";

describe("data utilities", () => {
	let originalDateNow: typeof Date.now;
	let originalDate: typeof Date;

	beforeEach(() => {
		// Mock Date.now and Date constructor to return consistent timestamps
		originalDateNow = Date.now;
		originalDate = global.Date;

		const mockNow = new Date("2024-01-15T12:00:00Z").getTime();

		// Mock Date.now
		Date.now = vi.fn(() => mockNow);

		// Mock Date constructor to return consistent "now" time
		global.Date = class extends originalDate {
			constructor(...args: any[]) {
				if (args.length === 0) {
					super(mockNow);
				} else {
					super(...args);
				}
			}

			static now() {
				return mockNow;
			}
		} as any;
	});

	afterEach(() => {
		// Restore original Date and Date.now
		Date.now = originalDateNow;
		global.Date = originalDate;
	});

	describe("formatTime", () => {
		it("should return 'Just now' for times less than 1 minute ago", () => {
			const now = Date.now();
			const thirtySecondsAgo = now - 30 * 1000;

			expect(formatTime(thirtySecondsAgo)).toBe("Just now");
			expect(formatTime(new Date(thirtySecondsAgo))).toBe("Just now");
		});

		it("should return minutes for times less than 1 hour ago", () => {
			const now = Date.now();
			const fiveMinutesAgo = now - 5 * 60 * 1000;
			const thirtyMinutesAgo = now - 30 * 60 * 1000;
			const fiftyNineMinutesAgo = now - 59 * 60 * 1000;

			expect(formatTime(fiveMinutesAgo)).toBe("5m ago");
			expect(formatTime(new Date(thirtyMinutesAgo))).toBe("30m ago");
			expect(formatTime(fiftyNineMinutesAgo)).toBe("59m ago");
		});

		it("should return hours for times less than 24 hours ago", () => {
			const now = Date.now();
			const oneHourAgo = now - 1 * 60 * 60 * 1000;
			const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
			const twentyThreeHoursAgo = now - 23 * 60 * 60 * 1000;

			expect(formatTime(oneHourAgo)).toBe("1h ago");
			expect(formatTime(new Date(twelveHoursAgo))).toBe("12h ago");
			expect(formatTime(twentyThreeHoursAgo)).toBe("23h ago");
		});

		it("should return days for times 24 hours or more ago", () => {
			const now = Date.now();
			const oneDayAgo = now - 24 * 60 * 60 * 1000;
			const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
			const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

			expect(formatTime(oneDayAgo)).toBe("1d ago");
			expect(formatTime(new Date(threeDaysAgo))).toBe("3d ago");
			expect(formatTime(tenDaysAgo)).toBe("10d ago");
		});

		it("should handle Date objects correctly", () => {
			const now = new Date(Date.now());
			const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

			expect(formatTime(fiveMinutesAgo)).toBe("5m ago");
		});

		it("should handle number timestamps correctly", () => {
			const now = Date.now();
			const fiveMinutesAgo = now - 5 * 60 * 1000;

			expect(formatTime(fiveMinutesAgo)).toBe("5m ago");
		});

		it("should handle edge cases", () => {
			const now = Date.now();

			// Exactly 1 minute ago
			const exactlyOneMinute = now - 60 * 1000;
			expect(formatTime(exactlyOneMinute)).toBe("1m ago");

			// Exactly 1 hour ago
			const exactlyOneHour = now - 60 * 60 * 1000;
			expect(formatTime(exactlyOneHour)).toBe("1h ago");

			// Exactly 24 hours ago
			const exactlyOneDay = now - 24 * 60 * 60 * 1000;
			expect(formatTime(exactlyOneDay)).toBe("1d ago");
		});

		it("should handle future dates gracefully", () => {
			const now = Date.now();
			const futureTime = now + 5 * 60 * 1000; // 5 minutes in the future

			// Should return "Just now" for future times (negative diff)
			expect(formatTime(futureTime)).toBe("Just now");
		});

		it("should handle very old dates", () => {
			const now = Date.now();
			const veryOldTime = now - 365 * 24 * 60 * 60 * 1000; // 1 year ago

			expect(formatTime(veryOldTime)).toBe("365d ago");
		});
	});
});
