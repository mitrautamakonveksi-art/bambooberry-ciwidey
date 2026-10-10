"use server"

import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { revalidatePath } from "next/cache"

// Inisialisasi Gemini SDK (Mendukung environment variable GEMINI_API_KEY)
const apiKey = process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_BUILD"
const genAI = new GoogleGenerativeAI(apiKey)

export interface AiQueryResult {
  answer: string
  isFallback: boolean
  sources: string[]
}

/**
 * Tanya Jawab AI Eksekutif berbasis Konteks Bisnis Riil & RBAC Guardrail
 */
export async function askExecutiveAI(
  query: string,
  outletId?: string
): Promise<AiQueryResult> {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) {
    throw new Error("Akses ditolak. Hanya Manajemen dan Owner yang dapat mengakses AI Intelligence.")
  }

  try {
    // 1. KUMPULKAN KONTEKS BISNIS (Context Injection / Guardrail)
    const accessFilter = outletId
      ? { outletId }
      : user.role === "MANAGER" && user.activeOutletId
      ? { outletId: user.activeOutletId }
      : undefined

    const [alerts, outlets, products, openKaizens, recentComplaints, reconciliations] =
      await Promise.all([
        prisma.earlyWarningAlert.findMany({
          where: {
            isAcknowledged: false,
            ...(accessFilter?.outletId ? { outletId: accessFilter.outletId } : {}),
          },
          include: { outlet: true },
          take: 5,
          orderBy: { triggeredAt: "desc" },
        }),
        prisma.outlet.findMany({
          where: accessFilter?.outletId ? { id: accessFilter.outletId } : { isActive: true },
          select: { id: true, name: true, location: true },
        }),
        prisma.productItem.findMany({
          where: { type: "FINISHED_GOOD", isActive: true },
          select: { name: true, sellingPrice: true, standardCost: true },
          take: 10,
        }),
        prisma.kaizen.findMany({
          where: { status: "OPEN" },
          include: {
            dailyItem: {
              include: { kpi: true },
            },
          },
          take: 5,
        }),
        prisma.customerComplaint.findMany({
          where: {
            status: { in: ["OPEN", "IN_PROGRESS"] },
            ...(accessFilter?.outletId ? { outletId: accessFilter.outletId } : {}),
          },
          take: 5,
        }),
        prisma.posReconciliation.findMany({
          where: {
            status: "DISCREPANCY",
            ...(accessFilter?.outletId ? { outletId: accessFilter.outletId } : {}),
          },
          include: { outlet: true },
          take: 3,
        }),
      ])

    // Format Konteks Data Bisnis F&B
    let contextData = `DATA BISNIS SAAT INI (BAMBOOBERRY RESTORAN & KAFE CIWIDEY):\n`
    contextData += `- Cabang Terpantau: ${outlets.map((o) => `${o.name} (${o.location || "Ciwidey"})`).join(", ")}.\n`

    if (alerts.length > 0) {
      contextData += `- PERINGATAN DINI (EWS) AKTIF (${alerts.length} anomali):\n`
      alerts.forEach((a) => {
        contextData += `  * [${a.severity}] Cabang ${a.outlet?.name}: ${a.message}\n`
      })
    } else {
      contextData += `- EWS: Semua operasional berjalan normal, tidak ada peringatan kritis aktif.\n`
    }

    const highFoodCostProducts = products.filter(
      (p) => p.sellingPrice && p.sellingPrice > 0 && p.standardCost / p.sellingPrice > 0.35
    )
    if (highFoodCostProducts.length > 0) {
      contextData += `- MENU DENGAN FOOD COST TINGGI (>35%):\n`
      highFoodCostProducts.slice(0, 4).forEach((p) => {
        const fcPct = (((p.standardCost || 0) / (p.sellingPrice || 1)) * 100).toFixed(1)
        contextData += `  * ${p.name}: FC ${fcPct}% (HPP: Rp ${p.standardCost?.toLocaleString("id-ID")}, Jual: Rp ${p.sellingPrice?.toLocaleString("id-ID")})\n`
      })
    }

    if (reconciliations.length > 0) {
      contextData += `- REKONSILIASI KAS BERMASALAH:\n`
      reconciliations.forEach((r) => {
        contextData += `  * Cabang ${r.outlet?.name}: Selisih Rp ${r.discrepancyAmount.toLocaleString("id-ID")} (${r.discrepancyNotes || "Belum ada catatan"})\n`
      })
    }

    if (recentComplaints.length > 0) {
      contextData += `- KOMPLAIN TAMU BELUM RESOLVED (${recentComplaints.length}):\n`
      recentComplaints.forEach((c) => {
        contextData += `  * [${c.complaintCategory}] ${c.customerName}: "${c.description}"\n`
      })
    }

    if (openKaizens.length > 0) {
      contextData += `- KENDALA HARIAN & USULAN KAIZEN TERBUKA:\n`
      openKaizens.forEach((k) => {
        const prob = k.dailyItem?.problemDesc || "Masalah operasional harian"
        contextData += `  * Masalah: ${prob} -> Solusi Usulan: ${k.proposedSolution}\n`
      })
    }

    // 2. SUSUN PROMPT UNTUK GEMINI
    const systemPrompt = `Anda adalah "IBMS AI", Konsultan Bisnis F&B Senior untuk jaringan restoran Bambooberry Ciwidey.
Tugas Anda: Memberikan insight bisnis, analisis akar masalah (Root Cause), evaluasi food cost, dan arahan taktis kepada Owner/Manajer berdasarkan DATA BISNIS SAAT INI yang diberikan di bawah.

Aturan ketat:
1. Gunakan bahasa Indonesia bisnis yang profesional, solutif, ringkas, dan to the point.
2. Selalu tautkan analisis Anda dengan angka atau anomali konkret dari konteks (Food Cost, EWS, Rekonsiliasi Kas, Komplain Tamu).
3. Berikan rekomendasi yang actionable (langkah taktis nomor 1, 2, 3 yang bisa langsung dieksekusi tim di lapangan).
4. JANGAN mengarang data finansial atau angka yang tidak ada di konteks. Jika data spesifik tidak tersedia, sampaikan secara objektif.
5. Format jawaban dalam Markdown yang rapi dengan heading, bullet points, dan penekanan tebal (bold).

${contextData}`

    const finalPrompt = `${systemPrompt}\n\nPERTANYAAN EKSEKUTIF:\n${query}`

    let responseText = ""
    let isFallbackMode = false

    // 3. PANGGIL GEMINI API ATAU JALANKAN HEURISTIC FALLBACK CERDAS
    if (apiKey && apiKey !== "DUMMY_KEY_FOR_BUILD" && apiKey.length > 10) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(finalPrompt)
        responseText = result.response.text()
      } catch (geminiError: unknown) {
        const errMsg = geminiError instanceof Error ? geminiError.message : String(geminiError)
        console.warn("[Gemini API Error, switching to intelligent heuristic]:", errMsg)
        isFallbackMode = true
        responseText = generateHeuristicResponse(query, contextData, alerts, highFoodCostProducts)
      }
    } else {
      isFallbackMode = true
      responseText = generateHeuristicResponse(query, contextData, alerts, highFoodCostProducts)
    }

    // 4. CATAT LOG DI TABEL AI QUERY HISTORY DAN AUDIT LOG
    try {
      await prisma.aiQueryHistory.create({
        data: {
          userId: user.id,
          naturalLanguageQuery: query,
          resolvedFilter: accessFilter || {},
          responseSummary: responseText.slice(0, 300) + "...",
        },
      })

      await auditLog(
        "CREATE",
        "AiQueryHistory",
        user.id,
        { query: query.substring(0, 100), isFallback: isFallbackMode },
        user.id
      )
    } catch (logErr) {
      console.warn("Audit logging for AI skipped:", logErr)
    }

    revalidatePath("/ai")

    return {
      answer: responseText,
      isFallback: isFallbackMode,
      sources: [
        "Early Warning System (EWS)",
        "Master Produk & HPP BOM",
        "Rekonsiliasi Kasir & POS",
        "Komplain & Service Recovery",
      ],
    }
  } catch (error: unknown) {
    console.error("AI Generation Error:", error)
    const errText = error instanceof Error ? error.message : "Kesalahan internal"
    throw new Error("Gagal memproses analisis AI: " + errText)
  }
}

