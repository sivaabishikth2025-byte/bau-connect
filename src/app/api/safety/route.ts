import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";

const idValid = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,128}$/.test(id);
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = await req.json();
    const db = adminDb();
    const me = db.doc(`users/${user.uid}`);
    if (data.action === "block" || data.action === "unblock") {
      if (!idValid(data.userId) || data.userId === user.uid) throw new ApiError(400, "Choose another user.");
      if (!(await db.doc(`users/${data.userId}`).get()).exists) throw new ApiError(404, "Profile not found.");
      await me.update({ blockedUsers: data.action === "block" ? FieldValue.arrayUnion(data.userId) : FieldValue.arrayRemove(data.userId) });
      return NextResponse.json({ ok: true });
    }
    if (data.action !== "report" || !["user", "post", "comment", "message"].includes(data.kind) || !idValid(data.targetId)) throw new ApiError(400, "Invalid report.");
    const reasons = ["Harassment or bullying", "Hate or violence", "Sexual content", "Spam or scam", "Child safety", "Other"];
    if (!reasons.includes(data.reason) || typeof data.details !== "string" || data.details.length > 2000) throw new ApiError(400, "Choose a reason and keep details under 2,000 characters.");
    const path = data.kind === "user" ? `users/${data.targetId}` : data.kind === "post" ? `activities/${data.targetId}` : data.kind === "message" ? `messages/${data.targetId}` : idValid(data.postId) ? `activities/${data.postId}/comments/${data.targetId}` : "";
    if (!path) throw new ApiError(400, "Invalid post.");
    const target = await db.doc(path).get();
    if (!target.exists) throw new ApiError(404, "Content no longer exists.");
    const item = target.data()!;
    if (data.kind === "message") {
      const match = await db.doc(`matches/${item.matchId}`).get();
      if (![match.data()?.user1Id, match.data()?.user2Id].includes(user.uid)) throw new ApiError(403, "You can only report messages in your conversations.");
    }
    // One report per person and target, preventing repeated submissions from flooding staff.
    const key = `${user.uid}_${data.kind}_${data.kind === "comment" ? data.postId : ""}_${data.targetId}`;
    const ref = db.collection("safetyReports").doc(key);
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      tx.create(ref, { reporterId: user.uid, targetPath: path, targetUserId: data.kind === "user" ? data.targetId : item.authorId || item.senderId, kind: data.kind, reason: data.reason, details: data.details.trim(), status: "pending", createdAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
export async function GET(req: NextRequest) {
  try {
    await requireUser(req, true);
    const snap = await adminDb().collection("safetyReports").where("status", "==", "pending").limit(100).get();
    return NextResponse.json({ reports: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (error) { return apiError(error); }
}
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req, true);
    const { id, action } = await req.json();
    if (typeof id !== "string" || !/^[\w-]{1,600}$/.test(id) || !["dismiss", "hide"].includes(action)) throw new ApiError(400, "Invalid action.");
    const db = adminDb();
    const report = db.doc(`safetyReports/${id}`);
    await db.runTransaction(async tx => {
      const snap = await tx.get(report);
      if (!snap.exists) throw new ApiError(404, "Report not found.");
      const data = snap.data()!;
      if (action === "hide") tx.update(db.doc(data.targetPath), { hidden: true });
      tx.update(report, { status: action === "hide" ? "removed" : "dismissed", reviewedBy: user.uid, reviewedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
