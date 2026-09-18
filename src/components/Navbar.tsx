"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Users, CalendarDays, Map, UserPlus, User, LogOut, HandHeart, Menu, Bell, Shield, Flag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BauLogo from "@/components/BauLogo";

const PRIMARY_LINKS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/activities", label: "Feed", icon: CalendarDays },
  { href: "/dashboard", label: "People", icon: Users },
  { href: "/connections", label: "Connect", icon: UserPlus },
  { href: "/map", label: "Map", icon: Map },
];

const DESKTOP_EXTRA: {
  href: string;
  label: string;
  icon: LucideIcon;
  showBadge?: boolean;
}[] = [
  { href: "/notifications", label: "Alerts", icon: Bell, showBadge: true },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/connections" && (pathname === "/matches" || pathname === "/liked-me")) ||
    (href === "/volunteers" && pathname.startsWith("/volunteers")) ||
    (href === "/notifications" && pathname === "/notifications");

  const moreActive =
    menuOpen ||
    pathname === "/notifications" ||
    pathname === "/profile" ||
    pathname.startsWith("/volunteers") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "inbox"),
      where("read", "==", false)
    );
    return onSnapshot(
      q,
      snap => setUnread(snap.size),
      () => setUnread(0)
    );
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const linkClass = (active: boolean) =>
    `relative flex flex-1 flex-col md:flex-none md:flex-row items-center justify-center gap-0.5 md:gap-1.5 px-0.5 md:px-2.5 py-1.5 min-h-[44px] md:min-h-0 min-w-0 rounded-2xl transition text-[10px] leading-tight md:text-sm font-semibold ${
      active ? "text-white bg-primary" : "text-gray-400 hover:text-primary hover:bg-light"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 shadow-lg z-50 pb-[env(safe-area-inset-bottom)] md:top-0 md:bottom-auto md:border-t-0 md:border-b md:shadow-md md:h-20 md:pb-0">
      <div className="max-w-screen-xl mx-auto flex h-full items-center justify-between px-0.5 md:px-6 py-1 md:py-0 w-full">
        <div className="hidden md:flex items-center shrink-0 min-w-0">
          <Link href="/landing" className="flex items-center shrink-0">
            <BauLogo size="nav" alt="BAU Connect" className="cursor-pointer hover:opacity-90 transition shrink-0" />
          </Link>
        </div>

        <div className="flex items-stretch md:items-center gap-0 md:gap-1 flex-1 md:flex-none justify-around md:justify-end w-full min-w-0">
          {PRIMARY_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(isActive(href))}>
              <Icon size={18} className="md:w-[18px] md:h-[18px] shrink-0" />
              <span className="truncate max-w-full">{label}</span>
            </Link>
          ))}

          {DESKTOP_EXTRA.map(({ href, label, icon: Icon, showBadge }) => (
            <Link
              key={href}
              href={href}
              className={`hidden md:flex ${linkClass(isActive(href))}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {showBadge && unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          ))}

          <div ref={menuRef} className="relative flex flex-1 md:flex-none min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className={`w-full ${linkClass(moreActive)}`}
              aria-label="More"
              aria-expanded={menuOpen}
            >
              <span className="relative">
                <Menu size={18} className="md:w-[18px] md:h-[18px]" />
                {unread > 0 && (
                  <span className="md:hidden absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span>More</span>
            </button>

            {menuOpen && (
              <>
                {/* Mobile: fixed sheet above bottom nav (avoids overflow clipping) */}
                <div
                  className="md:hidden fixed inset-0 z-[90] bg-black/30"
                  aria-hidden
                  onClick={() => setMenuOpen(false)}
                />
                <div className="md:hidden fixed left-3 right-3 z-[100] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
                  style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}
                >
                  <button type="button" onClick={() => go("/notifications")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-light">
                    <span className="relative">
                      <Bell size={18} className="text-primary" />
                      {unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-sm text-gray-900">Alerts</span>
                  </button>
                  <button type="button" onClick={() => go("/profile")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-light border-t border-gray-100">
                    <User size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Profile</span>
                  </button>
                  <button type="button" onClick={() => go("/volunteers")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-light border-t border-gray-100">
                    <HandHeart size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Volunteer</span>
                  </button>
                  <button type="button" onClick={() => go("/child-safety")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-light border-t border-gray-100">
                    <Flag size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Child safety</span>
                  </button>
                  {isAdmin && (
                    <button type="button" onClick={() => go("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-light border-t border-gray-100">
                      <Shield size={18} className="text-primary" />
                      <span className="font-bold text-sm text-gray-900">Admin</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut(auth).then(() => router.replace("/landing"));
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-accent/10 border-t border-gray-100"
                  >
                    <LogOut size={18} className="text-accent" />
                    <span className="font-bold text-sm text-accent">Log out</span>
                  </button>
                </div>

                {/* Desktop dropdown */}
                <div className="hidden md:block absolute top-12 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[80]">
                  <button type="button" onClick={() => go("/volunteers")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-light transition">
                    <HandHeart size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Volunteer</span>
                  </button>
                  <button type="button" onClick={() => go("/child-safety")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-light transition border-t border-gray-100">
                    <Flag size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Child safety</span>
                  </button>
                  {isAdmin && (
                    <button type="button" onClick={() => go("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-light transition border-t border-gray-100">
                      <Shield size={18} className="text-primary" />
                      <span className="font-bold text-sm text-gray-900">Admin</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut(auth).then(() => router.replace("/landing"));
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/10 transition border-t border-gray-100"
                  >
                    <LogOut size={18} className="text-accent" />
                    <span className="font-bold text-sm text-accent">Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
