"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser, isSupervisorOrAbove } from "@/shared/lib/auth"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { AuditAction, ReportStatus } from "@prisma/client"

export async function processApproval(formData: FormData) {
  const reportId = formData.get("reportId") as string
  const action = formData.get("action") as string
  const notes = formData.get("notes") as string
  const currentUser = await getCurrentUser()

  if (!currentUser || !isSupervisorOrAbove(currentUser)) {
    throw new Error("Akses ditolak: Hanya Supervisor atau Manajemen yang dapat memproses persetujuan.")
  }

  const existingReport = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  })

  if (!existingReport) {
    throw new Error("Laporan harian tidak ditemukan.")
  }

  const approverId = currentUser.id

  const newStatus: ReportStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

  await prisma.$transaction([
    prisma.dailyReport.update({
      where: { id: reportId },
      data: { status: newStatus },
    }),
    prisma.approval.create({
      data: {
        reportId,
        approverId,
        status: newStatus,
        notes: notes || null,
      },
    }),
  ])

  await recordAuditLog({
    userId: approverId,
    action: action === "APPROVE" ? AuditAction.APPROVE : AuditAction.REJECT,
    entityName: "DailyReport",
    entityId: reportId,
    newData: { status: newStatus, notes },
  })

  revalidatePath("/reports")
}
