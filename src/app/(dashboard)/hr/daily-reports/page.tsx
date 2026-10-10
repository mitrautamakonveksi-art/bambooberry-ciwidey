import Link from "next/link"
import { prisma } from "@/shared/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus, Lightbulb } from "lucide-react"
import { formatDate } from "@/shared/i18n/id"

export const metadata = {
  title: "Laporan Harian Staf & Kaizen | HR | BAMBOOBERRY",
}

export default async function HrDailyReportsPage() {
  const [reports, openKaizens] = await Promise.all([
    prisma.dailyReport.findMany({
      orderBy: { date: "desc" },
      take: 15,
      include: {
        user: true,
        outlet: true,
        items: {
          include: { kpi: true, kaizen: true },
        },
      },
    }),
    prisma.kaizen.findMany({
      where: { status: "OPEN" },
      include: {
        dailyItem: {
          include: { kpi: true, report: { include: { outlet: true, user: true } } },
        },
      },
      take: 5,
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan Harian Staf & Log Kaizen
          </h2>
          <p className="text-slate-500">
            Pemantauan siklus kerja harian staf: Komitmen Awal → Capaian Akhir → Kaizen Kendala.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports/daily/start">
            <Button className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Mulai Shift Baru
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="text-xs sm:text-sm">
              Buka Halaman Review Penuh
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kolom Kiri: Riwayat Laporan Harian Terkini */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList size={18} className="text-[#2A7C13]" /> Laporan Shift Terkini
              </CardTitle>
              <CardDescription>
                Daftar 15 laporan shift kerja staf terbaru di seluruh cabang outlet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-lg border bg-card hover:bg-slate-50/50 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{report.user.name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">{report.outlet.name}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(report.date)} — {report.items.length} Indikator KPI
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        report.status === "APPROVED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : report.status === "SUBMITTED"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-700"
                      }
                    >
                      {report.status === "APPROVED"
                        ? "Disetujui"
                        : report.status === "SUBMITTED"
                        ? "Menunggu Review"
                        : report.status}
                    </Badge>
                    {report.status === "DRAFT" && (
                      <Link href={`/reports/daily/finish/${report.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          Selesaikan
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Fokus Kaizen Terbuka */}
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                <Lightbulb size={18} className="text-amber-600" /> Fokus Kaizen Terbuka ({openKaizens.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Usulan solusi perbaikan dari staf untuk kendala operasional yang belum tertutup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {openKaizens.map((k) => (
                <div key={k.id} className="p-3 rounded-lg border bg-white space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      {k.dailyItem.kpi.name}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {k.dailyItem.report.outlet.name}
                    </Badge>
                  </div>
                  {k.dailyItem.problemDesc && (
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">Kendala:</span> {k.dailyItem.problemDesc}
                    </p>
                  )}
                  <p className="text-xs text-[#2A7C13]">
                    <span className="font-semibold">Solusi Kaizen:</span> {k.proposedSolution}
                  </p>
                </div>
              ))}
              {openKaizens.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  Tidak ada usulan Kaizen yang terbuka. Semua berjalan optimal!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
