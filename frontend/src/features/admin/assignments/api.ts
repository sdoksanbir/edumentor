// src/features/admin/assignments/api.ts
// Uses same API as Kullanıcılar: listUsers from /panel/users/ with role filter.
import { apiClient } from "@shared/api/client"
import { listUsers, type PanelUser } from "@features/admin/api/users-api"
import { isTeacher, isStudent } from "@shared/lib/role-normalizer"

/** Server response types (snake_case) - from TeacherStudentSerializer / teachers endpoint */
export type TeacherApi = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  branch?: string
}

export type StudentApi = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  grade?: string
  status?: "ACTIVE" | "PASSIVE"
  created_at?: string
  assigned_teacher_id?: number | null
  teacher_id?: number | null
  coach_id?: number | null
  coach?: { id?: number } | null
  teacher?: { id?: number } | null
}

export type FetchTeachersParams = {
  search?: string
}

export type FetchStudentsParams = {
  search?: string
  status?: string
  grade?: string
  page?: number
  page_size?: number
}

/** Fetches teachers using listUsers (same API as Kullanıcılar). Returns TeacherApi for mapping. */
export async function fetchTeachers(params?: FetchTeachersParams): Promise<TeacherApi[]> {
  const res = await listUsers({
    role: "TEACHER",
    search: params?.search,
    page_size: 500,
  })
  const users = (res.results ?? []) as PanelUser[]
  return users
    .filter((u) => isTeacher(u) && u.teacher_profile_id != null)
    .map((u) => ({
      id: u.teacher_profile_id!,
      user_id: u.id,
      email: u.email ?? "",
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      branch: "",
    }))
}

/** Fetches all students using listUsers (same API as Kullanıcılar). Returns StudentApi with assigned_teacher_id. */
export async function fetchAllStudentsFromUsers(params?: FetchStudentsParams): Promise<StudentApi[]> {
  const res = await listUsers({
    role: "STUDENT",
    search: params?.search,
    page_size: 500,
  })
  const users = (res.results ?? []) as PanelUser[]
  return users
    .filter((u) => isStudent(u) && u.student_profile_id != null)
    .map((u) => ({
      id: u.student_profile_id!,
      user_id: u.id,
      email: u.email ?? "",
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      phone: u.phone ?? "",
      grade: u.grade_label ?? "",
      status: "ACTIVE" as const,
      created_at: u.created_at,
      assigned_teacher_id: u.assigned_teacher_id ?? null,
      teacher_id: u.assigned_teacher_id ?? null,
    }))
}


export async function assignStudents(
  teacherId: number,
  studentIds: number[]
): Promise<{ assigned_count: number }> {
  const res = await apiClient.post<{ assigned_count: number }>(
    `/panel/teachers/${teacherId}/assign-students/`,
    { student_ids: studentIds }
  )
  return res.data
}

/** Map API response to UI camelCase types */
export function mapTeacherApiToUi(t: TeacherApi): { id: number; firstName: string; lastName: string; email: string; branch: string } {
  return {
    id: t.id,
    firstName: t.first_name ?? "",
    lastName: t.last_name ?? "",
    email: t.email ?? "",
    branch: t.branch ?? "",
  }
}

export function mapStudentApiToUi(s: StudentApi): {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  grade: string
  status: "ACTIVE" | "PASSIVE"
  createdAt?: string
} {
  return {
    id: s.id,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    grade: s.grade ?? "",
    status: (s.status === "PASSIVE" ? "PASSIVE" : "ACTIVE") as "ACTIVE" | "PASSIVE",
    createdAt: s.created_at,
  }
}

export async function unassignStudents(
  teacherId: number,
  studentIds: number[]
): Promise<{ unassigned_count: number }> {
  const res = await apiClient.post<{ unassigned_count: number }>(
    `/panel/teachers/${teacherId}/unassign-students/`,
    { student_ids: studentIds }
  )
  return res.data
}
