import { prisma } from "@/shared/lib/prisma"
import { createKpiDefinition } from "@/modules/admin/actions/kpi-config-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sliders, Plus } from "lucide-react"

export default async function AdminKpiConfigPage() {
  const [kpis, divisions] = await Promise.all([
    prisma.kpiDefinition.findMany({
      include: {
        division: true,
        weights: true,
        _count: { select: { targets: true, dailyItems: true } },
      },
      orderBy: { division: { name: "asc" } },
    }),
    prisma.division.findMany(),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Konfigurasi KPI & Bobot Skor (No-Code Builder)
        </h2>
        <p className="text-slate-500">
          Tambah metrik operasional baru dan tentukan ambang batas skor Hijau, Kuning, dan Merah.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Buat Indikator KPI Baru */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2A7C13]">
              <Plus size={20} /> Buat Indikator KPI Baru
            </CardTitle>
            <CardDescription>
              Definisikan KPI baru tanpa menyentuh kode program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createKpiDefinition} className="space-y-4">
              <div className="space-y-2">
                <Label>Divisi Pemilik KPI</Label>
                <Select name="divisionId" required defaultValue={divisions[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nama Indikator KPI</Label>
                <Input name="name" placeholder="mis. Food Cost Actual Ratio" required />
              </div>

              <div className="space-y-2">
                <Label>Satuan Pengukuran</Label>
                <Input name="measureUnit" placeholder="mis. %, Pengunjung, Porsi, Rp" required />
              </div>

              <div className="space-y-2">
                <Label>Bobot Skor dalam Divisi (%)</Label>
                <Input name="weightPct" type="number" defaultValue="25" min="1" max="100" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-green-700">Min. Hijau (%)</Label>
                  <Input name="greenMin" type="number" defaultValue="90" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-amber-700">Min. Kuning (%)</Label>
                  <Input name="yellowMin" type="number" defaultValue="75" required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90 mt-2">
                Daftarkan KPI Baru
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabel Konfigurasi KPI yang Ada */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders size={20} /> Daftar Indikator & Ambang Batas ({kpis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium text-slate-500">Divisi</th>
                    <th className="p-3 text-left font-medium text-slate-500">Nama Indikator</th>
                    <th className="p-3 text-center font-medium text-slate-500">Satuan</th>
                    <th className="p-3 text-center font-medium text-slate-500">Bobot</th>
                    <th className="p-3 text-center font-medium text-slate-500">Ambang Batas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kpis.map((kpi) => {
                    const weight = kpi.weights[0]
                    return (
                      <tr key={kpi.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <Badge variant="outline">{kpi.division.name}</Badge>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{kpi.name}</td>
                        <td className="p-3 text-center text-slate-600">{kpi.measureUnit}</td>
                        <td className="p-3 text-center font-bold text-[#2A7C13]">
                          {weight?.weightPct || 20}%
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-medium">
                              ≥{weight?.greenMin || 90}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                              ≥{weight?.yellowMin || 75}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-medium">
                              &lt;{weight?.yellowMin || 75}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
