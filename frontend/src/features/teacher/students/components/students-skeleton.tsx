// src/features/teacher/students/components/students-skeleton.tsx
import { Card } from "@shared/ui/card"
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
} from "@shared/ui/table"

export function StudentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl overflow-hidden">
            <div className="animate-pulse p-5">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="mt-3 h-8 w-20 rounded bg-muted" />
              <div className="mt-2 h-4 w-24 rounded bg-muted/80" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="rounded-xl overflow-hidden">
        <div className="animate-pulse p-4">
          <div className="flex gap-4">
            <div className="h-10 flex-1 rounded-lg bg-muted" />
            <div className="h-10 w-32 rounded-lg bg-muted" />
            <div className="h-10 w-36 rounded-lg bg-muted" />
            <div className="h-10 w-28 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="border-t border-border">
          <Table>
            <thead>
              <TableRow>
                <TableHead>
                  <div className="h-4 w-12 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-24 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-16 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-14 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-20 rounded bg-muted" />
                </TableHead>
                <TableHead>
                  <div className="h-4 w-12 rounded bg-muted" />
                </TableHead>
              </TableRow>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 rounded bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-36 rounded bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 rounded bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 rounded bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-14 rounded-full bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-muted/80" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 rounded bg-muted/80" />
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
