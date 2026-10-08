"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getAggregatedSummary(outletId: string, divisionId: string, startDate: Date, endDate: Date) {
  // Ambil semua item laporan yang berstatus APPROVED atau SUBMITTED pada rentang tanggal
  const reports = await prisma.dailyReport.findMany({
    where: {
      outletId,
      date: { gte: startDate, lte: endDate },
      status: { in: ['APPROVED', 'SUBMITTED'] },
      items: { some: { kpi: { divisionId } } }
    },
    include: {
      items: {
        where: { kpi: { divisionId } },
        include: { kpi: true, kaizen: true }
      }
    }
  })

  // Agregasi manual di server
  const summary: Record<string, { kpiName: string, unit: string, totalActual: number, count: number, problems: string[] }> = {}

  reports.forEach(report => {
    report.items.forEach(item => {
      if (!summary[item.kpiId]) {
        summary[item.kpiId] = { kpiName: item.kpi.name, unit: item.kpi.measureUnit, totalActual: 0, count: 0, problems: [] }
      }
      summary[item.kpiId].totalActual += (item.actualValue || 0)
      summary[item.kpiId].count += 1
      
      if (item.problemDesc) {
        summary[item.kpiId].problems.push(`[${report.date.toISOString().split('T')[0]}] ${item.problemDesc}`)
      }
    })
  })

  return Object.values(summary).map(s => ({
    kpiName: s.kpiName,
    unit: s.unit,
    // Jika metrik berupa rating/bintang, gunakan rata-rata. Jika pengunjung/uang, gunakan total (sum)
    value: s.unit.toLowerCase().includes('bintang') || s.unit.toLowerCase().includes('%') 
      ? (s.totalActual / s.count).toFixed(2) 
      : s.totalActual,
    problems: s.problems
  }))
}

export async function saveSummaryConclusion(formData: FormData) {
  const outletId = formData.get("outletId") as string
  const divisionId = formData.get("divisionId") as string
  const conclusion = formData.get("conclusion") as string
  const periodStart = new Date(formData.get("startDate") as string)
  const periodEnd = new Date(formData.get("endDate") as string)

  await prisma.weeklySummary.create({
    data: {
      outletId,
      divisionId,
      periodStart,
      periodEnd,
      conclusion,
      aggregatedData: {} // JSON ringkasan bisa disimpan di sini jika butuh arsip statis
    }
  })

  revalidatePath("/reports/summary")
}
