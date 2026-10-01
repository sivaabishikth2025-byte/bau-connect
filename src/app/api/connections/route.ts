import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";
import { adminDb } from "@/lib/firebase-admin";
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { otherId } = await req.json();
    if (typeof otherId !== "string" || !/^[\w-]{1,128}$/.test(otherId) || otherId === user.uid) throw new ApiError(400, "Invalid connection.");
    const db = adminDb();
    const [me, other] = await Promise.all([db.doc(`users/${user.uid}`).get(), db.doc(`users/${otherId}`).get()]);
    if (!me.exists || !other.exists || me.data()?.hidden || other.data()?.hidden || me.data()?.blockedUsers?.includes(otherId) || other.data()?.blockedUsers?.includes(user.uid)) throw new ApiError(403, "Connection unavailable.");
    const requests = await db.collection("likes").where("fromUserId", "==", otherId).where("toUserId", "==", user.uid).get();
    if (requests.empty) throw new ApiError(403, "Accept an incoming request to connect.");
    const [a, b] = [user.uid, otherId].sort();
    const ref = db.doc(`matches/${a}_${b}`);
    await db.runTransaction(async tx => { if (!(await tx.get(ref)).exists) tx.create(ref, { user1Id: a, user2Id: b, createdAt: FieldValue.serverTimestamp() }); });
    return NextResponse.json({ matchId: ref.id });
  } catch (error) { return apiError(error); }
}
