import { atom } from "nanostores";

export type ContactListDensity = "relaxed" | "compact";

const STORAGE_KEY = "ui-contact-list-density-v1";

function loadInitialDensity(): ContactListDensity {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === "compact" || v === "relaxed") return v;
	} catch {}
	return "relaxed";
}

export const $contactListDensity = atom<ContactListDensity>(
	loadInitialDensity(),
);

export function setContactListDensity(density: ContactListDensity) {
	try {
		localStorage.setItem(STORAGE_KEY, density);
	} catch {}
	$contactListDensity.set(density);
}
