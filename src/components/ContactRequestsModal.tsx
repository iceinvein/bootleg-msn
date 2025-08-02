import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface ContactRequestsModalProps {
	onClose: () => void;
}

export function ContactRequestsModal({ onClose }: ContactRequestsModalProps) {
	const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

	const pendingRequests = useQuery(api.contacts.getPendingRequests);
	const sentRequests = useQuery(api.contacts.getSentRequests);
	const acceptContactRequest = useMutation(api.contacts.acceptContactRequest);
	const rejectContactRequest = useMutation(api.contacts.rejectContactRequest);
	const cancelSentRequest = useMutation(api.contacts.cancelSentRequest);

	const handleAccept = async (contactId: Id<"contacts">) => {
		try {
			await acceptContactRequest({ contactId });
			toast.success("Contact request accepted!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to accept request",
			);
		}
	};

	const handleReject = async (contactId: Id<"contacts">) => {
		try {
			await rejectContactRequest({ contactId });
			toast.success("Contact request rejected");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to reject request",
			);
		}
	};

	const handleCancel = async (contactId: Id<"contacts">) => {
		if (confirm("Are you sure you want to cancel this contact request?")) {
			try {
				await cancelSentRequest({ contactId });
				toast.success("Contact request cancelled");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to cancel request",
				);
			}
		}
	};

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString([], {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="mx-4 flex max-h-96 w-full max-w-md flex-col rounded-lg bg-white shadow-xl">
				<div className="flex items-center justify-between border-gray-200 border-b p-4">
					<h2 className="font-semibold text-gray-900 text-xl">
						Contact Requests
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="font-bold text-gray-400 text-xl hover:text-gray-600"
					>
						×
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-gray-200 border-b">
					<button
						type="button"
						onClick={() => setActiveTab("received")}
						className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
							activeTab === "received"
								? "border-blue-600 border-b-2 bg-blue-50 text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Received ({pendingRequests?.length || 0})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("sent")}
						className={`flex-1 px-4 py-3 font-medium text-sm transition-colors ${
							activeTab === "sent"
								? "border-blue-600 border-b-2 bg-blue-50 text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						Sent ({sentRequests?.length || 0})
					</button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{activeTab === "received" ? (
						<div className="p-4">
							{pendingRequests && pendingRequests.length > 0 ? (
								<div className="space-y-4">
									{pendingRequests.map((request) => {
										const displayName =
											request.user?.name ||
											request.user?.email ||
											"Anonymous User";

										return (
											<div
												key={request._id}
												className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
											>
												<div className="flex items-center space-x-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-white">
														{displayName[0]?.toUpperCase() || "U"}
													</div>
													<div>
														<div className="font-medium text-gray-900">
															{displayName}
														</div>
														<div className="text-gray-500 text-xs">
															Sent {formatTime(request._creationTime)}
														</div>
													</div>
												</div>
												<div className="flex space-x-2">
													<button
														type="button"
														onClick={() => handleAccept(request._id)}
														className="rounded bg-green-500 px-3 py-1 font-medium text-sm text-white transition-colors hover:bg-green-600"
													>
														Accept
													</button>
													<button
														type="button"
														onClick={() => handleReject(request._id)}
														className="rounded bg-red-500 px-3 py-1 font-medium text-sm text-white transition-colors hover:bg-red-600"
													>
														Reject
													</button>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="py-8 text-center text-gray-500">
									<div className="mb-4 text-4xl">📭</div>
									<p>No pending contact requests</p>
								</div>
							)}
						</div>
					) : (
						<div className="p-4">
							{sentRequests && sentRequests.length > 0 ? (
								<div className="space-y-4">
									{sentRequests.map((request) => {
										const displayName =
											request.user?.name ||
											request.user?.email ||
											"Anonymous User";

										return (
											<div
												key={request._id}
												className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
											>
												<div className="flex items-center space-x-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-semibold text-white">
														{displayName[0]?.toUpperCase() || "U"}
													</div>
													<div>
														<div className="font-medium text-gray-900">
															{displayName}
														</div>
														<div className="text-gray-500 text-xs">
															Sent {formatTime(request._creationTime)}
														</div>
														<div className="font-medium text-orange-600 text-xs">
															Pending response
														</div>
													</div>
												</div>
												<button
													type="button"
													onClick={() => handleCancel(request._id)}
													className="rounded bg-gray-500 px-3 py-1 font-medium text-sm text-white transition-colors hover:bg-gray-600"
													title="Cancel request"
												>
													Cancel
												</button>
											</div>
										);
									})}
								</div>
							) : (
								<div className="py-8 text-center text-gray-500">
									<div className="mb-4 text-4xl">📤</div>
									<p>No sent contact requests</p>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
