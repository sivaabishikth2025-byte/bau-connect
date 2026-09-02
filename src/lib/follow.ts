import {
  addDoc, collection, getDocs, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { notifyUser } from "./inbox";
import { APP_NAME } from "./constants";

export async function findMatchId(userA: string, userB: string) {
  const [s1, s2] = await Promise.all([
    getDocs(query(collection(db, "matches"), where("user1Id", "==", userA), where("user2Id", "==", userB))),
    getDocs(query(collection(db, "matches"), where("user1Id", "==", userB), where("user2Id", "==", userA))),
  ]);
  const hit = s1.docs[0] || s2.docs[0];
  return hit?.id || null;
}

export async function findFollowRequest(fromUserId: string, toUserId: string) {
  const snap = await getDocs(
    query(
      collection(db, "likes"),
      where("fromUserId", "==", fromUserId),
      where("toUserId", "==", toUserId)
    )
  );
  return snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

export async function sendFollowRequest(opts: {
  fromUserId: string;
  fromName: string;
  toUserId: string;
}) {
  const existingMatch = await findMatchId(opts.fromUserId, opts.toUserId);
  if (existingMatch) return { status: "following" as const, matchId: existingMatch };

  const already = await findFollowRequest(opts.fromUserId, opts.toUserId);
  if (already) return { status: "requested" as const };

  await addDoc(collection(db, "likes"), {
    fromUserId: opts.fromUserId,
    toUserId: opts.toUserId,
    createdAt: serverTimestamp(),
  });

  await notifyUser(opts.toUserId, {
    type: "connect",
    title: "New follow request",
    body: `${opts.fromName} wants to follow you on ${APP_NAME}`,
    url: "/connections?tab=requests",
    fromUserId: opts.fromUserId,
    fromName: opts.fromName,
    email: true,
  });

  return { status: "requested" as const };
}

export async function ensureMatch(userA: string, userB: string) {
  const existing = await findMatchId(userA, userB);
  if (existing) return existing;
  const ref = await addDoc(collection(db, "matches"), {
    user1Id: userA,
    user2Id: userB,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
