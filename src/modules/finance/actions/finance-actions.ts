"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { AccountType } from "@prisma/client"

// === HELPER: AUTO-SEED CHART OF ACCOUNTS (COA) STANDAR F&B ===

export async function ensureDefaultChartOfAccounts() {
  const catCount = await prisma.accountCategory.count()
  if (catCount === 0) {
    const defaultCategories = [
      { code: "1000", name: "Aset & Kas", type: AccountType.ASSET },
      { code: "2000", name: "Kewajiban & Utang", type: AccountType.LIABILITY },
      { code: "3000", name: "Modal & Ekuitas", type: AccountType.EQUITY },
      { code: "4000", name: "Pendapatan Penjualan", type: AccountType.REVENUE },
      { code: "5000", name: "Harga Pokok Penjualan (HPP)", type: AccountType.EXPENSE },
      { code: "6000", name: "Beban Operasional Cabang", type: AccountType.EXPENSE },
    ]

    for (const cat of defaultCategories) {
      const createdCat = await prisma.accountCategory.upsert({
        where: { code: cat.code },
        update: {},
        create: cat,
      })

      // Buat akun-akun standar di bawah kategori
      if (cat.code === "1000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "1101", name: "Kas Laci Kasir (Cash in Drawer)" },
            { categoryId: createdCat.id, code: "1102", name: "Rekening Bank Operasional" },
            { categoryId: createdCat.id, code: "1103", name: "Kliring EDC & QRIS Settlement" },
            { categoryId: createdCat.id, code: "1301", name: "Persediaan Bahan Baku & F&B" },
          ],
        })
      } else if (cat.code === "2000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "2101", name: "Utang Usaha Supplier Bahan Baku" },
            { categoryId: createdCat.id, code: "2102", name: "Utang Gaji & Upah Karyawan" },
          ],
        })
      } else if (cat.code === "3000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "3101", name: "Modal Usaha Disetor" },
            { categoryId: createdCat.id, code: "3201", name: "Laba Ditahan (Retained Earnings)" },
          ],
        })
      } else if (cat.code === "4000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "4101", name: "Penjualan Makanan & Minuman Dine-In" },
            { categoryId: createdCat.id, code: "4102", name: "Penjualan Takeaway & Layanan Online" },
          ],
        })
      } else if (cat.code === "5000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "5101", name: "HPP Bahan Baku Makanan & Minuman" },
            { categoryId: createdCat.id, code: "5102", name: "HPP Kemasan & Packaging" },
          ],
        })
      } else if (cat.code === "6000") {
        await prisma.account.createMany({
          data: [
            { categoryId: createdCat.id, code: "6101", name: "Beban Gaji & Upah Karyawan" },
            { categoryId: createdCat.id, code: "6201", name: "Beban Listrik, Air, & Gas Outlet" },
            { categoryId: createdCat.id, code: "6301", name: "Beban Pemeliharaan & Perbaikan Alat" },
            { categoryId: createdCat.id, code: "6401", name: "Beban Operasional & Kebersihan" },
          ],
        })
      }
    }
  }

  return await prisma.accountCategory.findMany({
    include: {
      accounts: {
        orderBy: { code: "asc" },
      },
    },
    orderBy: { code: "asc" },
  })
}

// === CHART OF ACCOUNTS (COA) ===

export async function getChartOfAccounts() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  await ensureDefaultChartOfAccounts()

  return await prisma.account.findMany({
    include: {
      category: true,
    },
    orderBy: [{ category: { type: "asc" } }, { code: "asc" }],
  })
}

// === DAILY SALES RECONCILIATION (SETTLEMENT) ===

const DailySalesSchema = z.object({
  outletId: z.string().min(1, "Outlet wajib dipilih"),
  date: z.string(), // YYYY-MM-DD
  totalRevenue: z.number().min(0),
  cashAmount: z.number().min(0),
  edcAmount: z.number().min(0),
  qrisAmount: z.number().min(0),
  onlineAmount: z.number().min(0).optional().default(0),
  actualCashInDrawer: z.number().min(0),
  notes: z.string().optional(),
})

export type DailySalesInput = z.input<typeof DailySalesSchema>

