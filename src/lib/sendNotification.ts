import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Send a push notification to a user via their FCM token
export async function sendPushNotification(
  toUserId: string,
  title: string,
  body: string,
  url: string = "/"
) {
  try {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();

    // Use FCM HTTP v1 API via a Next.js API route
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId, title, body, url })
    });
  } catch (e) {
    console.error("sendPushNotification error:", e);
  }
}
