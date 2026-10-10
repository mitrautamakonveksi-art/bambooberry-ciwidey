import Link from "next/link"
import { prisma } from "@/shared/lib/prisma"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { processApproval } from "@/server/actions/approval-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; outletId?: string }>
}) {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)
  const resolvedParams = searchParams ? await searchParams : {}
  const targetOutletId = resolvedParams?.outletId || effectiveOutlet.outletId
  const page = Math.max(1, parseInt(resolvedParams?.page || "1", 10))
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const whereClause = targetOutletId ? { outletId: targetOutletId } : undefined

  const [reports, totalCount] = await Promise.all([
    prisma.dailyReport.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: pageSize,
      skip,
      include: {
        user: true,
        outlet: true,
        items: { include: { kpi: true, kaizen: true } },
      },
    }),
    prisma.dailyReport.count({
      where: whereClause,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-700">Disetujui</Badge>
      case 'SUBMITTED': return <Badge className="bg-amber-100 text-amber-700">Menunggu Review</Badge>
      case 'REJECTED': return <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700">Draft</Badge>
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Laporan Harian</h2>
          <p className="text-slate-500">Review dan setujui laporan kinerja staf.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports/summary">
            <Button variant="outline">Rekap & Analisis</Button>
          </Link>
          <Link href="/reports/daily/start">
            <Button className="bg-primary hover:bg-primary/90">+ Mulai Shift Baru</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className={report.status === 'SUBMITTED' ? "border-primary/50 ring-1 ring-primary/20" : ""}>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {report.user.name} <span className="text-sm font-normal text-slate-500">di {report.outlet.name}</span>
                </CardTitle>
                <CardDescription>{format(new Date(report.date), "EEEE, dd MMMM yyyy", { locale: id })}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(report.status)}
                {report.status === 'DRAFT' && (
                  <Link href={`/reports/daily/finish/${report.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">Selesaikan Shift</Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details" className="border-b-0">
                  <AccordionTrigger className="text-sm py-2 hover:no-underline text-primary">Lihat Detail Pencapaian & Kaizen</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="p-3 text-left font-medium text-slate-500">KPI</th>
                            <th className="p-3 text-right font-medium text-slate-500">Target</th>
                            <th className="p-3 text-right font-medium text-slate-500">Aktual</th>
                            <th className="p-3 text-center font-medium text-slate-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.items.map((item) => {
                            const isMet = (item.actualValue || 0) >= (item.commitmentValue || 0)
                            return (
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="p-3 font-medium">{item.kpi.name}</td>
                                <td className="p-3 text-right">{item.commitmentValue}</td>
                                <td className="p-3 text-right font-semibold">{item.actualValue}</td>
                                <td className="p-3 text-center">{isMet ? <span className="text-green-600">Tercapai</span> : <span className="text-red-600">Miss</span>}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {report.items.filter(i => i.kaizen || i.problemDesc).length > 0 && (
                      <div className="space-y-3 mt-4">
                        <h4 className="font-semibold text-slate-700 text-sm">Catatan Kendala & Kaizen</h4>
                        {report.items.filter(i => i.problemDesc || i.kaizen).map(item => (
                          <div key={`kaizen-${item.id}`} className="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
                            <p><span className="font-semibold text-slate-700">Metrik:</span> {item.kpi.name}</p>
                            {item.problemDesc && <p className="text-red-700"><span className="font-semibold">Kendala:</span> {item.problemDesc}</p>}
                            {item.kaizen && <p className="text-primary"><span className="font-semibold">Solusi:</span> {item.kaizen.proposedSolution}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {report.status === 'SUBMITTED' && (
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <form action={processApproval} className="space-y-3">
                          <input type="hidden" name="reportId" value={report.id} />
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Catatan Manager (Opsional)</label>
                            <Textarea name="notes" className="h-20" />
                          </div>
                          <div className="flex gap-3 justify-end">
                            <Button type="submit" name="action" value="REJECT" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">Tolak Laporan</Button>
                            <Button type="submit" name="action" value="APPROVE" className="bg-primary hover:bg-primary/90">Setujui Laporan</Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              Belum ada laporan harian yang dibuat. Mulai dengan mengisi laporan shift baru.
            </CardContent>
          </Card>
        )}

        {totalCount > pageSize && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
            <span>
              Menampilkan {reports.length} dari {totalCount} laporan (Halaman {page} dari {totalPages})
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={`/reports?page=${page - 1}`}>
                  <Button variant="outline" size="sm">
                    Sebelumnya
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Sebelumnya
                </Button>
              )}
              {page < totalPages ? (
                <Link href={`/reports?page=${page + 1}`}>
                  <Button variant="outline" size="sm">
                    Selanjutnya
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Selanjutnya
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
