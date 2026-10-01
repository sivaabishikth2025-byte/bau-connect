"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SafetyActions from "@/components/SafetyActions";
export default function SafetyPage() {
  const { profile } = useAuth();
  return <main className="min-h-screen bg-gray-50 px-4 py-10"><article className="max-w-lg mx-auto bg-white rounded-3xl p-6 space-y-5">
    <Link href="/profile" className="underline">Back to profile</Link><h1 className="text-2xl font-black text-primary">Safety & blocked users</h1>
    <p>Harassment, hate, threats, sexual content, scams, and child exploitation are prohibited. Use Report on a profile, post, comment, or message to contact campus moderators. Block stops messages and connection requests and hides posts from that person.</p>
    <p>For urgent safety concerns contact <a href="mailto:techconnect@bau.edu" className="underline">techconnect@bau.edu</a>. For immediate danger, call 911.</p>
    <h2 className="font-bold">Blocked users</h2>
    {!profile?.blockedUsers?.length && <p>No blocked users.</p>}
    {profile?.blockedUsers?.map(id => <div key={id} className="border rounded-xl p-3"><span className="text-sm">Blocked account</span><SafetyActions userId={id} /></div>)}
    <Link href="/child-safety" className="underline">Child safety standards</Link>
  </article></main>;
}
