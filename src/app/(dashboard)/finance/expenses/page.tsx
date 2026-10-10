import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { getPendingExpenses, getAllExpenses } from "@/modules/finance/actions/expense-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, CheckCircle2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import ExpenseRequestModal from "@/components/finance/ExpenseRequestModal"
import ExpenseApprovalActions from "@/components/finance/ExpenseApprovalActions"

export const metadata = {
  title: "Persetujuan Pengeluaran & Biaya | Finance | IBMS",
}

export default async function ExpensesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const isOwner = user.role === "OWNER" || user.role === "SUPER_ADMIN"
  const isManager = user.role === "MANAGER" || isOwner

  const [pendingExpenses, allExpenses, outlets] = await Promise.all([
    getPendingExpenses(effectiveOutlet.outletId),
    getAllExpenses(effectiveOutlet.outletId),
    prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengajuan & Persetujuan Biaya (Expense Approval)</h1>
            <p className="text-muted-foreground text-sm">
              Alur persetujuan bertingkat (Tier 1 Manager hingga Rp 1 Juta, Tier 2 Owner di atas Rp 1 Juta) &amp; pencatatan buku besar.
            </p>
          </div>
        </div>
        <ExpenseRequestModal outlets={outlets} defaultOutletId={effectiveOutlet.outletId || user.activeOutletId || undefined} />
      </div>

      {/* Tabel Pengajuan Menunggu Persetujuan (PENDING) */}
      <Card className="border-amber-200">
        <CardHeader className="bg-amber-50/40 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <Clock size={18} /> Menunggu Persetujuan ({pendingExpenses.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Pengeluaran kasbon / operasional yang diajukan staf cabang dan butuh otorisasi.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Tingkat Otorisasi</TableHead>
                {isManager && <TableHead className="text-right">Aksi Approval</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isManager ? 8 : 7}
                    className="text-center py-8 text-xs text-muted-foreground"
                  >
                    Tidak ada pengajuan pengeluaran yang sedang menunggu persetujuan.
                  </TableCell>
                </TableRow>
              ) : (
                pendingExpenses.map((exp) => {
                  const isHighTier = exp.amount > 1000000
                  return (
                    <TableRow key={exp.id} className="text-xs">
                      <TableCell className="font-medium">
                        {new Date(exp.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">{exp.outlet.name}</TableCell>
                      <TableCell>{exp.requester.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exp.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isHighTier ? "destructive" : "secondary"}
                          className={`text-[10px] ${
                            isHighTier
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {isHighTier ? (
                            <span className="flex items-center gap-1">
                              <ShieldAlert size={10} /> Tier 2 (Owner)
                            </span>
                          ) : (
                            "Tier 1 (Manager)"
                          )}
                        </Badge>
                      </TableCell>
                      {isManager && (
                        <TableCell className="text-right">
                          <ExpenseApprovalActions
                            expenseId={exp.id}
                            amount={exp.amount}
                            isOwner={isOwner}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabel Riwayat Pengeluaran yang Telah Diproses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#2A7C13]" /> Riwayat Pengajuan Biaya Terbaru
          </CardTitle>
          <CardDescription className="text-xs">
            Arsip seluruh pengeluaran yang telah disetujui atau ditolak.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Otorisasi Terakhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Belum ada riwayat pengajuan biaya.
                  </TableCell>
                </TableRow>
              ) : (
                allExpenses.map((exp) => {
                  const lastApproval = exp.approvals[0]
                  return (
                    <TableRow key={exp.id} className="text-xs">
                      <TableCell>
                        {new Date(exp.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{exp.outlet.name}</TableCell>
                      <TableCell>{exp.category}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-700">
                        {exp.description}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            exp.status === "APPROVED"
                              ? "bg-[#2A7C13] text-white"
                              : exp.status === "REJECTED"
                              ? "bg-red-600 text-white"
                              : "bg-amber-500 text-white"
                          }
                        >
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {lastApproval ? `${lastApproval.approver.name}` : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
