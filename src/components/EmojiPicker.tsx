import { Coffee, Gamepad2, Heart, Search, Smile, Sun, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	ResponsivePopover,
	ResponsivePopoverContent,
	ResponsivePopoverTrigger,
} from "@/components/ui/responsive-popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmojiPickerProps = {
	onEmojiSelect: (emoji: string) => void;
	children: React.ReactNode;
};

// Improved typing for emojibase entries
type CompactEmojiRecord = {
	unicode?: string; // the unicode emoji character
	label?: string;
	group?: number; // numeric index that maps to groups.json
	tags?: string[];
};

// Emojibase groups metadata structure
type EmojibaseGroups = {
	groups: Record<string, string>;
	subgroups: Record<string, string>;
};

const CATEGORY_META = {
	recent: { icon: Heart, label: "Recent" }, // Using Heart as a placeholder, could use a clock icon
	smileys: { icon: Smile, label: "Smileys" },
	hearts: { icon: Heart, label: "Hearts" },
	activities: { icon: Zap, label: "Activities" },
	food: { icon: Coffee, label: "Food" },
	nature: { icon: Sun, label: "Nature" },
	objects: { icon: Gamepad2, label: "Objects" },
} as const;

type CategoryKey = keyof typeof CATEGORY_META;

// Group to category mapping for cleaner categorization
const GROUP_TO_CATEGORY: Record<string, CategoryKey> = {
	"smileys-emotion": "smileys",
	"people-body": "smileys",
	activities: "activities",
	"food-drink": "food",
	"animals-nature": "nature",
	objects: "objects",
};

// Helper function to categorize emoji
function categorizeEmoji(
	emoji: CompactEmojiRecord,
	groupNames: Record<string, string>,
): CategoryKey | null {
	if (!emoji.unicode) return null;

	const groupIndex = typeof emoji.group === "number" ? String(emoji.group) : "";
	const group =
		groupIndex && groupNames[groupIndex] ? groupNames[groupIndex] : "";
	const tags = emoji.tags || [];
	const label = emoji.label || "";

	// Exclude components (skin tones, modifiers)
	if (group === "component") return null;

	// Hearts: tag or label match for "heart"
	if (tags.some((t) => t.includes("heart")) || label.includes("heart")) {
		return "hearts";
	}

	// Group-based categorization
	return GROUP_TO_CATEGORY[group] || null;
}

// Recent emojis management
const RECENT_EMOJIS_KEY = "bootleg-msn-recent-emojis";
const MAX_RECENT_EMOJIS = 24;

