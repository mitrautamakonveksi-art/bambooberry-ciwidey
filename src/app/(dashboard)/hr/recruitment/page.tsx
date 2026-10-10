import { prisma } from "@/shared/lib/prisma"
import { getRecruitmentJobs, createRecruitmentJob } from "@/modules/hr/actions/recruitment-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Plus, Star } from "lucide-react"

export const metadata = {
  title: "Rekrutmen & Interview Scorecard | HR | BAMBOOBERRY",
}

export default async function RecruitmentPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const [jobs, divisions, outlets] = await Promise.all([
    getRecruitmentJobs(effectiveOutlet.outletId),
    prisma.division.findMany({ orderBy: { name: "asc" } }),
    prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIRED":
        return "bg-green-100 text-green-800 border-green-200"
      case "OFFERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "INTERVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Rekrutmen & Interview Scorecard
        </h2>
        <p className="text-slate-500">
          Kelola pembukaan lowongan kerja, pipeline kandidat pelamar, dan penilaian scorecard wawancara.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Buka Lowongan Baru */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-[#2A7C13]">
              <Plus size={18} /> Buka Lowongan Baru
            </CardTitle>
            <CardDescription className="text-xs">
              Posting posisi lowongan kerja untuk outlet cabang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createRecruitmentJob} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Posisi Pekerjaan</Label>
                <Input name="title" placeholder="mis. Head Barista" required />
              </div>
              <div className="space-y-1.5">
                <Label>Divisi</Label>
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
                <Label>Penempatan Cabang</Label>
                <Select name="outletId" defaultValue={effectiveOutlet.outletId || "ALL"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Outlet (Fleksibel)</SelectItem>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kualifikasi & Persyaratan</Label>
                <Textarea
                  name="requirements"
                  placeholder="Pengalaman min 1 tahun, ramah, bersedia shift malam..."
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm">
                Terbitkan Lowongan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Daftar Lowongan & Pipeline Pelamar */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase size={18} className="text-[#2A7C13]" /> Lowongan Aktif & Pipeline ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 rounded-lg border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{job.title}</h4>
                      <div className="text-xs text-slate-500">
                        {job.division.name} {job.outlet ? `• ${job.outlet.name}` : "• Seluruh Cabang"}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-[#2A7C13] border-emerald-200">
                      {job.candidates.length} Pelamar
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    <span className="font-medium">Kualifikasi:</span> {job.requirements}
                  </p>

                  {/* Daftar Pelamar di Lowongan Ini */}
                  {job.candidates.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <div className="text-xs font-semibold text-slate-700">Kandidat Masuk:</div>
                      <div className="space-y-1.5">
                        {job.candidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-50 text-xs gap-2"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">{cand.candidateName}</span>
                              <span className="text-slate-500 ml-2">({cand.phone})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getStatusColor(cand.status)}>
                                {cand.status}
                              </Badge>
                              {cand.scorecards.length > 0 && (
                                <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-0.5">
                                  <Star size={12} fill="currentColor" /> {cand.scorecards[0].recommendation}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  Belum ada lowongan pekerjaan yang dibuka.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
