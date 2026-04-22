"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import { Heart, X, SlidersHorizontal, Search } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { sendPushNotification } from "@/lib/sendNotification";
import { sendEmailNotification } from "@/lib/sendEmail";
import { requestNotificationPermission } from "@/lib/notifications";

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchMsg, setMatchMsg] = useState("");
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterGender, setFilterGender] = useState("Everyone");
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
      setFilterGender(profile.genderPreference || "Everyone");
      loadUsers(profile.genderPreference || "Everyone");
    }
  }, [profile, authLoading]);

  const loadUsers = async (genderFilter: string) => {
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
    if (genderFilter !== "Everyone") all = all.filter(u => u.gender === genderFilter);
    setUsers(all);
    setLoading(false);
  };

  const applyFilter = (g: string) => {
    setFilterGender(g);
    setShowFilter(false);
    loadUsers(g);
  };

  const handleLike = async () => {
    const target = users[index];
    if (!target) return;
    setSwipeDir("right");
    setTimeout(() => { setSwipeDir(null); setPhotoIndex(0); }, 400);

    await addDoc(collection(db, "likes"), {
      fromUserId: user!.uid, toUserId: target.uid, createdAt: serverTimestamp()
    });

    sendPushNotification(target.uid, "Someone liked you! 💜",
      `${profile?.name} liked your profile on BAUdate`, "/liked-me");
    sendEmailNotification(target.uid, "like", profile?.name || "Someone", "/liked-me");

    const mutual = await getDocs(query(
      collection(db, "likes"),
      where("fromUserId", "==", target.uid),
      where("toUserId", "==", user!.uid)
    ));
    if (!mutual.empty) {
      const existing = await getDocs(query(
        collection(db, "matches"),
        where("user1Id", "in", [user!.uid, target.uid]),
        where("user2Id", "in", [user!.uid, target.uid])
      ));
      if (existing.empty) {
        await addDoc(collection(db, "matches"), {
          user1Id: user!.uid, user2Id: target.uid, createdAt: serverTimestamp()
        });
        setMatchMsg(`It's a match with ${target.name}! 💜`);
        setTimeout(() => setMatchMsg(""), 3000);
        sendPushNotification(target.uid, "It's a match! 💜",
          `You and ${profile?.name} liked each other!`, "/matches");
        sendEmailNotification(target.uid, "match", profile?.name || "Someone", "/matches");
      }
    }
    setIndex(i => i + 1);
  };

  const handlePass = () => {
    setSwipeDir("left");
    setTimeout(() => { setSwipeDir(null); setPhotoIndex(0); }, 400);
    setIndex(i => i + 1);
  };

  const current = users[index];

  // Search: find first user matching the query
  const searchedUsers = search.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.major.toLowerCase().includes(search.toLowerCase()) ||
        u.interests?.some(i => i.toLowerCase().includes(search.toLowerCase()))
      )
    : users;
  const displayUser = search.trim() ? searchedUsers[0] : current;
  const displayPhotos = displayUser?.photos?.length ? displayUser.photos : displayUser ? [displayUser.photoURL] : [];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 relative overflow-hidden" style={{background:"radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A"}}>
      <style>{`
        @keyframes star-to-right{0%{background-position:-550px -315px}100%{background-position:550px 315px}}
        .sl{position:absolute;inset:0;background-repeat:repeat;background-size:550px auto;animation:star-to-right 65s linear infinite;pointer-events:none;}
        .sl1{background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png");}
        .sl2{opacity:.5;transform:scale(2);filter:blur(3px);background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png");animation-duration:30s;}
        .sl3{opacity:.3;transform:scale(1.5);filter:blur(1.5px);background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png");animation-duration:40s;}
      `}</style>
      <span className="sl sl1"/><span className="sl sl2"/><span className="sl sl3"/>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-secondary text-2xl">✦</span>
            <h1 className="text-3xl font-black text-white">Discover</h1>
          </div>
          <p className="text-white/50 text-sm">Find your perfect match</p>
        </div>

        {/* Controls row */}
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
            className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-sm hover:border-primary transition">
            <SlidersHorizontal size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Notification banner */}
        {showNotifBanner && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-primary font-semibold text-sm">Enable notifications 🔔</p>
              <p className="text-gray-500 text-xs">Get notified for likes and messages</p>
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

        {/* Gender filter modal */}
        {showFilter && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowFilter(false)}>
            <div className="bg-white rounded-t-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Show me</h2>
              {["Everyone", "Man", "Woman", "Non-binary", "Other"].map(g => (
                <button key={g} onClick={() => applyFilter(g)}
                  className={`w-full text-left px-4 py-3 rounded-2xl mb-2 font-medium transition ${
                    filterGender === g ? "bg-primary text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {matchMsg && (
          <div className="bg-primary text-white rounded-2xl p-4 text-center font-semibold mb-4 animate-bounce">
            {matchMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !displayUser ? (
          <div className="text-center pt-20">
            {search ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-bold text-gray-900 mb-2">No results for "{search}"</p>
                <p className="text-gray-500 mb-6">Try a different name, major or interest</p>
                <button onClick={() => setSearch("")}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition">
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-xl font-bold text-gray-900 mb-2">You've seen everyone!</p>
                <p className="text-gray-500 mb-6">Check back later for new people</p>
                <button onClick={() => loadUsers(filterGender)}
                  className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition">
                  Refresh
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={`transition-all duration-300 ${
            !search && swipeDir === "right" ? "translate-x-full opacity-0" :
            !search && swipeDir === "left" ? "-translate-x-full opacity-0" : ""
          }`}>
            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Photo */}
              <div className="relative">
                <img
                  src={displayPhotos[photoIndex] || displayUser.photoURL}
                  alt={displayUser.name}
                  className="w-full object-cover"
                  style={{height: "420px"}}
                />
                {/* Photo dots */}
                {displayPhotos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
                    {displayPhotos.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIndex(i)}
                        className={`h-1 rounded-full transition-all ${i === photoIndex ? "bg-white w-8" : "bg-white/50 w-4"}`} />
                    ))}
                  </div>
                )}
                {/* Tap zones for photo nav */}
                {displayPhotos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                      className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0" disabled={photoIndex === 0} />
                    <button onClick={() => setPhotoIndex(i => Math.min(displayPhotos.length - 1, i + 1))}
                      className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0" disabled={photoIndex === displayPhotos.length - 1} />
                  </>
                )}
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16">
                  <h2 className="text-white text-2xl font-bold leading-tight">{displayUser.name}, {displayUser.age}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-white/80 text-sm">{displayUser.major} · {displayUser.university}</p>
                  </div>
                </div>
              </div>

              {/* Info section */}
              <div className="p-5">
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
                <button
                  onClick={() => window.location.href = `/u/${displayUser.uid}`}
                  className="text-sky text-sm font-medium hover:underline mt-1 block"
                >
                  View Full Profile →
                </button>
              </div>
            </div>

            {/* Action buttons */}
            {!search && (
              <div className="flex justify-center items-center gap-6 mt-6 mb-4">
                <button onClick={handlePass}
                  className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition border border-gray-100">
                  <X size={24} className="text-gray-400" />
                </button>
                <button onClick={handleLike}
                  className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition"
                  style={{background:"linear-gradient(135deg,#F15B47,#DBA631)"}}>
                  <Heart size={26} className="text-white fill-white" />
                </button>
              </div>
            )}
            {search && searchedUsers.length > 1 && (
              <p className="text-center text-gray-400 text-xs mt-3">{searchedUsers.length} results — clear search to swipe</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
