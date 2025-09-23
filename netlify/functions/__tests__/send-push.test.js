/**
 * Tests for Netlify send-push function
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock webpush
const mockSendNotification = vi.fn();
const mockSetVapidDetails = vi.fn();

vi.mock("web-push", () => ({
	default: {
		sendNotification: mockSendNotification,
		setVapidDetails: mockSetVapidDetails,
	},
}));

// Mock JWT verification
const mockJwtVerify = vi.fn();
vi.mock("jose", () => ({
	jwtVerify: mockJwtVerify,
}));

describe("send-push Netlify function", () => {
	let handler;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock environment variables
		process.env.VAPID_PUBLIC_KEY = "test-public-key";
		process.env.VAPID_PRIVATE_KEY = "test-private-key";
		process.env.VAPID_SUBJECT = "mailto:test@example.com";
		process.env.FUNCTION_JWT_SECRET = "test-jwt-secret";
		process.env.CONVEX_SITE_URL = "convex";

		// Default mock implementations
		mockJwtVerify.mockResolvedValue({
			payload: { scope: "send_push", uid: "user123" }
		});
		mockSendNotification.mockResolvedValue(undefined);

		// Import the handler after mocks are set up
		const module = await import("../send-push.js");
		handler = module.handler;
	});

	describe("Authentication", () => {
		it("should require Authorization header", async () => {
			// Mock JWT verification to fail for empty token
			mockJwtVerify.mockRejectedValue(new Error("Missing token"));

			const event = {
				httpMethod: "POST",
				headers: {},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
					payload: { title: "Test", body: "Test message" },
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(401);
			expect(JSON.parse(result.body)).toEqual({ error: "Unauthorized" });
		});

		it("should require Bearer token", async () => {
			// Mock JWT verification to fail for invalid token format
			mockJwtVerify.mockRejectedValue(new Error("Invalid token format"));

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Basic invalid",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(401);
			expect(JSON.parse(result.body)).toEqual({ error: "Unauthorized" });
		});

		it("should validate JWT token", async () => {
			mockJwtVerify.mockRejectedValue(new Error("Invalid token"));

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer invalid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(401);
			expect(JSON.parse(result.body)).toEqual({ error: "Unauthorized" });
		});

		it("should require send_push scope", async () => {
			mockJwtVerify.mockResolvedValue({
				payload: { scope: "invalid_scope", uid: "user123" }
			});

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(401);
			expect(JSON.parse(result.body)).toEqual({ error: "Unauthorized" });
		});
	});

	describe("Request Validation", () => {
		it("should require POST method", async () => {
			const event = {
				httpMethod: "GET",
				headers: {
					authorization: "Bearer valid-token",
				},
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(405);
			expect(result.body).toBe("Method Not Allowed");
		});

		it("should require valid subscription", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						// Missing endpoint and keys
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(400);
			expect(JSON.parse(result.body)).toEqual({ error: "Invalid subscription" });
		});

		it("should require subscription endpoint", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
						// Missing endpoint
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(400);
			expect(JSON.parse(result.body)).toEqual({ error: "Invalid subscription" });
		});

		it("should require subscription keys", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						// Missing keys
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(400);
			expect(JSON.parse(result.body)).toEqual({ error: "Invalid subscription" });
		});

		it("should handle malformed JSON", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: "invalid json",
			};

			const result = await handler(event);

			// The function returns 500 for JSON parsing errors
			expect(result.statusCode).toBe(500);
			expect(JSON.parse(result.body)).toEqual({ error: expect.stringContaining("Unexpected token") });
		});
	});

	describe("Push Notification Sending", () => {
		it("should send push notification successfully", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://fcm.googleapis.com/fcm/send/test123",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
					payload: {
						title: "Test Notification",
						body: "Test message body",
						data: { chatId: "chat123" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(202);
			expect(JSON.parse(result.body)).toEqual({ ok: true });
			expect(mockSendNotification).toHaveBeenCalledWith(
				{
					endpoint: "https://fcm.googleapis.com/fcm/send/test123",
					keys: { p256dh: "test-p256dh", auth: "test-auth" },
				},
				JSON.stringify({
					title: "Test Notification",
					body: "Test message body",
					data: { chatId: "chat123" },
				})
			);
		});

		it("should use default payload if none provided", async () => {
			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://fcm.googleapis.com/fcm/send/test123",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(202);
			expect(mockSendNotification).toHaveBeenCalledWith(
				expect.any(Object),
				JSON.stringify({
					title: "Test notification",
					body: "If you see this on your phone, web push works!",
					data: { url: "/" },
				})
			);
		});

		it("should handle webpush errors", async () => {
			mockSendNotification.mockRejectedValue(new Error("Push service error"));

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://fcm.googleapis.com/fcm/send/test123",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
					payload: { title: "Test", body: "Test message" },
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(500);
			expect(JSON.parse(result.body)).toEqual({ error: "Push service error" });
		});

		it("should handle webpush errors with body", async () => {
			const error = new Error("Push failed");
			error.body = "Detailed error message";
			mockSendNotification.mockRejectedValue(error);

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://fcm.googleapis.com/fcm/send/test123",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handler(event);

			expect(result.statusCode).toBe(500);
			expect(JSON.parse(result.body)).toEqual({ error: "Detailed error message" });
		});
	});

	describe("VAPID Configuration", () => {
		it("should set VAPID details on initialization", async () => {
			// Clear the mock and re-import to test initialization
			vi.clearAllMocks();
			vi.resetModules();

			// Set environment variables before import
			process.env.VAPID_PUBLIC_KEY = "test-public-key";
			process.env.VAPID_PRIVATE_KEY = "test-private-key";
			process.env.VAPID_SUBJECT = "mailto:test@example.com";

			// Import the module to trigger initialization
			await import("../send-push.js");

			// Should have called setVapidDetails during module initialization
			expect(mockSetVapidDetails).toHaveBeenCalledWith(
				"mailto:test@example.com",
				"test-public-key",
				"test-private-key"
			);
		});

		it("should handle missing VAPID configuration", async () => {
			// Clear environment variables
			delete process.env.VAPID_PUBLIC_KEY;
			delete process.env.VAPID_PRIVATE_KEY;
			delete process.env.VAPID_SUBJECT;

			// Re-import to test missing config
			vi.resetModules();
			const module = await import("../send-push.js");
			const handlerWithoutVapid = module.handler;

			const event = {
				httpMethod: "POST",
				headers: {
					authorization: "Bearer valid-token",
				},
				body: JSON.stringify({
					subscription: {
						endpoint: "https://test.endpoint",
						keys: { p256dh: "test-p256dh", auth: "test-auth" },
					},
				}),
			};

			const result = await handlerWithoutVapid(event);

			// Should return 500 error for missing VAPID keys
			expect(result.statusCode).toBe(500);
			expect(JSON.parse(result.body)).toEqual({ error: "Missing VAPID keys on server" });
		});
	});
});
