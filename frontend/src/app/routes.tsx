// src/app/routes.tsx
import { createBrowserRouter, Navigate } from "react-router-dom"
import { AppShell } from "./layout/app-shell"

import { UsersPage } from "../features/users/ui/users-page"
import { BillingPage } from "../features/billing/ui/billing-page"

import { AuthLayout } from "./layout/auth/auth-layout"
import { LoginPage } from "../features/auth/pages/login-page"
import { RegisterPage } from "../features/auth/pages/register-page"
import { ForgotPasswordPage } from "../features/auth/pages/forgot-password-page"

import { PublicOnlyRoute } from "./routes/public-only-route"
import { ProtectedRoute } from "./routes/protected-route"

import { KvkkPage } from "../features/legal/pages/kvkk-page"
import { AdminRoute } from "./routes/admin-route"
import { ChangePasswordPage } from "../features/auth/pages/change-password-page"
import { ForceChangePasswordPage } from "../features/auth/pages/force-change-password-page"
import { TeacherStudentAssignmentPage } from "../features/admin/assignments/pages/teacher-student-assignment-page"
import { AdminDashboardPage } from "../features/dashboard/pages/admin-dashboard-page"
import { ResetPasswordPage } from "../features/auth/pages/reset-password-page"

import { RoleLanding } from "./routes/role-landing"
import { RoleGuard } from "./routes/role-guard"
import { TeacherRoute } from "../features/teacher/routes/teacher-route"
import { TeacherProfileGuard } from "./routes/teacher-profile-guard"
import { TeacherProfileSetupPage } from "../features/teacher/pages/teacher-profile-setup-page"
import { teacherRouteChildren } from "../features/teacher/routes/teacher-routes"
import { StudentProfileGuard } from "./routes/student-profile-guard"
import { StudentProfileSetupPage } from "../features/student/pages/student-profile-setup-page"
import { ProfilePage } from "../features/profile/pages/profile-page"
import { RoleDashboardPage } from "../features/dashboard/pages/role-dashboard-page"
import { SubjectsPage } from "../features/admin/pages/subjects-page"
import { GradeLevelsPage } from "../features/admin/pages/grade-levels-page"
import { LessonCategoriesPage } from "../features/admin/pages/lesson-categories-page"
import { UnitsPage } from "../features/admin/pages/units-page"
import { TopicsPage } from "../features/admin/pages/topics-page"
import { UserDetailsPage } from "../features/admin/pages/users/user-details-page"


function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg">This page is coming soon.</p>
        <p className="mt-2 text-sm">The {title.toLowerCase()} feature is under development.</p>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
            children: [
              { path: "/force-change-password", element: <ForceChangePasswordPage /> },
              { path: "/change-password", element: <ChangePasswordPage /> },
          // ✅ role bazlı landing
          { path: "/", element: <RoleLanding /> },
          // /dashboard sabit bir sayfa olmalı; RoleLanding'e bağlanırsa aynı path'e redirect döngüsü oluşabilir (özellikle PARENT rolünde)
          { path: "/dashboard", element: <RoleDashboardPage title="Dashboard" /> },

          // ✅ role bazlı alanlar
          {
            path: "/teacher",
            element: <TeacherRoute />,
            children: [
              {
                element: <TeacherProfileGuard />,
                children: [
                  { index: true, element: <Navigate to="dashboard" replace /> },
                  { path: "dashboard", element: <RoleDashboardPage title="Teacher Dashboard" /> },
                  { path: "profile-setup", element: <TeacherProfileSetupPage /> },
                  ...teacherRouteChildren,
                  { path: "topics", element: <PlaceholderPage title="Ders Konu Yönetimi" /> },
                  { path: "progress", element: <PlaceholderPage title="Konu İlerlemesi" /> },
                  { path: "plan", element: <PlaceholderPage title="Çalışma Programı" /> },
                  { path: "questions", element: <PlaceholderPage title="Soru Takibi" /> },
                  { path: "attendance", element: <PlaceholderPage title="Ayak İzi" /> },
                  { path: "mock-exams", element: <PlaceholderPage title="Deneme Takibi" /> },
                  { path: "evaluation", element: <PlaceholderPage title="Öğrenci Değerlendirme" /> },
                  { path: "calendar", element: <PlaceholderPage title="Ajanda" /> },
                  { path: "videos", element: <PlaceholderPage title="Video Yönetimi" /> },
                  { path: "pomodoro", element: <PlaceholderPage title="Pomodoro Takibi" /> },
                  { path: "books", element: <PlaceholderPage title="Yazar Eser Takibi" /> },
                  { path: "tests", element: <PlaceholderPage title="Test Oluşturma" /> },
                  { path: "library", element: <PlaceholderPage title="Kütüphane" /> },
                  { path: "messages", element: <PlaceholderPage title="Mesajlar" /> },
                ],
              },
            ],
          },

          {
            path: "/student",
            element: <RoleGuard allow={["STUDENT"]} />,
            children: [
              {
                element: <StudentProfileGuard />,
                children: [
                  { index: true, element: <Navigate to="dashboard" replace /> },
                  { path: "dashboard", element: <RoleDashboardPage title="Student Dashboard" /> },
                  { path: "profile-setup", element: <StudentProfileSetupPage /> },
                ],
              },
            ],
          },


          // Mevcut admin-template sayfaları (istersen bunları sadece admin’e kısıtlarız)
          { path: "/profile", element: <ProfilePage /> },
          { path: "/preferences", element: <PlaceholderPage title="Preferences" /> },

          // ✅ Admin panel: /panel prefix (Django /admin ile çakışma yok)
          {
            path: "/panel",
            element: <AdminRoute />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "users", element: <UsersPage /> },
              { path: "users/:id", element: <UserDetailsPage /> },
              { path: "assignments/teacher-students", element: <TeacherStudentAssignmentPage /> },
              { path: "params/grade-levels", element: <GradeLevelsPage /> },
              { path: "params/subjects", element: <SubjectsPage /> },
              { path: "params/lesson-categories", element: <LessonCategoriesPage /> },
              { path: "params/units", element: <UnitsPage /> },
              { path: "params/topics", element: <TopicsPage /> },
            ],
          },

          { path: "/billing", element: <BillingPage /> },
          { path: "/roles", element: <PlaceholderPage title="Roles" /> },
          { path: "/permissions", element: <PlaceholderPage title="Permissions" /> },
          { path: "/reports", element: <PlaceholderPage title="Reports" /> },
          { path: "/events", element: <PlaceholderPage title="Events" /> },

        ],
      },
    ],
  },

  // Public KVKK
  { path: "/kvkk", element: <KvkkPage /> },

  // Auth pages (public-only)
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "forgot", element: <ForgotPasswordPage /> },
          { index: true, element: <Navigate to="login" replace /> },
        ],
      },
      // Reset password (backend link: /reset-password?uid=...&token=...)
      {
        path: "/reset-password",
        element: <AuthLayout />,
        children: [{ index: true, element: <ResetPasswordPage /> }],
      },
    ],
  },

  // alias
  { path: "/login", element: <Navigate to="/auth/login" replace /> },

  // Top-level wildcard (auth/public route'ları ProtectedRoute içinde yakalanmasın)
  { path: "*", element: <PlaceholderPage title="404 - Sayfa Bulunamadı" /> },
])
