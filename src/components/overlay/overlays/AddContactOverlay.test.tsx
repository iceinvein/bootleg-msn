import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddContactOverlay } from "./AddContactOverlay";

vi.mock("convex/react", () => ({
	useMutation: vi.fn(() => vi.fn()),
	useAction: vi.fn(() => vi.fn()),
}));

vi.mock("@/components/ui/responsive-dialog", () => ({
	ResponsiveDialog: ({
		children,
		open,
		onOpenChange,
	}: {
		children: React.ReactNode;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => (
		<div data-testid="responsive-dialog" data-open={open}>
			<button onClick={() => onOpenChange(!open)}>Toggle Dialog</button>
			{children}
		</div>
	),
	ResponsiveDialogContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-content">{children}</div>
	),
	ResponsiveDialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-header">{children}</div>
	),
	ResponsiveDialogTitle: ({ children }: { children: React.ReactNode }) => (
		<h2 data-testid="dialog-title">{children}</h2>
	),
	ResponsiveDialogDescription: ({
		children,
	}: {
		children: React.ReactNode;
	}) => <p data-testid="dialog-description">{children}</p>,
	ResponsiveDialogFooter: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="dialog-footer">{children}</div>
	),
}));

vi.mock("@/components/ui/form", () => ({
	Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
	FormField: ({ render }: any) =>
		render({ field: { onChange: vi.fn(), value: "" } }),
	FormItem: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	FormLabel: ({ children }: { children: React.ReactNode }) => (
		<label>{children}</label>
	),
	FormControl: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	FormMessage: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("react-hook-form", () => ({
	useForm: () => ({
		handleSubmit: (fn: any) => {
			(globalThis as any).testFormSubmit = () =>
				fn({ email: "test@example.com" });
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

vi.mock("@hookform/resolvers/zod", () => ({ zodResolver: () => vi.fn() }));

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

vi.mock("@/components/ui/textarea", () => ({
	Textarea: ({ placeholder, onChange, value, ...props }: any) => (
		<textarea
			placeholder={placeholder}
			onChange={onChange}
			value={value}
			data-testid="textarea"
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

vi.mock("lucide-react", () => ({
	UserPlus: () => <div />,
	Mail: () => <div />,
	User: () => <div />,
}));

vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	}),
}));

import { useMutation } from "convex/react";
import { toast } from "sonner";

const mockUseMutation = useMutation as any;

describe("AddContactOverlay", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseMutation.mockReturnValue(vi.fn());
		vi.mocked(toast).mockClear();
		vi.mocked(toast.success).mockClear();
		vi.mocked(toast.error).mockClear();
	});

	it("renders header and description", () => {
		render(<AddContactOverlay onClose={vi.fn()} />);
		expect(screen.getByTestId("dialog-title")).toHaveTextContent("Add Contact");
		expect(screen.getByTestId("dialog-description")).toHaveTextContent(
			"Send a contact request to connect with someone.",
		);
	});

	it("submits contact request and shows success", async () => {
		const mockSendContactRequest = vi.fn().mockResolvedValue({ success: true });
		mockUseMutation.mockReturnValueOnce(mockSendContactRequest);

		render(<AddContactOverlay onClose={vi.fn()} />);

		(globalThis as any).testFormSubmit();

		await waitFor(() => {
			expect(mockSendContactRequest).toHaveBeenCalledWith({
				contactEmail: "test@example.com",
				nickname: undefined,
			});
			expect(vi.mocked(toast.success)).toHaveBeenCalled();
		});
	});

	it("switches to invitation mode when user not found", async () => {
		const mockSendContactRequest = vi
			.fn()
			.mockRejectedValue(new Error("User not found"));
		mockUseMutation.mockReturnValueOnce(mockSendContactRequest);

		render(<AddContactOverlay onClose={vi.fn()} />);

		(globalThis as any).testFormSubmit();

		await waitFor(() => {
			expect(screen.getByTestId("dialog-title")).toHaveTextContent(
				"Invite to MSN Messenger",
			);
			expect(screen.getByText("Send Invitation")).toBeInTheDocument();
		});
	});
});
