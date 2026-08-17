/** Sole campus admin — only this login sees Admin and can manage the app. */
export const ADMIN_EMAIL = "smylavarapu@stu.bau.edu";

export function isAdminEmail(email?: string | null) {
  return (email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
