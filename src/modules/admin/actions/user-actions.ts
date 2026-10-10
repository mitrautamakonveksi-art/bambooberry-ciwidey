"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/shared/lib/prisma"
import { recordAuditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isOwnerOrAdmin } from "@/shared/lib/auth"
import { AuditAction, RoleType } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Super Admin atau Owner yang dapat membuat pengguna baru")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as RoleType
  const divisionId = (formData.get("divisionId") as string) || null
  const outletIds = formData.getAll("outletIds") as string[]

  if (!name || !email || !password || !role) {
    throw new Error("Mohon lengkapi seluruh field yang wajib diisi")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      divisionId: divisionId || undefined,
      outlets: {
        connect: outletIds.map((id) => ({ id })),
      },
    },
    include: { outlets: true },
  })

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.CREATE,
    entityName: "User",
    entityId: newUser.id,
    newData: { name: newUser.name, email: newUser.email, role: newUser.role },
  })

  revalidatePath("/admin/users")
}

export async function updateUserRole(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !isOwnerOrAdmin(currentUser)) {
    throw new Error("Akses ditolak: Hanya Super Admin atau Owner yang dapat mengubah peran pengguna")
  }

  const userId = formData.get("userId") as string
  const role = formData.get("role") as RoleType
  const isActive = formData.get("isActive") === "true"

  const oldUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!oldUser) throw new Error("Pengguna tidak ditemukan")

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role, isActive },
  })

  await recordAuditLog({
    userId: currentUser?.id,
    action: AuditAction.UPDATE,
    entityName: "User",
    entityId: userId,
    oldData: { role: oldUser.role, isActive: oldUser.isActive },
    newData: { role: updatedUser.role, isActive: updatedUser.isActive },
  })

  revalidatePath("/admin/users")
}
