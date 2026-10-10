"use server"

import { prisma } from "@/shared/lib/prisma"

export async function getAuditLogs(limit: number = 50, entityFilter?: string) {
  return await prisma.auditLog.findMany({
    where: entityFilter ? { entityName: entityFilter } : undefined,
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })
}
