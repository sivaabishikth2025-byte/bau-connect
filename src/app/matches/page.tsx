"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, doc, getDoc, deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Match, UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Heart, MessageCircle, Search, Trash2 } from "lucide-react";

interface MatchWithUser extends Match {
  otherUser: UserProfile;
  matchScore: number;
}

function getMatchScore(a: UserProfile, b: UserProfile): number {
  if (!a?.interests || !b?.interests) return Math.floor(Math.random() * 30 + 70);
  const shared = a.interests.filter(i => b.interests.includes(i)).length;
  const total = new Set([...a.interests, ...b.interests]).size;
  const base = total > 0 ? Math.round((shared / total) * 40) : 0;
  return Math.min(99, 60 + base + Math.floor(Math.random() * 15));
}

export default function Matches() {
  const { user, profile: myProfile } = useAuth();
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [s1, s2] = await Promise.all([
      getDocs(query(collection(db, "matches"), where("user1Id", "==", user.uid))),
      getDocs(query(collection(db, "matches"), where("user2Id", "==", user.uid)))
    ]);
    const all = [...s1.docs, ...s2.docs];
    const enriched = await Promise.all(all.map(async d => {
      const match = { id: d.id, ...d.data() } as Match;
      const otherId = match.user1Id === user.uid ? match.user2Id : match.user1Id;
      const snap = await getDoc(doc(db, "users", otherId));
      const otherUser = snap.data() as UserProfile;
      return { ...match, otherUser, matchScore: getMatchScore(myProfile!, otherUser) };
    }));
    setMatches(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

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

  const filtered = matches.filter(m =>
    m.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
    m.otherUser.major.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="max-w-4xl mx-auto px-4 pt-8 relative z-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={24} className="text-accent fill-accent" />
            <h1 className="text-3xl font-black text-white">Your Matches</h1>
          </div>
          <p className="text-white/50 text-sm">{matches.length} {matches.length === 1 ? "person" : "people"} who liked you back</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-6 shadow-sm max-w-sm">
          <Search size={15} className="text-white/50 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search matches..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder-white/40"
          />
        </div>

        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center pt-20">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-xl font-bold text-white mb-2">No matches yet</p>
            <p className="text-white/50">Keep swiping on Discover!</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-white/50 text-sm text-center pt-12">No matches found for "{search}"</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(m => (
              <div key={m.id} className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col">
                {/* Photo */}
                <div className="relative">
                  <img
                    src={m.otherUser.photos?.[0] || m.otherUser.photoURL}
                    alt={m.otherUser.name}
                    className="w-full object-cover"
                    style={{height: "220px"}}
                  />
                  {/* Match score badge */}
                  <div className="absolute top-3 right-3 bg-lime text-primary text-xs font-black px-2.5 py-1 rounded-full shadow">
                    {m.matchScore}% Match
                  </div>
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-black text-lg leading-tight">{m.otherUser.name}, {m.otherUser.age}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-white/80 text-xs">{m.otherUser.major}</p>
                    </div>
                  </div>
                  {/* Remove button */}
                  <button onClick={() => setConfirmId(m.id)}
                    className="absolute top-3 left-3 bg-black/30 hover:bg-black/50 rounded-full p-1.5 transition">
                    <Trash2 size={13} className="text-white" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  {m.otherUser.bio && (
                    <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{m.otherUser.bio}</p>
                  )}
                  {m.otherUser.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {m.otherUser.interests.slice(0, 3).map(i => (
                        <span key={i} className="bg-[#EAF2FB] text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-[#D0E4F5]">{i}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/u/${m.otherUser.uid}`}
                      className="flex-1 text-center py-2.5 rounded-2xl text-white text-sm font-bold transition hover:opacity-90"
                      style={{background:"linear-gradient(to right,#F15B47,#DBA631)"}}>
                      View Profile
                    </Link>
                    <Link href={`/chat/${m.id}`}
                      className="w-10 h-10 bg-sky rounded-2xl flex items-center justify-center hover:bg-sky/90 transition shrink-0">
                      <MessageCircle size={16} className="text-white" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm remove modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Remove match?</h2>
            <p className="text-gray-500 text-sm mb-6">This will remove the match and both likes. They won't appear in Discover again unless you re-like them.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-gray-500 font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                onClick={() => { const m = matches.find(x => x.id === confirmId); if (m) handleRemove(m.id, m.otherUser.uid); }}
                disabled={!!removing}
                className="flex-1 bg-red-500 text-white rounded-2xl py-3 font-semibold hover:bg-red-600 transition disabled:opacity-60">
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
