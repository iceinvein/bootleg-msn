import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		// Log for diagnostics; can be wired to telemetry later
		console.error("Top-level error boundary caught an error", { error, info });
	}

	private handleReload = () => {
		// Full reload to reset app state safely
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-screen items-center justify-center p-6">
					<div className="w-full max-w-md rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow">
						<h1 className="mb-2 font-semibold text-lg">Something went wrong</h1>
						{this.state.error?.message ? (
							<p
								className="mb-4 break-words text-muted-foreground text-sm"
								data-testid="error-message"
							>
								{this.state.error.message}
							</p>
						) : null}
						<div className="flex gap-3">
							<button
								type="button"
								className="inline-flex items-center rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm hover:opacity-90"
								onClick={this.handleReload}
								data-testid="reload-button"
							>
								Reload app
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
