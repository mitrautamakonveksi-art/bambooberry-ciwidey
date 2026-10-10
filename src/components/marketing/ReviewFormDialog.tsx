"use client"

import { useState } from "react"
import { createCustomerReview } from "@/modules/marketing/actions/marketing-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MessageSquarePlus, X } from "lucide-react"

interface OutletOption {
  id: string
  name: string
}

export default function ReviewFormDialog({
  outlets,
  defaultOutletId,
}: {
  outlets: OutletOption[]
  defaultOutletId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [outletId, setOutletId] = useState(defaultOutletId || outlets[0]?.id || "")
  const [source, setSource] = useState("GOOGLE_MAPS")
  const [reviewerName, setReviewerName] = useState("")
  const [rating, setRating] = useState<number>(5)
  const [reviewText, setReviewText] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!outletId) {
      alert("Pilih outlet terlebih dahulu")
      return
    }

    if (!reviewerName.trim()) {
      alert("Nama pengulas wajib diisi")
      return
    }

    setIsLoading(true)
    try {
      await createCustomerReview({
        outletId,
        source,
        reviewerName,
        rating,
        reviewText: reviewText || undefined,
      })

      setIsOpen(false)
      setReviewerName("")
      setReviewText("")
      setRating(5)
      alert("Ulasan tamu berhasil dicatat!")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan ulasan")
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
        <MessageSquarePlus className="mr-2 h-4 w-4" /> Input Ulasan Tamu
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star size={20} className="text-amber-500 fill-amber-500" /> Input Ulasan / Feedback Tamu
                </CardTitle>
                <CardDescription className="text-xs">
                  Rekam ulasan dari Google Maps, Instagram DM, atau kuesioner in-store.
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
                  <Label className="text-xs">Outlet</Label>
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
                    <Label className="text-xs">Sumber Ulasan</Label>
                    <Select value={source} onValueChange={(val) => setSource(val)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih Sumber" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOOGLE_MAPS">Google Maps</SelectItem>
                        <SelectItem value="INSTAGRAM">Instagram / TikTok</SelectItem>
                        <SelectItem value="IN_STORE">Kuesioner Kasir / Meja</SelectItem>
                        <SelectItem value="TRIPADVISOR">TripAdvisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Rating Bintang (1-5)</Label>
                    <div className="flex items-center gap-1 pt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            size={22}
                            className={
                              star <= rating
                                ? "text-amber-500 fill-amber-500 transition-colors"
                                : "text-slate-300 transition-colors"
                            }
                          />
                        </button>
                      ))}
                      <span className="ml-1 text-xs font-bold text-slate-700">{rating}.0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Pengulas / Tamu</Label>
                  <Input
                    placeholder="mis. Ibu Ratna (Wisatawan Jakarta)"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Isi Ulasan / Testimoni</Label>
                  <Textarea
                    placeholder="mis. Tempatnya asik banget sambil lihat pemandangan kebun strawberry, pelayanan cepat..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
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
                    {isLoading ? "Menyimpan..." : "Simpan Ulasan"}
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
