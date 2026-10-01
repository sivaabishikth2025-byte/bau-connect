"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { safetyRequest } from "@/lib/safety";
export default function SafetyActions({ userId, kind = "user", targetId, postId }: { userId: string; kind?: "user" | "post" | "comment" | "message"; targetId?: string; postId?: string }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Harassment or bullying");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  if (!user || user.uid === userId) return null;
  const blocked = profile?.blockedUsers?.includes(userId);
  const act = async (action: string) => {
    setBusy(true); setMessage("");
    try {
      await safetyRequest("/api/safety", { action, userId, kind, targetId: targetId || userId, postId, reason, details });
      setMessage(action === "report" ? "Report received. Campus staff will review it. For immediate danger, call 911." : action === "block" ? "User blocked. Their posts are hidden and they cannot send you messages or connection requests." : "User unblocked.");
      setOpen(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="text-xs">
    <div className="flex flex-wrap gap-3 py-2">
      <button onClick={() => setOpen(!open)} disabled={busy} className="text-gray-600 underline">Report {kind === "user" ? "user" : kind}</button>
      <button onClick={() => { if (blocked || window.confirm("Block this user? Their posts will be hidden and they cannot contact you.")) act(blocked ? "unblock" : "block"); }} disabled={busy} className="text-red-700 underline">{blocked ? "Unblock" : "Block user"}</button>
    </div>
    {open && <form onSubmit={e => { e.preventDefault(); act("report"); }} className="bg-gray-50 border rounded-xl p-3 space-y-3">
      <label className="block">Reason<select aria-label="Report reason" value={reason} onChange={e => setReason(e.target.value)} className="block w-full p-2 border rounded mt-1">{["Harassment or bullying", "Hate or violence", "Sexual content", "Spam or scam", "Child safety", "Other"].map(r => <option key={r}>{r}</option>)}</select></label>
      <label className="block">Details (optional)<textarea value={details} maxLength={2000} onChange={e => setDetails(e.target.value)} className="block w-full p-2 border rounded mt-1" /></label>
      <p>Your report is private and visible to campus moderators.</p>
      <button disabled={busy} className="bg-primary text-white rounded-lg px-3 py-2">{busy ? "Submitting..." : "Send report"}</button>
      <button type="button" onClick={() => setOpen(false)} className="ml-3">Cancel</button>
    </form>}
    {message && <p role="status" className="text-gray-700 bg-gray-50 rounded-lg p-2">{message}</p>}
  </div>;
}
