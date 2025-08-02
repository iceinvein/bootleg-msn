// YouTube URL detection and parsing utilities

export interface YouTubeVideoInfo {
	videoId: string;
	url: string;
	thumbnailUrl: string;
	embedUrl: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
		/youtube\.com\/watch\?.*v=([^&\n?#]+)/,
		/youtube\.com\/v\/([^&\n?#]+)/,
		/youtube\.com\/embed\/([^&\n?#]+)/,
		/youtu\.be\/([^&\n?#]+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * Checks if a string contains a YouTube URL
 */
export function containsYouTubeUrl(text: string): boolean {
	const youtubeRegex =
		/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/gi;
	return youtubeRegex.test(text);
}

/**
 * Extracts YouTube URLs from text
 */
export function extractYouTubeUrls(text: string): string[] {
	const youtubeRegex =
		/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(?:\S+)?/gi;
	return text.match(youtubeRegex) || [];
}

/**
 * Gets YouTube video information from URL
 */
export function getYouTubeVideoInfo(url: string): YouTubeVideoInfo | null {
	const videoId = extractYouTubeVideoId(url);
	if (!videoId) return null;

	return {
		videoId,
		url,
		thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
		embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
	};
}

/**
 * Replaces YouTube URLs in text with placeholder markers
 */
export function replaceYouTubeUrls(text: string): {
	text: string;
	videos: YouTubeVideoInfo[];
} {
	const urls = extractYouTubeUrls(text);
	const videos: YouTubeVideoInfo[] = [];
	let processedText = text;

	urls.forEach((url, index) => {
		const videoInfo = getYouTubeVideoInfo(url);
		if (videoInfo) {
			videos.push(videoInfo);
			processedText = processedText.replace(url, `[YOUTUBE_VIDEO_${index}]`);
		}
	});

	return { text: processedText, videos };
}
