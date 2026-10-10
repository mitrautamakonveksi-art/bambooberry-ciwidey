import { prisma } from "@/shared/lib/prisma"
import { getAggregatedSummary, saveSummaryConclusion } from "@/server/actions/summary-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ExportCsvButton from "@/components/ExportCsvButton"

interface SummaryPageProps {
  searchParams: Promise<{
    outletId?: string
    divisionId?: string
    start?: string
    end?: string
  }>
}

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const outlets = await prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  const divisions = await prisma.division.findMany({ orderBy: { name: "asc" } })

  const resolvedParams = await searchParams
  const fallbackOutlet = effectiveOutlet.isConsolidated
    ? "ALL"
    : (effectiveOutlet.outletId || outlets[0]?.id || "ALL")
  const selectedOutlet = resolvedParams.outletId || fallbackOutlet
  const selectedDivision = resolvedParams.divisionId || divisions[0]?.id
  
  // Default: 7 hari terakhir
  const defaultEnd = new Date()
  const defaultStart = new Date()
  defaultStart.setDate(defaultEnd.getDate() - 7)

  const startDate = resolvedParams.start ? new Date(resolvedParams.start) : defaultStart
  const endDate = resolvedParams.end ? new Date(resolvedParams.end) : defaultEnd

  const summaryData = await getAggregatedSummary(selectedOutlet, selectedDivision, startDate, endDate)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rekapitulasi & Analisis</h2>
          <p className="text-slate-500">Agregasi performa per divisi dan outlet.</p>
        </div>
        <ExportCsvButton data={summaryData} filename={`Rekap_${selectedOutlet}_${startDate.toISOString().split('T')[0]}`} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" method="GET">
            <div className="space-y-2">
              <Label>Outlet</Label>
              <Select name="outletId" defaultValue={selectedOutlet}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Cabang (Konsolidasi)</SelectItem>
                  {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Select name="divisionId" defaultValue={selectedDivision}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input type="date" name="start" defaultValue={startDate.toISOString().split('T')[0]} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Terapkan Filter</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Hasil Agregasi KPI</CardTitle>
              <CardDescription>Otomatis dikalkulasi dari laporan harian (Rata-rata atau Total).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium text-slate-500">Indikator KPI</th>
                      <th className="p-3 text-right font-medium text-slate-500">Pencapaian</th>
                      <th className="p-3 text-left font-medium text-slate-500">Isu & Kendala Muncul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summaryData.map((data, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">{data.kpiName}</td>
                        <td className="p-3 text-right font-bold text-primary">
                          {data.value} <span className="text-xs font-normal text-slate-500">{data.unit}</span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {data.problems.length > 0 ? (
                            <ul className="list-disc pl-4 text-xs text-red-600">
                              {data.problems.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          ) : (
                            <span className="text-xs text-slate-400">Nir-kendala</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {summaryData.length === 0 && (
                      <tr><td colSpan={3} className="p-8 text-center text-slate-500">Tidak ada data laporan pada periode ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="h-full border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">Keputusan Bisnis</CardTitle>
              <CardDescription>Catat tindakan atau rencana berdasarkan data di samping.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={saveSummaryConclusion} className="space-y-4">
                <input type="hidden" name="outletId" value={selectedOutlet} />
                <input type="hidden" name="divisionId" value={selectedDivision} />
                <input type="hidden" name="startDate" value={startDate.toISOString()} />
                <input type="hidden" name="endDate" value={endDate.toISOString()} />
                
                <Textarea 
                  name="conclusion" 
                  placeholder="Contoh: Mengadakan training ulang untuk kasir karena sering terjadi input manual yang salah (lihat kendala)."
                  className="min-h-[200px] bg-white"
                  required
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Simpan Keputusan</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
