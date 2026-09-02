import { auth } from "@/lib/firebase";

export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/send-verification", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data.error || "Could not send verification email";
    if (/unrecognised IP|authorized_ips/i.test(raw)) {
      throw new Error("Email service is temporarily blocked. The site admin needs to disable Brevo IP restrictions.");
    }
    throw new Error(raw);
  }
}
