import type { LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  to: string
  icon?: LucideIcon
  badge?: string
}

export type NavSection = {
  title?: string
  icon?: LucideIcon
  submenu?: boolean
  items: NavItem[]
}
