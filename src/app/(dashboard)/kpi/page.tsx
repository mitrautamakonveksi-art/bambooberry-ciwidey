import { PrismaClient } from "@prisma/client"
import { setKpiTarget } from "@/server/actions/kpi-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp } from "lucide-react"

const prisma = new PrismaClient()

export default async function KpiManagementPage() {
  const [kpis, outlets, activeTargets] = await Promise.all([
    prisma.kpiDefinition.findMany({ include: { division: true } }),
    prisma.outlet.findMany({ where: { isActive: true } }),
    prisma.kpiTarget.findMany({
      include: { kpi: { include: { division: true } }, outlet: true },
      orderBy: { outlet: { name: 'asc' } }
    })
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Target & KPI</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary"><Target size={20} /> Set Target Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={setKpiTarget} className="space-y-4">
                <div className="space-y-2">
                  <Label>Outlet</Label>
                  <Select name="outletId" required>
                    <SelectTrigger><SelectValue placeholder="Pilih Outlet" /></SelectTrigger>
                    <SelectContent>{outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Indikator (KPI)</Label>
                  <Select name="kpiId" required>
                    <SelectTrigger><SelectValue placeholder="Pilih KPI" /></SelectTrigger>
                    <SelectContent>{kpis.map(kpi => <SelectItem key={kpi.id} value={kpi.id}>{kpi.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Periode</Label>
                  <Select name="periodType" required defaultValue="MONTHLY">
                    <SelectTrigger><SelectValue placeholder="Pilih Periode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Harian</SelectItem>
                      <SelectItem value="WEEKLY">Mingguan</SelectItem>
                      <SelectItem value="MONTHLY">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nilai Target</Label>
                  <Input name="targetValue" type="number" step="0.01" required />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-2">Simpan Target</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={20} /> Daftar Target Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium text-slate-500">Outlet</th>
                      <th className="p-3 text-left font-medium text-slate-500">Indikator KPI</th>
                      <th className="p-3 text-right font-medium text-slate-500">Target</th>
                      <th className="p-3 text-center font-medium text-slate-500">Periode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeTargets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-900">{t.outlet.name}</td>
                        <td className="p-3 text-slate-900">{t.kpi.name}</td>
                        <td className="p-3 text-right font-bold text-primary">{t.targetValue} <span className="text-xs font-normal text-slate-500">{t.kpi.measureUnit}</span></td>
                        <td className="p-3 text-center"><Badge variant="outline" className="text-xs font-normal">{t.periodType}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
