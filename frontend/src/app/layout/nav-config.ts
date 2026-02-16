import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  TrendingUp,
  CalendarDays,
  ClipboardList,
  Footprints,
  BarChart3,
  Star,
  NotebookPen,
  Video,
  Timer,
  PenTool,
  FileText,
  Library,
  MessageSquareText,
  Settings,
} from "lucide-react"

export type NavItem = {
  label: string
  to: string
  icon?: LucideIcon
  badge?: string
}

export type NavSection = {
  title?: string
  icon?: LucideIcon
  submenu?: boolean
  items: NavItem[]
}

export const NAV: NavSection[] = [
  {
    items: [{ label: "Ana Sayfa", to: "/dashboard", icon: LayoutDashboard }],
  },

  {
    title: "Öğrenci Yönetimi",
    icon: Users,
    submenu: true,
    items: [
      { label: "Öğrenciler", to: "/teacher/students", icon: Users },
      { label: "Öğrenci Ekle", to: "/teacher/students/new", icon: Users },
      { label: "Gruplar / Sınıflar", to: "/teacher/students/groups", icon: Users },
    ],
  },

  {
    title: "Ders Konu Yönetimi",
    icon: BookOpen,
    submenu: true,
    items: [
      { label: "Dersler", to: "/teacher/lessons", icon: BookOpen },
      { label: "Konular", to: "/teacher/topics", icon: BookOpen },
      { label: "Üniteler", to: "/teacher/units", icon: BookOpen },
    ],
  },

  {
    title: "Konu İlerlemesi",
    icon: TrendingUp,
    submenu: true,
    items: [
      { label: "Genel Görünüm", to: "/teacher/progress", icon: TrendingUp },
      { label: "Öğrenci Bazlı", to: "/teacher/progress/students", icon: TrendingUp },
      { label: "Konu Bazlı", to: "/teacher/progress/topics", icon: TrendingUp },
    ],
  },

  {
    title: "Çalışma Programı",
    icon: CalendarDays,
    submenu: true,
    items: [
      { label: "Haftalık Plan", to: "/teacher/study-plan/weekly", icon: CalendarDays },
      { label: "Aylık Plan", to: "/teacher/study-plan/monthly", icon: CalendarDays },
      { label: "Şablonlar", to: "/teacher/study-plan/templates", icon: CalendarDays },
    ],
  },

  {
    title: "Soru Takibi",
    icon: ClipboardList,
    submenu: true,
    items: [
      { label: "Kayıtlar", to: "/teacher/questions", icon: ClipboardList },
      { label: "Analiz", to: "/teacher/questions/analysis", icon: ClipboardList },
      { label: "Hedefler", to: "/teacher/questions/goals", icon: ClipboardList },
    ],
  },

  {
    title: "Ayak İzi",
    icon: Footprints,
    submenu: true,
    items: [
      { label: "Genel", to: "/teacher/footprint", icon: Footprints },
      { label: "Günlük", to: "/teacher/footprint/daily", icon: Footprints },
      { label: "Öğrenci Bazlı", to: "/teacher/footprint/students", icon: Footprints },
    ],
  },

  {
    title: "Deneme Takibi",
    icon: BarChart3,
    submenu: true,
    items: [
      { label: "Denemeler", to: "/teacher/mocks", icon: BarChart3 },
      { label: "Sonuçlar", to: "/teacher/mocks/results", icon: BarChart3 },
      { label: "Sıralama", to: "/teacher/mocks/rank", icon: BarChart3 },
    ],
  },

  {
    title: "Öğrenci Değerlendirme",
    icon: Star,
    submenu: true,
    items: [
      { label: "Notlar", to: "/teacher/evaluation/notes", icon: Star },
      { label: "Rubrik", to: "/teacher/evaluation/rubrics", icon: Star },
      { label: "Raporlar", to: "/teacher/evaluation/reports", icon: Star },
    ],
  },

  {
    title: "Ajanda",
    icon: NotebookPen,
    submenu: true,
    items: [
      { label: "Takvim", to: "/teacher/agenda", icon: NotebookPen },
      { label: "Görevler", to: "/teacher/agenda/tasks", icon: NotebookPen },
      { label: "Hatırlatmalar", to: "/teacher/agenda/reminders", icon: NotebookPen },
    ],
  },

  {
    title: "Video Yönetimi",
    icon: Video,
    submenu: true,
    items: [
      { label: "Videolar", to: "/teacher/videos", icon: Video },
      { label: "Listeler", to: "/teacher/videos/playlists", icon: Video },
      { label: "İlerleme", to: "/teacher/videos/progress", icon: Video },
    ],
  },

  {
    title: "Pomodoro Takibi",
    icon: Timer,
    submenu: true,
    items: [
      { label: "Pomodoro", to: "/teacher/pomodoro", icon: Timer },
      { label: "İstatistikler", to: "/teacher/pomodoro/stats", icon: Timer },
      { label: "Ayarlar", to: "/teacher/pomodoro/settings", icon: Timer },
    ],
  },

  {
    title: "Yazar Eser Takibi",
    icon: PenTool,
    submenu: true,
    items: [
      { label: "Yazarlar", to: "/teacher/authors", icon: PenTool },
      { label: "Eserler", to: "/teacher/works", icon: PenTool },
      { label: "Okuma Takibi", to: "/teacher/reading", icon: PenTool },
    ],
  },

  {
    title: "Test Oluşturma",
    icon: FileText,
    submenu: true,
    items: [
      { label: "Testler", to: "/teacher/tests", icon: FileText },
      { label: "Yeni Test", to: "/teacher/tests/new", icon: FileText },
      { label: "Şablonlar", to: "/teacher/tests/templates", icon: FileText },
    ],
  },

  {
    title: "Kütüphane",
    icon: Library,
    submenu: true,
    items: [
      { label: "İçerikler", to: "/teacher/library", icon: Library },
      { label: "Klasörler", to: "/teacher/library/folders", icon: Library },
      { label: "Etiketler", to: "/teacher/library/tags", icon: Library },
    ],
  },

  {
    title: "Mesajlar",
    icon: MessageSquareText,
    submenu: true,
    items: [
      { label: "Gelen Kutusu", to: "/teacher/messages/inbox", icon: MessageSquareText },
      { label: "Gönderilen", to: "/teacher/messages/sent", icon: MessageSquareText },
      { label: "Şablonlar", to: "/teacher/messages/templates", icon: MessageSquareText },
    ],
  },

  {
    title: "Ayarlar",
    icon: Settings,
    submenu: true,
    items: [
      { label: "Genel", to: "/teacher/settings", icon: Settings },
      { label: "Kullanıcılar", to: "/teacher/settings/users", icon: Settings },
      { label: "Plan / Ödeme", to: "/teacher/settings/billing", icon: Settings },
    ],
  },
]
