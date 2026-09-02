"use client";
import { useEffect, useRef, useState } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Message, UserProfile } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { notifyUser } from "@/lib/inbox";
import { sendEmailNotification } from "@/lib/sendEmail";

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyReady = useRef(false);

  useEffect(() => {
    if (!matchId || !user) return;
    const loadOther = async () => {
      const snap = await getDoc(doc(db, "matches", matchId));
      if (!snap.exists()) return;
      const m = snap.data();
      const otherId = m.user1Id === user.uid ? m.user2Id : m.user1Id;
      const uSnap = await getDoc(doc(db, "users", otherId));
      setOtherUser(uSnap.data() as UserProfile);
    };
    loadOther();

    const q = query(
      collection(db, "messages"),
      where("matchId", "==", matchId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snap => {
      historyReady.current = true;
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      // Mark unread messages as seen
      msgs.forEach(msg => {
        if (msg.senderId !== user.uid && !msg.seenBy?.includes(user.uid)) {
          updateDoc(doc(db, "messages", msg.id!), {
            seenBy: arrayUnion(user.uid)
          });
        }
      });
    });
  }, [matchId, user]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");

    const isFirstMessage = historyReady.current && messages.length === 0;
    const fromName = user!.displayName || "Someone";

    await addDoc(collection(db, "messages"), {
      matchId, senderId: user!.uid, text: trimmed,
      createdAt: serverTimestamp(),
      seenBy: [user!.uid]
    });

    if (otherUser) {
      await notifyUser(otherUser.uid, {
        type: "message",
        title: isFirstMessage ? "New conversation" : "New message",
        body: `${fromName}: ${trimmed.slice(0, 80)}`,
        url: `/chat/${matchId}`,
        fromUserId: user!.uid,
        fromName,
      });

      if (isFirstMessage) {
        await sendEmailNotification(
          otherUser.uid,
          "message",
          fromName,
          `/chat/${matchId}`,
          {
            title: "New conversation on BAU Connect",
            body: `${fromName} started a chat with you.`,
            firstMessage: true,
          }
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-primary hover:opacity-70 transition">
          <ArrowLeft size={22} />
        </button>
        {otherUser && (
          <>
            <Link href={`/u/${otherUser.uid}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
              <img src={otherUser.photos?.[0] || otherUser.photoURL} alt={otherUser.name}
                className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-gray-900 leading-tight truncate">{otherUser.name}</p>
                <p className="text-gray-400 text-xs truncate">{otherUser.major} · tap to view profile</p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm pt-8">
            Say hi to {otherUser?.name} 👋
          </p>
        )}
        {messages.map((m, i) => {
          const isMe = m.senderId === user!.uid;
          const isLast = i === messages.length - 1;
          const isSeen = m.seenBy?.includes(otherUser?.uid || "");
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs">
                <div className={`px-4 py-3 rounded-2xl text-sm ${
                  isMe ? "bg-primary text-white rounded-tr-sm" : "bg-white text-gray-900 rounded-tl-sm shadow-sm"
                }`}>
                  {m.text}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                  {m.createdAt && (
                    <p className="text-xs text-gray-400">
                      {format(m.createdAt.toDate?.() || new Date(), "h:mm a")}
                    </p>
                  )}
                  {/* Read receipt — only show on last sent message */}
                  {isMe && isLast && (
                    isSeen
                      ? <CheckCheck size={14} className="text-primary" />
                      : <Check size={14} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button type="submit"
          className="w-11 h-11 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition flex-shrink-0">
          <Send size={16} className="text-white" />
        </button>
      </form>
    </div>
  );
}
