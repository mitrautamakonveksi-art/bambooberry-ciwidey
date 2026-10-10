import { RoleType } from "@prisma/client"

export interface UserSession {
  id: string
  name: string
  email: string
  role: RoleType
  divisionId?: string | null
  outletIds: string[]
  activeOutletId?: string | null
}

export interface OutletOption {
  id: string
  name: string
  location?: string | null
  isActive: boolean
}

export interface MetricScore {
  kpiId: string
  kpiName: string
  divisionName: string
  targetValue: number
  actualValue: number
  unit: string
  achievementPct: number
  status: "GREEN" | "YELLOW" | "RED"
  weightPct: number
  weightedScore: number
}

export interface ExecutiveSummaryScore {
  outletId: string
  outletName: string
  totalScore: number
  status: "GREEN" | "YELLOW" | "RED"
  divisionScores: Record<string, number>
  metrics: MetricScore[]
}
