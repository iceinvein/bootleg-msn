import { atom, computed } from "nanostores";
import { $selectedGroupId, $selectedUserId } from "./contact";

// Avatar URL maps - these would be populated by the components that fetch avatar data
export const $userAvatarMap = atom<Map<string, string>>(new Map());
export const $groupAvatarMap = atom<Map<string, string>>(new Map());

// Derived avatar URLs for the selected chat
export const $selectedUserAvatarUrl = computed(
	[$selectedUserId, $userAvatarMap],
	(userId, avatarMap) => (userId ? avatarMap.get(userId) : undefined),
);

export const $selectedGroupAvatarUrl = computed(
	[$selectedGroupId, $groupAvatarMap],
	(groupId, avatarMap) => (groupId ? avatarMap.get(groupId) : undefined),
);

// Helper functions to update avatar maps
export const setUserAvatars = (avatars: Map<string, string>) => {
	$userAvatarMap.set(avatars);
};

export const setGroupAvatars = (avatars: Map<string, string>) => {
	$groupAvatarMap.set(avatars);
};
