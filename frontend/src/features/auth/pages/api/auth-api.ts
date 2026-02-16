import api from "@shared/api/client"
import type { AxiosRequestConfig } from "axios"

type LoginResponse = { access: string; refresh: string }
type MeResponse = {
  id: number
  email: string
  first_name?: string
  last_name?: string
  role?: string
}

type RegisterTeacherPayload = {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

const NO_AUTH_CONFIG: AxiosRequestConfig = {}

export const authApi = {
  async login(email: string, password: string) {
    const res = await api.post<LoginResponse>("/auth/login/", { email, password }, NO_AUTH_CONFIG)

    // ✅ AxiosResponse -> res.data
    api.setTokens({ access: res.data.access, refresh: res.data.refresh })
    return res.data
  },

  async me() {
    const res = await api.get<MeResponse>("/auth/me/")
    return res.data
  },

  async registerTeacher(payload: RegisterTeacherPayload) {
    // ❌ üçüncü parametre true/false olamaz, config object olmalı
    const res = await api.post("/auth/register-teacher/", payload, NO_AUTH_CONFIG)
    return res.data
  },

  async logout() {
    try {
      await api.post("/auth/logout/")
    } catch {
      // Ignore - always clear tokens
    } finally {
      api.clearTokens()
    }
  },
}
