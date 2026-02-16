/**
 * Normalizes raw role/user_type values to canonical role strings.
 * Supports both API keys (role, user_type, type) and Turkish display labels.
 */
export type NormalizedRole = "STUDENT" | "TEACHER" | "ADMIN" | "PARENT"

export function normalizeRole(
  u: { role?: unknown; user_type?: unknown; type?: unknown } | string
): NormalizedRole | null {
  const raw =
    typeof u === "string"
      ? u
      : String((u as { role?: unknown }).role ?? (u as { user_type?: unknown }).user_type ?? (u as { type?: unknown }).type ?? "")
  const upper = raw.toUpperCase()

  if (upper.includes("STUDENT") || upper.includes("ÖĞRENC")) return "STUDENT"
  if (upper.includes("TEACHER") || upper.includes("ÖĞRETM")) return "TEACHER"
  if (upper.includes("ADMIN")) return "ADMIN"
  if (upper.includes("PARENT") || upper.includes("VELİ") || upper.includes("VELI")) return "PARENT"

  return null
}

export function isStudent(u: { role?: unknown; user_type?: unknown; type?: unknown }): boolean {
  return normalizeRole(u) === "STUDENT"
}

export function isTeacher(u: { role?: unknown; user_type?: unknown; type?: unknown }): boolean {
  return normalizeRole(u) === "TEACHER"
}
