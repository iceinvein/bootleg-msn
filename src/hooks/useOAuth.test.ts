/**
 * Unit tests for useOAuth hook
 *
 * Tests cover:
 * - OAuth provider integration (Google, GitHub, Apple)
 * - Platform detection (web vs desktop)
 * - Error handling and user feedback
 * - Authentication state management
 * - Deep link handling for desktop apps
 */

import { vi } from "vitest";

// Create mock functions using vi.hoisted to avoid hoisting issues
const mockSignIn = vi.hoisted(() => vi.fn());
const mockUseAuthActions = vi.hoisted(() => vi.fn());
const mockUseConvexAuth = vi.hoisted(() => vi.fn());
const mockIsDesktop = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockGetAuthErrorMessage = vi.hoisted(() => vi.fn());
const mockLogAuthError = vi.hoisted(() => vi.fn());
const mockTauriOpen = vi.hoisted(() => vi.fn());
const mockConvexQuery = vi.hoisted(() => vi.fn());

// Import test utilities after mock declarations
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useOAuth } from "./useOAuth";

// Mock dependencies
vi.mock("@convex-dev/auth/react", () => ({
	useAuthActions: mockUseAuthActions,
}));

vi.mock("convex/react", () => ({
	useConvexAuth: mockUseConvexAuth,
}));

vi.mock("sonner", () => ({
	toast: {
		success: mockToastSuccess,
		error: mockToastError,
	},
}));

vi.mock("../utils/authErrorHandler", () => ({
	getAuthErrorMessage: mockGetAuthErrorMessage,
	logAuthError: mockLogAuthError,
}));

vi.mock("../utils/platform", () => ({
	Platform: {
		isDesktop: mockIsDesktop,
	},
}));

vi.mock("@convex/_generated/api", () => ({
	api: {
		auth: {
			getAuthUrl: "mocked-function-reference",
		},
	},
}));

// Mock Tauri shell plugin
vi.mock("@tauri-apps/plugin-shell", () => ({
	open: mockTauriOpen,
}));

// Mock Convex browser client
vi.mock("convex/browser", () => ({
	ConvexHttpClient: vi.fn().mockImplementation(() => ({
		query: mockConvexQuery,
	})),
}));

