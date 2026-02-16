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
import type { MostActiveTeacherItem } from "../../types"

type Props = {
  data: MostActiveTeacherItem[]
  isLoading?: boolean
}

export function MostActiveTeachersChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">En Aktif Öğretmenler</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    name: d.teacher_name.length > 20 ? d.teacher_name.slice(0, 20) + "…" : d.teacher_name,
    fullName: d.teacher_name,
    logins: d.logins_count,
  }))

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium">En Aktif Öğretmenler</h3>
        <p className="text-xs text-muted-foreground">
          Login sayısına göre sıralama
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => new Intl.NumberFormat("tr-TR").format(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value: unknown) => [
                  new Intl.NumberFormat("tr-TR").format(Number(value ?? 0)),
                  "Giriş",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullName ?? ""
                }
              />
              <Bar
                dataKey="logins"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
