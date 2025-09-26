// Utility to normalize chat identifiers into canonical form "contact:<id>" | "group:<id>"
// Conservative behavior: if no recognized prefix is present, default to contact:<id>
export function normalizeChatId(input: string): string {
	const raw = String(input ?? "").trim();
	if (!raw) return "";

	const [maybeType, ...rest] = raw.split(":");
	if (rest.length > 0) {
		const id = rest.join(":");
		if (maybeType === "contact" || maybeType === "group") {
			return `${maybeType}:${id}`;
		}
	}

	// Fallback: assume contact id
	return `contact:${raw}`;
}

export function isCanonicalChatId(input: string): boolean {
	const raw = String(input ?? "");
	return raw.startsWith("contact:") || raw.startsWith("group:");
}
