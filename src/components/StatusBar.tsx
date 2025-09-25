import { api } from "@convex/_generated/api";
import type { userStatusValidator } from "@convex/validators";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type { Infer } from "convex/values";

import { Settings, User, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { useOverlays } from "@/hooks/useOverlays";

import { StatusMessage } from "./StatusMessage";
import { StatusSelector } from "./StatusSelector";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// End-to-end type safe status type
type StatusValue = Infer<typeof userStatusValidator>;

// End-to-end type safe user type
type UserType = NonNullable<FunctionReturnType<typeof api.auth.loggedInUser>>;

type StatusBarProps = {
	user: UserType;
};

export function StatusBar({ user }: StatusBarProps) {
	const [currentStatus, setCurrentStatus] = useState<StatusValue>("online");
	const avatarMap = useUserAvatarUrls([user._id]);
	const avatarUrl = avatarMap.get(user._id);
	const [statusMessage, setStatusMessage] = useState("");

	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);

	const updateStatus = useMutation(api.userStatus.updateStatus);
	const { open } = useOverlays();

	const handleStatusChange = async (status: StatusValue) => {
		setCurrentStatus(status);
		await updateStatus({ status, statusMessage });
	};

	const handleStatusMessageChange = async (message: string) => {
		setStatusMessage(message);
		await updateStatus({
			status: currentStatus,
			statusMessage: message,
		});
	};

	const displayName = user.name ?? "You";
	const totalRequestCount =
		(pendingRequests?.length ?? 0) + (sentRequests?.length ?? 0);

	// Overlay functions
	const showSettings = (initialTab = "account") => {
		open({
			type: "SETTINGS",
			props: {
				initialTab,
				onClose: () => {
					console.log("Settings closed");
				},
			},
		});
	};

	const showCreateGroup = () => {
		open({
			type: "CREATE_GROUP",
			props: {
				onGroupCreated: (group: unknown) => {
					console.log("Group created:", group);
				},
			},
		});
	};

	const showAddContact = () => {
		open({
			type: "ADD_CONTACT",
			props: {
				onContactAdded: (contact: unknown) => {
					console.log("Contact added:", contact);
				},
			},
		});
	};

	// Map broader status (which may include 'offline') to selectable set used by StatusSelector
	const toSelectableStatus = (
		s: StatusValue,
	): "online" | "away" | "busy" | "invisible" => {
		switch (s) {
			case "online":
			case "away":
			case "busy":
			case "invisible":
				return s;
			case "offline":
				return "invisible";
			default:
				return "invisible";
		}
	};

	return (
		<div className="bg-background/60 backdrop-blur-sm">
			<div className="transition-all duration-300 ease-in-out md:p-4">
				<div className="flex items-center space-x-3">
					<Avatar
						className="h-8 w-8 cursor-pointer border-2 border-white transition-opacity hover:opacity-80 md:h-10 md:w-10"
						title="Open Settings"
						aria-label="Open Settings"
						onClick={() => showSettings("account")}
					>
						{avatarUrl ? <AvatarImage key={avatarUrl} src={avatarUrl} /> : null}
						<AvatarFallback delayMs={0} className="text-xs md:text-sm">
							<User className="h-full w-full" />
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<h2 className="font-semibold text-sm md:text-base">
							{displayName}
						</h2>
						<StatusMessage
							initialStatus={statusMessage}
							onSave={handleStatusMessageChange}
						/>
					</div>
				</div>
				<div className="mt-2 flex flex-row justify-between gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="h-10 w-10 cursor-pointer"
						title="Add contact"
						aria-label="Add contact"
						onClick={showAddContact}
					>
						<UserPlus className="md:h-5! md:w-5!" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="relative h-10 w-10 cursor-pointer"
						title="Check Invites"
						aria-label="Check Invites"
						onClick={() => open({ type: "CONTACT_REQUESTS" })}
					>
						<UserCheck className="md:h-5! md:w-5!" />
						{totalRequestCount > 0 && (
							<Badge className="-top-1 -right-1 absolute h-5 w-5 bg-destructive p-0 text-destructive-foreground text-xs hover:bg-destructive">
								{totalRequestCount}
							</Badge>
						)}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-10 w-10 cursor-pointer"
						title="Create Group Chat"
						aria-label="Create Group Chat"
						onClick={showCreateGroup}
					>
						<Users className="md:h-5! md:w-5!" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-10 w-10 cursor-pointer"
						title="Settings"
						aria-label="Settings"
						onClick={() =>
							open({
								type: "SETTINGS",
								props: { onClose: () => console.log("Settings closed") },
							})
						}
					>
						<Settings className="md:h-5! md:w-5!" />
					</Button>
				</div>
			</div>

			<StatusSelector
				currentStatus={toSelectableStatus(currentStatus)}
				onStatusChange={(s) => handleStatusChange(s)}
			/>
		</div>
	);
}
