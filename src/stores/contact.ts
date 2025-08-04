import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { atom } from "nanostores";

export type Contact = FunctionReturnType<
	typeof api.contacts.getContacts
>[number];

export type Group = FunctionReturnType<typeof api.groups.getUserGroups>[number];

type SelectedChat = {
	contact: Contact | null;
	group: Group | null;
};

export const $selectedChat = atom<SelectedChat | null>(null);
