import { getProducts } from "@/modules/products/actions/product-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import RecipeDialog from "@/components/products/RecipeDialog"

export const metadata = {
  title: "Resep & Bill of Materials (BOM) | IBMS",
}

export default async function RecipesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const products = await getProducts()
  const rawMaterials = products.filter((p) => p.type === "RAW_MATERIAL")
  const finishedGoods = products.filter((p) => p.type === "FINISHED_GOOD")

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Katalog Resep & Bill of Materials (BOM)</h1>
            <p className="text-muted-foreground text-sm">
              Standarisasi gramasi bahan baku, kalkulasi HPP otomatis, dan Food Cost Percentage.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {finishedGoods.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Belum ada produk jadi yang terdaftar. Tambahkan produk jadi di halaman master produk terlebih dahulu.
            </CardContent>
          </Card>
        ) : (
          finishedGoods.map((item) => {
            const recipe = item.recipe
            const fcPercent =
              item.sellingPrice > 0 && item.standardCost > 0
                ? (item.standardCost / item.sellingPrice) * 100
                : 0

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50/70 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.sku}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Kategori: {item.category?.name || "-"} • Yield: {recipe?.yieldQuantity || 1} {recipe?.yieldUnit || item.unit}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Harga Jual: <span className="font-bold text-slate-900">{formatCurrency(item.sellingPrice)}</span></div>
                        <div className="text-xs text-slate-500">HPP / Porsi: <span className="font-bold text-[#2A7C13]">{formatCurrency(item.standardCost)}</span></div>
                      </div>

                      <Badge
                        variant={fcPercent > 35 ? "destructive" : "default"}
                        className={`text-sm px-3 py-1 ${fcPercent <= 35 && fcPercent > 0 ? "bg-[#2A7C13] text-white" : ""}`}
                      >
                        {fcPercent > 0 ? `${fcPercent.toFixed(1)}% FC` : "Belum Ada BOM"}
                      </Badge>

                      <RecipeDialog
                        productId={item.id}
                        productName={item.name}
                        sellingPrice={item.sellingPrice}
                        rawMaterials={rawMaterials}
                        existingRecipe={recipe}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {!recipe || !recipe.ingredients || recipe.ingredients.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Menu ini belum memiliki komposisi bahan baku (BOM). Klik tombol <b>BOM Resep</b> untuk menyusun formulanya.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/30">
                          <TableHead className="text-xs">Bahan Baku</TableHead>
                          <TableHead className="text-xs">Kode Bahan</TableHead>
                          <TableHead className="text-xs text-right">Kebutuhan Gramasi</TableHead>
                          <TableHead className="text-xs text-right">Biaya Satuan</TableHead>
                          <TableHead className="text-xs text-right">Subtotal Biaya</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipe.ingredients.map((ing) => {
                          const unitCost = ing.costPerUnit || ing.rawMaterial?.standardCost || 0
                          const subtotal = ing.quantity * unitCost
                          return (
                            <TableRow key={ing.id} className="text-xs">
                              <TableCell className="font-medium">{ing.rawMaterial?.name}</TableCell>
                              <TableCell className="font-mono text-slate-500">{ing.rawMaterial?.code}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {ing.quantity} {ing.unit}
                              </TableCell>
                              <TableCell className="text-right text-slate-600">
                                {formatCurrency(unitCost)} / {ing.unit}
                              </TableCell>
                              <TableCell className="text-right font-bold text-slate-900">
                                {formatCurrency(subtotal)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
