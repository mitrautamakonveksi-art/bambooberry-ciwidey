import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getChecklistTemplates } from "@/modules/operations/actions/inventory-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckSquare } from "lucide-react"
import Link from "next/link"
import ChecklistSubmitCard from "@/components/operations/ChecklistSubmitCard"

export const metadata = {
  title: "SOP Checklists Operasional | IBMS",
}

export default async function ChecklistsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const defaultOutlet = await prisma.outlet.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  const outletId = effectiveOutlet.outletId || defaultOutlet?.id

  if (!outletId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Belum ada outlet aktif.</h2>
      </div>
    )
  }

  const [templates, allSubmissions] = await Promise.all([
    getChecklistTemplates(),
    prisma.dailyChecklistSubmission.findMany({
      include: {
        outlet: true,
        template: true,
        submittedBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/operations">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Standar Operasional Prosedur (SOP Checklist)</h1>
            <p className="text-muted-foreground text-sm">
              Verifikasi kepatuhan opening, closing, kebersihan, dan keselamatan kerja harian.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChecklistSubmitCard outletId={outletId} templates={templates} />

        {/* Daftar Template Aktif */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="text-[#2A7C13]" size={18} /> Modul SOP Checklist Aktif
            </CardTitle>
            <CardDescription className="text-xs">
              Standar prosedur yang wajib dijalankan oleh staf di setiap shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((tpl) => {
              const items = (tpl.items as Array<{ id: string; text: string }>) || []
              return (
                <div key={tpl.id} className="p-3 rounded-lg border bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">{tpl.title}</span>
                    <Badge variant="outline">{items.length} Poin Verifikasi</Badge>
                  </div>
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                    {items.slice(0, 3).map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item.text}
                      </li>
                    ))}
                    {items.length > 3 && (
                      <li className="text-slate-400 italic">+{items.length - 3} butir SOP lainnya</li>
                    )}
                  </ul>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Penyerahan Checklist Seluruh Cabang */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Log Audit SOP Checklist</CardTitle>
          <CardDescription>
            Rekam jejak kepatuhan operasional yang telah diserahkan dan diaudit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu Pengerjaan</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jenis SOP Checklist</TableHead>
                  <TableHead>Staf Pelaksana</TableHead>
                  <TableHead className="text-center">Skor Kepatuhan</TableHead>
                  <TableHead>Catatan Shift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada log submission SOP checklist.
                    </TableCell>
                  </TableRow>
                ) : (
                  allSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="text-xs">
                        {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(sub.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-xs">{sub.outlet.name}</TableCell>
                      <TableCell className="text-xs">{sub.template.title}</TableCell>
                      <TableCell className="text-xs">{sub.submittedBy.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            sub.scorePct === 100
                              ? "bg-[#2A7C13] text-white"
                              : sub.scorePct >= 70
                              ? "bg-amber-500 text-white"
                              : "bg-red-500 text-white"
                          }
                        >
                          {sub.scorePct.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-slate-500">
                        {sub.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
