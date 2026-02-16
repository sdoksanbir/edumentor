// src/features/dashboard/components/charts/StudentsPerTeacherChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader } from "@shared/ui/card"

const MAX_DISPLAY_LEN = 18

function truncateName(name: string): string {
  if (name.length <= MAX_DISPLAY_LEN) return name
  return name.slice(0, MAX_DISPLAY_LEN - 2) + "…"
}

type Props = {
  data: { teacher_id: number; teacher_name: string; count: number }[]
  isLoading?: boolean
}

export function StudentsPerTeacherChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Öğretmen Başına Öğrenci (Top 10)</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    displayName: truncateName(d.teacher_name),
    fullName: d.teacher_name,
  }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Öğretmen Başına Öğrenci (Top 10)</h3>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
            Henüz atanmış öğrenci yok
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium">Öğretmen Başına Öğrenci (Top 10)</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="displayName"
                width={120}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value: unknown, _name: unknown, props: { payload?: { fullName?: string } }) => [
                  new Intl.NumberFormat("tr-TR").format(Number(value ?? 0)),
                  props?.payload?.fullName ?? "",
                ]}
                labelFormatter={() => ""}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
