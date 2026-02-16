// src/features/teacher/students/api.ts
// API for teacher's own students (logged-in teacher).
import { apiClient } from "@shared/api/client"

export type TeacherStudentApi = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  grade?: string
  status?: "ACTIVE" | "PASSIVE"
  created_at?: string
}

export async function fetchMyStudents(params?: { search?: string }): Promise<TeacherStudentApi[]> {
  const res = await apiClient.get<TeacherStudentApi[]>("/teacher/students/", {
    params: params?.search ? { search: params.search } : undefined,
  })
  return res.data
}
