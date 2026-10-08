"use client"

import { use, useState } from "react"
import { submitFinishWork } from "@/server/actions/report-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface ReportItem {
  id: string
  commitmentValue: number
  kpi: {
    name: string
  }
}

export default function FinishWorkPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = "then" in params ? use(params) : params
  const [items] = useState<ReportItem[]>([])
  const [actualValues, setActualValues] = useState<Record<string, number>>({})

  const handleActualChange = (itemId: string, value: string) => {
    setActualValues((prev) => ({ ...prev, [itemId]: parseFloat(value) || 0 }))
  }

  const formAction = submitFinishWork.bind(null, resolvedParams.id)

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hasil Kerja & Kaizen</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {items.map((item) => {
              const actual = actualValues[item.id] || 0
              const isTargetMissed = actual < item.commitmentValue

              return (
                <div key={item.id} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                  <input type="hidden" name="itemId" value={item.id} />
                  <div>
                    <Label className="font-bold">{item.kpi.name}</Label>
                    <p className="text-sm text-muted-foreground">Komitmen awal: {item.commitmentValue}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Pencapaian Aktual</Label>
                    <Input name="actual" type="number" onChange={(e) => handleActualChange(item.id, e.target.value)} required />
                  </div>
                  {isTargetMissed && (
                    <div className="space-y-4 pt-2 border-t border-destructive/20 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-destructive">Kendala (Problem)</Label>
                        <Textarea name="problem" required={isTargetMissed} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-primary">Usulan Perbaikan (Kaizen)</Label>
                        <Textarea name="solution" required={isTargetMissed} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <Button type="submit" className="w-full">Submit Laporan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
