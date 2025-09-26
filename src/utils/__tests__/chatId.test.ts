import { describe, expect, it } from "vitest";
import { isCanonicalChatId, normalizeChatId } from "@/utils/chatId";

describe("normalizeChatId", () => {
	it("returns canonical contact:id unchanged", () => {
		expect(normalizeChatId("contact:user1")).toBe("contact:user1");
		expect(isCanonicalChatId("contact:user1")).toBe(true);
	});

	it("returns canonical group:id unchanged", () => {
		expect(normalizeChatId("group:group1")).toBe("group:group1");
		expect(isCanonicalChatId("group:group1")).toBe(true);
	});

	it("defaults to contact when no prefix is provided", () => {
		expect(normalizeChatId("user2")).toBe("contact:user2");
	});

	it("trims whitespace and normalizes", () => {
		expect(normalizeChatId("  user3  ")).toBe("contact:user3");
	});

	it("does not double-apply prefixes", () => {
		expect(normalizeChatId("contact:contact:user4")).toBe(
			"contact:contact:user4",
		);
	});
});
