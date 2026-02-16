// src/features/admin/assignments/types.ts
// UI types (camelCase). API returns snake_case - use mapApiToUi helpers.

export type Teacher = {
  id: number
  firstName: string
  lastName: string
  email: string
  branch: string
}

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

export type ListFilters = {
  search: string
  status: "all" | "ACTIVE" | "PASSIVE"
  grade: string
}
