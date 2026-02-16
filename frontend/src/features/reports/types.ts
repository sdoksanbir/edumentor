// Raporlama modülü tipleri

export type TeacherPerformanceItem = {
  teacher_profile_id: number
  teacher_user_id: number
  teacher_name: string
  branch_label: string | null
  students_count: number
  logins_count: number
  last_login_at: string | null
  must_change_password_count: number
}

export type StudentProgressItem = {
  student_profile_id: number
  student_user_id: number
  student_name: string
  teacher_name: string | null
  grade_label: string | null
  target_exam_label: string | null
  progress_percent: number | null
  last_login_at: string | null
  must_change_password: boolean
}

export type MostActiveTeacherItem = {
  teacher_profile_id: number
  teacher_name: string
  logins_count: number
  last_login_at: string | null
}

export type MostUsedCourseItem = {
  course_id: number
  course_label: string
  subject_label: string | null
  topics_count: number
  related_teachers_count: number
  is_proxy_metric: boolean
}

export type DailyLoginItem = {
  date: string
  logins: number
  unique_users: number
}

export type LoginLogItem = {
  id: number
  created_at: string
  event_type: string
  user: { id: number; email: string; name: string; role?: string } | null
  ip_address: string | null
  user_agent: string | null
  meta: Record<string, unknown> | null
}

export type DateRangePreset = "7" | "30" | "90" | "custom"

export type RiskyTeacherItem = {
  teacher_profile_id: number
  teacher_user_id: number
  teacher_name: string
  branch_label: string | null
  students_count: number
  inactive_students_count: number
  inactive_students_ratio: number
  must_change_password_count: number
  must_change_password_ratio: number
  teacher_logins_last_14_days: number
  risk_score: number
}

export type InactiveStudentItem = {
  student_profile_id: number
  student_user_id: number
  student_name: string
  teacher_name: string | null
  last_login_at: string | null
  days_inactive: number
  must_change_password: boolean
}
