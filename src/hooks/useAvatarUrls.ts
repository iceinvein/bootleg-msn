import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useUserAvatarUrls(userIds: Id<"users">[] | undefined) {
	const ids = userIds?.length ? userIds : undefined;
	const results = useQuery(
		api.avatars.getManyUserAvatars,
		ids ? { userIds: ids } : "skip",
	);
	const map = new Map<Id<"users">, string>();
	if (results) {
		for (const r of results) {
			if (r.url) map.set(r.userId as Id<"users">, r.url);
		}
	}
	return map;
}

export function useGroupAvatarUrls(groupIds: Id<"groups">[] | undefined) {
	const ids = groupIds?.length ? groupIds : undefined;
	const results = useQuery(
		api.avatars.getManyGroupAvatars,
		ids ? { groupIds: ids } : "skip",
	);
	const map = new Map<Id<"groups">, string>();
	if (results) {
		for (const r of results) {
			if (r.url) map.set(r.groupId as Id<"groups">, r.url);
		}
	}
	return map;
}
