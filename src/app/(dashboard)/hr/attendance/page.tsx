import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { getTodayAttendance } from "@/modules/hr/actions/attendance-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatTime, formatDate } from "@/shared/i18n/id"
import ClockInOutCard from "@/components/hr/ClockInOutCard"

export const metadata = {
  title: "Presensi & Absensi Karyawan | HR | BAMBOOBERRY",
}

export default async function AttendancePage() {
  const currentUser = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(currentUser)
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const [attendances, outlets, myTodayAttendance] = await Promise.all([
    getTodayAttendance(effectiveOutlet.outletId),
    prisma.outlet.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    currentUser
      ? prisma.attendance.findFirst({
          where: {
            userId: currentUser.id,
            date: today,
          },
        })
      : null,
  ])

  const presentCount = attendances.filter((a) => a.status === "PRESENT").length
  const lateCount = attendances.filter((a) => a.status === "LATE").length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Presensi & Absensi Karyawan
        </h2>
        <p className="text-slate-500">
          Monitoring kehadiran real-time, waktu clock-in, dan keterlambatan per outlet.
        </p>
      </div>

      {/* Widget Clock In/Out Mandiri */}
      {currentUser && (
        <ClockInOutCard
          currentUserId={currentUser.id}
          userName={currentUser.name}
          outlets={outlets}
          defaultOutletId={effectiveOutlet.outletId || currentUser.activeOutletId || undefined}
          todayAttendanceRecord={myTodayAttendance}
        />
      )}

      {/* Monitoring Tabel Kehadiran Hari Ini */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle>
                Daftar Presensi Hari Ini: {formatDate(new Date())}
              </CardTitle>
              <CardDescription>
                {attendances.length} staf tercatat hadir ({presentCount} tepat waktu, {lateCount} terlambat)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Karyawan</TableHead>
                  <TableHead>Cabang Outlet</TableHead>
                  <TableHead className="text-center">Clock In</TableHead>
                  <TableHead className="text-center">Clock Out</TableHead>
                  <TableHead className="text-center">Durasi Kerja</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((att) => (
                  <TableRow key={att.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{att.user.name}</div>
                      <div className="text-xs text-slate-500">
                        {att.user.employeeProfile?.positionTitle || att.user.division?.name || "Staf"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{att.outlet.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-800">
                      {formatTime(att.clockIn)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-800">
                      {att.clockOut ? (
                        formatTime(att.clockOut)
                      ) : (
                        <span className="text-blue-600 italic">Aktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold text-slate-700">
                      {att.workHours > 0 ? `${att.workHours} Jam` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          att.status === "PRESENT"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : att.status === "LATE"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-800"
                        }
                      >
                        {att.status === "PRESENT"
                          ? "Tepat Waktu"
                          : att.status === "LATE"
                          ? `Terlambat ${att.lateMinutes}m`
                          : att.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {att.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {attendances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      Belum ada staf yang melakukan presensi hari ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
