"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Users, CalendarDays, Map, UserPlus, User, LogOut, HandHeart, Menu, X, Bell, Shield } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/dashboard", label: "People", icon: Users },
    { href: "/activities", label: "Feed", icon: CalendarDays },
    { href: "/map", label: "Map", icon: Map },
    { href: "/volunteers", label: "Volunteer", icon: HandHeart },
    { href: "/connections", label: "Connect", icon: UserPlus },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/connections" && (pathname === "/matches" || pathname === "/liked-me")) ||
    (href === "/volunteers" && pathname.startsWith("/volunteers"));

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
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:shadow-md">
      <div className="max-w-screen-xl mx-auto flex items-center justify-around md:justify-between px-1 md:px-6 py-2 md:py-3">
        <div className="hidden md:flex items-center gap-2">
          <Link href="/landing" className="flex items-center gap-2">
            <img src="/bau-logo.png" alt="BAU Connect" style={{ height: 44, width: "auto", objectFit: "contain" }} className="cursor-pointer hover:opacity-80 transition" />
            <span className="font-black text-primary text-sm tracking-tight">BAU Connect</span>
          </Link>
        </div>
        <div className="flex items-center gap-0 md:gap-1 w-full md:w-auto justify-around md:justify-end overflow-visible">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-1.5 md:px-2.5 py-2 rounded-2xl transition text-[9px] md:text-sm font-semibold shrink-0 ${
                  active
                    ? "text-white bg-primary"
                    : "text-gray-400 hover:text-primary hover:bg-light"
                }`}
              >
                <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                <span>{label}</span>
              </Link>
            );
          })}

          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className={`relative flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-1.5 md:px-2.5 py-2 rounded-2xl transition text-[9px] md:text-sm font-semibold ${
                menuOpen || pathname === "/notifications" || pathname.startsWith("/admin")
                  ? "text-white bg-primary"
                  : "text-gray-400 hover:text-primary hover:bg-light"
              }`}
              aria-label="Menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
              <span>Menu</span>
              {unread > 0 && !menuOpen && (
                <span className="absolute -top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {menuOpen && (
              <div className="absolute bottom-14 right-0 md:bottom-auto md:top-12 md:right-0 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[80]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/notifications");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-light transition"
                >
                  <span className="relative">
                    <Bell size={18} className="text-primary" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-sm text-gray-900">Notifications</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/admin");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-light transition border-t border-gray-100"
                  >
                    <Shield size={18} className="text-primary" />
                    <span className="font-bold text-sm text-gray-900">Admin</span>
                  </button>
                )}
                <button
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
