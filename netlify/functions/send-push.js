// Netlify Function: send-push
// Sends a Web Push notification using web-push.
// Requires environment variables:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (e.g., mailto:you@example.com)

import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing VAPID keys on server" }) };
  }

  try {
    const { subscription, payload } = JSON.parse(event.body || "{}");
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid subscription" }) };
    }

    const data = payload || {
      title: "Test notification",
      body: "If you see this on your phone, web push works!",
      data: { url: "/" },
    };

    await webpush.sendNotification(subscription, JSON.stringify(data));

    return { statusCode: 202, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    const msg = e && e.body ? e.body : e && e.message ? e.message : String(e);
    return { statusCode: 500, body: JSON.stringify({ error: msg }) };
  }
};