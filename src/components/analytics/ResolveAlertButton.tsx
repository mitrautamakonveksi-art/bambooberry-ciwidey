"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { resolveAlert } from "@/modules/analytics/actions/analytics-actions"
import { CheckCircle2, Loader2 } from "lucide-react"

interface ResolveAlertButtonProps {
  alertId: string
}

export default function ResolveAlertButton({ alertId }: ResolveAlertButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("alertId", alertId)
      await resolveAlert(formData)
    } catch (err) {
      console.error(err)
      alert("Gagal menandai alert sebagai selesai.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleResolve}
      disabled={loading}
      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-semibold"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-blue-500" />
      )}
      Tandai Selesai
    </Button>
  )
}
