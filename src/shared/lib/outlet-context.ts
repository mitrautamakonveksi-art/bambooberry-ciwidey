import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { UserSession } from "../types"

export interface EffectiveOutletContext {
  outletId: string | undefined // undefined means "ALL" (consolidated across all outlets)
  isConsolidated: boolean
  rawCookieValue?: string
}

export async function getEffectiveOutlet(
  user?: UserSession | null
): Promise<EffectiveOutletContext> {
  const cookieStore = await cookies()
  const cookieOutlet = cookieStore.get("ibms_outlet")?.value

  if (cookieOutlet === "ALL") {
    return {
      outletId: undefined,
      isConsolidated: true,
      rawCookieValue: "ALL",
    }
  }

  if (cookieOutlet && cookieOutlet.trim() !== "") {
    // Verifikasi outlet di cookie valid dan aktif
    const outlet = await prisma.outlet.findFirst({
      where: { id: cookieOutlet, isActive: true },
      select: { id: true },
    })
    if (outlet) {
      return {
        outletId: outlet.id,
        isConsolidated: false,
        rawCookieValue: outlet.id,
      }
    }
  }

  // Fallback ke outlet aktif pengguna jika ada
  if (user?.activeOutletId) {
    return {
      outletId: user.activeOutletId,
      isConsolidated: false,
      rawCookieValue: user.activeOutletId,
    }
  }

  // Fallback ke outlet aktif pertama yang terdaftar
  const defaultOutlet = await prisma.outlet.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true },
  })

  return {
    outletId: defaultOutlet?.id,
    isConsolidated: false,
    rawCookieValue: defaultOutlet?.id,
  }
}
