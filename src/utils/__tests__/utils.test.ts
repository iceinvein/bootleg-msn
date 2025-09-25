/**
 * Tests for lib/utils.ts utility functions
 */

import { describe, expect, it } from "vitest";
import { cn } from "../../lib/utils";

describe("lib/utils", () => {
	describe("cn (className utility)", () => {
		it("should merge class names correctly", () => {
			expect(cn("class1", "class2")).toBe("class1 class2");
			expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500"); // Tailwind merge should prioritize later classes
		});

		it("should handle conditional classes", () => {
			expect(cn("base", true && "conditional", false && "hidden")).toBe(
				"base conditional",
			);
			expect(cn("base", undefined, null, "valid")).toBe("base valid");
		});

		it("should handle arrays of classes", () => {
			expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
		});

		it("should handle objects with conditional classes", () => {
			expect(
				cn({
					base: true,
					conditional: true,
					hidden: false,
				}),
			).toBe("base conditional");
		});

		it("should merge conflicting Tailwind classes correctly", () => {
			// twMerge should handle Tailwind class conflicts
			expect(cn("p-4", "p-2")).toBe("p-2");
			expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
			expect(cn("bg-white", "bg-black")).toBe("bg-black");
		});

		it("should handle empty inputs", () => {
			expect(cn()).toBe("");
			expect(cn("")).toBe("");
			expect(cn(null, undefined)).toBe("");
		});

		it("should handle complex combinations", () => {
			const result = cn(
				"base-class",
				{
					"conditional-true": true,
					"conditional-false": false,
				},
				["array-class1", "array-class2"],
				"final-class",
			);
			expect(result).toBe(
				"base-class conditional-true array-class1 array-class2 final-class",
			);
		});

		it("should handle Tailwind responsive classes", () => {
			expect(cn("text-sm", "md:text-lg", "lg:text-xl")).toBe(
				"text-sm md:text-lg lg:text-xl",
			);
		});

		it("should handle Tailwind state variants", () => {
			expect(cn("bg-blue-500", "hover:bg-blue-600", "focus:bg-blue-700")).toBe(
				"bg-blue-500 hover:bg-blue-600 focus:bg-blue-700",
			);
		});

		it("should merge similar Tailwind utilities correctly", () => {
			// Test margin conflicts
			expect(cn("m-4", "m-2")).toBe("m-2");
			expect(cn("mx-4", "mx-2")).toBe("mx-2");
			expect(cn("mt-4", "mt-2")).toBe("mt-2");

			// Test padding conflicts
			expect(cn("p-4", "p-2")).toBe("p-2");
			expect(cn("px-4", "px-2")).toBe("px-2");
			expect(cn("py-4", "py-2")).toBe("py-2");

			// Test width conflicts
			expect(cn("w-full", "w-1/2")).toBe("w-1/2");
			expect(cn("w-32", "w-64")).toBe("w-64");
		});

		it("should preserve non-conflicting classes", () => {
			expect(cn("text-red-500", "bg-blue-500", "p-4", "rounded")).toBe(
				"text-red-500 bg-blue-500 p-4 rounded",
			);
		});

		it("should handle custom CSS classes mixed with Tailwind", () => {
			expect(cn("custom-class", "bg-red-500", "another-custom")).toBe(
				"custom-class bg-red-500 another-custom",
			);
		});

		it("should handle whitespace correctly", () => {
			expect(cn("class1", "class2")).toBe("class1 class2");
			expect(cn("class1\n", "\tclass2")).toBe("class1 class2");
		});

		it("should be performant with many classes", () => {
			const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`);
			const result = cn(...manyClasses);
			expect(result).toContain("class-0");
			expect(result).toContain("class-99");
		});
	});
});
