import { prisma } from "./prisma"
import { AuditAction, Prisma } from "@prisma/client"

export interface AuditLogParams {
  userId?: string | null
  action: AuditAction
  entityName: string
  entityId: string
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function recordAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityName: params.entityName,
        entityId: params.entityId,
        oldData: params.oldData ? (params.oldData as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: params.newData ? (params.newData as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    })
  } catch (error) {
    // Non-blocking error handling agar operasi utama tidak gagal jika audit log error
    console.error("[AuditLogger] Gagal menyimpan log audit:", error)
  }
}

export async function auditLog(
  action: AuditAction | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT",
  entityName: string,
  entityId: string,
  data?: Record<string, unknown> | null,
  userId?: string | null
) {
  const auditAction = action as AuditAction
  await recordAuditLog({
    userId,
    action: auditAction,
    entityName,
    entityId,
    newData: data,
  })
}

