"use client"

import { useState } from "react"
import { recordCustomerVisit } from "@/modules/marketing/actions/marketing-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, X } from "lucide-react"

interface OutletOption {
  id: string
  name: string
}

export default function CustomerVisitModal({
  outlets,
  defaultOutletId,
}: {
  outlets: OutletOption[]
  defaultOutletId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [outletId, setOutletId] = useState(defaultOutletId || outlets[0]?.id || "")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [pax, setPax] = useState<number>(2)
  const [billTotal, setBillTotal] = useState<number>(150000)
  const [channel, setChannel] = useState<
    "GMAPS" | "INSTAGRAM" | "TIKTOK" | "TOUR_GUIDE" | "LOCAL_RECOMMENDATION" | "WALK_IN" | "OTHER"
  >("GMAPS")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!phone || phone.length < 8) {
      alert("Masukkan nomor telepon/WA yang valid")
      return
    }

    setIsLoading(true)
    try {
      await recordCustomerVisit({
        outletId,
        phone,
        name: name || undefined,
        visitDate: new Date().toISOString().split("T")[0],
        pax,
        billTotal,
        acquisitionChannel: channel,
      })

      setIsOpen(false)
      setPhone("")
      setName("")
      alert("Kunjungan tamu & atribusi channel berhasil dicatat!")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mencatat kunjungan tamu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-slate-300"
      >
        <UserCheck className="mr-2 h-4 w-4" /> Catat Kedatangan Tamu
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck size={20} className="text-[#2A7C13]" /> Catat Atribusi Tamu Baru
                </CardTitle>
                <CardDescription className="text-xs">
                  Ketahui dari mana tamu mengetahui BAMBOOBERRY (tanpa memberi diskon murah).
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">No. WhatsApp / Telepon</Label>
                    <Input
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Tamu (Opsional)</Label>
                    <Input
                      placeholder="Bpk / Ibu..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800">
                    Sumber Kedatangan (Channel Akuisisi)
                  </Label>
                  <Select
                    value={channel}
                    onValueChange={(val) =>
                      setChannel(
                        val as "GMAPS" | "INSTAGRAM" | "TIKTOK" | "TOUR_GUIDE" | "LOCAL_RECOMMENDATION" | "WALK_IN" | "OTHER"
                      )
                    }
                  >
                    <SelectTrigger className="h-9 text-xs font-medium">
                      <SelectValue placeholder="Pilih Sumber" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GMAPS">Google Maps (Cari Kafe / Resto Ciwidey)</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram (Reels / Feed / Stories)</SelectItem>
                      <SelectItem value="TIKTOK">TikTok (Video Rekomendasi FYP)</SelectItem>
                      <SelectItem value="TOUR_GUIDE">Rekomendasi Tour Guide Wisata</SelectItem>
                      <SelectItem value="LOCAL_RECOMMENDATION">Rekomendasi Warga / Hotel Sekitar</SelectItem>
                      <SelectItem value="WALK_IN">Walk-in (Kebetulan Lewat Jalan Raya)</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jumlah Rombongan (Pax)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={pax}
                      onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                      required
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Total Bill (Rp)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="5000"
                      value={billTotal}
                      onChange={(e) => setBillTotal(parseFloat(e.target.value) || 0)}
                      required
                      className="text-xs font-semibold"
                    />
                  </div>
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
                    {isLoading ? "Menyimpan..." : "Simpan Data Kunjungan"}
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
