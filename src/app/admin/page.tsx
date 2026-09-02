"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, Timestamp, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import {
  APP_NAME, CAMPUS_LOCATIONS, VOLUNTEER_APP_STATUSES, VOLUNTEER_CATEGORIES,
  volunteerAppStatusMeta, volunteerCategoryMeta
} from "@/lib/constants";
import { Activity, UserProfile, VolunteerApplication, VolunteerAppStatus, VolunteerHourLog, VolunteerJob } from "@/types";
import { notifyAllUsers, notifyUser } from "@/lib/inbox";
import { hiredCount, syncHiredRoster } from "@/lib/volunteer";
import { downloadCsv } from "@/lib/csv";
import {
  Bell, HandHeart, Shield, Trash2, Users, X, Plus, Megaphone, Newspaper, ClipboardList, Clock, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Tab = "overview" | "volunteers" | "applications" | "hours" | "reports" | "users" | "feed" | "announce";

export default function AdminPage() {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [jobs, setJobs] = useState<(VolunteerJob & { id: string })[]>([]);
  const [people, setPeople] = useState<(UserProfile & { id: string })[]>([]);
  const [posts, setPosts] = useState<(Activity & { id: string })[]>([]);
  const [apps, setApps] = useState<VolunteerApplication[]>([]);
  const [logs, setLogs] = useState<VolunteerHourLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [appFilter, setAppFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [openApp, setOpenApp] = useState<VolunteerApplication | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [cat, setCat] = useState("events");
  const [campusSpotId, setCampusSpotId] = useState("");
  const [location, setLocation] = useState("");
  const [whenLocal, setWhenLocal] = useState("");
  const [hours, setHours] = useState("2");
  const [spots, setSpots] = useState("5");
  const [skills, setSkills] = useState("");
  const [commit, setCommit] = useState<"one-time" | "ongoing">("one-time");
  const [showCreate, setShowCreate] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertBody, setAlertBody] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  const load = useCallback(async () => {
    const [vSnap, uSnap, aSnap, appSnap, hSnap] = await Promise.all([
      getDocs(collection(db, "volunteers")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "activities")),
      getDocs(collection(db, "volunteerApplications")),
      getDocs(collection(db, "volunteerHourLogs")),
    ]);
    setJobs(vSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerJob & { id: string }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
    setPeople(uSnap.docs.map(d => ({ id: d.id, ...d.data(), uid: d.id } as UserProfile & { id: string }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    setPosts(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Activity & { id: string }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
    setApps(appSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication)));
    setLogs(hSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerHourLog)));
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  useEffect(() => {
    if (openApp) setAdminNotes(openApp.adminNotes || "");
  }, [openApp]);

  const resetVolForm = () => {
    setTitle(""); setDescription(""); setRequirements(""); setCat("events");
    setCampusSpotId(""); setLocation(""); setWhenLocal(""); setHours("2"); setSpots("5");
    setSkills(""); setCommit("one-time");
  };

  const publishVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !isAdmin) return;
    setBusy(true);
    try {
      const spot = CAMPUS_LOCATIONS.find(c => c.id === campusSpotId);
      await addDoc(collection(db, "volunteers"), {
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        category: cat,
        campusSpotId: campusSpotId || null,
        location: location.trim() || spot?.name || null,
        when: whenLocal ? Timestamp.fromDate(new Date(whenLocal)) : null,
        hours: Math.max(1, parseInt(hours, 10) || 1),
        spots: Math.max(1, parseInt(spots, 10) || 1),
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        commitment: commit,
        organizerId: user.uid,
        organizerName: profile.name,
        organizerPhoto: profile.photoURL || null,
        participantIds: [],
        status: "active",
        createdAt: serverTimestamp(),
      });
      await notifyAllUsers(user.uid, {
        type: "volunteer",
        title: "New volunteer requirement",
        body: `${profile.name} posted: ${title.trim()}`,
        url: "/volunteers",
        fromUserId: user.uid,
        fromName: profile.name,
        email: true,
      });
      resetVolForm();
      setShowCreate(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const setAppStatus = async (app: VolunteerApplication, status: VolunteerAppStatus) => {
    if (!isAdmin || !user || !profile) return;
    const job = jobs.find(j => j.id === app.jobId);
    if (status === "hired" && job && hiredCount(apps, app.jobId) >= job.spots && app.status !== "hired") {
      window.alert("This role is already at capacity. Increase headcount or waitlist this applicant.");
      return;
    }
    await updateDoc(doc(db, "volunteerApplications", app.id), {
      status,
      adminNotes: adminNotes.trim(),
      updatedAt: serverTimestamp(),
    });
    await syncHiredRoster(app.jobId, app.applicantId, status);
    await notifyUser(app.applicantId, {
      type: "volunteer",
      title: `Volunteer application: ${volunteerAppStatusMeta(status).label}`,
      body: `${app.jobTitle} is now ${volunteerAppStatusMeta(status).label.toLowerCase()}.`,
      url: "/volunteers",
      fromUserId: user.uid,
      fromName: profile.name,
    });
    setOpenApp(null);
    await load();
  };

  const saveHour = async (log: VolunteerHourLog, hoursVal: string, comment: string) => {
    await updateDoc(doc(db, "volunteerHourLogs", log.id), {
      hours: Math.max(0, parseFloat(hoursVal) || 0),
      comment,
      updatedAt: serverTimestamp(),
    });
    await load();
  };

  const deleteHour = async (id: string) => {
    await deleteDoc(doc(db, "volunteerHourLogs", id));
    await load();
  };

  const exportApplications = () => {
    downloadCsv("bau-volunteer-applications.csv",
      ["Role", "Name", "Email", "Phone", "Major", "Year", "Availability", "Why", "Experience", "Status", "Resume"],
      apps.map(a => [a.jobTitle, a.applicantName, a.applicantEmail, a.phone, a.major, a.year, a.availability, a.why, a.experience, a.status, a.resumeURL || ""])
    );
  };

  const exportHoursForUser = (userId: string, userName: string) => {
    const mine = logs
      .filter(l => l.userId === userId)
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.jobTitle || "").localeCompare(b.jobTitle || ""));
    const byDay = new Map<string, number>();
    mine.forEach(l => byDay.set(l.date, (byDay.get(l.date) || 0) + Number(l.hours || 0)));
    const rows: (string | number)[][] = mine.map(l => [
      l.date,
      l.jobTitle,
      l.hours,
      l.comment || "",
      byDay.get(l.date) || 0,
    ]);
    const safe = (userName || "volunteer").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
    downloadCsv(`volunteer-hours-${safe}.csv`,
      ["Date", "Role", "Hours", "Comment", "Hours this volunteer worked that day"],
      rows
    );
  };

  const hoursByVolunteer = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; logs: VolunteerHourLog[] }>();
    logs.forEach(l => {
      const cur = map.get(l.userId) || { userId: l.userId, userName: l.userName, logs: [] };
      cur.logs.push(l);
      map.set(l.userId, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.userName.localeCompare(b.userName));
  }, [logs]);

  const exportReports = () => {
    downloadCsv("bau-volunteer-reports.csv",
      ["Role", "Capacity", "Hired", "Applicants", "Reviewing", "Hours logged"],
      jobs.map(j => [
        j.title,
        j.spots,
        hiredCount(apps, j.id),
        apps.filter(a => a.jobId === j.id).length,
        apps.filter(a => a.jobId === j.id && a.status === "reviewing").length,
        logs.filter(l => l.jobId === j.id).reduce((n, l) => n + Number(l.hours || 0), 0),
      ])
    );
  };

  const visibleApps = useMemo(() => {
    let list = apps;
    if (jobFilter !== "all") list = list.filter(a => a.jobId === jobFilter);
    if (appFilter !== "all") list = list.filter(a => a.status === appFilter);
    return list;
  }, [apps, jobFilter, appFilter]);

  const openJobs = useMemo(() => jobs.filter(j => (j.status || "active") === "active"), [jobs]);
  const totalHours = useMemo(() => logs.reduce((n, l) => n + Number(l.hours || 0), 0), [logs]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: appPageBg }}>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "volunteers", label: "Roles", icon: HandHeart },
    { id: "applications", label: "Applications", icon: ClipboardList },
    { id: "hours", label: "Hours", icon: Clock },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
    { id: "users", label: "People", icon: Users },
    { id: "feed", label: "Feed", icon: Newspaper },
    { id: "announce", label: "Announce", icon: Megaphone },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-20 relative overflow-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-8 relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-1">Staff only</p>
        <h1 className="text-3xl font-black text-white flex items-center gap-2 mb-1"><Shield size={26} /> Admin</h1>
        <p className="text-white/50 text-sm mb-5">Volunteer hiring, hours, and campus reports.</p>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold ${tab === t.id ? "bg-white text-primary" : "bg-white/10 text-white/70"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Students", value: people.length },
              { label: "Open roles", value: openJobs.length },
              { label: "Applications", value: apps.length },
              { label: "Hours logged", value: totalHours },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-black text-2xl">{s.value}</p>
                <p className="text-white/50 text-xs font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "volunteers" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-secondary text-primary font-bold text-sm px-4 py-2.5 rounded-2xl">
                <Plus size={16} /> Add requirement
              </button>
            </div>
            {jobs.map(j => (
              <div key={j.id} className="bg-white rounded-3xl p-5 mb-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-sky uppercase">{volunteerCategoryMeta(j.category).label} · {j.status}</p>
                    <h2 className="font-black text-primary">{j.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{j.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {hiredCount(apps, j.id)}/{j.spots} hired · {apps.filter(a => a.jobId === j.id).length} applications
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(j.status || "active") === "active" && (
                      <button onClick={() => updateDoc(doc(db, "volunteers", j.id), { status: "closed" }).then(load)} className="text-xs font-bold px-3 py-2 rounded-xl border">Close</button>
                    )}
                    <button onClick={() => deleteDoc(doc(db, "volunteers", j.id)).then(load)} className="text-xs font-bold px-3 py-2 rounded-xl border border-accent/30 text-accent">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "applications" && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="rounded-xl px-3 py-2 text-xs font-bold">
                <option value="all">All roles</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <select value={appFilter} onChange={e => setAppFilter(e.target.value)} className="rounded-xl px-3 py-2 text-xs font-bold">
                <option value="all">All statuses</option>
                {VOLUNTEER_APP_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={exportApplications} className="ml-auto text-xs font-bold bg-white text-primary px-3 py-2 rounded-xl">Export Excel</button>
            </div>
            {visibleApps.length === 0 ? <p className="text-white/50 text-sm">No applications.</p> : visibleApps.map(a => {
              const st = volunteerAppStatusMeta(a.status);
              return (
                <button key={a.id} onClick={() => setOpenApp(a)} className="w-full text-left bg-white rounded-3xl p-4 mb-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-black text-primary text-sm">{a.applicantName}</p>
                      <p className="text-xs text-gray-500">{a.jobTitle} · {a.applicantEmail}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full h-fit" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === "hours" && (
          <div className="space-y-4">
            {hoursByVolunteer.length === 0 ? (
              <p className="text-white/50 text-sm">No hours logged yet.</p>
            ) : hoursByVolunteer.map(v => {
              const byDay = new Map<string, number>();
              v.logs.forEach(l => byDay.set(l.date, (byDay.get(l.date) || 0) + Number(l.hours || 0)));
              const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
              const total = v.logs.reduce((n, l) => n + Number(l.hours || 0), 0);
              return (
                <div key={v.userId} className="bg-white rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="font-black text-primary">{v.userName}</h2>
                      <p className="text-xs text-gray-500">{total} hours total · {days.length} day{days.length === 1 ? "" : "s"}</p>
                    </div>
                    <button
                      onClick={() => exportHoursForUser(v.userId, v.userName)}
                      className="shrink-0 text-xs font-bold bg-primary text-white px-3 py-2 rounded-xl"
                    >
                      Export this volunteer
                    </button>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3 mb-3">
                    <p className="text-[11px] font-bold uppercase text-gray-500 mb-2">Hours per day</p>
                    <ul className="space-y-1">
                      {days.map(([date, hrs]) => (
                        <li key={date} className="flex justify-between text-sm">
                          <span className="text-gray-600">{date}</span>
                          <span className="font-black text-primary">{hrs}h</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {v.logs
                    .slice()
                    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                    .map(l => (
                      <HourRow key={`${l.id}-${l.hours}-${l.comment}`} log={l} onSave={saveHour} onDelete={deleteHour} />
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {tab === "reports" && (
          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="p-4 flex justify-between items-center">
              <h2 className="font-black text-primary">Role reports</h2>
              <button onClick={exportReports} className="text-xs font-bold bg-primary text-white px-3 py-2 rounded-xl">Export Excel</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left p-3">Role</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Hired</th>
                  <th className="p-3">Apps</th>
                  <th className="p-3">Hours</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-t border-gray-50">
                    <td className="p-3 font-semibold">{j.title}</td>
                    <td className="p-3 text-center">{j.spots}</td>
                    <td className="p-3 text-center">{hiredCount(apps, j.id)}</td>
                    <td className="p-3 text-center">{apps.filter(a => a.jobId === j.id).length}</td>
                    <td className="p-3 text-center">{logs.filter(l => l.jobId === j.id).reduce((n, l) => n + Number(l.hours || 0), 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white rounded-3xl overflow-hidden">
            {people.map(p => (
              <Link key={p.id} href={`/u/${p.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                <img src={p.photoURL || "/bau-logo.svg"} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-sm">{p.name || "Unnamed"}</p>
                  <p className="text-xs text-gray-500">{p.email} · {p.major}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === "feed" && (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-3xl p-4 flex gap-3">
                <div className="flex-1">
                  <p className="font-black text-primary text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.authorName}</p>
                </div>
                <button onClick={() => deleteDoc(doc(db, "activities", p.id)).then(load)} className="p-2 text-accent"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {tab === "announce" && (
          <form onSubmit={async e => {
            e.preventDefault();
            if (!user || !profile || !alertTitle.trim()) return;
            setBusy(true);
            try {
              await notifyAllUsers(user.uid, { type: "alert", title: alertTitle.trim(), body: alertBody.trim() || alertTitle.trim(), url: "/notifications", fromUserId: user.uid, fromName: profile.name });
              setAlertTitle(""); setAlertBody("");
            } finally { setBusy(false); }
          }} className="bg-white rounded-3xl p-5 space-y-3">
            <h2 className="font-black text-primary flex items-center gap-2"><Bell size={18} /> Campus announcement</h2>
            <input required value={alertTitle} onChange={e => setAlertTitle(e.target.value)} placeholder="Headline" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
            <textarea value={alertBody} onChange={e => setAlertBody(e.target.value)} placeholder="Details" rows={4} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
            <button type="submit" disabled={busy} className="w-full bg-primary text-white font-bold py-3 rounded-2xl">{busy ? "Sending..." : `Send to all ${APP_NAME} users`}</button>
          </form>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Add volunteer requirement</h2>
              <button onClick={() => { setShowCreate(false); resetVolForm(); }} className="p-2 text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={publishVolunteer} className="space-y-3">
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="What volunteers will do" rows={3} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
              <textarea required value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Requirements" rows={3} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
              <div className="flex flex-wrap gap-2">
                {VOLUNTEER_CATEGORIES.map(c => (
                  <button type="button" key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${cat === c.id ? "border-primary bg-primary/10 text-primary" : "border-gray-200"}`}>{c.label}</button>
                ))}
              </div>
              <label className="block text-xs font-bold text-gray-500">How many people can participate
                <input required type="number" min={1} max={200} value={spots} onChange={e => setSpots(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-normal text-gray-900" />
              </label>
              <label className="block text-xs font-bold text-gray-500">Expected hours per shift
                <input type="number" min={1} value={hours} onChange={e => setHours(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-normal text-gray-900" />
              </label>
              <div className="flex gap-2">
                {(["one-time", "ongoing"] as const).map(c => (
                  <button type="button" key={c} onClick={() => setCommit(c)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${commit === c ? "border-sky bg-sky/10 text-sky" : "border-gray-200"}`}>{c === "one-time" ? "One-time" : "Ongoing"}</button>
                ))}
              </div>
              <select value={campusSpotId} onChange={e => setCampusSpotId(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                <option value="">Campus spot (optional)</option>
                {CAMPUS_LOCATIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Meet-up details" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <input type="datetime-local" value={whenLocal} onChange={e => setWhenLocal(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Skills (comma-separated)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <button type="submit" disabled={busy} className="w-full bg-primary text-white py-3 rounded-2xl font-bold">{busy ? "Publishing..." : "Publish requirement"}</button>
            </form>
          </div>
        </div>
      )}

      {openApp && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-sky">Application</p>
                <h2 className="text-xl font-black">{openApp.applicantName}</h2>
                <p className="text-sm text-gray-500">{openApp.jobTitle}</p>
              </div>
              <button onClick={() => setOpenApp(null)} className="p-2 text-gray-400"><X size={20} /></button>
            </div>
            <div className="text-sm text-gray-700 space-y-2 mb-4">
              <p><span className="font-bold">Email:</span> {openApp.applicantEmail}</p>
              <p><span className="font-bold">Phone:</span> {openApp.phone}</p>
              <p><span className="font-bold">Major:</span> {openApp.major} · {openApp.year}</p>
              <p><span className="font-bold">Availability:</span> {openApp.availability}</p>
              <p><span className="font-bold">Why:</span> {openApp.why}</p>
              {openApp.experience && <p><span className="font-bold">Experience:</span> {openApp.experience}</p>}
              {openApp.roleNotes && <p><span className="font-bold">Volunteer notes:</span> {openApp.roleNotes}</p>}
              {openApp.resumeURL && (
                <a href={openApp.resumeURL} target="_blank" rel="noreferrer" className="text-sky font-bold">Open resume{openApp.resumeName ? ` (${openApp.resumeName})` : ""}</a>
              )}
            </div>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Internal notes" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm mb-3" />
            <p className="text-xs font-bold text-gray-500 mb-2">Set status</p>
            <div className="flex flex-wrap gap-2">
              {VOLUNTEER_APP_STATUSES.filter(s => s.id !== "withdrawn").map(s => (
                <button key={s.id} onClick={() => setAppStatus(openApp, s.id)} className="px-3 py-2 rounded-xl text-xs font-bold border" style={{ borderColor: s.color, color: s.color }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HourRow({
  log, onSave, onDelete,
}: {
  log: VolunteerHourLog;
  onSave: (log: VolunteerHourLog, hours: string, comment: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [hours, setHours] = useState(String(log.hours));
  const [comment, setComment] = useState(log.comment || "");
  return (
    <div className="border border-gray-100 rounded-2xl p-3 mb-2">
      <p className="text-xs text-gray-500 mb-2">{log.jobTitle} · {log.date}</p>
      <div className="flex gap-2 mb-2">
        <input type="number" min={0} step={0.25} value={hours} onChange={e => setHours(e.target.value)} className="w-24 border rounded-xl px-3 py-2 text-sm" />
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" className="flex-1 border rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(log, hours, comment)} className="text-xs font-bold text-primary">Save</button>
        <button onClick={() => onDelete(log.id)} className="text-xs font-bold text-accent">Delete</button>
      </div>
    </div>
  );
}
