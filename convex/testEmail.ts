import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

// Initialize Resend component
export const resend: Resend = new Resend(components.resend, {
	testMode: false,
});

// Test function to verify Resend integration using @convex-dev/resend
export const testEmailSend = action({
	args: {
		testEmail: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		message: v.string(),
		id: v.string(),
	}),
	handler: async (ctx, args) => {
		try {
			const result = await resend.sendEmail(ctx, {
				from: "Bootleg MSN Messenger <onboarding@resend.dev>",
				to: args.testEmail,
				subject: "Bootleg MSN Messenger - Email Test",
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #0066cc;">Email Test Successful! 🎉</h2>
						<p>This is a test email from your bootleg MSN Messenger application.</p>
						<p>If you received this email, your Resend integration is working correctly!</p>
						<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">Bootleg MSN Messenger Team</p>
					</div>
				`,
			});

			console.log("Email sent successfully:", result);
			return {
				success: true,
				message: "Test email sent successfully!",
				id: result,
			};
		} catch (error) {
			console.error("Email test failed:", error);
			throw error;
		}
	},
});
