export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "plbrpc@gmail.com"
).toLowerCase();

export function resolveUserRole(email: string): "admin" | "freelancer" {
  return email.toLowerCase() === ADMIN_EMAIL ? "admin" : "freelancer";
}
