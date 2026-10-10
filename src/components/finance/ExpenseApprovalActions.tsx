"use client"

import { useState } from "react"
import { processExpenseApproval } from "@/modules/finance/actions/expense-actions"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

export default function ExpenseApprovalActions({
  expenseId,
  amount,
  isOwner,
}: {
  expenseId: string
  amount: number
  isOwner: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    if (amount > 1000000 && !isOwner) {
      alert("Pengeluaran di atas Rp 1.000.000 hanya dapat disetujui oleh Owner / Super Admin.")
      return
    }

    if (!confirm("Konfirmasi setujui pengeluaran ini dan catat ke buku besar?")) return

    setIsLoading(true)
    try {
      await processExpenseApproval(expenseId, "APPROVE")
      alert("Pengeluaran berhasil disetujui dan dicatat ke buku besar.")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui pengeluaran")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    const reason = prompt("Masukkan alasan penolakan:")
    if (reason === null) return

    setIsLoading(true)
    try {
      await processExpenseApproval(expenseId, "REJECT", reason)
      alert("Pengeluaran telah ditolak.")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menolak pengeluaran")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={isLoading}
        className="h-8 bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white text-xs px-2.5"
      >
        <Check size={14} className="mr-1" /> Setujui
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={isLoading}
        className="h-8 text-xs px-2.5"
      >
        <X size={14} className="mr-1" /> Tolak
      </Button>
    </div>
  )
}
