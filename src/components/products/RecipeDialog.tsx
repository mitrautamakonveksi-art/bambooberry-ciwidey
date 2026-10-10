"use client"

import { useState } from "react"
import { upsertRecipe } from "@/modules/products/actions/product-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Trash2, X, Calculator } from "lucide-react"

interface RawMaterialOption {
  id: string
  code: string
  name: string
  unit: string
  standardCost: number
}

interface IngredientRow {
  rawMaterialId: string
  quantity: number
  unit: string
  costPerUnit: number
}

export default function RecipeDialog({
  productId,
  productName,
  sellingPrice,
  rawMaterials,
  existingRecipe,
}: {
  productId: string
  productName: string
  sellingPrice: number
  rawMaterials: RawMaterialOption[]
  existingRecipe?: {
    id: string
    yieldQuantity: number
    yieldUnit: string
    laborCostEstimate: number
    totalHpp: number
    ingredients: {
      rawMaterialId: string
      quantity: number
      unit: string
      costPerUnit: number
    }[]
  } | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [yieldQuantity, setYieldQuantity] = useState(existingRecipe?.yieldQuantity || 1)
  const [yieldUnit, setYieldUnit] = useState(existingRecipe?.yieldUnit || "PORSI")
  const [laborCost, setLaborCost] = useState(existingRecipe?.laborCostEstimate || 0)

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    existingRecipe?.ingredients && existingRecipe.ingredients.length > 0
      ? existingRecipe.ingredients.map((i) => ({
          rawMaterialId: i.rawMaterialId,
          quantity: i.quantity,
          unit: i.unit,
          costPerUnit: i.costPerUnit,
        }))
      : [
          {
            rawMaterialId: rawMaterials[0]?.id || "",
            quantity: 1,
            unit: rawMaterials[0]?.unit || "GRAM",
            costPerUnit: rawMaterials[0]?.standardCost || 0,
          },
        ]
  )

  const handleAddIngredient = () => {
    const firstRaw = rawMaterials[0]
    setIngredients([
      ...ingredients,
      {
        rawMaterialId: firstRaw?.id || "",
        quantity: 1,
        unit: firstRaw?.unit || "GRAM",
        costPerUnit: firstRaw?.standardCost || 0,
      },
    ])
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (index: number, rawMaterialId: string) => {
    const selected = rawMaterials.find((r) => r.id === rawMaterialId)
    const updated = [...ingredients]
    updated[index] = {
      ...updated[index],
      rawMaterialId,
      unit: selected?.unit || "GRAM",
      costPerUnit: selected?.standardCost || 0,
    }
    setIngredients(updated)
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...ingredients]
    updated[index] = {
      ...updated[index],
      quantity,
    }
    setIngredients(updated)
  }

  // Kalkulasi live biaya bahan baku
  const totalBOMCost = ingredients.reduce(
    (acc, item) => acc + item.quantity * item.costPerUnit,
    0
  )
  const costPerPortion = (totalBOMCost + laborCost) / (yieldQuantity > 0 ? yieldQuantity : 1)
  const foodCostPct = sellingPrice > 0 ? (costPerPortion / sellingPrice) * 100 : 0

  const handleSave = async () => {
    if (ingredients.length === 0) {
      alert("Harap masukkan minimal 1 bahan baku dalam resep")
      return
    }

    setIsLoading(true)
    try {
      await upsertRecipe({
        finishedProductId: productId,
        yieldQuantity,
        yieldUnit,
        laborCostEstimate: laborCost,
        ingredients,
      })

      setIsOpen(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan resep")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-[#2A7C13] hover:text-[#2A7C13]/80 hover:bg-[#2A7C13]/10"
      >
        <Calculator className="h-4 w-4 mr-1" /> BOM Resep
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="text-[#2A7C13]" size={20} /> Resep & Bill of Materials (BOM)
                </CardTitle>
                <CardDescription className="text-xs">
                  {productName} • Harga Jual: {formatCurrency(sellingPrice)}
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

            <CardContent className="space-y-4">
              {/* Hasil Kalkulasi Otomatis */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border text-center">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Total Bahan Baku</div>
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(totalBOMCost)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">HPP per Porsi</div>
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(costPerPortion)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Food Cost %</div>
                  <div className="flex items-center justify-center gap-1">
                    <Badge
                      variant={foodCostPct > 35 ? "destructive" : "default"}
                      className={foodCostPct <= 35 ? "bg-[#2A7C13] text-white" : ""}
                    >
                      {foodCostPct.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Yield & Labor Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Hasil Porsi (Yield)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Satuan Hasil</Label>
                  <Input
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    placeholder="PORSI / CUP"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Biaya Tenaga / Overh. (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Komposisi Bahan Baku */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Komposisi Bahan Baku (BOM):</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                    className="h-7 text-xs"
                  >
                    <Plus size={14} className="mr-1" /> Tambah Bahan
                  </Button>
                </div>

                {ingredients.map((ing, idx) => {
                  const subtotal = ing.quantity * ing.costPerUnit
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-white">
                      <div className="flex-1">
                        <Select
                          value={ing.rawMaterialId}
                          onValueChange={(val) => handleIngredientChange(idx, val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Pilih Bahan Baku" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({r.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={ing.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          placeholder="Jumlah"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="w-16 text-center text-xs text-slate-500 font-medium">
                        {ing.unit}
                      </div>

                      <div className="w-28 text-right text-xs font-semibold text-slate-700">
                        {formatCurrency(subtotal)}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveIngredient(idx)}
                        disabled={ingredients.length <= 1}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Menyimpan..." : "Simpan Komposisi & Hitung HPP"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
