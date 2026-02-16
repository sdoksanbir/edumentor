import type { ThemeMode } from "@app/providers/use-theme"
import * as React from "react"
import { NavLink } from "react-router-dom"
import { Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@shared/ui/dropdown"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@app/providers/auth-provider"

function IconSun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function IconMoon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </svg>
  )
}

function IconMonitor(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

function IconLogout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12h18" />
      <path d="M3 6h18" />
      <path d="M3 18h18" />
    </svg>
  )
}

function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function IconGrid(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function IconUser(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 1v2" />
      <path d="M12 21v2" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h2" />
      <path d="M21 12h2" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconCreditCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function IconDollar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconHelp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

type TopbarProps = {
  onMenuClick?: () => void
  showMenuButton?: boolean
  themeMode: ThemeMode
  themeLabel: string
  setThemeMode: (m: ThemeMode) => void
  onLogout?: () => void
}

export function Topbar({
  onMenuClick,
  showMenuButton,
  themeMode,
  setThemeMode,
  onLogout,
}: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName =
    (user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : user?.email) ?? "Kullanıcı"

  const initials = (() => {
    const source =
      user?.first_name || user?.last_name
        ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
        : user?.email ?? "U"
    const parts = source.split(/\s|@|\.|_|-/).filter(Boolean)
    const a = parts[0]?.[0] ?? "U"
    const b = parts[1]?.[0] ?? ""
    return (a + b).toUpperCase()
  })()

  const roleLabel = user?.is_superuser ? "Yönetici" : user?.is_staff ? "Personel" : "Kullanıcı"

  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout()
    } else {
      logout()
      navigate("/login", { replace: true })
    }
  }, [logout, navigate, onLogout])

  return (
    <header className="h-16 bg-card border-b border-border shadow-[0_4px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_1px_3px_rgba(0,0,0,0.15)] sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: menu + search */}
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/60"
              aria-label="Open menu"
            >
              <IconMenu className="w-5 h-5" />
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 h-9 w-[360px] rounded-xl bg-muted/40 border border-border/50 px-3">
            <IconSearch className="w-5 h-5 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              placeholder="Search..."
            />
            <kbd className="text-[11px] text-muted-foreground border border-border/60 rounded-md px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/60"
            aria-label="Notifications"
          >
            <IconBell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center font-medium">
              3
            </span>
          </button>

          {/* Theme menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/60"
                aria-label="Theme"
              >
                {themeMode === "light" ? (
                  <IconSun className="w-5 h-5" />
                ) : themeMode === "dark" ? (
                  <IconMoon className="w-5 h-5" />
                ) : (
                  <IconMonitor className="w-5 h-5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 p-2">
              <DropdownMenuItem
                onClick={() => setThemeMode("light")}
                className={themeMode === "light" ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
              >
                <IconSun className="w-5 h-5" />
                <span className="flex-1 text-left">Light</span>
                {themeMode === "light" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setThemeMode("dark")}
                className={themeMode === "dark" ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
              >
                <IconMoon className="w-5 h-5" />
                <span className="flex-1 text-left">Dark</span>
                {themeMode === "dark" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setThemeMode("system")}
                className={themeMode === "system" ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}
              >
                <IconMonitor className="w-5 h-5" />
                <span className="flex-1 text-left">System</span>
                {themeMode === "system" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Layout Icon */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/60"
            aria-label="Layout"
          >
            <IconGrid className="w-5 h-5" />
          </button>

          {/* Avatar menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 transition-all border border-primary/20"
                aria-label="User menu"
              >
                <span className="text-sm font-medium text-primary">{initials}</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-card" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2">
              {/* User Header */}
              <div className="px-3 py-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="text-sm font-medium text-primary">{initials}</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-card" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground">{displayName}</div>
                    <div className="text-sm text-muted-foreground">{roleLabel}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
              </div>

              <div className="border-b border-border/50 mb-1" />

              {/* Menu Items */}
              <NavLink to={user?.role === "ADMIN" || user?.is_staff ? "/panel/profile" : "/profile"}>
                {({ isActive }) => (
                  <div
                    className={`h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <IconUser className="w-5 h-5" />
                    <span>Profilim</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/settings">
                {({ isActive }) => (
                  <div
                    className={`h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <IconSettings className="w-5 h-5" />
                    <span>Ayarlar</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/billing">
                {({ isActive }) => (
                  <div
                    className={`h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <IconCreditCard className="w-5 h-5" />
                    <span className="flex-1">Ödeme</span>
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">4</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/pricing">
                {({ isActive }) => (
                  <div
                    className={`h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <IconDollar className="w-5 h-5" />
                    <span>Fiyatlandırma</span>
                  </div>
                )}
              </NavLink>

              <NavLink to="/faq">
                {({ isActive }) => (
                  <div
                    className={`h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <IconHelp className="w-5 h-5" />
                    <span>SSS</span>
                  </div>
                )}
              </NavLink>

              {/* Logout Button */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-10 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <span>Çıkış Yap</span>
                  <IconLogout className="w-4 h-4" />
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
