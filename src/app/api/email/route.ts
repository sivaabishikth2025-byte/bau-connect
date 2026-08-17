import { NextRequest, NextResponse } from "next/server";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

function parseFrom(raw: string) {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || "BAU Connect",
      email: match[2].trim(),
    };
  }
  return { name: "BAU Connect", email: raw.trim() };
}

export async function POST(req: NextRequest) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  const fromRaw = process.env.SES_FROM_EMAIL || process.env.AWS_SES_FROM_EMAIL;

  if (!fromRaw) {
    return NextResponse.json({ error: "SES_FROM_EMAIL is not set" }, { status: 500 });
  }
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: "AWS credentials are not set" }, { status: 500 });
  }

  const payload = await req.json();
  const { to, type, fromName, url, title, body, origin: clientOrigin } = payload;

  const recipients: string[] = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
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

  const from = parseFrom(fromRaw);
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
    const client = new SESv2Client({ region });
    const results = [];

    for (const email of recipients) {
      const result = await client.send(
        new SendEmailCommand({
          FromEmailAddress: `${from.name} <${from.email}>`,
          Destination: { ToAddresses: [email] },
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: html, Charset: "UTF-8" },
                Text: {
                  Data: `${subject}\n\n${String(body || "").replace(/<[^>]+>/g, "")}\n\nOpen BAU Connect: ${href}`,
                  Charset: "UTF-8",
                },
              },
            },
          },
        })
      );
      results.push({ email, messageId: result.MessageId });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    console.error("SES send error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
