import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useStore } from "@nanostores/react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { User, Users } from "lucide-react";
import { useGroupAvatarUrls, useUserAvatarUrls } from "@/hooks/useAvatarUrls";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { getStatusColorWithGlow } from "@/utils/style";
import {
	hoverScale,
	staggerContainer,
	staggerItem,
	statusPulse,
	tapScale,
} from "./ui/animated";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

// Helper function to format last seen time
function formatLastSeen(lastSeen: number | undefined, status: string): string {
	if (!lastSeen) return "Never";

	if (status === "online") return "Now";

	const now = Date.now();
	const diff = now - lastSeen;

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return "Long time ago";
}

// Helper function to format message timestamp
function formatMessageTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const date = new Date(timestamp);

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "Now";
	if (minutes < 60) return `${minutes}m`;
	if (hours < 24) return `${hours}h`;
	if (days < 7) return `${days}d`;

	// For older messages, show actual time
	const today = new Date();
	const isToday = date.toDateString() === today.toDateString();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const isYesterday = date.toDateString() === yesterday.toDateString();

	if (isToday) {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	} else if (isYesterday) {
		return "Yesterday";
	} else {
		return date.toLocaleDateString([], { month: "short", day: "numeric" });
	}
}

// Helper function to get status display text
function getStatusDisplayText(status: string, statusMessage?: string): string {
	if (statusMessage) return statusMessage;

	switch (status) {
		case "online":
			return "Online";
		case "away":
			return "Away";
		case "busy":
			return "Busy";
		case "invisible":
			return "Invisible";
		case "offline":
			return "Offline";
		default:
			return "Unknown";
	}
}

