import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { confirm } = await req.json();
    if (confirm !== "DELETE") throw new ApiError(400, "Type DELETE to confirm.");
    const ref = adminDb().doc(`accountDeletionRequests/${user.uid}`);
    await adminDb().runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      tx.create(ref, { uid: user.uid, email: user.email, status: "pending", createdAt: FieldValue.serverTimestamp(), dueAt: new Date(Date.now() + 30 * 86400000) });
    });
    return NextResponse.json({ ok: true, message: "Your account deletion request is recorded. Staff will delete your account and associated data within 30 days and email you when complete." });
  } catch (error) { return apiError(error); }
}
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (req.nextUrl.searchParams.get("staff") === "1") {
      await requireUser(req, true);
      const snap = await adminDb().collection("accountDeletionRequests").where("status", "in", ["pending", "processing", "failed"]).limit(100).get();
      const requests = await Promise.all(snap.docs.map(async d => {
        const profile = (await adminDb().doc(`users/${d.id}`).get()).data();
        const apps = await adminDb().collection("volunteerApplications").where("applicantId", "==", d.id).get();
        return { id: d.id, ...d.data(), media: Array.from(new Set<string>([...(d.data().media || []), profile?.photoURL, ...(profile?.photos || []), ...(profile?.gallery || []), ...apps.docs.map(a => a.data().resumeURL)].filter((url): url is string => typeof url === "string" && url.startsWith("https://res.cloudinary.com/")))) };
      }));
      return NextResponse.json({ requests });
    }
    const snap = await adminDb().doc(`accountDeletionRequests/${user.uid}`).get();
    return NextResponse.json({ pending: snap.exists && ["pending", "processing", "failed"].includes(snap.data()?.status) });
  } catch (error) { return apiError(error); }
}
