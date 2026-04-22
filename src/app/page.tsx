"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Show landing page for logged-out users
      router.replace("/landing");
    } else if (!user.emailVerified) {
      router.replace("/verify-email");
    } else if (!profile) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }, [user, profile, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
