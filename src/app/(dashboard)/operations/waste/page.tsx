import { getCurrentUser } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { getWasteLogs } from "@/modules/operations/actions/inventory-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Pencatatan Waste & Bahan Rusak | IBMS",
}

export default async function WastePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const wasteLogs = await getWasteLogs()

  const totalWasteLoss = wasteLogs.reduce((acc, log) => acc + log.costAmount, 0)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/operations">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pencatatan Bahan Terbuang (Waste Log)</h1>
            <p className="text-muted-foreground text-sm">
              Pantau insiden bahan baku rusak, kadaluarsa, gagal olah, dan kerugian finansialnya.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">
              Total Kerugian Finansial Waste
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {formatCurrency(totalWasteLoss)}
            </div>
            <p className="text-xs text-amber-700/80">Akumulasi biaya modal bahan baku terbuang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insiden Tercatat</CardTitle>
            <Badge variant="outline">{wasteLogs.length} Kasus</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wasteLogs.length}</div>
            <p className="text-xs text-muted-foreground">Catatan pemusnahan bahan dari seluruh outlet</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buku Log Pemusnahan / Bahan Rusak</CardTitle>
          <CardDescription>
            Audit riwayat bahan baku yang dibuang beserta alasan dan penanggung jawabnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Bahan Baku</TableHead>
                  <TableHead className="text-right">Jumlah Terbuang</TableHead>
                  <TableHead className="text-right">Biaya Kerugian</TableHead>
                  <TableHead>Alasan / Keterangan</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada data pembuangan bahan (waste log) yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  wasteLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.date).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{log.outlet.name}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">{log.product.name}</div>
                        <div className="text-[10px] text-slate-500">{log.product.category?.name}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 text-xs">
                        {log.quantity} {log.unit}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 text-xs">
                        {formatCurrency(log.costAmount)}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-slate-700">
                        {log.reason}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {log.recordedBy.name}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
