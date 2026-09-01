import { Resend } from "resend";

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
  return (
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "BAU Connect <notifications@baustudentconnect.com>"
  );
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const from = getMailFrom();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: parseFrom(from).email,
  });

  if (error) throw new Error(error.message);
  return data?.id ?? "sent";
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
