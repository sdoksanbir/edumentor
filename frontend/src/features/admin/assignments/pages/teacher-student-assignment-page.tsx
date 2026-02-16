// src/features/admin/assignments/pages/teacher-student-assignment-page.tsx
import { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Card, CardContent } from "@shared/ui/card"
import { TeacherPicker } from "../components/teacher-picker"
import { StudentsDualList } from "../components/students-dual-list"
import { AssignmentSkeleton } from "../components/assignment-skeleton"
import { EmptyState } from "../components/empty-state"
import {
  fetchTeachers,
  fetchAllStudentsFromUsers,
  assignStudents,
  unassignStudents,
  mapTeacherApiToUi,
  mapStudentApiToUi,
} from "../api"
import { getTeacherSubscription, billingKeys } from "@features/billing/api/billingApi"
import { getAssignedTeacherId } from "../get-assigned-teacher-id"
import { confirmUnassign } from "@shared/lib/confirm-unassign"
import { getErrorMessage, getStudentLimitError } from "@shared/lib/toast-messages"
import { studentLimitReachedAlert } from "@shared/lib/swal"
import { listGradeLevels, catalogKeys } from "@features/admin/api/admin-api"
import type { Teacher, Student, ListFilters } from "../types"

const DEFAULT_FILTERS: ListFilters = {
  search: "",
  status: "all",
  grade: "all",
}

