import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SignUpFormProps {
	onBackToSignIn: () => void;
}

export function SignUpForm({ onBackToSignIn }: SignUpFormProps) {
	const sendVerificationEmail = useAction(
		api.emailVerification.sendVerificationEmail,
	);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [emailSent, setEmailSent] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || !password.trim() || !name.trim()) return;

		setIsLoading(true);
		try {
			// Store user data temporarily in localStorage for after verification
			localStorage.setItem(
				"pendingSignUp",
				JSON.stringify({
					email: email.trim(),
					password: password.trim(),
					name: name.trim(),
				}),
			);

			await sendVerificationEmail({
				email: email.trim(),
				name: name.trim(),
			});

			setEmailSent(true);
			toast.success("Verification email sent! Please check your inbox.");
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to send verification email";

			if (errorMessage.includes("already verified")) {
				toast.error("This email is already verified. Please sign in instead.");
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	if (emailSent) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="glass w-full max-w-md rounded-lg border-white/20 p-8 shadow-xl dark:border-white/10">
					<div className="mb-8 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<svg
								className="h-8 w-8 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Verification email sent</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h1 className="mb-2 font-bold text-2xl">Check Your Email</h1>
						<p className="text-gray-600 dark:text-gray-400">
							We've sent a verification link to <strong>{email}</strong>
						</p>
					</div>

					<div className="space-y-4 text-center">
						<p className="text-muted-foreground text-sm">
							Click the link in your email to verify your account and complete
							the sign-up process.
						</p>

						<div className="rounded-lg border border-info/20 bg-info/10 p-4">
							<p className="text-info-foreground text-xs">
								💡 Don't see the email? Check your spam folder or wait a few
								minutes for it to arrive.
							</p>
						</div>

						<Button
							variant="outline"
							onClick={() => {
								setEmailSent(false);
								setEmail("");
								setPassword("");
								setName("");
							}}
							className="w-full"
						>
							Try Different Email
						</Button>

						<Button
							variant="ghost"
							type="button"
							onClick={onBackToSignIn}
							className="hover:bg-transparent!"
						>
							Back to Sign In
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/20">
			<Card className="w-full max-w-md" glass={true}>
				<CardHeader className="text-center">
					<CardTitle className="font-bold text-2xl">
						Join bootleg MSN Messenger
					</CardTitle>
					<CardDescription>
						Create your account to start chatting
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form>
						<div className="flex flex-col gap-6">
							<div className="grid gap-2">
								<Label htmlFor="name" className="mb-2">
									Full Name
								</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Enter your full name"
									className="w-full"
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="email" className="mb-2">
									Email Address
								</Label>
								<Input
									type="email"
									id="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email address"
									className="w-full"
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="password" className="mb-2">
									Password
								</Label>
								<div className="relative">
									<Input
										type={showPassword ? "text" : "password"}
										id="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Create a password"
										className="w-full"
										required
										minLength={6}
									/>
									<Button
										variant="ghost"
										type="button"
										size="sm"
										onClick={() => setShowPassword((prev) => !prev)}
										className="absolute top-0 right-0 h-full rounded-full p-2 hover:bg-transparent! [&_svg]:h-5! [&_svg]:w-5!"
									>
										{showPassword ? (
											<EyeOffIcon className="h-5 w-5 text-muted-foreground" />
										) : (
											<EyeIcon className="h-5 w-5 text-muted-foreground" />
										)}
									</Button>
								</div>
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="mt-2 flex-col gap-4">
					<Button
						type="submit"
						disabled={
							isLoading || !email.trim() || !password.trim() || !name.trim()
						}
						className="msn-gradient w-full text-white hover:opacity-90"
						onClick={handleSubmit}
					>
						{isLoading ? "Sending Verification Email..." : "Create Account"}
					</Button>
					<Button
						variant="ghost"
						type="button"
						onClick={onBackToSignIn}
						className="hover:bg-transparent!"
					>
						Already have an account? Sign in
					</Button>
					<div className="text-center">
						<p className="text-muted-foreground text-xs">
							By creating an account, you agree to verify your email address
							first.
						</p>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
