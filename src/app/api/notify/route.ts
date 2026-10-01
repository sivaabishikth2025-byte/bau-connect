import { requireUser, apiError, ApiError } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let fcmToken: string | undefined;
  let title: string, body: string, url: string;
  try {
    const user = await requireUser(req);
    const data = await req.json();
    if (typeof data.toUserId !== "string" || !/^[\w-]{1,128}$/.test(data.toUserId) || typeof data.title !== "string" || data.title.length > 200 || typeof data.body !== "string" || data.body.length > 4000 || typeof data.url !== "string" || !data.url.startsWith("/") || data.url.startsWith("//")) throw new ApiError(400, "Invalid notification.");
    const recipient = await adminDb().doc(`users/${data.toUserId}`).get();
    const sender = await adminDb().doc(`users/${user.uid}`).get();
    if (!recipient.exists || !sender.exists || recipient.data()?.hidden || sender.data()?.hidden || recipient.data()?.blockedUsers?.includes(user.uid) || sender.data()?.blockedUsers?.includes(data.toUserId)) throw new ApiError(403, "Notification unavailable.");
    const privateData = await adminDb().doc(`users/${data.toUserId}/private/notifications`).get();
    fcmToken = privateData.data()?.fcmToken || recipient.data()?.fcmToken;
    if (!fcmToken) return NextResponse.json({ ok: true, skipped: true });
    ({ title, body, url } = data);
  } catch (error) { return apiError(error); }

  if (!fcmToken || !title || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // Get OAuth2 access token using Firebase service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    if (!serviceAccount.private_key) {
      return NextResponse.json({ error: "No service account configured" }, { status: 500 });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body },
            webpush: {
              fcm_options: { link: url }
            }
          }
        })
      }
    );

    if (!res.ok) return NextResponse.json({ error: "Notification delivery unavailable." }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification delivery unavailable." }, { status: 503 });
  }
}

// Generate OAuth2 token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const { SignJWT, importPKCS8 } = await import("jose");
  const now = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging"
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(serviceAccount.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const { access_token } = await tokenRes.json();
  return access_token;
}
