"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ContractType } from "@prisma/client"

const EmployeeSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "Pengguna akun wajib dipilih"),
  nik: z.string().min(1, "NIK wajib diisi"),
  positionTitle: z.string().min(1, "Jabatan / Posisi wajib diisi"),
  phone: z.string().optional(),
  joinDate: z.string().min(1, "Tanggal bergabung wajib diisi"),
  contractType: z.enum(["PKWT", "PKWTT", "PROBATION", "DAILY_WORKER"]).default("PKWT"),
  contractEndDate: z.string().optional(),
  baseSalary: z.number().optional().default(0),
  emergencyContact: z.string().optional(),
})

export type UpsertEmployeeInput = z.infer<typeof EmployeeSchema>

export async function getEmployees(outletId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.employeeProfile.findMany({
    where: outletId
      ? {
          user: {
            outlets: {
              some: { id: outletId },
            },
          },
        }
      : undefined,
    include: {
      user: {
        include: {
          outlets: true,
          division: true,
        },
      },
      turnoverRecord: true,
      _count: {
        select: { trainings: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  })
}

export async function getEmployeeById(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.employeeProfile.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          outlets: true,
          division: true,
        },
      },
      trainings: {
        include: { program: true },
      },
      turnoverRecord: true,
    },
  })
}

export async function upsertEmployee(data: UpsertEmployeeInput) {
  const user = await getCurrentUser()
  if (!isManagerOrAbove(user)) throw new Error("Akses ditolak: Hanya Manager/Owner yang dapat mengelola data karyawan")

  const validated = EmployeeSchema.parse(data)

  const payload = {
    userId: validated.userId,
    nik: validated.nik,
    positionTitle: validated.positionTitle,
    phone: validated.phone || null,
    joinDate: new Date(validated.joinDate),
    contractType: validated.contractType as ContractType,
    contractEndDate: validated.contractEndDate ? new Date(validated.contractEndDate) : null,
    baseSalary: validated.baseSalary || 0,
    emergencyContact: validated.emergencyContact || null,
  }

  let employee

  if (validated.id) {
    employee = await prisma.employeeProfile.update({
      where: { id: validated.id },
      data: payload,
    })
    await auditLog("UPDATE", "EmployeeProfile", validated.id, payload, user?.id)
  } else {
    employee = await prisma.employeeProfile.create({
      data: payload,
    })
    await auditLog("CREATE", "EmployeeProfile", employee.id, payload, user?.id)
  }

  revalidatePath("/hr/employees")
  revalidatePath("/hr")
  return employee
}

export async function deleteEmployee(id: string) {
  const user = await getCurrentUser()
  if (!isManagerOrAbove(user)) throw new Error("Akses ditolak")

  await prisma.employeeProfile.delete({
    where: { id },
  })

  await auditLog("DELETE", "EmployeeProfile", id, null, user?.id)
  revalidatePath("/hr/employees")
  revalidatePath("/hr")
}

export async function getUsersWithoutEmployee() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.user.findMany({
    where: {
      employeeProfile: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: { select: { name: true } },
      outlets: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  })
}
