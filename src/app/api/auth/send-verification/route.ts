import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { mailCard, sendMail } from "@/lib/mail";
import { toAppActionLink } from "@/lib/authActionLink";

export const runtime = "nodejs";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://baustudentconnect.com").replace(/\/$/, "");
}

function verificationHtml(link: string, email: string) {
  const inner = `
    <p style="margin:0 0 16px;">Confirm <strong>${email}</strong> to finish setting up your BAU Connect account.</p>
    <a href="${link}" style="display:inline-block;background:#1C2D5A;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:8px 0 20px;">
      Verify email address
    </a>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 12px;">If the button does not work, copy this link:</p>
    <p style="color:#1C2D5A;font-size:13px;word-break:break-all;margin:0;">${link}</p>
  `;
  return mailCard(inner, "Verify your BAU Connect email");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!idToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: "No email on account" }, { status: 400 });
    }

    const firebaseLink = await adminAuth().generateEmailVerificationLink(email, {
      url: `${appUrl()}/verify-email`,
      handleCodeInApp: false,
    });
    const link = toAppActionLink(firebaseLink, appUrl());

    const subject = "Confirm your BAU Connect account";
    const text = [
      subject,
      "",
      `Confirm ${email} to finish setting up your account.`,
      "",
      link,
      "",
      "If you did not sign up for BAU Connect, you can ignore this email.",
    ].join("\n");

    const messageId = await sendMail({
      to: email,
      subject,
      html: verificationHtml(link, email),
      text,
      tag: "verification",
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send verification email";
    console.error("send-verification error:", e);
    const status = /too-many|rate|quota/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
