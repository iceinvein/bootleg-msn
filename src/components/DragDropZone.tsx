import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { type DragEvent, type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

interface DragDropZoneProps {
	children: ReactNode;
	receiverId?: Id<"users">;
	groupId?: Id<"groups">;
	onFileUploaded?: () => void;
}

export function DragDropZone({
	children,
	receiverId,
	groupId,
	onFileUploaded,
}: DragDropZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const dragCounter = useRef(0);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const sendFileMessage = useMutation(api.files.sendFileMessage);

	const handleDragEnter = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current++;

		if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
			setIsDragOver(true);
		}
	};

	const handleDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounter.current--;

		if (dragCounter.current === 0) {
			setIsDragOver(false);
		}
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		dragCounter.current = 0;

		const files = Array.from(e.dataTransfer.files);
		if (files.length === 0) return;

		// Handle multiple files
		for (const file of files) {
			await uploadFile(file);
		}
	};

	const uploadFile = async (file: File) => {
		// Check file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
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

			toast.success(`File "${file.name}" uploaded successfully!`);
			onFileUploaded?.();
		} catch (error) {
			toast.error(
				`Failed to upload "${file.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<section
			className="relative h-full"
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			aria-label="File drop zone"
			aria-describedby="drop-zone-description"
		>
			<div
				id="drop-zone-description"
				className="-left-10000 -top-10000 absolute h-1 w-1 overflow-hidden"
			>
				Drag and drop files here to upload them. Maximum file size is 10MB.
			</div>
			{children}

			{/* Drag overlay */}
			{isDragOver && (
				<div className="absolute inset-0 z-50 flex items-center justify-center border-2 border-blue-500 border-dashed bg-blue-500 bg-opacity-20">
					<div className="rounded-lg bg-white p-6 text-center shadow-xl">
						<div className="mb-4 text-4xl">📁</div>
						<div className="mb-2 font-semibold text-gray-900 text-lg">
							Drop files here to upload
						</div>
						<div className="text-gray-600 text-sm">
							Images, videos, documents (max 10MB each)
						</div>
					</div>
				</div>
			)}

			{/* Upload progress overlay */}
			{isUploading && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
					<div className="rounded-lg bg-white p-6 text-center shadow-xl">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
						<div className="font-semibold text-gray-900 text-lg">
							Uploading files...
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
