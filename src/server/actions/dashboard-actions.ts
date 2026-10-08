"use server"

import { PrismaClient } from "@prisma/client"
import { getLogicalShiftDate } from "@/lib/utils"

const prisma = new PrismaClient()

export async function getDashboardStats() {
  const today = getLogicalShiftDate()

  // Ambil laporan hari ini
  const todaysReports = await prisma.dailyReport.findMany({
    where: { date: today },
    include: { items: { include: { kpi: true } } }
  })

  // Hitung jumlah laporan pending (SUBMITTED)
  const pendingReportsCount = await prisma.dailyReport.count({
    where: { status: "SUBMITTED" }
  })

  // Hitung Kaizen yang masih OPEN
  const openKaizenCount = await prisma.kaizen.count({
    where: { status: "OPEN" }
  })

  // Agregasi TC (Total Check) dan Rating rata-rata hari ini
  let totalTC = 0
  let totalRating = 0
  let ratingCount = 0

  todaysReports.forEach(report => {
    report.items.forEach(item => {
      if (item.kpi.name.includes("TC") || item.kpi.name.includes("Pengunjung")) {
        totalTC += (item.actualValue || 0)
      }
      if (item.kpi.name.includes("Rating")) {
        totalRating += (item.actualValue || 0)
        ratingCount++
      }
    })
  })

  const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "0.0"

  // Data perbandingan outlet untuk Chart
  const outlets = await prisma.outlet.findMany({
    where: { isActive: true },
    include: {
      dailyReports: {
        where: { date: today },
        include: { items: { include: { kpi: true } } }
      }
    }
  })

  const chartData = outlets.map(outlet => {
    let tc = 0
    outlet.dailyReports.forEach(r => {
      r.items.forEach(i => {
        if (i.kpi.name.includes("TC") || i.kpi.name.includes("Pengunjung")) tc += (i.actualValue || 0)
      })
    })
    return { name: outlet.name, pengunjung: tc }
  })

  // Ambil 3 fokus Kaizen terbaru
  const recentKaizens = await prisma.kaizen.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { dailyItem: { include: { kpi: { include: { division: true } } } } }
  })

  return { totalTC, avgRating, pendingReportsCount, openKaizenCount, chartData, recentKaizens }
}
