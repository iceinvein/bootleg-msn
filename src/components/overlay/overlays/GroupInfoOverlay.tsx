import { Info, Pencil, UserPlus, Users } from "lucide-react";
import { useCallback } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useGroupAvatarUrls } from "@/hooks/useAvatarUrls";
import { useOverlays } from "@/hooks/useOverlays";
import type { GroupInfoOverlayProps } from "@/types/overlay";

export function GroupInfoOverlay({
	group,
	onClose,
}: GroupInfoOverlayProps & { onClose?: () => void }) {
	const { open } = useOverlays();
	const groupAvatarMap = useGroupAvatarUrls(
		group?._id ? [group._id] : undefined,
	);
	const avatarUrl = group?._id ? groupAvatarMap.get(group._id) : undefined;

	const openAvatarEditor = useCallback(() => {
		if (!group?._id) return;
		open({
			type: "AVATAR_EDITOR",
			props: {
				entity: { type: "group", id: group._id },
				currentAvatarUrl: avatarUrl,
				previewShape: "circle",
			},
			persistInUrl: false,
		});
	}, [group, avatarUrl, open]);

	const openAddMembers = useCallback(() => {
		open({
			type: "ADD_MEMBERS",
			props: { groupId: group?._id },
			persistInUrl: false,
		});
	}, [group?._id, open]);

	if (!group) return null;

	return (
		<ResponsiveDialog
			open={true}
			onOpenChange={(o) => {
				if (!o) onClose?.();
			}}
		>
			<ResponsiveDialogContent className="max-h-[90vh] sm:max-w-2xl" glass>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle className="flex items-center gap-2">
						<Info className="h-5 w-5 text-primary" />
						Group Info
					</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Manage group settings and members.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<div className="space-y-6">
					<div className="flex items-center gap-4 rounded-lg border p-4">
						<Avatar className="h-16 w-16 border-2">
							{avatarUrl ? (
								<AvatarImage src={avatarUrl} />
							) : (
								<Users className="h-16 w-16 opacity-60" />
							)}
						</Avatar>
						<div className="flex-1">
							<div className="font-bold text-xl">{group.name}</div>
							{group.description ? (
								<div className="mt-1 text-muted-foreground">
									{group.description}
								</div>
							) : null}
						</div>
						<Button size="sm" onClick={openAvatarEditor}>
							<Pencil className="mr-2 h-4 w-4" /> Edit avatar
						</Button>
					</div>

					<div className="rounded-lg border p-4">
						<div className="mb-3 font-semibold">Members</div>
						<Button variant="outline" onClick={openAddMembers}>
							<UserPlus className="mr-2 h-4 w-4" /> Add Members
						</Button>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}
