export type Role = "ADMIN" | "TEACHER" | "STUDENT"

export type User = {
  id: string
  email: string
  role: Role
  isActive: boolean
  tempPassword?: string // MVP: teacher oluştururken veriyoruz
}

export type StudentProfile = {
  userId: string
  fullName: string
  grade: string
  targetExam: string
}

export type TeacherStudentAssignment = {
  id: string
  teacherId: string
  studentId: string
  status: "ACTIVE" | "REMOVED"
  removedByRole?: "TEACHER" | "ADMIN"
  removedAt?: string
}

const LS_KEY = "edumath_mock_db_v1"

type DB = {
  users: User[]
  studentProfiles: StudentProfile[]
  assignments: TeacherStudentAssignment[]
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function loadDB(): DB {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return JSON.parse(raw) as DB

  const seed: DB = {
    users: [],
    studentProfiles: [],
    assignments: [],
  }
  localStorage.setItem(LS_KEY, JSON.stringify(seed))
  return seed
}

function saveDB(db: DB) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

export const mockDB = {
  get() {
    return loadDB()
  },

  // Teacher creates a real student account + assigns to self
  createStudentAndAssign(params: {
    teacherId: string
    email: string
    tempPassword: string
    fullName: string
    grade: string
    targetExam: string
  }) {
    const db = loadDB()

    const existing = db.users.find((u) => u.email.toLowerCase() === params.email.toLowerCase())
    if (existing) {
      return { ok: false as const, error: "Bu e-posta zaten kayıtlı." }
    }

    const studentId = uid("stu")
    const user: User = {
      id: studentId,
      email: params.email,
      role: "STUDENT",
      isActive: true,
      tempPassword: params.tempPassword,
    }
    db.users.push(user)

    db.studentProfiles.push({
      userId: studentId,
      fullName: params.fullName,
      grade: params.grade,
      targetExam: params.targetExam,
    })

    db.assignments.push({
      id: uid("as"),
      teacherId: params.teacherId,
      studentId,
      status: "ACTIVE",
    })

    saveDB(db)
    return { ok: true as const, studentId }
  },

  // Teacher removes from own list (unassign)
  removeAssignment(params: { teacherId: string; studentId: string; by: "TEACHER" | "ADMIN" }) {
    const db = loadDB()
    const a = db.assignments.find(
      (x) => x.teacherId === params.teacherId && x.studentId === params.studentId && x.status === "ACTIVE"
    )
    if (!a) return { ok: false as const, error: "Atama bulunamadı." }

    a.status = "REMOVED"
    a.removedByRole = params.by
    a.removedAt = new Date().toISOString()
    saveDB(db)
    return { ok: true as const }
  },

  // Admin assigns existing student to a teacher
  assignExistingStudent(params: { teacherId: string; studentId: string }) {
    const db = loadDB()
    const u = db.users.find((x) => x.id === params.studentId && x.role === "STUDENT")
    if (!u) return { ok: false as const, error: "Öğrenci bulunamadı." }

    db.assignments.push({
      id: uid("as"),
      teacherId: params.teacherId,
      studentId: params.studentId,
      status: "ACTIVE",
    })
    saveDB(db)
    return { ok: true as const }
  },

  // Admin deactivates account
  deactivateUser(userId: string) {
    const db = loadDB()
    const u = db.users.find((x) => x.id === userId)
    if (!u) return { ok: false as const, error: "Kullanıcı bulunamadı." }
    u.isActive = false
    saveDB(db)
    return { ok: true as const }
  },

  // Queries
  getTeacherStudents(teacherId: string) {
    const db = loadDB()
    const studentIds = db.assignments
      .filter((a) => a.teacherId === teacherId && a.status === "ACTIVE")
      .map((a) => a.studentId)

    const students = studentIds
      .map((id) => {
        const user = db.users.find((u) => u.id === id)
        const profile = db.studentProfiles.find((p) => p.userId === id)
        if (!user || !profile) return null
        return { user, profile }
      })
      .filter(Boolean)

    return students as Array<{ user: User; profile: StudentProfile }>
  },
}
