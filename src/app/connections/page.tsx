"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection, query, where, getDocs, doc, getDoc, deleteDoc, addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Match, UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import Link from "next/link";
import { MessageCircle, Search, Trash2, UserPlus, Check, X } from "lucide-react";
import { sendPushNotification } from "@/lib/sendNotification";
import { safetyRequest } from "@/lib/safety";
import { findMatchId } from "@/lib/follow";
import { notifyUser } from "@/lib/inbox";

type Tab = "connected" | "requests";

interface MatchWithUser extends Match {
  otherUser: UserProfile;
  sharedInterests: number;
}

interface LikeEntry {
  docId: string;
  user: UserProfile;
}

export default function ConnectionsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ConnectionsPage />
    </Suspense>
  );
}

function ConnectionsPage() {
  const searchParams = useSearchParams();
  const { user, profile: myProfile } = useAuth();
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "requests" ? "requests" : "connected"
  );
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [requests, setRequests] = useState<LikeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadConnected = async () => {
    if (!user || !myProfile) return;
    const [s1, s2] = await Promise.all([
      getDocs(query(collection(db, "matches"), where("user1Id", "==", user.uid))),
      getDocs(query(collection(db, "matches"), where("user2Id", "==", user.uid)))
    ]);
    const all = [...s1.docs, ...s2.docs];
    const enriched = await Promise.all(all.map(async d => {
      const match = { id: d.id, ...d.data() } as Match;
      const otherId = match.user1Id === user.uid ? match.user2Id : match.user1Id;
      const snap = await getDoc(doc(db, "users", otherId));
      if (!snap.exists()) return null;
      const otherUser = snap.data() as UserProfile;
      if (myProfile.blockedUsers?.includes(otherId) || otherUser.blockedUsers?.includes(user.uid) || (otherUser as any).hidden) return null;
      const shared = myProfile.interests?.filter(i => otherUser.interests?.includes(i)).length ?? 0;
      return { ...match, otherUser, sharedInterests: shared };
    }));
    setMatches(enriched.filter((m): m is MatchWithUser => m !== null));
  };

  const loadRequests = async () => {
    if (!user) return;
    const [m1, m2] = await Promise.all([
      getDocs(query(collection(db, "matches"), where("user1Id", "==", user.uid))),
      getDocs(query(collection(db, "matches"), where("user2Id", "==", user.uid)))
    ]);
    const matchedIds = new Set([
      ...m1.docs.map(d => d.data().user2Id),
      ...m2.docs.map(d => d.data().user1Id)
    ]);
    const likedMeSnap = await getDocs(
      query(collection(db, "likes"), where("toUserId", "==", user.uid))
    );
    const entries = await Promise.all(
      likedMeSnap.docs.map(async d => {
        const fromId = d.data().fromUserId;
        if (matchedIds.has(fromId) || myProfile?.blockedUsers?.includes(fromId)) return null;
        const snap = await getDoc(doc(db, "users", fromId));
        if (!snap.exists()) return null;
        return { docId: d.id, user: snap.data() as UserProfile };
      })
    );
    setRequests(entries.filter(Boolean) as LikeEntry[]);
  };

  const load = async () => {
    setLoading(true);
    await Promise.all([loadConnected(), loadRequests()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, myProfile]);

  const handleRemove = async (matchId: string, otherUserId: string) => {
    setRemoving(matchId);
    await deleteDoc(doc(db, "matches", matchId));
    const [l1, l2] = await Promise.all([
      getDocs(query(collection(db, "likes"), where("fromUserId", "==", user!.uid), where("toUserId", "==", otherUserId))),
      getDocs(query(collection(db, "likes"), where("fromUserId", "==", otherUserId), where("toUserId", "==", user!.uid)))
    ]);
    await Promise.all([...l1.docs, ...l2.docs].map(d => deleteDoc(d.ref)));
    setMatches(prev => prev.filter(m => m.id !== matchId));
    setConfirmId(null);
    setRemoving(null);
  };

  const acceptRequest = async (entry: LikeEntry) => {
    if (!user || !myProfile) return;
    setActing(entry.docId);
    await addDoc(collection(db, "likes"), {
      fromUserId: user.uid, toUserId: entry.user.uid, createdAt: serverTimestamp()
    });
    const existing = await findMatchId(user.uid, entry.user.uid);
    if (!existing) {
      await safetyRequest("/api/connections", { otherId: entry.user.uid });
      sendPushNotification(entry.user.uid, "Follow request accepted",
        `${myProfile.name} accepted your follow request on BAU Connect`, "/connections");
      await notifyUser(entry.user.uid, {
        type: "connected",
        title: "Follow request accepted",
        body: `${myProfile.name} accepted your follow request. You can message them now`,
        url: "/connections",
        fromUserId: user.uid,
        fromName: myProfile.name,
      });
    }
    await load();
    setActing(null);
  };

  const declineRequest = async (entry: LikeEntry) => {
    setActing(entry.docId);
    await deleteDoc(doc(db, "likes", entry.docId));
    setRequests(prev => prev.filter(r => r.docId !== entry.docId));
    setActing(null);
  };

  const filtered = matches.filter(m =>
    m.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
    m.otherUser.major.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen app-bottom-pad md:pb-0 md:pt-20 relative overflow-x-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white">Following</h1>
          <p className="text-white/50 text-sm">People you follow can message you, like Instagram</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {(["connected", "requests"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition ${
                tab === t ? "bg-white text-primary" : "bg-white/10 text-white/70"
              }`}
            >
              {t === "connected" ? "Following" : "Follow requests"}
              {t === "requests" && requests.length > 0 && (
                <span className="ml-2 bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "connected" && (
          <>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-6 max-w-sm">
              <Search size={15} className="text-white/50 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search connections..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder-white/40"
              />
            </div>
            {loading ? (
              <div className="flex justify-center pt-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center pt-16">
                <UserPlus size={48} className="mx-auto text-white/30 mb-4" />
                <p className="text-xl font-bold text-white mb-2">Nobody yet</p>
                <p className="text-white/50 mb-6">Send a follow request from People or a profile</p>
                <Link href="/dashboard" className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold inline-block">
                  Find people
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(m => (
                  <div key={m.id} className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                    <div className="relative">
                      <img
                        src={m.otherUser.photos?.[0] || m.otherUser.photoURL}
                        alt={m.otherUser.name}
                        className="w-full object-cover"
                        style={{ height: "220px" }}
                      />
                      {m.sharedInterests > 0 && (
                        <div className="absolute top-3 right-3 bg-lime text-primary text-xs font-black px-2.5 py-1 rounded-full shadow">
                          {m.sharedInterests} shared interest{m.sharedInterests !== 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <Link href={`/u/${m.otherUser.uid}`}>
                          <p className="text-white font-black text-lg hover:underline">{m.otherUser.name}</p>
                        </Link>
                        <p className="text-white/80 text-xs">{m.otherUser.major}</p>
                      </div>
                      <button onClick={() => setConfirmId(m.id)}
                        className="absolute top-3 left-3 bg-black/30 hover:bg-black/50 rounded-full p-1.5 transition">
                        <Trash2 size={13} className="text-white" />
                      </button>
                    </div>
                    <div className="p-4 flex gap-2 mt-auto">
                      <Link href={`/u/${m.otherUser.uid}`}
                        className="flex-1 text-center py-2.5 rounded-2xl text-white text-sm font-bold"
                        style={{ background: "linear-gradient(to right,#F15B47,#DBA631)" }}>
                        Profile
                      </Link>
                      <Link href={`/chat/${m.id}`}
                        className="w-10 h-10 bg-sky rounded-2xl flex items-center justify-center shrink-0">
                        <MessageCircle size={16} className="text-white" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "requests" && (
          <>
            {loading ? (
              <div className="flex justify-center pt-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center pt-16 text-white/60">
                <p className="font-bold text-white text-lg mb-2">No pending requests</p>
                <p className="text-sm">When someone sends you a follow request, they&apos;ll show up here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(entry => (
                  <div key={entry.docId} className="bg-white rounded-2xl p-4 flex items-center gap-4">
                    <img src={entry.user.photoURL} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/u/${entry.user.uid}`}>
                        <p className="font-bold text-gray-900 truncate hover:underline">{entry.user.name}</p>
                        <p className="text-xs text-gray-500">{entry.user.major}</p>
                      </Link>
                      {entry.user.openTo?.length ? (
                        <p className="text-xs text-sky mt-1 truncate">Open to: {entry.user.openTo.slice(0, 2).join(", ")}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={acting === entry.docId}
                        onClick={() => declineRequest(entry)}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <X size={18} />
                      </button>
                      <button
                        disabled={acting === entry.docId}
                        onClick={() => acceptRequest(entry)}
                        className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
                      >
                        <Check size={14} /> Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Unfollow?</h2>
            <p className="text-gray-500 text-sm mb-6">You can send a follow request again later.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-gray-500 font-medium">
                Cancel
              </button>
              <button
                onClick={() => { const m = matches.find(x => x.id === confirmId); if (m) handleRemove(m.id, m.otherUser.uid); }}
                disabled={!!removing}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 font-semibold disabled:opacity-60">
                {removing ? "Removing..." : "Unfollow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
