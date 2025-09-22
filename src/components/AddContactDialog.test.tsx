import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import AddContactDialog from "./AddContactDialog";

// Mock dependencies
vi.mock("convex/react", () => ({
	useMutation: vi.fn(),
	useConvexAuth: vi.fn(() => ({ isAuthenticated: true })),
  useAction: vi.fn(),
}));

vi.mock("@/hooks/useNotifications", () => ({
	useNotifications: () => ({
		notifyContactRequest: vi.fn(),
	}),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (
		<div data-testid="dialog" data-open={open}>
			{children}
		</div>
	),
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-content">{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-header">{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	DialogDescription: ({ children }: { children: React.ReactNode }) => (
		<p data-testid="dialog-description">{children}</p>
	),
  DialogTrigger: ({ children }: { children: React.ReactNode }) => (
		<button data-testid="dialog-trigger">{children}</button>
	),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-footer">{children}</div>
	),
}));

vi.mock("@/components/ui/form", () => ({
	Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
	FormField: ({ children, render }: any) => render({ field: { onChange: vi.fn(), value: "" } }),
	FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
	FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	FormMessage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({ placeholder, onChange, value, ...props }: any) => (
		<input
			placeholder={placeholder}
			onChange={onChange}
			value={value}
			data-testid="input"
			{...props}
		/>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, type, disabled, variant }: any) => (
		<button
			onClick={onClick}
			type={type}
			disabled={disabled}
			data-testid="button"
			data-variant={variant}
		>
			{children}
		</button>
	),
}));



vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: vi.fn(),
		error: vi.fn(),
	}),
}));

vi.mock("react-hook-form", () => ({
	useForm: () => ({
		handleSubmit: (fn: any) => {
			// Store the submit function globally so we can call it from tests
			(globalThis as any).testFormSubmit = () => fn({ email: "test@example.com" });
			return (e: any) => {
				e?.preventDefault?.();
				fn({ email: "test@example.com" });
			};
		},
		formState: { errors: {}, isSubmitting: false },
		control: {},
		reset: vi.fn(),
	}),
}));

vi.mock("@hookform/resolvers/zod", () => ({
	zodResolver: () => vi.fn(),
}));

vi.mock("lucide-react", () => ({
	UserPlus: () => <div data-testid="user-plus-icon" />,
	Loader2: () => <div data-testid="loader-icon" />,
  Send: () => <div data-testid="send-icon" />,
  User: () => <div data-testid="user-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
}));

import { useMutation } from "convex/react";
import { toast } from "sonner";

const mockUseMutation = useMutation as any;

describe("AddContactDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseMutation.mockReturnValue(vi.fn());
		vi.mocked(toast).mockClear();
		vi.mocked(toast.success).mockClear();
		vi.mocked(toast.error).mockClear();
	});

	describe("Rendering", () => {
		it("should render dialog content", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			expect(screen.getByTestId("dialog-title")).toHaveTextContent("Add New Contact");
			expect(screen.getByTestId("dialog-description")).toHaveTextContent(
				"Send a contact request to someone you'd like to chat with."
			);
		});

		it("should render form elements", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			expect(screen.getByText("Email Address")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("friend@example.com")).toBeInTheDocument();
			expect(screen.getByText("Nickname (Optional)")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Friend")).toBeInTheDocument();
			expect(screen.getByText("Send Request")).toBeInTheDocument();
		});
	});

	describe("Form Submission", () => {
		it("should call sendContactRequest on form submission", async () => {
			const mockSendContactRequest = vi.fn().mockResolvedValue({ success: true });
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			await waitFor(() => {
				expect(mockSendContactRequest).toHaveBeenCalledWith({
					contactEmail: "test@example.com",
					nickname: undefined,
				});
			});
		});

		it("should show success toast when contact request sent", async () => {
			const mockSendContactRequest = vi.fn().mockResolvedValue({ success: true });
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			await waitFor(() => {
				expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
					expect.stringContaining("Contact request sent")
				);
			});
		});

		it("should switch to invitation mode when user not found", async () => {
			const mockSendContactRequest = vi.fn().mockRejectedValue(
				new Error("User has not signed up yet")
			);
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			// Wait for the dialog mode to change to invitation mode
			await waitFor(() => {
				expect(screen.getByText("Invite to Join")).toBeInTheDocument();
				expect(screen.getByText("Send Invitation")).toBeInTheDocument();
				expect(screen.getByText("User not found")).toBeInTheDocument();
			});
		});

		it("should show error toast when request fails", async () => {
			const mockSendContactRequest = vi.fn().mockRejectedValue(new Error("Network error"));
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			await waitFor(() => {
				expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
					"Network error"
				);
			});
		});
	});

	describe("Form Validation", () => {
		it("should validate email format", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			const emailInput = screen.getByPlaceholderText("friend@example.com");
			expect(emailInput).toHaveAttribute("type", "email");
		});

		it("should render all form fields", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Check all form fields are present
			expect(screen.getByPlaceholderText("Friend")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("friend@example.com")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Add a personal message...")).toBeInTheDocument();
		});
	});



	describe("Contact Request Workflow", () => {
		it("should handle existing contact scenario", async () => {
			const mockSendContactRequest = vi.fn().mockRejectedValue(
				new Error("Contact already exists")
			);
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			await waitFor(() => {
				expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
					"Contact already exists"
				);
			});
		});

		it("should handle pending request scenario", async () => {
			const mockSendContactRequest = vi.fn().mockRejectedValue(
				new Error("Contact request already pending")
			);
			mockUseMutation.mockReturnValue(mockSendContactRequest);

			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			// Trigger form submission directly
			(globalThis as any).testFormSubmit();

			await waitFor(() => {
				expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
					"Contact request already pending"
				);
			});
		});
	});

	describe("Accessibility", () => {
		it("should have proper form labels", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			expect(screen.getByText("Email Address")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("friend@example.com")).toHaveAttribute("type", "email");
		});

		it("should have proper button types", () => {
			render(<AddContactDialog>
          <button>Open</button>
      </AddContactDialog>);

			const submitButton = screen.getByText("Send Request");
			expect(submitButton).toHaveAttribute("type", "submit");
		});
	});
});
