import { useEffect, useRef } from "react";

interface MessageContextMenuProps {
	x: number;
	y: number;
	onEdit: () => void;
	onDelete: () => void;
	onClose: () => void;
	canEdit: boolean;
	canDelete: boolean;
}

export function MessageContextMenu({
	x,
	y,
	onEdit,
	onDelete,
	onClose,
	canEdit,
	canDelete,
}: MessageContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [onClose]);

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
			style={{
				left: x,
				top: y,
			}}
		>
			{canEdit && (
				<button
					type="button"
					onClick={() => {
						onEdit();
						onClose();
					}}
					className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
				>
					✏️ Edit
				</button>
			)}
			{canDelete && (
				<button
					type="button"
					onClick={() => {
						onDelete();
						onClose();
					}}
					className="w-full px-3 py-2 text-left text-red-600 text-sm hover:bg-red-50"
				>
					🗑️ Delete
				</button>
			)}
		</div>
	);
}
