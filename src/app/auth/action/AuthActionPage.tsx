"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

type Status = "loading" | "success" | "error" | "reset";

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Working on your request...");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("error");
      setMessage("This link is invalid or has expired.");
      return;
    }

    if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("success");
          setMessage("Your email is verified. You can sign in to BAU Connect now.");
          setTimeout(() => router.replace("/login"), 2500);
        })
        .catch(() => {
          setStatus("error");
          setMessage("This verification link is invalid or has already been used.");
        });
      return;
    }

    if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => setStatus("reset"))
        .catch(() => {
          setStatus("error");
          setMessage("This password reset link is invalid or has expired.");
        });
      return;
    }

    setStatus("error");
    setMessage("This link type is not supported.");
  }, [mode, oobCode, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
      setMessage("Password updated. Redirecting to sign in...");
      setTimeout(() => router.replace("/login"), 2500);
    } catch {
      setStatus("error");
      setMessage("Could not reset password. Request a new link from the login page.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1C2D5A" }}>
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-black text-primary mb-2">BAU Connect</h1>

        {status === "loading" && <p className="text-gray-500">{message}</p>}

        {status === "success" && (
          <>
            <p className="text-green-600 font-semibold mb-4">{message}</p>
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Go to sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-500 mb-4">{message}</p>
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Back to sign in
            </Link>
          </>
        )}

        {status === "reset" && (
          <form onSubmit={handleReset} className="space-y-4 text-left">
            <p className="text-gray-600 text-sm text-center mb-2">Choose a new password</p>
            <div>
              <label className="text-sm font-semibold text-primary">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-[#EAF2FB] outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-primary">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-[#EAF2FB] outline-none"
                required
              />
            </div>
            {message && <p className="text-sm text-red-500">{message}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white rounded-2xl py-3 font-bold disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
