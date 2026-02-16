// src/features/teacher/api/teacher-api.ts
// Real API for teacher - students from backend. Lessons remain mock until backend ready.
import { apiClient } from "@shared/api/client"
import type { Lesson } from "../types"
import { MOCK_LESSONS } from "./mock"

const norm = (v: string | number) => String(v)

export const teacherKeys = {
  all: ["teacher"] as const,
  students: () => [...teacherKeys.all, "students"] as const,
  student: (id: string | number) => [...teacherKeys.all, "student", norm(id)] as const,
  lessons: (studentId: string | number) => [...teacherKeys.all, "lessons", norm(studentId)] as const,
  lesson: (id: string | number) => [...teacherKeys.all, "lesson", norm(id)] as const,
}

type StudentApi = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  grade?: string
  status?: string
  created_at?: string
}

export type Student = {
  id: string
  fullName: string
  grade?: string
  guardians: { id: string; fullName: string; phone?: string; email?: string }[]
}

function mapApiToStudent(api: StudentApi): Student {
  return {
    id: String(api.id),
    fullName: [api.first_name, api.last_name].filter(Boolean).join(" ") || api.email,
    grade: api.grade,
    guardians: [],
  }
}

export async function listStudents(): Promise<Student[]> {
  const res = await apiClient.get<StudentApi[]>("/teacher/students/")
  return res.data.map(mapApiToStudent)
}

export async function getStudent(id: string | number): Promise<Student | null> {
  const sid = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  if (typeof sid !== "number") return null
  try {
    const res = await apiClient.get<StudentApi>(`/teacher/students/${sid}/`)
    return mapApiToStudent(res.data)
  } catch {
    return null
  }
}

export async function listLessonsByStudent(studentId: string | number): Promise<Lesson[]> {
  const sid = norm(studentId)
  return MOCK_LESSONS.filter((l) => l.studentId === sid)
}

export async function getLesson(id: string | number): Promise<Lesson | null> {
  const lid = norm(id)
  return MOCK_LESSONS.find((l) => l.id === lid) ?? null
}
