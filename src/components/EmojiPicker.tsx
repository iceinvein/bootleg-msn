"use client";

import { Coffee, Gamepad2, Heart, Smile, Sun, Zap } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsivePopover,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmojiPickerProps {
	onEmojiSelect: (emoji: string) => void;
	children: React.ReactNode;
}

const emojiCategories = {
	smileys: {
		icon: Smile,
		label: "Smileys",
		emojis: [
			"😀",
			"😃",
			"😄",
			"😁",
			"😆",
			"😅",
			"🤣",
			"😂",
			"🙂",
			"🙃",
			"😉",
			"😊",
			"😇",
			"🥰",
			"😍",
			"🤩",
			"😘",
			"😗",
			"😚",
			"😙",
			"😋",
			"😛",
			"😜",
			"🤪",
			"😝",
			"🤑",
			"🤗",
			"🤭",
			"🤫",
			"🤔",
			"🤐",
			"🤨",
			"😐",
			"😑",
			"😶",
			"😏",
			"😒",
			"🙄",
			"😬",
			"🤥",
			"😔",
			"😪",
			"🤤",
			"😴",
			"😷",
			"🤒",
			"🤕",
			"🤢",
			"🤮",
			"🤧",
			"🥵",
			"🥶",
			"🥴",
			"😵",
			"🤯",
			"🤠",
			"🥳",
			"😎",
			"🤓",
			"🧐",
		],
	},
	hearts: {
		icon: Heart,
		label: "Hearts",
		emojis: [
			"❤️",
			"🧡",
			"💛",
			"💚",
			"💙",
			"💜",
			"🖤",
			"🤍",
			"🤎",
			"💔",
			"❣️",
			"💕",
			"💞",
			"💓",
			"💗",
			"💖",
			"💘",
			"💝",
			"💟",
			"♥️",
			"💋",
			"💌",
			"💐",
			"🌹",
			"🌷",
			"🌺",
			"🌸",
			"🌻",
			"🌼",
			"💒",
		],
	},
	activities: {
		icon: Zap,
		label: "Activities",
		emojis: [
			"⚽",
			"🏀",
			"🏈",
			"⚾",
			"🥎",
			"🎾",
			"🏐",
			"🏉",
			"🥏",
			"🎱",
			"🪀",
			"🏓",
			"🏸",
			"🏒",
			"🏑",
			"🥍",
			"🏏",
			"🪃",
			"🥅",
			"⛳",
			"🪁",
			"🏹",
			"🎣",
			"🤿",
			"🥊",
			"🥋",
			"🎽",
			"🛹",
			"🛷",
			"⛸️",
		],
	},
	food: {
		icon: Coffee,
		label: "Food",
		emojis: [
			"🍎",
			"🍐",
			"🍊",
			"🍋",
			"🍌",
			"🍉",
			"🍇",
			"🍓",
			"🫐",
			"🍈",
			"🍒",
			"🍑",
			"🥭",
			"🍍",
			"🥥",
			"🥝",
			"🍅",
			"🍆",
			"🥑",
			"🥦",
			"🥬",
			"🥒",
			"🌶️",
			"🫑",
			"🌽",
			"🥕",
			"🫒",
			"🧄",
			"🧅",
			"🥔",
			"🍠",
			"🥐",
			"🥖",
			"🍞",
			"🥨",
			"🥯",
			"🧀",
			"🥚",
			"🍳",
			"🧈",
		],
	},
	nature: {
		icon: Sun,
		label: "Nature",
		emojis: [
			"🌱",
			"🌿",
			"☘️",
			"🍀",
			"🎍",
			"🎋",
			"🍃",
			"🍂",
			"🍁",
			"🍄",
			"🐚",
			"🌾",
			"💐",
			"🌷",
			"🌹",
			"🥀",
			"🌺",
			"🌸",
			"🌼",
			"🌻",
			"🌞",
			"🌝",
			"🌛",
			"🌜",
			"🌚",
			"🌕",
			"🌖",
			"🌗",
			"🌘",
			"🌑",
			"🌒",
			"🌓",
			"🌔",
			"🌙",
			"🌎",
			"🌍",
			"🌏",
			"🪐",
			"💫",
			"⭐",
		],
	},
	objects: {
		icon: Gamepad2,
		label: "Objects",
		emojis: [
			"⌚",
			"📱",
			"📲",
			"💻",
			"⌨️",
			"🖥️",
			"🖨️",
			"🖱️",
			"🖲️",
			"🕹️",
			"🗜️",
			"💽",
			"💾",
			"💿",
			"📀",
			"📼",
			"📷",
			"📸",
			"📹",
			"🎥",
			"📽️",
			"🎞️",
			"📞",
			"☎️",
			"📟",
			"📠",
			"📺",
			"📻",
			"🎙️",
			"🎚️",
			"🎛️",
			"🧭",
			"⏱️",
			"⏲️",
			"⏰",
			"🕰️",
			"⌛",
			"⏳",
			"📡",
			"🔋",
		],
	},
};

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const handleEmojiClick = (emoji: string) => {
		onEmojiSelect(emoji);
		setIsOpen(false);
	};

	return (
		<ResponsivePopover open={isOpen} onOpenChange={setIsOpen}>
			<ResponsivePopoverTrigger asChild>{children}</ResponsivePopoverTrigger>
			<ResponsivePopoverContent
				className="w-80 rounded-2xl border-2 border-border p-0 shadow-xl md:w-80"
				align="end"
				sideOffset={8}
				title="Choose an emoji"
			>
				<div className="p-3 text-accent-foreground md:hidden">
					<h3 className="font-semibold text-sm">Choose an emoji</h3>
				</div>

				<Tabs defaultValue="smileys" className="w-full">
					<TabsList className="w-full rounded-none">
						{Object.entries(emojiCategories).map(([key, category]) => {
							const IconComponent = category.icon;
							return (
								<TabsTrigger key={key} value={key} className="cursor-pointer">
									<IconComponent className="h-4 w-4" />
								</TabsTrigger>
							);
						})}
					</TabsList>

					{Object.entries(emojiCategories).map(([key, category]) => (
						<TabsContent key={key} value={key} className="mt-0">
							<ScrollArea className="h-64 p-3 md:h-64">
								<div className="grid grid-cols-8 gap-1 md:grid-cols-8">
									{category.emojis.map((emoji) => (
										<Button
											key={`${key}-${emoji}`}
											variant="ghost"
											className="h-10 w-10 cursor-pointer rounded-lg p-0 text-lg transition-all duration-150 hover:scale-110 md:h-10 md:w-10"
											onClick={() => handleEmojiClick(emoji)}
										>
											{emoji}
										</Button>
									))}
								</div>
							</ScrollArea>
						</TabsContent>
					))}
				</Tabs>

				<div className="rounded-b-2xl border-t p-3">
					<p className="text-center text-muted-foreground text-xs">
						Click an emoji to add it to your message
					</p>
				</div>
			</ResponsivePopoverContent>
		</ResponsivePopover>
	);
}
