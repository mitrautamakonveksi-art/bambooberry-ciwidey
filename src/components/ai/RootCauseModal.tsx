"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateRootCauseAnalysis } from "@/modules/ai/actions/ai-actions"
import { Sparkles, Loader2, Search, X, CheckCircle2 } from "lucide-react"

export default function RootCauseModal({ outletId }: { outletId?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [issueTopic, setIssueTopic] = useState("")
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueTopic.trim()) return

    setLoading(true)
    setAnalysisResult(null)

    try {
      const res = await generateRootCauseAnalysis(issueTopic, outletId)
      setAnalysisResult(res.result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kesalahan"
      alert("Gagal melakukan analisis RCA: " + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
        + Jalankan AI Root Cause (RCA)
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b shrink-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  AI Automated Root Cause Analysis (5-Whys)
                </CardTitle>
                <CardDescription className="text-xs">
                  Analisis akar penyebab anomali atau deviasi target operasional dan evaluasi efektivitas kaizen.
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

            <CardContent className="pt-4 overflow-y-auto flex-1 space-y-4">
              {!analysisResult ? (
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="issueTopic" className="text-xs font-semibold">
                      Topik Masalah / Deviasi Operasional
                    </Label>
                    <Input
                      id="issueTopic"
                      placeholder="Contoh: Terjadi lonjakan selisih kas drawer di Outlet Ciwidey selama weekend..."
                      value={issueTopic}
                      onChange={(e) => setIssueTopic(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-md text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Contoh Isu yang dapat dianalisis:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      <li>Food cost kategori minuman melebihi ambang batas 35%.</li>
                      <li>Rating kepuasan tamu turun karena waktu saji lambat saat jam makan siang.</li>
                      <li>Selisih stok opname bahan baku strawberry dan daging selalu minus.</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                      Tutup
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !issueTopic.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menganalisis Akar Masalah...
                        </>
                      ) : (
                        <>
                          <Search className="mr-1.5 h-3.5 w-3.5" />
                          Mulai Analisis AI
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Hasil Analisis Telah Disimpan ke Database
                    </div>
                    <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                      {analysisResult}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalysisResult(null)}
                      className="text-xs"
                    >
                      ← Analisis Masalah Baru
                    </Button>
                    <Button
                      onClick={() => setOpen(false)}
                      className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white text-xs"
                    >
                      Selesai
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
