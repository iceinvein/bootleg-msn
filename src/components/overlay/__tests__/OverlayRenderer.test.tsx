/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OverlayEntry } from "@/types/overlay";
import {
	getSupportedOverlayTypes,
	isOverlayTypeSupported,
	OverlayRenderer,
} from "../OverlayRenderer";

// Mock the overlay hooks
vi.mock("@/hooks/useOverlays", () => ({
	useOverlays: vi.fn(),
}));

// Mock overlay URL hook to avoid needing a Router
vi.mock("@/hooks/useOverlayUrl", () => ({
	useOverlayUrl: () => ({
		updateUrl: vi.fn(),
		openFromUrl: vi.fn(),
		clearUrl: vi.fn(),
		hasUrlOverlay: () => true,
		searchParams: new URLSearchParams(),
	}),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, onClick, onKeyDown, ...props }: any) => (
			<div onClick={onClick} onKeyDown={onKeyDown} {...props}>
				{children}
			</div>
		),
	},
	cubicBezier: () => (t: number) => t,
}));

// Mock all overlay components
vi.mock("../overlays/ConfirmOverlay", () => ({
	ConfirmOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="confirm-overlay" onClick={onClose}>
			Confirm Overlay
		</div>
	),
}));

vi.mock("../overlays/InfoOverlay", () => ({
	InfoOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="info-overlay" onClick={onClose}>
			Info Overlay
		</div>
	),
}));

vi.mock("../overlays/SettingsOverlay", () => ({
	SettingsOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="settings-overlay" onClick={onClose}>
			Settings Overlay
		</div>
	),
}));

// Mock other overlay components
vi.mock("../overlays/CreateGroupOverlay", () => ({
	CreateGroupOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="create-group-overlay" onClick={onClose}>
			CreateGroupOverlay
		</div>
	),
}));

vi.mock("../overlays/EditUserOverlay", () => ({
	EditUserOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="edit-user-overlay" onClick={onClose}>
			EditUserOverlay
		</div>
	),
}));

vi.mock("../overlays/SheetOverlay", () => ({
	SheetOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="sheet-overlay" onClick={onClose}>
			SheetOverlay
		</div>
	),
}));

vi.mock("../overlays/InviteUsersOverlay", () => ({
	InviteUsersOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="invite-users-overlay" onClick={onClose}>
			InviteUsersOverlay
		</div>
	),
}));

vi.mock("../overlays/FilePreviewOverlay", () => ({
	FilePreviewOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="file-preview-overlay" onClick={onClose}>
			FilePreviewOverlay
		</div>
	),
}));

vi.mock("../overlays/EmojiPickerOverlay", () => ({
	EmojiPickerOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="emoji-picker-overlay" onClick={onClose}>
			EmojiPickerOverlay
		</div>
	),
}));

vi.mock("../overlays/ThemeSelectorOverlay", () => ({
	ThemeSelectorOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="theme-selector-overlay" onClick={onClose}>
			ThemeSelectorOverlay
		</div>
	),
}));

vi.mock("../overlays/AddContactOverlay", () => ({
	AddContactOverlay: ({ onClose, ...props }: any) => (
		<div data-testid="add-contact-overlay" onClick={onClose}>
			AddContactOverlay
		</div>
	),
}));

const mockClose = vi.fn();
const mockUseOverlays = vi.fn();

// Import hooks after mocking
const { useOverlays } = await import("@/hooks/useOverlays");
vi.mocked(useOverlays).mockImplementation(mockUseOverlays);

