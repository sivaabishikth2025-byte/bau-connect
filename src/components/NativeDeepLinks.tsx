"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/native";

const APP_HOSTS = ["baustudentconnect.com", "www.baustudentconnect.com"];
const APP_SCHEME = "baustudentconnect:";

function inAppPath(url: string | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // baustudentconnect://open hands a phone browser back to the app; "/" re-routes by auth state.
    if (parsed.protocol === APP_SCHEME) return "/";
    if (!APP_HOSTS.includes(parsed.hostname)) return null;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return null;
  }
}

/** Routes Android App Links (e.g. email verification) to the matching page inside the app. */
export default function NativeDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    const open = (url: string | undefined) => {
      const path = inAppPath(url);
      if (!path) return;
      const current = window.location.pathname + window.location.search + window.location.hash;
      if (path !== current) router.replace(path);
    };

    App.getLaunchUrl()
      .then(result => {
        // The launch URL persists across WebView reloads; only honour it once per session.
        if (!result?.url || sessionStorage.getItem("bau-launch-url") === result.url) return;
        sessionStorage.setItem("bau-launch-url", result.url);
        open(result.url);
      })
      .catch(() => {});
    const listener = App.addListener("appUrlOpen", event => open(event.url));
    return () => {
      listener.then(l => l.remove()).catch(() => {});
    };
  }, [router]);

  return null;
}
