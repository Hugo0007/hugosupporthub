// Vercel serverless function — adds newsletter signups to a Resend Audience.
//
// Required Vercel environment variable:
//   NEWS — full-access Resend API key (audience endpoints reject send-only
//          keys, so this is separate from RESEND_API_KEY, the send-only key
//          /api/lead uses; falls back to RESEND_API_KEY if NEWS is unset)
//
// Optional Vercel environment variable:
//   RESEND_AUDIENCE_ID — pins a specific audience and skips the lookup
//
// Without it, the function uses the account's first audience (Resend
// accounts start with a default "General" one) and creates one if none
// exists. The resolved id is cached per warm instance. Audience endpoints
// need a full-access API key — a send-only key gets 401 from Resend and
// the form shows its failure message.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cachedAudienceId = null;

async function resolveAudienceId(apiKey) {
  if (process.env.RESEND_AUDIENCE_ID) return process.env.RESEND_AUDIENCE_ID;
  if (cachedAudienceId) return cachedAudienceId;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const list = await fetch("https://api.resend.com/audiences", { headers });
  if (!list.ok) throw new Error(`audience list ${list.status}: ${await list.text()}`);
  const listed = await list.json();
  let id = listed && listed.data && listed.data[0] && listed.data[0].id;

  if (!id) {
    const created = await fetch("https://api.resend.com/audiences", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "U-go Support Hub newsletter" }),
    });
    if (!created.ok) throw new Error(`audience create ${created.status}: ${await created.text()}`);
    id = (await created.json()).id;
  }

  cachedAudienceId = id;
  return id;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.NEWS || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("subscribe env var missing");
    return res.status(503).json({ error: "Newsletter not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = (body && body.email ? String(body.email) : "").trim().toLowerCase().slice(0, 200);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const audienceId = await resolveAudienceId(apiKey);
    const r = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    // 409 = already on the list; the visitor shouldn't see that as a failure.
    if (r.ok || r.status === 409) return res.status(200).json({ ok: true });

    console.error("resend contact error", r.status, await r.text());
    return res.status(502).json({ error: "Subscription failed" });
  } catch (err) {
    console.error("subscribe threw", err);
    return res.status(502).json({ error: "Subscription failed" });
  }
};
