// src/features/admin/api/admin-api.ts
import { apiClient } from "@shared/api/client"

// --- Types ---
export type GradeLevel = {
  id: number
  name: string
  code: string
  kind: "CLASS" | "EXAM" | "OTHER"
  is_active: boolean
  order: number | null
  created_at?: string
  updated_at?: string
}

export type Subject = {
  id: number
  code: string
  label: string
  order: number | null
  is_active: boolean
}

export type LessonCategory = {
  id: number
  grade_level: number
  grade_level_name?: string
  name: string
  is_active: boolean
  order: number | null
  created_at?: string
  updated_at?: string
}

export type Unit = {
  id: number
  lesson_category: number
  lesson_category_name?: string
  name: string
  order: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type Topic = {
  id: number
  lesson_category: number
  unit: number | null
  unit_name?: string | null
  lesson_category_name?: string
  name: string
  order: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// --- Query Keys ---
export const catalogKeys = {
  all: ["catalog"] as const,
  gradeLevels: (kind?: string) =>
    [...catalogKeys.all, "grade-levels", kind ?? "all"] as const,
  subjects: () => [...catalogKeys.all, "subjects"] as const,
  lessonCategories: (gradeLevelId: number | null, search?: string) =>
    [
      ...catalogKeys.all,
      "lesson-categories",
      String(gradeLevelId ?? "none"),
      search ?? "",
    ] as const,
  /** Use for broad invalidation (all lesson-category lists) */
  lessonCategoriesAll: () => [...catalogKeys.all, "lesson-categories"] as const,
  units: (lessonCategoryId?: number) =>
    [...catalogKeys.all, "units", lessonCategoryId ?? "all"] as const,
  /** Use for broad invalidation (all unit lists) */
  unitsAll: () => [...catalogKeys.all, "units"] as const,
  topics: (
    unitId: number | null | undefined,
    lessonCategoryId?: number
  ) =>
    [
      ...catalogKeys.all,
      "topics",
      unitId === null ? "null" : unitId ?? "u",
      lessonCategoryId ?? "lc",
    ] as const,
  /** Use for broad invalidation (all topic lists) */
  topicsAll: () => [...catalogKeys.all, "topics"] as const,
} as const

// --- API Functions ---

// --- Grade (catalog.Grade - StudentProfile.grade) ---
export type Grade = {
  id: number
  code: string
  label: string
  order?: number
  is_active?: boolean
}

export async function listGrades(): Promise<Grade[]> {
  const res = await apiClient.get<Grade[]>("/catalog/grades/")
  return res.data
}

// --- GradeLevel ---
export async function listGradeLevels(params?: {
  search?: string
  ordering?: string
  kind?: "CLASS" | "EXAM" | "OTHER"
}): Promise<GradeLevel[]> {
  const res = await apiClient.get<GradeLevel[]>("/catalog/grade-levels/", { params })
  return res.data
}

export async function createGradeLevel(data: {
  name: string
  kind?: "CLASS" | "EXAM" | "OTHER"
  order?: number | null
  is_active?: boolean
}) {
  const res = await apiClient.post<GradeLevel>("/catalog/grade-levels/", data)
  return res.data
}

export async function updateGradeLevel(
  id: number,
  data: Partial<{ name: string; kind: string; order: number | null; is_active: boolean }>
) {
  const res = await apiClient.patch<GradeLevel>(`/catalog/grade-levels/${id}/`, data)
  return res.data
}

export async function deleteGradeLevel(id: number) {
  await apiClient.delete(`/catalog/grade-levels/${id}/`)
}

export async function reorderGradeLevels(ids: number[]) {
  await apiClient.post("/catalog/grade-levels/reorder/", { ids })
}

export async function bulkDeleteGradeLevels(
  ids: number[]
): Promise<{ deleted_count: number }> {
  const res = await apiClient.post<{ deleted_count: number }>(
    "/catalog/grade-levels/bulk-delete/",
    { ids }
  )
  return res.data
}

// --- Subject ---
export async function listSubjects(params?: { search?: string; ordering?: string }): Promise<Subject[]> {
  const res = await apiClient.get<Subject[]>("/catalog/subjects/", { params })
  return res.data
}

export async function createSubject(data: { label: string; order?: number | null; is_active?: boolean }) {
  const res = await apiClient.post<Subject>("/catalog/subjects/", data)
  return res.data
}

export async function updateSubject(
  id: number,
  data: Partial<{ label: string; order: number | null; is_active: boolean }>
) {
  const res = await apiClient.patch<Subject>(`/catalog/subjects/${id}/`, data)
  return res.data
}

export async function deleteSubject(id: number) {
  await apiClient.delete(`/catalog/subjects/${id}/`)
}

export async function reorderSubjects(ids: number[]) {
  await apiClient.post("/catalog/subjects/reorder/", { ids })
}

export async function bulkDeleteSubjects(
  ids: number[]
): Promise<{ deleted_count: number }> {
  const res = await apiClient.post<{ deleted_count: number }>(
    "/catalog/subjects/bulk-delete/",
    { ids }
  )
  return res.data
}

// --- LessonCategory ---
export async function listLessonCategories(
  gradeLevelId: number,
  params?: { search?: string }
): Promise<LessonCategory[]> {
  const res = await apiClient.get<LessonCategory[]>("/catalog/lesson-categories/", {
    params: { grade_level: gradeLevelId, ...params },
  })
  return res.data
}

export async function bulkCreateLessonCategories(data: {
  grade_level: number
  names: string[]
  is_active?: boolean
  skip_existing?: boolean
}): Promise<{
  created_count: number
  skipped_count: number
  created: LessonCategory[]
  skipped: string[]
}> {
  const res = await apiClient.post("/catalog/lesson-categories/bulk/", data)
  return res.data
}

export async function createLessonCategory(data: {
  grade_level: number
  name: string
  is_active?: boolean
}) {
  const res = await apiClient.post<LessonCategory>("/catalog/lesson-categories/", data)
  return res.data
}

export async function updateLessonCategory(
  id: number,
  data: Partial<{ grade_level: number; name: string; is_active: boolean }>
) {
  const res = await apiClient.patch<LessonCategory>(`/catalog/lesson-categories/${id}/`, data)
  return res.data
}

export async function deleteLessonCategory(id: number) {
  await apiClient.delete(`/catalog/lesson-categories/${id}/`)
}

export async function reorderLessonCategories(ids: number[]) {
  await apiClient.post("/catalog/lesson-categories/reorder/", { ids })
}

export async function bulkDeleteLessonCategories(
  ids: number[]
): Promise<{ deleted_count: number }> {
  const res = await apiClient.post<{ deleted_count: number }>(
    "/catalog/lesson-categories/bulk-delete/",
    { ids }
  )
  return res.data
}

// --- Unit ---
export async function listUnits(lessonCategoryId?: number): Promise<Unit[]> {
  const res = await apiClient.get<Unit[]>("/catalog/units/", {
    params: lessonCategoryId ? { lesson_category_id: lessonCategoryId } : undefined,
  })
  return res.data
}

export async function createUnit(data: {
  lesson_category: number
  name: string
  order?: number | null
  is_active?: boolean
}) {
  const res = await apiClient.post<Unit>("/catalog/units/", data)
  return res.data
}

export async function updateUnit(
  id: number,
  data: Partial<{ lesson_category: number; name: string; order: number | null; is_active: boolean }>
) {
  const res = await apiClient.patch<Unit>(`/catalog/units/${id}/`, data)
  return res.data
}

export async function deleteUnit(id: number) {
  await apiClient.delete(`/catalog/units/${id}/`)
}

export async function reorderUnits(lessonCategoryId: number, ids: number[]) {
  await apiClient.post("/catalog/units/reorder/", {
    lesson_category: lessonCategoryId,
    ids,
  })
}

export async function bulkDeleteUnits(
  ids: number[]
): Promise<{ deleted_count: number }> {
  const res = await apiClient.post<{ deleted_count: number }>(
    "/catalog/units/bulk-delete/",
    { ids }
  )
  return res.data
}

export async function bulkCreateUnits(data: {
  lesson_category: number
  names: string[]
  is_active?: boolean
  skip_existing?: boolean
}): Promise<{ created_count: number; skipped_count: number }> {
  const res = await apiClient.post<{
    created_count: number
    skipped_count: number
    created: Unit[]
    skipped: string[]
  }>("/catalog/units/bulk/", data)
  return {
    created_count: res.data.created_count,
    skipped_count: res.data.skipped_count,
  }
}

// --- Topic ---
export async function listTopics(params?: {
  unit_id?: number | null
  lesson_category_id?: number
  unit__isnull?: boolean
}): Promise<Topic[]> {
  const p: Record<string, string | number | boolean> = {}
  if (params?.lesson_category_id != null) p.lesson_category_id = params.lesson_category_id
  if (params?.unit_id != null) p.unit_id = params.unit_id
  else if (params?.unit__isnull) p.unit__isnull = "true"
  const res = await apiClient.get<Topic[]>("/catalog/topics/", { params: p })
  return res.data
}

export async function createTopic(data: {
  lesson_category: number
  unit?: number | null
  name: string
  order?: number | null
  is_active?: boolean
}) {
  const res = await apiClient.post<Topic>("/catalog/topics/", data)
  return res.data
}

export async function updateTopic(
  id: number,
  data: Partial<{ lesson_category: number; unit: number | null; name: string; order: number | null; is_active: boolean }>
) {
  const res = await apiClient.patch<Topic>(`/catalog/topics/${id}/`, data)
  return res.data
}

export async function deleteTopic(id: number) {
  await apiClient.delete(`/catalog/topics/${id}/`)
}

export async function reorderTopics(
  lessonCategoryId: number,
  unitId: number | null,
  ids: number[]
) {
  await apiClient.post("/catalog/topics/reorder/", {
    lesson_category: lessonCategoryId,
    unit: unitId,
    ids,
  })
}

export async function bulkCreateTopics(data: {
  lesson_category: number
  unit?: number | null
  names: string[]
}): Promise<{ created: number }> {
  const res = await apiClient.post<{ created: number }>(
    "/catalog/topics/bulk/",
    data
  )
  return res.data
}

export async function bulkDeleteTopics(
  ids: number[]
): Promise<{ deleted_count: number }> {
  const res = await apiClient.post<{ deleted_count: number }>(
    "/catalog/topics/bulk-delete/",
    { ids }
  )
  return res.data
}
