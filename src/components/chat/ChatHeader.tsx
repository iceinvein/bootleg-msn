import { useStore } from "@nanostores/react";
import { ArrowLeft, ExternalLink, Info, User, Users, X } from "lucide-react";
import { useOverlays } from "@/hooks/useOverlays";
import { useChatWindows, useTauri } from "@/hooks/useTauri";
import {
	$selectedGroupAvatarUrl,
	$selectedUserAvatarUrl,
} from "@/stores/avatars";
import { $isMessagesLoading, $selectedChat } from "@/stores/contact";
import { InlineStatusEditor } from "../InlineStatusEditor";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export type ChatHeaderProps = {
	onClose: () => void;
	hideBack?: boolean;
};

export function ChatHeader({ onClose, hideBack }: ChatHeaderProps) {
	const selectedChat = useStore($selectedChat);
	const isLoading = useStore($isMessagesLoading);
	const userAvatarUrl = useStore($selectedUserAvatarUrl);
	const groupAvatarUrl = useStore($selectedGroupAvatarUrl);
	const title = selectedChat?.group
		? selectedChat.group.name
		: selectedChat?.contact?.nickname ||
			selectedChat?.contact?.user?.name ||
			selectedChat?.contact?.user?.email ||
			"Unknown User";

	const { open } = useOverlays();
	const { isTauri: isTauriApp } = useTauri();
	const isChatOnlyWindow =
		typeof window !== "undefined" &&
		new URLSearchParams(window.location.search).get("window") === "chat";

	const { openChatWindow } = useChatWindows();

	const openInWindow = () => {
		if (!selectedChat) return;
		let chatId: string | null = null;
		let contactName: string = title;
		if (selectedChat.contact?.contactUserId) {
			chatId = `contact:${selectedChat.contact.contactUserId}`;
			contactName = title;
		} else if (selectedChat.group?._id) {
			chatId = `group:${selectedChat.group._id}`;
			contactName = selectedChat.group.name;
		}
		if (chatId) {
			openChatWindow(chatId, contactName);
		}
	};

	return (
		<div className="chat-header mx-4 mt-4 rounded-2xl border border-border bg-background/80 p-3 shadow-lg backdrop-blur-md md:p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					{!hideBack && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 md:hidden"
							onClick={onClose}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
					)}
					<div className="relative">
						<Avatar className="h-8 w-8 md:h-10 md:w-10">
							{isLoading ? (
								<div
									className="shimmer h-full w-full rounded-full bg-muted"
									aria-hidden
								/>
							) : selectedChat?.contact ? (
								userAvatarUrl ? (
									<AvatarImage src={userAvatarUrl} alt="User avatar" />
								) : (
									<AvatarFallback delayMs={0}>
										<User className="h-8 w-8 md:h-10 md:w-10" />
									</AvatarFallback>
								)
							) : groupAvatarUrl ? (
								<AvatarImage src={groupAvatarUrl} alt="Group avatar" />
							) : (
								<AvatarFallback delayMs={0}>
									<Users className="h-8 w-8 md:h-10 md:w-10" />
								</AvatarFallback>
							)}
						</Avatar>
					</div>
					<div className="min-w-0 flex-1">
						{selectedChat?.group ? (
							<InlineStatusEditor
								initialStatus={selectedChat.group.name}
								onSave={() => {}}
								placeholder="Group name"
								className="truncate rounded px-1 font-semibold text-gray-900 text-sm hover:bg-gray-100 md:text-base dark:text-gray-100 dark:hover:bg-gray-700"
								textColor="text-gray-900 dark:text-gray-100"
								maxLength={50}
							/>
						) : (
							<h3 className="truncate font-semibold text-gray-900 text-sm md:text-base dark:text-gray-100">
								{title}
							</h3>
						)}
						<p className="truncate px-1 text-gray-500 text-xs md:text-sm dark:text-gray-400">
							{selectedChat?.contact
								? selectedChat.contact.statusMessage
								: `${selectedChat?.group?.memberCount} members`}
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-1 md:space-x-2">
					{selectedChat?.group && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 md:h-10 md:w-10"
							onClick={() => {
								open({
									type: "GROUP_INFO",
									props: { group: selectedChat.group },
								});
							}}
						>
							<Info className="h-3 w-3 md:h-4 md:w-4" />
						</Button>
					)}

					{/* Tauri-only: Open in window */}
					{isTauriApp && !isChatOnlyWindow && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 md:h-10 md:w-10"
							title="Open in window"
							onClick={openInWindow}
						>
							<ExternalLink className="h-4 w-4 md:h-5 md:w-5" />
						</Button>
					)}

					{!hideBack && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 md:h-10 md:w-10 [&>svg]:h-4! [&>svg]:w-4! md:[&>svg]:h-6! md:[&>svg]:w-6!"
							title="Close chat"
							onClick={onClose}
						>
							<X className="h-4 w-4 md:h-6 md:w-6" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
