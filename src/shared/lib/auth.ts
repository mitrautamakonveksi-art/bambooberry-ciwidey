import { RoleType } from "@prisma/client"
import { prisma } from "./prisma"
import { UserSession } from "../types"

export async function getCurrentUser(): Promise<UserSession | null> {
  // Ambil user aktif dari database (prioritas: OWNER/ADMIN, atau user pertama yang aktif)
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { role: "asc" }, // SUPER_ADMIN -> OWNER -> MANAGER -> SUPERVISOR -> STAFF
    include: { outlets: true },
  })

  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    divisionId: user.divisionId,
    outletIds: user.outlets.map((o) => o.id),
    activeOutletId: user.outlets[0]?.id || null,
  }
}

export function isOwnerOrAdmin(roleOrUser: RoleType | UserSession | null): boolean {
  if (!roleOrUser) return false
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role
  return role === RoleType.SUPER_ADMIN || role === RoleType.OWNER
}

export function isManagerOrAbove(roleOrUser: RoleType | UserSession | null): boolean {
  if (!roleOrUser) return false
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role
  return (
    role === RoleType.SUPER_ADMIN ||
    role === RoleType.OWNER ||
    role === RoleType.MANAGER
  )
}

export function isSupervisorOrAbove(roleOrUser: RoleType | UserSession | null): boolean {
  if (!roleOrUser) return false
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role
  return (
    role === RoleType.SUPER_ADMIN ||
    role === RoleType.OWNER ||
    role === RoleType.MANAGER ||
    role === RoleType.SUPERVISOR
  )
}

export function canAccessModule(role: RoleType, module: string): boolean {
  if (role === RoleType.SUPER_ADMIN || role === RoleType.OWNER) return true

  switch (module) {
    case "admin":
      return false
    case "analytics":
      return isManagerOrAbove(role)
    case "finance":
      return isManagerOrAbove(role)
    case "ai":
      return isManagerOrAbove(role)
    case "hr":
    case "operations":
    case "products":
    case "marketing":
      return true
    default:
      return true
  }
}
