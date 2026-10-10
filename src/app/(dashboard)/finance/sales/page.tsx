import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getDailySalesSettlements } from "@/modules/finance/actions/finance-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DailySalesModal from "@/components/finance/DailySalesModal"

export const metadata = {
  title: "Rekonsiliasi POS Harian | Finance | IBMS",
}

export default async function SalesReconciliationPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const defaultOutlet = await prisma.outlet.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  const outletId = effectiveOutlet.outletId || defaultOutlet?.id

  const [settlements, outlets] = await Promise.all([
    getDailySalesSettlements(effectiveOutlet.outletId),
    prisma.outlet.findMany({ where: { isActive: true } }),
  ])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rekonsiliasi POS & Kasir Harian</h1>
            <p className="text-muted-foreground text-sm">
              Input data penutupan kasir akhir hari (End of Day Settlement) dan audit selisih kas fisik laci.
            </p>
          </div>
        </div>
        <DailySalesModal outlets={outlets} defaultOutletId={outletId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Settlement Penjualan</CardTitle>
          <CardDescription>
            Rekap pendapatan, penerimaan metode pembayaran, dan selisih kas fisik laci kasir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead className="text-right">Total Omset POS</TableHead>
                  <TableHead className="text-right">Setoran Tunai</TableHead>
                  <TableHead className="text-right">Non-Tunai (EDC/QRIS)</TableHead>
                  <TableHead className="text-right">Selisih Kas Fisik</TableHead>
                  <TableHead>Status Audit</TableHead>
                  <TableHead>Catatan Shift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada rekaman rekonsiliasi harian. Silakan klik tombol <b>Input Settlement Baru</b>.
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((s) => {
                    const isMatched = Math.abs(s.discrepancyAmount) <= 1000
                    const isCriticalLoss = s.discrepancyAmount < -50000

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-medium">
                          {new Date(s.reconDate).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{s.outlet.name}</TableCell>
                        <TableCell className="text-right font-bold text-xs text-slate-900">
                          {formatCurrency(s.posNetSales)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatCurrency(s.cashCollected)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-600">
                          {formatCurrency(s.edcCollected + s.qrisCollected)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          <span
                            className={
                              isMatched
                                ? "text-[#2A7C13]"
                                : isCriticalLoss
                                ? "text-red-600 font-black"
                                : "text-amber-600"
                            }
                          >
                            {isMatched
                              ? "Rp 0 (Pas)"
                              : `${s.discrepancyAmount > 0 ? "+" : ""}${formatCurrency(s.discrepancyAmount)}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isMatched
                                ? "bg-[#2A7C13] text-white"
                                : isCriticalLoss
                                ? "bg-red-600 text-white animate-pulse"
                                : "bg-amber-500 text-white"
                            }
                          >
                            {isMatched ? "MATCHED" : isCriticalLoss ? "KRITIS (ALERT)" : "SELISIH"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {s.discrepancyNotes || "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
