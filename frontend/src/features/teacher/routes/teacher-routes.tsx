// src/features/teacher/routes/teacher-routes.tsx
import type { RouteObject } from "react-router-dom"
import { TeacherStudentsPage } from "../students/pages/teacher-students-page"
import { TeacherStudentDetailPage } from "../pages/teacher-student-detail-page"

export const teacherRouteChildren: RouteObject[] = [
  { path: "students", element: <TeacherStudentsPage /> },
  { path: "students/:id", element: <TeacherStudentDetailPage /> },
]
