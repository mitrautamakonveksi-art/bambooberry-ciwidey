"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/shared/lib/auth"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { AuditAction } from "@prisma/client"

export async function setKpiTarget(formData: FormData) {
  const currentUser = await getCurrentUser()
  const kpiId = formData.get("kpiId") as string
  const outletId = formData.get("outletId") as string
  const targetValue = parseFloat(formData.get("targetValue") as string)
  const periodType = formData.get("periodType") as string

  if (!kpiId || !outletId || isNaN(targetValue)) {
    throw new Error("Data tidak lengkap atau format angka salah")
  }

  const existingTarget = await prisma.kpiTarget.findFirst({
    where: { kpiId, outletId, periodType },
  })

  let targetId: string

  if (existingTarget) {
    const updated = await prisma.kpiTarget.update({
      where: { id: existingTarget.id },
      data: { targetValue, validFrom: new Date() },
    })
    targetId = updated.id
  } else {
    const created = await prisma.kpiTarget.create({
      data: { kpiId, outletId, targetValue, periodType, validFrom: new Date() },
    })
    targetId = created.id
  }

  await recordAuditLog({
    userId: currentUser?.id,
    action: existingTarget ? AuditAction.UPDATE : AuditAction.CREATE,
    entityName: "KpiTarget",
    entityId: targetId,
    newData: { kpiId, outletId, targetValue, periodType },
  })

  revalidatePath("/kpi")
}
