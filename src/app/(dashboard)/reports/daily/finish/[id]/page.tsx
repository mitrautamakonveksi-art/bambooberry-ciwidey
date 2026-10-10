import { prisma } from "@/shared/lib/prisma"
import { notFound } from "next/navigation"
import FinishWorkForm from "@/components/FinishWorkForm"

export default async function FinishWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      outlet: true,
      items: {
        include: { kpi: true },
      },
    },
  })

  if (!report) notFound()

  return (
    <div className="max-w-md mx-auto p-4">
      <FinishWorkForm report={report} />
    </div>
  )
}
