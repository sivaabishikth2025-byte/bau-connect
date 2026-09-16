"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import BauLogo from "@/components/BauLogo";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMsg("");
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setResetMsg("Reset link sent from baustudentconnect.com. Check inbox and spam.");
    } catch {
      setResetError("Couldn't send reset email. Check the address and try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) router.replace("/verify-email");
      else router.replace("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-x-clip overflow-y-auto" style={{background:"radial-gradient(ellipse at 30% 60%,rgba(40,170,226,.15),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(219,166,49,.1),transparent 50%),#1C2D5A"}}>
      <style>{`
        @keyframes star-to-right {
          0% { background-position: -550px -315px; }
          100% { background-position: 550px 315px; }
        }
        .star-layer { position:absolute; inset:0; background-repeat:repeat; background-size:550px auto; animation:star-to-right 65s linear infinite; pointer-events:none; }
        .sl1 { background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_1.png"); }
        .sl2 { opacity:.45; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_2.png"); animation-duration:30s; background-size:400px auto; }
        .sl3 { opacity:.3; background-image:url("https://gamba-animations.netlify.app/images/greetings/greetings_star_3.png"); animation-duration:40s; background-size:480px auto; }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <span className="star-layer sl1"/>
        <span className="star-layer sl2"/>
        <span className="star-layer sl3"/>
      </div>
      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full max-w-sm relative z-10 my-auto">

        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 w-full">
          <BauLogo size="auth" className="mx-auto" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-primary text-center mb-1">BAU Connect</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Campus connections for carpools, study, hangouts</p>

        {/* Tab switcher */}
        <div className="flex bg-[#EAF2FB] rounded-2xl p-1 mb-6">
          <span className="flex-1 text-center py-2 rounded-xl bg-sky text-white font-bold text-sm cursor-default">
            Login
          </span>
          <Link
            href="/signup"
            className="flex-1 text-center py-2 rounded-xl text-gray-500 font-semibold text-sm hover:text-primary transition"
          >
            Sign Up
          </Link>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-primary font-semibold text-sm mb-1">Email</label>
            <div className="flex items-center border border-[#D0E4F5] rounded-2xl px-4 py-3 bg-[#EAF2FB] gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="your@email.com"
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
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent flex-1 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Forgot password */}
          <div className="flex justify-end">
            <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetMsg(""); setResetError(""); }} className="text-sky text-sm hover:underline">
              Forgot password?
            </button>
          </div>

          {/* Dive In button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-black text-white text-base transition disabled:opacity-60"
            style={{ background: "linear-gradient(to right, #F15B47, #DBA631)" }}
          >
            {loading ? "Signing in..." : "Dive In"}
          </button>
        </form>
      </div>

      {/* Forgot password modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
            <h2 className="text-xl font-black text-primary mb-1">Reset Password</h2>
            <p className="text-gray-400 text-sm mb-5">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="flex items-center border border-[#D0E4F5] rounded-2xl px-4 py-3 bg-[#EAF2FB] gap-2">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="bg-transparent flex-1 focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                  required
                />
              </div>
              {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
              {resetMsg && <p className="text-green-600 text-sm">{resetMsg}</p>}
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 rounded-2xl font-black text-white text-base transition disabled:opacity-60"
                style={{ background: "linear-gradient(to right, #F15B47, #DBA631)" }}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full py-3 rounded-2xl font-semibold text-gray-500 bg-[#EAF2FB] hover:bg-[#D0E4F5] transition text-sm"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
