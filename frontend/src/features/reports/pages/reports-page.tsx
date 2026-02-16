import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@shared/ui/button"
import { Switch } from "@shared/ui/switch"
import { RefreshCw } from "lucide-react"
import { ReportFilters } from "../components/ReportFilters"
import { TeacherPerformanceTable } from "../components/tables/TeacherPerformanceTable"
import { StudentProgressTable } from "../components/tables/StudentProgressTable"
import { LoginLogsTable } from "../components/tables/LoginLogsTable"
import { RiskyTeachersTable } from "../components/tables/RiskyTeachersTable"
import { InactiveStudentsTable } from "../components/tables/InactiveStudentsTable"
import { DailyLoginsChart } from "../components/charts/DailyLoginsChart"
import { MostActiveTeachersChart } from "../components/charts/MostActiveTeachersChart"
import { MostUsedCoursesChart } from "../components/charts/MostUsedCoursesChart"
import {
  fetchTeacherPerformance,
  fetchStudentProgress,
  fetchMostActiveTeachers,
  fetchMostUsedCourses,
  fetchDailyLogins,
  fetchLoginLogs,
  fetchRiskyTeachers,
  fetchInactiveStudents,
  reportsKeys,
} from "../api/reportsApi"
import { fetchTeachers } from "@features/admin/assignments/api"
import type { DateRangePreset } from "../types"

type TabId =
  | "teacher-performance"
  | "student-progress"
  | "most-active-teachers"
  | "most-used-courses"
  | "daily-logins"
  | "login-logs"
  | "alerts"

const TABS: { id: TabId; label: string }[] = [
  { id: "teacher-performance", label: "Öğretmen Performansı" },
  { id: "student-progress", label: "Öğrenci İlerlemesi" },
  { id: "most-active-teachers", label: "En Aktif Öğretmenler" },
  { id: "most-used-courses", label: "Kurs Kullanımı" },
  { id: "daily-logins", label: "Günlük Girişler" },
  { id: "login-logs", label: "Login Logları" },
  { id: "alerts", label: "Uyarılar" },
]

