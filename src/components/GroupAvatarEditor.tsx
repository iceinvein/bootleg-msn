import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Image as ImageIcon, Trash2, Upload, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";

type GroupAvatarEditorProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupId: Id<"groups">;
	currentAvatarUrl?: string | undefined;
};

export function GroupAvatarEditor({
	open,
	onOpenChange,
	groupId,
	currentAvatarUrl,
}: GroupAvatarEditorProps) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [croppedPixels, setCroppedPixels] = useState<{
		width: number;
		height: number;
		x: number;
		y: number;
	} | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const setGroupAvatar = useMutation(api.avatars.setGroupAvatar);
	const clearGroupAvatar = useMutation(api.avatars.clearGroupAvatar);

	const ASPECT = 1; // square crop
	const OUTPUT_SIZE = 128; // 128x128 export

	useEffect(() => {
		if (!open) {
			// Reset when closed (do not reset currentAvatarUrl)
			setImageSrc(null);
			setZoom(1);
			setCrop({ x: 0, y: 0 });
			setCroppedPixels(null);
			setPreviewUrl(null);
		}
	}, [open]);

	const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
		setCroppedPixels(
			areaPixels as unknown as {
				x: number;
				y: number;
				width: number;
				height: number;
			},
		);
	}, []);

	// Throttled preview generation to keep UI responsive
	useEffect(() => {
		let raf = 0;
		if (imageSrc && croppedPixels) {
			raf = requestAnimationFrame(async () => {
				try {
					const blob = await cropToBlob(
						imageSrc,
						croppedPixels,
						OUTPUT_SIZE,
						OUTPUT_SIZE,
						"image/jpeg",
						0.9,
					);
					const url = URL.createObjectURL(blob);
					setPreviewUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev);
						return url;
					});
				} catch (_) {
					// ignore preview errors
				}
			});
		}
		return () => {
			if (raf) cancelAnimationFrame(raf);
		};
	}, [imageSrc, croppedPixels]);

	const onFile = async (file: File) => {
		if (!file.type.startsWith("image/")) return;
		const dataUrl = await fileToDataURL(file);
		setImageSrc(dataUrl);
	};

	const remove = async () => {
		await clearGroupAvatar({ groupId });
		onOpenChange(false);
	};

	const save = async () => {
		if (!imageSrc || !croppedPixels) return;
		setIsSaving(true);
		try {
			const blob = await cropToBlob(
				imageSrc,
				croppedPixels,
				OUTPUT_SIZE,
				OUTPUT_SIZE,
				"image/jpeg",
				0.9,
			);
			const uploadUrl = await generateUploadUrl({});
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": blob.type },
				body: blob,
			});
			if (!res.ok) throw new Error(`Upload failed ${res.status}`);
			const { storageId } = await res.json();
			await setGroupAvatar({
				groupId,
				fileId: storageId as unknown as Id<"_storage">,
			});
			onOpenChange(false);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files?.[0];
		if (file) await onFile(file);
	};

	const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = async (
		e,
	) => {
		const file = Array.from(e.clipboardData.files)[0];
		if (file) await onFile(file);
	};

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent className="sm:max-w-lg" glass={true}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center gap-2">
						<ImageIcon className="h-4 w-4" />
						Adjust group avatar
					</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<div
					className="grid gap-4"
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
					onPaste={handlePaste}
				>
					{/* Crop area and preview side-by-side on desktop, stacked on mobile */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
						<div className="relative h-64 w-full overflow-hidden rounded-md bg-muted">
							{imageSrc ? (
								<Cropper
									image={imageSrc}
									crop={crop}
									zoom={zoom}
									aspect={ASPECT}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onCropComplete={onCropComplete}
									restrictPosition={false}
									objectFit="contain"
									showGrid={false}
								/>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
									Drop, paste, or choose an image
								</div>
							)}
						</div>

						<div className="flex shrink-0 flex-col items-center gap-2">
							<div className="text-muted-foreground text-xs">
								Preview (128×128)
							</div>
							<div className="h-32 w-32 overflow-hidden rounded-full border">
								{previewUrl ? (
									<img
										src={previewUrl}
										alt="preview"
										className="h-full w-full object-cover"
									/>
								) : currentAvatarUrl ? (
									<img
										src={currentAvatarUrl}
										alt="current avatar"
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<Users className="h-10 w-10 opacity-60" />
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className="flex items-center gap-3">
						<span className="text-muted-foreground text-xs">Zoom</span>
						<input
							type="range"
							min={1}
							max={4}
							step={0.05}
							value={zoom}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="h-1 flex-1 cursor-pointer accent-primary"
						/>
						<Button variant="outline" size="sm" onClick={() => setZoom(1)}>
							Reset
						</Button>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<input
								ref={fileInputRef}
								id="group-avatar-file"
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) void onFile(f);
									if (fileInputRef.current) fileInputRef.current.value = "";
								}}
							/>
							<Button asChild variant="outline" size="sm">
								<label
									htmlFor="group-avatar-file"
									className="inline-flex cursor-pointer items-center gap-2"
								>
									<Upload className="h-4 w-4" /> Choose image
								</label>
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="border-destructive text-destructive hover:bg-destructive/10"
								onClick={remove}
							>
								<Trash2 className="mr-1 h-4 w-4" /> Remove
							</Button>
						</div>

						<ResponsiveDialogFooter className="sm:flex-row sm:justify-end">
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									onClick={() => onOpenChange(false)}
									disabled={isSaving}
								>
									Cancel
								</Button>
								<Button
									onClick={save}
									disabled={!imageSrc || !croppedPixels || isSaving}
								>
									{isSaving ? "Saving…" : "Save"}
								</Button>
							</div>
						</ResponsiveDialogFooter>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

async function fileToDataURL(file: File): Promise<string> {
	const r = new FileReader();
	return new Promise((resolve, reject) => {
		r.onload = () => resolve(r.result as string);
		r.onerror = reject;
		r.readAsDataURL(file);
	});
}

async function cropToBlob(
	imageSrc: string,
	area: { x: number; y: number; width: number; height: number },
	outW: number,
	outH: number,
	mime: string,
	quality = 0.92,
): Promise<Blob> {
	const img = await loadImage(imageSrc);
	const canvas = document.createElement("canvas");
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("no ctx");
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
			mime,
			quality,
		),
	);
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const i = new Image();
		i.onload = () => resolve(i);
		i.onerror = reject;
		i.src = src;
	});
}
