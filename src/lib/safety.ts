import { auth } from "./firebase";
export async function safetyRequest(path: string, body?: Record<string, unknown>, method = "POST") {
  if (!auth.currentUser) throw new Error("Please sign in first.");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(path, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
/** Basic text screening; reports and staff review handle context and images. */
export function contentAllowed(text: string) {
  return !/\b(?:fuck(?:ing|er|ed)?|shit|bitch|cunt|nigger|faggot)\b/i.test(text.normalize("NFKC"));
}
