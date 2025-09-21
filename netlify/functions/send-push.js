// Netlify Function: send-push
// Sends a Web Push notification using web-push.
// Requires environment variables:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (e.g., mailto:you@example.com)
// - FUNCTION_JWT_SECRET (HS256 secret for JWT-based server-to-server auth)

import webpush from "web-push";
import { jwtVerify } from "jose";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function verifyJwt(token) {
  const secretStr = process.env.FUNCTION_JWT_SECRET || "";
  if (!secretStr) throw new Error("Missing FUNCTION_JWT_SECRET");
  const secret = new TextEncoder().encode(secretStr);
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
    issuer: process.env.CONVEX_SITE_URL || "convex",
    audience: "netlify:function:send-push",
  });
  if (payload.scope !== "send_push") throw new Error("invalid scope");
  return payload;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Authorization: Bearer <JWT>
  const authHeader = event.headers?.authorization || event.headers?.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  try {
    await verifyJwt(token);
  } catch (_e) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
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