export function ContactList() {
	const selectedChat = useStore($selectedChat);

	const contacts = useQuery(api.contacts.getContacts);
	const groupChats = useQuery(api.groups.getUserGroups);

	const contactUserIds = contacts?.map((c) => c.contactUserId) as
		| Id<"users">[]
		| undefined;
	const groupIds = groupChats
		?.map((g) => g?._id)
		.filter((id): id is Id<"groups"> => Boolean(id));
	const avatarUrls = useUserAvatarUrls(contactUserIds);
	const groupAvatarUrls = useGroupAvatarUrls(
		groupIds as Id<"groups">[] | undefined,
	);

	return (
		<ScrollArea className="flex-1">
			<motion.div
				className="p-1 md:p-2"
				variants={staggerContainer}
				initial="initial"
				animate="animate"
			>
				{/* Groups Section */}
				{!!groupChats?.length && (
					<>
						<motion.div
							className="mt-2 px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide"
							variants={staggerItem}
						>
							Groups ({groupChats.length})
						</motion.div>
						<AnimatePresence>
							{groupChats?.map((group, index) => {
								if (!group) return null;
								return (
									<motion.button
										type="button"
										key={group._id}
										className={cn(
											"contact-item group glass relative flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 hover:shadow-md md:gap-4 md:p-4",
											selectedChat?.group?._id === group._id && "selected",
										)}
										onClick={() =>
											$selectedChat.set({
												contact: null,
												group,
											})
										}
										variants={staggerItem}
										whileHover={hoverScale}
										whileTap={tapScale}
										custom={index}
									>
										{/* Accent bar */}
										<span
											className={cn(
												"-translate-y-1/2 msn-gradient absolute top-1/2 left-0 h-8 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
												selectedChat?.group?._id === group._id && "opacity-100",
											)}
										/>

										<div className="relative shrink-0">
											<Avatar
												className={cn(
													"msn-gradient h-12 w-12 md:h-14 md:w-14",
													selectedChat?.group?._id === group._id &&
														"ring-2 ring-primary/40",
												)}
											>
												{groupAvatarUrls.get(group._id) ? (
													<AvatarImage src={groupAvatarUrls.get(group._id)} />
												) : (
													<Users className="h-10 w-10 text-white md:h-12 md:w-12" />
												)}
											</Avatar>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<p className="truncate font-semibold text-foreground text-sm md:text-base">
													{group.name}
												</p>
												<div className="flex items-center gap-2">
													{!!group.unreadCount && (
														<div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
															{group.unreadCount > 9 ? "9+" : group.unreadCount}
														</div>
													)}
												</div>
											</div>
											<div className="mt-1 flex items-center justify-between">
												<p className="truncate text-muted-foreground text-xs md:text-sm">
													{typeof group.memberCount === "number"
														? `${group.memberCount} members`
														: "Group chat"}
												</p>
												<span className="text-muted-foreground text-xs">
													{group.lastMessageTime
														? formatMessageTime(group.lastMessageTime)
														: "No messages"}
												</span>
											</div>
										</div>
									</motion.button>
								);
							})}
						</AnimatePresence>
					</>
				)}

				{/* Contacts Section */}
				<motion.div
					className="mt-4 px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide"
					variants={staggerItem}
				>
					Contacts ({contacts?.filter((c) => c.status !== "offline").length}{" "}
					online)
				</motion.div>
				<AnimatePresence>
					{contacts?.map((contact, index) => {
						if (!contact.user || !contact.user._id) return null;

						return (
							<motion.button
								type="button"
								key={contact._id}
								className={cn(
									"contact-item group glass relative mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 hover:shadow-md md:gap-4 md:p-4",
									selectedChat?.contact?._id === contact?._id && "selected",
								)}
								onClick={() =>
									$selectedChat.set({
										contact,
										group: null,
									})
								}
								variants={staggerItem}
								whileHover={hoverScale}
								whileTap={tapScale}
								custom={index}
							>
								{/* Accent bar */}
								<span
									className={cn(
										"-translate-y-1/2 msn-gradient absolute top-1/2 left-0 h-8 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
										selectedChat?.contact?._id === contact?._id &&
											"opacity-100",
									)}
								/>

								<div className="relative shrink-0">
									<Avatar
										className={cn(
											"msn-gradient h-12 w-12 md:h-14 md:w-14",
											selectedChat?.contact?._id === contact?._id &&
												"ring-2 ring-primary/40",
										)}
									>
										{avatarUrls.get(contact.contactUserId) ? (
											<AvatarImage
												src={avatarUrls.get(contact.contactUserId)}
											/>
										) : (
											<AvatarFallback delayMs={0}>
												<User className="h-10 w-10 text-white md:h-12 md:w-12" />
											</AvatarFallback>
										)}
									</Avatar>
									<motion.div
										className={`-bottom-0.5 -right-0.5 absolute h-3.5 w-3.5 rounded-full border-2 border-background md:h-4 md:w-4 ${getStatusColorWithGlow(contact.status)}`}
										variants={statusPulse}
										animate={
											contact.status === "online" ? "animate" : "initial"
										}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between">
										<p className="truncate font-semibold text-foreground text-sm md:text-base">
											{contact.nickname ??
												contact.user?.name ??
												contact.user?.email ??
												"Unknown User"}
										</p>
										<div className="flex items-center gap-2">
											{contact.status !== "offline" && (
												<span
													className={cn(
														"font-medium text-xs",
														contact.status === "online" && "text-green-500",
														contact.status === "away" && "text-yellow-500",
														contact.status === "busy" && "text-red-500",
														contact.status === "invisible" && "text-gray-500",
													)}
												>
													{contact.status.charAt(0).toUpperCase() +
														contact.status.slice(1)}
												</span>
											)}
											{!!contact.unreadCount && (
												<div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 font-bold text-white text-xs">
													{contact.unreadCount > 9 ? "9+" : contact.unreadCount}
												</div>
											)}
										</div>
									</div>
									<div className="mt-1 flex items-center justify-between">
										<p className="truncate text-muted-foreground text-xs md:text-sm">
											{getStatusDisplayText(
												contact.status,
												contact.statusMessage,
											)}
										</p>
										<span className="text-muted-foreground text-xs">
											{formatLastSeen(contact.lastSeen, contact.status)}
										</span>
									</div>
								</div>
							</motion.button>
						);
					})}
				</AnimatePresence>
			</motion.div>
		</ScrollArea>
	);
}
