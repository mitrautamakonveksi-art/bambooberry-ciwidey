"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isOwnerOrAdmin } from "@/shared/lib/auth"
import { AuditAction } from "@prisma/client"

export async function createKpiDefinition(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Admin/Owner yang dapat menambah definisi KPI.")
  }
  const divisionId = formData.get("divisionId") as string
  const name = formData.get("name") as string
  const measureUnit = formData.get("measureUnit") as string
  const weightPct = parseFloat(formData.get("weightPct") as string) || 20
  const greenMin = parseFloat(formData.get("greenMin") as string) || 90
  const yellowMin = parseFloat(formData.get("yellowMin") as string) || 75

  if (!divisionId || !name || !measureUnit) {
    throw new Error("Divisi, nama KPI, dan satuan ukuran wajib diisi")
  }

  const kpi = await prisma.kpiDefinition.create({
    data: {
      divisionId,
      name,
      measureUnit,
      isActive: true,
      weights: {
        create: {
          divisionId,
          weightPct,
          greenMin,
          yellowMin,
          redMax: yellowMin,
        },
      },
    },
    include: { weights: true },
  })

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.CREATE,
    entityName: "KpiDefinition",
    entityId: kpi.id,
    newData: { name: kpi.name, divisionId: kpi.divisionId, weightPct },
  })

  revalidatePath("/admin/kpi-config")
}

export async function updateKpiWeight(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Admin/Owner yang dapat memperbarui bobot KPI.")
  }
  const kpiId = formData.get("kpiId") as string
  const divisionId = formData.get("divisionId") as string
  const weightPct = parseFloat(formData.get("weightPct") as string)
  const greenMin = parseFloat(formData.get("greenMin") as string)
  const yellowMin = parseFloat(formData.get("yellowMin") as string)

  const existing = await prisma.kpiWeight.findUnique({
    where: { divisionId_kpiId: { divisionId, kpiId } },
  })

  let result
  if (existing) {
    result = await prisma.kpiWeight.update({
      where: { id: existing.id },
      data: { weightPct, greenMin, yellowMin, redMax: yellowMin },
    })
  } else {
    result = await prisma.kpiWeight.create({
      data: {
        divisionId,
        kpiId,
        weightPct,
        greenMin,
        yellowMin,
        redMax: yellowMin,
      },
    })
  }

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.UPDATE,
    entityName: "KpiWeight",
    entityId: result.id,
    newData: { weightPct, greenMin, yellowMin },
  })

  revalidatePath("/admin/kpi-config")
}
