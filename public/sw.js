/**
 * Service Worker for Browser Notifications
 * Handles notification clicks and background notification management
 */

const CACHE_NAME = 'msn-messenger-v1';

// Install event
self.addEventListener('install', (event) => {
	console.log('Service Worker installing');
	self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
	console.log('Service Worker activating');
	event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	console.log('Notification clicked:', event);
	
	event.notification.close();
	
	const data = event.notification.data || {};
	const action = event.action || data.action;
	
	event.waitUntil(
		handleNotificationClick(action, data)
	);
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
	console.log('Notification closed:', event);
});

/**
 * Handle notification click actions
 */
async function handleNotificationClick(action, data) {
	const clients = await self.clients.matchAll({
		type: 'window',
		includeUncontrolled: true
	});
	
	// Find existing window or open new one
	let targetClient = null;
	
	for (const client of clients) {
		if (client.url.includes(self.location.origin)) {
			targetClient = client;
			break;
		}
	}
	
	if (targetClient) {
		// Focus existing window
		await targetClient.focus();
		
		// Send message to the app about the notification action
		targetClient.postMessage({
			type: 'NOTIFICATION_ACTION',
			action,
			data
		});
	} else {
		// Open new window
		const url = getUrlForAction(action, data);
		await self.clients.openWindow(url);
	}
}

/**
 * Get URL for specific notification actions
 */
function getUrlForAction(action, data) {
	const baseUrl = self.location.origin;
	
	switch (action) {
		case 'openChat':
			if (data.chatId) {
				return `${baseUrl}/?chat=${encodeURIComponent(data.chatId)}`;
			}
			break;
		case 'openContactRequests':
			return `${baseUrl}/?view=contacts&tab=requests`;
		case 'openGroupInvites':
			return `${baseUrl}/?view=groups&tab=invites`;
		case 'accept':
		case 'decline':
			// These will be handled by the main app
			return baseUrl;
		default:
			return baseUrl;
	}
	
	return baseUrl;
}
