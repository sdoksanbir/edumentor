import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { AxiosResponse } from "axios"
import { apiClient } from "@shared/api/client"

type Role = "ADMIN" | "TEACHER" | "STUDENT"

type Gender = "MALE" | "FEMALE" | "UNSPECIFIED"

type User = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  gender?: Gender
  profile_completed?: boolean
  is_staff?: boolean
  is_superuser?: boolean
  role?: Role
  is_approved?: boolean
  must_change_password?: boolean
}

type RegisterTeacherPayload = {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

type RegisterTeacherResponse = {
  user: User
  access: string
  refresh: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isBootstrapping: boolean

  login: (email: string, password: string) => Promise<User>
  registerTeacher: (payload: RegisterTeacherPayload) => Promise<User>
  refreshMe: () => Promise<User | null>
  logout: (opts?: { redirect?: boolean }) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_KEY = "prat_access"
const REFRESH_KEY = "prat_refresh"

// ===== Robust idle (timestamp) =====
const LAST_ACTIVITY_KEY = "edumath:lastActivity"

// ===== Cross-tab sync (BroadcastChannel + localStorage fallback) =====
const AUTH_CHANNEL = "edumath-auth"
const LS_EVENT_KEY = "edumath:auth:event"

type AuthSyncEvent = {
  type: "AUTH_LOGOUT"
  at: number
  reason?: string
  nonce?: number
}

function safeParse<T>(v: string | null): T | null {
  if (!v) return null
  try {
    return JSON.parse(v) as T
  } catch {
    return null
  }
}

function broadcastLogout(reason?: string) {
  const evt: AuthSyncEvent = {
    type: "AUTH_LOGOUT",
    at: Date.now(),
    reason,
    nonce: Math.random(),
  }

  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(AUTH_CHANNEL)
      bc.postMessage(evt)
      bc.close()
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(LS_EVENT_KEY, JSON.stringify(evt))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = apiClient

  const [user, setUser] = useState<User | null>(null)

  // Bootstrap loading is deterministic: only for initial auth resolution
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  // Keep existing external behavior: login/register toggles loading too
  const [isActionLoading, setIsActionLoading] = useState(false)

  const isLoading = isBootstrapping || isActionLoading

  const [showIdleWarning, setShowIdleWarning] = useState(false)

  const showIdleWarningRef = useRef(false)
  useEffect(() => {
    showIdleWarningRef.current = showIdleWarning
  }, [showIdleWarning])

  // Keep "Devam Et" compatibility
  const startTimersRef = useRef<(() => void) | null>(null)
  const forceLogoutRef = useRef<(() => void) | null>(null)
  const silentLogoutRef = useRef<(() => void) | null>(null)

  // Dedupe /me calls (bootstrap + manual refreshMe)
  const meInFlightRef = useRef<Promise<User | null> | null>(null)

  const getLastActivity = () => {
    const v = localStorage.getItem(LAST_ACTIVITY_KEY)
    const n = v ? Number(v) : 0
    return Number.isFinite(n) ? n : 0
  }

  const setLastActivity = (t: number) => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(t))
  }

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  const hasAnyToken = () =>
    !!localStorage.getItem(ACCESS_KEY) || !!localStorage.getItem(REFRESH_KEY)

  const doLogout = (reason?: string, broadcast = true) => {
    clearTokens()
    setShowIdleWarning(false)
    setUser(null)

    if (broadcast) broadcastLogout(reason ?? "logout")

    window.location.replace("/login")
  }

  const refreshMe = async (): Promise<User | null> => {
    if (meInFlightRef.current) return meInFlightRef.current

    const p = (async () => {
      const access = localStorage.getItem(ACCESS_KEY)
      const refresh = localStorage.getItem(REFRESH_KEY)
      if (!access && !refresh) {
        setUser(null)
        return null
      }

      try {
        const res: AxiosResponse<User> = await api.get("/auth/me/")
        setUser(res.data)
        return res.data
      } catch {
        clearTokens()
        setUser(null)
        return null
      } finally {
        meInFlightRef.current = null
      }
    })()

    meInFlightRef.current = p
    return p
  }

  // ✅ Auth bootstrap (single authority) + timeout (sunucu yanıt vermezse takılmayı önler)
  useEffect(() => {
    // React.StrictMode (dev) effect'i iki kez çalıştırabilir.
    // Bu effect'i idempotent tut: refreshMe zaten in-flight dedupe ediyor.
    let alive = true

    const BOOTSTRAP_TIMEOUT_MS = 10_000

    const bootstrap = async () => {
      try {
        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) setLastActivity(Date.now())

        if (!hasAnyToken()) {
          if (alive) {
            clearTokens()
            setUser(null)
          }
          return
        }

        const timeoutPromise = new Promise<"TIMEOUT">((resolve) =>
          setTimeout(() => resolve("TIMEOUT"), BOOTSTRAP_TIMEOUT_MS)
        )

        const result = await Promise.race([refreshMe(), timeoutPromise])
        if (!alive) return

        if (result === "TIMEOUT") {
          clearTokens()
          setUser(null)
        } else if (result === null) {
          // refreshMe başarısız/401 → user null
          setUser(null)
        }
      } catch {
        if (alive) {
          clearTokens()
          setUser(null)
        }
      } finally {
        if (alive) setIsBootstrapping(false)
      }
    }

    bootstrap()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Cross-tab logout listener
  useEffect(() => {
    let bc: BroadcastChannel | null = null

    const handle = (evt: AuthSyncEvent | null) => {
      if (!evt || evt.type !== "AUTH_LOGOUT") return
      if (!hasAnyToken() && !user) return
      silentLogoutRef.current?.()
    }

    try {
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel(AUTH_CHANNEL)
        bc.onmessage = (e) => handle(e.data as AuthSyncEvent)
      }
    } catch {
      bc = null
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_EVENT_KEY) return
      handle(safeParse<AuthSyncEvent>(e.newValue))
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener("storage", onStorage)
      if (bc) bc.close()
    }
  }, [user])

  // ✅ Robust idle: activity -> lastActivity
  useEffect(() => {
    if (!user) return

    if (!getLastActivity()) setLastActivity(Date.now())

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"]

    let raf = 0
    const onAny = () => {
      if (showIdleWarningRef.current) return
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        setLastActivity(Date.now())
      })
    }

    events.forEach((e) => window.addEventListener(e, onAny, { passive: true }))

    return () => {
      events.forEach((e) => window.removeEventListener(e, onAny as any))
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ✅ Robust idle: interval check -> warning + logout
  useEffect(() => {
    if (!user) return

    const IDLE_MS = 30 * 60 * 1000
    const WARNING_MS = 60 * 1000

    forceLogoutRef.current = () => doLogout("manual_logout", true)
    silentLogoutRef.current = () => doLogout("cross_tab", false)
    startTimersRef.current = () => setLastActivity(Date.now())

    const tick = () => {
      const last = getLastActivity()
      if (!last) {
        setLastActivity(Date.now())
        return
      }

      const now = Date.now()
      const idleFor = now - last

      if (idleFor >= IDLE_MS) {
        doLogout("idle_timeout", true)
        return
      }

      const shouldWarn = idleFor >= IDLE_MS - WARNING_MS
      if (shouldWarn && !showIdleWarningRef.current) {
        setShowIdleWarning(true)
      }
    }

    const iv = window.setInterval(tick, 1000)

    return () => {
      window.clearInterval(iv)
      startTimersRef.current = null
      forceLogoutRef.current = null
      silentLogoutRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const login = async (email: string, password: string) => {
    setIsActionLoading(true)
    try {
      const res: AxiosResponse<{ access: string; refresh: string }> = await api.post("/auth/login/", {
        email,
        password,
      })

      localStorage.setItem(ACCESS_KEY, res.data.access)
      localStorage.setItem(REFRESH_KEY, res.data.refresh)
      setLastActivity(Date.now())

      const me: AxiosResponse<User> = await api.get("/auth/me/")
      setUser(me.data)
      return me.data
    } finally {
      setIsActionLoading(false)
    }
  }

  // ✅ register-teacher artık access/refresh dönüyor: tekrar login yok
  const registerTeacher = async (payload: RegisterTeacherPayload) => {
    setIsActionLoading(true)
    try {
      const res: AxiosResponse<RegisterTeacherResponse> = await api.post("/auth/register-teacher/", payload)

      localStorage.setItem(ACCESS_KEY, res.data.access)
      localStorage.setItem(REFRESH_KEY, res.data.refresh)
      setLastActivity(Date.now())

      setUser(res.data.user)
      return res.data.user
    } finally {
      setIsActionLoading(false)
    }
  }

  const logout = (opts?: { redirect?: boolean }) => {
    if (opts?.redirect) {
      forceLogoutRef.current?.()
      return
    }

    clearTokens()
    setShowIdleWarning(false)
    setUser(null)
    broadcastLogout("logout_no_redirect")
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isBootstrapping,
      login,
      registerTeacher,
      refreshMe,
      logout,
    }),
    [user, isLoading, isBootstrapping]
  )

  return (
    <>
      {showIdleWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Oturumunuz kapanmak üzere</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Güvenliğiniz için kısa süre içinde oturumunuz sonlandırılacaktır.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowIdleWarning(false)
                  setLastActivity(Date.now())
                  startTimersRef.current?.()
                }}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
              >
                Oturumu Devam Ettir
              </button>

              <button
                onClick={() => forceLogoutRef.current?.()}
                className="rounded-md border border-border px-4 py-2"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
