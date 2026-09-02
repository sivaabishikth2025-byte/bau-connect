import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getMailFrom, mailConfigured, sendMail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  if (!mailConfigured()) {
    return NextResponse.json({ error: "BREVO_API_KEY is not set" }, { status: 500 });
  }
  if (!getMailFrom()) {
    return NextResponse.json({ error: "EMAIL_FROM is not set" }, { status: 500 });
  }

  const payload = await req.json();
  const { to, type, fromName, url, title, body, origin: clientOrigin, firstMessage, matchId } = payload;

  const recipients: string[] = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
  }

  if (type === "message") {
    if (!firstMessage || !matchId) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const thread = await adminDb()
      .collection("messages")
      .where("matchId", "==", String(matchId))
      .get();
    // Only email when this thread has exactly one message (brand-new conversation).
    if (thread.size !== 1) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  }

  const name = fromName || "A classmate";
  const templates: Record<string, { subject: string; html: string }> = {
    like: {
      subject: `${name} wants to connect on BAU Connect`,
      html: `<p><strong>${name}</strong> sent you a connection request on BAU Connect.</p><p>Log in to accept and start chatting.</p>`,
    },
    connect: {
      subject: `${name} wants to connect on BAU Connect`,
      html: `<p><strong>${name}</strong> sent you a connection request on BAU Connect.</p><p>Log in to accept and start chatting.</p>`,
    },
    match: {
      subject: `You're connected with ${name} on BAU Connect`,
      html: `<p>You and <strong>${name}</strong> are now connected.</p><p>Open Connections to say hello.</p>`,
    },
    connected: {
      subject: `You're connected with ${name} on BAU Connect`,
      html: `<p>You and <strong>${name}</strong> are now connected.</p><p>Open Connections to say hello.</p>`,
    },
    message: {
      subject: `New message from ${name} on BAU Connect`,
      html: `<p><strong>${name}</strong> sent you a message on BAU Connect.</p><p>Jump back in and reply.</p>`,
    },
    feed: {
      subject: `${name} posted on the BAU Connect feed`,
      html: `<p><strong>${name}</strong> shared a new campus post.</p>${body ? `<p>${body}</p>` : ""}<p>Open the feed to join.</p>`,
    },
    volunteer: {
      subject: `${name} posted a volunteer update on BAU Connect`,
      html: `<p><strong>${name}</strong> shared a campus volunteer update.</p>${body ? `<p>${body}</p>` : ""}<p>Open Volunteers to check it.</p>`,
    },
    alert: {
      subject: title || "Campus announcement on BAU Connect",
      html: `<p>Staff posted an announcement on BAU Connect.</p>${body ? `<p>${body}</p>` : ""}`,
    },
    join: {
      subject: `${name} liked your post on BAU Connect`,
      html: `<p><strong>${name}</strong> liked your campus post.</p>${body ? `<p>${body}</p>` : ""}`,
    },
    comment: {
      subject: `${name} commented on your post`,
      html: `<p><strong>${name}</strong> left a comment.</p>${body ? `<p>${body}</p>` : ""}`,
    },
  };

  const tpl = type ? templates[type] : undefined;
  const subject = title || tpl?.subject || "New update on BAU Connect";
  const inner = body
    ? `<p>${String(body).replace(/\n/g, "<br/>")}</p>`
    : tpl?.html || "<p>You have a new update on BAU Connect.</p>";

  const origin = (clientOrigin || process.env.NEXT_PUBLIC_APP_URL || "https://baustudentconnect.com").replace(/\/$/, "");
  const href = url
    ? (String(url).startsWith("http") ? url : `${origin}${url}`)
    : origin;

  const html = `
    <div style="font-family:Nunito,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f4f7ff;border-radius:16px;">
      <h2 style="color:#1C2D5A;margin-bottom:12px;">${subject}</h2>
      <div style="color:#444;line-height:1.7;margin-bottom:24px;">${inner}</div>
      <a href="${href}" style="display:inline-block;background:#1C2D5A;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">
        Open BAU Connect
      </a>
      <p style="color:#aaa;font-size:12px;margin-top:32px;">You're receiving this because you have an account on BAU Connect | Bay Atlantic University</p>
    </div>
  `;

  try {
    const results = [];

    for (const email of recipients) {
      const messageId = await sendMail({
        to: email,
        subject,
        html,
        text: `${subject}\n\n${String(body || "").replace(/<[^>]+>/g, "")}\n\nOpen BAU Connect: ${href}`,
      });
      results.push({ email, messageId });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("email send error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
