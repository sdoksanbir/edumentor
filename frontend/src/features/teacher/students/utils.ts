// src/features/teacher/students/utils.ts
import type { Student } from "./types"

export function formatDateTR(iso: string): string {
  try {
    const d = new Date(iso)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return iso
  }
}

export function getInitials(s: Student): string {
  const f = (s.firstName ?? "").charAt(0)
  const l = (s.lastName ?? "").charAt(0)
  return `${f}${l}`.toUpperCase() || "?"
}

export function fullName(s: Student): string {
  return `${s.firstName} ${s.lastName}`.trim()
}
