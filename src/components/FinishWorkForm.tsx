"use client"

import { useState } from "react"
import { submitFinishWork } from "@/server/actions/report-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface ReportItem {
  id: string
  commitmentValue: number | null
  kpi: {
    name: string
    measureUnit: string
  }
}

interface ReportData {
  id: string
  outlet: {
    name: string
  }
  items: ReportItem[]
}

export default function FinishWorkForm({ report }: { report: ReportData }) {
  const [actualValues, setActualValues] = useState<Record<string, number>>({})

  const handleActualChange = (itemId: string, value: string) => {
    setActualValues((prev) => ({ ...prev, [itemId]: parseFloat(value) || 0 }))
  }

  const formAction = submitFinishWork.bind(null, report.id)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-[#2A7C13]">Selesaikan Shift Kerja</CardTitle>
          <Badge variant="outline">{report.outlet.name}</Badge>
        </div>
        <CardDescription>
          Isi hasil capaian aktual dan catat kendala serta kaizen jika target tidak tercapai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {report.items.map((item) => {
            const actual = actualValues[item.id] ?? 0
            const commitment = item.commitmentValue ?? 0
            const isTargetMissed = actual < commitment

            return (
              <div key={item.id} className="p-4 border rounded-lg space-y-3 bg-slate-50/50">
                <input type="hidden" name="itemId" value={item.id} />
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-900">{item.kpi.name}</Label>
                  <span className="text-xs px-2 py-0.5 rounded bg-white border text-slate-600">
                    Target: {commitment} {item.kpi.measureUnit}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Capaian Aktual</Label>
                  <Input
                    name="actual"
                    type="number"
                    step="0.01"
                    placeholder="Masukkan angka aktual"
                    onChange={(e) => handleActualChange(item.id, e.target.value)}
                    required
                  />
                </div>

                {isTargetMissed && (
                  <div className="space-y-3 pt-3 border-t border-red-200">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-red-600">
                        Kendala / Masalah (Problem)
                      </Label>
                      <Textarea
                        name="problem"
                        placeholder="Jelaskan apa yang menyebabkan target tidak tercapai..."
                        required={isTargetMissed}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-[#2A7C13]">
                        Usulan Perbaikan Cepat (Kaizen)
                      </Label>
                      <Textarea
                        name="solution"
                        placeholder="Solusi atau tindakan perbaikan agar tidak berulang besok..."
                        required={isTargetMissed}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90">
            Kirim Laporan Shift Selesai
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
