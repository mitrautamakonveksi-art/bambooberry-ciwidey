import { prisma } from "@/shared/lib/prisma"
import { MetricScore, ExecutiveSummaryScore } from "@/shared/types"

export async function calculateOutletKpiScore(
  outletId: string,
  periodType: string = "MONTHLY",
  date: Date = new Date()
): Promise<ExecutiveSummaryScore> {
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: {
      kpiTargets: {
        where: { periodType },
        include: {
          kpi: {
            include: {
              division: true,
              weights: true,
            },
          },
        },
      },
    },
  })

  if (!outlet) {
    throw new Error(`Outlet dengan ID ${outletId} tidak ditemukan`)
  }

  // Ambil laporan harian dalam rentang 30 hari terakhir untuk mendapatkan nilai aktual
  const thirtyDaysAgo = new Date(date)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const dailyItems = await prisma.dailyItem.findMany({
    where: {
      report: {
        outletId,
        date: { gte: thirtyDaysAgo, lte: date },
        status: { in: ["APPROVED", "SUBMITTED"] },
      },
    },
    include: { kpi: true },
  })

  // Agregasi nilai aktual per kpiId
  const actualAggregates: Record<string, { sum: number; count: number }> = {}
  dailyItems.forEach((item) => {
    if (!actualAggregates[item.kpiId]) {
      actualAggregates[item.kpiId] = { sum: 0, count: 0 }
    }
    actualAggregates[item.kpiId].sum += item.actualValue || 0
    actualAggregates[item.kpiId].count += 1
  })

  const metrics: MetricScore[] = []
  const divisionScoreAccumulator: Record<
    string,
    { totalWeighted: number; totalWeight: number }
  > = {}

  let totalWeightedSum = 0
  let totalWeightSum = 0

  for (const target of outlet.kpiTargets) {
    const kpi = target.kpi
    const divName = kpi.division.name
    const agg = actualAggregates[kpi.id] || { sum: 0, count: 0 }

    // Jika satuan rating/persentase gunakan rata-rata, selain itu sum
    const isAverageMetric =
      kpi.measureUnit.toLowerCase().includes("bintang") ||
      kpi.measureUnit.toLowerCase().includes("%")
    const actualVal =
      agg.count > 0 ? (isAverageMetric ? agg.sum / agg.count : agg.sum) : 0

    const targetVal = target.targetValue || 1
    const achievementPct = Math.min(
      Math.round((actualVal / targetVal) * 100),
      150
    ) // Cap di 150%

    // Ambil bobot dari KpiWeight atau default
    const weightConfig = kpi.weights.find((w) => w.divisionId === kpi.divisionId)
    const weightPct = weightConfig?.weightPct || 20
    const greenMin = weightConfig?.greenMin || 90
    const yellowMin = weightConfig?.yellowMin || 75

    let status: "GREEN" | "YELLOW" | "RED" = "RED"
    if (achievementPct >= greenMin) {
      status = "GREEN"
    } else if (achievementPct >= yellowMin) {
      status = "YELLOW"
    }

    const weightedScore = (achievementPct * weightPct) / 100

    metrics.push({
      kpiId: kpi.id,
      kpiName: kpi.name,
      divisionName: divName,
      targetValue: targetVal,
      actualValue: Math.round(actualVal * 100) / 100,
      unit: kpi.measureUnit,
      achievementPct,
      status,
      weightPct,
      weightedScore: Math.round(weightedScore * 10) / 10,
    })

    if (!divisionScoreAccumulator[divName]) {
      divisionScoreAccumulator[divName] = { totalWeighted: 0, totalWeight: 0 }
    }
    divisionScoreAccumulator[divName].totalWeighted += weightedScore
    divisionScoreAccumulator[divName].totalWeight += weightPct

    totalWeightedSum += weightedScore
    totalWeightSum += weightPct
  }

  // Hitung rata-rata skor per divisi
  const divisionScores: Record<string, number> = {}
  Object.keys(divisionScoreAccumulator).forEach((div) => {
    const item = divisionScoreAccumulator[div]
    divisionScores[div] =
      item.totalWeight > 0
        ? Math.round((item.totalWeighted / item.totalWeight) * 100)
        : 0
  })

  const totalScore =
    totalWeightSum > 0
      ? Math.round((totalWeightedSum / totalWeightSum) * 100)
      : 0

  let overallStatus: "GREEN" | "YELLOW" | "RED" = "GREEN"
  if (totalScore < 70) {
    overallStatus = "RED"
  } else if (totalScore < 85) {
    overallStatus = "YELLOW"
  }

  return {
    outletId: outlet.id,
    outletName: outlet.name,
    totalScore,
    status: overallStatus,
    divisionScores,
    metrics,
  }
}

export async function generateEarlyWarnings(outletId: string): Promise<number> {
  const summary = await calculateOutletKpiScore(outletId)
  let alertCount = 0

  for (const m of summary.metrics) {
    if (m.status === "RED") {
      const existing = await prisma.earlyWarningAlert.findFirst({
        where: {
          outletId,
          kpiId: m.kpiId,
          isAcknowledged: false,
        },
      })

      if (!existing) {
        await prisma.earlyWarningAlert.create({
          data: {
            outletId,
            kpiId: m.kpiId,
            alertType: "CRITICAL_GAP",
            severity: "CRITICAL",
            message: `Pencapaian ${m.kpiName} hanya ${m.achievementPct}% dari target (${m.actualValue}/${m.targetValue} ${m.unit}).`,
          },
        })
        alertCount++
      }
    }
  }

  return alertCount
}
