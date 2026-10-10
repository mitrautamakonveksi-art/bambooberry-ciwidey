import { prisma } from "@/shared/lib/prisma"
import { submitStartWork } from "@/server/actions/report-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function StartWorkPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const [kpis, outlets] = await Promise.all([
    prisma.kpiDefinition.findMany({
      where: { isActive: true },
      include: { division: true },
      orderBy: { division: { name: "asc" } },
    }),
    prisma.outlet.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  const defaultOutletId = effectiveOutlet.outletId || outlets[0]?.id

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#2A7C13] text-xl">Mulai Shift Kerja</CardTitle>
          <CardDescription>Tentukan komitmen target harian Anda hari ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitStartWork} className="space-y-6">
            <div className="space-y-2 p-3 rounded-lg border bg-slate-50/50">
              <Label htmlFor="outletId" className="font-semibold text-slate-900">
                Cabang / Outlet
              </Label>
              <Select name="outletId" defaultValue={defaultOutletId} required>
                <SelectTrigger id="outletId">
                  <SelectValue placeholder="Pilih Cabang Outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {kpis.map((kpi) => (
              <div key={kpi.id} className="space-y-2 p-3 rounded-lg border bg-slate-50/50">
                <input type="hidden" name="kpiId" value={kpi.id} />
                <div className="flex items-center justify-between">
                  <Label htmlFor={`kpi-${kpi.id}`} className="font-semibold text-slate-900">
                    {kpi.name}
                  </Label>
                  <Badge variant="outline" className="text-[10px]">
                    {kpi.division.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id={`kpi-${kpi.id}`}
                    name="commitment"
                    type="number"
                    step="0.01"
                    placeholder={`Target (${kpi.measureUnit})`}
                    required
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap min-w-[50px]">
                    {kpi.measureUnit}
                  </span>
                </div>
              </div>
            ))}
            <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90">
              Mulai Shift Kerja
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
