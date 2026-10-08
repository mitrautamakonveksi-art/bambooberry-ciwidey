"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export interface SummaryExportItem {
  kpiName: string
  value: string | number
  unit: string
  problems: string[]
}

export default function ExportCsvButton({ data, filename }: { data: SummaryExportItem[], filename: string }) {
  const handleExport = () => {
    if (data.length === 0) return
    
    // Header CSV
    const headers = ["Indikator KPI", "Nilai Agregasi", "Satuan", "Daftar Kendala (Log)"]
    const rows = data.map(row => [
      `"${row.kpiName}"`,
      row.value,
      `"${row.unit}"`,
      `"${row.problems.join(" | ")}"`
    ])
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
      <Download size={16} /> Ekspor CSV
    </Button>
  )
}
