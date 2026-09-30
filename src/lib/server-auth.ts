import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "./firebase-admin";
import { isAdminEmail } from "./admin";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function requireUser(req: NextRequest, staff = false) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError(401, "Please sign in again.");
  let user;
  try { user = await adminAuth().verifyIdToken(token, true); }
  catch { throw new ApiError(401, "Please sign in again."); }
  if (!user.email || !/^[^@]+@(stu\.)?bau\.edu$/i.test(user.email)) throw new ApiError(403, "A BAU account is required.");
  if (!user.email_verified) throw new ApiError(403, "Verify your BAU email first.");
  if (staff && !isAdminEmail(user.email)) throw new ApiError(403, "Staff access required.");
  return user;
}
export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Safety operation failed", error instanceof Error ? error.name : "unknown");
  return NextResponse.json({ error: "Unable to complete this request. Please try again." }, { status: 503 });
}
