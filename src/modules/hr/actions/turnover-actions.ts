"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"

export async function recordTurnover(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!isManagerOrAbove(currentUser)) throw new Error("Akses ditolak")

  const employeeId = formData.get("employeeId") as string
  const outletId = formData.get("outletId") as string
  const resignDate = new Date(formData.get("resignDate") as string || new Date())
  const reason = formData.get("reason") as string
  const feedback = (formData.get("feedback") as string) || null

  if (!employeeId || !outletId || !reason) {
    throw new Error("Karyawan, outlet, dan alasan pengunduran diri wajib diisi")
  }

  const record = await prisma.turnoverRecord.create({
    data: {
      employeeId,
      outletId,
      resignDate,
      reason,
      feedback,
    },
  })

  // Non-aktifkan akun user terkait
  const emp = await prisma.employeeProfile.findUnique({
    where: { id: employeeId },
    select: { userId: true },
  })

  if (emp?.userId) {
    await prisma.user.update({
      where: { id: emp.userId },
      data: { isActive: false },
    })
  }

  await auditLog("CREATE", "TurnoverRecord", record.id, { reason, employeeId }, currentUser?.id)
  revalidatePath("/hr/turnover")
  revalidatePath("/hr/employees")
  revalidatePath("/hr")
}

export async function getTurnoverAnalytics(outletId?: string) {
  const [turnoverList, totalActiveEmployees, divisionDistribution] = await Promise.all([
    prisma.turnoverRecord.findMany({
      where: outletId ? { outletId } : undefined,
      include: {
        employee: { include: { user: true } },
        outlet: true,
      },
      orderBy: { resignDate: "desc" },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        ...(outletId ? { outlets: { some: { id: outletId } } } : {}),
      },
    }),
    prisma.division.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    }),
  ])

  const totalResigned = turnoverList.length
  const totalHeadcount = totalActiveEmployees + totalResigned
  const retentionRate = totalHeadcount > 0 ? Math.round((totalActiveEmployees / totalHeadcount) * 100) : 100
  const turnoverRate = 100 - retentionRate

  return {
    turnoverList,
    totalActiveEmployees,
    totalResigned,
    retentionRate,
    turnoverRate,
    divisionDistribution,
  }
}
