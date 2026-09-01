export function parseFrom(raw: string) {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || "BAU Connect",
      email: match[2].trim(),
    };
  }
  return { name: "BAU Connect", email: raw.trim() };
}

export function getMailFrom() {
  return process.env.EMAIL_FROM || "BAU Connect <notifications@baustudentconnect.com>";
}

export function mailConfigured() {
  return Boolean(process.env.BREVO_API_KEY);
}

/** Brevo free plan: 300 emails/day — no credit card required. */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not set");

  const from = parseFrom(getMailFrom());
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: from.name, email: from.email },
      to: [{ email: opts.to }],
      replyTo: { email: from.email, name: from.name },
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || `Brevo error ${res.status}`;
    throw new Error(msg);
  }
  return data?.messageId ?? "sent";
}

export function mailCard(inner: string, subject: string) {
  return `
    <div style="font-family:Nunito,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f4f7ff;border-radius:16px;">
      <h1 style="color:#1C2D5A;font-size:20px;margin:0 0 16px;">${subject}</h1>
      <div style="color:#444;line-height:1.7;margin-bottom:24px;">${inner}</div>
      <p style="color:#aaa;font-size:12px;margin:0;">BAU Connect · Bay Atlantic University</p>
    </div>
  `;
}
