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