describe("useOAuth", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mocks to default values
		mockUseAuthActions.mockReturnValue({ signIn: mockSignIn });
		mockUseConvexAuth.mockReturnValue({ isAuthenticated: false });
		mockIsDesktop.mockReturnValue(false);
		mockSignIn.mockResolvedValue(undefined);
		mockTauriOpen.mockResolvedValue(undefined);
		mockConvexQuery.mockResolvedValue("https://mock-oauth-url.com");
		mockGetAuthErrorMessage.mockImplementation(
			(error: any) => error.message || "OAuth error",
		);
	});

	describe("initialization", () => {
		it("should return OAuth functions and authentication state", () => {
			const { result } = renderHook(() => useOAuth());

			expect(result.current).toHaveProperty("loginWithGitHub");
			expect(result.current).toHaveProperty("loginWithGoogle");
			expect(result.current).toHaveProperty("loginWithApple");
			expect(result.current).toHaveProperty("isAuthenticated");
			expect(typeof result.current.loginWithGitHub).toBe("function");
			expect(typeof result.current.loginWithGoogle).toBe("function");
			expect(typeof result.current.loginWithApple).toBe("function");
		});

		it("should reflect authentication state", () => {
			mockUseConvexAuth.mockReturnValue({
				isAuthenticated: true,
			});

			const { result } = renderHook(() => useOAuth());

			expect(result.current.isAuthenticated).toBe(true);
		});
	});

	describe("web platform OAuth", () => {
		beforeEach(() => {
			mockIsDesktop.mockReturnValue(false);
		});

		it("should handle Google OAuth on web", async () => {
			mockSignIn.mockResolvedValue(undefined);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithGoogle();
			});

			expect(mockSignIn).toHaveBeenCalledWith("google");
		});

		it("should handle GitHub OAuth on web", async () => {
			mockSignIn.mockResolvedValue(undefined);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithGitHub();
			});

			expect(mockSignIn).toHaveBeenCalledWith("github");
		});

		it("should handle Apple OAuth on web", async () => {
			mockSignIn.mockResolvedValue(undefined);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithApple();
			});

			expect(mockSignIn).toHaveBeenCalledWith("apple");
		});

		it("should handle OAuth errors on web", async () => {
			const error = new Error("OAuth failed");
			mockSignIn.mockRejectedValue(error);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				try {
					await result.current.loginWithGoogle();
				} catch (_e) {
					// Expected to throw
				}
			});

			expect(mockToastError).toHaveBeenCalledWith("OAuth failed");
		});
	});

	describe("desktop platform OAuth (Tauri)", () => {
		beforeEach(() => {
			mockIsDesktop.mockReturnValue(true);
		});

		it("should handle Google OAuth on desktop", async () => {
			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithGoogle();
			});

			expect(mockTauriOpen).toHaveBeenCalledWith("https://mock-oauth-url.com");
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Opening google in your browser...",
				expect.objectContaining({
					description: "Complete the sign-in process in your browser.",
				}),
			);
		});

		it("should handle GitHub OAuth on desktop", async () => {
			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithGitHub();
			});

			expect(mockTauriOpen).toHaveBeenCalledWith("https://mock-oauth-url.com");
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Opening github in your browser...",
				expect.objectContaining({
					description: "Complete the sign-in process in your browser.",
				}),
			);
		});

		it("should handle Apple OAuth on desktop", async () => {
			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithApple();
			});

			expect(mockTauriOpen).toHaveBeenCalledWith("https://mock-oauth-url.com");
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Opening apple in your browser...",
				expect.objectContaining({
					description: "Complete the sign-in process in your browser.",
				}),
			);
		});

		it("should handle desktop OAuth errors gracefully", async () => {
			const error = new Error("Failed to open URL");
			mockTauriOpen.mockRejectedValue(error);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				await result.current.loginWithGoogle();
			});

			// The Tauri open error is caught and logged, but doesn't prevent the success toast
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Opening google in your browser...",
				expect.objectContaining({
					description: "Complete the sign-in process in your browser.",
				}),
			);
		});
	});

	describe("error handling", () => {
		it("should log authentication errors", async () => {
			const error = new Error("Network error");
			mockSignIn.mockRejectedValue(error);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				try {
					await result.current.loginWithGoogle();
				} catch (_e) {
					// Expected to throw
				}
			});

			expect(mockLogAuthError).toHaveBeenCalledWith(error, "OAuth-google");
		});

		it("should use centralized error message handling", async () => {
			const error = new Error("Custom error");

			mockGetAuthErrorMessage.mockReturnValue("User-friendly error message");
			mockSignIn.mockRejectedValue(error);

			const { result } = renderHook(() => useOAuth());

			await act(async () => {
				try {
					await result.current.loginWithGoogle();
				} catch (_e) {
					// Expected to throw
				}
			});

			expect(mockGetAuthErrorMessage).toHaveBeenCalledWith(error);
			expect(mockToastError).toHaveBeenCalledWith(
				"User-friendly error message",
			);
		});

		it("should re-throw errors after handling", async () => {
			const error = new Error("Test error");
			mockSignIn.mockRejectedValue(error);

			const { result } = renderHook(() => useOAuth());

			await expect(
				act(async () => {
					await result.current.loginWithGoogle();
				}),
			).rejects.toThrow("Test error");
		});
	});

	describe("authentication state updates", () => {
		it("should update when authentication state changes", () => {
			const { rerender } = renderHook(() => useOAuth());

			// Initially not authenticated
			expect(renderHook(() => useOAuth()).result.current.isAuthenticated).toBe(
				false,
			);

			// Update mock to return authenticated state
			mockUseConvexAuth.mockReturnValue({
				isAuthenticated: true,
			});

			rerender();

			expect(renderHook(() => useOAuth()).result.current.isAuthenticated).toBe(
				true,
			);
		});
	});

	describe("provider-specific behavior", () => {
		it("should handle different providers with same interface", async () => {
			mockIsDesktop.mockReturnValue(false);
			mockSignIn.mockResolvedValue(undefined);

			const { result } = renderHook(() => useOAuth());

			// Test all providers use the same interface
			await act(async () => {
				await result.current.loginWithGoogle();
			});
			expect(mockSignIn).toHaveBeenCalledWith("google");

			await act(async () => {
				await result.current.loginWithGitHub();
			});
			expect(mockSignIn).toHaveBeenCalledWith("github");

			await act(async () => {
				await result.current.loginWithApple();
			});
			expect(mockSignIn).toHaveBeenCalledWith("apple");
		});
	});
});
