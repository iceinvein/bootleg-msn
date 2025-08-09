import type { userStatusValidator } from "@convex/validators";
import type { Infer } from "convex/values";

// End-to-end type safe status type
type UserStatus = Infer<typeof userStatusValidator>;

const getStatusColor = (status: UserStatus) => {
	switch (status) {
		case "online":
			return "bg-green-500";
		case "away":
			return "bg-yellow-500";
		case "busy":
			return "bg-red-500";
		case "invisible":
		case "offline":
			return "bg-gray-400";
		default:
			return "bg-gray-400";
	}
};

export { getStatusColor };
