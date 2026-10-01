"use client";
import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { contentAllowed } from "@/lib/safety";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Camera, Pencil, X, QrCode, Download, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { INTERESTS, OPEN_TO, APP_NAME, MAX_GALLERY_PHOTOS } from "@/lib/constants";

export default function Profile() {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [major, setMajor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio);
      setMajor(profile.major);
      setInterests(profile.interests);
      setOpenTo(profile.openTo || []);
    }
  }, [profile]);

  const handleProfilePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setSaving(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateDoc(doc(db, "users", profile.uid), { photoURL: url });
    } finally { setSaving(false); }
  };

  const handleGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !profile) return;
    setSaving(true);
    try {
      const existing = profile.gallery || [];
      const slots = MAX_GALLERY_PHOTOS - existing.length;
      if (slots <= 0) return;
      const newURLs = await Promise.all(files.slice(0, slots).map(f => uploadToCloudinary(f)));
      await updateDoc(doc(db, "users", profile.uid), { gallery: [...existing, ...newURLs] });
    } finally { setSaving(false); }
  };

  const removeGalleryPhoto = async (url: string) => {
    if (!profile) return;
    const updated = (profile.gallery || []).filter(p => p !== url);
    await updateDoc(doc(db, "users", profile.uid), { gallery: updated });
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      if (!contentAllowed(bio)) { window.alert("Please remove offensive language from your bio."); return; }
      await updateDoc(doc(db, "users", profile.uid), { bio, major, interests, openTo });
      setEditing(false);
      setMsg("Profile updated!");
      setTimeout(() => setMsg(""), 2000);
    } finally { setSaving(false); }
  };

  const toggle = (item: string) =>
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const toggleOpenTo = (item: string) =>
    setOpenTo(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.download = `bau-connect-${profile?.name?.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"#BBD3EE"}}>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${profile.uid}`
    : `https://baustudentconnect.com/u/${profile.uid}`;

  const gallery = profile.gallery || [];

  return (
    <div className="min-h-screen app-bottom-pad md:pb-0 md:pt-20" style={{background:"#BBD3EE"}}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {msg && <div className="bg-primary/10 text-primary rounded-2xl p-3 text-center text-sm">{msg}</div>}

        {/* Identity card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="relative shrink-0">
            <img src={profile.photoURL} alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover shadow" />
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-lime rounded-full flex items-center justify-center cursor-pointer shadow hover:scale-110 transition">
              <Camera size={14} className="text-primary" />
              <input type="file" accept="image/*" onChange={handleProfilePhoto} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{profile.name}, {profile.age}</p>
            <p className="text-sm text-gray-400 mt-0.5">{profile.university}</p>
          </div>
        </div>

        {/* Profile Picture card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-xl font-black text-primary mb-1">Profile Picture</p>
          <p className="text-sm text-gray-400 mb-6">This is the main photo shown on your card in People.</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <img src={profile.photoURL} alt={profile.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow" />
              {saving && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2 min-w-0">
              <label className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl cursor-pointer hover:bg-primary/90 transition">
                <Camera size={15} /> Change Photo
                <input type="file" accept="image/*" onChange={handleProfilePhoto} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">JPG or PNG, max 10MB</p>
            </div>
          </div>
        </div>

        {/* Gallery card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xl font-black text-primary">Gallery</p>
            <p className="text-sm text-gray-400">{Math.min(gallery.length, MAX_GALLERY_PHOTOS)} / {MAX_GALLERY_PHOTOS}</p>
          </div>
          <p className="text-sm text-gray-400 mb-6">Upload up to {MAX_GALLERY_PHOTOS} pictures to your personal gallery. People can browse these on your full profile.</p>
          <div className="grid grid-cols-3 gap-3">
            {gallery.slice(0, MAX_GALLERY_PHOTOS).map((p, i) => (
              <div key={i} className="relative aspect-square">
                <img src={p} className="w-full h-full object-cover rounded-2xl shadow-sm" />
                <button onClick={() => removeGalleryPhoto(p)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 hover:bg-black/70 transition">
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {gallery.length < MAX_GALLERY_PHOTOS && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-sky/40 bg-[#EAF2FB] flex flex-col items-center justify-center cursor-pointer hover:border-sky transition gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Plus size={20} className="text-sky" />
                </div>
                <span className="text-sky text-xs font-semibold">Add Photo</span>
                <input type="file" accept="image/*" multiple onChange={handleGalleryPhotos} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Info card */}
        {editing ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
            <p className="text-xl font-black text-primary">Edit Profile</p>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Major</label>
              <input value={major} onChange={e => setMajor(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 block">Open to</label>
              <div className="flex flex-wrap gap-2">
                {OPEN_TO.map(item => (
                  <button key={item} type="button" onClick={() => toggleOpenTo(item)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                      openTo.includes(item) ? "bg-sky text-white border-sky" : "border-gray-200 text-gray-600 bg-white"
                    }`}>{item}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 block">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(item => (
                  <button key={item} type="button" onClick={() => toggle(item)}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                      interests.includes(item) ? "bg-secondary text-white border-secondary" : "border-gray-200 text-gray-600 bg-white"
                    }`}>{item}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(false)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-gray-500 font-medium hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition disabled:opacity-60 text-sm">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Major</p>
              <p className="text-gray-900 font-medium text-sm">{profile.major}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Bio</p>
              <p className="text-gray-700 text-sm leading-relaxed">{profile.bio}</p>
            </div>
            {profile.openTo && profile.openTo.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Open to</p>
                <div className="flex flex-wrap gap-2">
                  {profile.openTo.map(i => (
                    <span key={i} className="bg-sky/10 text-sky text-sm font-medium px-3 py-1 rounded-full">{i}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(i => (
                  <span key={i} className="bg-secondary/10 text-secondary text-sm font-medium px-3 py-1 rounded-full">{i}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(true)}
                className="flex-1 bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2 text-sm">
                <Pencil size={15} /> Edit Profile
              </button>
              <button onClick={() => setShowQR(true)}
                className="bg-[#EAF2FB] border border-[#D0E4F5] text-primary rounded-2xl px-4 py-3 font-semibold hover:bg-mist transition flex items-center gap-2 text-sm">
                <QrCode size={16} /> My QR
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 flex gap-4 text-sm"><a href="/safety" className="text-primary underline">Safety & blocked users</a><a href="/delete-account" className="text-red-700 underline">Delete account</a></div>
      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-2xl text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Your {APP_NAME} QR</h2>
            <p className="text-gray-400 text-xs mb-6">Share this so classmates can find your profile</p>
            <div ref={qrRef} className="flex justify-center mb-4 p-4 bg-gray-50 rounded-2xl">
              <QRCodeSVG value={profileUrl} size={200} fgColor="#1C2D5A" bgColor="#F4F7FF" level="H"
                imageSettings={{ src: "/bau-logo-light.png", height: 36, width: 36, excavate: true }} />
            </div>
            <p className="text-xs text-gray-400 mb-6 break-all">{profileUrl}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowQR(false)}
                className="flex-1 border border-gray-200 rounded-2xl py-3 text-gray-500 font-medium hover:bg-gray-50 transition text-sm">
                Close
              </button>
              <button onClick={downloadQR}
                className="flex-1 bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2 text-sm">
                <Download size={15} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
