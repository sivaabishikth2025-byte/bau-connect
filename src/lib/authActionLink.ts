/**
 * Firebase generates links to its hosted handler (firebaseapp.com/__/auth/action). Pointing them at
 * our own /auth/action page instead lets Android App Links open the email link directly in the app.
 */
export function toAppActionLink(firebaseLink: string, appUrl: string) {
  const source = new URL(firebaseLink);
  const target = new URL("/auth/action", appUrl);
  for (const key of ["mode", "oobCode", "apiKey", "lang"]) {
    const value = source.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return target.toString();
}
