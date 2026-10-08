"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { getLogicalShiftDate } from "@/lib/utils"

const prisma = new PrismaClient()
const DUMMY_USER_ID = "cm... (isi dengan user id dari database)"
const DUMMY_OUTLET_ID = "cm... (isi dengan outlet id)"

export async function submitStartWork(formData: FormData) {
  const date = getLogicalShiftDate()

  let userId = DUMMY_USER_ID
  let outletId = DUMMY_OUTLET_ID

  // Graceful fallback ke user & outlet valid jika ID masih berupa placeholder dummy
  if (userId.startsWith("cm...")) {
    const fallbackUser = await prisma.user.findFirst({ where: { role: "STAFF" } })
    if (fallbackUser) userId = fallbackUser.id
  }
  if (outletId.startsWith("cm...")) {
    const fallbackOutlet = await prisma.outlet.findFirst({ where: { isActive: true } })
    if (fallbackOutlet) outletId = fallbackOutlet.id
  }
  
  const report = await prisma.dailyReport.create({
    data: {
      userId,
      outletId,
      date,
      status: "DRAFT",
    }
  })

  const kpiIds = formData.getAll("kpiId") as string[]
  const commitments = formData.getAll("commitment") as string[]

  const itemsData = kpiIds.map((id, index) => ({
    reportId: report.id,
    kpiId: id,
    commitmentValue: parseFloat(commitments[index]) || 0
  }))

  await prisma.dailyItem.createMany({ data: itemsData })

  revalidatePath("/reports")
  redirect("/reports")
}

export async function submitFinishWork(reportId: string, formData: FormData) {
  const itemIds = formData.getAll("itemId") as string[]
  const actuals = formData.getAll("actual") as string[]
  const problems = formData.getAll("problem") as string[]
  const solutions = formData.getAll("solution") as string[]

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i]
    const actual = parseFloat(actuals[i]) || 0
    const problem = problems[i]
    const solution = solutions[i]

    const item = await prisma.dailyItem.update({
      where: { id: itemId },
      data: { actualValue: actual, problemDesc: problem || null }
    })

    if (solution && solution.trim() !== "") {
      await prisma.kaizen.create({
        data: { dailyItemId: item.id, proposedSolution: solution }
      })
    }
  }

  await prisma.dailyReport.update({
    where: { id: reportId },
    data: { status: "SUBMITTED" }
  })

  revalidatePath("/reports")
  redirect("/reports")
}
