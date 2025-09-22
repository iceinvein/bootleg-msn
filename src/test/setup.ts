import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Convex client
vi.mock("@convex/_generated/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
	useAction: vi.fn(),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
	useTheme: () => ({
		theme: "light",
		setTheme: vi.fn(),
	}),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock HTMLMediaElement.play() method
Object.defineProperty(HTMLMediaElement.prototype, "play", {
	writable: true,
	value: vi.fn().mockImplementation(() => Promise.resolve()),
});

// Mock HTMLMediaElement.pause() method
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
	writable: true,
	value: vi.fn(),
});

// Mock file API
Object.defineProperty(window, "File", {
	value: class MockFile {
		constructor(
			parts: (string | ArrayBuffer | ArrayBufferView | Blob)[],
			filename: string,
			properties?: { type?: string },
		) {
			this.parts = parts;
			this.name = filename;
			this.type = properties?.type || "";
			this.size = parts.reduce((acc, part) => {
				if (typeof part === "string") {
					return acc + part.length;
				}
				if (part instanceof ArrayBuffer) {
					return acc + part.byteLength;
				}
				if (ArrayBuffer.isView(part)) {
					return acc + part.byteLength;
				}
				if (part instanceof Blob) {
					return acc + part.size;
				}
				return acc;
			}, 0);
		}
		parts: (string | ArrayBuffer | ArrayBufferView | Blob)[];
		name: string;
		type: string;
		size: number;
	},
});
