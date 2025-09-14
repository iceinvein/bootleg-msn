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

const getStatusColorWithGlow = (status: UserStatus) => {
	switch (status) {
		case "online":
			return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] border-green-400";
		case "away":
			return "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] border-yellow-400";
		case "busy":
			return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] border-red-400";
		case "invisible":
		case "offline":
			return "bg-gray-400 border-gray-300";
		default:
			return "bg-gray-400 border-gray-300";
	}
};

const getMSNStatusIcon = (status: UserStatus) => {
	switch (status) {
		case "online":
			return "🟢";
		case "away":
			return "🟡";
		case "busy":
			return "🔴";
		case "invisible":
			return "⚫";
		case "offline":
			return "⚪";
		default:
			return "⚪";
	}
};

export { getStatusColor, getStatusColorWithGlow, getMSNStatusIcon };
