import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

type FileUploadProps = {
	receiverId?: Id<"users">;
	groupId?: Id<"groups">;
	onFileUploaded?: () => void;
};

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
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-8 w-8 flex-shrink-0 md:h-10 md:w-10"
				onClick={triggerFileSelect}
				disabled={isUploading}
				title="Upload file"
			>
				<Paperclip className="h-3 w-3 md:h-4 md:w-4" />
			</Button>
		</>
	);
}
