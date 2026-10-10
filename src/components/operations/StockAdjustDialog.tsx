"use client"

import { useState } from "react"
import { adjustStock } from "@/modules/operations/actions/inventory-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { X, ArrowUpDown } from "lucide-react"

interface ProductOption {
  id: string
  code: string
  name: string
  unit: string
  currentStock: number
}

export default function StockAdjustDialog({
  outletId,
  products,
}: {
  outletId: string
  products: ProductOption[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "")
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "WASTE" | "OPNAME">("IN")

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProductId) {
      alert("Pilih produk terlebih dahulu")
      return
    }

    setIsLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    const quantity = parseFloat(formData.get("quantity") as string) || 0
    const reason = formData.get("reason") as string

    try {
      await adjustStock(outletId, selectedProductId, quantity, adjustType, reason)
      setIsOpen(false)
      form.reset()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal melakukan penyesuaian stok")
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
        <ArrowUpDown className="mr-2 h-4 w-4" /> Sesuaikan Stok
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Penyesuaian Stok Fisik</CardTitle>
                <CardDescription className="text-xs">
                  Catat barang masuk, keluar, waste rusak, atau hasil opname.
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
                  <Label>Item Bahan / Menu</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={(val) => setSelectedProductId(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Item Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Sisa: {p.currentStock} {p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Jenis Penyesuaian</Label>
                  <Select
                    value={adjustType}
                    onValueChange={(val) => setAdjustType(val as "IN" | "OUT" | "WASTE" | "OPNAME")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Barang Masuk / Restock (+)</SelectItem>
                      <SelectItem value="OUT">Barang Keluar / Pemakaian (-)</SelectItem>
                      <SelectItem value="WASTE">Bahan Rusak / Waste Kadaluarsa (-)</SelectItem>
                      <SelectItem value="OPNAME">Koreksi Opname Fisik (Set Nilai)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {adjustType === "OPNAME" ? "Total Stok Fisik Aktual" : "Jumlah / Kuantitas"} ({selectedProduct?.unit || "Unit"})
                  </Label>
                  <Input
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="mis. 5.5"
                    required
                  />
                  {adjustType === "OPNAME" && selectedProduct && (
                    <p className="text-[11px] text-slate-500">
                      Stok tercatat sistem saat ini: <b>{selectedProduct.currentStock} {selectedProduct.unit}</b>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Keterangan / Alasan</Label>
                  <Textarea
                    name="reason"
                    placeholder="mis. Kiriman PO Supplier / Buah busuk tersortir / Hasil hitung fisik closing"
                    required
                  />
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
                    {isLoading ? "Menyimpan..." : "Eksekusi Penyesuaian"}
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
