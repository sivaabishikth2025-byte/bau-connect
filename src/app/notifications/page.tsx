"use client";
import { useEffect, useState } from "react";
import {
  collection, onSnapshot, orderBy, query, updateDoc, doc, writeBatch, limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import { InboxItem } from "@/types";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "inbox"),
      orderBy("createdAt", "desc"),
      limit(80)
    );
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as InboxItem)));
    });
  }, [user]);

  const openItem = async (item: InboxItem) => {
    if (user && !item.read) {
      await updateDoc(doc(db, "users", user.uid, "inbox", item.id), { read: true });
    }
    router.push(item.url || "/");
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = items.filter(i => !i.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(i => batch.update(doc(db, "users", user.uid, "inbox", i.id), { read: true }));
    await batch.commit();
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-20 relative overflow-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Bell className="text-secondary" size={26} /> Your alerts
            </h1>
            <p className="text-white/50 text-sm mt-1">Only you see this inbox</p>
          </div>
          {items.some(i => !i.read) && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-sky text-xs font-bold bg-white/10 px-3 py-2 rounded-xl">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
            <p className="text-white font-bold mb-1">No alerts yet</p>
            <p className="text-white/50 text-sm">When someone posts on the feed or reaches out, it shows up here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => openItem(item)}
                className={`w-full text-left rounded-2xl p-4 transition ${
                  item.read ? "bg-white/90" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{item.body}</p>
                  </div>
                  {!item.read && <span className="w-2.5 h-2.5 rounded-full bg-sky shrink-0 mt-1.5" />}
                </div>
                {item.createdAt?.toDate && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