interface HeuristicAlert {
  alertType?: string
  severity: string
  message: string
  outlet?: { name: string } | null
}

/**
 * Heuristic response generator ketika GEMINI_API_KEY tidak dikonfigurasi
 */
function generateHeuristicResponse(
  query: string,
  contextData: string,
  alerts: HeuristicAlert[],
  highFoodCostProducts: Array<{ name: string; standardCost: number; sellingPrice: number | null }>
): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes("food cost") || lowerQuery.includes("resep") || lowerQuery.includes("hpp")) {
    const listProducts = highFoodCostProducts.length > 0
      ? highFoodCostProducts.map(p => `* **${p.name}**: Food Cost ${(((p.standardCost || 0) / (p.sellingPrice || 1)) * 100).toFixed(1)}% (Ambang aman F&B: 30-35%)`).join("\n")
      : "* Seluruh produk menu saat ini berada dalam rentang food cost aman (<35%)."

    return `### Analisis Food Cost & Profitabilitas Menu (IBMS AI)

Berdasarkan tinjauan BOM Resep dan laporan operasional:

1. **Temuan Menu Melebihi Batas Ideal (>35%)**:
${listProducts}

2. **Akar Masalah (Root Cause)**:
* Potensi kenaikan harga bahan baku musiman (misal: strawberry segar dan dairy lokal Ciwidey) yang belum disesuaikan pada porsi standar.
* Fluktuasi porsi bahan (*portion control*) di kitchen stasiun utama saat jam ramai *weekend*.

3. **Rekomendasi Taktis Manajemen**:
* **Audit Gramatur (BOM Review)**: Wajibkan head chef melakukan penimbangan acak (*portion scale check*) pada shift pagi.
* **Menu Engineering**: Dorong promosi menu paket kombo dengan item margin tinggi (minuman signature/kopi) untuk menekan agregat food cost di bawah 32%.
* **Re-evaluasi Vendor**: Negosiasikan kontrak harga tetap untuk komoditas utama minimal 30 hari ke depan.`
  }

  if (lowerQuery.includes("akar masalah") || lowerQuery.includes("masalah") || lowerQuery.includes("kritis") || lowerQuery.includes("anomali")) {
    const alertList = alerts.length > 0
      ? alerts.map(a => `* **[${a.severity}] Cabang ${a.outlet?.name}**: ${a.message}`).join("\n")
      : "* Tidak ada anomali atau komplain kritis yang belum ditangani saat ini."

    return `### Analisis Akar Masalah (Root Cause Analysis - EWS)

Berdasarkan deteksi anomali operasional terkini:

1. **Peringatan Dini Kritis yang Membutuhkan Intervensi Segera**:
${alertList}

2. **Korelasi Antar Modul**:
* Selisih kas pada rekonsiliasi kasir sering kali berkolerasi dengan pergantian shift terburu-buru tanpa serah terima fisik drawer kasir.
* Penumpukan komplain pelayanan erat kaitannya dengan waktu tunggu kitchen pada lonjakan kunjungan rombongan wisata Ciwidey.

3. **Langkah Penanggulangan Cepat (Service Recovery)**:
* **Tindak Lanjut Kasir**: Terapkan SOP blind-drop cash register sebelum kasir meninggalkan stasiun.
* **Service Recovery Tamu**: Hubungi pelanggan terkait komplain dalam SLA < 24 jam dengan menawarkan voucher apresiasi kunjungan ulang.`
  }

  return `### Laporan Ringkasan Eksekutif (IBMS AI Consultant)

Halo Manajemen Bambooberry. Berikut adalah ringkasan analitik terkini berdasarkan konsolidasi data multi-cabang:

1. **Kondisi Operasional & Finansial**:
* Status performa cabang secara umum stabil dengan pengawasan intensif pada stasiun kasir dan rasio food cost.
* Sistem mencatat ada ${alerts.length} anomali aktif pada Early Warning System yang memerlukan atensi manajer outlet.

2. **Prioritas Tindakan Hari Ini**:
* **Finance**: Pastikan rekonsiliasi kasir harian ditutup tanpa selisih minus dan verifikasi setoran bank EDC/QRIS.
* **Operasional Kitchen**: Jaga disiplin checklist closing dan logging sisa bahan baku (*waste log*).
* **Marketing**: Pantau ulasan Google Maps dan selesaikan tindak lanjut komplain pelanggan di bawah batas SLA.

*(Catatan: Mode AI terhubung dengan data IBMS real-time. Untuk kecerdasan generatif kustom lanjutan, lengkapi \`GEMINI_API_KEY\` pada file .env).*`
}

