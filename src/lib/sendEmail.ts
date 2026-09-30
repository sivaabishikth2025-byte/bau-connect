import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type EmailType =
  | "like"
  | "match"
  | "message"
  | "feed"
  | "volunteer"
  | "connect"
  | "connected"
  | "alert"
  | "join"
  | "comment";

function appOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "https://baustudentconnect.com";
}

export async function sendEmailToAddress(
  to: string | string[],
  opts: {
    type?: EmailType | string;
    fromName?: string;
    url?: string;
    title?: string;
    body?: string;
    firstMessage?: boolean;
    matchId?: string;
  }
) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return;

  if (!auth.currentUser) return;
  const token = await auth.currentUser.getIdToken();
  await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      to: recipients,
      type: opts.type,
      fromName: opts.fromName,
      url: opts.url,
      title: opts.title,
      body: opts.body,
      firstMessage: opts.firstMessage,
      matchId: opts.matchId,
      origin: appOrigin(),
    }),
  });
}

export async function sendEmailNotification(
  toUserId: string,
  type: EmailType | string,
  fromName: string,
  url: string = "/",
  extra?: { title?: string; body?: string; firstMessage?: boolean; matchId?: string }
) {
  try {
    const snap = await getDoc(doc(db, "users", toUserId));
    if (!snap.exists()) return;
    const email = snap.data().email;
    if (!email) return;

    await sendEmailToAddress(email, {
      type,
      fromName,
      url,
      title: extra?.title,
      body: extra?.body,
      firstMessage: extra?.firstMessage,
      matchId: extra?.matchId,
    });
  } catch (e) {
    console.error("sendEmailNotification error:", e);
  }
}
