import { getProducts, getProductCategories } from "@/modules/products/actions/product-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import ProductFormDialog from "@/components/products/ProductFormDialog"
import RecipeDialog from "@/components/products/RecipeDialog"

export const metadata = {
  title: "Produk & Menu | IBMS",
}

export default async function ProductsDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const [products, categories] = await Promise.all([
    getProducts(),
    getProductCategories(),
  ])

  const rawMaterials = products.filter((p) => p.type === "RAW_MATERIAL")
  const finishedGoods = products.filter((p) => p.type === "FINISHED_GOOD")

  // Hitung rata-rata Food Cost % untuk produk jadi yang memiliki harga jual
  const goodsWithFc = finishedGoods.filter((p) => p.sellingPrice > 0 && p.standardCost > 0)
  const avgFoodCost =
    goodsWithFc.length > 0
      ? goodsWithFc.reduce((acc, p) => acc + (p.standardCost / p.sellingPrice) * 100, 0) /
        goodsWithFc.length
      : 0

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk & Menu</h1>
          <p className="text-muted-foreground">
            Kelola data master bahan baku, resep (BOM), dan kalkulasi HPP / Food Cost.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/recipes">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" /> Resep BOM
            </Button>
          </Link>
          <ProductFormDialog categories={categories} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bahan Baku (Raw)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rawMaterials.length}</div>
            <p className="text-xs text-muted-foreground">Item dikelola di inventaris</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Menu (Finished Goods)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedGoods.length}</div>
            <p className="text-xs text-muted-foreground">Menu aktif untuk dijual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Food Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                avgFoodCost > 0 && avgFoodCost <= 35 ? "text-green-600" : avgFoodCost > 35 ? "text-red-600" : "text-slate-600"
              }`}
            >
              {avgFoodCost > 0 ? `${avgFoodCost.toFixed(1)}%` : "--%"}
            </div>
            <p className="text-xs text-muted-foreground">Rata-rata dari seluruh menu</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Master Menu (Finished Goods) */}
      <Card>
        <CardHeader>
          <CardTitle>Master Menu (Finished Goods)</CardTitle>
          <CardDescription>
            Daftar menu dengan perhitungan harga modal berdasarkan Bill of Materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Menu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Harga Modal (HPP)</TableHead>
                  <TableHead>Food Cost %</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finishedGoods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Belum ada data menu jadi. Klik tombol <b>Tambah Produk</b> untuk mendaftarkan menu.
                    </TableCell>
                  </TableRow>
                ) : (
                  finishedGoods.map((item) => {
                    const fcPercent =
                      item.sellingPrice > 0 ? (item.standardCost / item.sellingPrice) * 100 : 0
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sku}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">Satuan: {item.unit}</div>
                        </TableCell>
                        <TableCell>{item.category?.name || "-"}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(item.sellingPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.standardCost)}</TableCell>
                        <TableCell>
                          {fcPercent > 0 ? (
                            <Badge
                              variant={fcPercent > 35 ? "destructive" : "default"}
                              className={fcPercent <= 35 ? "bg-[#2A7C13] text-white" : ""}
                            >
                              {fcPercent.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum dihitung</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <RecipeDialog
                            productId={item.id}
                            productName={item.name}
                            sellingPrice={item.sellingPrice}
                            rawMaterials={rawMaterials}
                            existingRecipe={item.recipe}
                          />
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

      {/* Tabel Master Bahan Baku (Raw Materials) */}
      <Card>
        <CardHeader>
          <CardTitle>Master Bahan Baku (Raw Materials)</CardTitle>
          <CardDescription>
            Bahan baku pembentuk resep dan item yang dikontrol persediaannya di gudang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Bahan</TableHead>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan UoM</TableHead>
                  <TableHead>Standard Cost (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Belum ada bahan baku. Tambahkan bahan mentah untuk mulai meracik resep.
                    </TableCell>
                  </TableRow>
                ) : (
                  rawMaterials.map((raw) => (
                    <TableRow key={raw.id}>
                      <TableCell className="font-mono text-xs">{raw.code}</TableCell>
                      <TableCell className="font-medium">{raw.name}</TableCell>
                      <TableCell>{raw.category?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{raw.unit}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {formatCurrency(raw.standardCost)} / {raw.unit}
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
