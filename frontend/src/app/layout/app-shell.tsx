import { Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { Sidebar } from "./sidebar/sidebar"
import { Topbar } from "./topbar"
import { RestrictedModeBanner } from "../components/restricted-mode-banner"
import { useMediaQuery } from "@shared/hooks/use-media-query"
import { useThemeContext } from "@app/providers/theme-provider"
import { useAuth } from "@app/providers/auth-provider"

export function AppShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const mustChangePassword = user?.must_change_password === true

  const { mode, label, setMode } = useThemeContext()

  // Desktop'a geçince mobile drawer kapansın
  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  // Mobile drawer açıkken body scroll kilidi
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!mustChangePassword && (
        <Sidebar
          variant="mobile"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {!mustChangePassword && isDesktop ? (
          <Sidebar variant="desktop" />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {!mustChangePassword && (
            <>
              <Topbar
                showMenuButton={!isDesktop}
                onMenuClick={() => setMobileOpen(true)}
                themeMode={mode}
                themeLabel={label}
                setThemeMode={setMode}
                onLogout={logout}
              />
              <RestrictedModeBanner />
            </>
          )}

          <main className="flex-1 px-4 py-6 lg:px-6 xl:px-8 2xl:px-12">
            <div className="mx-auto max-w-[1440px] w-full">
              <div className="w-full rounded-2xl border border-border bg-card shadow-sm p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
