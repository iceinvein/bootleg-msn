import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	Image as ImageIcon,
	RotateCcw,
	RotateCw,
	Trash2,
	Upload,
	User,
	Users,
} from "lucide-react";
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

type AvatarEditorProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entity: { type: "group"; id: Id<"groups"> } | { type: "user" };
	currentAvatarUrl?: string | undefined;
	previewShape?: "circle" | "rounded" | "square"; // visual only; export stays square
};

export function AvatarEditor({
	open,
	onOpenChange,
	entity,
	currentAvatarUrl,
	previewShape = "circle",
}: AvatarEditorProps) {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0); // degrees
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
	const setUserAvatar = useMutation(api.avatars.setUserAvatar);
	const clearUserAvatar = useMutation(api.avatars.clearUserAvatar);

	const ASPECT = 1; // square crop
	const OUTPUT_SIZE = 128; // export 128x128

	useEffect(() => {
		if (!open) {
			setImageSrc(null);
			setZoom(1);
			setRotation(0);
			setCrop({ x: 0, y: 0 });
			setCroppedPixels(null);
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
	}, [open, previewUrl]);

	const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
		// react-easy-crop Area is { x, y, width, height }
		setCroppedPixels(
			areaPixels as unknown as {
				x: number;
				y: number;
				width: number;
				height: number;
			},
		);
	}, []);

	// Live preview generation
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
						rotation,
						"image/jpeg",
						0.9,
					);
					const url = URL.createObjectURL(blob);
					setPreviewUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev);
						return url;
					});
				} catch {
					// ignore preview errors
				}
			});
		}
		return () => {
			if (raf) cancelAnimationFrame(raf);
		};
	}, [imageSrc, croppedPixels, rotation]);

	const onFile = async (file: File) => {
		if (!file.type.startsWith("image/")) return;
		const dataUrl = await fileToDataURL(file);
		setImageSrc(dataUrl);
	};

	const remove = async () => {
		if (entity.type === "group") {
			await clearGroupAvatar({ groupId: entity.id });
		} else {
			await clearUserAvatar({});
		}
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
				rotation,
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
			if (entity.type === "group") {
				await setGroupAvatar({
					groupId: entity.id,
					fileId: storageId as unknown as Id<"_storage">,
				});
			} else {
				await setUserAvatar({ fileId: storageId as unknown as Id<"_storage"> });
			}
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

	const previewClass =
		previewShape === "circle"
			? "rounded-full"
			: previewShape === "rounded"
				? "rounded-md"
				: "";

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent className="sm:max-w-lg" glass={true}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center gap-2">
						<ImageIcon className="h-4 w-4" />
						Adjust {entity.type === "group" ? "group" : "your"} avatar
					</ResponsiveDialogTitle>
				</ResponsiveDialogHeader>

				<div
					className="grid gap-4"
					onDrop={handleDrop}
					onDragOver={(e) => e.preventDefault()}
					onPaste={handlePaste}
				>
					{/* Canvas + Preview */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
						<div className="relative h-64 w-full overflow-hidden rounded-md bg-muted">
							{imageSrc ? (
								<Cropper
									image={imageSrc}
									crop={crop}
									zoom={zoom}
									rotation={rotation}
									aspect={ASPECT}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onRotationChange={setRotation}
									onCropComplete={onCropComplete}
									restrictPosition={false}
									objectFit="contain"
									showGrid={false}
								/>
							) : currentAvatarUrl ? (
								<img
									src={currentAvatarUrl}
									alt="current avatar"
									className="h-full w-full object-cover"
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
							<div
								className={`h-32 w-32 overflow-hidden border ${previewClass}`}
							>
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
										{entity.type === "group" ? (
											<Users className="h-10 w-10 opacity-60" />
										) : (
											<User className="h-10 w-10 opacity-60" />
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className="flex flex-wrap items-center gap-3">
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
						<div className="mx-3 h-4 w-px bg-border" />
						<span className="text-muted-foreground text-xs">Rotate</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
						>
							<RotateCcw className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setRotation((r) => (r + 90) % 360)}
						>
							<RotateCw className="h-4 w-4" />
						</Button>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<input
								ref={fileInputRef}
								id="avatar-file-input"
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
									htmlFor="avatar-file-input"
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

// Draw rotated image to an intermediate canvas and then crop from it to the output size
async function cropToBlob(
	imageSrc: string,
	area: { x: number; y: number; width: number; height: number },
	outW: number,
	outH: number,
	rotationDeg: number,
	mime: string,
	quality = 0.92,
): Promise<Blob> {
	const img = await loadImage(imageSrc);
	const rotation = (rotationDeg * Math.PI) / 180;

	// Compute bounding box for rotated image
	const sin = Math.abs(Math.sin(rotation));
	const cos = Math.abs(Math.cos(rotation));
	const bW = Math.floor(img.width * cos + img.height * sin);
	const bH = Math.floor(img.width * sin + img.height * cos);

	// Draw rotated image to intermediate canvas
	const rCanvas = document.createElement("canvas");
	rCanvas.width = bW;
	rCanvas.height = bH;
	const rCtx = rCanvas.getContext("2d");
	if (!rCtx) throw new Error("no ctx");
	rCtx.imageSmoothingEnabled = true;
	rCtx.imageSmoothingQuality = "high";
	rCtx.translate(bW / 2, bH / 2);
	rCtx.rotate(rotation);
	rCtx.drawImage(img, -img.width / 2, -img.height / 2);

	// Now crop from rotated canvas to output
	const outCanvas = document.createElement("canvas");
	outCanvas.width = outW;
	outCanvas.height = outH;
	const oCtx = outCanvas.getContext("2d");
	if (!oCtx) throw new Error("no ctx");
	oCtx.imageSmoothingEnabled = true;
	oCtx.imageSmoothingQuality = "high";
	oCtx.drawImage(
		rCanvas,
		area.x,
		area.y,
		area.width,
		area.height,
		0,
		0,
		outW,
		outH,
	);

	return new Promise((resolve, reject) =>
		outCanvas.toBlob(
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
