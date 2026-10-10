import React from "react"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bot, AlertTriangle, History, Cpu } from "lucide-react"
import ExecutiveAiChat from "@/components/ai/ExecutiveAiChat"
import RootCauseModal from "@/components/ai/RootCauseModal"
import { getAiQueryHistory } from "@/modules/ai/actions/ai-actions"

export const metadata = {
  title: "AI Intelligence | IBMS",
}

export default async function AiIntelligencePage() {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) {
    redirect("/")
  }

  const effectiveOutlet = await getEffectiveOutlet(user)

  const [queryHistory, rcaList, activeAlerts, outlets] = await Promise.all([
    getAiQueryHistory(),
    prisma.aiRootCauseAnalysis.findMany({
      orderBy: { analyzedAt: "desc" },
      take: 5,
    }),
    prisma.earlyWarningAlert.findMany({
      where: {
        isAcknowledged: false,
        ...(effectiveOutlet.outletId ? { outletId: effectiveOutlet.outletId } : {}),
      },
      orderBy: { triggeredAt: "desc" },
      include: { outlet: { select: { name: true } } },
      take: 4,
    }),
    prisma.outlet.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Intelligence</h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1 text-[11px]">
              <Sparkles className="h-3 w-3 text-amber-600" /> Gemini GenAI
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Konsultan bisnis & analis operasional cerdas untuk jaringan restoran Bambooberry Ciwidey.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RootCauseModal outletId={effectiveOutlet.outletId} />
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE BANNER */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#2A7C13]/10 text-[#2A7C13] flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800">RBAC Data Guardrail & Context Injection:</span>{" "}
            <span className="text-slate-600">
              Setiap kueri AI secara otomatis dilindungi batasan hak akses cabang ({outlets.length} outlet terdaftar) dan hanya menganalisis data terverifikasi.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] bg-slate-50">
            Model: Gemini 1.5 Flash
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-50 text-emerald-700 border-emerald-300">
            Active Guardrail
          </Badge>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: EXECUTIVE CHAT ASSISTANT (8 COLS) */}
        <div className="lg:col-span-8">
          <ExecutiveAiChat outletId={effectiveOutlet.outletId} />
        </div>

        {/* RIGHT COLUMN: PREDICTIVE ANOMALIES & AUDIT LOGS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* ANOMALY RADAR */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Deteksi Anomali Operasional
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-orange-700 bg-orange-50">
                  {activeAlerts.length} Aktif
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Anomali bisnis yang menjadi perhatian model analitik AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Semua metrik operasional berada di rentang normal.
                </div>
              ) : (
                activeAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[170px]">
                        {alt.outlet?.name}
                      </span>
                      <Badge
                        className={`text-[9px] px-1.5 py-0 ${
                          alt.severity === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : alt.severity === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {alt.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{alt.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* RECENT EXECUTIVE QUERIES AUDIT LOG */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                <History className="h-4 w-4 text-slate-500" />
                Jejak Kueri Eksekutif
              </CardTitle>
              <CardDescription className="text-xs">
                Log transparansi pertanyaan analitik yang diajukan ke AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              {queryHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Belum ada riwayat pertanyaan tercatat.
                </div>
              ) : (
                <div className="space-y-2">
                  {queryHistory.slice(0, 5).map((q) => (
                    <div
                      key={q.id}
                      className="p-2 rounded border border-slate-100 text-xs space-y-0.5"
                    >
                      <p className="font-medium text-slate-800 truncate" title={q.naturalLanguageQuery}>
                        &quot;{q.naturalLanguageQuery}&quot;
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{q.user.name}</span>
                        <span>
                          {new Date(q.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROOT CAUSE ARCHIVE TABLE */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#2A7C13]" />
                Arsip Analisis Akar Masalah (Root Cause Analysis - RCA)
              </CardTitle>
              <CardDescription className="text-xs">
                Catatan investigasi mendalam 5-Whys yang dihasilkan AI untuk deviasi KPI dan masalah berulang.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {rcaList.length} Arsip
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik Deviasi / Masalah</TableHead>
                <TableHead className="w-[40%]">Ringkasan Akar Masalah (Root Cause)</TableHead>
                <TableHead>Evaluasi Kaizen</TableHead>
                <TableHead>Arahan Tindakan</TableHead>
                <TableHead className="text-right">Waktu Analisis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rcaList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    Belum ada sesi Root Cause Analysis. Klik tombol <b>+ Jalankan AI Root Cause (RCA)</b> di kanan atas untuk memulai analisis mendalam.
                  </TableCell>
                </TableRow>
              ) : (
                rcaList.map((rca) => (
                  <TableRow key={rca.id} className="text-xs hover:bg-slate-50">
                    <TableCell className="font-semibold text-slate-900 max-w-[180px]">
                      {rca.issueTopic}
                    </TableCell>
                    <TableCell className="text-slate-700 max-w-[280px]">
                      <div className="line-clamp-2" title={rca.rootCauseSummary}>
                        {rca.rootCauseSummary}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[160px] truncate">
                      {rca.kaizenAssessment}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-[160px] truncate">
                      {rca.suggestedAction}
                    </TableCell>
                    <TableCell className="text-right text-slate-500 whitespace-nowrap">
                      {new Date(rca.analyzedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
