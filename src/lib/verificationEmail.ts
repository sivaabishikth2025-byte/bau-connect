import { auth } from "@/lib/firebase";

export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/send-verification", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!res.ok) {
    throw new Error(res.status === 429
      ? "Please wait a few minutes before requesting another verification email."
      : "We couldn't send your verification email right now. Please try again later.");
  }
}
