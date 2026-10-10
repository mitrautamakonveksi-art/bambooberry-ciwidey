import React from "react"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertOctagon, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react"
import { prisma } from "@/shared/lib/prisma"
import ResolveAlertButton from "@/components/analytics/ResolveAlertButton"
import CreateAlertDialog from "@/components/analytics/CreateAlertDialog"

export const metadata = {
  title: "Early Warning System (EWS) | IBMS",
}

export default async function EarlyWarningPage() {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) {
    redirect("/")
  }

  const effectiveOutlet = await getEffectiveOutlet(user)

  const [activeAlerts, resolvedAlerts, outlets] = await Promise.all([
    prisma.earlyWarningAlert.findMany({
      where: {
        isAcknowledged: false,
        ...(effectiveOutlet.outletId ? { outletId: effectiveOutlet.outletId } : {}),
      },
      orderBy: { triggeredAt: "desc" },
      include: { outlet: { select: { id: true, name: true } } },
    }),
    prisma.earlyWarningAlert.findMany({
      where: {
        isAcknowledged: true,
        ...(effectiveOutlet.outletId ? { outletId: effectiveOutlet.outletId } : {}),
      },
      orderBy: { triggeredAt: "desc" },
      take: 20,
      include: { outlet: { select: { id: true, name: true } } },
    }),
    prisma.outlet.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <AlertOctagon className="h-6 w-6 text-orange-600" />
              Early Warning System (EWS) Monitor
            </h1>
            <p className="text-sm text-muted-foreground">
              Pemantauan terpusat peringatan anomali bisnis lintas divisi F&B (Finance, HR, Operasional, Marketing).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateAlertDialog outlets={outlets} />
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="text-xs">
              Kembali ke Executive Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* ACTIVE WARNINGS */}
      <Card className="border-orange-200 shadow-sm">
        <CardHeader className="bg-orange-50/50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle className="text-base text-slate-900">
                  Peringatan Aktif ({activeAlerts.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Anomali yang membutuhkan tindakan perbaikan atau mitigasi segera.
                </CardDescription>
              </div>
            </div>
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                {activeAlerts.length} Perlu Tindakan
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Urgensi</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="w-[45%]">Pesan Anomali</TableHead>
                <TableHead>Outlet / Cabang</TableHead>
                <TableHead>Waktu Terdeteksi</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-green-600 font-medium text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Tidak ada peringatan aktif. Semua operasional berjalan dalam parameter normal.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activeAlerts.map((alert) => (
                  <TableRow key={alert.id} className="text-xs hover:bg-slate-50">
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
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {alert.alertType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {alert.message}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{alert.outlet.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(alert.triggeredAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
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

      {/* RESOLVED WARNINGS HISTORY */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Riwayat Peringatan Selesai Ditangani ({resolvedAlerts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Arsip anomali yang telah diinvestigasi dan diselesaikan oleh manajer / owner.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead className="w-[50%]">Pesan Anomali</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead className="text-right">Waktu Kejadian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resolvedAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                    Belum ada riwayat peringatan yang diselesaikan.
                  </TableCell>
                </TableRow>
              ) : (
                resolvedAlerts.map((alert) => (
                  <TableRow key={alert.id} className="text-xs opacity-75">
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Resolved</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {alert.alertType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">{alert.message}</TableCell>
                    <TableCell className="font-medium text-slate-600">{alert.outlet.name}</TableCell>
                    <TableCell className="text-right text-slate-500">
                      {new Date(alert.triggeredAt).toLocaleDateString("id-ID", {
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
