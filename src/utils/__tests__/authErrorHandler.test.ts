/**
 * Tests for the authentication error handler utility
 */

import { ConvexError } from "convex/values";
import { 
  parseAuthError, 
  getAuthErrorMessage, 
  isAuthErrorType,
  type AuthErrorType 
} from "../authErrorHandler";

describe("authErrorHandler", () => {
  describe("parseAuthError", () => {
    it("should handle regular Error instances", () => {
      const error = new Error("Invalid password");
      const result = parseAuthError(error);

      expect(result.type).toBe("authentication");
      expect(result.message).toBe("The password you entered is incorrect. Please try again.");
      expect(result.code).toBe("INVALID_PASSWORD");
      expect(result.originalError).toBe(error);
    });

    it("should handle Convex Auth InvalidSecret error", () => {
      const error = new Error("InvalidSecret");
      const result = parseAuthError(error);

      expect(result.type).toBe("authentication");
      expect(result.message).toBe("The password you entered is incorrect. Please try again.");
      expect(result.code).toBe("INVALID_PASSWORD");
      expect(result.originalError).toBe(error);
    });

    it("should handle ConvexError instances", () => {
      const error = new ConvexError("Email is already verified");
      const result = parseAuthError(error);
      
      expect(result.type).toBe("verification");
      expect(result.message).toBe("This email address is already verified. You can sign in directly.");
      expect(result.code).toBe("ALREADY_VERIFIED");
    });

    it("should handle string errors", () => {
      const error = "User not found";
      const result = parseAuthError(error);
      
      expect(result.type).toBe("authentication");
      expect(result.message).toBe("No account found with this email address. Please check your email or sign up for a new account.");
      expect(result.code).toBe("USER_NOT_FOUND");
    });

    it("should handle network errors", () => {
      const error = new Error("Network request failed");
      const result = parseAuthError(error);
      
      expect(result.type).toBe("network");
      expect(result.message).toBe("Connection problem. Please check your internet connection and try again.");
      expect(result.code).toBe("NETWORK_ERROR");
    });

    it("should handle rate limiting errors", () => {
      const error = new Error("Too many requests, please try again later");
      const result = parseAuthError(error);
      
      expect(result.type).toBe("rate_limit");
      expect(result.message).toBe("Too many attempts. Please wait a few minutes before trying again.");
      expect(result.code).toBe("RATE_LIMITED");
    });

    it("should handle OAuth provider errors", () => {
      const error = new Error("GitHub OAuth failed");
      const result = parseAuthError(error);

      expect(result.type).toBe("provider");
      expect(result.message).toBe("There was a problem signing in with GitHub. Please try again or use email/password.");
      expect(result.code).toBe("GITHUB_ERROR");
    });

    it("should handle validation errors", () => {
      const error = new Error("Invalid email format");
      const result = parseAuthError(error);
      
      expect(result.type).toBe("validation");
      expect(result.message).toBe("Please enter a valid email address.");
      expect(result.code).toBe("INVALID_EMAIL");
    });

    it("should handle unknown errors", () => {
      const error = new Error("Some unexpected error");
      const result = parseAuthError(error);
      
      expect(result.type).toBe("unknown");
      expect(result.message).toBe("Something went wrong. Please try again or contact support if the problem persists.");
      expect(result.code).toBe("UNKNOWN_ERROR");
    });

    it("should handle null/undefined errors", () => {
      const result = parseAuthError(null);
      
      expect(result.type).toBe("unknown");
      expect(result.message).toBe("An unexpected error occurred. Please try again.");
      expect(result.originalError).toBe(null);
    });
  });

  describe("getAuthErrorMessage", () => {
    it("should return user-friendly message for known errors", () => {
      const error = new Error("Invalid password");
      const message = getAuthErrorMessage(error);
      
      expect(message).toBe("The password you entered is incorrect. Please try again.");
    });

    it("should return fallback message for unknown errors", () => {
      const error = new Error("Some random error");
      const message = getAuthErrorMessage(error);
      
      expect(message).toBe("Something went wrong. Please try again or contact support if the problem persists.");
    });
  });

  describe("isAuthErrorType", () => {
    it("should correctly identify error types", () => {
      const authError = new Error("Invalid password");
      const networkError = new Error("Network timeout");
      const validationError = new Error("Invalid email");
      
      expect(isAuthErrorType(authError, "authentication")).toBe(true);
      expect(isAuthErrorType(authError, "network")).toBe(false);
      
      expect(isAuthErrorType(networkError, "network")).toBe(true);
      expect(isAuthErrorType(networkError, "authentication")).toBe(false);
      
      expect(isAuthErrorType(validationError, "validation")).toBe(true);
      expect(isAuthErrorType(validationError, "authentication")).toBe(false);
    });
  });
});
