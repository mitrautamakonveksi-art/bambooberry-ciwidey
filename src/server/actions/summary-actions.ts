"use server"

import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser, isSupervisorOrAbove } from "@/shared/lib/auth"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { revalidatePath } from "next/cache"
import { AuditAction } from "@prisma/client"

export async function getAggregatedSummary(
  outletId: string,
  divisionId: string,
  startDate: Date,
  endDate: Date
) {
  const reports = await prisma.dailyReport.findMany({
    where: {
      outletId: outletId === "ALL" ? undefined : outletId,
      date: { gte: startDate, lte: endDate },
      status: { in: ["APPROVED", "SUBMITTED"] },
      items: { some: { kpi: { divisionId } } },
    },
    include: {
      items: {
        where: { kpi: { divisionId } },
        include: { kpi: true, kaizen: true },
      },
    },
  })

  const summary: Record<
    string,
    {
      kpiName: string
      unit: string
      totalActual: number
      count: number
      problems: string[]
    }
  > = {}

  reports.forEach((report) => {
    report.items.forEach((item) => {
      if (!summary[item.kpiId]) {
        summary[item.kpiId] = {
          kpiName: item.kpi.name,
          unit: item.kpi.measureUnit,
          totalActual: 0,
          count: 0,
          problems: [],
        }
      }
      summary[item.kpiId].totalActual += item.actualValue || 0
      summary[item.kpiId].count += 1

      if (item.problemDesc) {
        summary[item.kpiId].problems.push(
          `[${report.date.toISOString().split("T")[0]}] ${item.problemDesc}`
        )
      }
    })
  })

  return Object.values(summary).map((s) => ({
    kpiName: s.kpiName,
    unit: s.unit,
    value:
      s.unit.toLowerCase().includes("bintang") ||
      s.unit.toLowerCase().includes("%")
        ? (s.totalActual / s.count).toFixed(2)
        : s.totalActual,
    problems: s.problems,
  }))
}

export async function saveSummaryConclusion(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isSupervisorOrAbove(currentUser)) {
    throw new Error("Akses ditolak: Hanya Supervisor atau Manajemen yang dapat menyimpan evaluasi mingguan.")
  }

  const outletId = formData.get("outletId") as string
  const divisionId = formData.get("divisionId") as string
  const conclusion = formData.get("conclusion") as string
  const periodStart = new Date(formData.get("startDate") as string)
  const periodEnd = new Date(formData.get("endDate") as string)

  // Jika outletId bernilai "ALL", gunakan outlet pertama yang valid untuk foreign key
  let resolvedOutletId = outletId
  if (outletId === "ALL") {
    const firstOutlet = await prisma.outlet.findFirst({ where: { isActive: true } })
    if (firstOutlet) resolvedOutletId = firstOutlet.id
  }

  // Hitung agregasi metrik aktual untuk disimpan ke basis data
  const aggregated = await getAggregatedSummary(outletId, divisionId, periodStart, periodEnd)

  const weeklySummary = await prisma.weeklySummary.create({
    data: {
      outletId: resolvedOutletId,
      divisionId,
      periodStart,
      periodEnd,
      conclusion,
      aggregatedData: JSON.parse(JSON.stringify(aggregated)),
    },
  })

  await recordAuditLog({
    userId: currentUser.id,
    action: AuditAction.CREATE,
    entityName: "WeeklySummary",
    entityId: weeklySummary.id,
    newData: { outletId: resolvedOutletId, divisionId, conclusion },
  })

  revalidatePath("/reports/summary")
}
