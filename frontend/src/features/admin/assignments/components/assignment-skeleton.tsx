// src/features/admin/assignments/components/assignment-skeleton.tsx
import { Card, CardContent, CardHeader } from "@shared/ui/card"

export function AssignmentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-[320px] animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-xl overflow-hidden">
            <div className="animate-pulse p-4">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-2 h-8 w-16 rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="rounded-2xl overflow-hidden">
            <CardHeader>
              <div className="space-y-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
                  <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
                  <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-40 animate-pulse rounded bg-muted/80" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
