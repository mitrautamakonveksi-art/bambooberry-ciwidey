"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"

export async function createTrainingProgram(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!isManagerOrAbove(currentUser)) throw new Error("Akses ditolak")

  const title = formData.get("title") as string
  const divisionId = formData.get("divisionId") as string
  const description = formData.get("description") as string
  const durationHours = parseFloat(formData.get("durationHours") as string) || 2

  if (!title || !divisionId) {
    throw new Error("Judul program dan divisi wajib diisi")
  }

  const program = await prisma.trainingProgram.create({
    data: {
      title,
      divisionId,
      description: description || "",
      durationHours,
    },
  })

  await auditLog("CREATE", "TrainingProgram", program.id, { title, durationHours }, currentUser?.id)
  revalidatePath("/hr/training")
}

export async function recordEmployeeTraining(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!isManagerOrAbove(currentUser)) throw new Error("Akses ditolak")

  const employeeId = formData.get("employeeId") as string
  const programId = formData.get("programId") as string
  const score = parseFloat(formData.get("score") as string) || 85
  const status = (formData.get("status") as string) || "COMPLETED"

  const record = await prisma.employeeTraining.create({
    data: {
      employeeId,
      programId,
      completionDate: new Date(),
      score,
      status,
    },
  })

  await auditLog("CREATE", "EmployeeTraining", record.id, { employeeId, programId, score }, currentUser?.id)
  revalidatePath("/hr/training")
}

export async function getTrainingPrograms() {
  return await prisma.trainingProgram.findMany({
    include: {
      division: true,
      attendees: {
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}
