"use client";
import { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, doc, getDoc,
  addDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import { Heart, X, Check } from "lucide-react";
import { sendPushNotification } from "@/lib/sendNotification";
import { sendEmailNotification } from "@/lib/sendEmail";

type Tab = "liked-me" | "my-likes";

interface LikeEntry {
  docId: string;
  user: UserProfile;
}

export default function LikedMe() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("liked-me");
  const [likedMe, setLikedMe] = useState<LikeEntry[]>([]);
  const [myLikes, setMyLikes] = useState<LikeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDone, setActionDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      // Get my existing matches to exclude from "Liked Me"
      const [m1, m2] = await Promise.all([
        getDocs(query(collection(db, "matches"), where("user1Id", "==", user.uid))),
        getDocs(query(collection(db, "matches"), where("user2Id", "==", user.uid)))
      ]);
      const matchedIds = new Set([
        ...m1.docs.map(d => d.data().user2Id),
        ...m2.docs.map(d => d.data().user1Id)
      ]);

      // Who liked me — exclude already matched
      const likedMeSnap = await getDocs(
        query(collection(db, "likes"), where("toUserId", "==", user.uid))
      );
      const likedMeEntries = await Promise.all(
        likedMeSnap.docs.map(async d => {
          const fromId = d.data().fromUserId;
          if (matchedIds.has(fromId)) return null; // already a match, skip
          const uSnap = await getDoc(doc(db, "users", fromId));
          return uSnap.exists() ? { docId: d.id, user: uSnap.data() as UserProfile } : null;
        })
      );

      // Who I liked — exclude already matched
      const myLikesSnap = await getDocs(
        query(collection(db, "likes"), where("fromUserId", "==", user.uid))
      );
      const myLikesEntries = await Promise.all(
        myLikesSnap.docs.map(async d => {
          const toId = d.data().toUserId;
          if (matchedIds.has(toId)) return null; // already a match, skip
          const uSnap = await getDoc(doc(db, "users", toId));
          return uSnap.exists() ? { docId: d.id, user: uSnap.data() as UserProfile } : null;
        })
      );

      setLikedMe(likedMeEntries.filter(Boolean) as LikeEntry[]);
      setMyLikes(myLikesEntries.filter(Boolean) as LikeEntry[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLikeBack = async (entry: LikeEntry) => {
    if (!user || !profile) return;
    setActionDone(prev => new Set(prev).add(entry.docId));
    await addDoc(collection(db, "likes"), {
      fromUserId: user.uid, toUserId: entry.user.uid, createdAt: serverTimestamp()
    });
    const existing = await getDocs(query(
      collection(db, "matches"),
      where("user1Id", "in", [user.uid, entry.user.uid]),
      where("user2Id", "in", [user.uid, entry.user.uid])
    ));
    if (existing.empty) {
      await addDoc(collection(db, "matches"), {
        user1Id: user.uid, user2Id: entry.user.uid, createdAt: serverTimestamp()
      });
      sendPushNotification(entry.user.uid, "It's a match! 💜",
        `You and ${profile.name} liked each other!`, "/matches");
      sendEmailNotification(entry.user.uid, "match", profile.name, "/matches");
    }
  };

  const handlePass = async (entry: LikeEntry) => {
    setActionDone(prev => new Set(prev).add(entry.docId));
    await deleteDoc(doc(db, "likes", entry.docId));
  };

  const handleUnlike = async (entry: LikeEntry) => {
    setActionDone(prev => new Set(prev).add(entry.docId));
    await deleteDoc(doc(db, "likes", entry.docId));
  };

  const activeList = tab === "liked-me" ? likedMe : myLikes;
  const visibleList = activeList.filter(e => !actionDone.has(e.docId));

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
      <div className="max-w-md mx-auto px-4 pt-8 relative z-10">
        <h1 className="text-2xl font-black text-white mb-4">Likes</h1>

        <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
          {(["liked-me", "my-likes"] as Tab[]).map(t => {
            const count = (t === "liked-me" ? likedMe : myLikes).filter(e => !actionDone.has(e.docId)).length;
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                  tab === t ? "bg-sky text-white shadow" : "text-white/60 hover:text-white"
                }`}>
                {t === "liked-me" ? "Liked Me" : "My Likes"}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t ? "bg-white/20" : "bg-white/10"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleList.length === 0 ? (
          <div className="text-center pt-20">
            <div className="text-6xl mb-4">{tab === "liked-me" ? "💜" : "🔍"}</div>
            <p className="text-xl font-bold text-white mb-2">
              {tab === "liked-me" ? "No pending likes" : "You haven't liked anyone yet"}
            </p>
            <p className="text-white/50 text-sm">
              {tab === "liked-me" ? "Matched people appear in your Matches tab" : "Head to Discover to find people"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleList.map(entry => (
              <div key={entry.docId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="relative">
                  <img src={entry.user.photos?.[0] || entry.user.photoURL} alt={entry.user.name}
                    className="w-full h-48 object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white font-bold text-sm">{entry.user.name}, {entry.user.age}</p>
                    <p className="text-white/70 text-xs">{entry.user.major}</p>
                  </div>
                  <div className="absolute top-2 right-2 bg-secondary rounded-full p-1.5">
                    <Heart size={12} className="text-white fill-white" />
                  </div>
                </div>
                {tab === "liked-me" ? (
                  <div className="flex gap-2 p-3">
                    <button onClick={() => handlePass(entry)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400 transition text-xs font-semibold">
                      <X size={14} /> Pass
                    </button>
                    <button onClick={() => handleLikeBack(entry)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition text-xs font-semibold">
                      <Check size={14} /> Like Back
                    </button>
                  </div>
                ) : (
                  <div className="p-3">
                    <button onClick={() => handleUnlike(entry)}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400 transition text-xs font-semibold">
                      <X size={14} /> Unlike
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
