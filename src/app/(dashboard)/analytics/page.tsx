import React from "react"
import { getCurrentUser, isOwnerOrAdmin, isManagerOrAbove } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertOctagon, TrendingUp, DollarSign, Users, ChefHat, Activity, FileText, CheckCircle2 } from "lucide-react"
import { getExecutiveData } from "@/modules/analytics/actions/analytics-actions"
import { prisma } from "@/shared/lib/prisma"
import ResolveAlertButton from "@/components/analytics/ResolveAlertButton"
import CreateAlertDialog from "@/components/analytics/CreateAlertDialog"
import ExecutiveDecisionModal from "@/components/analytics/ExecutiveDecisionModal"
import ExportExecutivePdfButton from "@/components/analytics/ExportExecutivePdfButton"

export const metadata = {
  title: "Executive Analytics | IBMS",
}

export default async function ExecutiveAnalyticsPage() {
  const user = await getCurrentUser()
  // Guard: Hanya Owner, Super Admin, atau Manager yang bisa mengakses dasbor eksekutif
  if (!user || (!isOwnerOrAdmin(user) && !isManagerOrAbove(user))) {
    redirect("/")
  }

  const effectiveOutlet = await getEffectiveOutlet(user)

  const [{ currentMonth, alerts, consolidatedKPIs, outletLeaderboard, executiveDecisions }, outlets] =
    await Promise.all([
      getExecutiveData(effectiveOutlet.outletId),
      prisma.outlet.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    ])

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Analytics</h1>
          <p className="text-muted-foreground">
            Konsolidasi performa finansial, operasional, dan peringatan dini multi-outlet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs bg-white text-slate-700 py-1 px-2.5">
            Periode: {currentMonth}
          </Badge>
          <CreateAlertDialog outlets={outlets} />
          <ExecutiveDecisionModal outlets={outlets} />
          <ExportExecutivePdfButton />
        </div>
      </div>

      {/* TOP ROW: CONSOLIDATED FINANCIAL KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Pendapatan (Consolidated)</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatIDR(consolidatedKPIs.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-400 mt-1">
              <TrendingUp className="mr-1 h-3 w-3" /> +{consolidatedKPIs.revenueGrowth}% dari bulan lalu
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih (Net Profit)</CardTitle>
            <Activity className="h-4 w-4 text-[#2A7C13]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatIDR(consolidatedKPIs.netProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: {((consolidatedKPIs.netProfit / consolidatedKPIs.totalRevenue) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm ${
            consolidatedKPIs.foodCostPercent > 35 ? "border-red-200 bg-red-50/60" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consolidated Food Cost %</CardTitle>
            <ChefHat
              className={`h-4 w-4 ${
                consolidatedKPIs.foodCostPercent > 35 ? "text-red-500" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                consolidatedKPIs.foodCostPercent > 35 ? "text-red-700" : "text-slate-900"
              }`}
            >
              {consolidatedKPIs.foodCostPercent}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target Ideal: &le; 35%</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Cost % (HR)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consolidatedKPIs.laborCostPercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">Gaji & Beban Karyawan vs Pendapatan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        {/* EARLY WARNING SYSTEM (EWS) */}
        <Card className="md:col-span-4 border-orange-200 shadow-sm">
          <CardHeader className="bg-orange-50/50 border-b">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle className="text-base text-slate-900">Early Warning System (EWS)</CardTitle>
                <CardDescription className="text-xs">
                  Deteksi dini anomali bisnis lintas divisi (Finance, HR, Ops, Marketing).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead>Pesan Peringatan</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-green-600 font-medium text-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Tidak ada peringatan dini kritis saat ini. Semua operasional berjalan normal.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert.id} className="hover:bg-slate-50 text-xs">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            alert.severity === "CRITICAL"
                              ? "border-red-500 text-red-700 bg-red-50 font-bold"
                              : alert.severity === "HIGH"
                              ? "border-orange-500 text-orange-700 bg-orange-50 font-semibold"
                              : "border-yellow-500 text-yellow-700 bg-yellow-50"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-[280px]">
                        <div>{alert.message}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Terdeteksi:{" "}
                          {new Date(alert.triggeredAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">{alert.outlet.name}</TableCell>
                      <TableCell className="text-right">
                        <ResolveAlertButton alertId={alert.id} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* OUTLET LEADERBOARD */}
        <Card className="md:col-span-3 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-base text-slate-900">Papan Peringkat Outlet</CardTitle>
            <CardDescription className="text-xs">
              Komparasi performa cabang berdasarkan skor KPI Engine.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cabang / Outlet</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Skor KPI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outletLeaderboard.map((outlet) => (
                  <TableRow key={outlet.id} className="text-xs">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{outlet.name}</div>
                      <div className="text-[11px] mt-0.5 text-slate-500">
                        Food Cost:{" "}
                        <span
                          className={
                            outlet.foodCost > 35
                              ? "text-red-600 font-bold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {outlet.foodCost}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-800">
                      {formatIDR(outlet.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-bold text-slate-900">{outlet.kpiScore}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] uppercase px-1.5 py-0 ${
                            outlet.status === "EXCELLENT"
                              ? "bg-green-100 text-green-800 hover:bg-green-100 font-semibold"
                              : outlet.status === "GOOD"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium"
                              : "bg-red-100 text-red-800 hover:bg-red-100 font-semibold"
                          }`}
                        >
                          {outlet.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* STRATEGIC DECISIONS & BOARD DIRECTIVES SECTION */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <FileText className="h-4 w-4 text-[#2A7C13]" />
                Log Keputusan Strategis Eksekutif & Rencana Aksi
              </CardTitle>
              <CardDescription className="text-xs">
                Arahan rapat Owner / Direksi dengan poin tindakan yang dipantau realisasinya.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kebijakan Strategis</TableHead>
                <TableHead>Ruang Lingkup</TableHead>
                <TableHead>Daftar Tindak Lanjut (Action Items)</TableHead>
                <TableHead>Inisiator</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executiveDecisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    Belum ada keputusan strategis tercatat. Klik tombol <b>+ Catat Keputusan Direksi</b> untuk
                    mendokumentasikan arahan rapat Owner.
                  </TableCell>
                </TableRow>
              ) : (
                executiveDecisions.map((dec) => (
                  <TableRow key={dec.id} className="text-xs align-top">
                    <TableCell className="max-w-[200px]">
                      <div className="font-semibold text-slate-900">{dec.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {dec.strategicDecision}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {dec.outlet?.name || "Konsolidasi Multi-Outlet"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {Array.isArray(dec.actionItems) ? (
                          dec.actionItems.map((item: unknown, idx: number) => (
                            <li key={idx} className="text-[11px]">
                              {String(item)}
                            </li>
                          ))
                        ) : (
                          <li className="text-[11px]">{String(dec.actionItems)}</li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{dec.creator.name}</TableCell>
                    <TableCell className="text-right text-slate-500">
                      {new Date(dec.createdAt).toLocaleDateString("id-ID", {
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
