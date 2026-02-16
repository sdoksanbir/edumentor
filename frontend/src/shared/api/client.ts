import axios from "axios"
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"
import { broadcastLogout } from "@shared/auth/cross-tab" // ✅ EKLENDİ

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"

// ⚠️ Backend endpointlerin /api ile başlıyorsa böyle kalsın:
// const baseURL = `${API_BASE}/api`
//
// Eğer endpointlerin "/auth/login/" gibi /api olmadan çalışıyorsa şu satırı API_BASE yap:
// const baseURL = `${API_BASE}`
const baseURL = `${API_BASE}/api`

const ACCESS_KEY = "prat_access"
const REFRESH_KEY = "prat_refresh"

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}
export function setTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

type ApiClient = AxiosInstance & {
  setTokens: (tokens: { access: string; refresh: string }) => void
  clearTokens: () => void
}

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
}) as ApiClient

// ✅ Eski kodlar bozulmasın diye methodları ekliyoruz
api.setTokens = setTokens
api.clearTokens = clearTokens

// ✅ Her isteğe access token ekle
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token))
  queue = []
}

// ✅ 401 olursa refresh dene, sonra aynı isteği yeniden dene
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!original) return Promise.reject(error)

    const status = error.response?.status
    const isRefreshCall = original.url?.includes("/auth/refresh/")

    if (status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true

      const refresh = getRefreshToken()
      if (!refresh) {
        clearTokens()
        broadcastLogout("no_refresh_token") // ✅ EKLENDİ (cross-tab logout)
        return Promise.reject(error)
      }

      // aynı anda 401 yiyen istekleri kuyruğa al
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error)
            original.headers = original.headers ?? {}
            ;(original.headers as any).Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const r = await axios.post<{ access: string }>(
          `${baseURL}/auth/refresh/`,
          { refresh },
          { headers: { "Content-Type": "application/json" } }
        )

        const newAccess = r.data.access
        localStorage.setItem(ACCESS_KEY, newAccess)
        flushQueue(newAccess)

        original.headers = original.headers ?? {}
        ;(original.headers as any).Authorization = `Bearer ${newAccess}`

        return api(original)
      } catch (e) {
        flushQueue(null)
        clearTokens()
        broadcastLogout("refresh_failed") // ✅ EKLENDİ (cross-tab logout)
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const apiClient = api
export default api
