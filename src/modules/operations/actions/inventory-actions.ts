"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { ChecklistType } from "@prisma/client"

// === INVENTARIS OUTLET ===

export async function getOutletInventory(outletId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const items = await prisma.outletInventoryItem.findMany({
    where: { outletId },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  })

  return items.map((inv) => ({
    ...inv,
    product: {
      ...inv.product,
      sku: inv.product.code,
      costPrice: inv.product.standardCost,
      uom: inv.product.unit,
    },
  }))
}

export async function adjustStock(
  outletId: string,
  productId: string,
  quantity: number,
  type: "IN" | "OUT" | "WASTE" | "OPNAME",
  reason: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const product = await prisma.productItem.findUnique({
    where: { id: productId },
  })
  if (!product) throw new Error("Produk tidak ditemukan")

  const existingInventory = await prisma.outletInventoryItem.findUnique({
    where: {
      outletId_productId: { outletId, productId },
    },
  })

  const currentStock = existingInventory ? existingInventory.currentStock : 0
  let newQuantity = currentStock

  if (type === "IN") {
    newQuantity += quantity
  } else if (type === "OUT" || type === "WASTE") {
    newQuantity -= quantity
  } else if (type === "OPNAME") {
    // Pada Stock Opname, quantity adalah nilai fisik aktual yang dihitung
    newQuantity = quantity
  }

  if (newQuantity < 0) {
    throw new Error(`Stok tidak mencukupi untuk penyesuaian ini. Sisa stok saat ini: ${currentStock}`)
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update atau Buat item inventaris outlet
    const updatedInv = await tx.outletInventoryItem.upsert({
      where: {
        outletId_productId: { outletId, productId },
      },
      update: {
        currentStock: newQuantity,
      },
      create: {
        outletId,
        productId,
        currentStock: newQuantity,
        minBufferStock: 10, // Default buffer/safety stock
        unit: product.unit,
      },
    })

    // 2. Jika mutasi adalah WASTE, simpan ke WasteLog
    if (type === "WASTE") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await tx.wasteLog.create({
        data: {
          outletId,
          productId,
          recordedById: user.id,
          date: today,
          quantity,
          unit: product.unit,
          reason,
          costAmount: quantity * product.standardCost,
        },
      })
    }

    // 3. Jika mutasi adalah OPNAME, catat riwayat opname
    if (type === "OPNAME") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diff = quantity - currentStock

      const opname = await tx.stockOpname.create({
        data: {
          outletId,
          conductedById: user.id,
          opnameDate: today,
          notes: `Penyesuaian Opname Satuan: ${reason}`,
          status: "COMPLETED",
        },
      })

      await tx.stockOpnameItem.create({
        data: {
          opnameId: opname.id,
          productId,
          systemStock: currentStock,
          physicalStock: quantity,
          difference: diff,
          reason,
        },
      })
    }

    return updatedInv
  })

  await auditLog(
    "UPDATE",
    "OutletInventoryItem",
    result.id,
    {
      outletId,
      productId,
      type,
      quantity,
      prevStock: currentStock,
      newStock: newQuantity,
      reason,
    },
    user.id
  )

  revalidatePath("/operations")
  revalidatePath("/operations/inventory")
  revalidatePath("/operations/waste")

  return result
}

// === PENCATATAN BAHAN TERBUANG (WASTE LOG) ===

export async function getWasteLogs(outletId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.wasteLog.findMany({
    where: outletId ? { outletId } : undefined,
    include: {
      outlet: true,
      product: {
        include: { category: true },
      },
      recordedBy: true,
    },
    orderBy: { date: "desc" },
    take: 50,
  })
}

export async function recordWaste(
  outletId: string,
  productId: string,
  quantity: number,
  unit: string,
  reason: string
) {
  return await adjustStock(outletId, productId, quantity, "WASTE", reason)
}

// === STOCK OPNAME MASSAL ===