export function TeacherStudentAssignmentPage() {
  const navigate = useNavigate()
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedAvailable, setSelectedAvailable] = useState<Set<number>>(new Set())
  const [selectedAssigned, setSelectedAssigned] = useState<Set<number>>(new Set())
  const [availableFilters, setAvailableFilters] = useState<ListFilters>(DEFAULT_FILTERS)
  const [assignedFilters, setAssignedFilters] = useState<ListFilters>(DEFAULT_FILTERS)
  const [assigning, setAssigning] = useState(false)
  const [unassigning, setUnassigning] = useState(false)

  const { data: gradeLevels = [] } = useQuery({
    queryKey: catalogKeys.gradeLevels("CLASS_EXAM"),
    queryFn: () => listGradeLevels(),
  })

  const { data: subscriptionInfo } = useQuery({
    queryKey: billingKeys.teacherSubscription(selectedTeacher?.id ?? 0),
    queryFn: () => getTeacherSubscription(selectedTeacher!.id),
    enabled: !!selectedTeacher?.id,
  })
  const gradeLevelOptions = gradeLevels
    .filter((g) => g.kind === "CLASS" || g.kind === "EXAM")
    .filter((gl) => gl.is_active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((gl) => ({ id: gl.id, name: gl.name }))

  const handleTeacherSelect = useCallback((teacher: Teacher | null) => {
    setSelectedTeacher(teacher)
    setSelectedAvailable(new Set())
    setSelectedAssigned(new Set())
  }, [])

  useEffect(() => {
    let cancelled = false
    setTeachersLoading(true)
    fetchTeachers()
      .then((data) => {
        if (!cancelled) setTeachers(data.map(mapTeacherApiToUi))
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setTeachersLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedTeacher) {
      setAssignedStudents([])
      setAvailableStudents([])
      return
    }
    let cancelled = false
    fetchAllStudentsFromUsers()
      .then((allStudents) => {
        if (!cancelled) {
          const selectedTeacherId = selectedTeacher.id
          const assigned = allStudents.filter(
            (s) => getAssignedTeacherId(s) === selectedTeacherId
          )
          const available = allStudents.filter(
            (s) => getAssignedTeacherId(s) == null
          )
          setAssignedStudents(assigned.map(mapStudentApiToUi))
          setAvailableStudents(available.map(mapStudentApiToUi))
        }
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err))
      })
    return () => { cancelled = true }
  }, [selectedTeacher?.id])

  const handleAssign = async () => {
    if (!selectedTeacher || selectedAvailable.size === 0) return
    setAssigning(true)
    try {
      await assignStudents(selectedTeacher.id, Array.from(selectedAvailable))
      const allStudents = await fetchAllStudentsFromUsers()
      const assigned = allStudents.filter(
        (s) => getAssignedTeacherId(s) === selectedTeacher.id
      )
      const available = allStudents.filter(
        (s) => getAssignedTeacherId(s) == null
      )
      setAssignedStudents(assigned.map(mapStudentApiToUi))
      setAvailableStudents(available.map(mapStudentApiToUi))
      setSelectedAvailable(new Set())
      toast.success(`${selectedAvailable.size} öğrenci atandı`)
    } catch (err) {
      const limitErr = getStudentLimitError(err)
      if (limitErr.isLimitReached) {
        await studentLimitReachedAlert({
          limit: limitErr.limit ?? 0,
          current: limitErr.current ?? 0,
          onViewPlans: () => navigate("/panel/billing/subscriptions"),
        })
      } else if (limitErr.isNoSubscription) {
        toast.error(limitErr.message ?? "Öğretmenin aktif aboneliği yok.")
      } else {
        toast.error(getErrorMessage(err))
      }
      if (/atanmış|already assigned|assigned/i.test(getErrorMessage(err))) {
        const allStudents = await fetchAllStudentsFromUsers()
        const assigned = allStudents.filter(
          (s) => getAssignedTeacherId(s) === selectedTeacher.id
        )
        const available = allStudents.filter(
          (s) => getAssignedTeacherId(s) == null
        )
        setAssignedStudents(assigned.map(mapStudentApiToUi))
        setAvailableStudents(available.map(mapStudentApiToUi))
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async () => {
    if (!selectedTeacher || selectedAssigned.size === 0) return
    const ok = await confirmUnassign(selectedAssigned.size)
    if (!ok) return
    setUnassigning(true)
    try {
      await unassignStudents(selectedTeacher.id, Array.from(selectedAssigned))
      const allStudents = await fetchAllStudentsFromUsers()
      const assigned = allStudents.filter(
        (s) => getAssignedTeacherId(s) === selectedTeacher.id
      )
      const available = allStudents.filter(
        (s) => getAssignedTeacherId(s) == null
      )
      setAssignedStudents(assigned.map(mapStudentApiToUi))
      setAvailableStudents(available.map(mapStudentApiToUi))
      setSelectedAssigned(new Set())
      toast.success(`${selectedAssigned.size} öğrenci ataması kaldırıldı.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUnassigning(false)
    }
  }

  const toggleAvailable = (id: number) => {
    setSelectedAvailable((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAssigned = (id: number) => {
    setSelectedAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }


  if (teachersLoading) return <AssignmentSkeleton />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Öğretmene Öğrenci Atama</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Öğrencileri öğretmenlere kolayca bağla, toplu işlem yap.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <TeacherPicker
          teachers={teachers}
          selectedId={selectedTeacher?.id ?? null}
          onSelect={handleTeacherSelect}
          isLoading={teachersLoading}
        />
        {selectedTeacher && (
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Seçili öğretmen
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedTeacher.branch}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Atanan öğrenci
                </p>
                <p className="mt-1 text-2xl font-bold">{assignedStudents.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Uygun öğrenci
                </p>
                <p className="mt-1 text-2xl font-bold">{availableStudents.length}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!selectedTeacher ? (
        <EmptyState
          message="Atama yapmak için önce bir öğretmen seçin."
          compact={false}
        />
      ) : (
        <div className="space-y-4">
          {subscriptionInfo && subscriptionInfo.subscription && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                (subscriptionInfo.remaining_slots ?? 0) === 0
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-border bg-muted/30"
              }`}
            >
              <span className="font-medium">Kota:</span>{" "}
              {subscriptionInfo.limit} | Kullanılan: {subscriptionInfo.assigned_students_count} |
              Kalan: {subscriptionInfo.remaining_slots}
              {(subscriptionInfo.remaining_slots ?? 0) === 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  Öğrenci kotası doldu. Paketi yükseltin.
                </span>
              )}
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
          <StudentsDualList
            mode="available"
            students={availableStudents}
            filters={availableFilters}
            onFiltersChange={setAvailableFilters}
            selectedIds={selectedAvailable}
            onToggleSelection={toggleAvailable}
            onBulkAction={handleAssign}
            actionLabel="Seçilenleri Ata"
            actionVariant="primary"
            actionDisabled={
              selectedAvailable.size === 0 ||
              (subscriptionInfo != null &&
                (!subscriptionInfo.subscription ||
                  (subscriptionInfo.remaining_slots ?? 0) === 0))
            }
            actionLoading={assigning}
            actionTooltip={
              subscriptionInfo != null && !subscriptionInfo.subscription
                ? "Öğretmenin aboneliği yok. Önce abonelik atayın."
                : subscriptionInfo != null && (subscriptionInfo.remaining_slots ?? 0) === 0
                  ? "Öğrenci kotası doldu. Paketi yükseltin."
                  : undefined
            }
            emptyMessage="Bu öğretmene atanabilecek öğrenci yok veya arama sonucu boş."
            gradeLevels={gradeLevelOptions}
          />
          <StudentsDualList
            mode="assigned"
            students={assignedStudents}
            filters={assignedFilters}
            onFiltersChange={setAssignedFilters}
            selectedIds={selectedAssigned}
            onToggleSelection={toggleAssigned}
            onBulkAction={handleUnassign}
            actionLabel="Atamayı Kaldır"
            actionVariant="destructive"
            actionDisabled={selectedAssigned.size === 0}
            actionLoading={unassigning}
            emptyMessage="Bu öğretmene henüz öğrenci atanmamış."
            gradeLevels={gradeLevelOptions}
          />
          </div>
        </div>
      )}
    </div>
  )
}
