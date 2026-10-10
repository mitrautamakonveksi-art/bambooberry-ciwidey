"use client"

import { useState } from "react"
import { submitDailySales } from "@/modules/finance/actions/finance-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, X, AlertTriangle, Calculator } from "lucide-react"

interface OutletOption {
  id: string
  name: string
}

export default function DailySalesModal({
  outlets,
  defaultOutletId,
}: {
  outlets: OutletOption[]
  defaultOutletId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [outletId, setOutletId] = useState(defaultOutletId || outlets[0]?.id || "")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [cashAmount, setCashAmount] = useState<number>(0)
  const [edcAmount, setEdcAmount] = useState<number>(0)
  const [qrisAmount, setQrisAmount] = useState<number>(0)
  const [actualCashInDrawer, setActualCashInDrawer] = useState<number>(0)
  const [notes, setNotes] = useState<string>("")

  // Live calculation selisih kas
  const cashDifference = actualCashInDrawer - cashAmount
  const nonCashTotal = edcAmount + qrisAmount
  const paymentSum = cashAmount + nonCashTotal

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!outletId) {
      alert("Harap pilih outlet terlebih dahulu")
      return
    }

    if (totalRevenue <= 0) {
      alert("Total revenue penjualan harus lebih dari 0")
      return
    }

    setIsLoading(true)
    try {
      await submitDailySales({
        outletId,
        date,
        totalRevenue,
        cashAmount,
        edcAmount,
        qrisAmount,
        actualCashInDrawer,
        notes,
      })

      setIsOpen(false)
      alert("Settlement rekonsiliasi harian berhasil disimpan!")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan settlement harian")
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
        <PlusCircle className="mr-2 h-4 w-4" /> Input Settlement Baru
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator size={20} className="text-[#2A7C13]" /> Input Rekonsiliasi POS (End of Day)
                </CardTitle>
                <CardDescription className="text-xs">
                  Rekap penjualan harian, settlement EDC/QRIS, dan hitung selisih kas fisik laci.
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Outlet Cabang</Label>
                    <Select value={outletId} onValueChange={(val) => setOutletId(val)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih Outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal Penjualan</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Total Omset Kotor POS (Gross Sales)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="mis. 4500000"
                    value={totalRevenue || ""}
                    onChange={(e) => setTotalRevenue(parseFloat(e.target.value) || 0)}
                    required
                    className="font-semibold text-slate-900"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
                  <div className="text-xs font-semibold text-slate-700">Rincian Metode Pembayaran:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Setoran Tunai</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={cashAmount || ""}
                        onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">Mesin EDC Kartu</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={edcAmount || ""}
                        onChange={(e) => setEdcAmount(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">QRIS (BCA/Gopay)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={qrisAmount || ""}
                        onChange={(e) => setQrisAmount(parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {totalRevenue > 0 && Math.abs(paymentSum - totalRevenue) > 100 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                      <AlertTriangle size={14} /> Total rincian pembayaran ({formatCurrency(paymentSum)}) belum sama persis dengan Total Omset POS ({formatCurrency(totalRevenue)}).
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-emerald-900">
                      Hitung Kas Fisik Aktual di Laci (Drawer):
                    </Label>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Wajib setoran tunai: {formatCurrency(cashAmount)}
                    </span>
                  </div>

                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Masukkan jumlah uang kertas + koin fisik di laci"
                    value={actualCashInDrawer || ""}
                    onChange={(e) => setActualCashInDrawer(parseFloat(e.target.value) || 0)}
                    required
                    className="font-bold text-base text-slate-900"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-slate-600">Selisih Kas Fisik:</span>
                    <Badge
                      className={
                        cashDifference === 0
                          ? "bg-[#2A7C13] text-white"
                          : cashDifference > 0
                          ? "bg-blue-600 text-white"
                          : cashDifference < -50000
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-amber-500 text-white"
                      }
                    >
                      {cashDifference === 0
                        ? "PAS (TIDAK ADA SELISIH)"
                        : `${cashDifference > 0 ? "+" : ""}${formatCurrency(cashDifference)}`}
                    </Badge>
                  </div>

                  {cashDifference < -50000 && (
                    <p className="text-[11px] text-red-600 font-medium">
                      ⚠️ Selisih minus lebih dari Rp 50.000 akan memicu notifikasi peringatan dini (Early Warning Alert) ke Owner/Manager.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Catatan Shift / Keterangan Tambahan</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="mis. Settlement EDC batch 41 berhasil, ada retur 1 cup struk no. 104..."
                    className="text-xs"
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
                    {isLoading ? "Menyimpan..." : "Kirim Settlement Harian"}
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
