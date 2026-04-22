"use client";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}
