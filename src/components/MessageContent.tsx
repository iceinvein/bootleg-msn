import type { messageTypeValidator } from "@convex/validators";
import type { Infer } from "convex/values";
import { cn } from "@/lib/utils";
import { containsYouTubeUrl, replaceYouTubeUrls } from "../utils/youtubeUtils";
import { YouTubeEmbed } from "./YouTubeEmbed";

// End-to-end type safe message type (includes "system" which is in schema but not validator)
type MessageType = Infer<typeof messageTypeValidator> | "system";

interface MessageContentProps {
	content: string;
	messageType: MessageType;
	isEmojiOnly?: boolean;
	className?: string;
}

export function MessageContent({
	content,
	messageType,
	isEmojiOnly = false,
	className = "",
}: MessageContentProps) {
	// Handle emoji messages
	if (messageType === "emoji" || isEmojiOnly) {
		return <div className={cn("text-3xl", className)}>{content}</div>;
	}

	// Handle system messages
	if (messageType === "system") {
		return <div className={cn("text-gray-600", className)}>{content}</div>;
	}

	// Handle text messages with potential YouTube links
	if (messageType === "text" && containsYouTubeUrl(content)) {
		const { text, videos } = replaceYouTubeUrls(content);

		return (
			<div className={cn("space-y-3", className)}>
				{/* Render text with YouTube placeholders replaced */}
				{text.split(/(\[YOUTUBE_VIDEO_\d+\])/).map((part) => {
					const videoMatch = part.match(/\[YOUTUBE_VIDEO_(\d+)\]/);
					if (videoMatch) {
						const videoIndex = parseInt(videoMatch[1], 10);
						const video = videos[videoIndex];
						if (video) {
							return (
								<YouTubeEmbed
									key={`video-${video.videoId}`}
									video={video}
									className="max-w-sm"
								/>
							);
						}
					}

					return null;
				})}
			</div>
		);
	}

	// Handle regular text messages
	return <div className={cn("break-words", className)}>{content}</div>;
}
