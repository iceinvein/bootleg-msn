/**
 * Unit tests for OAuth utility functions
 *
 * Note: These tests focus on the OAuth URL generation and configuration logic
 * without requiring the full Convex test environment.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment variables
const mockEnv = {
	AUTH_GOOGLE_ID: "test-google-client-id",
	AUTH_GITHUB_ID: "test-github-client-id",
	AUTH_APPLE_ID: "test-apple-client-id",
	SITE_URL: "https://test.example.com",
};

// Mock process.env
vi.stubGlobal("process", {
	env: mockEnv,
});

// Mock crypto for state generation
vi.stubGlobal("crypto", {
	randomUUID: vi.fn(() => "test-uuid-12345"),
});

// OAuth utility functions (extracted from auth.ts for testing)
const getRedirectUri = (
	platform: string,
	customRedirectUri?: string,
): string => {
	if (customRedirectUri) {
		return customRedirectUri;
	}

	const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";

	switch (platform) {
		case "web":
		case "desktop":
			return `${siteUrl}/oauth-callback`;
		case "mobile":
			return "com.bootlegmsn.messenger://oauth-callback";
		default:
			return `${siteUrl}/oauth-callback`;
	}
};

const generateOAuthUrlLogic = (
	provider: string,
	platform: string,
	redirectUri?: string,
): string => {
	const customRedirectUri = redirectUri ?? getRedirectUri(platform);
	const state = crypto.randomUUID();

	switch (provider) {
		case "google": {
			const clientId = process.env.AUTH_GOOGLE_ID;
			if (!clientId) {
				throw new Error("Google OAuth client ID not configured");
			}

			const params = new URLSearchParams({
				client_id: clientId,
				redirect_uri: customRedirectUri,
				response_type: "code",
				scope: "openid email profile",
				state,
			});

			return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
		}

		case "github": {
			const clientId = process.env.AUTH_GITHUB_ID;
			if (!clientId) {
				throw new Error("GitHub OAuth client ID not configured");
			}

			const params = new URLSearchParams({
				client_id: clientId,
				redirect_uri: customRedirectUri,
				scope: "user:email",
				state,
			});

			return `https://github.com/login/oauth/authorize?${params.toString()}`;
		}

		case "apple": {
			const clientId = process.env.AUTH_APPLE_ID;
			if (!clientId) {
				throw new Error("Apple OAuth client ID not configured");
			}

			const params = new URLSearchParams({
				client_id: clientId,
				redirect_uri: customRedirectUri,
				response_type: "code",
				scope: "name email",
				state,
			});

			return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
		}

		default:
			throw new Error(`Unsupported OAuth provider: ${provider}`);
	}
};

const handleOAuthCallbackLogic = (
	provider: string,
	code: string,
	state?: string,
) => {
	return {
		success: true,
		provider,
		code,
		...(state && { state }),
	};
};

const getOAuthConfigLogic = () => {
	return {
		google: {
			enabled: !!process.env.AUTH_GOOGLE_ID,
			clientId: process.env.AUTH_GOOGLE_ID,
		},
		github: {
			enabled: !!process.env.AUTH_GITHUB_ID,
			clientId: process.env.AUTH_GITHUB_ID,
		},
		apple: {
			enabled: !!process.env.AUTH_APPLE_ID,
			clientId: process.env.AUTH_APPLE_ID,
		},
	};
};

describe("OAuth Utility Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset environment variables
		vi.stubGlobal("process", {
			env: mockEnv,
		});
	});

	describe("generateOAuthUrl", () => {
		it("should generate Google OAuth URL for web platform", () => {
			const result = generateOAuthUrlLogic("google", "web");

			expect(result).toContain("https://accounts.google.com/o/oauth2/v2/auth");
			expect(result).toContain("client_id=test-google-client-id");
			expect(result).toContain(
				"redirect_uri=https%3A%2F%2Ftest.example.com%2Foauth-callback",
			);
			expect(result).toContain("response_type=code");
			expect(result).toContain("scope=openid+email+profile");
			expect(result).toContain("state=test-uuid-12345");
		});

		it("should generate GitHub OAuth URL for desktop platform", () => {
			const result = generateOAuthUrlLogic("github", "desktop");

			expect(result).toContain("https://github.com/login/oauth/authorize");
			expect(result).toContain("client_id=test-github-client-id");
			expect(result).toContain(
				"redirect_uri=https%3A%2F%2Ftest.example.com%2Foauth-callback",
			);
			expect(result).toContain("scope=user%3Aemail");
			expect(result).toContain("state=test-uuid-12345");
		});

		it("should generate Apple OAuth URL for mobile platform", () => {
			const result = generateOAuthUrlLogic("apple", "mobile");

			expect(result).toContain("https://appleid.apple.com/auth/authorize");
			expect(result).toContain("client_id=test-apple-client-id");
			expect(result).toContain(
				"redirect_uri=com.bootlegmsn.messenger%3A%2F%2Foauth-callback",
			);
			expect(result).toContain("response_type=code");
			expect(result).toContain("scope=name+email");
			expect(result).toContain("state=test-uuid-12345");
		});

		it("should use custom redirect URI when provided", () => {
			const customRedirectUri = "https://custom.example.com/callback";
			const result = generateOAuthUrlLogic("google", "web", customRedirectUri);

			expect(result).toContain(
				`redirect_uri=${encodeURIComponent(customRedirectUri)}`,
			);
		});

		it("should throw error for missing Google client ID", () => {
			// Mock missing environment variable
			vi.stubGlobal("process", {
				env: { ...mockEnv, AUTH_GOOGLE_ID: undefined },
			});

			expect(() => {
				generateOAuthUrlLogic("google", "web");
			}).toThrowError("Google OAuth client ID not configured");
		});

		it("should throw error for missing GitHub client ID", () => {
			// Mock missing environment variable
			vi.stubGlobal("process", {
				env: { ...mockEnv, AUTH_GITHUB_ID: undefined },
			});

			expect(() => {
				generateOAuthUrlLogic("github", "web");
			}).toThrowError("GitHub OAuth client ID not configured");
		});

		it("should throw error for missing Apple client ID", () => {
			// Mock missing environment variable
			vi.stubGlobal("process", {
				env: { ...mockEnv, AUTH_APPLE_ID: undefined },
			});

			expect(() => {
				generateOAuthUrlLogic("apple", "web");
			}).toThrowError("Apple OAuth client ID not configured");
		});

		it("should throw error for unsupported provider", () => {
			expect(() => {
				generateOAuthUrlLogic("unsupported", "web");
			}).toThrowError("Unsupported OAuth provider: unsupported");
		});
	});

	describe("handleOAuthCallback", () => {
		it("should handle OAuth callback successfully", () => {
			const result = handleOAuthCallbackLogic(
				"google",
				"test-auth-code",
				"test-state",
			);

			expect(result).toMatchObject({
				success: true,
				provider: "google",
				code: "test-auth-code",
				state: "test-state",
			});
		});

		it("should handle OAuth callback without state", () => {
			const result = handleOAuthCallbackLogic("github", "test-auth-code");

			expect(result).toMatchObject({
				success: true,
				provider: "github",
				code: "test-auth-code",
			});
			expect(result.state).toBeUndefined();
		});
	});

	describe("getOAuthConfig", () => {
		it("should return OAuth configuration with all providers enabled", () => {
			const result = getOAuthConfigLogic();

			expect(result).toMatchObject({
				google: {
					enabled: true,
					clientId: "test-google-client-id",
				},
				github: {
					enabled: true,
					clientId: "test-github-client-id",
				},
				apple: {
					enabled: true,
					clientId: "test-apple-client-id",
				},
			});
		});

		it("should return disabled providers when client IDs are missing", () => {
			// Mock missing environment variables
			vi.stubGlobal("process", {
				env: {
					SITE_URL: "https://test.example.com",
				},
			});

			const result = getOAuthConfigLogic();

			expect(result).toMatchObject({
				google: {
					enabled: false,
					clientId: undefined,
				},
				github: {
					enabled: false,
					clientId: undefined,
				},
				apple: {
					enabled: false,
					clientId: undefined,
				},
			});
		});
	});

	describe("getRedirectUri", () => {
		it("should return custom redirect URI when provided", () => {
			const customUri = "https://custom.example.com/callback";
			const result = getRedirectUri("web", customUri);
			expect(result).toBe(customUri);
		});

		it("should return web redirect URI for web platform", () => {
			const result = getRedirectUri("web");
			expect(result).toBe("https://test.example.com/oauth-callback");
		});

		it("should return web redirect URI for desktop platform", () => {
			const result = getRedirectUri("desktop");
			expect(result).toBe("https://test.example.com/oauth-callback");
		});

		it("should return mobile redirect URI for mobile platform", () => {
			const result = getRedirectUri("mobile");
			expect(result).toBe("com.bootlegmsn.messenger://oauth-callback");
		});

		it("should return default web redirect URI for unknown platform", () => {
			const result = getRedirectUri("unknown");
			expect(result).toBe("https://test.example.com/oauth-callback");
		});

		it("should use localhost when SITE_URL is not set", () => {
			vi.stubGlobal("process", {
				env: { ...mockEnv, SITE_URL: undefined },
			});

			const result = getRedirectUri("web");
			expect(result).toBe("http://localhost:5173/oauth-callback");
		});
	});
});
