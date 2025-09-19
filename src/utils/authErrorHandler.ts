/**
 * Centralized authentication error handling utility
 * Provides user-friendly error messages for Convex Auth errors
 */

import { ConvexError } from "convex/values";

export type AuthErrorType =
	| "validation"
	| "authentication"
	| "authorization"
	| "network"
	| "rate_limit"
	| "verification"
	| "provider"
	| "unknown";

export interface ParsedAuthError {
	type: AuthErrorType;
	message: string;
	originalError: unknown;
	code?: string;
}

/**
 * Common authentication error patterns and their user-friendly messages
 */
const ERROR_PATTERNS: Record<
	string,
	{ type: AuthErrorType; message: string; code?: string }
> = {
	// Authentication errors
	"invalid password": {
		type: "authentication",
		message: "The password you entered is incorrect. Please try again.",
		code: "INVALID_PASSWORD",
	},
	"wrong password": {
		type: "authentication",
		message: "The password you entered is incorrect. Please try again.",
		code: "INVALID_PASSWORD",
	},
	invalidsecret: {
		type: "authentication",
		message: "The password you entered is incorrect. Please try again.",
		code: "INVALID_PASSWORD",
	},
	"user not found": {
		type: "authentication",
		message:
			"No account found with this email address. Please check your email or sign up for a new account.",
		code: "USER_NOT_FOUND",
	},
	"invalid credentials": {
		type: "authentication",
		message:
			"The email or password you entered is incorrect. Please try again.",
		code: "INVALID_CREDENTIALS",
	},
	"account not found": {
		type: "authentication",
		message:
			"No account found with this email address. Please check your email or sign up for a new account.",
		code: "ACCOUNT_NOT_FOUND",
	},
	invalidaccount: {
		type: "authentication",
		message:
			"No account found with this email address. Please check your email or sign up for a new account.",
		code: "ACCOUNT_NOT_FOUND",
	},
	invalidcredentials: {
		type: "authentication",
		message:
			"The email or password you entered is incorrect. Please try again.",
		code: "INVALID_CREDENTIALS",
	},
	"client is not authenticated": {
		type: "authorization",
		message: "You need to sign in to access this feature.",
		code: "NOT_AUTHENTICATED",
	},
	"no account found": {
		type: "authentication",
		message:
			"No account found with this email address. Please check your email or sign up for a new account.",
		code: "ACCOUNT_NOT_FOUND",
	},

	// Verification errors
	"email not verified": {
		type: "verification",
		message:
			"Please verify your email address before signing in. Check your inbox for a verification link.",
		code: "EMAIL_NOT_VERIFIED",
	},
	"verification token": {
		type: "verification",
		message:
			"The verification link is invalid or has expired. Please request a new verification email.",
		code: "INVALID_VERIFICATION_TOKEN",
	},
	"already verified": {
		type: "verification",
		message:
			"This email address is already verified. You can sign in directly.",
		code: "ALREADY_VERIFIED",
	},

	// Validation errors
	"invalid email": {
		type: "validation",
		message: "Please enter a valid email address.",
		code: "INVALID_EMAIL",
	},
	"email is required": {
		type: "validation",
		message: "Email address is required.",
		code: "EMAIL_REQUIRED",
	},
	"password is required": {
		type: "validation",
		message: "Password is required.",
		code: "PASSWORD_REQUIRED",
	},
	"password too short": {
		type: "validation",
		message: "Password must be at least 8 characters long.",
		code: "PASSWORD_TOO_SHORT",
	},
	"password requirements": {
		type: "validation",
		message:
			"Password must contain at least 8 characters with uppercase, lowercase, and numbers.",
		code: "INVALID_PASSWORD_FORMAT",
	},

	// Authorization errors
	"not authenticated": {
		type: "authorization",
		message: "You need to sign in to access this feature.",
		code: "NOT_AUTHENTICATED",
	},
	"session expired": {
		type: "authorization",
		message: "Your session has expired. Please sign in again.",
		code: "SESSION_EXPIRED",
	},
	unauthorized: {
		type: "authorization",
		message: "You need to sign in to access this feature.",
		code: "NOT_AUTHENTICATED",
	},
	"access denied": {
		type: "authorization",
		message: "You don't have permission to access this feature.",
		code: "ACCESS_DENIED",
	},

	// Rate limiting
	"too many requests": {
		type: "rate_limit",
		message:
			"Too many attempts. Please wait a few minutes before trying again.",
		code: "RATE_LIMITED",
	},
	"rate limit": {
		type: "rate_limit",
		message:
			"Too many attempts. Please wait a few minutes before trying again.",
		code: "RATE_LIMITED",
	},

	// Provider errors (OAuth) - More specific patterns first
	github: {
		type: "provider",
		message:
			"There was a problem signing in with GitHub. Please try again or use email/password.",
		code: "GITHUB_ERROR",
	},
	google: {
		type: "provider",
		message:
			"There was a problem signing in with Google. Please try again or use email/password.",
		code: "GOOGLE_ERROR",
	},
	oauth: {
		type: "provider",
		message:
			"There was a problem signing in with this provider. Please try again or use a different sign-in method.",
		code: "OAUTH_ERROR",
	},
	"provider error": {
		type: "provider",
		message:
			"There was a problem with the sign-in provider. Please try again or use a different method.",
		code: "PROVIDER_ERROR",
	},

	// Network errors
	network: {
		type: "network",
		message:
			"Connection problem. Please check your internet connection and try again.",
		code: "NETWORK_ERROR",
	},
	fetch: {
		type: "network",
		message:
			"Connection problem. Please check your internet connection and try again.",
		code: "NETWORK_ERROR",
	},
	timeout: {
		type: "network",
		message: "The request timed out. Please try again.",
		code: "TIMEOUT_ERROR",
	},
};

