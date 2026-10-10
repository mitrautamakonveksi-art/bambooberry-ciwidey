"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isOwnerOrAdmin } from "@/shared/lib/auth"
import { AuditAction } from "@prisma/client"

export async function createOutlet(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Super Admin atau Owner yang dapat membuat outlet baru")
  }

  const name = formData.get("name") as string
  const location = formData.get("location") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  if (!name) throw new Error("Nama outlet wajib diisi")

  const newOutlet = await prisma.outlet.create({
    data: {
      name,
      location: location || null,
      phone: phone || null,
      address: address || null,
      isActive: true,
    },
  })

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.CREATE,
    entityName: "Outlet",
    entityId: newOutlet.id,
    newData: { name: newOutlet.name, location: newOutlet.location },
  })

  revalidatePath("/admin/outlets")
}

export async function toggleOutletStatus(outletId: string, currentStatus: boolean) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Super Admin atau Owner yang dapat mengubah status outlet")
  }

  const updated = await prisma.outlet.update({
    where: { id: outletId },
    data: { isActive: !currentStatus },
  })

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.UPDATE,
    entityName: "Outlet",
    entityId: outletId,
    oldData: { isActive: currentStatus },
    newData: { isActive: updated.isActive },
  })

  revalidatePath("/admin/outlets")
}
