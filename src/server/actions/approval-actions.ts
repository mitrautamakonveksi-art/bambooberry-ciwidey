"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient, ReportStatus } from "@prisma/client"

const prisma = new PrismaClient()
const DUMMY_MANAGER_ID = "cm... (isi dengan user id manager)"

export async function processApproval(formData: FormData) {
  const reportId = formData.get("reportId") as string
  const action = formData.get("action") as string
  const notes = formData.get("notes") as string

  let approverId = DUMMY_MANAGER_ID
  if (approverId.startsWith("cm...")) {
    const fallbackManager = await prisma.user.findFirst({ where: { role: "MANAGER" } })
    if (fallbackManager) approverId = fallbackManager.id
  }

  const newStatus: ReportStatus = action === "APPROVE" ? "APPROVED" : "REJECTED"

  await prisma.$transaction([
    prisma.dailyReport.update({
      where: { id: reportId },
      data: { status: newStatus }
    }),
    prisma.approval.create({
      data: {
        reportId,
        approverId,
        status: newStatus,
        notes: notes || null
      }
    })
  ])

  revalidatePath("/reports")
}
