import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getOutletInventory } from "@/modules/operations/actions/inventory-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import StockAdjustDialog from "@/components/operations/StockAdjustDialog"

export const metadata = {
  title: "Inventaris Outlet & Stok Fisik | IBMS",
}

export default async function InventoryPage() {
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
      </div>
    )
  }

  const [inventory, allProducts, outlet] = await Promise.all([
    getOutletInventory(outletId),
    prisma.productItem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.outlet.findUnique({
      where: { id: outletId },
    }),
  ])

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

  // Total estimasi valuasi stok
  const totalInventoryValue = inventory.reduce(
    (acc, item) => acc + item.currentStock * item.product.standardCost,
    0
  )

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
            <h1 className="text-2xl font-bold tracking-tight">Inventaris & Stok Bahan: {outlet?.name}</h1>
            <p className="text-muted-foreground text-sm">
              Pantau kuantitas fisik, safety buffer, dan penyesuaian stok bahan baku.
            </p>
          </div>
        </div>

        <StockAdjustDialog outletId={outletId} products={productOptions} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Item di Gudang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length} Item</div>
            <p className="text-xs text-muted-foreground">Bahan baku terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Item Stok Kritis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventory.filter((i) => i.currentStock <= i.minBufferStock).length} Item
            </div>
            <p className="text-xs text-muted-foreground">Di bawah batas buffer minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimasi Valuasi Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2A7C13]">
              {formatCurrency(totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">Berdasarkan standard cost HPP</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Stok Bahan Baku & Barang Cabang</CardTitle>
          <CardDescription>
            Informasi kuantitas aktual, satuan UoM, dan status batas aman stok.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Produk / Bahan</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Stok Aktual</TableHead>
                  <TableHead className="text-right">Min. Safety Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valuasi (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada stok bahan tercatat di outlet ini. Gunakan tombol <b>Sesuaikan Stok</b> untuk memasukkan stok awal.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => {
                    const isCritical = item.currentStock <= item.minBufferStock
                    const valuation = item.currentStock * item.product.standardCost

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.product.code}</TableCell>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{item.product.category?.name || "-"}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {item.currentStock} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-slate-500">
                          {item.minBufferStock} {item.unit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isCritical ? "destructive" : "default"}
                            className={!isCritical ? "bg-[#2A7C13] text-white" : ""}
                          >
                            {isCritical ? "KRITIS" : "AMAN"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(valuation)}
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
