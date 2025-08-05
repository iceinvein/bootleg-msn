import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export function EmailTestComponent() {
	const [testEmail, setTestEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const testEmailSend = useAction(api.testEmail.testEmailSend);

	const handleTest = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!testEmail.trim()) return;

		setIsLoading(true);
		try {
			const result = await testEmailSend({ testEmail: testEmail.trim() });
			toast.success(`✅ ${result.message}`);
			console.log("Email test successful:", result);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			toast.error(`❌ Email test failed: ${errorMessage}`);
			console.error("Email test failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed right-4 bottom-4 max-w-sm rounded-lg border bg-white p-4 shadow-lg">
			<h3 className="mb-3 font-semibold text-gray-900">🧪 Email Test</h3>
			<form onSubmit={handleTest} className="space-y-3">
				<input
					type="email"
					value={testEmail}
					onChange={(e) => setTestEmail(e.target.value)}
					placeholder="Enter test email address"
					className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
				<button
					type="submit"
					disabled={isLoading || !testEmail.trim()}
					className="w-full rounded-md bg-blue-500 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300"
				>
					{isLoading ? "Sending..." : "Send Test Email"}
				</button>
			</form>
			<p className="mt-2 text-gray-500 text-xs">
				This will send a test email to verify your Resend integration.
			</p>
		</div>
	);
}
