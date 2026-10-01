import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase-admin";
import { mailConfigured, sendMail } from "./mail";
import { ApiError } from "./server-auth";

export function cloudinaryAsset(url: string, cloud: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "res.cloudinary.com") throw new Error("Unknown media host");
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts[0] !== cloud || !["image", "raw", "video"].includes(parts[1]) || parts[2] !== "upload") throw new Error("Unknown media path");
  const versionIndex = parts.findIndex((p, i) => i > 2 && /^v\d+$/.test(p));
  if (versionIndex < 0) throw new Error("Missing asset version");
  let publicId = decodeURIComponent(parts.slice(versionIndex + 1).join("/"));
  if (parts[1] !== "raw") publicId = publicId.replace(/\.[^.\/]+$/, "");
  if (!publicId || publicId.includes("..")) throw new Error("Invalid asset ID");
  return { resourceType: parts[1], publicId };
}
async function destroyMedia(url: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary deletion credentials are not configured.");
  const { resourceType, publicId } = cloudinaryAsset(url, cloud);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash("sha1").update(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/destroy`, { method: "POST", body: new URLSearchParams({ public_id: publicId, invalidate: "true", timestamp, signature, api_key: key }) });
  const result = await response.json();
  if (!response.ok || !["ok", "not found"].includes(result.result)) throw new Error("Unable to delete an uploaded file. The request remains open for retry.");
}
/** Resumable staff processing: retain the media manifest until every provider confirms removal. */
export async function deleteRequestedAccount(uid: string, legacyApproved = false) {
  const db = adminDb();
  const ref = db.doc(`accountDeletionRequests/${uid}`);
  const request = (await ref.get()).data();
  if (!request || request.status === "complete") throw new Error("No open deletion request.");
  if (!process.env.CLOUDINARY_API_SECRET || !mailConfigured()) throw new Error("Configure Cloudinary deletion and email delivery before processing requests.");
  const profileRef = db.doc(`users/${uid}`);
  const profile = (await profileRef.get()).data();
  const applications = await db.collection("volunteerApplications").where("applicantId", "==", uid).get();
  const assets = await db.collection("mediaAssets").where("uid", "==", uid).get();
  // Signed upload tickets remain usable briefly even after sign-out. Do not remove
  // an account while a recently issued upload could still finish after cleanup.
  if (assets.docs.some(d => d.data().createdAt?.toMillis() > Date.now() - 65 * 60000)) throw new ApiError(409, "An upload is still pending. Retry deletion after 65 minutes.");
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("Cloudinary cloud is not configured.");
  const pendingUrls = assets.docs.flatMap(d => [
    ...["image", "video"].map(type => `https://res.cloudinary.com/${cloud}/${type}/upload/v1/${d.data().publicId}`),
    ...["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"].map(ext => `https://res.cloudinary.com/${cloud}/raw/upload/v1/${d.data().publicId}.${ext}`),
  ]);
  const owned = new Set<string>(assets.docs.map(d => d.data().url).filter((url): url is string => typeof url === "string"));
  const media = new Set<string>([...(request.media || []), ...Array.from(owned), ...pendingUrls]);
  for (const url of [profile?.photoURL, ...(profile?.photos || []), ...(profile?.gallery || []), ...applications.docs.flatMap(d => [d.data().resumeURL, d.data().applicantPhoto])]) {
    if (typeof url === "string" && url.startsWith("https://res.cloudinary.com/")) media.add(url);
  }
  const legacy = Array.from(media).filter(url => !owned.has(url) && !pendingUrls.includes(url));
  if (legacy.length && !legacyApproved) throw new ApiError(409, "Staff must review ownership of legacy files before processing deletion.");
  if (legacy.length) {
    const otherUsers = await db.collection("users").get();
    const otherApps = await db.collection("volunteerApplications").get();
    const otherMedia = new Set<string>();
    for (const person of otherUsers.docs.filter(d => d.id !== uid)) {
      const data = person.data();
      for (const url of [data.photoURL, ...(data.photos || []), ...(data.gallery || [])]) otherMedia.add(url);
    }
    for (const app of otherApps.docs.filter(d => d.data().applicantId !== uid)) otherMedia.add(app.data().resumeURL);
    if (legacy.some(url => otherMedia.has(url))) throw new ApiError(409, "A legacy file is linked to another account. Resolve ownership manually before deletion.");
  }
  await db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (!current) throw new Error("No open deletion request.");
    if (current.status === "processing" && current.startedAt?.toMillis() > Date.now() - 10 * 60000) throw new ApiError(409, "Deletion is already being processed.");
    tx.update(ref, { status: "processing", media: Array.from(media), startedAt: FieldValue.serverTimestamp() });
  });
  if (profile) await profileRef.update({ hidden: true });
  try { await adminAuth().updateUser(uid, { disabled: true }); await adminAuth().revokeRefreshTokens(uid); }
  catch (e) { if ((e as { code?: string }).code !== "auth/user-not-found") throw e; }
  const files = Array.from(media);
  for (let i = 0; i < files.length; i += 3) await Promise.all(files.slice(i, i + 3).map(destroyMedia));
  // Query both orientations because the original connection schema stores two participant fields.
  for (const [collection, field] of [["likes", "fromUserId"], ["likes", "toUserId"], ["matches", "user1Id"], ["matches", "user2Id"], ["messages", "senderId"], ["volunteerApplications", "applicantId"], ["volunteerHourLogs", "userId"], ["safetyReports", "reporterId"], ["safetyReports", "targetUserId"]]) {
    const snap = await db.collection(collection).where(field, "==", uid).get();
    for (const record of snap.docs) {
      if (collection === "matches") {
        const messages = await db.collection("messages").where("matchId", "==", record.id).get();
        for (const message of messages.docs) await message.ref.delete();
      }
      await db.recursiveDelete(record.ref);
    }
  }
  for (const collection of ["activities", "volunteers"]) {
    const records = await db.collection(collection).get();
    for (const record of records.docs) {
      const data = record.data();
      if (data.authorId === uid || data.organizerId === uid) { await db.recursiveDelete(record.ref); continue; }
      const comments = await record.ref.collection("comments").where("authorId", "==", uid).get();
      for (const comment of comments.docs) await comment.ref.delete();
      if (data.participantIds?.includes(uid)) await record.ref.update({ participantIds: FieldValue.arrayRemove(uid) });
      if (data.likedBy?.includes(uid)) await record.ref.update({ likedBy: FieldValue.arrayRemove(uid) });
    }
  }
  const users = await db.collection("users").get();
  for (const person of users.docs) {
    const inbox = await person.ref.collection("inbox").where("fromUserId", "==", uid).get();
    for (const notification of inbox.docs) await notification.ref.delete();
    if (person.data().blockedUsers?.includes(uid)) await person.ref.update({ blockedUsers: FieldValue.arrayRemove(uid) });
  }
  for (const asset of assets.docs) await asset.ref.delete();
  await db.recursiveDelete(profileRef);
  try { await adminAuth().deleteUser(uid); }
  catch (e) { if ((e as { code?: string }).code !== "auth/user-not-found") throw e; }
  // Notify before marking complete, so a mail failure remains retryable even after removal.
  await sendMail({ to: request.email, subject: "Your BAU Connect account has been deleted", html: "<p>Your BAU Connect account and associated profile, content, connections, messages, volunteer records, notifications, and linked uploaded files have been deleted.</p>", text: "Your BAU Connect account and associated data have been deleted." });
  await ref.delete();
}