function getRecentEmojis(): string[] {
	try {
		const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function addRecentEmoji(emoji: string): void {
	try {
		const recent = getRecentEmojis();
		const filtered = recent.filter((e) => e !== emoji);
		const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
		localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
	} catch {
		// Silently fail if localStorage is not available
	}
}

// Loading skeleton component
function EmojiPickerSkeleton() {
	return (
		<div className="w-full">
			{/* Skeleton tabs */}
			<div className="flex w-full rounded-none bg-muted p-[3px]">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items don't need stable keys
						key={i}
						className="h-8 flex-1 animate-pulse rounded-md bg-muted-foreground/20"
					/>
				))}
			</div>

			{/* Skeleton emoji grid */}
			<div className="p-3">
				<div className="grid grid-cols-6 gap-1.5 md:grid-cols-8 md:gap-1">
					{Array.from({ length: 48 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items don't need stable keys
							key={i}
							className="h-12 w-12 animate-pulse rounded-lg bg-muted-foreground/20 md:h-10 md:w-10"
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [emojiData, setEmojiData] = useState<CompactEmojiRecord[] | null>(null);
	const [groupNames, setGroupNames] = useState<Record<string, string> | null>(
		null,
	);
	const [activeTab, setActiveTab] = useState<CategoryKey>("recent");
	const [focusedEmojiIndex, setFocusedEmojiIndex] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
	const [loadingError, setLoadingError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	// Load recent emojis on mount and set initial tab
	useEffect(() => {
		const recent = getRecentEmojis();
		setRecentEmojis(recent);
		// If no recent emojis, start with smileys tab
		if (recent.length === 0) {
			setActiveTab("smileys");
		}
	}, []);

	// Lazy-load the dataset on first open
	useEffect(() => {
		if (!isOpen || emojiData) return;

		let cancelled = false;

		const loadEmojiData = async (attempt = 0) => {
			try {
				setLoadingError(null);

				const [dataMod, groupsMod] = await Promise.all([
					import(/* @vite-ignore */ "emojibase-data/en/compact.json"),
					import(/* @vite-ignore */ "emojibase-data/meta/groups.json"),
				]);

				if (cancelled) return;

				// Handle both ES modules and CommonJS modules
				const data = dataMod.default || dataMod;
				const groupsMeta = (groupsMod.default || groupsMod) as EmojibaseGroups;

				setEmojiData(data as CompactEmojiRecord[]);
				setGroupNames(groupsMeta.groups || {});
				setRetryCount(0);
			} catch (error) {
				console.error("Failed to load emoji dataset:", error);

				if (cancelled) return;

				const maxRetries = 3;
				if (attempt < maxRetries) {
					setRetryCount(attempt + 1);
					// Exponential backoff: 1s, 2s, 4s
					const delay = 2 ** attempt * 1000;
					setTimeout(() => {
						if (!cancelled) {
							loadEmojiData(attempt + 1);
						}
					}, delay);
				} else {
					setLoadingError("Failed to load emojis. Please try again.");
				}
			}
		};

		loadEmojiData();

		return () => {
			cancelled = true;
		};
	}, [isOpen, emojiData]);

	// Search functionality
	const searchResults = useMemo(() => {
		if (!searchQuery.trim() || !emojiData) return [];

		const query = searchQuery.toLowerCase().trim();
		return emojiData
			.filter((emoji) => {
				if (!emoji.unicode) return false;
				const label = (emoji.label || "").toLowerCase();
				const tags = (emoji.tags || []).join(" ").toLowerCase();
				return label.includes(query) || tags.includes(query);
			})
			.map((emoji) => emoji.unicode ?? "")
			.filter((unicode) => unicode !== "")
			.slice(0, 48); // Limit search results
	}, [searchQuery, emojiData]);

	const categories = useMemo(() => {
		const result: Record<CategoryKey, string[]> = {
			recent: recentEmojis,
			smileys: [],
			hearts: [],
			activities: [],
			food: [],
			nature: [],
			objects: [],
		};

		if (!emojiData || !groupNames) return result;

		for (const emoji of emojiData) {
			const category = categorizeEmoji(emoji, groupNames);
			if (category && emoji.unicode) {
				result[category].push(emoji.unicode);
			}
		}

		// Deduplicate and limit none; ScrollArea will handle overflow
		for (const key of Object.keys(result) as CategoryKey[]) {
			result[key] = Array.from(new Set(result[key]));
		}

		return result;
	}, [emojiData, groupNames, recentEmojis]);

	const handleEmojiClick = useCallback(
		(emoji: string) => {
			onEmojiSelect(emoji);
			addRecentEmoji(emoji);
			setRecentEmojis(getRecentEmojis()); // Update state to reflect changes
			setIsOpen(false);
		},
		[onEmojiSelect],
	);

	const handleRetry = () => {
		setLoadingError(null);
		setEmojiData(null);
		setGroupNames(null);
		setRetryCount(0);
		// The useEffect will trigger a reload when emojiData becomes null
	};

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (!emojiData) return;

			// If search is active, use search results, otherwise use category emojis
			const currentEmojis = searchQuery.trim()
				? searchResults
				: categories[activeTab];
			const cols = window.innerWidth >= 768 ? 8 : 6; // md breakpoint

			switch (event.key) {
				case "Escape":
					if (searchQuery.trim()) {
						setSearchQuery("");
						setFocusedEmojiIndex(0);
					} else {
						setIsOpen(false);
					}
					break;
				case "Enter":
					if (currentEmojis[focusedEmojiIndex]) {
						handleEmojiClick(currentEmojis[focusedEmojiIndex]);
					}
					break;
				case "ArrowRight":
					event.preventDefault();
					setFocusedEmojiIndex((prev) =>
						Math.min(prev + 1, currentEmojis.length - 1),
					);
					break;
				case "ArrowLeft":
					event.preventDefault();
					setFocusedEmojiIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "ArrowDown":
					event.preventDefault();
					setFocusedEmojiIndex((prev) =>
						Math.min(prev + cols, currentEmojis.length - 1),
					);
					break;
				case "ArrowUp":
					event.preventDefault();
					setFocusedEmojiIndex((prev) => Math.max(prev - cols, 0));
					break;
			}
		},
		[
			emojiData,
			categories,
			activeTab,
			focusedEmojiIndex,
			handleEmojiClick,
			searchQuery,
			searchResults,
		],
	);

	// Reset focused index when tab changes or search query changes
	useEffect(() => {
		setFocusedEmojiIndex(0);
	}, []);

	return (
		<ResponsivePopover open={isOpen} onOpenChange={setIsOpen}>
			<ResponsivePopoverTrigger asChild>{children}</ResponsivePopoverTrigger>
			<ResponsivePopoverContent
				className="w-[320px] rounded-2xl border-2 border-border p-0 shadow-xl md:w-96"
				align="end"
				sideOffset={8}
				title="Choose an emoji"
			>
				<div className="p-3 text-accent-foreground md:hidden">
					<h3 className="font-semibold text-sm">Choose an emoji</h3>
				</div>

				{loadingError ? (
					<div className="flex h-64 flex-col items-center justify-center gap-3 p-4 text-center">
						<div className="text-muted-foreground text-sm">{loadingError}</div>
						<Button
							onClick={handleRetry}
							variant="outline"
							size="sm"
							className="text-xs"
						>
							Try Again
						</Button>
					</div>
				) : emojiData ? (
					<div className="w-full">
						{/* Search input */}
						<div className="p-3 pb-2">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search emojis..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-10 border-muted-foreground/20 bg-muted/30 pl-10 text-sm transition-colors focus:border-primary/50 focus:bg-background"
									aria-label="Search emojis"
									role="searchbox"
								/>
								{searchQuery && (
									<Button
										variant="ghost"
										size="sm"
										className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0 hover:bg-muted"
										onClick={() => setSearchQuery("")}
										aria-label="Clear search"
									>
										×
									</Button>
								)}
							</div>
						</div>

						{/* Show search results or categories */}
						{searchQuery.trim() ? (
							<div className="px-3 pb-3">
								<div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Search Results ({searchResults.length})
								</div>
								<ScrollArea className="h-64">
									<div className="grid grid-cols-6 gap-1.5 md:grid-cols-8 md:gap-1">
										{searchResults.map((emoji, index) => (
											<Button
												key={`search-${emoji}`}
												variant="ghost"
												className={`h-12 w-12 cursor-pointer rounded-lg p-0 text-xl transition-all duration-150 hover:scale-110 hover:bg-accent/50 md:h-10 md:w-10 md:text-lg ${
													searchQuery.trim() && index === focusedEmojiIndex
														? "scale-105 border-2 border-primary/30 bg-primary/20 shadow-lg ring-2 ring-primary ring-inset"
														: ""
												}`}
												onClick={() => handleEmojiClick(emoji)}
												tabIndex={
													searchQuery.trim() && index === focusedEmojiIndex
														? 0
														: -1
												}
												aria-label={`Select ${emoji} emoji`}
												title={`${emoji} emoji`}
											>
												{emoji}
											</Button>
										))}
									</div>
									{searchResults.length === 0 && (
										<div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
											<Search className="h-8 w-8 text-muted-foreground/50" />
											<div className="text-muted-foreground text-sm">
												No emojis found for "{searchQuery}"
											</div>
											<div className="text-muted-foreground/70 text-xs">
												Try a different search term
											</div>
										</div>
									)}
								</ScrollArea>
							</div>
						) : (
							<Tabs
								value={activeTab}
								onValueChange={(value) => setActiveTab(value as CategoryKey)}
								className="w-full"
								onKeyDown={handleKeyDown}
							>
								<TabsList
									className="w-full rounded-none"
									role="tablist"
									aria-label="Emoji categories"
								>
									{(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
										const IconComponent = CATEGORY_META[key].icon;
										const label = CATEGORY_META[key].label;
										return (
											<TabsTrigger
												key={key}
												value={key}
												className="cursor-pointer"
												aria-label={`${label} emojis`}
												title={label}
											>
												<IconComponent className="h-4 w-4" />
											</TabsTrigger>
										);
									})}
								</TabsList>

								{(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => (
									<TabsContent key={key} value={key} className="mt-0">
										<ScrollArea className="h-64 p-3 md:h-64">
											<div
												className="m-0 grid grid-cols-6 gap-1.5 border-0 p-0 md:grid-cols-8 md:gap-1"
												ref={key === activeTab ? containerRef : null}
											>
												{categories[key].map((emoji, index) => (
													<Button
														key={`${key}-${emoji}`}
														variant="ghost"
														className={`h-12 w-12 cursor-pointer rounded-lg p-0 text-xl transition-all duration-150 hover:scale-110 hover:bg-accent/50 md:h-10 md:w-10 md:text-lg ${
															key === activeTab && index === focusedEmojiIndex
																? "scale-105 border-2 border-primary/30 bg-primary/20 shadow-lg ring-2 ring-primary ring-inset"
																: ""
														}`}
														onClick={() => handleEmojiClick(emoji)}
														tabIndex={
															key === activeTab && index === focusedEmojiIndex
																? 0
																: -1
														}
														aria-label={`Select ${emoji} emoji`}
														title={`${emoji} emoji`}
													>
														{emoji}
													</Button>
												))}
											</div>
										</ScrollArea>
									</TabsContent>
								))}
							</Tabs>
						)}
					</div>
				) : (
					<div className="w-full">
						<EmojiPickerSkeleton />
						{retryCount > 0 && (
							<div className="p-3 text-center text-muted-foreground text-xs">
								Retrying... (attempt {retryCount}/3)
							</div>
						)}
					</div>
				)}

				<div className="rounded-b-2xl border-t p-3">
					<p className="text-center text-muted-foreground text-xs">
						Click an emoji to add it to your message
					</p>
				</div>
			</ResponsivePopoverContent>
		</ResponsivePopover>
	);
}
