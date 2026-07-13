// Vercel serverless function — emails Work With Us form submissions via Resend.
// Keeps the API key server-side; the browser only ever sees /api/lead.
//
// Required Vercel environment variables (Production + Preview):
//   RESEND_API_KEY — from resend.com → API Keys (free tier is fine)
//   LEAD_TO_EMAIL  — inbox that receives the leads
//
// The form only checks res.ok, so: 2xx on success, non-2xx on any failure.
// If env vars are missing we return 503 and the page shows its honest
// fallback (direct email address + Calendly link), so no lead is lost.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_TO_EMAIL;
  if (!apiKey || !toEmail) {
    console.error("lead env vars missing");
    return res.status(503).json({ error: "Form not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = String(body.name || "").trim().slice(0, 200);
  const email = String(body.email || "").trim().slice(0, 200);
  const business = String(body.business || "").trim().slice(0, 300);
  const need = String(body.need || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 5000);

  if (!name || !EMAIL_RE.test(email) || !message) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const html = `
    <h2>New lead — U-go Support Hub</h2>
    <p><b>Name:</b> ${esc(name)}<br>
    <b>Email:</b> ${esc(email)}<br>
    <b>Business / role:</b> ${esc(business)}<br>
    <b>Needs:</b> ${esc(need)}</p>
    <p><b>Message:</b></p>
    <p>${esc(message).replace(/\n/g, "<br>")}</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "U-go Support Hub <onboarding@resend.dev>",
        to: [toEmail],
        reply_to: email,
        subject: `New lead: ${name} — ${need || "enquiry"}`,
        html,
      }),
    });

    if (r.ok) return res.status(200).json({ ok: true });

    const detail = await r.text();
    console.error("resend error", r.status, detail);
    return res.status(502).json({ error: "Send failed" });
  } catch (err) {
    console.error("resend request threw", err);
    return res.status(502).json({ error: "Send failed" });
  }
};
