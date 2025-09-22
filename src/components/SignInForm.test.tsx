/**
 * Unit tests for SignInForm component
 *
 * Tests cover:
 * - Form rendering and user interactions
 * - Email/password authentication flow
 * - OAuth provider integration
 * - Error handling and validation
 * - Email verification flow
 * - Loading states and UI feedback
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { SignInForm } from './SignInForm';

// Create mock functions
const mockSignIn = vi.fn();
const mockVerifyEmailAndCreateUser = vi.fn();
const mockCheckEmailVerification = vi.fn();
const mockResendVerificationEmail = vi.fn();

// Mock dependencies
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: mockSignIn,
  }),
}));

// Single, consolidated API mock (Option A)
vi.mock('@convex/_generated/api', () => ({
  api: {
    auth: {
      checkEmailVerificationForAuth: 'mocked-function-reference:checkEmail',
    },
    emailVerification: {
      resendVerificationEmail:
        'mocked-function-reference:resendVerificationEmail',
    },
    authVerification: {
      verifyEmailAndCreateUser:
        'mocked-function-reference:verifyEmailAndCreateUser',
    },
  },
}));

// Mock convex/react; route useAction based on the function ref passed in
vi.mock('convex/react', () => ({
  useAction: (fnRef?: any) => {
    if (fnRef === 'mocked-function-reference:resendVerificationEmail') {
      return mockResendVerificationEmail;
    }
    if (fnRef === 'mocked-function-reference:verifyEmailAndCreateUser') {
      return mockVerifyEmailAndCreateUser;
    }
    // Some components/tests might still call useAction without args; default
    return mockVerifyEmailAndCreateUser;
  },
  useMutation: () => mockCheckEmailVerification,
  useQuery: () => null, // Add useQuery mock for SignUpForm
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/authErrorHandler', () => ({
  getAuthErrorMessage: vi.fn((error) => error.message || 'Authentication error'),
  isAuthErrorType: vi.fn(() => false),
  logAuthError: vi.fn(),
}));

vi.mock('./EmailVerificationPage', () => ({
  EmailVerificationPage: ({ email, onBackToSignIn }: any) => (
    <div data-testid="email-verification-page">
      <span>Verify email: {email}</span>
      <button onClick={onBackToSignIn}>Back to Sign In</button>
    </div>
  ),
}));

vi.mock('./SignInWithGoogle', () => ({
  SignInWithGoogle: ({ onSignIn }: any) => (
    <button data-testid="google-signin" onClick={onSignIn}>
      Sign in with Google
    </button>
  ),
}));

vi.mock('./SignInWithGithub', () => ({
  SignInWithGitHub: ({ onSignIn }: any) => (
    <button data-testid="github-signin" onClick={onSignIn}>
      Sign in with GitHub
    </button>
  ),
}));

vi.mock('./SignInWithApple', () => ({
  SignInWithApple: ({ onSignIn }: any) => (
    <button data-testid="apple-signin" onClick={onSignIn}>
      Sign in with Apple
    </button>
  ),
}));

describe('SignInForm', () => {
  const mockOnSignUpClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockReset();
    mockVerifyEmailAndCreateUser.mockReset();
    mockCheckEmailVerification.mockReset();
    mockResendVerificationEmail.mockReset();
    mockOnSignUpClick.mockReset();
  });

  it('renders sign-in form with all elements', () => {
    render(<SignInForm />);

    expect(screen.getByText('Welcome to the bootleg MSN Messenger')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign In' })
    ).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('renders OAuth sign-in options', () => {
    render(<SignInForm />);

    expect(screen.getByTestId('google-signin')).toBeInTheDocument();
    expect(screen.getByTestId('github-signin')).toBeInTheDocument();
    expect(screen.getByTestId('apple-signin')).toBeInTheDocument();
  });

  it('handles email and password input', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    // Find the password toggle button (the button inside the password field container)
    const passwordContainer = passwordInput.parentElement;
    const toggleButton = passwordContainer?.querySelector('button[type="button"]') as HTMLElement;

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('handles successful email/password sign-in', async () => {
    const user = userEvent.setup();
    mockCheckEmailVerification.mockResolvedValue(true);
    mockSignIn.mockResolvedValue(undefined);

    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCheckEmailVerification).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('password', {
        email: 'test@example.com',
        password: 'password123',
        flow: 'signIn',
      });
    });
  });

  it('shows email verification page when email is not verified', async () => {
    const user = userEvent.setup();
    mockCheckEmailVerification.mockResolvedValue(false);

    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'unverified@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Email Verification Required' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('unverified@example.com')
      ).toBeInTheDocument();
    });
  });

  it('handles sign-in errors', async () => {
    const user = userEvent.setup();
    const error = new Error('Invalid credentials');

    mockCheckEmailVerification.mockResolvedValue(true);
    mockSignIn.mockRejectedValue(error);

    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows loading state during sign-in', async () => {
    const user = userEvent.setup();
    mockCheckEmailVerification.mockResolvedValue(true);
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<SignInForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Check for loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('handles OAuth sign-in', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const googleButton = screen.getByTestId('google-signin');
    await user.click(googleButton);

    // OAuth handling is delegated to the OAuth components
    // This test ensures the components are rendered and clickable
    expect(googleButton).toBeInTheDocument();
  });

  // Note: SignInForm doesn't have onSignUpClick prop - navigation handled by parent component

  it('returns from email verification page', async () => {
    const user = userEvent.setup();
    mockCheckEmailVerification.mockResolvedValue(false);

    render(<SignInForm />);

    // Trigger email verification page
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'unverified@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Email Verification Required' })
      ).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText('Back to Sign In');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to the bootleg MSN Messenger')).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Email Verification Required' })
      ).not.toBeInTheDocument();
    });
  });

  // Note: SignInForm doesn't accept props - invitation handling done by parent component
});