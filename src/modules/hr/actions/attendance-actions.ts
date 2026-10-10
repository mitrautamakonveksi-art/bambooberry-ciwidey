"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser } from "@/shared/lib/auth"
import { eventDispatcher, IBMS_EVENTS } from "@/shared/lib/event-bus"
import { revalidatePath } from "next/cache"
import { AttendanceStatus } from "@prisma/client"

export async function clockIn(userId: string, outletId: string, notes?: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_outletId_date: {
        userId,
        outletId,
        date: today,
      },
    },
  })

  if (existing?.clockIn) {
    throw new Error("Karyawan sudah melakukan Presensi Masuk (Clock In) hari ini.")
  }

  // Hitung keterlambatan (standar cutoff jam 08:30 pagi WIB)
  const scheduledHour = 8
  const scheduledMinute = 30
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  let lateMinutes = 0
  if (currentHour > scheduledHour || (currentHour === scheduledHour && currentMinute > scheduledMinute)) {
    lateMinutes = (currentHour - scheduledHour) * 60 + (currentMinute - scheduledMinute)
  }

  const status: AttendanceStatus = lateMinutes > 15 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT

  const attendance = await prisma.attendance.upsert({
    where: {
      userId_outletId_date: {
        userId,
        outletId,
        date: today,
      },
    },
    update: {
      clockIn: now,
      status,
      lateMinutes,
      notes: notes || undefined,
    },
    create: {
      userId,
      outletId,
      date: today,
      clockIn: now,
      status,
      lateMinutes,
      notes: notes || null,
    },
    include: { user: true, outlet: true },
  })

  await auditLog("CREATE", "Attendance", attendance.id, { action: "CLOCK_IN", lateMinutes }, currentUser.id)
  await eventDispatcher.dispatch(IBMS_EVENTS.ATTENDANCE_CLOCKED, {
    userId,
    outletId,
    status,
    clockIn: now,
  })

  revalidatePath("/hr/attendance")
  revalidatePath("/hr")
  return attendance
}

export async function clockOut(attendanceId: string, notes?: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) throw new Error("Unauthorized")

  const record = await prisma.attendance.findUnique({ where: { id: attendanceId } })
  if (!record || !record.clockIn) {
    throw new Error("Catatan presensi masuk tidak ditemukan.")
  }

  const now = new Date()
  const diffMs = now.getTime() - new Date(record.clockIn).getTime()
  const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      clockOut: now,
      workHours,
      notes: notes ? (record.notes ? `${record.notes} | ${notes}` : notes) : record.notes,
    },
  })

  await auditLog("UPDATE", "Attendance", updated.id, { action: "CLOCK_OUT", workHours }, currentUser.id)

  revalidatePath("/hr/attendance")
  revalidatePath("/hr")
  return updated
}

export async function getTodayAttendance(outletId?: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return await prisma.attendance.findMany({
    where: {
      date: today,
      outletId: outletId && outletId !== "ALL" ? outletId : undefined,
    },
    include: {
      user: {
        include: {
          employeeProfile: true,
          division: true,
        },
      },
      outlet: true,
    },
    orderBy: { clockIn: "desc" },
  })
}

export async function getMonthlyAttendance(outletId?: string, month?: number, year?: number) {
  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth() + 1

  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0)

  return await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      outletId: outletId && outletId !== "ALL" ? outletId : undefined,
    },
    include: {
      user: {
        include: { employeeProfile: true, division: true },
      },
      outlet: true,
    },
    orderBy: { date: "desc" },
  })
}
