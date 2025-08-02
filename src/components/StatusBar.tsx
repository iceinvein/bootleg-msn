import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { SetNameModal } from "./SetNameModal";

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
	const [showStatusMenu, setShowStatusMenu] = useState(false);
	const [showNameModal, setShowNameModal] = useState(false);
	const updateStatus = useMutation(api.userStatus.updateStatus);

	const handleStatusChange = async (status: StatusValue) => {
		setCurrentStatus(status);
		setShowStatusMenu(false);
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
	const displayName = user.name || user.email || "Anonymous User";

	return (
		<div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-blue-600 text-lg">
						{displayName[0]?.toUpperCase() || "U"}
					</div>
					<div className="min-w-0 flex-1">
						<button
							type="button"
							onClick={() => setShowNameModal(true)}
							className="block w-full truncate text-left font-semibold transition-colors hover:text-blue-100"
							title="Click to change name"
						>
							{displayName}
						</button>
						<div className="text-blue-100 text-sm">MSN Messenger</div>
					</div>
				</div>
				<SignOutButton />
			</div>

			<div className="space-y-2">
				<div className="relative">
					<button
						type="button"
						onClick={() => setShowStatusMenu(!showStatusMenu)}
						className="flex w-full items-center space-x-2 rounded-md bg-white/20 px-3 py-2 text-left transition-colors hover:bg-white/30"
					>
						<span className="text-lg">{currentStatusOption.emoji}</span>
						<span className="text-sm">{currentStatusOption.label}</span>
						<span className="ml-auto text-xs">▼</span>
					</button>

					{showStatusMenu && (
						<div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border bg-white shadow-lg">
							{statusOptions.map((status) => (
								<button
									type="button"
									key={status.value}
									onClick={() => handleStatusChange(status.value)}
									className="flex w-full items-center space-x-2 px-3 py-2 text-left text-gray-700 first:rounded-t-md last:rounded-b-md hover:bg-gray-50"
								>
									<span>{status.emoji}</span>
									<span className="text-sm">{status.label}</span>
								</button>
							))}
						</div>
					)}
				</div>

				<input
					type="text"
					placeholder="What's your status message?"
					value={statusMessage}
					onChange={(e) => handleStatusMessageChange(e.target.value)}
					className="w-full rounded-md bg-white/20 px-3 py-2 text-sm text-white placeholder-blue-100 transition-colors focus:bg-white/30 focus:outline-none"
				/>
			</div>

			{showNameModal && (
				<SetNameModal
					currentName={user.name}
					onClose={() => setShowNameModal(false)}
				/>
			)}
		</div>
	);
}
