import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function sendEmailNotification(
  toUserId: string,
  type: "like" | "match" | "message",
  fromName: string,
  url: string = "/"
) {
  try {
    const snap = await getDoc(doc(db, "users", toUserId));
    if (!snap.exists()) return;
    const email = snap.data().email;
    if (!email) return;

    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, type, fromName, url }),
    });
  } catch (e) {
    console.error("sendEmailNotification error:", e);
  }
}
