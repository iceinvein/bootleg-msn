import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatShortTime } from "../data";

describe("formatShortTime", () => {
	const OriginalDate = Date;
	let originalToTime: any;
	let originalToDate: any;

	beforeEach(() => {
		// Freeze time to a consistent point
		const fixedNow = new OriginalDate("2024-01-15T12:00:00.000Z").getTime();

		// Mock Date.now and Date constructor
		// @ts-expect-error override for test
		global.Date = class extends OriginalDate {
			constructor(...args: any[]) {
				if (args.length === 0) {
					super(fixedNow);
				} else {
					// @ts-expect-error super args
					super(...args);
				}
			}
			static now() {
				return fixedNow;
			}
		} as unknown as DateConstructor;

		// Stub locale methods to avoid environment-dependent output
		originalToTime = OriginalDate.prototype.toLocaleTimeString;
		originalToDate = OriginalDate.prototype.toLocaleDateString;
		// Always return these fixed strings for determinism
		// @ts-expect-error mocking
		OriginalDate.prototype.toLocaleTimeString = vi.fn(() => "2:45 PM");
		// @ts-expect-error mocking
		OriginalDate.prototype.toLocaleDateString = vi.fn(() => "Jan 03");
	});

	afterEach(() => {
		// Restore Date and locale methods
		// @ts-expect-error restore
		global.Date = OriginalDate;
		OriginalDate.prototype.toLocaleTimeString = originalToTime;
		OriginalDate.prototype.toLocaleDateString = originalToDate;
	});

	it("returns time only when timestamp is the same day", () => {
		const tsSameDay = new Date("2024-01-15T09:05:00.000Z").getTime();
		expect(formatShortTime(tsSameDay)).toBe("2:45 PM");
	});

	it("returns 'Mon Day, time' when timestamp is a different day", () => {
		const tsDifferentDay = new Date("2024-01-03T09:05:00.000Z").getTime();
		expect(formatShortTime(tsDifferentDay)).toBe("Jan 03, 2:45 PM");
	});
});