/**
 * Parse an authentication error and return user-friendly information
 */
export function parseAuthError(error: unknown): ParsedAuthError {
	// Handle null/undefined errors
	if (!error) {
		return {
			type: "unknown",
			message: "An unexpected error occurred. Please try again.",
			originalError: error,
		};
	}

	let errorMessage = "";
	let errorData: unknown = null;

	// Handle ConvexError instances
	if (error instanceof ConvexError) {
		errorMessage = error.message || "";
		errorData = error.data;
	}
	// Handle regular Error instances
	else if (error instanceof Error) {
		errorMessage = error.message || "";
	}
	// Handle string errors
	else if (typeof error === "string") {
		errorMessage = error;
	}
	// Handle other error types
	else {
		errorMessage = String(error);
	}

	// Convert to lowercase for pattern matching
	const lowerMessage = errorMessage.toLowerCase();

	// Find matching error pattern
	for (const [pattern, errorInfo] of Object.entries(ERROR_PATTERNS)) {
		if (lowerMessage.includes(pattern.toLowerCase())) {
			return {
				type: errorInfo.type,
				message: errorInfo.message,
				originalError: error,
				code: errorInfo.code,
			};
		}
	}

	// Handle specific ConvexError data structures
	if (errorData && typeof errorData === "object") {
		// Handle Zod validation errors from ConvexError
		const data = errorData as Record<string, unknown>;
		if (data._errors || data.email || data.password) {
			return {
				type: "validation",
				message: "Please check your input and try again.",
				originalError: error,
				code: "VALIDATION_ERROR",
			};
		}
	}

	// Default fallback for unknown errors
	return {
		type: "unknown",
		message:
			"Something went wrong. Please try again or contact support if the problem persists.",
		originalError: error,
		code: "UNKNOWN_ERROR",
	};
}

/**
 * Get a user-friendly error message from any error
 */
export function getAuthErrorMessage(error: unknown): string {
	return parseAuthError(error).message;
}

/**
 * Check if an error is a specific type
 */
export function isAuthErrorType(error: unknown, type: AuthErrorType): boolean {
	return parseAuthError(error).type === type;
}

/**
 * Log error details for debugging while showing user-friendly message
 */
export function logAuthError(
	error: unknown,
	context?: string,
): ParsedAuthError {
	const parsed = parseAuthError(error);

	// Log technical details for debugging
	console.error(`Auth Error${context ? ` (${context})` : ""}:`, {
		type: parsed.type,
		code: parsed.code,
		userMessage: parsed.message,
		originalError: parsed.originalError,
		stack: error instanceof Error ? error.stack : undefined,
	});

	return parsed;
}
