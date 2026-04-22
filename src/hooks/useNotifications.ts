import { useEffect } from "react";
import { requestNotificationPermission, listenForForegroundMessages } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Request permission once user is logged in
    requestNotificationPermission();
    // Listen for foreground messages
    const unsub = listenForForegroundMessages((payload) => {
      console.log("Foreground notification:", payload);
    });
    return unsub;
  }, [user]);
}
