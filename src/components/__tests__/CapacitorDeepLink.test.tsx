import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CapacitorIntegration } from "@/components/CapacitorIntegration";
import { useChatUrlSync } from "@/hooks/useChatUrlSync";

// Reuse mocks similar to hook tests
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
import { useQuery } from "convex/react";
import { $selectedChat } from "@/stores/contact";

function SearchProbe({ onSearch }: { onSearch: (s: string) => void }) {
	const [search] = useSearchParams();
	React.useEffect(() => {
		onSearch(search.toString());
	}, [search, onSearch]);
	return null;
}

function Harness({ onSearch }: { onSearch?: (s: string) => void }) {
	// Mount the URL sync hook so it can react to navigate-to-chat events
	useChatUrlSync();
	return onSearch ? <SearchProbe onSearch={onSearch} /> : null;
}

describe("Capacitor deep link -> navigate-to-chat -> URL->state", () => {
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

	it("handles deep link with ?chat=contact:user2", async () => {
		// contacts/groups for initial render and after URL update
		mockUseQuery
			.mockReturnValueOnce(mockContacts as any)
			.mockReturnValueOnce(mockGroups as any)
			.mockReturnValueOnce(mockContacts as any)
			.mockReturnValueOnce(mockGroups as any);

		const onSearch = vi.fn();

		render(
			<MemoryRouter initialEntries={["/"]}>
				{/* Mount integration to listen for deep-link and dispatch navigate-to-chat */}
				<CapacitorIntegration />
				<Harness onSearch={onSearch} />
			</MemoryRouter>,
		);

		act(() => {
			window.dispatchEvent(
				new CustomEvent("deep-link", {
					detail: "https://example.com/app?chat=contact:user2",
				}) as any,
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

	it("handles deep link with msn://group/<id>", async () => {
		mockUseQuery
			.mockReturnValueOnce(mockContacts as any)
			.mockReturnValueOnce(mockGroups as any)
			.mockReturnValueOnce(mockContacts as any)
			.mockReturnValueOnce(mockGroups as any);

		const onSearch = vi.fn();

		render(
			<MemoryRouter initialEntries={["/"]}>
				<CapacitorIntegration />
				<Harness onSearch={onSearch} />
			</MemoryRouter>,
		);

		act(() => {
			window.dispatchEvent(
				new CustomEvent("deep-link", {
					detail: "msn://group/group1",
				}) as any,
			);
		});

		await waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith(
				expect.stringContaining("chat=group%3Agroup1"),
			);
		});

		await waitFor(() => {
			expect($selectedChat.set).toHaveBeenCalledWith({
				contact: null,
				group: mockGroups[0],
			});
		});
	});
});
