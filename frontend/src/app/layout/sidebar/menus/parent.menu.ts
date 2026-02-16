// src/app/layout/sidebar/menus/parent.menu.ts
import type { NavSection } from "../nav-types"
import { LayoutDashboard } from "lucide-react"

export const PARENT_MENU: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
]
