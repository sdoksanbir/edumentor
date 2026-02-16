// src/features/admin/api/users-api.ts
import { apiClient } from "@shared/api/client"

export type Gender = "MALE" | "FEMALE" | "UNSPECIFIED"

export type PanelUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  gender: Gender
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
  is_active: boolean
  is_approved: boolean
  must_change_password: boolean
  profile_completed: boolean
  created_at: string
  last_login?: string | null
  teacher_profile_id?: number | null
  student_profile_id?: number | null
  assigned_teacher_id?: number | null
  grade_label?: string | null
  grade_id?: number | null
  grade_level_id?: number | null
}

export type CreateUserPayload = {
  email: string
  first_name: string
  last_name: string
  phone?: string
  gender: Gender
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
  is_approved?: boolean
  grade_id?: number | null
  grade_level_id?: number | null
}

export type CreateUserResponse = {
  user: PanelUser
  generated_password: string
}

export type UpdateUserPayload = Partial<{
  email: string
  first_name: string
  last_name: string
  phone: string
  gender: Gender
  role: string
  is_active: boolean
  is_approved: boolean
  student_grade_id: number | null
  student_grade_level_id: number | null
}>

export type UsersListResponse = {
  count: number
  next: string | null
  previous: string | null
  results: PanelUser[]
}

export const usersKeys = {
  all: ["panel", "users"] as const,
  list: (params?: Record<string, string | number>) =>
    [...usersKeys.all, "list", params ?? {}] as const,
  detail: (id: number) => [...usersKeys.all, "detail", id] as const,
}

export async function getUser(id: number): Promise<PanelUser> {
  const res = await apiClient.get<PanelUser>(`/panel/users/${id}/`)
  return res.data
}

export async function listUsers(params?: {
  search?: string
  role?: string
  approved?: string
  active?: string
  page?: number
  page_size?: number
}): Promise<UsersListResponse> {
  const res = await apiClient.get<UsersListResponse>("/panel/users/", { params })
  return res.data
}

export async function createUser(data: CreateUserPayload): Promise<CreateUserResponse> {
  const res = await apiClient.post<CreateUserResponse>("/panel/users/", data)
  return res.data
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<PanelUser> {
  const res = await apiClient.patch<PanelUser>(`/panel/users/${id}/`, data)
  return res.data
}

export async function resetUserPassword(id: number): Promise<{ generated_password: string }> {
  const res = await apiClient.post<{ generated_password: string }>(`/panel/users/${id}/reset_password/`)
  return res.data
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/panel/users/${id}/`)
}
