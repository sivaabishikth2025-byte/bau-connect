"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { safetyRequest } from "@/lib/safety";
export default function DeleteAccountPage() {
  const { user, loading } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (user) safetyRequest("/api/account/deletion", undefined, "GET").then(d => setPending(d.pending)).catch(() => {}); }, [user]);
  return <main className="min-h-screen bg-gray-50 px-4 py-10"><article className="max-w-lg mx-auto bg-white rounded-3xl p-6 space-y-5">
    <Link href="/profile" className="text-primary underline">Back to profile</Link>
    <h1 className="text-3xl font-black text-primary">Delete your account</h1>
    <p>This permanently removes your BAU Connect login, profile, photos, posts, comments, messages, connections, volunteer applications, uploaded files, and notifications. You will lose access to your account.</p>
    <p>Campus staff process requests within 30 days. You will receive an email when deletion is complete. Limited records may be retained only when legally required. You do not need to contact support to start deletion.</p>
    {loading ? <p>Loading...</p> : !user ? <Link href="/login" className="block bg-primary text-white p-3 rounded-xl text-center">Sign in to delete your account</Link> : pending ? <p role="status" className="bg-green-50 p-4 rounded-xl">Your deletion request is recorded. Staff will complete it within 30 days and email you.</p> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMessage("");
      try { const data = await safetyRequest("/api/account/deletion", { confirm }); setPending(true); setMessage(data.message); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm font-bold">Type DELETE to confirm permanent deletion<input value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="off" className="block border rounded-xl p-3 w-full mt-2" /></label>
      <button disabled={busy || confirm !== "DELETE"} className="bg-red-700 text-white rounded-xl p-3 w-full disabled:opacity-40">{busy ? "Submitting..." : "Request permanent account deletion"}</button>
    </form>}
    {message && <p role="status">{message}</p>}
    <p className="text-sm"><Link href="/privacy" className="underline">Privacy policy</Link> · <a href="mailto:techconnect@bau.edu" className="underline">Support</a></p>
  </article></main>;
}
