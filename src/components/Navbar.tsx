"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Flame, Heart, User, LogOut, Sparkles } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Discover", icon: Flame },
    { href: "/liked-me", label: "Liked Me", icon: Sparkles },
    { href: "/matches", label: "Matches", icon: Heart },
    { href: "/profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b md:shadow-md">
      <div className="max-w-screen-md mx-auto flex items-center justify-around md:justify-between px-6 py-3">
        <div className="hidden md:flex items-center gap-2">
          <Link href="/landing">
            <img src="/bau-logo.png" alt="BAU" style={{height:40,objectFit:"contain"}} className="cursor-pointer hover:opacity-80 transition"/>
          </Link>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col md:flex-row items-center gap-1 px-3 py-2 rounded-2xl transition text-xs md:text-sm font-semibold ${
                  active
                    ? "text-white bg-primary"
                    : "text-gray-400 hover:text-primary hover:bg-light"
                }`}>
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut(auth).then(() => router.replace("/landing"))}
            className="flex flex-col md:flex-row items-center gap-1 px-3 py-2 rounded-2xl text-gray-400 hover:text-accent hover:bg-accent/10 transition text-xs md:text-sm font-semibold">
            <LogOut size={20} />
            <span>Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
