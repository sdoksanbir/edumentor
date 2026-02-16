import type { NavSection } from "../nav-types"
import { ADMIN_MENU } from "./admin.menu"
import { PARENT_MENU } from "./parent.menu"

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"

export function getMenuByRole(role?: Role | null): NavSection[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_MENU
    case "PARENT":
      return PARENT_MENU
    default:
      return PARENT_MENU // şimdilik fallback
  }
}
