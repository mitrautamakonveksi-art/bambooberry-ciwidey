"use server"

import { revalidatePath } from "next/cache"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function setKpiTarget(formData: FormData) {
  const kpiId = formData.get("kpiId") as string
  const outletId = formData.get("outletId") as string
  const targetValue = parseFloat(formData.get("targetValue") as string)
  const periodType = formData.get("periodType") as string

  if (!kpiId || !outletId || isNaN(targetValue)) {
    throw new Error("Data tidak lengkap atau format angka salah")
  }

  const existingTarget = await prisma.kpiTarget.findFirst({
    where: { kpiId, outletId, periodType }
  })

  if (existingTarget) {
    await prisma.kpiTarget.update({
      where: { id: existingTarget.id },
      data: { targetValue, validFrom: new Date() }
    })
  } else {
    await prisma.kpiTarget.create({
      data: { kpiId, outletId, targetValue, periodType, validFrom: new Date() }
    })
  }

  revalidatePath("/kpi")
}
