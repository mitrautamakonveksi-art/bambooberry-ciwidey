"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createExecutiveDecision } from "@/modules/analytics/actions/analytics-actions"
import { FileText, Loader2, Plus, Trash2, X } from "lucide-react"

interface ExecutiveDecisionModalProps {
  outlets: Array<{ id: string; name: string }>
}

export default function ExecutiveDecisionModal({ outlets }: ExecutiveDecisionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [strategicDecision, setStrategicDecision] = useState("")
  const [outletId, setOutletId] = useState("")
  const [actionItems, setActionItems] = useState<string[]>([""])

  const handleAddActionItem = () => {
    setActionItems([...actionItems, ""])
  }

  const handleActionItemChange = (index: number, val: string) => {
    const updated = [...actionItems]
    updated[index] = val
    setActionItems(updated)
  }

  const handleRemoveActionItem = (index: number) => {
    if (actionItems.length === 1) return
    setActionItems(actionItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const validActions = actionItems.filter((a) => a.trim().length > 0)
    if (validActions.length === 0) {
      setError("Wajib mengisi minimal satu tindak lanjut / action item")
      setLoading(false)
      return
    }

    const res = await createExecutiveDecision({
      title,
      strategicDecision,
      actionItems: validActions,
      outletId: outletId || undefined,
    })

    setLoading(false)

    if (res.success) {
      setOpen(false)
      setTitle("")
      setStrategicDecision("")
      setOutletId("")
      setActionItems([""])
    } else {
      setError(res.error || "Gagal mencatat keputusan.")
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-slate-300 gap-1.5 text-xs"
      >
        <FileText className="h-3.5 w-3.5" />
        + Catat Keputusan Direksi
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b shrink-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <FileText className="h-5 w-5 text-[#2A7C13]" />
                  Keputusan Strategis Eksekutif
                </CardTitle>
                <CardDescription className="text-xs">
                  Dokumentasikan arahan strategis rapat Owner beserta daftar action items.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 text-slate-500"
              >
                <X size={18} />
              </Button>
            </CardHeader>

            <CardContent className="pt-4 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="title">Judul Kebijakan / Keputusan</Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Rasionalisasi Food Cost & Penyesuaian Menu Musiman"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="decisionOutlet">Ruang Lingkup Cabang (Opsional)</Label>
                  <select
                    id="decisionOutlet"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                  >
                    <option value="">Semua Outlet (Konsolidasian)</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="strategicDecision">Uraian Keputusan & Arahan Strategis</Label>
                  <Textarea
                    id="strategicDecision"
                    placeholder="Jelaskan alasan, target numerik, dan arahan konkret yang diputuskan..."
                    value={strategicDecision}
                    onChange={(e) => setStrategicDecision(e.target.value)}
                    required
                    className="h-20 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Action Items / Tindak Lanjut</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddActionItem}
                      className="h-7 text-xs text-[#2A7C13] hover:text-[#2A7C13] hover:bg-green-50"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Tambah Poin
                    </Button>
                  </div>
                  {actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 w-4">{idx + 1}.</span>
                      <Input
                        placeholder={`Tugas / PIC #${idx + 1}`}
                        value={item}
                        onChange={(e) => handleActionItemChange(idx, e.target.value)}
                        className="text-xs h-8"
                      />
                      {actionItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveActionItem(idx)}
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Keputusan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
