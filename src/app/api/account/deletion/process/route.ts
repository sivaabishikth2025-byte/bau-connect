import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";
import { deleteRequestedAccount } from "@/lib/delete-account";
import { adminDb } from "@/lib/firebase-admin";
export async function POST(req: NextRequest) {
  let uid: string | undefined;
  try {
    const staff = await requireUser(req, true);
    const data = await req.json();
    if (data.confirm !== "DELETE" || typeof data.uid !== "string" || !/^[\w-]{1,128}$/.test(data.uid)) throw new ApiError(400, "Confirm a valid deletion request.");
    if (staff.uid === data.uid) throw new ApiError(400, "Another staff member must process your deletion request.");
    uid = data.uid;
    await deleteRequestedAccount(uid!, data.legacyApproved === true);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (uid && !(error instanceof Error && error.message === "Deletion is already being processed.")) await adminDb().doc(`accountDeletionRequests/${uid}`).update({ status: "failed" }).catch(() => {});
    return apiError(error);
  }
}
