// src/features/admin/api/teachers-api.ts
// Used by user-details-page for teacher's assigned students.
import { apiClient } from "@shared/api/client"

export type StudentListItem = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
}

export async function getTeacherStudents(teacherId: number): Promise<StudentListItem[]> {
  const res = await apiClient.get<StudentListItem[]>(
    `/panel/teachers/${teacherId}/students/`
  )
  return res.data
}
