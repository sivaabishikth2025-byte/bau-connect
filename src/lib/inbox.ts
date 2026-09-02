import {
  addDoc, collection, getDocs, serverTimestamp, writeBatch, doc
} from "firebase/firestore";
import { db } from "./firebase";
import { sendPushNotification } from "./sendNotification";
import { sendEmailToAddress, sendEmailNotification } from "./sendEmail";

export type InboxType =
  | "feed"
  | "volunteer"
  | "connect"
  | "connected"
  | "message"
  | "join"
  | "comment"
  | "alert";

export interface InboxPayload {
  type: InboxType;
  title: string;
  body: string;
  url: string;
  fromUserId?: string;
  fromName?: string;
  /** Send email only when true — keeps mail for new chats and campus posts. */
  email?: boolean;
}

export async function notifyUser(toUserId: string, payload: InboxPayload) {
  if (!toUserId) return;
  if (payload.fromUserId && payload.fromUserId === toUserId) return;
  try {
    await addDoc(collection(db, "users", toUserId, "inbox"), {
      ...payload,
      read: false,
      createdAt: serverTimestamp(),
    });
    await sendPushNotification(toUserId, payload.title, payload.body, payload.url);
    if (payload.email) {
      await sendEmailNotification(
        toUserId,
        payload.type,
        payload.fromName || "A classmate",
        payload.url,
        { title: payload.title, body: payload.body }
      );
    }
  } catch (e) {
    console.error("notifyUser error:", e);
  }
}

/** In-app + push for everyone; email only when payload.email is true (e.g. campus posts). */
export async function notifyAllUsers(exceptUserId: string | undefined, payload: InboxPayload) {
  try {
    const snap = await getDocs(collection(db, "users"));
    const recipients = snap.docs.filter(d => d.id !== exceptUserId);
    const CHUNK = 400;
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const slice = recipients.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      slice.forEach(userDoc => {
        const ref = doc(collection(db, "users", userDoc.id, "inbox"));
        batch.set(ref, {
          ...payload,
          read: false,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();

      const emails = slice
        .map(userDoc => userDoc.data().email as string | undefined)
        .filter((e): e is string => !!e);

      await Promise.all([
        ...slice.map(userDoc =>
          sendPushNotification(userDoc.id, payload.title, payload.body, payload.url)
        ),
        payload.email && emails.length
          ? sendEmailToAddress(emails, {
              type: payload.type,
              fromName: payload.fromName,
              url: payload.url,
              title: payload.title,
              body: payload.body,
            })
          : Promise.resolve(),
      ]);
    }
  } catch (e) {
    console.error("notifyAllUsers error:", e);
  }
}