/**
 * Menghasilkan Analisis Akar Masalah Otomatis (Root Cause) dan menyimpannya di DB
 */
export async function generateRootCauseAnalysis(
  issueTopic: string,
  outletId?: string
) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Unauthorized")

  const prompt = `Lakukan Root Cause Analysis (Metode 5-Whys) mendalam mengenai masalah berikut: "${issueTopic}". Berikan akar masalah teknis, evaluasi kaizen, dan tindakan pencegahan.`
  const aiResult = await askExecutiveAI(prompt, outletId)

  const savedRCA = await prisma.aiRootCauseAnalysis.create({
    data: {
      issueTopic,
      sourceProblems: { topic: issueTopic, requestedBy: user.name },
      rootCauseSummary: aiResult.answer.slice(0, 300),
      kaizenAssessment: "Dianalisis menggunakan Gemini GenAI engine IBMS",
      suggestedAction: "Terapkan rekomendasi taktis terlampir",
    },
  })

  revalidatePath("/ai")
  return { id: savedRCA.id, result: aiResult.answer }
}

/**
 * Mengambil Riwayat Query AI Eksekutif
 */
export async function getAiQueryHistory() {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Unauthorized")

  return await prisma.aiQueryHistory.findMany({
    orderBy: { timestamp: "desc" },
    take: 15,
    include: {
      user: {
        select: { name: true, role: true },
      },
    },
  })
}

/**
 * Mengambil Daftar Deteksi Anomali AI
 */
export async function getAiAnomalies(outletId?: string) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Unauthorized")

  return await prisma.aiAnomalyDetection.findMany({
    where: outletId ? { outletId } : undefined,
    orderBy: { detectedAt: "desc" },
    take: 10,
    include: {
      outlet: { select: { name: true } },
    },
  })
}
