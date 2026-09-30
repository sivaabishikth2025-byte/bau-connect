"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { safetyRequest } from "@/lib/safety";
export default function SafetyAdmin() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvedMedia, setApprovedMedia] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const load = async () => {
    try { const [r, d] = await Promise.all([safetyRequest("/api/safety", undefined, "GET"), safetyRequest("/api/account/deletion?staff=1", undefined, "GET")]); setReports(r.reports); setRequests(d.requests); }
    catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
  if (!isAdmin) return <main className="p-6">Verified staff access required.</main>;
  return <main className="min-h-screen bg-gray-50 p-6"><article className="max-w-2xl mx-auto space-y-4">
    <Link href="/admin" className="underline">Back to admin</Link><h1 className="text-2xl font-black text-primary">Safety & deletion requests</h1>
    <p>Review reports promptly. Hiding removes content from app views; account deletion must also remove associated data and media and notify the requester.</p>
    <button className="border rounded p-2" onClick={async () => { try { const result = await safetyRequest("/api/admin/maintenance", { action: "protect-notification-tokens" }); setMaintenance(`Protected notification settings for ${result.updated} accounts.`); } catch (e) { setError((e as Error).message); } }}>Protect legacy notification settings</button>
    {maintenance && <p role="status">{maintenance}</p>}
    {error && <p role="alert">{error}</p>}
    <h2 className="text-xl font-bold">Pending reports</h2>{!reports.length && <p>No pending reports.</p>}
    {reports.map(r => <section key={r.id} className="bg-white rounded-xl p-4 space-y-2"><p className="font-bold">{r.kind}: {r.reason}</p><p>{r.details}</p><p className="text-xs">Target: {r.targetPath}</p><Link className="underline" href={r.kind === "user" ? `/u/${r.targetUserId}` : r.kind === "message" ? `/u/${r.targetUserId}` : "/activities"}>View profile or feed</Link><div className="flex gap-4">{["hide", "dismiss"].map(action => <button key={action} className="border rounded p-2" onClick={async () => { if (!window.confirm(action === "hide" ? "Hide this reported content from the app?" : "Dismiss this report?")) return; try { await safetyRequest("/api/safety", { id: r.id, action }, "PATCH"); await load(); } catch (e) { setError((e as Error).message); } }}>{action === "hide" ? "Hide content" : "Dismiss"}</button>)}</div></section>)}
    <h2 className="text-xl font-bold">Account deletions</h2>{!requests.length && <p>No pending requests.</p>}
    {requests.map(r => <section key={r.id} className="bg-white rounded-xl p-4 space-y-2"><p>{r.email}</p><p className="text-xs">User ID: {r.uid}</p><p>Requested deletion within 30 days.</p><p className="text-sm">Review linked files before deletion:</p><ul>{r.media?.map((url: string) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="underline break-all text-xs">{url}</a></li>)}</ul><label className="block text-sm"><input type="checkbox" checked={!!approvedMedia[r.uid]} onChange={e => setApprovedMedia(prev => ({...prev, [r.uid]: e.target.checked}))} /> I checked that these files belong to the requesting account.</label><button disabled={!approvedMedia[r.uid]} className="bg-red-700 text-white p-2 rounded" onClick={async () => { if (window.prompt(`Permanently delete ${r.email} and their data? Type DELETE to confirm.`) !== "DELETE") return; try { await safetyRequest("/api/account/deletion/process", { uid: r.uid, confirm: "DELETE", legacyApproved: approvedMedia[r.uid] }); await load(); } catch (e) { setError((e as Error).message); } }}>Complete permanent deletion</button></section>)}
  </article></main>;
}
