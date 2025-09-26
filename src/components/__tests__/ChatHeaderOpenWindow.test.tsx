import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock Tauri env + chat window API
const openChatWindowMock = vi.fn();
vi.mock("@/hooks/useTauri", () => ({
	useTauri: () => ({ isTauri: true }),
	useChatWindows: () => ({ openChatWindow: openChatWindowMock }),
}));

import { $selectedChat } from "@/stores/contact";
import { ChatHeader } from "../chat/ChatHeader";

describe("ChatHeader - Open in window (Tauri)", () => {
	it("shows 'Open in window' and calls openChatWindow with canonical id", async () => {
		// Arrange selected chat as direct contact
		$selectedChat.set({
			contact: {
				contactUserId: "user123",
				nickname: "Alice",
				user: { name: "Alice" },
			} as any,
			group: null,
		});

		render(<ChatHeader onClose={() => {}} />);

		const btn = screen.getByTitle("Open in window");
		expect(btn).toBeInTheDocument();

		fireEvent.click(btn);

		expect(openChatWindowMock).toHaveBeenCalledWith("contact:user123", "Alice");
	});
});