function getDateRange(preset: DateRangePreset): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  let from: string
  if (preset === "7") {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    from = d.toISOString().slice(0, 10)
  } else if (preset === "30") {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    from = d.toISOString().slice(0, 10)
  } else if (preset === "90") {
    const d = new Date(now)
    d.setDate(d.getDate() - 90)
    from = d.toISOString().slice(0, 10)
  } else {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    from = d.toISOString().slice(0, 10)
  }
  return { from, to }
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("teacher-performance")
  const [preset, setPreset] = useState<DateRangePreset>("30")
  const [dateFrom, setDateFrom] = useState(() => {
    const { from } = getDateRange("30")
    return from
  })
  const [dateTo, setDateTo] = useState(() => {
    const { to } = getDateRange("30")
    return to
  })
  const [search, setSearch] = useState("")
  const [teacherProfileId, setTeacherProfileId] = useState<string>("")
  const [loginLogsPage, setLoginLogsPage] = useState(1)
  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [loginLogsLive, setLoginLogsLive] = useState(false)
  const [inactiveDays, setInactiveDays] = useState(14)
  const [inactivePage, setInactivePage] = useState(1)

  const params = useMemo(
    () => ({
      date_from: `${dateFrom}T00:00:00`,
      date_to: `${dateTo}T23:59:59`,
      search: search || undefined,
      teacher_profile_id: teacherProfileId ? Number(teacherProfileId) : undefined,
      page: loginLogsPage,
      page_size: 20,
      event_type: eventTypeFilter || undefined,
    }),
    [dateFrom, dateTo, search, teacherProfileId, loginLogsPage, eventTypeFilter]
  )

  const handlePresetChange = (p: DateRangePreset) => {
    setPreset(p)
    const { from, to } = getDateRange(p)
    setDateFrom(from)
    setDateTo(to)
  }

  const teacherPerf = useQuery({
    queryKey: reportsKeys.teacherPerformance(params),
    queryFn: () => fetchTeacherPerformance(params),
    enabled: activeTab === "teacher-performance",
  })

  const teachersQuery = useQuery({
    queryKey: ["admin", "reports", "teachers"],
    queryFn: () => fetchTeachers(),
    enabled: activeTab === "student-progress" || activeTab === "alerts",
  })

  const studentProgress = useQuery({
    queryKey: reportsKeys.studentProgress(params),
    queryFn: () => fetchStudentProgress(params),
    enabled: activeTab === "student-progress",
  })

  const mostActive = useQuery({
    queryKey: reportsKeys.mostActiveTeachers(params),
    queryFn: () => fetchMostActiveTeachers({ ...params, limit: 10 }),
    enabled: activeTab === "most-active-teachers",
  })

  const mostUsed = useQuery({
    queryKey: reportsKeys.mostUsedCourses(params),
    queryFn: () => fetchMostUsedCourses({ ...params, limit: 10 }),
    enabled: activeTab === "most-used-courses",
  })

  const dailyLogins = useQuery({
    queryKey: reportsKeys.dailyLogins(params),
    queryFn: () => fetchDailyLogins(params),
    enabled: activeTab === "daily-logins",
  })

  const loginLogs = useQuery({
    queryKey: reportsKeys.loginLogs(params),
    queryFn: () => fetchLoginLogs(params),
    enabled: activeTab === "login-logs",
    refetchInterval: activeTab === "login-logs" && loginLogsLive ? 30_000 : false,
  })

  const riskyTeachersParams = useMemo(
    () => ({
      date_from: `${dateFrom}T00:00:00`,
      date_to: `${dateTo}T23:59:59`,
      limit: 20,
    }),
    [dateFrom, dateTo]
  )

  const inactiveStudentsParams = useMemo(
    () => ({
      days: inactiveDays,
      teacher_profile_id: teacherProfileId ? Number(teacherProfileId) : undefined,
      search: search || undefined,
      page: inactivePage,
      page_size: 20,
    }),
    [inactiveDays, teacherProfileId, search, inactivePage]
  )

  const riskyTeachers = useQuery({
    queryKey: reportsKeys.riskyTeachers(riskyTeachersParams),
    queryFn: () => fetchRiskyTeachers(riskyTeachersParams),
    enabled: activeTab === "alerts",
  })

  const inactiveStudents = useQuery({
    queryKey: reportsKeys.inactiveStudents(inactiveStudentsParams),
    queryFn: () => fetchInactiveStudents(inactiveStudentsParams),
    enabled: activeTab === "alerts",
  })

  const handleExportTeacherCsv = () => {
    const data = teacherPerf.data?.results ?? []
    if (data.length === 0) return
    const headers = ["Öğretmen", "Branş", "Öğrenci", "Şifre Değiştir", "Giriş", "Son Giriş"]
    const rows = data.map((r) =>
      [r.teacher_name, r.branch_label ?? "", r.students_count, r.must_change_password_count, r.logins_count, r.last_login_at ?? ""].join(";")
    )
    const csv = [headers.join(";"), ...rows].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-teacher-performance-${dateFrom}-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportLoginLogsCsv = () => {
    const items = loginLogs.data?.items ?? []
    if (items.length === 0) return
    const headers = ["Tarih", "Olay", "Kullanıcı", "Email", "IP", "User Agent"]
    const rows = items.map((r) => {
      const email = r.user?.email ?? (r.meta as { email?: string })?.email ?? ""
      const name = r.user?.name ?? ""
      return [r.created_at, r.event_type, name, email, r.ip_address ?? "", r.user_agent ?? ""].join(";")
    })
    const csv = [headers.join(";"), ...rows].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-login-logs-${dateFrom}-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeQuery = {
    "teacher-performance": teacherPerf,
    "student-progress": studentProgress,
    "most-active-teachers": mostActive,
    "most-used-courses": mostUsed,
    "daily-logins": dailyLogins,
    "login-logs": loginLogs,
    "alerts": riskyTeachers,
  }[activeTab]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Raporlar & Analitik</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Öğretmen, öğrenci ve sistem analitiği.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => activeQuery.refetch()}
          disabled={activeQuery.isRefetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${activeQuery.isRefetching ? "animate-spin" : ""}`}
          />
          Yenile
        </Button>
      </div>

      {activeQuery.isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-destructive">
              {(activeQuery.error as { response?: { status?: number } })?.response?.status === 403
                ? "Bu raporlara erişim yetkiniz yok (403). Lütfen Admin hesabıyla giriş yapın."
                : "Veriler yüklenirken bir hata oluştu."}
            </p>
            {(activeQuery.error as { response?: { status?: number } })?.response?.status === 403 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Çıkış yapıp Admin (veya is_staff) rolüne sahip bir hesapla tekrar giriş yapın.
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => activeQuery.refetch()}>
            Tekrar Dene
          </Button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <ReportFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          preset={preset}
          onPresetChange={handlePresetChange}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="İsim veya e-posta..."
          showSearch={
            activeTab === "student-progress" || activeTab === "login-logs" || activeTab === "alerts"
          }
          onExportCsv={
            activeTab === "teacher-performance"
              ? handleExportTeacherCsv
              : activeTab === "login-logs"
                ? handleExportLoginLogsCsv
                : undefined
          }
          exportLoading={false}
        />
        {activeTab === "student-progress" && (
          <div className="mt-3 flex gap-2">
            <select
              value={teacherProfileId}
              onChange={(e) => {
                setTeacherProfileId(e.target.value)
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Tüm öğretmenler</option>
              {(teachersQuery.data ?? []).map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.first_name || t.last_name ? `${t.first_name} ${t.last_name}`.trim() : t.email}
                </option>
              ))}
            </select>
          </div>
        )}
        {activeTab === "alerts" && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">Pasif öğrenci günü:</span>
            <select
              value={inactiveDays}
              onChange={(e) => {
                setInactiveDays(Number(e.target.value))
                setInactivePage(1)
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={7}>7 gün</option>
              <option value={14}>14 gün</option>
              <option value={30}>30 gün</option>
            </select>
            <select
              value={teacherProfileId}
              onChange={(e) => {
                setTeacherProfileId(e.target.value)
                setInactivePage(1)
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Tüm öğretmenler</option>
              {(teachersQuery.data ?? []).map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.first_name || t.last_name ? `${t.first_name} ${t.last_name}`.trim() : t.email}
                </option>
              ))}
            </select>
          </div>
        )}
        {activeTab === "login-logs" && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value)
                setLoginLogsPage(1)
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Tüm olaylar</option>
              <option value="LOGIN_SUCCESS">Başarılı Giriş</option>
              <option value="LOGIN_FAIL">Başarısız Giriş</option>
              <option value="LOGOUT">Çıkış</option>
              <option value="REFRESH">Token Yenileme</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={loginLogsLive}
                onCheckedChange={setLoginLogsLive}
              />
              <span>Canlı (30 sn)</span>
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-border bg-card p-4">
        {activeTab === "teacher-performance" && (
          <TeacherPerformanceTable
            data={teacherPerf.data?.results ?? []}
            isLoading={teacherPerf.isLoading}
          />
        )}
        {activeTab === "student-progress" && (
          <StudentProgressTable
            data={studentProgress.data?.results ?? []}
            isLoading={studentProgress.isLoading}
          />
        )}
        {activeTab === "most-active-teachers" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <MostActiveTeachersChart
              data={mostActive.data?.results ?? []}
              isLoading={mostActive.isLoading}
            />
            <div className="rounded border border-border p-4">
              <h4 className="mb-3 text-sm font-medium">Tablo</h4>
              <div className="space-y-2">
                {(mostActive.data?.results ?? []).map((r, i) => (
                  <div
                    key={r.teacher_profile_id}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {i + 1}. {r.teacher_name}
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("tr-TR").format(r.logins_count)} giriş
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "most-used-courses" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <MostUsedCoursesChart
              data={mostUsed.data?.results ?? []}
              isLoading={mostUsed.isLoading}
            />
            <div className="rounded border border-border p-4">
              <h4 className="mb-3 text-sm font-medium">Tablo (proxy metrik)</h4>
              <div className="space-y-2">
                {(mostUsed.data?.results ?? []).map((r, i) => (
                  <div key={r.course_id} className="flex justify-between text-sm">
                    <span>
                      {i + 1}. {r.course_label}
                      {r.subject_label && (
                        <span className="ml-1 text-muted-foreground">
                          ({r.subject_label})
                        </span>
                      )}
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("tr-TR").format(r.topics_count)} konu
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "daily-logins" && (
          <DailyLoginsChart
            data={dailyLogins.data?.results ?? []}
            isLoading={dailyLogins.isLoading}
          />
        )}
        {activeTab === "alerts" && (
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-sm font-semibold">Riskli Öğretmenler</h3>
              <RiskyTeachersTable
                data={riskyTeachers.data?.results ?? []}
                isLoading={riskyTeachers.isLoading}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Pasif Öğrenci Alarmları</h3>
              <InactiveStudentsTable
                data={inactiveStudents.data?.items ?? []}
                isLoading={inactiveStudents.isLoading}
                page={inactiveStudents.data?.page ?? 1}
                total={inactiveStudents.data?.total ?? 0}
                pageSize={inactiveStudents.data?.page_size ?? 20}
                onPageChange={setInactivePage}
              />
            </div>
          </div>
        )}
        {activeTab === "login-logs" && (
          <LoginLogsTable
            data={loginLogs.data?.items ?? []}
            isLoading={loginLogs.isLoading}
            page={loginLogs.data?.page ?? 1}
            total={loginLogs.data?.total ?? 0}
            pageSize={loginLogs.data?.page_size ?? 20}
            onPageChange={setLoginLogsPage}
          />
        )}
      </div>
    </div>
  )
}
