"use client"

import { useState } from "react"
import { Store } from "lucide-react"
import { OutletOption } from "@/shared/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OutletSwitcher({
  outlets,
  currentOutletId,
}: {
  outlets: OutletOption[]
  currentOutletId?: string | null
}) {
  const [selected, setSelected] = useState<string>(
    currentOutletId || outlets[0]?.id || "ALL"
  )

  const handleSelect = (val: string) => {
    setSelected(val)
    // Simpan pilihan ke cookie atau URL param jika diperlukan
    document.cookie = `ibms_outlet=${val}; path=/; max-age=2592000` // 30 hari
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-[#2A7C13]" />
      <Select value={selected} onValueChange={handleSelect}>
        <SelectTrigger className="w-[180px] sm:w-[220px] h-9 text-xs sm:text-sm font-semibold border-slate-200 bg-slate-50/50">
          <SelectValue placeholder="Pilih Cabang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="font-semibold text-[#2A7C13]">
            Semua Cabang (Konsolidasi)
          </SelectItem>
          {outlets.map((outlet) => (
            <SelectItem key={outlet.id} value={outlet.id}>
              {outlet.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
