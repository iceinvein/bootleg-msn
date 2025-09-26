import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Mock Tauri window API
const closeMock = vi.fn();
vi.mock("@tauri-apps/api/window", () => ({
	getCurrentWindow: () => ({ close: closeMock }),
}));

// Mock Chat to a lightweight component that respects props we care about
vi.mock("../Chat", () => ({
	Chat: ({
		onCloseOverride,
		hideBack,
	}: {
		onCloseOverride?: () => void;
		hideBack?: boolean;
	}) => (
		<div>
			{!hideBack && (
				<button aria-label="back" type="button">
					Back
				</button>
			)}
			<button title="Close chat" type="button" onClick={onCloseOverride}>
				Close
			</button>
		</div>
	),
}));

import { ChatOnlyView } from "../ChatOnlyView";

describe("ChatOnlyView (chat-only window)", () => {
	it("does not render back arrow when window=chat", () => {
		render(
			<MemoryRouter initialEntries={["/?chat=contact:user1&window=chat"]}>
				<ChatOnlyView />
			</MemoryRouter>,
		);

		expect(screen.queryByLabelText("back")).toBeNull();
	});

	it("closes the Tauri window when close button is clicked", async () => {
		render(
			<MemoryRouter initialEntries={["/?chat=contact:user1&window=chat"]}>
				<ChatOnlyView />
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByTitle("Close chat"));
		await import("react"); // allow microtask to resolve dynamic import
		await (await import("@testing-library/react")).waitFor(() => {
			expect(closeMock).toHaveBeenCalledTimes(1);
		});
	});
});
