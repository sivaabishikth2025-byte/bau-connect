import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { apiError, requireUser, ApiError } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
import { contentAllowed } from "@/lib/safety";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireUser(req, true);
    const data = await req.json();
    const title = typeof data.title === "string" ? data.title.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : "";
    if (!title || title.length > 200 || body.length > 4000 || !contentAllowed(title) || !contentAllowed(body)) {
      throw new ApiError(400, "Enter an announcement under 200 characters and details under 4,000 characters.");
    }

    const db = adminDb();
    const users = await db.collection("users").get();
    const recipients = users.docs.filter(user => user.id !== admin.uid && user.get("hidden") !== true);
    let delivered = 0;
    for (let start = 0; start < recipients.length; start += 400) {
      const batch = db.batch();
      const chunk = recipients.slice(start, start + 400);
      for (const recipient of chunk) {
        batch.create(recipient.ref.collection("inbox").doc(), {
          type: "alert",
          title,
          body: body || title,
          url: "/notifications",
          fromUserId: admin.uid,
          fromName: "BAU Connect",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      delivered += chunk.length;
    }
    return NextResponse.json({ ok: true, delivered });
  } catch (error) {
    return apiError(error);
  }
}
