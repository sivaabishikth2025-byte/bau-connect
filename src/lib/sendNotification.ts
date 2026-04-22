import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

// Send a push notification to a user via their FCM token
export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  url: string = "/"
) {
  try {
    const snap = await getDoc(doc(db, "users", toUserId));
    if (!snap.exists()) return;
    const fcmToken = snap.data().fcmToken;
    if (!fcmToken) return;

    // Use FCM HTTP v1 API via a Next.js API route
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fcmToken, title, body, url })
    });
  } catch (e) {
    console.error("sendPushNotification error:", e);
  }
}
