import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "../chat/ChatComposer";

// Minimal mocks for dependencies to keep test focused on the reply pill
const useStoreMock = vi.fn();
vi.mock("@nanostores/react", () => ({
	useStore: (...args: any[]) => useStoreMock(...args),
}));

vi.mock("../EmojiPicker", () => ({
	EmojiPicker: ({ children }: any) => (
		<div data-testid="emoji-picker">{children}</div>
	),
}));

vi.mock("../FileUpload", () => ({
	FileUpload: () => <div data-testid="file-upload" />,
}));

vi.mock("../ui/responsive-dropdown-menu", () => ({
	ResponsiveDropdownMenu: ({ children }: any) => <div>{children}</div>,
	ResponsiveDropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
	ResponsiveDropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	ResponsiveDropdownMenuItem: ({ children, onClick }: any) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
	ResponsiveDropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
	ResponsiveDropdownMenuSeparator: () => <div />,
}));

vi.mock("../ui/button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

vi.mock("../ui/input", () => ({
	Input: ({ value, onChange, placeholder, ref }: any) => (
		<input
			ref={ref}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
		/>
	),
}));

// framer-motion shim
vi.mock("framer-motion", () => ({
	motion: {
		div: (props: any) => <div {...props} />,
		span: (props: any) => <span {...props} />,
	},
	cubicBezier: () => [0.4, 0, 0.2, 1],
}));

describe("ChatComposer reply preview", () => {
	it("renders author fallback and media label when replyDraft provided, and cancel works", () => {
		const onCancelReply = vi.fn();

		// Arrange nanostores usage order for ChatComposer
		let call = 0;
		useStoreMock.mockImplementation(() => {
			call += 1;
			if (call === 1) return false; // $canNudge
			if (call === 2) return "Alice"; // $chatDisplayName
			if (call === 3) return null; // $selectedChat
			if (call === 4) return { receiverId: undefined, groupId: undefined }; // $fileUploadContext
			return undefined;
		});

		render(
			<ChatComposer
				value=""
				onChange={() => {}}
				onSubmit={(e: any) => e.preventDefault()}
				onEmojiSelect={() => {}}
				onSendNudge={() => {}}
				isNudgeSending={false}
				cooldownRemaining={0}
				onFileUploaded={() => {}}
				replyDraft={{
					authorEmail: "bob@example.com",
					createdAt: Date.now() - 1000,
					kind: "image",
				}}
				onCancelReply={onCancelReply}
			/>,
		);

		// Shows author (falls back to email)
		expect(screen.getByText("bob@example.com")).toBeInTheDocument();

		// Shows media label when no textSnippet present
		expect(screen.getByText("Image")).toBeInTheDocument();

		// Clicking × triggers cancel
		fireEvent.click(screen.getByRole("button", { name: "×" }));
		expect(onCancelReply).toHaveBeenCalledTimes(1);
	});

	it("renders text snippet when provided", () => {
		// Arrange nanostores usage order for ChatComposer
		let call = 0;
		useStoreMock.mockImplementation(() => {
			call += 1;
			if (call === 1) return false; // $canNudge
			if (call === 2) return "Alice"; // $chatDisplayName
			if (call === 3) return null; // $selectedChat
			if (call === 4) return { receiverId: undefined, groupId: undefined }; // $fileUploadContext
			return undefined;
		});

		render(
			<ChatComposer
				value=""
				onChange={() => {}}
				onSubmit={(e: any) => e.preventDefault()}
				onEmojiSelect={() => {}}
				onSendNudge={() => {}}
				isNudgeSending={false}
				cooldownRemaining={0}
				onFileUploaded={() => {}}
				replyDraft={{
					authorDisplayName: "Alice",
					authorEmail: "alice@example.com",
					createdAt: Date.now() - 1000,
					kind: "text",
					textSnippet: "This is a very long message that will be trimmed in UI",
				}}
				onCancelReply={() => {}}
			/>,
		);

		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(
			screen.getByText(
				"This is a very long message that will be trimmed in UI",
			),
		).toBeInTheDocument();
	});

	it("should focus input when reply draft is set", () => {
		// Arrange nanostores usage order for ChatComposer
		useStoreMock.mockImplementation(() => {
			// Return values in a cycle to handle multiple renders
			const values = [
				false, // $canNudge
				"Alice", // $chatDisplayName
				null, // $selectedChat
				{ receiverId: undefined, groupId: undefined }, // $fileUploadContext
			];
			const index = useStoreMock.mock.calls.length % values.length;
			return values[index];
		});

		const { rerender } = render(
			<ChatComposer
				value=""
				onChange={() => {}}
				onSubmit={() => {}}
				onEmojiSelect={() => {}}
				onSendNudge={() => {}}
				isNudgeSending={false}
				cooldownRemaining={0}
				replyDraft={null}
				onCancelReply={() => {}}
			/>,
		);

		const input = screen.getByRole("textbox");
		expect(input).not.toHaveFocus();

		// Set reply draft - input should be focused
		rerender(
			<ChatComposer
				value=""
				onChange={() => {}}
				onSubmit={() => {}}
				onEmojiSelect={() => {}}
				onSendNudge={() => {}}
				isNudgeSending={false}
				cooldownRemaining={0}
				replyDraft={{
					authorDisplayName: "Alice",
					authorEmail: "alice@example.com",
					createdAt: Date.now() - 1000,
					kind: "text",
					textSnippet: "Hello world",
				}}
				onCancelReply={() => {}}
			/>,
		);

		expect(input).toHaveFocus();
	});
});
