import { api } from "@convex/_generated/api";
import { useStore } from "@nanostores/react";
import { useQuery } from "convex/react";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { $selectedChat } from "@/stores/contact";
import { getStatusColorWithGlow } from "@/utils/style";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

export function ContactList() {
	const selectedChat = useStore($selectedChat);

	const contacts = useQuery(api.contacts.getContacts);
	const groupChats = useQuery(api.groups.getUserGroups);

	return (
		<ScrollArea className="flex-1">
			<div className="p-1 md:p-2">
				{/* Groups Section */}
				{!!groupChats?.length && (
					<>
						<div className="px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
							Groups ({groupChats.length})
						</div>
						{groupChats?.map((group) => (
							<button
								type="button"
								key={group?._id}
								className={cn(
									"relative flex w-full cursor-pointer items-center space-x-3 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] hover:bg-muted/50 active:scale-[0.98] md:p-3",
									selectedChat?.group?._id === group?._id &&
										"border border-primary/20 bg-primary/10 text-primary shadow-lg",
								)}
								onClick={() =>
									$selectedChat.set({
										contact: null,
										group,
									})
								}
							>
								<div className="relative">
									<Avatar className="msn-gradient h-10 w-10 md:h-12 md:w-12">
										<Users className="h-10 w-10 text-white md:h-12 md:w-12" />
									</Avatar>
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center space-x-2">
										<p className="truncate font-medium text-foreground text-sm md:text-base">
											{group?.name}
										</p>
									</div>
								</div>
								{!!group?.unreadCount && (
									<Badge
										variant="secondary"
										className="absolute top-2 right-2 hidden bg-red-500 text-white text-xs sm:inline-flex"
									>
										{group?.unreadCount}
									</Badge>
								)}
							</button>
						))}
						<div className="my-2 border-border border-b"></div>
					</>
				)}

				{/* Contacts Section */}
				<div className="px-2 py-1 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
					Contacts ({contacts?.filter((c) => c.status !== "offline").length}{" "}
					online)
				</div>
				{contacts?.map((contact) => {
					if (!contact.user || !contact.user._id) return null;

					return (
						<button
							type="button"
							key={contact._id}
							className={cn(
								"relative flex w-full cursor-pointer items-center space-x-3 rounded-lg p-2 transition-all duration-200 hover:scale-[1.02] hover:bg-muted/50 active:scale-[0.98] md:p-3",
								selectedChat?.contact?._id === contact?._id &&
									"border border-primary/20 bg-primary/10 text-primary shadow-lg",
							)}
							onClick={() =>
								$selectedChat.set({
									contact,
									group: null,
								})
							}
						>
							<div className="relative">
								<Avatar className="h-10 w-10 md:h-12 md:w-12">
									<User className="h-10 w-10 md:h-12 md:w-12" />
								</Avatar>
								<div
									className={`-bottom-1 -right-1 absolute h-3 w-3 rounded-full border-2 border-white md:h-4 md:w-4 ${getStatusColorWithGlow(contact.status)}`}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-center space-x-2">
									<p className="truncate font-medium text-gray-900 text-sm md:text-base dark:text-gray-100">
										{contact.nickname ??
											contact.user?.name ??
											contact.user?.email ??
											"Unknown User"}
									</p>
								</div>
								{contact.statusMessage && (
									<p className="truncate text-gray-500 text-xs md:text-sm dark:text-gray-400">
										{contact.statusMessage}
									</p>
								)}
							</div>
							{!!contact.unreadCount && (
								<Badge
									variant="secondary"
									className="absolute top-2 right-2 hidden bg-red-500 text-white text-xs sm:inline-flex"
								>
									{contact.unreadCount}
								</Badge>
							)}
						</button>
					);
				})}
			</div>
		</ScrollArea>
	);
}
