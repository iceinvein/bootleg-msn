import { useState } from "react";
import { cn } from "@/lib/utils";
import type { YouTubeVideoInfo } from "../utils/youtubeUtils";

interface YouTubeEmbedProps {
	video: YouTubeVideoInfo;
	className?: string;
}

export function YouTubeEmbed({ video, className = "" }: YouTubeEmbedProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	const handlePlay = () => {
		setIsLoaded(true);
	};

	const handleError = () => {
		setHasError(true);
	};

	if (hasError) {
		return (
			<div
				className={cn(
					"rounded-lg border border-gray-200 bg-gray-50 p-4",
					className,
				)}
			>
				<div className="flex items-center space-x-2 text-gray-500">
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Warning icon"
					>
						<title>Warning</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<span className="text-sm">Failed to load YouTube video</span>
				</div>
				<a
					href={video.url}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-2 text-blue-500 text-sm hover:text-blue-600"
				>
					Open in YouTube
				</a>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-gray-200 bg-black",
				className,
			)}
		>
			{!isLoaded ? (
				<div className="relative">
					<img
						src={video.thumbnailUrl}
						alt="YouTube video thumbnail"
						className="h-48 w-full object-cover"
						onError={handleError}
					/>
					<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
						<button
							type="button"
							onClick={handlePlay}
							className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
							aria-label="Play YouTube video"
						>
							<svg
								className="ml-1 h-8 w-8"
								fill="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<title>Play button</title>
								<path d="M8 5v14l11-7z" />
							</svg>
						</button>
					</div>
					<div className="absolute right-2 bottom-2 rounded bg-black bg-opacity-75 px-2 py-1 text-white text-xs">
						YouTube
					</div>
				</div>
			) : (
				<div
					className="relative"
					style={{ paddingBottom: "56.25%", height: 0 }}
				>
					<iframe
						src={video.embedUrl}
						title="YouTube video player"
						className="absolute top-0 left-0 h-full w-full border-0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			)}
		</div>
	);
}
