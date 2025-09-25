/**
 * Unit tests for SignUpForm component
 *
 * Tests cover:
 * - Form rendering and user interactions
 * - User registration flow
 * - Email verification integration
 * - Invitation token handling
 * - Form validation and error handling
 * - Loading states and UI feedback
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./SignUpForm";

// Create mock functions
const mockSendVerificationEmail = vi.fn();
const mockGetInvitationByToken = vi.fn();

// Mock API
vi.mock("@convex/_generated/api", () => ({
	api: {
		emailVerification: {
			sendVerificationEmail: "mocked-function-reference:sendVerificationEmail",
		},
		invitations: {
			getInvitationByToken: "mocked-function-reference:getInvitationByToken",
		},
	},
}));

// Mock convex/react; route useAction/useQuery based on the function ref passed in
vi.mock("convex/react", () => ({
	useAction: (fnRef?: any) => {
		if (fnRef === "mocked-function-reference:sendVerificationEmail") {
			return mockSendVerificationEmail;
		}
		// Default fallback
		return mockSendVerificationEmail;
	},
	useQuery: (fnRef?: any) => {
		if (fnRef === "mocked-function-reference:getInvitationByToken") {
			return mockGetInvitationByToken();
		}
		// Default to no invitation
		return undefined;
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/utils/authErrorHandler", () => ({
	getAuthErrorMessage: vi.fn((error) => error.message || "Registration error"),
	logAuthError: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
	value: mockLocalStorage,
});

describe("SignUpForm", () => {
	const mockOnBackToSignIn = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mock functions
		mockSendVerificationEmail.mockReset();
		mockGetInvitationByToken.mockReset();

		// Set default return values
		mockGetInvitationByToken.mockReturnValue(undefined); // Default to no invitation
	});

	it("renders sign-up form with all elements", () => {
		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		expect(screen.getByText("Join bootleg MSN Messenger")).toBeInTheDocument();
		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create account/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
	});

	it("handles form input correctly", async () => {
		const user = userEvent.setup();
		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);

		await user.type(nameInput, "Test User");
		await user.type(emailInput, "test@example.com");
		await user.type(passwordInput, "password123");

		expect(nameInput).toHaveValue("Test User");
		expect(emailInput).toHaveValue("test@example.com");
		expect(passwordInput).toHaveValue("password123");
	});

	it("toggles password visibility", async () => {
		const user = userEvent.setup();
		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const passwordInput = screen.getByLabelText(/password/i);
		// Find the toggle button by its position relative to the password input
		const toggleButton = passwordInput.parentElement?.querySelector(
			'button[type="button"]',
		);
		expect(toggleButton).toBeInTheDocument();

		expect(passwordInput).toHaveAttribute("type", "password");

		await user.click(toggleButton!);
		expect(passwordInput).toHaveAttribute("type", "text");

		await user.click(toggleButton!);
		expect(passwordInput).toHaveAttribute("type", "password");
	});

	it("prevents form submission with empty fields", async () => {
		const user = userEvent.setup();
		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});
		await user.click(submitButton);

		expect(mockSendVerificationEmail).not.toHaveBeenCalled();
	});

	it("handles successful sign-up", async () => {
		const user = userEvent.setup();

		mockSendVerificationEmail.mockResolvedValue({
			success: true,
			emailId: "email-123",
		});

		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});

		await user.type(nameInput, "Test User");
		await user.type(emailInput, "test@example.com");
		await user.type(passwordInput, "password123");
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockSendVerificationEmail).toHaveBeenCalledWith({
				email: "test@example.com",
				name: "Test User",
			});
		});

		await waitFor(() => {
			expect(screen.getByText(/check your email/i)).toBeInTheDocument();
		});

		// Check that user data is stored in localStorage
		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			"pendingSignUp",
			JSON.stringify({
				email: "test@example.com",
				password: "password123",
				name: "Test User",
				invitationToken: null,
			}),
		);

		// Should show email sent confirmation
		expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
	});

	it("handles sign-up errors", async () => {
		const user = userEvent.setup();
		const error = new Error("Email already exists");

		mockSendVerificationEmail.mockRejectedValue(error);

		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});

		await user.type(nameInput, "Test User");
		await user.type(emailInput, "existing@example.com");
		await user.type(passwordInput, "password123");
		await user.click(submitButton);

		await waitFor(() => {
			// Just check that the form is still visible (error didn't cause navigation)
			expect(
				screen.getByRole("button", { name: /create account/i }),
			).toBeInTheDocument();
		});
	});

	it("shows loading state during sign-up", async () => {
		const user = userEvent.setup();
		mockSendVerificationEmail.mockResolvedValue({
			success: true,
			emailId: "email-123",
		});

		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});

		await user.type(nameInput, "Test User");
		await user.type(emailInput, "test@example.com");
		await user.type(passwordInput, "password123");
		await user.click(submitButton);

		// Check for loading state
		expect(submitButton).toBeDisabled();

		// After successful submission, should transition to email verification page
		await waitFor(() => {
			expect(screen.getByText(/check your email/i)).toBeInTheDocument();
		});
	});

	it("navigates back to sign-in form", async () => {
		const user = userEvent.setup();
		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const signInLink = screen.getByText(/sign in/i);
		await user.click(signInLink);

		expect(mockOnBackToSignIn).toHaveBeenCalled();
	});

	it("handles invitation token", () => {
		const invitationToken = "invitation-123";
		const mockInvitationDetails = {
			_id: "invitation-id",
			token: invitationToken,
			inviter: {
				name: "John Doe",
				email: "john@example.com",
			},
			inviteeEmail: "invited@example.com",
		};

		// Set up the mock to return invitation details
		mockGetInvitationByToken.mockReturnValue(mockInvitationDetails);

		render(
			<SignUpForm
				onBackToSignIn={mockOnBackToSignIn}
				invitationToken={invitationToken}
			/>,
		);

		expect(screen.getByText("Accept Invitation")).toBeInTheDocument();
		expect(screen.getByText(/John Doe invited you/i)).toBeInTheDocument();
	});

	it("pre-fills email from invitation", () => {
		const invitationToken = "invitation-123";
		const mockInvitationDetails = {
			_id: "invitation-id",
			token: invitationToken,
			inviter: {
				name: "John Doe",
				email: "john@example.com",
			},
			inviteeEmail: "invited@example.com",
		};

		// Set up the mock to return invitation details
		mockGetInvitationByToken.mockReturnValue(mockInvitationDetails);

		render(
			<SignUpForm
				onBackToSignIn={mockOnBackToSignIn}
				invitationToken={invitationToken}
			/>,
		);

		const emailInput = screen.getByLabelText(/email/i);
		expect(emailInput).toHaveValue("invited@example.com");
	});

	it("includes invitation token in sign-up data", async () => {
		const user = userEvent.setup();
		const invitationToken = "invitation-123";
		const mockInvitationDetails = {
			_id: "invitation-id",
			token: invitationToken,
			inviter: { name: "John Doe" },
			inviteeEmail: "invited@example.com",
		};

		// Set up the mock to return invitation details
		mockGetInvitationByToken.mockReturnValue(mockInvitationDetails);

		mockSendVerificationEmail.mockResolvedValue({
			success: true,
			emailId: "email-123",
		});

		render(
			<SignUpForm
				onBackToSignIn={mockOnBackToSignIn}
				invitationToken={invitationToken}
			/>,
		);

		const nameInput = screen.getByLabelText(/name/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});

		await user.type(nameInput, "Test User");
		await user.type(passwordInput, "password123");
		await user.click(submitButton);

		// Check that invitation token is stored in localStorage
		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			"pendingSignUp",
			JSON.stringify({
				email: "invited@example.com",
				password: "password123",
				name: "Test User",
				invitationToken: invitationToken,
			}),
		);
	});

	it("shows email sent confirmation with resend option", async () => {
		const user = userEvent.setup();
		mockSendVerificationEmail.mockResolvedValue({
			success: true,
			emailId: "email-123",
		});

		render(<SignUpForm onBackToSignIn={mockOnBackToSignIn} />);

		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole("button", {
			name: /create account/i,
		});

		await user.type(nameInput, "Test User");
		await user.type(emailInput, "test@example.com");
		await user.type(passwordInput, "password123");
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/check your email/i)).toBeInTheDocument();
			expect(
				screen.getByText(/we've sent a verification link/i),
			).toBeInTheDocument();
		});
	});
});
