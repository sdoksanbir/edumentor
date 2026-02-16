/**
 * Returns the assigned teacher ID (TeacherProfile.id) for a student.
 * Supports multiple possible field names from backend.
 */
export function getAssignedTeacherId(student: {
  coach_id?: number | null
  teacher_id?: number | null
  assigned_teacher_id?: number | null
  coach?: { id?: number } | null
  teacher?: { id?: number } | null
}): number | null {
  const id =
    student.assigned_teacher_id ??
    student.teacher_id ??
    student.coach_id ??
    student.teacher?.id ??
    student.coach?.id ??
    null
  return id != null && typeof id === "number" ? id : null
}
