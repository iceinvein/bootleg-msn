import { render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountLinkingNotification } from "./AccountLinkingNotification";

// Mock the useAuthMethods hook
vi.mock("@/hooks/useAuthMethods", () => ({
	useAuthMethods: vi.fn(),
}));

// Mock Convex React hooks
vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
	},
}));

import { useMutation, useQuery } from "convex/react";
// Import the mocked modules
import { useAuthMethods } from "@/hooks/useAuthMethods";

describe("AccountLinkingNotification", () => {
	const mockUseAuthMethods = vi.mocked(useAuthMethods);
	const mockUseQuery = vi.mocked(useQuery);
	const mockUseMutation = vi.mocked(useMutation);
	const mockToastSuccess = vi.mocked(toast.success);
	const mockMarkAsShown = vi.fn();

	// Create a proper ReactMutation mock
	const mockMutationObject = Object.assign(mockMarkAsShown, {
		withOptimisticUpdate: vi.fn(),
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseMutation.mockReturnValue(mockMutationObject);
		mockMarkAsShown.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("shows toast when account is linked for the first time", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google", "github"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false); // Server says notification not shown

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Account linked successfully! You can now sign in with Google, GitHub or your email/password.",
			{
				duration: 8000,
				action: {
					label: "Got it",
					onClick: expect.any(Function),
				},
			},
		);

		expect(mockMarkAsShown).toHaveBeenCalled();
	});

	it("does not show toast when account is linked but notification was already shown", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(true); // Server says notification already shown

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockMarkAsShown).not.toHaveBeenCalled();
	});

	it("does not show toast when account is not linked", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: false,
			accountLinked: false,
			oauthProviders: [],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false);

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockMarkAsShown).not.toHaveBeenCalled();
	});

	it("does not show toast when still loading", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google"],
			isLoading: true,
		});

		mockUseQuery.mockReturnValue(false);

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockMarkAsShown).not.toHaveBeenCalled();
	});

	it("does not show toast when server query is loading", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(undefined); // Query still loading

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).not.toHaveBeenCalled();
		expect(mockMarkAsShown).not.toHaveBeenCalled();
	});

	it("handles single provider correctly", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["apple"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false);

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Account linked successfully! You can now sign in with Apple or your email/password.",
			expect.any(Object),
		);
	});

	it("handles multiple providers correctly", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google", "github", "apple"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false);

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Account linked successfully! You can now sign in with Google, GitHub, Apple or your email/password.",
			expect.any(Object),
		);
	});

	it("handles unknown provider names", () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["unknown-provider"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false);

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).toHaveBeenCalledWith(
			"Account linked successfully! You can now sign in with unknown-provider or your email/password.",
			expect.any(Object),
		);
	});

	it("handles mutation error gracefully", async () => {
		mockUseAuthMethods.mockReturnValue({
			hasPassword: true,
			hasOAuth: true,
			accountLinked: true,
			oauthProviders: ["google"],
			isLoading: false,
		});

		mockUseQuery.mockReturnValue(false);
		mockMarkAsShown.mockRejectedValue(new Error("Network error"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(<AccountLinkingNotification />);

		expect(mockToastSuccess).toHaveBeenCalled();
		expect(mockMarkAsShown).toHaveBeenCalled();

		// Wait for the error to be logged
		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to mark account linking notification as shown:",
				expect.any(Error),
			);
		});

		consoleSpy.mockRestore();
	});
});
