// src/features/teacher/types/index.ts

export type LessonStatus = "DONE" | "MISSED" | "POSTPONED"

export type Guardian = {
  id: string
  fullName: string
  phone?: string
  email?: string
}

export type Student = {
  id: string
  fullName: string
  grade?: string
  guardians: Guardian[]
}

export type Lesson = {
  id: string
  studentId: string
  dateISO: string
  status: LessonStatus
  topic?: string
  homework?: string
  notes?: string
}
