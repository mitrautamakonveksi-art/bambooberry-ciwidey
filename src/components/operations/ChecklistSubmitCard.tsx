"use client"

import { useState } from "react"
import { submitChecklist } from "@/modules/operations/actions/inventory-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckSquare, CheckCircle2, Circle } from "lucide-react"

interface TemplateItem {
  id: string
  text: string
  category?: string
}

interface TemplateOption {
  id: string
  title: string
  type: string
  items: unknown
}

export default function ChecklistSubmitCard({
  outletId,
  templates,
}: {
  outletId: string
  templates: TemplateOption[]
}) {
  const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id || "")
  const [responses, setResponses] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeTemplate = templates.find((t) => t.id === activeTemplateId)
  const items = (activeTemplate?.items as TemplateItem[]) || []

  const toggleItem = (itemId: string) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const completedCount = items.filter((i) => responses[i.id] === true).length
  const scorePct = items.length > 0 ? (completedCount / items.length) * 100 : 0

  const handleSubmit = async () => {
    if (!activeTemplateId) return
    setIsSubmitting(true)
    try {
      await submitChecklist(outletId, activeTemplateId, responses, notes)
      alert("Checklist SOP berhasil disimpan!")
      setResponses({})
      setNotes("")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengirim checklist")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-500">
          Belum ada template SOP checklist yang aktif.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-[#2A7C13]">
              <CheckSquare size={18} /> Formulir SOP Checklist Hari Ini
            </CardTitle>
            <CardDescription className="text-xs">
              Pastikan standar opening / closing dipatuhi oleh seluruh staf bertugas.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {templates.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={t.id === activeTemplateId ? "default" : "outline"}
                className={t.id === activeTemplateId ? "bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white" : ""}
                onClick={() => {
                  setActiveTemplateId(t.id)
                  setResponses({})
                }}
              >
                {t.title.includes("Opening") ? "SOP Opening" : t.title.includes("Closing") ? "SOP Closing" : t.title}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border text-xs">
          <span className="font-semibold text-slate-700">{activeTemplate?.title}</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              {completedCount} dari {items.length} Selesai
            </span>
            <Badge
              className={scorePct === 100 ? "bg-[#2A7C13]" : scorePct >= 70 ? "bg-amber-500" : "bg-red-500"}
            >
              {scorePct.toFixed(0)}%
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const isChecked = responses[item.id] === true
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isChecked ? "bg-emerald-50/60 border-emerald-200" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="pt-0.5">
                  {isChecked ? (
                    <CheckCircle2 size={18} className="text-[#2A7C13]" />
                  ) : (
                    <Circle size={18} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${isChecked ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                    {item.text}
                  </p>
                  {item.category && (
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Catatan Kondisi Khusus / Kendala Shift:</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="mis. Chiller berbunyi kasar namun suhu masih normal 3°C..."
            className="text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white text-xs sm:text-sm"
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Hasil Checklist"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
