import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getApps } from "firebase/app";

const getMessagingInstance = () => {
  if (typeof window === "undefined") return null;
  try {
    const app = getApps()[0];
    if (!app) return null;
    return getMessaging(app);
  } catch (e) {
    console.error("Messaging init error:", e);
    return null;
  }
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  // FCM requires HTTPS — won't work on localhost
  const isLocalhost = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    if (isLocalhost) {
      console.log("Push notifications require HTTPS. Will work after deployment.");
      return false;
    }

    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    const m = getMessagingInstance();
    if (!m) return false;

    const token = await getToken(m, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (token && auth.currentUser) {
      await setDoc(doc(db, "users", auth.currentUser.uid, "private", "notifications"), { fcmToken: token });
      console.log("FCM token saved");
    }
    return true;
  } catch (e) {
    console.error("Notification setup error:", e);
    return false;
  }
}

export function listenForForegroundMessages(onNotification: (payload: any) => void) {
  if (typeof window === "undefined") return () => {};
  try {
    const m = getMessagingInstance();
    if (!m) return () => {};
    return onMessage(m, (payload) => {
      onNotification(payload);
      if (Notification.permission === "granted" && payload.notification) {
        new Notification(payload.notification.title || "BAU Connect", {
          body: payload.notification.body,
          icon: "/icon.png"
        });
      }
    });
  } catch (e) {
    return () => {};
  }
}
