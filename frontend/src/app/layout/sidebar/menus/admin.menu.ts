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
  BarChart3,
  User,
  CreditCard,
  Package,
  Settings,
} from "lucide-react"

export const ADMIN_MENU: NavSection[] = [
  {
    items: [
      { label: "Ana Sayfa", to: "/panel/dashboard", icon: Home },
      { label: "Profilim", to: "/panel/profile", icon: User },
    ],
  },
  {
    items: [
      { label: "Kullanıcılar", to: "/panel/users", icon: Users },
      { label: "Öğrenci Atama", to: "/panel/assignments/teacher-students", icon: Users },
      { label: "Raporlar", to: "/panel/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Abonelikler",
    icon: CreditCard,
    submenu: true,
    items: [
      { label: "Plan Yönetimi", to: "/panel/billing/plans", icon: Package },
      { label: "Abonelikler", to: "/panel/billing/subscriptions", icon: CreditCard },
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
  {
    title: "Ayarlar",
    icon: Settings,
    submenu: true,
    items: [{ label: "Site Ayarları", to: "/panel/settings/site", icon: Settings }],
  },
]
