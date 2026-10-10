"use client"

import { useState } from "react"
import { submitExpenseRequest } from "@/modules/finance/actions/expense-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Receipt, ShieldAlert } from "lucide-react"

interface OutletOption {
  id: string
  name: string
}

export default function ExpenseRequestModal({
  outlets,
  defaultOutletId,
}: {
  outlets: OutletOption[]
  defaultOutletId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [outletId, setOutletId] = useState(defaultOutletId || outlets[0]?.id || "")
  const [category, setCategory] = useState("Bahan Baku Darurat")
  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [proofUrl, setProofUrl] = useState("")

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!outletId) {
      alert("Pilih outlet terlebih dahulu")
      return
    }

    if (amount <= 0) {
      alert("Nominal pengeluaran harus lebih besar dari Rp 0")
      return
    }

    if (description.trim().length < 5) {
      alert("Deskripsi pengeluaran minimal 5 karakter")
      return
    }

    setIsLoading(true)
    try {
      await submitExpenseRequest({
        outletId,
        category,
        amount,
        description,
        proofUrl: proofUrl || undefined,
      })

      setIsOpen(false)
      setDescription("")
      setAmount(0)
      setProofUrl("")
      alert("Pengajuan biaya operasional berhasil dikirim dan menunggu persetujuan.")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengajukan biaya")
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
        <Plus className="mr-2 h-4 w-4" /> Ajukan Pengeluaran
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt size={20} className="text-[#2A7C13]" /> Pengajuan Biaya Operasional
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajukan kasbon / belanja darurat outlet untuk disetujui Manager atau Owner.
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
                  <Label className="text-xs">Kategori Beban</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bahan Baku Darurat">Bahan Baku Darurat (Restock Cepat)</SelectItem>
                      <SelectItem value="Gas & Utilitas">Gas LPG & Utilitas Dapur</SelectItem>
                      <SelectItem value="Kebersihan & Sanitasi">Kebersihan, Plastik & Sanitasi</SelectItem>
                      <SelectItem value="Pemeliharaan Alat">Pemeliharaan & Servis Alat</SelectItem>
                      <SelectItem value="Transportasi & Logistik">Transportasi & Pengiriman</SelectItem>
                      <SelectItem value="Beban Operasional Lainnya">Beban Operasional Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Nominal Pengeluaran (Rp)</Label>
                    {amount > 1000000 && (
                      <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1">
                        <ShieldAlert size={12} /> Tier 2: Butuh Approval Owner
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="number"
                    min="1"
                    step="1000"
                    placeholder="mis. 250000"
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    required
                    className="font-bold text-base"
                  />
                  {amount > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Terbilang: {formatCurrency(amount)}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Keperluan / Deskripsi Rinci</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="mis. Beli es batu kristal 5 karung karena mesin ice maker sedang error..."
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Link Bukti Struk / Nota (Opsional)</Label>
                  <Input
                    type="url"
                    placeholder="https://... (Foto nota / tanda terima)"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
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
                    {isLoading ? "Mengirim..." : "Kirim Pengajuan"}
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
