// src/features/teacher/students/types.ts

export type StudentStatus = "ACTIVE" | "PASSIVE"

export type Student = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  grade: string
  status: StudentStatus
  createdAt?: string
}
