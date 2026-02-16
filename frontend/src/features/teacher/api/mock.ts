// src/features/teacher/api/mock.ts
import type { Guardian, Lesson, LessonStatus, Student } from "../types"

const guardians: Guardian[] = [
  { id: "g1", fullName: "Ahmet Yılmaz", phone: "+90 532 111 2233", email: "ahmet.y@mail.com" },
  { id: "g2", fullName: "Ayşe Demir", phone: "+90 533 222 3344", email: "ayse.d@mail.com" },
  { id: "g3", fullName: "Mehmet Kaya", phone: "+90 534 333 4455" },
  { id: "g4", fullName: "Fatma Şahin", phone: "+90 535 444 5566", email: "fatma.s@mail.com" },
  { id: "g5", fullName: "Ali Özkan", email: "ali.o@mail.com" },
]

export const MOCK_STUDENTS: Student[] = [
  {
    id: "s1",
    fullName: "Elif Yılmaz",
    grade: "10",
    guardians: [guardians[0]],
  },
  {
    id: "s2",
    fullName: "Can Demir",
    grade: "11",
    guardians: [guardians[1]],
  },
  {
    id: "s3",
    fullName: "Zeynep Kaya",
    grade: "9",
    guardians: [guardians[2], guardians[3]],
  },
  {
    id: "s4",
    fullName: "Burak Şahin",
    grade: "12",
    guardians: [guardians[3]],
  },
  {
    id: "s5",
    fullName: "Selin Özkan",
    grade: "10",
    guardians: [guardians[4]],
  },
]

function makeLesson(
  id: string,
  studentId: string,
  dateISO: string,
  status: LessonStatus,
  overrides?: Partial<Lesson>
): Lesson {
  return {
    id,
    studentId,
    dateISO,
    status,
    topic: "Matematik - Türev",
    homework: "Sayfa 45-48 alıştırmalar",
    notes: "Öğrenci iyi ilerliyor.",
    ...overrides,
  }
}

export const MOCK_LESSONS: Lesson[] = [
  // s1: DONE, DONE, MISSED
  makeLesson("l1", "s1", "2025-02-01T10:00:00Z", "DONE", {
    topic: "Türev - Temel Kurallar",
    homework: "Alıştırma seti 1",
    notes: "Konu kavrandı.",
  }),
  makeLesson("l2", "s1", "2025-02-08T10:00:00Z", "DONE", {
    topic: "Türev - Zincir Kuralı",
    homework: "Test 3",
    notes: "İyi geçti.",
  }),
  makeLesson("l3", "s1", "2025-02-15T10:00:00Z", "MISSED", { topic: undefined, homework: undefined, notes: undefined }),

  // s2: DONE, POSTPONED
  makeLesson("l4", "s2", "2025-02-02T14:00:00Z", "DONE", {
    topic: "İntegral - Belirsiz İntegral",
    homework: "Ödev 2",
  }),
  makeLesson("l5", "s2", "2025-02-16T14:00:00Z", "POSTPONED"),

  // s3: DONE, DONE, DONE
  makeLesson("l6", "s3", "2025-02-03T11:00:00Z", "DONE"),
  makeLesson("l7", "s3", "2025-02-10T11:00:00Z", "DONE"),
  makeLesson("l8", "s3", "2025-02-12T11:00:00Z", "DONE"),

  // s4: MISSED, POSTPONED
  makeLesson("l9", "s4", "2025-02-05T09:00:00Z", "MISSED"),
  makeLesson("l10", "s4", "2025-02-14T09:00:00Z", "POSTPONED", {
    topic: "Limit - Sonsuzda Limit",
    notes: "Ertelendi - öğrenci hasta.",
  }),

  // s5: DONE
  makeLesson("l11", "s5", "2025-02-06T15:00:00Z", "DONE", {
    topic: "Trigonometri - Ters Fonksiyonlar",
    homework: "Kitap bölüm 7",
    notes: "Zorlandı, tekrar önerildi.",
  }),
]
