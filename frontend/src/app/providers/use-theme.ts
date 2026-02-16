import { useEffect, useMemo, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "edumath:theme"

function getSystemTheme(): "light" | "dark" {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getResolvedTheme(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystemTheme() : mode
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.theme = resolved
}

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system"
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (saved === "light" || saved === "dark" || saved === "system") return saved
  return "system"
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = getStoredMode()
    applyTheme(getResolvedTheme(stored))
    return stored
  })
  const [actual, setActual] = useState<"light" | "dark">(() =>
    getResolvedTheme(getStoredMode())
  )

  useEffect(() => {
    const nextActual = getResolvedTheme(mode)
    setActual(nextActual)
    applyTheme(nextActual)
  }, [mode])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (mode === "system") {
        const nextActual = getSystemTheme()
        setActual(nextActual)
        applyTheme(nextActual)
      }
    }
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [mode])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
    const resolved = getResolvedTheme(newMode)
    setActual(resolved)
    applyTheme(resolved)
  }

  const label = useMemo(() => {
    if (mode === "system") return `System (${actual === "dark" ? "Dark" : "Light"})`
    return mode === "dark" ? "Dark" : "Light"
  }, [mode, actual])

  return { mode, actual, setMode, label }
}
