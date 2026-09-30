import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";
/** One-time migration of legacy device tokens out of campus-readable profiles. */
export async function POST(req: NextRequest) {
  try {
    await requireUser(req, true);
    if ((await req.json()).action !== "protect-notification-tokens") throw new ApiError(400, "Invalid maintenance action.");
    const db = adminDb();
    const users = await db.collection("users").get();
    let updated = 0;
    for (const user of users.docs) {
      await db.runTransaction(async tx => {
        const fresh = (await tx.get(user.ref)).data();
        if (typeof fresh?.fcmToken !== "string") return;
        const privateRef = user.ref.collection("private").doc("notifications");
        const privateData = await tx.get(privateRef);
        if (!privateData.data()?.fcmToken) tx.set(privateRef, { fcmToken: fresh.fcmToken });
        tx.update(user.ref, { fcmToken: FieldValue.delete() });
        updated++;
      });
    }
    return NextResponse.json({ updated });
  } catch (error) { return apiError(error); }
}
