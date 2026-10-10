import { prisma } from "@/shared/lib/prisma"
import { getTrainingPrograms, createTrainingProgram } from "@/modules/hr/actions/training-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Plus, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Pelatihan & Pengembangan (L&D) | HR | BAMBOOBERRY",
}

export default async function TrainingPage() {
  const [programs, divisions] = await Promise.all([
    getTrainingPrograms(),
    prisma.division.findMany(),
  ])

  const totalTrainingHours = programs.reduce(
    (acc, p) => acc + p.durationHours * p.attendees.length,
    0
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Pelatihan & Pengembangan (L&D)
          </h2>
          <p className="text-slate-500">
            Program onboarding staf baru, standarisasi SOP, dan pemantauan jam pelatihan karyawan.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1 bg-emerald-50 text-[#2A7C13] border-emerald-200">
          Total Akumulasi: {totalTrainingHours} Jam Pelatihan
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Tambah Program Pelatihan Baru */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-[#2A7C13]">
              <Plus size={18} /> Buat Modul Training Baru
            </CardTitle>
            <CardDescription className="text-xs">
              Daftarkan program pelatihan atau materi SOP baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTrainingProgram} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Judul Program Pelatihan</Label>
                <Input name="title" placeholder="mis. Standar Pelayanan Kasir & Hospitality" required />
              </div>
              <div className="space-y-1.5">
                <Label>Divisi Terkait</Label>
                <Select name="divisionId" required defaultValue={divisions[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estimasi Durasi (Jam)</Label>
                <Input name="durationHours" type="number" step="0.5" defaultValue="3" required />
              </div>
              <div className="space-y-1.5">
                <Label>Silabus / Ringkasan Materi</Label>
                <Textarea name="description" placeholder="Materi SOP opening, senyum salam sapa, penanganan komplain..." />
              </div>
              <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm">
                Simpan Program
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Daftar Modul & Log Kelulusan Staf */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={18} className="text-[#2A7C13]" /> Katalog Pelatihan & Riwayat Staf ({programs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {programs.map((program) => (
                <div key={program.id} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{program.title}</h4>
                      <p className="text-xs text-slate-500">
                        Divisi: {program.division.name} • Durasi: {program.durationHours} Jam
                      </p>
                    </div>
                    <Badge variant="outline">
                      {program.attendees.length} Karyawan Lulus
                    </Badge>
                  </div>

                  {program.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      {program.description}
                    </p>
                  )}

                  {/* Karyawan yang telah menyelesaikan */}
                  {program.attendees.length > 0 && (
                    <div className="pt-2 border-t space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700">Staf Terlatih:</div>
                      <div className="flex flex-wrap gap-2">
                        {program.attendees.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 text-xs border border-emerald-200"
                          >
                            <CheckCircle2 size={12} /> {att.employee.user.name} ({att.score || 100} pts)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {programs.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Belum ada program pelatihan yang didaftarkan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
