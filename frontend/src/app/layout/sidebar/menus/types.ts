// src/app/layout/sidebar/menus/types.ts
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  key: string
  label: string
  href?: string
  icon?: LucideIcon
  children?: NavItem[]
}

export type NavSection = {
  key: string
  label?: string
  items: NavItem[]
}
