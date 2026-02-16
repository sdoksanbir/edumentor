import { Link, useLocation } from "react-router-dom"
import { useState, useEffect, useMemo } from "react"
import { getMenuByRole } from "./menus"
import type { NavSection, NavItem } from "./nav-types"

import { useAuth } from "@app/providers/auth-provider"

const HOME_PATHS = ["/dashboard", "/panel/dashboard", "/teacher/dashboard", "/student/dashboard"] as const

function isHomeItem(to: string): boolean {
  return HOME_PATHS.includes(to as (typeof HOME_PATHS)[number])
}

function isItemActive(item: NavItem, pathname: string, role: string): boolean {
  // ADMIN: exact match (Django /admin ile çakışma yok)
  if (role === "ADMIN") return pathname === item.to
  if (isHomeItem(item.to)) {
    if (role === "TEACHER") return pathname === "/teacher/dashboard"
    if (role === "STUDENT") return pathname === "/student/dashboard"
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(item.to + "/")
}

function getSectionForPath(pathname: string, nav: NavSection[]): string | null {
  for (const section of nav) {
    if (!section.submenu || !section.title) continue
    const hasMatch = section.items.some(
      (item) => pathname === item.to || pathname.startsWith(item.to + "/")
    )
    if (hasMatch) return section.title
  }
  return null
}

type SidebarProps = {
  open?: boolean
  onClose?: () => void
  variant?: "desktop" | "mobile"
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth()
  const location = useLocation()

  const isAdmin =
    user?.role === "ADMIN" || user?.is_staff === true || user?.is_superuser === true

  const role = (isAdmin ? "ADMIN" : user?.role) ?? "TEACHER"

  const NAV = useMemo<NavSection[]>(() => {
    return (getMenuByRole(user?.role) ?? []) as NavSection[]
  }, [user?.role])

  const sectionForPath = useMemo(
    () => getSectionForPath(location.pathname, NAV),
    [location.pathname, NAV]
  )

  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    setExpandedSection(null)
  }, [location.pathname])

  // Kullanıcı tıklaması öncelikli; yoksa path ile eşleşen section açılır
  const openSection = expandedSection ?? sectionForPath

  const toggleSection = (title: string) => {
    setExpandedSection((prev) => (prev === title ? null : title))
  }

  return (
    <div className="h-full w-[260px] bg-sidebar border-r border-border flex flex-col shadow-[4px_0_12px_rgba(0,0,0,0.1),1px_0_3px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.25),1px_0_3px_rgba(0,0,0,0.15)]">
      {/* Header - Logo + Brand (yükseklik topbar ile aynı, gölge topbar gibi) */}
      <div className="h-16 px-4 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)]">
        <Link
          to="/"
          className="flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-1 -m-1"
          aria-label="Ana sayfa"
        >
          <img
            src="/images/auth/edumath-logo.webp"
            alt="Edumath"
            className="h-12 w-auto flex-shrink-0 object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((section: NavSection, i: number) => (
          <div key={section.title ? `${section.title}-${i}` : i}>
            {section.submenu && section.title ? (
              <SubmenuSection
                section={section}
                isOpen={openSection === section.title}
                onToggle={() => toggleSection(section.title!)}
                onClose={onClose}
                pathname={location.pathname}
                role={role}
              />
            ) : (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isItemActive(item, location.pathname, role)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose?.()}
                      className={cn(
                        "group flex items-center gap-3 px-3 rounded-lg py-3 text-sm transition-all relative",
                        active
                          ? "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-r"
                          : "text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

function SubmenuSection({
  section,
  isOpen,
  onToggle,
  onClose,
  pathname,
  role,
}: {
  section: NavSection
  isOpen: boolean
  onToggle: () => void
  onClose?: () => void
  pathname: string
  role: string
}) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 rounded-lg py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 transition-all"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {section.icon && <section.icon className="flex-shrink-0 w-4 h-4" />}
          <span className="uppercase tracking-wide text-xs">{section.title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-1 space-y-1 pl-2">
          {section.items.map((item) => {
            const active = isItemActive(item, pathname, role)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => onClose?.()}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all relative",
                  active
                    ? "bg-primary/15 text-primary font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-r"
                    : "text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                )}
              >
                {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose, variant = "desktop" }: SidebarProps) {
  if (variant === "mobile") {
    return (
      <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/30 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />

        <aside
          className={cn(
            "absolute left-0 top-0 h-full border-r border-border bg-background transition-transform",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent onClose={onClose} />
        </aside>
      </div>
    )
  }

  return (
    <aside className="sticky top-0 h-screen self-start z-30 shrink-0">
      <SidebarContent />
    </aside>
  )
}
