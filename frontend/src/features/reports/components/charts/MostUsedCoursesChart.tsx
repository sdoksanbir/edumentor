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
import type { MostUsedCourseItem } from "../../types"

type Props = {
  data: MostUsedCourseItem[]
  isLoading?: boolean
}

export function MostUsedCoursesChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">En Çok Kullanılan Kurslar</h3>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    name: d.course_label.length > 25 ? d.course_label.slice(0, 25) + "…" : d.course_label,
    fullTitle: d.course_label,
    count: d.topics_count,
    subjectLabel: d.subject_label,
    relatedTeachers: d.related_teachers_count,
  }))

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium">En Çok Kullanılan Kurslar</h3>
        <p className="text-xs text-muted-foreground">
          Proxy metrik: konu sayısı + branşı eşleşen öğretmen. Gerçek kullanım için enrollment/progress tablosu gerekir.
        </p>
        {data.some((d) => d.is_proxy_metric) && (
          <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Proxy metrik
          </span>
        )}
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
                width={140}
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
                  "Konu sayısı",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullTitle ?? ""
                }
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--chart-2, 220 70% 50%))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
