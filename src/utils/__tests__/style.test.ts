/**
 * Tests for style utility functions
 */

import { describe, expect, it } from "vitest";
import {
	getMSNStatusIcon,
	getStatusColor,
	getStatusColorWithGlow,
} from "../style";

describe("style utilities", () => {
	describe("getStatusColor", () => {
		it("should return correct colors for each status", () => {
			expect(getStatusColor("online")).toBe("bg-green-500");
			expect(getStatusColor("away")).toBe("bg-yellow-500");
			expect(getStatusColor("busy")).toBe("bg-red-500");
			expect(getStatusColor("invisible")).toBe("bg-gray-400");
			expect(getStatusColor("offline")).toBe("bg-gray-400");
		});

		it("should return default color for unknown status", () => {
			// @ts-expect-error - Testing invalid status
			expect(getStatusColor("unknown")).toBe("bg-gray-400");
			// @ts-expect-error - Testing invalid status
			expect(getStatusColor("invalid")).toBe("bg-gray-400");
		});

		it("should handle all valid status types", () => {
			const validStatuses = [
				"online",
				"away",
				"busy",
				"invisible",
				"offline",
			] as const;

			validStatuses.forEach((status) => {
				const color = getStatusColor(status);
				expect(color).toMatch(/^bg-(green|yellow|red|gray)-\d+$/);
			});
		});
	});

	describe("getStatusColorWithGlow", () => {
		it("should return correct colors with glow effects for active statuses", () => {
			expect(getStatusColorWithGlow("online")).toBe(
				"bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] border-green-400",
			);
			expect(getStatusColorWithGlow("away")).toBe(
				"bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] border-yellow-400",
			);
			expect(getStatusColorWithGlow("busy")).toBe(
				"bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] border-red-400",
			);
		});

		it("should return colors without glow for inactive statuses", () => {
			expect(getStatusColorWithGlow("invisible")).toBe(
				"bg-gray-400 border-gray-300",
			);
			expect(getStatusColorWithGlow("offline")).toBe(
				"bg-gray-400 border-gray-300",
			);
		});

		it("should return default color for unknown status", () => {
			// @ts-expect-error - Testing invalid status
			expect(getStatusColorWithGlow("unknown")).toBe(
				"bg-gray-400 border-gray-300",
			);
		});

		it("should include shadow effects for visible statuses", () => {
			const visibleStatuses = ["online", "away", "busy"];

			visibleStatuses.forEach((status) => {
				const colorWithGlow = getStatusColorWithGlow(status as any);
				expect(colorWithGlow).toContain("shadow-[0_0_8px_rgba(");
				expect(colorWithGlow).toContain("border-");
			});
		});

		it("should not include shadow effects for invisible/offline statuses", () => {
			const invisibleStatuses = ["invisible", "offline"];

			invisibleStatuses.forEach((status) => {
				const colorWithGlow = getStatusColorWithGlow(status as any);
				expect(colorWithGlow).not.toContain("shadow-[0_0_8px_rgba(");
				expect(colorWithGlow).toContain("border-gray-300");
			});
		});
	});

	describe("getMSNStatusIcon", () => {
		it("should return correct MSN-style icons for each status", () => {
			expect(getMSNStatusIcon("online")).toBe("🟢");
			expect(getMSNStatusIcon("away")).toBe("🟡");
			expect(getMSNStatusIcon("busy")).toBe("🔴");
			expect(getMSNStatusIcon("invisible")).toBe("⚫");
			expect(getMSNStatusIcon("offline")).toBe("⚪");
		});

		it("should return default icon for unknown status", () => {
			// @ts-expect-error - Testing invalid status
			expect(getMSNStatusIcon("unknown")).toBe("⚪");
			// @ts-expect-error - Testing invalid status
			expect(getMSNStatusIcon("invalid")).toBe("⚪");
		});

		it("should return emoji icons for all valid statuses", () => {
			const validStatuses = [
				"online",
				"away",
				"busy",
				"invisible",
				"offline",
			] as const;
			const expectedIcons = ["🟢", "🟡", "🔴", "⚫", "⚪"];

			validStatuses.forEach((status) => {
				const icon = getMSNStatusIcon(status);
				expect(expectedIcons).toContain(icon);
			});
		});

		it("should use consistent color mapping", () => {
			// Green for online
			expect(getMSNStatusIcon("online")).toBe("🟢");
			// Yellow for away
			expect(getMSNStatusIcon("away")).toBe("🟡");
			// Red for busy
			expect(getMSNStatusIcon("busy")).toBe("🔴");
			// Black for invisible
			expect(getMSNStatusIcon("invisible")).toBe("⚫");
			// White for offline
			expect(getMSNStatusIcon("offline")).toBe("⚪");
		});
	});

	describe("integration tests", () => {
		it("should have consistent color schemes across all functions", () => {
			const statuses = [
				"online",
				"away",
				"busy",
				"invisible",
				"offline",
			] as const;

			statuses.forEach((status) => {
				const basicColor = getStatusColor(status);
				const glowColor = getStatusColorWithGlow(status);
				const icon = getMSNStatusIcon(status);

				// All functions should handle the same status
				expect(basicColor).toBeDefined();
				expect(glowColor).toBeDefined();
				expect(icon).toBeDefined();

				// Color consistency checks
				if (status === "online") {
					expect(basicColor).toContain("green");
					expect(glowColor).toContain("green");
					expect(icon).toBe("🟢");
				} else if (status === "away") {
					expect(basicColor).toContain("yellow");
					expect(glowColor).toContain("yellow");
					expect(icon).toBe("🟡");
				} else if (status === "busy") {
					expect(basicColor).toContain("red");
					expect(glowColor).toContain("red");
					expect(icon).toBe("🔴");
				} else if (status === "invisible" || status === "offline") {
					expect(basicColor).toContain("gray");
					expect(glowColor).toContain("gray");
					expect(icon).toMatch(/[⚫⚪]/);
				}
			});
		});
	});
});
