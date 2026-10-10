import Link from "next/link"
import { prisma } from "@/shared/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, ClipboardList, TrendingUp, UserCheck, BookOpen, UserMinus, ArrowRight } from "lucide-react"
import { getTodayAttendance } from "@/modules/hr/actions/attendance-actions"
import { formatTime, formatDate } from "@/shared/i18n/id"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { getCurrentUser } from "@/shared/lib/auth"

export const metadata = {
  title: "HR Hub & Sumber Daya Manusia | BAMBOOBERRY IBMS",
}

export default async function HRDashboardPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const [totalEmployees, todayAttendances, pendingReports, turnoverCount] = await Promise.all([
    prisma.user.count({
      where: {
        isActive: true,
        ...(effectiveOutlet.outletId ? { outlets: { some: { id: effectiveOutlet.outletId } } } : {}),
      },
    }),
    getTodayAttendance(effectiveOutlet.outletId),
    prisma.dailyReport.count({
      where: {
        status: "SUBMITTED",
        ...(effectiveOutlet.outletId ? { outletId: effectiveOutlet.outletId } : {}),
      },
    }),
    prisma.turnoverRecord.count({
      where: effectiveOutlet.outletId ? { outletId: effectiveOutlet.outletId } : undefined,
    }),
  ])

  const presentCount = todayAttendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length
  const lateCount = todayAttendances.filter((a) => a.status === "LATE").length
  const retentionRate = totalEmployees + turnoverCount > 0
    ? Math.round((totalEmployees / (totalEmployees + turnoverCount)) * 100)
    : 100

  const hrModules = [
    {
      title: "Direktori Karyawan & Kontrak",
      desc: "Kelola master data karyawan, penempatan cabang, NIK, dan jenis kontrak (PKWT/PKWTT).",
      icon: <Users className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/employees",
      badge: `${totalEmployees} Aktif`,
    },
    {
      title: "Presensi & Jam Kerja",
      desc: "Monitoring Clock-in / Clock-out harian, deteksi keterlambatan, dan jam kerja riil.",
      icon: <Clock className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/attendance",
      badge: `${presentCount} Hadir Hari Ini`,
    },
    {
      title: "Laporan Harian Staf & Kaizen",
      desc: "Alur pelaporan shift kerja (Mulai → Hasil → Kaizen) dan persetujuan manager.",
      icon: <ClipboardList className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/daily-reports",
      badge: `${pendingReports} Menunggu Review`,
    },
    {
      title: "Rekrutmen & Scorecard",
      desc: "Manajemen lowongan kerja, pipeline pelamar, dan penilaian wawancara terstandar.",
      icon: <UserCheck className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/recruitment",
      badge: "Pipeline",
    },
    {
      title: "Onboarding & Pelatihan (L&D)",
      desc: "Katalog materi pelatihan, jam training staf, dan evaluasi pemahaman SOP.",
      icon: <BookOpen className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/training",
      badge: "L&D Program",
    },
    {
      title: "Manpower Planning & Turnover",
      desc: "Analisis distribusi tenaga kerja per outlet, angka retensi, dan log pengunduran diri.",
      icon: <UserMinus className="h-5 w-5 text-[#2A7C13]" />,
      href: "/hr/turnover",
      badge: `${retentionRate}% Retensi`,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Human Resources Hub (HR)
          </h2>
          <p className="text-slate-500">
            Manajemen terintegrasi kepegawaian, absensi, pelatihan, dan produktivitas staf multi-outlet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/hr/attendance">
            <Button className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm">
              <Clock className="mr-1.5 h-4 w-4" /> Presensi Hari Ini
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Karyawan Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-[#2A7C13]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
            <p className="text-[11px] text-slate-500 mt-1">Seluruh cabang outlet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Presensi Hari Ini
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{presentCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {lateCount > 0 ? `${lateCount} terlambat` : "Tepat waktu"}
            </p>
          </CardContent>
        </Card>

        <Card className={pendingReports > 0 ? "border-amber-200 bg-amber-50/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">
              Laporan Shift Pending
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingReports}</div>
            <p className="text-[11px] text-slate-500 mt-1">Menunggu persetujuan</p>
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
            <div className="text-2xl font-bold text-slate-900">{retentionRate}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Stabilitas manpower</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Sub-modul HR */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Sub-Modul HR Terintegrasi</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hrModules.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <Card className="hover:border-[#2A7C13]/60 transition-all hover:shadow-sm h-full flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-[#2A7C13]/10">
                      {item.icon}
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">
                      {item.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base text-slate-900 pt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-xs text-slate-600 line-clamp-2">
                    {item.desc}
                  </CardDescription>
                  <div className="flex items-center text-xs font-semibold text-[#2A7C13] pt-1">
                    Buka Modul <ArrowRight size={14} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Kehadiran Terkini Hari Ini */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aktivitas Presensi Terkini</CardTitle>
              <CardDescription>Catatan Clock-in staf pada hari ini ({formatDate(new Date())})</CardDescription>
            </div>
            <Link href="/hr/attendance">
              <Button variant="outline" size="sm" className="text-xs">
                Lihat Seluruhnya
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-500">Karyawan</th>
                  <th className="p-3 text-left font-medium text-slate-500">Cabang</th>
                  <th className="p-3 text-center font-medium text-slate-500">Clock-In</th>
                  <th className="p-3 text-center font-medium text-slate-500">Status</th>
                  <th className="p-3 text-right font-medium text-slate-500">Jam Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayAttendances.slice(0, 5).map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{att.user.name}</div>
                      <div className="text-xs text-slate-500">{att.user.employeeProfile?.positionTitle || "Staf"}</div>
                    </td>
                    <td className="p-3 text-slate-700">{att.outlet.name}</td>
                    <td className="p-3 text-center text-slate-700 font-mono text-xs">
                      {formatTime(att.clockIn)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          att.status === "PRESENT"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : att.status === "LATE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700"
                        }
                      >
                        {att.status === "PRESENT" ? "Tepat Waktu" : att.status === "LATE" ? `Terlambat ${att.lateMinutes}m` : att.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right text-slate-700 font-mono text-xs">
                      {att.workHours > 0 ? `${att.workHours} jam` : "Sedang aktif"}
                    </td>
                  </tr>
                ))}
                {todayAttendances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 text-sm">
                      Belum ada presensi yang terekam hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