describe("OverlayRenderer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseOverlays.mockReturnValue({
			close: mockClose,
			open: vi.fn(),
			closeAll: vi.fn(),
			closeTop: vi.fn(),
			replaceTop: vi.fn(),
			hasOpen: false,
			count: 0,
			topOverlay: null,
			state: { stack: [], config: {} },
		});
	});

	it("renders CONFIRM overlay correctly", () => {
		const entry: OverlayEntry = {
			id: "test-confirm",
			type: "CONFIRM",
			props: { message: "Are you sure?" },
			createdAt: Date.now(),
		};

		render(<OverlayRenderer entry={entry} zIndex={1000} isTopmost={true} />);

		expect(screen.getByTestId("confirm-overlay")).toBeInTheDocument();
		expect(screen.getByText("Confirm Overlay")).toBeInTheDocument();
	});

	it("renders INFO overlay correctly", () => {
		const entry: OverlayEntry = {
			id: "test-info",
			type: "INFO",
			props: { content: "Information message" },
			createdAt: Date.now(),
		};

		render(<OverlayRenderer entry={entry} zIndex={1001} isTopmost={false} />);

		expect(screen.getByTestId("info-overlay")).toBeInTheDocument();
		expect(screen.getByText("Info Overlay")).toBeInTheDocument();
	});

	it("applies correct z-index and data attributes", () => {
		const entry: OverlayEntry = {
			id: "test-overlay",
			type: "CONFIRM",
			props: {},
			createdAt: Date.now(),
		};

		render(<OverlayRenderer entry={entry} zIndex={1500} isTopmost={true} />);

		const container = document.querySelector(
			'[data-overlay-id="test-overlay"]',
		);
		expect(container).toBeInTheDocument();
		expect(container).toHaveAttribute("data-overlay-type", "CONFIRM");
		expect(container).toHaveAttribute("data-overlay-topmost", "true");
		expect(container).toHaveStyle({ zIndex: "1500" });
	});

	it("ignores backdrop click for non-closable overlay", async () => {
		const entry: OverlayEntry = {
			id: "non-closable-overlay",
			type: "CONFIRM",
			props: {
				closable: false,
			},
			createdAt: Date.now(),
		};

		render(<OverlayRenderer entry={entry} zIndex={1000} isTopmost={true} />);

		const container = document.querySelector(
			'[data-overlay-id="non-closable-overlay"]',
		);
		expect(container).toBeInTheDocument();

		// Click the backdrop
		fireEvent.click(container!);

		expect(mockClose).not.toHaveBeenCalled();
	});

	it("ignores escape key for non-topmost overlay", async () => {
		const entry: OverlayEntry = {
			id: "non-topmost-overlay",
			type: "CONFIRM",
			props: {
				closable: true,
			},
			createdAt: Date.now(),
		};

		render(<OverlayRenderer entry={entry} zIndex={1000} isTopmost={false} />);

		const container = document.querySelector(
			'[data-overlay-id="non-topmost-overlay"]',
		);
		expect(container).toBeInTheDocument();

		// Press escape key
		fireEvent.keyDown(container!, { key: "Escape" });

		expect(mockClose).not.toHaveBeenCalled();
	});

	it("passes correct props to overlay component", () => {
		const entry: OverlayEntry = {
			id: "props-test",
			type: "CONFIRM",
			props: {
				message: "Test message",
				confirmText: "Yes",
				cancelText: "No",
			},
			createdAt: 1234567890,
		};

		render(<OverlayRenderer entry={entry} zIndex={1000} isTopmost={true} />);

		// The mock component should receive all the props
		expect(screen.getByTestId("confirm-overlay")).toBeInTheDocument();
	});

	it("returns null for unknown overlay type", () => {
		const entry = {
			id: "unknown-overlay",
			type: "UNKNOWN_TYPE" as any,
			props: {},
			createdAt: Date.now(),
		};

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const { container } = render(
			<OverlayRenderer entry={entry} zIndex={1000} isTopmost={true} />,
		);

		expect(container).toBeEmptyDOMElement();
		expect(consoleSpy).toHaveBeenCalledWith(
			"[OverlayRenderer] Unknown overlay type: UNKNOWN_TYPE",
		);

		consoleSpy.mockRestore();
	});

	describe("Close behavior", () => {
		it("calls close when overlay component triggers onClose", async () => {
			const entry: OverlayEntry = {
				id: "test-overlay",
				type: "ADD_CONTACT",
				props: {},
				createdAt: Date.now(),
				persistInUrl: true,
			};

			render(<OverlayRenderer entry={entry} zIndex={1000} isTopmost={true} />);

			const overlayComponent = screen.getByTestId("add-contact-overlay");

			// Simulate clicking the overlay component (which triggers onClose)
			fireEvent.click(overlayComponent);

			// Should call close (URL clearing is handled by bidirectional sync)
			expect(mockClose).toHaveBeenCalledWith("test-overlay");
		});
	});
});

describe("OverlayRenderer utilities", () => {
	it("isOverlayTypeSupported returns correct values", () => {
		expect(isOverlayTypeSupported("CONFIRM")).toBe(true);
		expect(isOverlayTypeSupported("INFO")).toBe(true);
		expect(isOverlayTypeSupported("UNKNOWN_TYPE")).toBe(false);
	});

	it("getSupportedOverlayTypes returns all supported types", () => {
		const supportedTypes = getSupportedOverlayTypes();

		expect(supportedTypes).toContain("CONFIRM");
		expect(supportedTypes).toContain("INFO");
		expect(supportedTypes).toContain("SETTINGS");
		expect(supportedTypes).toContain("CREATE_GROUP");
		expect(supportedTypes).toContain("ADD_CONTACT");
		expect(supportedTypes).toContain("EDIT_USER");
		expect(supportedTypes).toContain("SHEET");
		expect(supportedTypes).toContain("INVITE_USERS");
		expect(supportedTypes).toContain("FILE_PREVIEW");
		expect(supportedTypes).toContain("EMOJI_PICKER");
		expect(supportedTypes).toContain("THEME_SELECTOR");
		// newly added overlay types
		expect(supportedTypes).toContain("GROUP_INFO");
		expect(supportedTypes).toContain("ADD_MEMBERS");
		expect(supportedTypes).toContain("CONTACT_REQUESTS");
		expect(supportedTypes).toContain("AVATAR_EDITOR");

		expect(supportedTypes).toHaveLength(16);
	});
});
