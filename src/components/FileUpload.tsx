import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface FileUploadProps {
	receiverId?: Id<"users">;
	groupId?: Id<"groups">;
	onFileUploaded?: () => void;
}

export function FileUpload({
	receiverId,
	groupId,
	onFileUploaded,
}: FileUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const sendFileMessage = useMutation(api.files.sendFileMessage);

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			toast.error("File size must be less than 10MB");
			return;
		}

		setIsUploading(true);

		try {
			// Step 1: Get upload URL
			const uploadUrl = await generateUploadUrl();

			// Step 2: Upload file
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) {
				throw new Error("Upload failed");
			}

			const { storageId } = await result.json();

			// Step 3: Send file message
			await sendFileMessage({
				receiverId,
				groupId,
				fileId: storageId,
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size,
			});

			toast.success("File uploaded successfully!");
			onFileUploaded?.();

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to upload file",
			);
		} finally {
			setIsUploading(false);
		}
	};

	const triggerFileSelect = () => {
		fileInputRef.current?.click();
	};

	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				onChange={handleFileSelect}
				className="hidden"
				accept="image/*,video/*,.pdf,.doc,.docx,.txt"
				aria-label="Upload file"
			/>
			<button
				type="button"
				onClick={triggerFileSelect}
				disabled={isUploading}
				className="p-2 text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50"
				title="Upload file"
			>
				{isUploading ? (
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
				) : (
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
							d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
						/>
					</svg>
				)}
			</button>
		</>
	);
}
