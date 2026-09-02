"use client";
import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, arrayUnion, arrayRemove, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import { ACTIVITY_TYPES, CAMPUS_LOCATIONS, APP_NAME } from "@/lib/constants";
import { Activity } from "@/types";
import FeedPost from "@/components/FeedPost";
import { Plus, X } from "lucide-react";
import { notifyAllUsers } from "@/lib/inbox";

export default function ActivitiesPage() {
  const { user, profile, isAdmin } = useAuth();
  const [activities, setActivities] = useState<(Activity & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState("hangout");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [campusSpotId, setCampusSpotId] = useState("");
  const [whenLocal, setWhenLocal] = useState("");
  const [spots, setSpots] = useState("");

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "activities"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity & { id: string }));
    list.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    setActivities(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setType("hangout");
    setTitle("");
    setDescription("");
    setLocation("");
    setCampusSpotId("");
    setWhenLocal("");
    setSpots("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const when = whenLocal ? Timestamp.fromDate(new Date(whenLocal)) : null;
      const payload = {
        type,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        campusSpotId: campusSpotId || null,
        when,
        spots: type === "carpool" && spots ? parseInt(spots, 10) : null,
      };
      if (editingId) {
        const mine = activities.find(a => a.id === editingId);
        if (!mine || (mine.authorId !== user.uid && !isAdmin)) return;
        await updateDoc(doc(db, "activities", editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "activities"), {
          authorId: user.uid,
          authorName: profile.name,
          authorPhoto: profile.photoURL,
          ...payload,
          participantIds: [user.uid],
          likedBy: [],
          createdAt: serverTimestamp(),
        });
        await notifyAllUsers(user.uid, {
          type: "feed",
          title: "New campus post",
          body: `${profile.name} posted: ${title.trim()}`,
          url: "/activities",
          fromUserId: user.uid,
          fromName: profile.name,
          email: true,
        });
      }
      resetForm();
      setShowCreate(false);
      setEditingId(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJoin = async (activity: Activity & { id: string }) => {
    if (!user) return;
    const ref = doc(db, "activities", activity.id);
    const joined = activity.participantIds?.includes(user.uid);
    if (joined) {
      if (activity.authorId === user.uid) return;
      await updateDoc(ref, { participantIds: arrayRemove(user.uid) });
    } else {
      if (activity.spots && activity.participantIds.length >= activity.spots) return;
      await updateDoc(ref, { participantIds: arrayUnion(user.uid) });
    }
    await load();
  };

  const deletePost = async (a: Activity & { id: string }) => {
    if (!user || (a.authorId !== user.uid && !isAdmin)) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await deleteDoc(doc(db, "activities", a.id));
    await load();
  };

  const startEdit = (a: Activity & { id: string }) => {
    if (!user || (a.authorId !== user.uid && !isAdmin)) return;
    setEditingId(a.id);
    setType(a.type);
    setTitle(a.title);
    setDescription(a.description);
    setLocation(a.location || "");
    setCampusSpotId(a.campusSpotId || "");
    setSpots(a.spots ? String(a.spots) : "");
    if (a.when?.toDate) {
      const d = a.when.toDate() as Date;
      const pad = (n: number) => String(n).padStart(2, "0");
      setWhenLocal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setWhenLocal("");
    }
    setShowCreate(true);
  };

  const filtered =
    filter === "all" ? activities : activities.filter(a => a.type === filter);

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20 relative overflow-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-8 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white">Campus feed</h1>
            <p className="text-white/50 text-sm mt-1">
              Post carpools, study sessions, hangouts, and plans around BAU &amp; DC
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="shrink-0 flex items-center gap-2 bg-secondary text-primary font-bold text-sm px-4 py-2.5 rounded-2xl hover:opacity-90 transition"
          >
            <Plus size={18} /> Post
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${
              filter === "all" ? "bg-white text-primary" : "bg-white/10 text-white/70"
            }`}
          >
            All
          </button>
          {ACTIVITY_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === t.id ? "bg-white text-primary" : "bg-white/10 text-white/70"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-16 bg-white/5 rounded-3xl border border-white/10 p-10">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-white font-bold text-lg mb-2">No posts yet</p>
            <p className="text-white/50 text-sm mb-6">Be the first to share a carpool or plan!</p>
            <button onClick={() => setShowCreate(true)} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold">
              Create a post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(a => (
              <FeedPost
                key={a.id}
                activity={a}
                userId={user?.uid}
                userName={profile?.name}
                userPhoto={profile?.photoURL}
                onEdit={startEdit}
                onJoin={toggleJoin}
                onChanged={load}
                onDelete={deletePost}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900">{editingId ? "Edit post" : "New post"}</h2>
              <button onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }} className="p-2 text-gray-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_TYPES.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        type === t.id ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title, e.g. Ride to Metro after class"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Details: where to meet, what to bring..."
                rows={3}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="datetime-local"
                value={whenLocal}
                onChange={e => setWhenLocal(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={campusSpotId}
                onChange={e => setCampusSpotId(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Campus spot (optional)</option>
                {CAMPUS_LOCATIONS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location or meet-up point (optional)"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {type === "carpool" && (
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={spots}
                  onChange={e => setSpots(e.target.value)}
                  placeholder="Available seats"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3 rounded-2xl font-bold disabled:opacity-60"
              >
                {submitting ? (editingId ? "Saving..." : "Posting...") : editingId ? "Save changes" : `Share on ${APP_NAME}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
