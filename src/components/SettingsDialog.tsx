import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { VersionInfo } from "./VersionInfo";

interface SettingsDialogProps {
	children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
	const user = useQuery(api.auth.loggedInUser);
	const updateUserName = useMutation(api.auth.updateUserName);
	const { signOut } = useAuthActions();
	const [name, setName] = useState("");
	const [isUpdating, setIsUpdating] = useState(false);

	const handleUpdateName = async () => {
		if (!name.trim()) return;

		setIsUpdating(true);
		try {
			await updateUserName({ name: name.trim() });
		} catch (error) {
			console.error("Failed to update name:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	useEffect(() => {
		setName(user?.name ?? "");
	}, [user]);

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md dark:border-gray-600 dark:bg-gray-800">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Manage your account settings and preferences.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Profile Settings */}
					<div className="space-y-2">
						<Label htmlFor="name">Display Name</Label>
						<div className="flex items-center space-x-2">
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter your display name"
							/>
							<Button
								onClick={handleUpdateName}
								disabled={isUpdating || !name.trim() || name === user?.name}
								size="sm"
							>
								{isUpdating ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>

					{/* Account Info */}
					<div className="space-y-2">
						<Label>Email</Label>
						<div className="text-gray-600 text-sm dark:text-gray-400">
							{user?.email || "Not set"}
						</div>
					</div>

					<Separator />

					{/* Version Info */}
					<div className="space-y-2">
						<Label>Version Information</Label>
						<VersionInfo />
					</div>

					<Separator />

					{/* Actions */}
					<div className="flex justify-end">
						<Button
							variant="destructive"
							onClick={() => void signOut()}
							className="flex items-center space-x-2"
						>
							<LogOut className="h-4 w-4" />
							<span>Sign Out</span>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
