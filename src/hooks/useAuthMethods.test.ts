import { beforeEach } from "node:test";
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useAuthMethods } from "./useAuthMethods";

// Mock Convex hooks
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
}));

// Mock API
vi.mock("@convex/_generated/api", () => ({
	api: {
		auth: {
			getUserAuthMethods: "mocked-function-reference",
		},
	},
}));

describe("useAuthMethods", async () => {
	const mockUseQuery = vi.mocked(await import("convex/react")).useQuery;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns loading state when data is undefined", () => {
		mockUseQuery.mockReturnValue(undefined);

		const { result } = renderHook(() => useAuthMethods());

		expect(result.current).toEqual({
			hasPassword: false,
			hasOAuth: false,
			oauthProviders: [],
			accountLinked: false,
			isLoading: true,
		});
	});

	it("returns auth methods data when available", () => {
		const mockData = {
			hasPassword: true,
			hasOAuth: true,
			oauthProviders: ["google", "github"],
			accountLinked: true,
		};

		mockUseQuery.mockReturnValue(mockData);

		const { result } = renderHook(() => useAuthMethods());

		expect(result.current).toEqual({
			hasPassword: true,
			hasOAuth: true,
			oauthProviders: ["google", "github"],
			accountLinked: true,
			isLoading: false,
		});
	});

	it("returns default values when data is null", () => {
		const mockData = null;
		mockUseQuery.mockReturnValue(mockData);

		const { result } = renderHook(() => useAuthMethods());

		expect(result.current).toEqual({
			hasPassword: false,
			hasOAuth: false,
			oauthProviders: [],
			accountLinked: false,
			isLoading: false,
		});
	});

	it("handles password-only authentication", () => {
		const mockData = {
			hasPassword: true,
			hasOAuth: false,
			oauthProviders: [],
			accountLinked: false,
		};

		mockUseQuery.mockReturnValue(mockData);

		const { result } = renderHook(() => useAuthMethods());

		expect(result.current.hasPassword).toBe(true);
		expect(result.current.hasOAuth).toBe(false);
		expect(result.current.accountLinked).toBe(false);
	});

	it("handles OAuth-only authentication", () => {
		const mockData = {
			hasPassword: false,
			hasOAuth: true,
			oauthProviders: ["google"],
			accountLinked: false,
		};

		mockUseQuery.mockReturnValue(mockData);

		const { result } = renderHook(() => useAuthMethods());

		expect(result.current.hasPassword).toBe(false);
		expect(result.current.hasOAuth).toBe(true);
		expect(result.current.accountLinked).toBe(false);
		expect(result.current.oauthProviders).toEqual(["google"]);
	});
});
