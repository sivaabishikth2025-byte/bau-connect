"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import { UserPlus, X, SlidersHorizontal, Search, MapPin, CalendarDays } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { requestNotificationPermission } from "@/lib/notifications";
import { OPEN_TO } from "@/lib/constants";
import Link from "next/link";
import { sendFollowRequest } from "@/lib/follow";

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectMsg, setConnectMsg] = useState("");
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterOpenTo, setFilterOpenTo] = useState("Everyone");
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [search, setSearch] = useState("");

  useNotifications();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const isLocalhost = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (Notification.permission === "default" && !isLocalhost) {
        setShowNotifBanner(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && profile) {
      loadUsers("Everyone");
    }
  }, [profile, authLoading]);

  const loadUsers = async (openToFilter: string) => {
    setLoading(true);
    setIndex(0);
    setPhotoIndex(0);
    const likesSnap = await getDocs(
      query(collection(db, "likes"), where("fromUserId", "==", user!.uid))
    );
    const likedIds = likesSnap.docs.map(d => d.data().toUserId);
    const excluded = new Set([user!.uid, ...likedIds, ...(profile?.blockedUsers || [])]);
    const snap = await getDocs(collection(db, "users"));
    let all = snap.docs.map(d => d.data() as UserProfile).filter(u => !excluded.has(u.uid));
    if (openToFilter !== "Everyone") {
      all = all.filter(u => u.openTo?.includes(openToFilter));
    }
    setUsers(all);
    setLoading(false);
  };

  const applyFilter = (value: string) => {
    setFilterOpenTo(value);
    setShowFilter(false);
    loadUsers(value);
  };

  const handleConnect = async () => {
    const target = users[index];
    if (!target || !user || !profile) return;
    setSwipeDir("right");
    setTimeout(() => { setSwipeDir(null); setPhotoIndex(0); }, 400);

    const result = await sendFollowRequest({
      fromUserId: user.uid,
      fromName: profile.name,
      toUserId: target.uid,
    });
    setConnectMsg(
      result.status === "following"
        ? `You're following ${target.name}`
        : `Follow request sent to ${target.name}`
    );
    setTimeout(() => setConnectMsg(""), 2500);
    setIndex(i => i + 1);
  };

  const handleSkip = () => {
    setSwipeDir("left");
    setTimeout(() => { setSwipeDir(null); setPhotoIndex(0); }, 400);
    setIndex(i => i + 1);
  };

  const current = users[index];

  const searchedUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.major.toLowerCase().includes(search.toLowerCase()) ||
        u.interests?.some(i => i.toLowerCase().includes(search.toLowerCase())) ||
        u.openTo?.some(i => i.toLowerCase().includes(search.toLowerCase()))
      )
    : users;
  const displayUser = search.trim() ? searchedUsers[0] : current;
  const displayPhotos = displayUser?.photos?.length ? displayUser.photos : displayUser ? [displayUser.photoURL] : [];

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20 relative overflow-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-8 relative z-10">

        <div className="text-center mb-4">
          <h1 className="text-3xl font-black text-white">People</h1>
          <p className="text-white/50 text-sm mt-1">Find classmates and send a follow request</p>
        </div>

        <div className="flex gap-2 mb-4">
          <Link
            href="/activities"
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-bold px-3 py-2.5 rounded-2xl hover:bg-white/15 transition"
          >
            <CalendarDays size={14} /> Campus feed
          </Link>
          <Link
            href="/map"
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white text-xs font-bold px-3 py-2.5 rounded-2xl hover:bg-white/15 transition"
          >
            <MapPin size={14} /> BAU maps
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 flex-1 shadow-sm">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, major, interest..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilter(true)}
            className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-sm hover:border-primary transition relative">
            <SlidersHorizontal size={18} className="text-gray-500" />
            {filterOpenTo !== "Everyone" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full" />
            )}
          </button>
        </div>

        {showNotifBanner && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-primary font-semibold text-sm">Enable notifications</p>
              <p className="text-gray-500 text-xs">Get notified for follow requests and messages</p>
            </div>
            <div className="flex gap-2 ml-3">
              <button onClick={async () => { const g = await requestNotificationPermission(); if (g) setShowNotifBanner(false); }}
                className="bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition whitespace-nowrap">
                Allow
              </button>
              <button onClick={() => setShowNotifBanner(false)} className="text-gray-400 text-xs px-2 py-2 hover:text-gray-600">Later</button>
            </div>
          </div>
        )}

        {showFilter && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowFilter(false)}>
            <div className="bg-white rounded-t-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Looking for</h2>
              <p className="text-gray-500 text-sm mb-4">Filter people by what they&apos;re open to</p>
              <button onClick={() => applyFilter("Everyone")}
                className={`w-full text-left px-4 py-3 rounded-2xl mb-2 font-medium transition ${
                  filterOpenTo === "Everyone" ? "bg-primary text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}>Everyone</button>
              {OPEN_TO.map(option => (
                <button key={option} onClick={() => applyFilter(option)}
                  className={`w-full text-left px-4 py-3 rounded-2xl mb-2 font-medium transition ${
                    filterOpenTo === option ? "bg-primary text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}>{option}</button>
              ))}
            </div>
          </div>
        )}

        {connectMsg && (
          <div className="bg-primary text-white rounded-2xl p-4 text-center font-semibold mb-4 animate-bounce">
            {connectMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !displayUser ? (
          <div className="text-center pt-16 bg-white/5 rounded-3xl border border-white/10 p-10">
            {search ? (
              <>
                <p className="text-xl font-bold text-white mb-2">No results for &quot;{search}&quot;</p>
                <p className="text-white/50 mb-6 text-sm">Try a different name, major, or interest</p>
                <button onClick={() => setSearch("")}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-white mb-2">You&apos;ve seen everyone</p>
                <p className="text-white/50 mb-6 text-sm">Check the campus feed or try a different filter</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => loadUsers(filterOpenTo)}
                    className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition">
                    Refresh
                  </button>
                  <Link href="/activities" className="bg-secondary text-primary px-8 py-3 rounded-2xl font-semibold">
                    Open feed
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`transition-all duration-300 ${
            !search && swipeDir === "right" ? "translate-x-full opacity-0" :
            !search && swipeDir === "left" ? "-translate-x-full opacity-0" : ""
          }`}>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="relative">
                <img
                  src={displayPhotos[photoIndex] || displayUser.photoURL}
                  alt={displayUser.name}
                  className="w-full object-cover"
                  style={{ height: "420px" }}
                />
                {displayPhotos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
                    {displayPhotos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIndex(i)}
                        className={`h-1 rounded-full transition-all ${i === photoIndex ? "bg-white w-8" : "bg-white/50 w-4"}`} />
                    ))}
                  </div>
                )}
                {displayPhotos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                      className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0" disabled={photoIndex === 0} />
                    <button onClick={() => setPhotoIndex(i => Math.min(displayPhotos.length - 1, i + 1))}
                      className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0" disabled={photoIndex === displayPhotos.length - 1} />
                  </>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16">
                  <Link href={`/u/${displayUser.uid}`} className="text-white text-2xl font-bold leading-tight hover:underline">
                    {displayUser.name}, {displayUser.age}
                  </Link>
                  <p className="text-white/80 text-sm mt-1">{displayUser.major} · {displayUser.university}</p>
                </div>
              </div>

              <div className="p-5">
                {displayUser.openTo && displayUser.openTo.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900 mb-2">Open to</p>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.openTo.map(item => (
                        <span key={item} className="bg-sky/10 text-sky text-xs font-semibold px-3 py-1 rounded-full border border-sky/20">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {displayUser.bio && (
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900 mb-1">About</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{displayUser.bio}</p>
                  </div>
                )}
                {displayUser.interests?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-bold text-gray-900 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {displayUser.interests.slice(0, 4).map(i => (
                        <span key={i} className="bg-[#EAF2FB] text-primary text-xs font-medium px-3 py-1 rounded-full border border-[#D0E4F5]">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href={`/u/${displayUser.uid}`} className="text-sky text-sm font-medium hover:underline mt-1 block">
                  View full profile →
                </Link>
              </div>
            </div>

            {!search && (
              <div className="flex justify-center items-center gap-6 mt-6 mb-4">
                <button onClick={handleSkip}
                  className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition border border-gray-100">
                  <X size={24} className="text-gray-400" />
                </button>
                <button onClick={handleConnect}
                  className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition bg-primary">
                  <UserPlus size={26} className="text-white" />
                </button>
              </div>
            )}
            {search && searchedUsers.length > 1 && (
              <p className="text-center text-white/40 text-xs mt-3">{searchedUsers.length} results. Clear search to browse</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
