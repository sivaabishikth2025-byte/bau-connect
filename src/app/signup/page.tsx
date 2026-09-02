"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { sendVerificationEmail } from "@/lib/verificationEmail";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const allowed = email.endsWith("@stu.bau.edu") || email.endsWith("@bau.edu");
    if (!allowed) return setError("Only @stu.bau.edu or @bau.edu emails are allowed.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      try {
        await sendVerificationEmail();
      } catch {
        // Account was created; let them resend from the verify page once email is configured.
      }
      router.replace("/verify-email");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("email-already-in-use")) {
        setError("This email already has an account. Try logging in or use Resend email on the verify page.");
      } else if (msg.includes("unrecognised IP") || msg.includes("authorized_ips")) {
        setError("Account setup is in progress. Ask the site admin to enable Brevo email sending, then try Resend email.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{background:"radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A"}}>
      <style>{`
        @keyframes star-to-right {
          0% { background-position: -550px -315px; }
          100% { background-position: 550px 315px; }
        }
        .star-layer { position:absolute; inset:0; background-repeat:repeat; background-size:550px auto; animation:star-to-right 65s linear infinite; pointer-events:none; }
        .sl1 { background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png"); }
        .sl2 { opacity:.5; transform:scale(2); filter:blur(3px); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:30s; }
        .sl3 { opacity:.3; transform:scale(1.5); filter:blur(1.5px); background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:40s; }
      `}</style>
      <span className="star-layer sl1"/>
      <span className="star-layer sl2"/>
      <span className="star-layer sl3"/>

      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex justify-center mb-6 w-full">
          <BauLogo size="auth" className="mx-auto" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-primary text-center mb-1">BAU Connect</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Join with your BAU email</p>

        {/* Tab switcher */}
        <div className="flex bg-[#EAF2FB] rounded-2xl p-1 mb-6">
          <Link
            href="/login"
            className="flex-1 text-center py-2 rounded-xl text-gray-500 font-semibold text-sm hover:text-primary transition"
          >
            Login
          </Link>
          <span className="flex-1 text-center py-2 rounded-xl bg-sky text-white font-bold text-sm cursor-default">
            Sign Up
          </span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-1">Email</label>
            <div className="flex items-center border border-[#D0E4F5] rounded-2xl px-4 py-3 bg-[#EAF2FB] gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="your@stu.bau.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-1">Password</label>
            <div className="flex items-center border border-[#D0E4F5] rounded-2xl px-4 py-3 bg-[#EAF2FB] gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-1">Confirm Password</label>
            <div className="flex items-center border border-[#D0E4F5] rounded-2xl px-4 py-3 bg-[#EAF2FB] gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-black text-white text-base transition disabled:opacity-60"
            style={{ background: "linear-gradient(to right, #F15B47, #DBA631)" }}
          >
            {loading ? "Creating account..." : "Dive In"}
          </button>
        </form>
      </div>
    </div>
  );
}
