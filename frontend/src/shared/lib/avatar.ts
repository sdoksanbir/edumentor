import type { Gender } from "@features/admin/api/users-api"

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"

/**
 * role + gender'a göre local avatar seçer.
 * TEACHER+FEMALE => female-teacher, TEACHER+MALE => male-teacher, vb.
 */
export function getAvatarSrc(user: { role: Role; gender?: Gender | null }): string {
  const role = user?.role
  const gender = user?.gender
  if (role === "TEACHER" && gender === "FEMALE") return "/avatars/teacher-female-1.svg"
  if (role === "TEACHER" && gender === "MALE") return "/avatars/teacher-male-1.svg"
  if (role === "STUDENT" && gender === "FEMALE") return "/avatars/student-female-1.svg"
  if (role === "STUDENT" && gender === "MALE") return "/avatars/student-male-1.svg"
  return "/avatars/default-1.svg"
}
