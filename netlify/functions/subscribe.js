// Netlify Function: subscribe
// Receives a PushSubscription JSON and returns 201.
// In a future iteration, persist this in Convex.

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { subscription } = JSON.parse(event.body || "{}");
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid subscription" }) };
    }

    // For now, just acknowledge. You can wire Convex persistence here.
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: (e && e.message) || "Server error" }) };
  }
};