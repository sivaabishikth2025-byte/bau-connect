"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { AppStarfield, appPageBg } from "@/components/AppShell";
import {
  APP_NAME, CAMPUS_LOCATIONS, VOLUNTEER_CATEGORIES, volunteerAppStatusMeta, volunteerCategoryMeta
} from "@/lib/constants";
import { VolunteerApplication, VolunteerHourLog, VolunteerJob } from "@/types";
import { hiredCount, isHired } from "@/lib/volunteer";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  Clock, MapPin, Users, CheckCircle2, Filter,
  HandHeart, Calendar, Award, Navigation, X, Pencil, Trash2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Tab = "open" | "mine" | "hours";

function isActiveJob(job: VolunteerJob) {
  return (job.status || "active") === "active";
}

export default function VolunteersPage() {
  const { user, profile, isAdmin } = useAuth();
  const [jobs, setJobs] = useState<(VolunteerJob & { id: string })[]>([]);
  const [apps, setApps] = useState<VolunteerApplication[]>([]);
  const [logs, setLogs] = useState<VolunteerHourLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");
  const [category, setCategory] = useState("all");
  const [commitment, setCommitment] = useState("all");
  const [applyJob, setApplyJob] = useState<(VolunteerJob & { id: string }) | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [availability, setAvailability] = useState("");
  const [why, setWhy] = useState("");
  const [experience, setExperience] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [logJobId, setLogJobId] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logHours, setLogHours] = useState("1");
  const [logComment, setLogComment] = useState("");
  const [editingLog, setEditingLog] = useState<string | null>(null);
  const [roleNotes, setRoleNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jSnap, aSnap, hSnap] = await Promise.all([
        getDocs(collection(db, "volunteers")),
        getDocs(collection(db, "volunteerApplications")),
        getDocs(collection(db, "volunteerHourLogs")),
      ]);
      const list = jSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as VolunteerJob & { id: string }))
        .filter(j => !j.seedId && j.organizerId !== "campus" && j.requirements);
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setJobs(list);
      setApps(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerApplication)));
      setLogs(hSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerHourLog)));
    } catch (e) {
      console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const mine = apps.filter(a => a.applicantId === user.uid);
    const notes: Record<string, string> = {};
    mine.forEach(a => { notes[a.id] = a.roleNotes || ""; });
    setRoleNotes(notes);
  }, [apps, user]);

  const myApps = useMemo(
    () => apps.filter(a => user && a.applicantId === user.uid),
    [apps, user]
  );
  const hiredJobs = useMemo(
    () => jobs.filter(j => myApps.some(a => a.jobId === j.id && a.status === "hired")),
    [jobs, myApps]
  );
  const myLogs = useMemo(
    () => logs.filter(l => user && l.userId === user.uid).sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [logs, user]
  );
  const hoursLogged = useMemo(
    () => myLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0),
    [myLogs]
  );

  const filtered = useMemo(() => {
    let list = jobs.filter(isActiveJob);
    if (tab === "mine") {
      const ids = new Set(myApps.map(a => a.jobId));
      list = jobs.filter(j => ids.has(j.id));
    }
    if (category !== "all") list = list.filter(j => j.category === category);
    if (commitment !== "all") list = list.filter(j => j.commitment === commitment);
    return list;
  }, [jobs, tab, myApps, category, commitment]);

  const appFor = (jobId: string) => myApps.find(a => a.jobId === jobId);

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !applyJob) return;
    if (appFor(applyJob.id)) return;
    setSubmitting(true);
    try {
      let resumeURL: string | null = null;
      if (resumeFile) resumeURL = await uploadFileToCloudinary(resumeFile);
      await addDoc(collection(db, "volunteerApplications"), {
        jobId: applyJob.id,
        jobTitle: applyJob.title,
        applicantId: user.uid,
        applicantName: profile.name,
        applicantEmail: profile.email || user.email,
        applicantPhoto: profile.photoURL || null,
        phone: phone.trim(),
        major: profile.major || "",
        year: year.trim(),
        availability: availability.trim(),
        why: why.trim(),
        experience: experience.trim(),
        resumeURL,
        resumeName: resumeFile?.name || null,
        roleNotes: "",
        status: "applied",
        adminNotes: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setApplyJob(null);
      setPhone(""); setYear(""); setAvailability(""); setWhy(""); setExperience(""); setResumeFile(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const saveRoleNotes = async (app: VolunteerApplication) => {
    await updateDoc(doc(db, "volunteerApplications", app.id), {
      roleNotes: (roleNotes[app.id] || "").trim(),
      updatedAt: serverTimestamp(),
    });
    await load();
  };

  const saveHourLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !logJobId) return;
    const job = jobs.find(j => j.id === logJobId);
    if (!job || !isHired(appFor(job.id))) return;
    const hours = Math.max(0.25, parseFloat(logHours) || 0);
    const payload = {
      jobId: job.id,
      jobTitle: job.title,
      userId: user.uid,
      userName: profile.name,
      date: logDate,
      hours,
      comment: logComment.trim(),
      updatedAt: serverTimestamp(),
    };
    if (editingLog) {
      await updateDoc(doc(db, "volunteerHourLogs", editingLog), payload);
    } else {
      await addDoc(collection(db, "volunteerHourLogs"), { ...payload, createdAt: serverTimestamp() });
    }
    setEditingLog(null);
    setLogJobId(hiredJobs[0]?.id || "");
    setLogDate("");
    setLogHours("1");
    setLogComment("");
    await load();
  };

  const editLog = (l: VolunteerHourLog) => {
    setEditingLog(l.id);
    setLogJobId(l.jobId);
    setLogDate(l.date);
    setLogHours(String(l.hours));
    setLogComment(l.comment || "");
    setTab("hours");
  };

  const deleteLog = async (id: string) => {
    await deleteDoc(doc(db, "volunteerHourLogs", id));
    await load();
  };

  return (
    <div className="min-h-screen app-bottom-pad md:pb-0 md:pt-20 relative overflow-x-hidden" style={{ background: appPageBg }}>
      <AppStarfield />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-8 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <HandHeart className="text-secondary" size={28} /> Volunteers
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Apply for campus roles. After you&apos;re hired, log hours and notes.
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin" className="shrink-0 bg-secondary text-primary font-bold text-sm px-4 py-2.5 rounded-2xl">
              Manage in Admin
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Open roles", value: jobs.filter(isActiveJob).length, icon: HandHeart },
            { label: "My applications", value: myApps.length, icon: CheckCircle2 },
            { label: "Hours logged", value: hoursLogged, icon: Award },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-3 text-center">
              <stat.icon size={16} className="text-secondary mx-auto mb-1" />
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {([
            { id: "open", label: "Open now" },
            { id: "mine", label: "My applications" },
            { id: "hours", label: "Hours" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition ${
                tab === t.id ? "bg-white text-primary" : "bg-white/10 text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== "hours" && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <button onClick={() => setCategory("all")} className={`shrink-0 px-3 py-2 rounded-full text-xs font-bold ${category === "all" ? "bg-white text-primary" : "bg-white/10 text-white/70"}`}>All types</button>
              {VOLUNTEER_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={`shrink-0 px-3 py-2 rounded-full text-xs font-bold ${category === c.id ? "bg-white text-primary" : "bg-white/10 text-white/70"}`}>{c.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-5">
              <Filter size={14} className="text-white/40" />
              {["all", "one-time", "ongoing"].map(c => (
                <button key={c} onClick={() => setCommitment(c)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${commitment === c ? "bg-sky/30 text-white" : "text-white/50"}`}>
                  {c === "all" ? "Any commitment" : c === "one-time" ? "One-time" : "Ongoing"}
                </button>
              ))}
              <Link href="/map" className="ml-auto text-sky text-xs font-bold flex items-center gap-1">
                <Navigation size={12} /> View on map
              </Link>
            </div>
          </>
        )}

        {tab === "hours" ? (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h2 className="text-xl font-black text-primary mb-1">Log hours</h2>
              <p className="text-gray-500 text-sm mb-4">Only hired roles can log time. You can edit entries anytime.</p>
              <p className="text-4xl font-black text-primary mb-4">{hoursLogged}<span className="text-lg text-gray-400 font-semibold ml-2">hours</span></p>
              {hiredJobs.length === 0 ? (
                <p className="text-sm text-gray-500">You&apos;ll log hours here after staff hires you for a role.</p>
              ) : (
                <form onSubmit={saveHourLog} className="space-y-3">
                  <select required value={logJobId} onChange={e => setLogJobId(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm">
                    <option value="">Select role</option>
                    {hiredJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
                    <input required type="number" min={0.25} step={0.25} value={logHours} onChange={e => setLogHours(e.target.value)} className="border border-gray-200 rounded-2xl px-4 py-3 text-sm" placeholder="Hours" />
                  </div>
                  <textarea value={logComment} onChange={e => setLogComment(e.target.value)} rows={2} placeholder="Comment for this shift (optional)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
                  <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-2xl">
                    {editingLog ? "Save hours" : "Add hours"}
                  </button>
                  {editingLog && (
                    <button type="button" onClick={() => { setEditingLog(null); setLogComment(""); }} className="w-full text-sm text-gray-500">Cancel edit</button>
                  )}
                </form>
              )}
            </div>
            {myLogs.map(l => (
              <div key={l.id} className="bg-white rounded-3xl p-4 flex gap-3">
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{l.jobTitle}</p>
                  <p className="text-xs text-gray-500">{l.date} · {l.hours}h</p>
                  {l.comment && <p className="text-sm text-gray-600 mt-1">{l.comment}</p>}
                </div>
                <button onClick={() => editLog(l)} className="p-2 text-gray-400 hover:text-primary"><Pencil size={16} /></button>
                <button onClick={() => deleteLog(l.id)} className="p-2 text-accent"><Trash2 size={16} /></button>
              </div>
            ))}
            {hiredJobs.map(j => {
              const app = appFor(j.id);
              if (!app) return null;
              return (
                <div key={j.id} className="bg-white rounded-3xl p-5">
                  <p className="text-xs font-bold text-sky uppercase mb-1">Notes for {j.title}</p>
                  <textarea
                    value={roleNotes[app.id] ?? ""}
                    onChange={e => setRoleNotes(n => ({ ...n, [app.id]: e.target.value }))}
                    rows={3}
                    placeholder="Comments about this role..."
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none mb-2"
                  />
                  <button onClick={() => saveRoleNotes(app)} className="text-sm font-bold text-primary">Save notes</button>
                </div>
              );
            })}
          </div>
        ) : loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-12 bg-white/5 rounded-3xl border border-white/10 p-10">
            <p className="text-white font-bold text-lg mb-2">{tab === "mine" ? "No applications yet" : "No volunteer requirements yet"}</p>
            <p className="text-white/50 text-sm">Apply from Open now when a role is posted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => {
              const meta = volunteerCategoryMeta(job.category);
              const app = appFor(job.id);
              const hired = hiredCount(apps, job.id);
              const full = job.spots ? hired >= job.spots : false;
              const statusMeta = app ? volunteerAppStatusMeta(app.status) : null;
              return (
                <article key={job.id} className="bg-white rounded-3xl shadow-lg p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full mb-2" style={{ background: `${meta.color}22`, color: meta.color }}>
                        {meta.label} · {job.commitment === "ongoing" ? "Ongoing" : "One-time"}
                      </span>
                      <h2 className="text-lg font-black text-gray-900">{job.title}</h2>
                    </div>
                    {statusMeta && (
                      <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full" style={{ background: `${statusMeta.color}22`, color: statusMeta.color }}>
                        {statusMeta.label}
                      </span>
                    )}
                    {!app && full && (
                      <span className="shrink-0 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Team full</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{job.description}</p>
                  {job.requirements && (
                    <div className="mb-4 rounded-2xl bg-[#EAF2FB] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sky mb-1">Requirements</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                    {(job.when?.toDate || job.whenLabel) && (
                      <span className="flex items-center gap-1"><Calendar size={14} className="text-sky" />{job.when?.toDate ? format(job.when.toDate(), "EEE, MMM d · h:mm a") : job.whenLabel}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock size={14} className="text-sky" /> Expected {job.hours}h</span>
                    {(job.location || job.campusSpotId) && (
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-sky" />{job.location || CAMPUS_LOCATIONS.find(c => c.id === job.campusSpotId)?.name}</span>
                    )}
                    <span className="flex items-center gap-1"><Users size={14} className="text-sky" />{hired}/{job.spots} hired</span>
                  </div>
                  <div className="flex gap-2">
                    {!app && (
                      <button
                        onClick={() => user && setApplyJob(job)}
                        disabled={!user}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-primary text-white disabled:opacity-50"
                      >
                        Apply
                      </button>
                    )}
                    {app && (
                      <p className="flex-1 text-sm text-gray-600 py-2">Application {volunteerAppStatusMeta(app.status).label.toLowerCase()}.</p>
                    )}
                    {job.campusSpotId && (
                      <Link href={`/map?spot=${job.campusSpotId}`} className="px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-sky">Map</Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {applyJob && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-sky">Volunteer application</p>
                <h2 className="text-xl font-black">{applyJob.title}</h2>
              </div>
              <button onClick={() => setApplyJob(null)} className="p-2 text-gray-400"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Staff will review your application before you&apos;re hired. Team size: {applyJob.spots} people.</p>
            <form onSubmit={submitApplication} className="space-y-3">
              <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <input required value={year} onChange={e => setYear(e.target.value)} placeholder="Year / program (e.g. Junior, MBA)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <input required value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Availability (days / times)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm" />
              <textarea required value={why} onChange={e => setWhy(e.target.value)} rows={3} placeholder="Why do you want this role?" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
              <textarea value={experience} onChange={e => setExperience(e.target.value)} rows={3} placeholder="Relevant experience (optional)" className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none" />
              <label className="block text-sm text-gray-600">
                Resume (PDF or image, optional)
                <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={e => setResumeFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs" />
              </label>
              <button type="submit" disabled={submitting} className="w-full bg-primary text-white font-bold py-3 rounded-2xl disabled:opacity-60">
                {submitting ? "Submitting..." : `Submit application to ${APP_NAME}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
