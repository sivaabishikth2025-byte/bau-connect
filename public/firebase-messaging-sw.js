importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// These values are safe to expose — they're public config
firebase.initializeApp({
  apiKey: "AIzaSyCpPrKmx8mEqTw92BKLk7NJ3Z3Cv3DbfVM",
  authDomain: "baudate-8fdb8.firebaseapp.com",
  projectId: "baudate-8fdb8",
  storageBucket: "baudate-8fdb8.firebasestorage.app",
  messagingSenderId: "831204733200",
  appId: "1:831204733200:web:6561e23b7c73c7924a7595"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || "/icon.png",
    badge: "/icon.png",
    data: { url: payload.fcmOptions?.link || payload.data?.url || "/" }
  });
});

// Click on notification opens the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
