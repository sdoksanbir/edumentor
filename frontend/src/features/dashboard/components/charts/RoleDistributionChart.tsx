// src/features/dashboard/components/charts/RoleDistributionChart.tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader } from "@shared/ui/card"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "hsl(262 83% 58%)", // purple
  TEACHER: "hsl(221 83% 53%)", // blue
  STUDENT: "hsl(142 71% 45%)", // emerald
  PARENT: "hsl(38 92% 50%)", // amber
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Öğretmen",
  STUDENT: "Öğrenci",
  PARENT: "Veli",
}

type Props = {
  data: { role: string; count: number }[]
  isLoading?: boolean
}

export function RoleDistributionChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Rol Dağılımı</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: ROLE_LABELS[d.role] ?? d.role,
      color: ROLE_COLORS[d.role] ?? "hsl(var(--muted-foreground))",
    }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Rol Dağılımı</h3>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
            Veri yok
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium">Rol Dağılımı</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value, name) => [
                  new Intl.NumberFormat("tr-TR").format(Number(value ?? 0)),
                  name,
                ] as [string, string]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
