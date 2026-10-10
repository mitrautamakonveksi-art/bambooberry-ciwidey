"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ExpenseStatus } from "@prisma/client"
import { ensureDefaultChartOfAccounts } from "./finance-actions"

const ExpenseRequestSchema = z.object({
  outletId: z.string().min(1, "Outlet wajib dipilih"),
  category: z.string().min(1, "Kategori beban wajib dipilih"),
  amount: z.number().min(1, "Nominal pengeluaran harus lebih dari 0"),
  description: z.string().min(5, "Deskripsi pengeluaran minimal 5 karakter"),
  proofUrl: z.string().optional(),
})

export type ExpenseRequestInput = z.infer<typeof ExpenseRequestSchema>

export async function getPendingExpenses(outletId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.expenseRequest.findMany({
    where: {
      status: ExpenseStatus.PENDING,
      outletId: outletId || undefined,
    },
    include: {
      outlet: true,
      requester: true,
      approvals: {
        include: { approver: true },
        orderBy: { actionAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAllExpenses(outletId?: string, status?: ExpenseStatus) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.expenseRequest.findMany({
    where: {
      outletId: outletId || undefined,
      status: status || undefined,
    },
    include: {
      outlet: true,
      requester: true,
      approvals: {
        include: { approver: true },
        orderBy: { actionAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export async function submitExpenseRequest(data: ExpenseRequestInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const validated = ExpenseRequestSchema.parse(data)

  const expense = await prisma.expenseRequest.create({
    data: {
      outletId: validated.outletId,
      requesterId: user.id,
      category: validated.category,
      amount: validated.amount,
      description: validated.description,
      proofUrl: validated.proofUrl || null,
      currentTier: validated.amount > 1000000 ? 2 : 1,
      status: ExpenseStatus.PENDING,
    },
  })

  await auditLog("CREATE", "ExpenseRequest", expense.id, validated, user.id)
  revalidatePath("/finance")
  revalidatePath("/finance/expenses")
  return expense
}

export async function processExpenseApproval(
  expenseId: string,
  action: "APPROVE" | "REJECT",
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user || user.role === "STAFF") {
    throw new Error("Akses ditolak. Dibutuhkan hak akses Manager atau Owner.")
  }

  const expense = await prisma.expenseRequest.findUnique({
    where: { id: expenseId },
  })
  if (!expense) throw new Error("Pengajuan pengeluaran tidak ditemukan")
  if (expense.status !== ExpenseStatus.PENDING) {
    throw new Error("Pengajuan ini sudah diproses sebelumnya")
  }

  // Aturan Tiered Approval:
  // Jika pengeluaran > Rp 1.000.000 wajib disetujui oleh Owner / Super Admin
  if (action === "APPROVE" && expense.amount > 1000000 && user.role !== "OWNER" && user.role !== "SUPER_ADMIN") {
    throw new Error("Pengeluaran di atas Rp 1.000.000 wajib disetujui oleh Owner.")
  }

  // Cari akun COA Beban Operasional Cabang (6401)
  await ensureDefaultChartOfAccounts()
  const expenseAccount = await prisma.account.findFirst({
    where: { code: "6401" },
  })

  const newStatus = action === "APPROVE" ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update status pada ExpenseRequest
    const updated = await tx.expenseRequest.update({
      where: { id: expenseId },
      data: {
        status: newStatus,
      },
    })

    // 2. Simpan jejak approval ke tabel ExpenseApproval
    await tx.expenseApproval.create({
      data: {
        requestId: expenseId,
        approverId: user.id,
        tierLevel: expense.amount > 1000000 ? 2 : 1,
        status: newStatus,
        notes: notes || null,
      },
    })

    // 3. Jika disetujui (APPROVE), otomatis dicatat ke Buku Besar (TransactionEntry)
    if (action === "APPROVE" && expenseAccount) {
      await tx.transactionEntry.create({
        data: {
          outletId: updated.outletId,
          accountId: expenseAccount.id,
          date: new Date(),
          amount: updated.amount,
          type: "EXPENSE",
          description: `[Expense Approved] ${updated.category}: ${updated.description}`,
          referenceNo: updated.id,
        },
      })
    }

    return updated
  })

  await auditLog("UPDATE", "ExpenseRequest", result.id, { action, notes, approverId: user.id }, user.id)
  revalidatePath("/finance")
  revalidatePath("/finance/expenses")
  return result
}
