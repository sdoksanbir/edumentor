import { ADMIN_MENU } from "./admin.menu"
import { TEACHER_MENU } from "./teacher.menu"
import { STUDENT_MENU } from "./student.menu"
import { PARENT_MENU } from "./parent.menu"

export function getMenuByRole(role?: string) {
  switch (role) {
    case "ADMIN":
      return ADMIN_MENU
    case "STUDENT":
      return STUDENT_MENU
    case "PARENT":
      return PARENT_MENU
    default:
      return TEACHER_MENU
  }
}
