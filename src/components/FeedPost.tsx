"use client";
import { useEffect, useState } from "react";
import {
  addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, serverTimestamp, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, PostComment } from "@/types";
import { activityMeta, CAMPUS_LOCATIONS } from "@/lib/constants";
import { Calendar, Heart, MapPin, MessageCircle, Pencil, Send, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { notifyUser } from "@/lib/inbox";

export default function FeedPost({
  activity,
  userId,
  userName,
  userPhoto,
  onEdit,
  onJoin,
  onChanged,
  onDelete,
  isAdmin = false,
}: {
  activity: Activity & { id: string };
  userId?: string;
  userName?: string;
  userPhoto?: string;
  onEdit: (a: Activity & { id: string }) => void;
  onJoin: (a: Activity & { id: string }) => void;
  onChanged?: () => void;
  onDelete?: (a: Activity & { id: string }) => void;
  isAdmin?: boolean;
}) {
  const a = activity;
  const meta = activityMeta(a.type);
  const joined = userId && a.participantIds?.includes(userId);
  const full = a.spots ? a.participantIds.length >= a.spots : false;
  const spot = a.campusSpotId ? CAMPUS_LOCATIONS.find(c => c.id === a.campusSpotId) : null;
  const liked = !!(userId && a.likedBy?.includes(userId));
  const likeCount = a.likedBy?.length || 0;

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    const snap = await getDocs(collection(db, "activities", a.id, "comments"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PostComment));
    list.sort((x, y) => (x.createdAt?.toMillis?.() ?? 0) - (y.createdAt?.toMillis?.() ?? 0));
    setComments(list);
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments, a.id]);

  const toggleLike = async () => {
    if (!userId) return;
    const ref = doc(db, "activities", a.id);
    if (liked) await updateDoc(ref, { likedBy: arrayRemove(userId) });
    else {
      await updateDoc(ref, { likedBy: arrayUnion(userId) });
      if (a.authorId !== userId && userName) {
        notifyUser(a.authorId, {
          type: "join",
          title: "Someone liked your post",
          body: `${userName} liked “${a.title}”`,
          url: "/activities",
          fromUserId: userId,
          fromName: userName,
        });
      }
    }
    onChanged?.();
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !userName || !commentText.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "activities", a.id, "comments"), {
        authorId: userId,
        authorName: userName,
        authorPhoto: userPhoto || null,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      });
      if (a.authorId !== userId) {
        notifyUser(a.authorId, {
          type: "comment",
          title: "New comment on your post",
          body: `${userName}: ${commentText.trim().slice(0, 80)}`,
          url: "/activities",
          fromUserId: userId,
          fromName: userName,
        });
      }
      setCommentText("");
      await loadComments();
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="bg-white rounded-3xl shadow-lg overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-center gap-3">
        <Link href={`/u/${a.authorId}`}>
          <img
            src={a.authorPhoto || "/bau-logo.svg"}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-gray-100"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/u/${a.authorId}`} className="font-bold text-gray-900 text-sm truncate hover:underline block">
            {a.authorName}
          </Link>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-0.5"
            style={{ background: `${meta.color}22`, color: meta.color }}
          >
            <span aria-hidden>{meta.emoji}</span>
            <span>{meta.label}</span>
          </span>
        </div>
        {userId && (userId === a.authorId || isAdmin) && (
          <>
            <button onClick={() => onEdit(a)} className="p-2 text-gray-400 hover:text-primary rounded-xl hover:bg-gray-50" title="Edit post">
              <Pencil size={16} />
            </button>
            {onDelete && (
              <button onClick={() => onDelete(a)} className="p-2 text-accent hover:bg-accent/10 rounded-xl" title="Delete post">
                <Trash2 size={16} />
              </button>
            )}
          </>
        )}
      </div>
      <div className="px-5 pb-4">
        <h2 className="text-lg font-black text-gray-900 mb-2">{a.title}</h2>
        {a.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{a.description}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          {a.when?.toDate && (
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-sky" />
              {format(a.when.toDate(), "EEE, MMM d · h:mm a")}
            </span>
          )}
          {(spot || a.location) && (
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-sky" />
              {spot ? `${spot.name} (Floor ${spot.floor})` : a.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={14} className="text-sky" />
            {a.participantIds?.length || 0}
            {a.spots ? ` / ${a.spots} seats` : " joined"}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${
              liked ? "bg-accent/10 text-accent" : "bg-gray-50 text-gray-600"
            }`}
          >
            <Heart size={16} className={liked ? "fill-accent" : ""} />
            {likeCount}
          </button>
          <button
            onClick={() => setShowComments(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-gray-50 text-gray-600"
          >
            <MessageCircle size={16} />
            {showComments ? "Hide" : "Comment"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onJoin(a)}
            disabled={!joined && full}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition ${
              joined
                ? "bg-gray-100 text-gray-700"
                : full
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {a.authorId === userId
              ? "Your post"
              : joined
                ? "Leave"
                : full
                  ? "Full"
                  : a.type === "carpool"
                    ? "Join ride"
                    : "I'm in"}
          </button>
          <Link
            href={`/u/${a.authorId}`}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Profile
          </Link>
          {spot && (
            <Link
              href={`/map?spot=${spot.id}`}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-sky hover:bg-sky/5"
            >
              Map
            </Link>
          )}
        </div>

        {showComments && (
          <div className="mt-4 border-t border-gray-100 pt-3 space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <Link href={`/u/${c.authorId}`} className="shrink-0">
                  <img src={c.authorPhoto || "/bau-logo.svg"} alt="" className="w-8 h-8 rounded-full object-cover" />
                </Link>
                <div className="bg-gray-50 rounded-2xl px-3 py-2 flex-1">
                  <Link href={`/u/${c.authorId}`} className="text-xs font-bold text-gray-900 hover:underline">
                    {c.authorName}
                  </Link>
                  <p className="text-sm text-gray-700">{c.text}</p>
                </div>
              </div>
            ))}
            {userId && (
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="submit" disabled={sending || !commentText.trim()} className="p-2.5 bg-primary text-white rounded-2xl disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
