"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import { ArrowLeft, MapPin, Heart, X } from "lucide-react";
import { sendPushNotification } from "@/lib/sendNotification";
import { sendEmailNotification } from "@/lib/sendEmail";

export default function FullProfile() {
  const { uid } = useParams<{ uid: string }>();
  const router = useRouter();
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [action, setAction] = useState<"liked" | "passed" | null>(null);
  const [acting, setActing] = useState(false);
  const [matchMsg, setMatchMsg] = useState("");
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
      setLoading(false);
    });
  }, [uid]);

  // Check if already matched
  useEffect(() => {
    if (!user || !uid) return;
    Promise.all([
      getDocs(query(collection(db, "matches"), where("user1Id", "==", user.uid), where("user2Id", "==", uid))),
      getDocs(query(collection(db, "matches"), where("user1Id", "==", uid), where("user2Id", "==", user.uid)))
    ]).then(([s1, s2]) => {
      if (!s1.empty || !s2.empty) setIsMatch(true);
    });
  }, [user, uid]);

  const handleLike = async () => {
    if (!user || !myProfile || !profile || acting) return;
    setActing(true);
    await addDoc(collection(db, "likes"), {
      fromUserId: user.uid, toUserId: profile.uid, createdAt: serverTimestamp()
    });
    sendPushNotification(profile.uid, "Someone liked you! 💜",
      `${myProfile.name} liked your profile on BAUdate`, "/liked-me");
    sendEmailNotification(profile.uid, "like", myProfile.name, "/liked-me");

    // Check mutual
    const mutual = await getDocs(query(
      collection(db, "likes"),
      where("fromUserId", "==", profile.uid),
      where("toUserId", "==", user.uid)
    ));
    if (!mutual.empty) {
      const existing = await getDocs(query(
        collection(db, "matches"),
        where("user1Id", "in", [user.uid, profile.uid]),
        where("user2Id", "in", [user.uid, profile.uid])
      ));
      if (existing.empty) {
        await addDoc(collection(db, "matches"), {
          user1Id: user.uid, user2Id: profile.uid, createdAt: serverTimestamp()
        });
        sendPushNotification(profile.uid, "It's a match! 💜",
          `You and ${myProfile.name} liked each other!`, "/matches");
        sendEmailNotification(profile.uid, "match", myProfile.name, "/matches");
        setMatchMsg(`It's a match with ${profile.name}!`);
        setTimeout(() => router.replace("/matches"), 2000);
        return;
      }
    }
    setAction("liked");
    setActing(false);
  };

  const handlePass = () => {
    setAction("passed");
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
      {/* Back button */}
      <div className="fixed top-4 left-4 z-20">
        <button onClick={() => router.back()}
          className="bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md hover:bg-white transition">
          <ArrowLeft size={20} className="text-primary" />
        </button>
      </div>

      {/* Match toast */}
      {matchMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-semibold text-sm animate-bounce">
          {matchMsg} 💜 Redirecting...
        </div>
      )}

      {/* Photo carousel */}
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

      {/* Info card */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
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
                {profile.gallery.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-full aspect-square object-cover rounded-2xl" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed action bar — hidden for existing matches */}
      {!action && !isMatch && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center items-center gap-6 py-5 px-4"
          style={{background:"linear-gradient(to top, rgba(244,247,255,1) 70%, transparent)"}}>
          <button onClick={handlePass}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition border border-gray-100">
            <X size={24} className="text-gray-400" />
          </button>
          <button onClick={handleLike} disabled={acting}
            className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition disabled:opacity-60"
            style={{background:"linear-gradient(135deg,#F15B47,#DBA631)"}}>
            <Heart size={26} className="text-white fill-white" />
          </button>
        </div>
      )}

      {/* Already matched — show chat button instead */}
      {isMatch && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center py-5 px-4"
          style={{background:"linear-gradient(to top, rgba(244,247,255,1) 70%, transparent)"}}>
          <button onClick={() => router.back()}
            className="flex items-center gap-2 bg-primary text-white rounded-2xl px-8 py-4 font-semibold shadow-lg hover:bg-primary/90 transition">
            <Heart size={18} className="fill-white" /> You're matched · Go back to chat
          </button>
        </div>
      )}

      {/* Post-action feedback */}
      {action === "liked" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center py-5 px-4"
          style={{background:"linear-gradient(to top, rgba(244,247,255,1) 70%, transparent)"}}>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
            <Heart size={20} className="text-accent fill-accent" />
            <p className="text-primary font-semibold text-sm">You liked {profile.name}!</p>
            <button onClick={() => router.back()} className="text-sky text-sm font-medium hover:underline ml-2">Back</button>
          </div>
        </div>
      )}
      {action === "passed" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center py-5 px-4"
          style={{background:"linear-gradient(to top, rgba(244,247,255,1) 70%, transparent)"}}>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100">
            <X size={20} className="text-gray-400" />
            <p className="text-gray-600 font-semibold text-sm">Passed on {profile.name}</p>
            <button onClick={() => router.back()} className="text-sky text-sm font-medium hover:underline ml-2">Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

