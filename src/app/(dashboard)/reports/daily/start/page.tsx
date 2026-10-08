import { PrismaClient } from "@prisma/client"
import { submitStartWork } from "@/server/actions/report-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const prisma = new PrismaClient()

export default async function StartWorkPage() {
  const kpis = await prisma.kpiDefinition.findMany({
    where: { division: { name: "Marketing" }, isActive: true }
  })

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary text-xl">Mulai Kerja</CardTitle>
          <CardDescription>Tentukan komitmen target Anda hari ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitStartWork} className="space-y-6">
            {kpis.map((kpi) => (
              <div key={kpi.id} className="space-y-2">
                <input type="hidden" name="kpiId" value={kpi.id} />
                <Label htmlFor={`kpi-${kpi.id}`}>{kpi.name} ({kpi.measureUnit})</Label>
                <Input id={`kpi-${kpi.id}`} name="commitment" type="number" step="0.01" placeholder={`Target ${kpi.name}`} required />
              </div>
            ))}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Mulai Shift</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
