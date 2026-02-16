import { apiClient } from "@shared/api/client"
import type {
  TeacherPerformanceItem,
  StudentProgressItem,
  MostActiveTeacherItem,
  MostUsedCourseItem,
  DailyLoginItem,
  LoginLogItem,
  RiskyTeacherItem,
  InactiveStudentItem,
} from "../types"

export type ReportQueryParams = {
  date_from?: string
  date_to?: string
  branch_id?: string
  teacher_profile_id?: string | number
  days?: number
  limit?: number
  search?: string
  ordering?: string
  event_type?: string
  user_id?: string
  page?: number
  page_size?: number
}

export const reportsKeys = {
  all: ["admin", "reports"] as const,
  teacherPerformance: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "teacher-performance", params] as const,
  studentProgress: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "student-progress", params] as const,
  mostActiveTeachers: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "most-active-teachers", params] as const,
  mostUsedCourses: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "most-used-courses", params] as const,
  dailyLogins: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "daily-logins", params] as const,
  loginLogs: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "login-logs", params] as const,
  riskyTeachers: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "risky-teachers", params] as const,
  inactiveStudents: (params?: ReportQueryParams) =>
    [...reportsKeys.all, "inactive-students", params] as const,
}

function buildParams(p?: ReportQueryParams): Record<string, string | number> {
  if (!p) return {}
  const out: Record<string, string | number> = {}
  if (p.date_from) out.date_from = p.date_from
  if (p.date_to) out.date_to = p.date_to
  if (p.branch_id) out.branch_id = p.branch_id
  if (p.teacher_profile_id != null) out.teacher_profile_id = p.teacher_profile_id
  if (p.search) out.search = p.search
  if (p.ordering) out.ordering = p.ordering
  if (p.limit) out.limit = p.limit
  if (p.event_type) out.event_type = p.event_type
  if (p.user_id) out.user_id = p.user_id
  if (p.page) out.page = p.page
  if (p.page_size) out.page_size = p.page_size
  if (p.days != null) out.days = p.days
  if (p.limit != null) out.limit = p.limit
  return out
}

export async function fetchRiskyTeachers(
  params?: ReportQueryParams
): Promise<{ results: RiskyTeacherItem[] }> {
  const res = await apiClient.get<{ results: RiskyTeacherItem[] }>(
    "/admin/reports/risky-teachers/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchInactiveStudents(
  params?: ReportQueryParams
): Promise<{
  items: InactiveStudentItem[]
  total: number
  page: number
  page_size: number
}> {
  const res = await apiClient.get<{
    items: InactiveStudentItem[]
    total: number
    page: number
    page_size: number
  }>("/admin/reports/inactive-students/", { params: buildParams(params) })
  return res.data
}

export async function fetchTeacherPerformance(
  params?: ReportQueryParams
): Promise<{ results: TeacherPerformanceItem[] }> {
  const res = await apiClient.get<{ results: TeacherPerformanceItem[] }>(
    "/admin/reports/teacher-performance/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchStudentProgress(
  params?: ReportQueryParams
): Promise<{ results: StudentProgressItem[] }> {
  const res = await apiClient.get<{ results: StudentProgressItem[] }>(
    "/admin/reports/student-progress/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchMostActiveTeachers(
  params?: ReportQueryParams
): Promise<{ results: MostActiveTeacherItem[] }> {
  const res = await apiClient.get<{ results: MostActiveTeacherItem[] }>(
    "/admin/reports/most-active-teachers/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchMostUsedCourses(
  params?: ReportQueryParams
): Promise<{ results: MostUsedCourseItem[] }> {
  const res = await apiClient.get<{ results: MostUsedCourseItem[] }>(
    "/admin/reports/most-used-courses/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchDailyLogins(
  params?: ReportQueryParams
): Promise<{ results: DailyLoginItem[] }> {
  const res = await apiClient.get<{ results: DailyLoginItem[] }>(
    "/admin/reports/daily-logins/",
    { params: buildParams(params) }
  )
  return res.data
}

export async function fetchLoginLogs(
  params?: ReportQueryParams
): Promise<{
  items: LoginLogItem[]
  total: number
  page: number
  page_size: number
}> {
  const res = await apiClient.get<{
    items: LoginLogItem[]
    total: number
    page: number
    page_size: number
  }>("/admin/reports/login-logs/", { params: buildParams(params) })
  return res.data
}
