import { LayoutDashboard, BookOpen } from "lucide-react"
import type { NavSection } from "./../nav-types"

export const STUDENT_MENU: NavSection[] = [
  {
    items: [
      { label: "Ana Sayfa", to: "/student/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Derslerim",
    icon: BookOpen,
    submenu: true,
    items: [
      { label: "İçerikler", to: "/student/courses", icon: BookOpen },
      { label: "İlerlemem", to: "/student/progress", icon: BookOpen },
    ],
  },
]
