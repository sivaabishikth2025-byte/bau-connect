"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/context/AuthContext";
import { INTERESTS, OPEN_TO, APP_NAME } from "@/lib/constants";
import { contentAllowed } from "@/lib/safety";
import { X } from "lucide-react";

const GENDERS = ["Man", "Woman", "Non-binary", "Other"];

export default function Onboarding() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [major, setMajor] = useState("");
  const [university, setUniversity] = useState("Bay Atlantic University");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, 6);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (i: number) => {
    const newPhotos = photos.filter((_, idx) => idx !== i);
    setPhotos(newPhotos);
    setPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const toggleInterest = (item: string) =>
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const toggleOpenTo = (item: string) =>
    setOpenTo(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!contentAllowed(name + " " + bio)) return setError("Please remove offensive language from your name and bio.");
    if (photos.length === 0) return setError("Please add at least one photo.");
    if (!gender) return setError("Please select your gender.");
    if (interests.length < 3) return setError("Pick at least 3 interests.");
    if (openTo.length < 1) return setError("Pick at least one way you want to connect.");
    setLoading(true);
    try {
      const uid = auth.currentUser!.uid;
      const uploadedURLs = await Promise.all(photos.map(p => uploadToCloudinary(p)));
      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        age: parseInt(age),
        gender,
        major,
        university,
        bio,
        interests,
        openTo,
        photoURL: uploadedURLs[0],
        photos: uploadedURLs,
        gallery: [],
        email: auth.currentUser!.email,
        blockedUsers: [],
        createdAt: serverTimestamp(),
      });
      await new Promise(r => setTimeout(r, 1000));
      await refreshProfile();
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-8 sm:py-12 px-4 overflow-x-hidden">
      <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 w-full max-w-lg mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Join {APP_NAME}</h1>
        <p className="text-gray-500 mb-6 sm:mb-8">Set up your campus profile</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Photos (up to 6)</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-[3/4]">
                  <img src={src} className="w-full h-full object-cover rounded-2xl" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                    <X size={12} className="text-white" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      Main
                    </span>
                  )}
                </div>
              ))}
              {previews.length < 6 && (
                <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition">
                  <span className="text-2xl">📷</span>
                  <span className="text-gray-400 text-xs mt-1">Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input required type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />

          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">I am a...</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(g => (
                <button type="button" key={g} onClick={() => setGender(g)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    gender === g ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600 hover:border-primary"
                  }`}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">I&apos;m open to... (pick 1+)</p>
            <p className="text-xs text-gray-400 mb-2">So classmates know how you like to connect</p>
            <div className="flex flex-wrap gap-2">
              {OPEN_TO.map(item => (
                <button type="button" key={item} onClick={() => toggleOpenTo(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    openTo.includes(item) ? "bg-sky text-white border-sky" : "border-gray-200 text-gray-600 hover:border-sky"
                  }`}>{item}</button>
              ))}
            </div>
          </div>

          <input required placeholder="University name" value={university} onChange={e => setUniversity(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input required placeholder="Major / Field of study" value={major} onChange={e => setMajor(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea required placeholder="Bio: what you're into around campus & DC" value={bio} onChange={e => setBio(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />

          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">Interests (pick 3+)</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(item => (
                <button type="button" key={item} onClick={() => toggleInterest(item)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    interests.includes(item) ? "bg-secondary text-white border-secondary" : "border-gray-200 text-gray-600 hover:border-secondary"
                  }`}>{item}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white rounded-2xl py-3 font-semibold hover:bg-primary/90 transition disabled:opacity-60">
            {loading ? "Setting up your profile..." : `Join ${APP_NAME}`}
          </button>
        </form>
      </div>
    </div>
  );
}
