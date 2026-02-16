import { Button } from "@shared/ui/button"
import { Input } from "@shared/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card"
import { Users, BookOpen, CheckSquare, ClipboardList, MessageCircle, BarChart3 } from "lucide-react"

type LabelCardProps = {
  icon: React.ElementType
  bgColor: string
  borderColor: string
  textColor: string
  value: string
  label: string
}

function LabelCard({ icon: Icon, bgColor, borderColor, textColor, value, label }: LabelCardProps) {
  return (
    <div className={`${bgColor} ${borderColor} rounded-2xl border p-4 min-h-[92px] flex flex-col gap-2 transition-all hover:${bgColor.replace('/10', '/15')}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${textColor}`} />
        <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      </div>
      <div className={`text-sm font-medium ${textColor}`}>{label}</div>
    </div>
  )
}

const statsData = [
  {
    icon: Users,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
    value: "2",
    label: "Öğrenci",
  },
  {
    icon: BookOpen,
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
    value: "12",
    label: "Ders",
  },
  {
    icon: CheckSquare,
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    value: "0",
    label: "Bugün Bitti",
  },
  {
    icon: ClipboardList,
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    textColor: "text-orange-600 dark:text-orange-400",
    value: "0",
    label: "Bugün Toplam",
  },
  {
    icon: MessageCircle,
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    textColor: "text-pink-600 dark:text-pink-400",
    value: "0",
    label: "Yeni Mesaj",
  },
  {
    icon: BarChart3,
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-600 dark:text-red-400",
    value: "%0",
    label: "Tamamlanma",
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Label Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <LabelCard key={index} {...stat} />
        ))}
      </div>

      {/* Button Test */}
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>

      {/* ✅ KPI SECTION (işte burası KPI) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue", value: "₺ —" },
          { label: "Users", value: "—" },
          { label: "Sessions", value: "—" },
          { label: "Conversion", value: "% —" },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Test */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Input Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Normal input" />
          <Input placeholder="Error input" error />
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Sprint 1: Input / Card / Table sırada.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
