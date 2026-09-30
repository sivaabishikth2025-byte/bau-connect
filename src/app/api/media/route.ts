import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { ApiError, apiError, requireUser } from "@/lib/server-auth";
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = await req.json();
    if (typeof data.size !== "number" || data.size < 1 || data.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"].includes(data.type)) throw new ApiError(400, "Choose a photo or PDF no larger than 10 MB.");
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !apiKey || !secret) throw new ApiError(503, "Uploads are temporarily unavailable.");
    const db = adminDb();
    const counter = db.doc(`users/${user.uid}/private/uploads`);
    await db.runTransaction(async tx => {
      const profile = await tx.get(db.doc(`users/${user.uid}`));
      const current = (await tx.get(counter)).data() ?? { windowStart: 0, count: 0 };
      if (profile.data()?.hidden) throw new ApiError(403, "Account unavailable.");
      const recent = current?.windowStart > Date.now() - 60000;
      if (recent && current.count >= 12) throw new ApiError(429, "Please wait a minute before uploading more files.");
      tx.set(counter, { windowStart: recent ? current.windowStart : Date.now(), count: recent ? current.count + 1 : 1 });
    });
    const folder = `bau-connect/users/${user.uid}`;
    const publicId = randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const allowedFormats = "jpg,jpeg,png,webp,heic,heif,pdf";
    const signature = createHash("sha1").update(`allowed_formats=${allowedFormats}&folder=${folder}&overwrite=false&public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
    await adminDb().doc(`mediaAssets/${publicId}`).create({ uid: user.uid, publicId: `${folder}/${publicId}`, status: "pending", createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ cloud, apiKey, folder, publicId, timestamp, signature, allowedFormats, overwrite: "false" });
  } catch (error) { return apiError(error); }
}
/** Verify Cloudinary's signed receipt before recording a URL as owned by this account. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = await req.json();
    if (typeof data.ticket !== "string" || !/^[\w-]{36}$/.test(data.ticket) || typeof data.version !== "number" || !Number.isSafeInteger(data.version) || typeof data.signature !== "string" || !/^[a-f0-9]{40}$/.test(data.signature) || typeof data.url !== "string") throw new ApiError(400, "Invalid upload receipt.");
    const ref = adminDb().doc(`mediaAssets/${data.ticket}`);
    const pending = (await ref.get()).data();
    if (!pending || pending.uid !== user.uid) throw new ApiError(403, "Upload does not belong to your account.");
    const secret = process.env.CLOUDINARY_API_SECRET;
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!secret || !cloud) throw new ApiError(503, "Uploads are temporarily unavailable.");
    const expected = createHash("sha1").update(`public_id=${pending.publicId}&version=${data.version}${secret}`).digest("hex");
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(data.signature))) throw new ApiError(400, "Upload could not be verified.");
    const url = new URL(data.url);
    const resourceType = data.resourceType;
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !["image", "raw", "video"].includes(resourceType)) throw new ApiError(400, "Invalid media URL.");
    const prefix = `/${cloud}/${resourceType}/upload/v${data.version}/${pending.publicId}`;
    if (!url.pathname.startsWith(prefix + ".") && url.pathname !== prefix) throw new ApiError(400, "Invalid media path.");
    await ref.update({ url: data.url, resourceType, status: "uploaded" });
    return NextResponse.json({ url: data.url });
  } catch (error) { return apiError(error); }
}
