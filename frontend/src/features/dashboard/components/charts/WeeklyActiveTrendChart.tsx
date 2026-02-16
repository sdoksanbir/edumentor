// src/features/dashboard/components/charts/WeeklyActiveTrendChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader } from "@shared/ui/card"

type Props = {
  data: { week: string; count: number }[]
  isLoading?: boolean
}

export function WeeklyActiveTrendChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Haftalık Aktiflik Trendi</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium">Haftalık Aktiflik Trendi</h3>
        <p className="text-xs text-muted-foreground">
          Son 8 hafta (şimdilik yeni kayıt sayısı)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => new Intl.NumberFormat("tr-TR").format(v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value: unknown) => [
                  new Intl.NumberFormat("tr-TR").format(Number(value ?? 0)),
                  "Aktif",
                ]}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
