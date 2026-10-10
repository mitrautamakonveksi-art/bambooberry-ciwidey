"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEarlyWarningAlert } from "@/modules/analytics/actions/analytics-actions"
import { AlertOctagon, Loader2, X } from "lucide-react"

interface CreateAlertDialogProps {
  outlets: Array<{ id: string; name: string }>
}

export default function CreateAlertDialog({ outlets }: CreateAlertDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    outletId: outlets[0]?.id || "",
    alertType: "FINANCE",
    severity: "HIGH" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await createEarlyWarningAlert(formData)
    setLoading(false)

    if (res.success) {
      setOpen(false)
      setFormData({
        outletId: outlets[0]?.id || "",
        alertType: "FINANCE",
        severity: "HIGH",
        message: "",
      })
    } else {
      setError(res.error || "Gagal menyimpan peringatan dini.")
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-orange-200 text-orange-700 hover:bg-orange-50 gap-1.5 text-xs"
      >
        <AlertOctagon className="h-3.5 w-3.5" />
        + Trigger Peringatan Dini
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <AlertOctagon className="h-5 w-5 text-orange-600" />
                  Catat Peringatan Dini (EWS)
                </CardTitle>
                <CardDescription className="text-xs">
                  Laporkan anomali bisnis yang memerlukan atensi manajemen lintas divisi.
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

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="outletId">Outlet / Cabang Terkait</Label>
                  <select
                    id="outletId"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={formData.outletId}
                    onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                    required
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="alertType">Domain / Kategori</Label>
                    <select
                      id="alertType"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={formData.alertType}
                      onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
                    >
                      <option value="FINANCE">Finance (Kas / Settlement)</option>
                      <option value="OPERATIONS">Operations (Food Cost / Stock)</option>
                      <option value="HR">HR (Turnover / Absensi)</option>
                      <option value="MARKETING">Marketing (Komplain / SLA)</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="severity">Tingkat Urgensi</Label>
                    <select
                      id="severity"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          severity: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                        })
                      }
                    >
                      <option value="MEDIUM">MEDIUM (Perhatian)</option>
                      <option value="HIGH">HIGH (Penting)</option>
                      <option value="CRITICAL">CRITICAL (Gawat / Darurat)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Uraian Masalah / Anomali</Label>
                  <Textarea
                    id="message"
                    placeholder="Contoh: Selisih minus kas drawer Rp 150.000 pada shift malam setelah verifikasi POS..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="h-24 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kirim Peringatan EWS
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
