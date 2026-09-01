import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { mailCard, sendMail } from "@/lib/mail";

export const runtime = "nodejs";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://baustudentconnect.com").replace(/\/$/, "");
}

function resetHtml(link: string) {
  const inner = `
    <p style="margin:0 0 16px;">We received a request to reset your BAU Connect password.</p>
    <a href="${link}" style="display:inline-block;background:#1C2D5A;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:8px 0 20px;">
      Reset password
    </a>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 12px;">If you did not request this, you can ignore this email.</p>
    <p style="color:#1C2D5A;font-size:13px;word-break:break-all;margin:0;">${link}</p>
  `;
  return mailCard(inner, "Reset your BAU Connect password");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const allowed = normalized.endsWith("@stu.bau.edu") || normalized.endsWith("@bau.edu");
    if (!allowed) {
      return NextResponse.json({ ok: true });
    }

    try {
      await adminAuth().getUserByEmail(normalized);
    } catch {
      return NextResponse.json({ ok: true });
    }

    const link = await adminAuth().generatePasswordResetLink(normalized, {
      url: `${appUrl()}/login`,
      handleCodeInApp: false,
    });

    const subject = "Reset your BAU Connect password";
    const text = [subject, "", link, "", "If you did not request this, ignore this email."].join("\n");

    await sendMail({
      to: normalized,
      subject,
      html: resetHtml(link),
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send reset email";
    console.error("send-password-reset error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
