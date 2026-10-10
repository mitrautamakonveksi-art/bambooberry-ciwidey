import { prisma } from "@/shared/lib/prisma"
import { getTurnoverAnalytics, recordTurnover } from "@/modules/hr/actions/turnover-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserMinus, TrendingUp, Users, AlertCircle } from "lucide-react"
import { formatDate } from "@/shared/i18n/id"

export const metadata = {
  title: "Turnover & Manpower Planning | HR | BAMBOOBERRY",
}

export default async function TurnoverPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const [analytics, activeEmployees, outlets] = await Promise.all([
    getTurnoverAnalytics(effectiveOutlet.outletId),
    prisma.employeeProfile.findMany({
      where: { user: { isActive: true } },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Turnover & Manpower Planning
        </h2>
        <p className="text-slate-500">
          Analisis stabilitas tenaga kerja, tingkat retensi, dan pencatatan resignasi karyawan.
        </p>
      </div>

      {/* Kartu Analitik Ringkasan */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Total Headcount Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-[#2A7C13]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{analytics.totalActiveEmployees}</div>
            <p className="text-[11px] text-slate-500 mt-1">Staf operasional saat ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Tingkat Retensi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{analytics.retentionRate}%</div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Stabilitas tinggi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Tingkat Turnover
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{analytics.turnoverRate}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Target: &lt; 15% / tahun</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Karyawan Resign
            </CardTitle>
            <UserMinus className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{analytics.totalResigned}</div>
            <p className="text-[11px] text-slate-500 mt-1">Total pengunduran diri</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Catat Pengunduran Diri (Resign) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <UserMinus size={18} /> Catat Karyawan Resign
            </CardTitle>
            <CardDescription className="text-xs">
              Mencatat turnover dan menonaktifkan akun staf dari sistem secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={recordTurnover} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Pilih Karyawan</Label>
                {activeEmployees.length > 0 ? (
                  <Select name="employeeId" required defaultValue={activeEmployees[0]?.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.user.name} ({e.positionTitle})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-slate-500">Tidak ada karyawan aktif.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Penempatan Cabang</Label>
                <Select name="outletId" required defaultValue={effectiveOutlet.outletId || outlets[0]?.id}>
                  <SelectTrigger>
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
                <Label>Tanggal Efektif Resign</Label>
                <Input name="resignDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>

              <div className="space-y-1.5">
                <Label>Alasan Pengunduran Diri</Label>
                <Input name="reason" placeholder="mis. Pindah domisili / Melanjutkan studi" required />
              </div>

              <div className="space-y-1.5">
                <Label>Catatan / Exit Interview Feedback</Label>
                <Textarea name="feedback" placeholder="Masukan dari karyawan untuk perbaikan manajemen..." />
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm font-semibold"
                disabled={activeEmployees.length === 0}
              >
                Proses Pengunduran Diri
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Riwayat Turnover & Distribusi Divisi */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribusi Karyawan per Divisi (Manpower)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {analytics.divisionDistribution.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                    <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                    <div className="text-xl font-bold text-[#2A7C13]">{d._count.users} Staf</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserMinus size={18} className="text-slate-500" /> Log Riwayat Resign ({analytics.turnoverList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium text-slate-500">Karyawan</th>
                      <th className="p-3 text-left font-medium text-slate-500">Cabang</th>
                      <th className="p-3 text-center font-medium text-slate-500">Tanggal Resign</th>
                      <th className="p-3 text-left font-medium text-slate-500">Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics.turnoverList.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">
                          {tr.employee.user.name}
                        </td>
                        <td className="p-3 text-slate-600">{tr.outlet.name}</td>
                        <td className="p-3 text-center text-xs text-slate-600">
                          {formatDate(tr.resignDate)}
                        </td>
                        <td className="p-3 text-xs text-slate-700">{tr.reason}</td>
                      </tr>
                    ))}
                    {analytics.turnoverList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500 text-xs">
                          Belum ada catatan karyawan resign.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
