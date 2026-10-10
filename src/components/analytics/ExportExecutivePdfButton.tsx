"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ExportExecutivePdfButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-1.5 text-xs border-slate-300"
    >
      <Download className="h-3.5 w-3.5" />
      Unduh Laporan PDF
    </Button>
  )
}
