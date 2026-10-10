"use server"

import { prisma } from "@/shared/lib/prisma"
import { getLogicalShiftDate } from "@/lib/utils"

export async function getDashboardStats(outletId?: string) {
  const today = getLogicalShiftDate()

  // Jalankan query secara paralel via Promise.all tanpa duplikasi query dailyReports
  const [outlets, pendingReportsCount, openKaizenCount, recentKaizens] = await Promise.all([
    prisma.outlet.findMany({
      where: {
        isActive: true,
        ...(outletId ? { id: outletId } : {}),
      },
      include: {
        dailyReports: {
          where: { date: today },
          include: { items: { include: { kpi: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.dailyReport.count({
      where: {
        status: "SUBMITTED",
        ...(outletId ? { outletId } : {}),
      },
    }),
    prisma.kaizen.count({
      where: {
        status: "OPEN",
        ...(outletId ? { dailyItem: { report: { outletId } } } : {}),
      },
    }),
    prisma.kaizen.findMany({
      where: {
        status: "OPEN",
        ...(outletId ? { dailyItem: { report: { outletId } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { dailyItem: { include: { kpi: { include: { division: true } } } } },
    }),
  ])

  let totalTC = 0
  let totalRating = 0
  let ratingCount = 0

  const chartData = outlets.map((outlet) => {
    let outletTC = 0
    outlet.dailyReports.forEach((report) => {
      report.items.forEach((item) => {
        if (item.kpi.name.includes("TC") || item.kpi.name.includes("Pengunjung")) {
          const val = item.actualValue || 0
          outletTC += val
          totalTC += val
        }
        if (item.kpi.name.includes("Rating")) {
          totalRating += item.actualValue || 0
          ratingCount++
        }
      })
    })
    return { name: outlet.name, pengunjung: outletTC }
  })

  const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0"

  return { totalTC, avgRating, pendingReportsCount, openKaizenCount, chartData, recentKaizens }
}
