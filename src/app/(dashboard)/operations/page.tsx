import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getOutletInventory, getTodayChecklists, getChecklistTemplates } from "@/modules/operations/actions/inventory-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckSquare, ClipboardList, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import StockAdjustDialog from "@/components/operations/StockAdjustDialog"
import ChecklistSubmitCard from "@/components/operations/ChecklistSubmitCard"

export const metadata = {
  title: "Operasional Outlet | IBMS",
}

export default async function OperationsDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const defaultOutlet = await prisma.outlet.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  const outletId = effectiveOutlet.outletId || defaultOutlet?.id

  if (!outletId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Belum ada outlet aktif.</h2>
        <p className="text-muted-foreground text-sm">Daftarkan outlet terlebih dahulu di Administrasi Sistem.</p>
      </div>
    )
  }

  const [inventory, todayChecklists, checklistTemplates, wasteCount] = await Promise.all([
    getOutletInventory(outletId),
    getTodayChecklists(outletId),
    getChecklistTemplates(),
    prisma.wasteLog.count({
      where: {
        outletId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  // Filter bahan baku kritis (di bawah safety stock)
  const criticalItems = inventory.filter((item) => item.currentStock <= item.minBufferStock)

  // Ambil produk master untuk opsi di StockAdjustDialog
  const allProducts = await prisma.productItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  const productOptions = allProducts.map((p) => {
    const inv = inventory.find((i) => i.productId === p.id)
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit,
      currentStock: inv ? inv.currentStock : 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operasional Cabang</h1>
          <p className="text-muted-foreground">
            Pantau inventaris, stok menipis (Safety Stock), waste, dan checklist SOP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/operations/inventory">
            <Button variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" /> Kelola Stok
            </Button>
          </Link>
          <StockAdjustDialog outletId={outletId} products={productOptions} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={criticalItems.length > 0 ? "border-red-200 bg-red-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Peringatan Stok (Safety Stock)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{criticalItems.length} Item</div>
            <p className="text-xs text-red-600/80">
              {criticalItems.length > 0
                ? "Bahan baku di bawah batas minimum"
                : "Semua stok dalam batas aman"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item Terpantau</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">Tercatat di gudang cabang ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bahan Terbuang (Waste)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wasteCount} Log</div>
            <p className="text-xs text-muted-foreground">Insiden waste tercatat hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checklist SOP Hari Ini</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayChecklists.length} Selesai</div>
            <p className="text-xs text-muted-foreground">Opening / Closing diverifikasi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stok Kritis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base text-red-800 flex items-center gap-2">
                <AlertTriangle size={18} /> Stok Kritis (Perlu Restock Segera)
              </CardTitle>
              <CardDescription className="text-xs">
                Item bahan baku dengan jumlah di bawah batas aman minimum.
              </CardDescription>
            </div>
            <Link href="/operations/inventory">
              <Button variant="ghost" size="sm" className="text-xs">
                Lihat Semua <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {criticalItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Semua bahan baku saat ini berada di atas batas safety stock minimum.
              </div>
            ) : (
              <div className="space-y-3">
                {criticalItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Min. Buffer: {item.minBufferStock} {item.unit}
                      </p>
                    </div>
                    <Badge variant="destructive" className="font-semibold">
                      Sisa: {item.currentStock} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulir Checklist SOP Interaktif */}
        <ChecklistSubmitCard outletId={outletId} templates={checklistTemplates} />
      </div>

      {/* Riwayat Checklist SOP Hari Ini */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kepatuhan SOP Checklist Hari Ini</CardTitle>
          <CardDescription>
            Daftar laporan kepatuhan opening dan closing yang telah dikirim tim cabang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayChecklists.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Belum ada checklist SOP yang diserahkan hari ini.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {todayChecklists.map((chk) => (
                <div key={chk.id} className="p-3 rounded-lg border bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{chk.template.title}</span>
                    <Badge className={chk.scorePct === 100 ? "bg-[#2A7C13]" : "bg-amber-500"}>
                      Skor: {chk.scorePct.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Oleh: {chk.submittedBy.name} • {new Date(chk.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </p>
                  {chk.notes && (
                    <p className="text-xs italic text-slate-600 bg-white p-2 rounded border mt-1">
                      &quot;{chk.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
