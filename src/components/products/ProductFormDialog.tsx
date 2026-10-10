"use client"

import { useState } from "react"
import { upsertProduct } from "@/modules/products/actions/product-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"

interface CategoryOption {
  id: string
  name: string
}

export default function ProductFormDialog({
  categories,
}: {
  categories: CategoryOption[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [productType, setProductType] = useState<"FINISHED_GOOD" | "RAW_MATERIAL" | "SEMI_FINISHED">("FINISHED_GOOD")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await upsertProduct({
        categoryId: formData.get("categoryId") as string,
        code: formData.get("code") as string,
        name: formData.get("name") as string,
        type: productType,
        unit: formData.get("unit") as string,
        standardCost: parseFloat(formData.get("standardCost") as string) || 0,
        sellingPrice: productType === "FINISHED_GOOD" ? parseFloat(formData.get("sellingPrice") as string) || 0 : 0,
      })

      setIsOpen(false)
      form.reset()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan data produk")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white"
      >
        <Plus className="mr-2 h-4 w-4" /> Tambah Produk
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Tambah Produk / Bahan Baku</CardTitle>
                <CardDescription className="text-xs">
                  Daftarkan menu atau bahan baku inventaris baru ke sistem BAMBOOBERRY.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-500"
              >
                <X size={18} />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Tipe Produk</Label>
                  <Select
                    value={productType}
                    onValueChange={(val) => setProductType(val as "FINISHED_GOOD" | "RAW_MATERIAL" | "SEMI_FINISHED")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINISHED_GOOD">Menu Siap Jual (Finished Good)</SelectItem>
                      <SelectItem value="RAW_MATERIAL">Bahan Baku Mentah (Raw Material)</SelectItem>
                      <SelectItem value="SEMI_FINISHED">Olahan Setengah Jadi (Semi Finished)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Kategori Produk</Label>
                  <Select name="categoryId" required defaultValue={categories[0]?.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Kode / SKU</Label>
                    <Input
                      name="code"
                      placeholder={productType === "FINISHED_GOOD" ? "MNU-STRW-01" : "RAW-SUSU-01"}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Satuan (UoM)</Label>
                    <Input
                      name="unit"
                      placeholder={productType === "FINISHED_GOOD" ? "PORSI / CUP" : "KG / LITER"}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Nama Produk / Bahan</Label>
                  <Input
                    name="name"
                    placeholder="mis. Strawberry Milkshake Special Ciwidey"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Harga Modal (HPP)</Label>
                    <Input
                      name="standardCost"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      required
                    />
                  </div>
                  {productType === "FINISHED_GOOD" && (
                    <div className="space-y-1.5">
                      <Label>Harga Jual (Rp)</Label>
                      <Input
                        name="sellingPrice"
                        type="number"
                        min="0"
                        step="500"
                        placeholder="25000"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Produk"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
