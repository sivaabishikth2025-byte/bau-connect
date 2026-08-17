"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import { ArrowLeft, MapPin, UserPlus, MessageCircle } from "lucide-react";
import { findFollowRequest, findMatchId, sendFollowRequest } from "@/lib/follow";
import Link from "next/link";

export default function FullProfile() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [acting, setActing] = useState(false);
  const [followState, setFollowState] = useState<"none" | "requested" | "following">("none");
  const [matchId, setMatchId] = useState<string | null>(null);

  const isSelf = !!user && user.uid === uid;

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => {
    if (!user || !uid || user.uid === uid) return;
    (async () => {
      const mid = await findMatchId(user.uid, uid);
      if (mid) {
        setMatchId(mid);
        setFollowState("following");
        return;
      }
      const pending = await findFollowRequest(user.uid, uid);
      setFollowState(pending ? "requested" : "none");
    })();
  }, [user, uid]);

  const handleFollow = async () => {
    if (!user || !myProfile || !profile || acting || isSelf) return;
    setActing(true);
    const result = await sendFollowRequest({
      fromUserId: user.uid,
      fromName: myProfile.name,
      toUserId: profile.uid,
    });
    if (result.status === "following") {
      setFollowState("following");
      setMatchId(result.matchId || null);
    } else {
      setFollowState("requested");
    }
    setActing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Profile not found.</p>
    </div>
  );

  const photos = profile.photos?.length ? profile.photos : [profile.photoURL];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="fixed top-4 left-4 z-20">
        <button onClick={() => router.back()}
          className="bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md hover:bg-white transition">
          <ArrowLeft size={20} className="text-primary" />
        </button>
      </div>

      <div className="relative w-full" style={{ height: "480px" }}>
        <img src={photos[photoIndex]} alt={profile.name} className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 px-4">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIndex(i)}
                className={`h-1 rounded-full transition-all ${i === photoIndex ? "bg-white w-8" : "bg-white/50 w-4"}`} />
            ))}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
              className="absolute left-0 top-0 bottom-0 w-1/3" disabled={photoIndex === 0} />
            <button onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
              className="absolute right-0 top-0 bottom-0 w-1/3" disabled={photoIndex === photos.length - 1} />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 pt-20">
          <h1 className="text-white text-3xl font-black">{profile.name}, {profile.age}</h1>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={14} className="text-white/70" />
            <p className="text-white/80 text-sm">{profile.major} · {profile.university}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
          {profile.openTo && profile.openTo.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Open to</p>
              <div className="flex flex-wrap gap-2">
                {profile.openTo.map(i => (
                  <span key={i} className="bg-sky/10 text-sky text-sm font-semibold px-4 py-1.5 rounded-full border border-sky/20">{i}</span>
                ))}
              </div>
            </div>
          )}
          {profile.bio && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About</p>
              <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
          {profile.interests?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <span key={i} className="bg-[#EAF2FB] text-primary text-sm font-medium px-4 py-1.5 rounded-full border border-[#D0E4F5]">{i}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "University", value: profile.university },
                { label: "Major", value: profile.major },
                { label: "Age", value: String(profile.age) },
                { label: "Gender", value: profile.gender },
              ].map(d => (
                <div key={d.label} className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">{d.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
          {profile.gallery?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gallery</p>
              <div className="grid grid-cols-3 gap-2">
                {profile.gallery.slice(0, 6).map((p, i) => (
                  <img key={i} src={p} alt="" className="w-full aspect-square object-cover rounded-2xl" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isSelf && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center gap-3 py-5 px-4"
          style={{ background: "linear-gradient(to top, rgba(244,247,255,1) 70%, transparent)" }}>
          {followState === "following" && matchId ? (
            <Link
              href={`/chat/${matchId}`}
              className="flex items-center gap-2 bg-primary text-white rounded-2xl px-8 py-4 font-semibold shadow-lg"
            >
              <MessageCircle size={18} /> Message
            </Link>
          ) : followState === "requested" ? (
            <div className="bg-white rounded-2xl px-8 py-4 font-semibold text-gray-500 shadow-lg border border-gray-100">
              Follow request sent
            </div>
          ) : (
            <button
              onClick={handleFollow}
              disabled={acting || !user}
              className="flex items-center gap-2 bg-primary text-white rounded-2xl px-8 py-4 font-semibold shadow-lg disabled:opacity-60"
            >
              <UserPlus size={18} /> Follow
            </button>
          )}
        </div>
      )}
    </div>
  );
}
