const formatTime = (date: Date | number) => {
	if (typeof date === "number") {
		date = new Date(date);
	}
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;

	return `${days}d ago`;
};

export { formatTime };

// Absolute, short timestamp: "2:45 PM" if today, else "Jan 3, 2:45 PM"
export const formatShortTime = (ts: number) => {
	const d = new Date(ts);
	const now = new Date();
	const isSameDay =
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate();
	const time = d.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
	if (isSameDay) return time;
	const date = d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
	return `${date}, ${time}`;
};
