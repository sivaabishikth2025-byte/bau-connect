/** Campus admins — these logins see Admin and can manage the app. */
export const ADMIN_EMAILS = [
  "smylavarapu@stu.bau.edu",
  "rmckie@bau.edu",
  "cthinkratok@bau.edu",
  "ratchata@bau.edu",
] as const;

/** @deprecated use ADMIN_EMAILS */
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export function isAdminEmail(email?: string | null) {
  const normalized = (email || "").trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail === normalized);
}
