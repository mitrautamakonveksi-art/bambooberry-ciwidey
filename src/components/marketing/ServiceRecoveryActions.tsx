"use client"

import { useState } from "react"
import { resolveReviewFeedback } from "@/modules/marketing/actions/marketing-actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export default function ServiceRecoveryActions({
  reviewId,
  isResolved,
}: {
  reviewId: string
  isResolved: boolean
}) {
  const [resolved, setResolved] = useState(isResolved)
  const [isLoading, setIsLoading] = useState(false)

  const handleResolve = async () => {
    setIsLoading(true)
    try {
      await resolveReviewFeedback(reviewId, "Selesai ditangani oleh tim operasional / follow up tamu.")
      setResolved(true)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui status komplain")
    } finally {
      setIsLoading(false)
    }
  }

  if (resolved) {
    return (
      <div className="flex items-center justify-end text-green-600 font-medium text-xs">
        <CheckCircle2 className="h-4 w-4 mr-1" />
        <span>Resolved</span>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleResolve}
      disabled={isLoading}
      className="h-7 text-xs px-2.5"
    >
      {isLoading ? "Memproses..." : "Follow Up"}
    </Button>
  )
}
