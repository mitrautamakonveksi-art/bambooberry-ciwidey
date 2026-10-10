"use client"

import { useState } from "react"
import { clockIn, clockOut } from "@/modules/hr/actions/attendance-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut, CheckCircle2 } from "lucide-react"
import { formatTime } from "@/shared/i18n/id"

interface ClockInOutCardProps {
  currentUserId: string
  userName: string
  outlets: { id: string; name: string }[]
  defaultOutletId?: string
  todayAttendanceRecord: {
    id: string
    clockIn: Date | string | null
    clockOut: Date | string | null
    workHours: number
    status: string
  } | null
}

export default function ClockInOutCard({
  currentUserId,
  userName,
  outlets,
  defaultOutletId,
  todayAttendanceRecord,
}: ClockInOutCardProps) {
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    defaultOutletId || outlets[0]?.id || ""
  )
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const handleClockIn = async () => {
    if (!selectedOutlet) {
      alert("Silakan pilih cabang outlet terlebih dahulu.")
      return
    }
    setLoading(true)
    try {
      await clockIn(currentUserId, selectedOutlet, notes || undefined)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal melakukan clock-in")
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!todayAttendanceRecord) return
    setLoading(true)
    try {
      await clockOut(todayAttendanceRecord.id, notes || undefined)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal melakukan clock-out")
    } finally {
      setLoading(false)
    }
  }

  const hasClockedIn = !!todayAttendanceRecord?.clockIn
  const hasClockedOut = !!todayAttendanceRecord?.clockOut

  return (
    <Card className="border-[#2A7C13]/30 bg-[#2A7C13]/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-[#2A7C13]">
            <Clock size={18} /> Presensi Mandiri: {userName}
          </CardTitle>
          {hasClockedIn && (
            <Badge
              variant="outline"
              className={
                todayAttendanceRecord.status === "PRESENT"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }
            >
              {todayAttendanceRecord.status === "PRESENT" ? "Tepat Waktu" : "Terlambat"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Catat waktu mulai dan selesai shift kerja Anda hari ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasClockedIn && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Lokasi Outlet Shift</Label>
                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger className="h-9 text-xs bg-white">
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
              <div className="space-y-1">
                <Label className="text-xs">Catatan (Opsional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="mis. Shift Pagi"
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>
            <Button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm font-semibold"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Clock In Sekarang"}
            </Button>
          </div>
        )}

        {hasClockedIn && !hasClockedOut && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded border">
              <div>
                <span className="text-slate-500">Waktu Masuk:</span>{" "}
                <span className="font-bold text-slate-800">
                  {formatTime(todayAttendanceRecord.clockIn)}
                </span>
              </div>
              <span className="text-xs text-blue-600 font-medium">Sedang Berlangsung</span>
            </div>
            <div className="space-y-1">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan penutup shift (opsional)..."
                className="h-9 text-xs bg-white"
              />
            </div>
            <Button
              onClick={handleClockOut}
              disabled={loading}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm font-semibold"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Clock Out (Selesai Shift)"}
            </Button>
          </div>
        )}

        {hasClockedOut && (
          <div className="flex items-center gap-3 bg-white p-3 rounded border border-green-200 text-xs text-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold">Shift Hari Ini Telah Selesai</p>
              <p className="text-slate-600">
                Masuk: {formatTime(todayAttendanceRecord.clockIn)} | Selesai:{" "}
                {formatTime(todayAttendanceRecord.clockOut)} ({todayAttendanceRecord.workHours} jam kerja)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
