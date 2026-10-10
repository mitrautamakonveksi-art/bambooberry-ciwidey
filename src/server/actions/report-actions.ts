"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser, isSupervisorOrAbove } from "@/shared/lib/auth"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { getLogicalShiftDate } from "@/lib/utils"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { AuditAction } from "@prisma/client"

export async function submitStartWork(formData: FormData) {
  const date = getLogicalShiftDate()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("Akses ditolak: Pengguna tidak terautentikasi.")
  }

  const userId = currentUser.id
  const formOutletId = (formData.get("outletId") as string) || null
  const effectiveOutlet = await getEffectiveOutlet(currentUser)
  let outletId =
    formOutletId ||
    effectiveOutlet.outletId ||
    currentUser.activeOutletId ||
    currentUser.outletIds[0]

  if (!outletId) {
    const fallbackOutlet = await prisma.outlet.findFirst({ where: { isActive: true } })
    if (fallbackOutlet) outletId = fallbackOutlet.id
  }

  if (!outletId) {
    throw new Error("Tidak ada outlet aktif yang terkonfigurasi untuk pengguna ini.")
  }

  const report = await prisma.dailyReport.create({
    data: {
      userId,
      outletId,
      date,
      status: "DRAFT",
    },
  })

  const kpiIds = formData.getAll("kpiId") as string[]
  const commitments = formData.getAll("commitment") as string[]

  const itemsData = kpiIds.map((id, index) => ({
    reportId: report.id,
    kpiId: id,
    commitmentValue: parseFloat(commitments[index]) || 0,
  }))

  if (itemsData.length > 0) {
    await prisma.dailyItem.createMany({ data: itemsData })
  }

  await recordAuditLog({
    userId,
    action: AuditAction.CREATE,
    entityName: "DailyReport",
    entityId: report.id,
    newData: { status: "DRAFT", itemsCount: itemsData.length, date: date.toISOString() },
  })

  revalidatePath("/reports")
  redirect("/reports")
}

export async function submitFinishWork(reportId: string, formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error("Akses ditolak: Pengguna tidak terautentikasi.")
  }

  const existingReport = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    select: { id: true, userId: true, status: true },
  })

  if (!existingReport) {
    throw new Error("Laporan harian tidak ditemukan.")
  }

  if (existingReport.status !== "DRAFT") {
    throw new Error("Laporan ini sudah disubmit atau telah diproses.")
  }

  if (existingReport.userId !== currentUser.id && !isSupervisorOrAbove(currentUser)) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah laporan ini.")
  }

  const itemIds = formData.getAll("itemId") as string[]
  const actuals = formData.getAll("actual") as string[]
  const problems = formData.getAll("problem") as string[]
  const solutions = formData.getAll("solution") as string[]

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i]
      const actual = parseFloat(actuals[i]) || 0
      const problem = problems[i]
      const solution = solutions[i]

      const item = await tx.dailyItem.update({
        where: { id: itemId },
        data: { actualValue: actual, problemDesc: problem || null },
      })

      if (solution && solution.trim() !== "") {
        await tx.kaizen.upsert({
          where: { dailyItemId: item.id },
          update: { proposedSolution: solution },
          create: { dailyItemId: item.id, proposedSolution: solution },
        })
      }
    }

    await tx.dailyReport.update({
      where: { id: reportId },
      data: { status: "SUBMITTED" },
    })
  })

  await recordAuditLog({
    userId: currentUser.id,
    action: AuditAction.UPDATE,
    entityName: "DailyReport",
    entityId: reportId,
    newData: { status: "SUBMITTED", itemsCount: itemIds.length },
  })

  revalidatePath("/reports")
  redirect("/reports")
}
