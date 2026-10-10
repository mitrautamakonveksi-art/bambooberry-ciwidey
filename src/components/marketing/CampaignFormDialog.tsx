"use client"

import { useState } from "react"
import { createContentCampaign } from "@/modules/marketing/actions/marketing-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, X } from "lucide-react"

export default function CampaignFormDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [channel, setChannel] = useState("Instagram Reels")
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().split("T")[0])
  const [themeConcept, setThemeConcept] = useState("")
  const [objective, setObjective] = useState("")
  const [linkUrl, setLinkUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim() || !themeConcept.trim()) {
      alert("Judul dan konsep tema wajib diisi")
      return
    }

    setIsLoading(true)
    try {
      await createContentCampaign({
        title,
        channel,
        plannedDate,
        status: "PLANNED",
        themeConcept,
        objective,
        linkUrl: linkUrl || undefined,
      })

      setIsOpen(false)
      setTitle("")
      setThemeConcept("")
      setObjective("")
      setLinkUrl("")
      alert("Jadwal kampanye konten organik berhasil dibuat!")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menjadwalkan konten")
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
        <Megaphone className="mr-2 h-4 w-4" /> Jadwal Konten Baru
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Megaphone size={20} className="text-[#2A7C13]" /> Rencana Konten Organik
                </CardTitle>
                <CardDescription className="text-xs">
                  Jadwalkan publikasi video atau visual kebun strawberry tanpa biaya iklan berbayar.
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
                  <Label className="text-xs">Nama / Judul Kampanye Konten</Label>
                  <Input
                    placeholder="mis. Highlight Strawberry Milkshake Segar Petik Sendiri"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Platform Media Sosial</Label>
                    <Select value={channel} onValueChange={(val) => setChannel(val)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Instagram Reels">Instagram Reels</SelectItem>
                        <SelectItem value="TikTok">TikTok Video</SelectItem>
                        <SelectItem value="Google My Business">Google Maps Update</SelectItem>
                        <SelectItem value="YouTube Shorts">YouTube Shorts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal Publikasi</Label>
                    <Input
                      type="date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Konsep Tema & Visual</Label>
                  <Textarea
                    placeholder="mis. Shoot proses barista membuat signature drink dengan background kabut Ciwidey..."
                    value={themeConcept}
                    onChange={(e) => setThemeConcept(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tujuan & Target Audiens</Label>
                  <Input
                    placeholder="mis. Awareness wisatawan keluarga Bandung & Jakarta jelang weekend"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Link Preview / Draft Video (Opsional)</Label>
                  <Input
                    type="url"
                    placeholder="https://drive.google.com/... atau link draft"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
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
                    {isLoading ? "Menyimpan..." : "Jadwalkan Konten"}
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
