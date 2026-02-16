type RoleDashboardPageProps = {
  title: string
  subtitle?: string
}

export function RoleDashboardPage({ title, subtitle }: RoleDashboardPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg">Hoş geldin.</p>
        <p className="mt-2 text-sm">Bu sayfa geliştirme aşamasında.</p>
      </div>
    </div>
  )
}
