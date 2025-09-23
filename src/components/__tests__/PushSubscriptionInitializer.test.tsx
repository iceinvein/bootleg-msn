/**
 * Tests for PushSubscriptionInitializer component
 */

import React from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the usePushSubscription hook
vi.mock("../../hooks/usePushSubscription", () => ({
	usePushSubscription: vi.fn(),
}));

import { PushSubscriptionInitializer } from "../PushSubscriptionInitializer";
import { usePushSubscription } from "../../hooks/usePushSubscription";

// Get the mocked function
const mockUsePushSubscription = vi.mocked(usePushSubscription);

describe("PushSubscriptionInitializer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the mock implementation to default (no-op)
		mockUsePushSubscription.mockImplementation(() => {});
	});

	describe("Component Rendering", () => {
		it("should render without crashing", () => {
			const { container } = render(<PushSubscriptionInitializer />);
			
			// Should render nothing (null component)
			expect(container.firstChild).toBeNull();
		});

		it("should call usePushSubscription hook", () => {
			render(<PushSubscriptionInitializer />);
			
			expect(mockUsePushSubscription).toHaveBeenCalledTimes(1);
		});

		it("should not render any DOM elements", () => {
			const { container } = render(<PushSubscriptionInitializer />);
			
			expect(container.innerHTML).toBe("");
		});
	});

	describe("Hook Integration", () => {
		it("should handle hook errors gracefully", () => {
			mockUsePushSubscription.mockImplementation(() => {
				throw new Error("Hook error");
			});

			// Should throw during render since the hook throws
			expect(() => render(<PushSubscriptionInitializer />)).toThrow("Hook error");
		});

		it("should re-call hook on re-render", () => {
			const { rerender } = render(<PushSubscriptionInitializer />);
			
			expect(mockUsePushSubscription).toHaveBeenCalledTimes(1);
			
			rerender(<PushSubscriptionInitializer />);
			
			expect(mockUsePushSubscription).toHaveBeenCalledTimes(2);
		});
	});

	describe("Component Lifecycle", () => {
		it("should initialize push subscription on mount", () => {
			render(<PushSubscriptionInitializer />);
			
			expect(mockUsePushSubscription).toHaveBeenCalled();
		});

		it("should clean up properly on unmount", () => {
			const { unmount } = render(<PushSubscriptionInitializer />);
			
			// Should not throw on unmount
			expect(() => unmount()).not.toThrow();
		});
	});

	describe("Multiple Instances", () => {
		it("should handle multiple instances correctly", () => {
			render(
				<div>
					<PushSubscriptionInitializer />
					<PushSubscriptionInitializer />
				</div>
			);
			
			// Each instance should call the hook
			expect(mockUsePushSubscription).toHaveBeenCalledTimes(2);
		});
	});

	describe("Error Boundaries", () => {
		it("should work within error boundaries", () => {
			// Simple error boundary component
			class ErrorBoundary extends React.Component<
				{ children: React.ReactNode },
				{ hasError: boolean }
			> {
				constructor(props: { children: React.ReactNode }) {
					super(props);
					this.state = { hasError: false };
				}

				static getDerivedStateFromError() {
					return { hasError: true };
				}

				render() {
					if (this.state.hasError) {
						return <div>Error occurred</div>;
					}
					return this.props.children;
				}
			}

			// Make the hook throw an error to test error boundary
			mockUsePushSubscription.mockImplementation(() => {
				throw new Error("Hook error");
			});

			const { container } = render(
				<ErrorBoundary>
					<PushSubscriptionInitializer />
				</ErrorBoundary>
			);

			// Should render error boundary content
			expect(container.innerHTML).toBe("<div>Error occurred</div>");
		});
	});
});
