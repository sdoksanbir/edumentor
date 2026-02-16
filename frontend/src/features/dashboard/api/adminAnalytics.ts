// src/features/dashboard/api/adminAnalytics.ts
import { apiClient } from "@shared/api/client"

export type DashboardAnalytics = {
  total_users: number
  active_teachers: number
  active_students: number
  assigned_student_ratio: number
  new_users_last_7_days: number
  must_change_password_count: number
  monthly_new_users: { month: string; count: number }[]
  role_distribution: { role: string; count: number }[]
  students_per_teacher: { teacher_id: number; teacher_name: string; count: number }[]
  weekly_active_trend: { week: string; count: number }[]
}

export const adminAnalyticsKeys = {
  all: ["admin", "analytics"] as const,
  dashboard: () => [...adminAnalyticsKeys.all, "dashboard"] as const,
} as const

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const res = await apiClient.get<DashboardAnalytics>("/admin/analytics/dashboard/")
  return res.data
}