export async function submitDailySales(data: DailySalesInput) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const validated = DailySalesSchema.parse(data)
  const targetDate = new Date(validated.date)

  // Hitung selisih kas (Cash Difference)
  // Uang yang seharusnya disetor tunai vs Uang fisik aktual di laci kasir
  const expectedCash = validated.cashAmount
  const cashDifference = validated.actualCashInDrawer - expectedCash

  // Cari akun pendapatan default (4101) dan kas (1101) untuk pencatatan buku besar
  await ensureDefaultChartOfAccounts()
  const revenueAccount = await prisma.account.findFirst({
    where: { code: "4101" },
  })

  const result = await prisma.$transaction(async (tx) => {
    // 1. Simpan rekap rekonsiliasi POS harian (PosReconciliation)
    const settlement = await tx.posReconciliation.upsert({
      where: {
        outletId_reconDate: {
          outletId: validated.outletId,
          reconDate: targetDate,
        },
      },
      update: {
        posGrossSales: validated.totalRevenue,
        posNetSales: validated.totalRevenue,
        cashCollected: validated.cashAmount,
        edcCollected: validated.edcAmount,
        qrisCollected: validated.qrisAmount,
        discrepancyAmount: cashDifference,
        discrepancyNotes: validated.notes || (cashDifference !== 0 ? `Selisih kas: Rp ${cashDifference.toLocaleString("id-ID")}` : null),
        status: Math.abs(cashDifference) <= 1000 ? "MATCHED" : "DISCREPANCY",
      },
      create: {
        outletId: validated.outletId,
        reconDate: targetDate,
        posGrossSales: validated.totalRevenue,
        posNetSales: validated.totalRevenue,
        cashCollected: validated.cashAmount,
        edcCollected: validated.edcAmount,
        qrisCollected: validated.qrisAmount,
        discrepancyAmount: cashDifference,
        discrepancyNotes: validated.notes || (cashDifference !== 0 ? `Selisih kas: Rp ${cashDifference.toLocaleString("id-ID")}` : null),
        status: Math.abs(cashDifference) <= 1000 ? "MATCHED" : "DISCREPANCY",
      },
    })

    // 2. Simpan Sesi Register Kasir (CashRegisterSession) untuk jejak audit kasir
    await tx.cashRegisterSession.create({
      data: {
        outletId: validated.outletId,
        cashierUserId: user.id,
        openedAt: targetDate,
        closedAt: new Date(),
        openingFloat: 0,
        totalCashSales: validated.cashAmount,
        totalNonCashSales: validated.edcAmount + validated.qrisAmount + (validated.onlineAmount || 0),
        actualCashCount: validated.actualCashInDrawer,
        cashDifference,
        status: "CLOSED",
        notes: validated.notes || null,
      },
    })

    // 3. Catat ke Buku Besar (TransactionEntry) sebagai Pendapatan
    if (revenueAccount) {
      await tx.transactionEntry.create({
        data: {
          outletId: validated.outletId,
          accountId: revenueAccount.id,
          date: targetDate,
          amount: validated.totalRevenue,
          type: "INCOME",
          description: `Daily POS Sales Settlement - ${validated.date}`,
          referenceNo: settlement.id,
        },
      })
    }

    // 4. Pemicu Peringatan Dini (EarlyWarningAlert) jika selisih kas minus terlalu besar (> Rp 50.000)
    if (cashDifference < -50000) {
      await tx.earlyWarningAlert.create({
        data: {
          outletId: validated.outletId,
          alertType: "FINANCE",
          severity: "HIGH",
          message: `Selisih Kas Minus Kritis: Rp ${Math.abs(cashDifference).toLocaleString("id-ID")} pada penutupan kasir ${validated.date}`,
          isAcknowledged: false,
        },
      })
    }

    return settlement
  })

  await auditLog("CREATE", "PosReconciliation", result.id, { ...validated, cashDifference }, user.id)
  revalidatePath("/finance")
  revalidatePath("/finance/sales")
  return result
}

export async function getDailySalesSettlements(outletId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.posReconciliation.findMany({
    where: outletId ? { outletId } : undefined,
    include: {
      outlet: true,
    },
    orderBy: { reconDate: "desc" },
    take: 30,
  })
}

// === P&L SUMMARY (LABA RUGI EKSEKUTIF SEDERHANA) ===

export async function getProfitAndLoss(outletId?: string, month?: number, year?: number) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Akses ditolak")

  const targetMonth = month || new Date().getMonth() + 1
  const targetYear = year || new Date().getFullYear()

  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  // 1. Ambil seluruh transaksi buku besar (TransactionEntry)
  const entries = await prisma.transactionEntry.findMany({
    where: {
      outletId: outletId || undefined,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      account: {
        include: { category: true },
      },
    },
  })

  let totalIncome = 0
  let totalExpense = 0

  const expenseBreakdown: Record<string, number> = {}

  for (const entry of entries) {
    if (entry.type === "INCOME" || entry.account?.category?.type === AccountType.REVENUE) {
      totalIncome += entry.amount
    } else if (entry.type === "EXPENSE" || entry.account?.category?.type === AccountType.EXPENSE) {
      totalExpense += entry.amount
      const categoryName = entry.account?.category?.name || "Beban Lainnya"
      expenseBreakdown[categoryName] = (expenseBreakdown[categoryName] || 0) + entry.amount
    }
  }

  // Jika belum ada entri buku besar, ambil juga dari PosReconciliation (pendapatan) dan ExpenseRequest yang APPROVED (pengeluaran)
  if (totalIncome === 0) {
    const posRecords = await prisma.posReconciliation.findMany({
      where: {
        outletId: outletId || undefined,
        reconDate: { gte: startDate, lte: endDate },
      },
    })
    totalIncome = posRecords.reduce((acc, p) => acc + p.posNetSales, 0)
  }

  if (totalExpense === 0) {
    const expenses = await prisma.expenseRequest.findMany({
      where: {
        outletId: outletId || undefined,
        status: "APPROVED",
        createdAt: { gte: startDate, lte: endDate },
      },
    })
    totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0)
    for (const exp of expenses) {
      expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + exp.amount
    }
  }

  const netProfit = totalIncome - totalExpense
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  return {
    period: `${targetMonth}/${targetYear}`,
    monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    totalIncome,
    totalExpense,
    netProfit,
    margin,
    expenseBreakdown,
  }
}
