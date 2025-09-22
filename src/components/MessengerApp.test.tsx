import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the required dependencies BEFORE importing the component
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(),
}));

vi.mock("@/hooks/useMessageNotifications", () => ({
	useMessageNotifications: vi.fn(),
}));

vi.mock("@/hooks/useOnlineNotifications", () => ({
	useOnlineNotifications: vi.fn(),
}));

vi.mock("./AccountLinkingNotification", () => ({
	AccountLinkingNotification: () => <div data-testid="account-linking" />,
}));

vi.mock("./Chat", () => ({
	Chat: () => <div data-testid="chat-area" />,
}));

vi.mock("./ContactList", () => ({
	ContactList: () => <div data-testid="contact-list" />,
}));

vi.mock("./StatusBar", () => ({
	StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock("./VersionInfo", () => ({
	VersionBadge: () => <div data-testid="version-badge" />,
}));

import { useStore } from "@nanostores/react";
import { useMutation, useQuery } from "convex/react";
// Import after mocking
import { MessengerApp } from "./MessengerApp";

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const mockUseStore = vi.mocked(useStore);

describe("MessengerApp", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default mocks
		mockUseQuery.mockReturnValue({ id: "1", email: "test@example.com" });

		// Mock mutations to return promises with proper methods
		const mockMutationFn = Object.assign(vi.fn().mockResolvedValue(undefined), {
			withOptimisticUpdate: vi
				.fn()
				.mockReturnValue(vi.fn().mockResolvedValue(undefined)),
		});
		mockUseMutation.mockReturnValue(mockMutationFn);
	});

	it("shows sidebar when no chat is selected on mobile", () => {
		// Mock no selected chat
		mockUseStore.mockReturnValue(null);

		render(<MessengerApp />);

		// Target the mobile layout specifically (md:hidden)
		const mobileLayout = document.querySelector(".md\\:hidden");
		const mobileSidebar = mobileLayout?.querySelector('[data-testid="status-bar"]')?.parentElement;

		// Should have classes that show sidebar on mobile when no chat is selected
		expect(mobileSidebar).toHaveClass("flex");
		expect(mobileSidebar).not.toHaveClass("hidden");
	});

	it("hides sidebar when chat is selected on mobile", () => {
		// Mock selected contact chat
		mockUseStore.mockReturnValue({
			contact: { id: "1", user: { name: "Test User" } },
			group: null,
		});

		render(<MessengerApp />);

		// Target the mobile layout specifically
		const mobileLayout = document.querySelector(".md\\:hidden");
		const mobileSidebar = mobileLayout?.querySelector('[data-testid="status-bar"]')?.parentElement;

		// Should have classes that hide sidebar on mobile when chat is selected
		expect(mobileSidebar).toHaveClass("hidden");
	});

	it("hides sidebar when group chat is selected on mobile", () => {
		// Mock selected group chat
		mockUseStore.mockReturnValue({
			contact: null,
			group: { _id: "group1", name: "Test Group" },
		});

		render(<MessengerApp />);

		// Target the mobile layout specifically
		const mobileLayout = document.querySelector(".md\\:hidden");
		const mobileSidebar = mobileLayout?.querySelector('[data-testid="status-bar"]')?.parentElement;

		// Should have classes that hide sidebar on mobile when group chat is selected
		expect(mobileSidebar).toHaveClass("hidden");
	});

	it("shows loading spinner when user is not loaded", () => {
		mockUseQuery.mockReturnValue(null);
		mockUseStore.mockReturnValue(null);

		render(<MessengerApp />);

		// Should show loading spinner
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("renders all main components when user is loaded", () => {
		mockUseStore.mockReturnValue(null);

		render(<MessengerApp />);

		expect(screen.getByTestId("account-linking")).toBeInTheDocument();
		expect(screen.getAllByTestId("status-bar")).toHaveLength(2); // Desktop + Mobile
		expect(screen.getAllByTestId("contact-list")).toHaveLength(2); // Desktop + Mobile
		expect(screen.getAllByTestId("version-badge")).toHaveLength(2); // Desktop + Mobile
		expect(screen.getAllByTestId("chat-area")).toHaveLength(2); // Desktop + Mobile
	});

	it("shows sidebar at full width on mobile when no chat is selected", () => {
		// Mock no selected chat
		mockUseStore.mockReturnValue(null);

		render(<MessengerApp />);

		// Target the mobile layout specifically
		const mobileLayout = document.querySelector(".md\\:hidden");
		const mobileSidebar = mobileLayout?.querySelector('[data-testid="status-bar"]')?.parentElement;
		const mobileChatArea = mobileLayout?.querySelector('[data-testid="chat-area"]')?.parentElement;

		// Sidebar should be full width on mobile
		expect(mobileSidebar).toHaveClass("w-full");

		// Chat area should be hidden on mobile when no chat is selected
		expect(mobileChatArea).toHaveClass("hidden");
	});

	it("hides chat area on mobile when no chat is selected", () => {
		// Mock no selected chat
		mockUseStore.mockReturnValue(null);

		render(<MessengerApp />);

		// Target the mobile layout specifically
		const mobileLayout = document.querySelector(".md\\:hidden");
		const mobileChatArea = mobileLayout?.querySelector('[data-testid="chat-area"]')?.parentElement;

		// Chat area should be hidden on mobile when no chat is selected
		expect(mobileChatArea).toHaveClass("hidden");
	});
});
