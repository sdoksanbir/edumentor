import { apiClient } from "@shared/api/client"
import type { MeUser, MeUpdatePayload, MeEventsResponse } from "../types"

export const profileApi = {
  async getMe(): Promise<MeUser> {
    const res = await apiClient.get<MeUser>("/auth/me/")
    return res.data
  },

  async updateMe(payload: MeUpdatePayload): Promise<MeUser> {
    const res = await apiClient.patch<MeUser>("/auth/me/", payload)
    return res.data
  },

  async getEvents(params: { days?: number; page?: number; page_size?: number }): Promise<MeEventsResponse> {
    const searchParams = new URLSearchParams()
    if (params.days != null) searchParams.set("days", String(params.days))
    if (params.page != null) searchParams.set("page", String(params.page))
    if (params.page_size != null) searchParams.set("page_size", String(params.page_size))
    const qs = searchParams.toString()
    const url = qs ? `/auth/me/events/?${qs}` : "/auth/me/events/"
    const res = await apiClient.get<MeEventsResponse>(url)
    return res.data
  },

  async changePassword(payload: { old_password: string; new_password: string }): Promise<void> {
    await apiClient.post("/auth/change-password/", payload)
  },

  async uploadAvatar(file: File): Promise<MeUser> {
    const formData = new FormData()
    formData.append("avatar", file)
    const res = await apiClient.patch<MeUser>("/auth/me/", formData)
    return res.data
  },

  async removeAvatar(): Promise<MeUser> {
    const res = await apiClient.patch<MeUser>("/auth/me/", { avatar: null })
    return res.data
  },

  async logoutAll(): Promise<{ success: boolean }> {
    const res = await apiClient.post<{ success: boolean }>("/auth/logout-all/")
    return res.data
  },
}
