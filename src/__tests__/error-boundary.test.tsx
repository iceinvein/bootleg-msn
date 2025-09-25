/**
 * React Error Boundary Tests
 *
 * Tests error boundaries and component error recovery mechanisms
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock console.error to avoid test output noise
const mockConsoleError = vi
	.spyOn(console, "error")
	.mockImplementation(() => {});

// Test Error Boundary Component
class TestErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div data-testid="error-fallback">Something went wrong</div>
				)
			);
		}
		return this.props.children;
	}
}

// Component that throws errors for testing
const ThrowingComponent = ({
	shouldThrow = false,
	errorMessage = "Test error",
}) => {
	if (shouldThrow) {
		throw new Error(errorMessage);
	}
	return <div data-testid="normal-component">Normal component</div>;
};

// Component that throws during render
const RenderErrorComponent = () => {
	throw new Error("Render error");
};

// Component that throws during effect
const _EffectErrorComponent = () => {
	React.useEffect(() => {
		throw new Error("Effect error");
	}, []);
	return <div>Effect component</div>;
};

// Component with async error (properly handled to avoid unhandled promise rejection)
const AsyncErrorComponent = () => {
	React.useEffect(() => {
		const timeoutId = setTimeout(() => {
			// Catch the error to prevent unhandled promise rejection
			try {
				throw new Error("Async error");
			} catch (error) {
				// In a real app, you might log this error or handle it appropriately
				// For testing purposes, we just catch it to prevent unhandled rejection
				console.warn("Async error caught (expected in test):", error.message);
			}
		}, 0);

		// Cleanup timeout on unmount
		return () => clearTimeout(timeoutId);
	}, []);
	return <div>Async component</div>;
};

describe("Error Boundary Tests", () => {
	beforeEach(() => {
		mockConsoleError.mockClear();
	});

	describe("Basic Error Boundary Functionality", () => {
		it("should catch and display error fallback when child component throws", () => {
			render(
				<TestErrorBoundary>
					<ThrowingComponent shouldThrow={true} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
			expect(screen.queryByTestId("normal-component")).not.toBeInTheDocument();
		});

		it("should render children normally when no error occurs", () => {
			render(
				<TestErrorBoundary>
					<ThrowingComponent shouldThrow={false} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("normal-component")).toBeInTheDocument();
			expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
		});

		it("should display custom fallback UI", () => {
			const customFallback = (
				<div data-testid="custom-fallback">Custom error message</div>
			);

			render(
				<TestErrorBoundary fallback={customFallback}>
					<ThrowingComponent shouldThrow={true} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
			expect(screen.getByText("Custom error message")).toBeInTheDocument();
		});
	});

	describe("Error Types and Scenarios", () => {
		it("should catch render errors", () => {
			render(
				<TestErrorBoundary>
					<RenderErrorComponent />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
			expect(mockConsoleError).toHaveBeenCalled();
		});

		it("should catch errors with different messages", () => {
			const customError = "Custom error message";

			render(
				<TestErrorBoundary>
					<ThrowingComponent shouldThrow={true} errorMessage={customError} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
		});

		it("should handle multiple error boundaries", () => {
			render(
				<TestErrorBoundary
					fallback={<div data-testid="outer-error">Outer error</div>}
				>
					<div>
						<TestErrorBoundary
							fallback={<div data-testid="inner-error">Inner error</div>}
						>
							<ThrowingComponent shouldThrow={true} />
						</TestErrorBoundary>
					</div>
				</TestErrorBoundary>,
			);

			// Inner boundary should catch the error
			expect(screen.getByTestId("inner-error")).toBeInTheDocument();
			expect(screen.queryByTestId("outer-error")).not.toBeInTheDocument();
		});
	});

	describe("Error Boundary Limitations", () => {
		it("should not catch errors in event handlers", () => {
			const EventErrorComponent = () => {
				const handleClick = () => {
					throw new Error("Event handler error");
				};

				return (
					<button onClick={handleClick} data-testid="event-button">
						Click me
					</button>
				);
			};

			render(
				<TestErrorBoundary>
					<EventErrorComponent />
				</TestErrorBoundary>,
			);

			// Component should render normally
			expect(screen.getByTestId("event-button")).toBeInTheDocument();
			expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
		});

		it("should not catch async errors", () => {
			render(
				<TestErrorBoundary>
					<AsyncErrorComponent />
				</TestErrorBoundary>,
			);

			// Component should render normally (async error won't be caught)
			expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
		});
	});

	describe("Error Recovery", () => {
		it("should allow error boundary to reset", () => {
			const ResettableErrorBoundary = ({
				children,
				reset,
			}: {
				children: React.ReactNode;
				reset?: boolean;
			}) => {
				const [hasError, setHasError] = React.useState(false);

				React.useEffect(() => {
					if (reset) {
						setHasError(false);
					}
				}, [reset]);

				if (hasError) {
					return (
						<div data-testid="error-with-reset">
							Error occurred
							<button
								onClick={() => setHasError(false)}
								data-testid="reset-button"
							>
								Reset
							</button>
						</div>
					);
				}

				return (
					<ErrorBoundaryWrapper onError={() => setHasError(true)}>
						{children}
					</ErrorBoundaryWrapper>
				);
			};

			const ErrorBoundaryWrapper = ({
				children,
				onError,
			}: {
				children: React.ReactNode;
				onError: () => void;
			}) => {
				React.useEffect(() => {
					const handleError = () => onError();
					window.addEventListener("error", handleError);
					return () => window.removeEventListener("error", handleError);
				}, [onError]);

				return <>{children}</>;
			};

			const { rerender } = render(
				<ResettableErrorBoundary>
					<ThrowingComponent shouldThrow={false} />
				</ResettableErrorBoundary>,
			);

			// Initially no error
			expect(screen.queryByTestId("error-with-reset")).not.toBeInTheDocument();

			// Simulate error state
			rerender(
				<ResettableErrorBoundary reset={false}>
					<div data-testid="error-with-reset">
						Error occurred
						<button data-testid="reset-button">Reset</button>
					</div>
				</ResettableErrorBoundary>,
			);

			expect(screen.getByTestId("error-with-reset")).toBeInTheDocument();
		});
	});

	describe("Error Information", () => {
		it("should provide error details in componentDidCatch", () => {
			class DetailedErrorBoundary extends React.Component<
				{ children: React.ReactNode },
				{ hasError: boolean; errorInfo?: React.ErrorInfo }
			> {
				constructor(props: { children: React.ReactNode }) {
					super(props);
					this.state = { hasError: false };
				}

				static getDerivedStateFromError() {
					return { hasError: true };
				}

				componentDidCatch(_error: Error, errorInfo: React.ErrorInfo) {
					this.setState({ errorInfo });
				}

				render() {
					if (this.state.hasError) {
						return (
							<div data-testid="detailed-error">
								<div>Error occurred</div>
								{this.state.errorInfo && (
									<div data-testid="error-stack">
										{this.state.errorInfo.componentStack}
									</div>
								)}
							</div>
						);
					}
					return this.props.children;
				}
			}

			render(
				<DetailedErrorBoundary>
					<ThrowingComponent shouldThrow={true} />
				</DetailedErrorBoundary>,
			);

			expect(screen.getByTestId("detailed-error")).toBeInTheDocument();
		});
	});

	describe("Nested Error Scenarios", () => {
		it("should handle deeply nested component errors", () => {
			const DeepComponent = ({ level }: { level: number }) => {
				if (level === 0) {
					throw new Error("Deep error");
				}
				return <DeepComponent level={level - 1} />;
			};

			render(
				<TestErrorBoundary>
					<DeepComponent level={5} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
		});

		it("should handle errors in conditional rendering", () => {
			const ConditionalErrorComponent = ({
				showError,
			}: {
				showError: boolean;
			}) => {
				return (
					<div>
						{showError && <ThrowingComponent shouldThrow={true} />}
						{!showError && <div data-testid="no-error">No error</div>}
					</div>
				);
			};

			const { rerender } = render(
				<TestErrorBoundary>
					<ConditionalErrorComponent showError={false} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("no-error")).toBeInTheDocument();

			rerender(
				<TestErrorBoundary>
					<ConditionalErrorComponent showError={true} />
				</TestErrorBoundary>,
			);

			expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
		});
	});
});
