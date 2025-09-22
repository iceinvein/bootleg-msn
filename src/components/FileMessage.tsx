import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

type FileMessageProps = {
	fileId: Id<"_storage">;
	fileName: string;
	fileType: string;
	fileSize: number;
};

export function FileMessage({
	fileId,
	fileName,
	fileType,
	fileSize,
}: FileMessageProps) {
	const fileUrl = useQuery(api.files.getFileUrl, { fileId });

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const isImage = fileType.startsWith("image/");
	const isVideo = fileType.startsWith("video/");
	const isPdf = fileType === "application/pdf";

	if (!fileUrl) {
		return (
			<div className="max-w-xs rounded-lg border border-gray-200 bg-gray-100 p-3">
				<div className="flex items-center space-x-2">
					<div className="h-8 w-8 animate-pulse rounded bg-gray-300"></div>
					<div className="flex-1">
						<div className="mb-1 h-4 animate-pulse rounded bg-gray-300"></div>
						<div className="h-3 w-16 animate-pulse rounded bg-gray-300"></div>
					</div>
				</div>
			</div>
		);
	}

	if (isImage) {
		return (
			<div className="max-w-sm">
				<button
					type="button"
					onClick={() => window.open(fileUrl, "_blank")}
					className="block rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500"
					title="Click to open image in new tab"
				>
					<img
						src={fileUrl}
						alt={fileName}
						className="h-auto max-w-full rounded-lg"
					/>
				</button>
				<div className="mt-1 text-gray-500 text-xs">
					{fileName} • {formatFileSize(fileSize)}
				</div>
			</div>
		);
	}

	if (isVideo) {
		return (
			<div className="max-w-sm">
				<video
					src={fileUrl}
					controls
					className="h-auto max-w-full rounded-lg"
					preload="metadata"
				>
					<track
						kind="captions"
						src=""
						srcLang="en"
						label="No captions available"
						default
					/>
					Your browser does not support the video tag.
				</video>
				<div className="mt-1 text-gray-500 text-xs">
					{fileName} • {formatFileSize(fileSize)}
				</div>
			</div>
		);
	}

	// For other file types, show a download link
	return (
		<div className="max-w-xs rounded-lg border border-gray-200 bg-gray-50 p-3">
			<div className="flex items-center space-x-3">
				<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
					{isPdf ? (
						<svg
							className="h-6 w-6 text-red-600"
							fill="currentColor"
							viewBox="0 0 20 20"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
								clipRule="evenodd"
							/>
						</svg>
					) : (
						<svg
							className="h-6 w-6 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium text-gray-900 text-sm">
						{fileName}
					</div>
					<div className="text-gray-500 text-xs">
						{formatFileSize(fileSize)}
					</div>
				</div>
				<a
					href={fileUrl}
					download={fileName}
					className="p-1 text-blue-600 hover:text-blue-800"
					title="Download file"
				>
					<span className="-left-10000 -top-10000 absolute h-1 w-1 overflow-hidden">
						Download {fileName}
					</span>
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</a>
			</div>
		</div>
	);
}
