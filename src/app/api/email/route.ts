import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL || "BAUdate <onboarding@resend.dev>";
  const { to, type, fromName, url } = await req.json();

  if (!to || !type || !fromName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const subjects: Record<string, string> = {
    like: `${fromName} liked your profile on BAUdate 💜`,
    match: `You matched with ${fromName} on BAUdate 🎉`,
    message: `New message from ${fromName} on BAUdate 💬`,
  };

  const bodies: Record<string, string> = {
    like: `<p><strong>${fromName}</strong> liked your profile on BAUdate.</p><p>Log in to see who it is and like them back!</p>`,
    match: `<p>You and <strong>${fromName}</strong> liked each other — it's a match!</p><p>Head to your matches to start chatting.</p>`,
    message: `<p><strong>${fromName}</strong> sent you a message on BAUdate.</p><p>Don't leave them hanging — reply now!</p>`,
  };

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: subjects[type],
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f4f7ff;border-radius:16px;">
          <img src="https://baudate.app/bau-logo.png" alt="BAUdate" style="height:48px;margin-bottom:24px;" />
          <h2 style="color:#1C2D5A;margin-bottom:12px;">${subjects[type]}</h2>
          <div style="color:#444;line-height:1.7;margin-bottom:24px;">${bodies[type]}</div>
          <a href="${url || "https://baudate.app"}" style="display:inline-block;background:linear-gradient(to right,#F15B47,#DBA631);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;">
            Open BAUdate
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:32px;">You're receiving this because you have an account on BAUdate · Bay Atlantic University</p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
