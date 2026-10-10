import Link from "next/link"
import { getDashboardStats } from "@/server/actions/dashboard-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import OverviewChart from "@/components/charts/OverviewChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)
  const stats = await getDashboardStats(effectiveOutlet.outletId)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Executive</h2>
          <p className="text-slate-500">Ringkasan performa operasional hari ini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" className="border-slate-300 text-xs">
              Executive Analytics & EWS →
            </Button>
          </Link>
          <Link href="/reports/daily/start">
            <Button className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs">+ Isi Laporan Baru</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pengunjung (TC)" value={stats.totalTC} />
        <StatCard title="Rata-rata Rating" value={stats.avgRating} />
        <StatCard title="Laporan Pending" value={stats.pendingReportsCount} isAlert />
        <StatCard title="Kaizen Terbuka" value={stats.openKaizenCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Perbandingan Pengunjung per Outlet</CardTitle>
            <CardDescription>Total Check (TC) hari ini berdasarkan data laporan yang masuk.</CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart data={stats.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fokus Kaizen Terbuka</CardTitle>
            <CardDescription>Butuh tindak lanjut segera</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentKaizens.map((k) => (
              <div key={k.id} className="rounded-lg border p-3 bg-red-50/50">
                <p className="text-sm font-semibold text-slate-900">{k.dailyItem.problemDesc}</p>
                <p className="text-xs text-slate-500 mt-1">Solusi: {k.proposedSolution}</p>
                <Badge variant="outline" className="mt-2 bg-white">{k.dailyItem.kpi.division.name}</Badge>
              </div>
            ))}
            {stats.recentKaizens.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Tidak ada kendala terbuka.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  isAlert?: boolean
}

function StatCard({ title, value, isAlert }: StatCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value as string) || 0
  return (
    <Card className={isAlert && numericValue > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )
}
