import { useAuthActions } from "@convex-dev/auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useMutation, useQuery } from "convex/react";
import {
	LogOutIcon,
	Settings,
	User,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { AddContactDialog } from "./AddContactDialog";
import { ContactRequestsDialog } from "./ContactRequestsDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { StatusMessage } from "./StatusMessage";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const statusOptions = [
	{ value: "online", label: "Online", color: "bg-green-500", emoji: "🟢" },
	{ value: "away", label: "Away", color: "bg-yellow-500", emoji: "🟡" },
	{ value: "busy", label: "Busy", color: "bg-red-500", emoji: "🔴" },
	{ value: "invisible", label: "Invisible", color: "bg-gray-500", emoji: "⚫" },
] as const;

type StatusValue = (typeof statusOptions)[number]["value"];

interface StatusBarProps {
	user: {
		_id: string;
		name?: string;
		email?: string;
	};
}

export function StatusBar({ user }: StatusBarProps) {
	const [currentStatus, setCurrentStatus] = useState<StatusValue>("online");
	const [statusMessage, setStatusMessage] = useState("");

	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);

	const updateStatus = useMutation(api.userStatus.updateStatus);
	const { signOut } = useAuthActions();

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

	const currentStatusOption =
		statusOptions.find((s) => s.value === currentStatus) || statusOptions[0];
	const displayName = user.name ?? "You";
	const totalRequestCount =
		(pendingRequests?.length ?? 0) + (sentRequests?.length ?? 0);

	return (
		<div>
			<div className="transition-all duration-300 ease-in-out md:p-4">
				<div className="flex items-center space-x-3">
					<Avatar className="h-8 w-8 border-2 border-white md:h-10 md:w-10">
						<AvatarImage src="/placeholder.svg?height=40&width=40" />
						<AvatarFallback className="text-xs md:text-sm">
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
					<AddContactDialog>
						<Button
							variant="ghost"
							size="sm"
							className="h-10 w-10 cursor-pointer"
							title="Add contact"
							aria-label="Add contact"
						>
							<UserPlus className="md:h-5! md:w-5!" />
						</Button>
					</AddContactDialog>
					<ContactRequestsDialog>
						<Button
							variant="ghost"
							size="sm"
							className="relative h-10 w-10 cursor-pointer"
							title="Check Invites"
							aria-label="Check Invites"
						>
							<UserCheck className="md:h-5! md:w-5!" />
							{totalRequestCount > 0 && (
								<Badge className="-top-1 -right-1 absolute h-5 w-5 bg-red-500 p-0 text-white text-xs hover:bg-red-500">
									{totalRequestCount}
								</Badge>
							)}
						</Button>
					</ContactRequestsDialog>
					<CreateGroupDialog>
						<Button
							variant="ghost"
							size="sm"
							className="h-10 w-10 cursor-pointer"
							title="Create Group Chat"
							aria-label="Create Group Chat"
						>
							<Users className="md:h-5! md:w-5!" />
						</Button>
					</CreateGroupDialog>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-10 w-10 cursor-pointer"
								title="Settings"
								aria-label="Settings"
							>
								<Settings className="md:h-5! md:w-5!" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => void signOut()}
							>
								<LogOutIcon className="mr-2 h-4 w-4" />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ThemeToggle />
				</div>
			</div>

			<Select
				onValueChange={handleStatusChange}
				value={currentStatusOption.value}
			>
				<SelectTrigger className="w-full cursor-pointer rounded-none">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					{statusOptions.map((status) => (
						<SelectItem key={status.value} value={status.value}>
							<span className="text-lg">{status.emoji}</span>
							<span className="text-sm">{status.label}</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