export async function getStockOpnames(outletId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  return await prisma.stockOpname.findMany({
    where: outletId ? { outletId } : undefined,
    include: {
      outlet: true,
      conductedBy: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { opnameDate: "desc" },
    take: 20,
  })
}

export async function recordBulkStockOpname(
  outletId: string,
  items: {
    productId: string
    physicalStock: number
    systemStock: number
    reason?: string
  }[],
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const opname = await prisma.$transaction(async (tx) => {
    const header = await tx.stockOpname.create({
      data: {
        outletId,
        conductedById: user.id,
        opnameDate: today,
        notes: notes || "Stock Opname Rutin",
        status: "COMPLETED",
      },
    })

    for (const item of items) {
      const diff = item.physicalStock - item.systemStock

      await tx.stockOpnameItem.create({
        data: {
          opnameId: header.id,
          productId: item.productId,
          systemStock: item.systemStock,
          physicalStock: item.physicalStock,
          difference: diff,
          reason: item.reason || null,
        },
      })

      // Update actual stock di outlet inventory
      await tx.outletInventoryItem.upsert({
        where: {
          outletId_productId: { outletId, productId: item.productId },
        },
        update: {
          currentStock: item.physicalStock,
        },
        create: {
          outletId,
          productId: item.productId,
          currentStock: item.physicalStock,
          minBufferStock: 10,
          unit: "PCS",
        },
      })
    }

    return header
  })

  await auditLog("CREATE", "StockOpname", opname.id, { outletId, itemCount: items.length }, user.id)
  revalidatePath("/operations")
  revalidatePath("/operations/inventory")

  return opname
}

// === SOP CHECKLISTS (OPENING, CLOSING & HYGIENE) ===

export async function ensureDefaultChecklistTemplates() {
  const count = await prisma.dailyChecklistTemplate.count()
  if (count === 0) {
    const operationDivision = await prisma.division.findFirst({
      where: { name: { contains: "Operat", mode: "insensitive" } },
    })

    if (operationDivision) {
      const defaultTemplates = [
        {
          divisionId: operationDivision.id,
          type: ChecklistType.OPENING,
          title: "SOP Opening Outlet F&B (Pagi)",
          items: [
            { id: "1", text: "Nyalakan lampu utama, AC, dan musik latar outlet", category: "Ambience" },
            { id: "2", text: "Cek suhu chiller (1-4°C) dan freezer (-18°C)", category: "Kitchen" },
            { id: "3", text: "Siapkan laci kasir dan modal uang pecahan kecil (opening float)", category: "Cashier" },
            { id: "4", text: "Sanitasi meja saji, area bar, dan peralatan makan", category: "Hygiene" },
            { id: "5", text: "Briefing 5 menit pembagian tugas shift pagi", category: "Team" },
          ],
        },
        {
          divisionId: operationDivision.id,
          type: ChecklistType.CLOSING,
          title: "SOP Closing Outlet F&B (Malam)",
          items: [
            { id: "1", text: "Tutup shift kasir dan cetak settlement POS / EDC", category: "Cashier" },
            { id: "2", text: "Buang sampah dapur & ganti plastik sampah baru", category: "Hygiene" },
            { id: "3", text: "Tutup rapat dan beri label tanggal semua bahan sisa (First In First Out)", category: "Kitchen" },
            { id: "4", text: "Matikan kompor gas, mesin kopi, dan peralatan elektronik non-chiller", category: "Safety" },
            { id: "5", text: "Kunci pintu outlet dan aktifkan sistem keamanan/alarm", category: "Security" },
          ],
        },
      ]

      for (const t of defaultTemplates) {
        await prisma.dailyChecklistTemplate.create({
          data: t,
        })
      }
    }
  }

  return await prisma.dailyChecklistTemplate.findMany({
    where: { isActive: true },
    include: { division: true },
  })
}

export async function getChecklistTemplates() {
  return await ensureDefaultChecklistTemplates()
}

export async function getTodayChecklists(outletId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return await prisma.dailyChecklistSubmission.findMany({
    where: {
      outletId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      template: true,
      submittedBy: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function submitChecklist(
  outletId: string,
  templateId: string,
  responses: Record<string, boolean>,
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const template = await prisma.dailyChecklistTemplate.findUnique({
    where: { id: templateId },
  })
  if (!template) throw new Error("Template checklist tidak ditemukan")

  const items = template.items as Array<{ id: string; text: string }>
  const totalItems = items.length
  let checkedCount = 0

  for (const item of items) {
    if (responses[item.id] === true) {
      checkedCount++
    }
  }

  const scorePct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 100

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const submission = await prisma.dailyChecklistSubmission.create({
    data: {
      outletId,
      templateId,
      submittedById: user.id,
      date: today,
      responses,
      scorePct,
      notes: notes || null,
    },
  })

  await auditLog("CREATE", "DailyChecklistSubmission", submission.id, { outletId, scorePct }, user.id)
  revalidatePath("/operations")
  revalidatePath("/operations/checklists")

  return submission
}
