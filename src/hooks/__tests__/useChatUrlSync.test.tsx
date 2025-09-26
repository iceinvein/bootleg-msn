import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatUrlSync } from "../useChatUrlSync";

// Mocks similar to other hook tests
vi.mock("@nanostores/react", () => ({
	useStore: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
}));

vi.mock("@/stores/contact", () => ({
	$selectedChat: {
		set: vi.fn(),
	},
}));

import { useStore } from "@nanostores/react";
// Import mocked functions
import { useQuery } from "convex/react";
import { $selectedChat } from "@/stores/contact";

// Simple probe to read search params out of the router
function SearchProbe({ onSearch }: { onSearch: (s: string) => void }) {
	const [search] = useSearchParams();
	// Defer to effect to avoid act warnings
	React.useEffect(() => {
		onSearch(search.toString());
	}, [search, onSearch]);
	return null;
}

function Harness({ onSearch }: { onSearch?: (s: string) => void }) {
	useChatUrlSync();
	return onSearch ? <SearchProbe onSearch={onSearch} /> : null;
}

describe("useChatUrlSync", () => {
	const mockContacts = [
		{
			_id: "contact1" as any,
			contactUserId: "user2" as any,
			nickname: "Alice",
			user: {
				_id: "user2" as any,
				name: "Alice Smith",
				email: "alice@example.com",
			},
		},
	];

	const mockGroups = [{ _id: "group1" as any, name: "Test Group" }];

	const mockUseQuery = vi.mocked(useQuery);
	const mockUseStore = vi.mocked(useStore);

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseStore.mockReturnValue(null);
		mockUseQuery.mockReturnValue(null as any);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("URL->state: opens contact chat from ?chat=contact:userId", async () => {
		mockUseQuery
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		render(
			<MemoryRouter initialEntries={["/?chat=contact:user2"]}>
				<Harness />
			</MemoryRouter>,
		);

		await waitFor(() => {
			expect($selectedChat.set).toHaveBeenCalledWith({
				contact: mockContacts[0],
				group: null,
			});
		});
	});

	it("URL->state: opens group chat from ?chat=group:groupId", async () => {
		mockUseQuery
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		render(
			<MemoryRouter initialEntries={["/?chat=group:group1"]}>
				<Harness />
			</MemoryRouter>,
		);

		await waitFor(() => {
			expect($selectedChat.set).toHaveBeenCalledWith({
				contact: null,
				group: mockGroups[0],
			});
		});
	});

	it("Event->URL->state: notification-action openChat contact", async () => {
		mockUseQuery
			.mockReturnValueOnce(mockContacts) // contacts (render 1)
			.mockReturnValueOnce(mockGroups) // groups (render 1)
			.mockReturnValueOnce(mockContacts) // contacts (render 2 after URL change)
			.mockReturnValueOnce(mockGroups); // groups (render 2)

		const onSearch = vi.fn();

		render(
			<MemoryRouter initialEntries={["/"]}>
				<Harness onSearch={onSearch} />
			</MemoryRouter>,
		);

		// Dispatch event that sets ?chat=contact:user2 then hook should select contact
		act(() => {
			window.dispatchEvent(
				new CustomEvent("notification-action", {
					detail: { action: "openChat", data: { chatId: "contact:user2" } },
				}) as any,
			);
		});

		// Wait for URL to include chat param
		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith(
				expect.stringContaining("chat=contact%3Auser2"),
			);
		});

		await waitFor(() => {
			expect($selectedChat.set).toHaveBeenCalledWith({
				contact: mockContacts[0],
				group: null,
			});
		});
	});

	it("State->URL: selecting chat updates ?chat param", async () => {
		mockUseQuery
			.mockReturnValueOnce(mockContacts) // contacts
			.mockReturnValueOnce(mockGroups); // groups

		// Simulate selection present in store (contact)
		mockUseStore.mockReturnValue({
			contact: mockContacts[0],
			group: null,
		} as any);

		const onSearch = vi.fn();

		render(
			<MemoryRouter initialEntries={["/"]}>
				<Harness onSearch={onSearch} />
			</MemoryRouter>,
		);

		await waitFor(() => {
			// Eventually should include chat=contact:user2
			expect(onSearch).toHaveBeenCalledWith(
				expect.stringContaining("chat=contact%3Auser2"),
			);
		});
	});

	it("SW message -> URL->state: focuses existing tab and opens chat", async () => {
		// Mock serviceWorker with add/remove listener and a helper to dispatch messages
		const listeners: Record<string, Array<(e: any) => void>> = {};
		Object.defineProperty(navigator, "serviceWorker", {
			value: {
				addEventListener: vi.fn((type: string, cb: (e: any) => void) => {
					if (!listeners[type]) listeners[type] = [];
					listeners[type].push(cb);
				}),
				removeEventListener: vi.fn((type: string, cb: (e: any) => void) => {
					listeners[type] = (listeners[type] || []).filter((fn) => fn !== cb);
				}),
				// test helper
				__dispatch: (type: string, event: any) => {
					const cbs = listeners[type] || [];
					for (const fn of cbs) fn(event);
				},
			},
			configurable: true,
		});

		mockUseQuery
			.mockReturnValueOnce(mockContacts) // contacts (render 1)
			.mockReturnValueOnce(mockGroups) // groups (render 1)
			.mockReturnValueOnce(mockContacts) // contacts (render 2 after URL change)
			.mockReturnValueOnce(mockGroups); // groups (render 2)

		const onSearch = vi.fn();

		render(
			<MemoryRouter initialEntries={["/"]}>
				<Harness onSearch={onSearch} />
			</MemoryRouter>,
		);

		// Dispatch a ServiceWorker message that our hook bridges to window event
		act(() => {
			(navigator.serviceWorker as any).__dispatch(
				"message",
				new MessageEvent("message", {
					data: {
						type: "NOTIFICATION_ACTION",
						action: "openChat",
						data: { chatId: "contact:user2" },
					},
				}),
			);
		});

		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith(
				expect.stringContaining("chat=contact%3Auser2"),
			);
		});

		await waitFor(() => {
			expect($selectedChat.set).toHaveBeenCalledWith({
				contact: mockContacts[0],
				group: null,
			});
		});
	});
});
