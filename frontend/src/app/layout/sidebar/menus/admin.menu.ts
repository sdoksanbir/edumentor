// src/app/layout/sidebar/menus/admin.menu.ts
import type { NavSection } from "../nav-types"
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  BookMarked,
  FolderOpen,
  Layers,
} from "lucide-react"

export const ADMIN_MENU: NavSection[] = [
  {
    items: [{ label: "Ana Sayfa", to: "/panel/dashboard", icon: Home }],
  },
  {
    items: [
      { label: "Kullanıcılar", to: "/panel/users", icon: Users },
      { label: "Öğrenci Atama", to: "/panel/assignments/teacher-students", icon: Users },
    ],
  },
  {
    title: "Parametreler",
    icon: BookOpen,
    submenu: true,
    items: [
      { label: "Sınıf Düzeyleri", to: "/panel/params/grade-levels", icon: Layers },
      { label: "Branşlar", to: "/panel/params/subjects", icon: GraduationCap },
      { label: "Dersler", to: "/panel/params/lesson-categories", icon: BookOpen },
      { label: "Üniteler", to: "/panel/params/units", icon: BookMarked },
      { label: "Konular", to: "/panel/params/topics", icon: FolderOpen },
    ],
  },
]
