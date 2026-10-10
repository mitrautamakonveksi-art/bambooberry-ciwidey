import { getProfitAndLoss } from "@/modules/finance/actions/finance-actions"
import { getPendingExpenses } from "@/modules/finance/actions/expense-actions"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, Wallet, FileSpreadsheet, Receipt, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Dashboard Keuangan | Finance | IBMS",
}

export default async function FinanceDashboard() {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const outletId = effectiveOutlet.outletId

  const [pnl, pendingExpenses, recentSettlements] = await Promise.all([
    getProfitAndLoss(outletId),
    getPendingExpenses(outletId),
    prisma.posReconciliation.findMany({
      where: outletId ? { outletId } : undefined,
      include: { outlet: true },
      orderBy: { reconDate: "desc" },
      take: 5,
    }),
  ])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Keuangan (Finance)</h1>
          <p className="text-muted-foreground">
            Ringkasan Pemasukan, Pengeluaran, dan Laba Bersih Bulan {pnl.monthName}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/finance/sales">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Rekonsiliasi POS
            </Button>
          </Link>
          <Link href="/finance/expenses">
            <Button className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-white">
              <Receipt className="mr-2 h-4 w-4" /> Pengeluaran ({pendingExpenses.length})
            </Button>
          </Link>
          <Link href="/finance/coa">
            <Button variant="ghost">
              <BookOpen className="mr-2 h-4 w-4" /> Bagan Akun (COA)
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(pnl.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Dari Settlement Penjualan POS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(pnl.totalExpense)}</div>
            <p className="text-xs text-muted-foreground">Bahan baku & operasional</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba / Rugi Bersih</CardTitle>
            <DollarSign className="h-4 w-4 text-[#2A7C13]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnl.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(pnl.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Periode berjalan ({pnl.period})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Keuntungan</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pnl.margin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Net Profit Margin</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribusi Pengeluaran Berdasarkan Kategori */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Biaya Operasional (P&L Breakdown)</CardTitle>
            <CardDescription className="text-xs">
              Rincian alokasi biaya pengeluaran bulan {pnl.monthName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(pnl.expenseBreakdown).length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Belum ada pengeluaran operasional yang disetujui pada periode ini.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(pnl.expenseBreakdown).map(([cat, amount]) => {
                  const pct = pnl.totalExpense > 0 ? (amount / pnl.totalExpense) * 100 : 0
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat}</span>
                        <span className="text-slate-600 font-medium">
                          {formatCurrency(amount)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2A7C13] rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Riwayat Settlement Terkini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Rekonsiliasi POS Terakhir</CardTitle>
              <CardDescription className="text-xs">
                Penutupan kasir dan status selisih kas fisik.
              </CardDescription>
            </div>
            <Link href="/finance/sales">
              <Button variant="ghost" size="sm" className="text-xs">
                Lihat Semua <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSettlements.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Belum ada data rekonsiliasi POS yang diserahkan.
              </div>
            ) : (
              <div className="space-y-3">
                {recentSettlements.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {new Date(s.reconDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total POS: {formatCurrency(s.posNetSales)} • Tunai: {formatCurrency(s.cashCollected)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-900">
                        {formatCurrency(s.posNetSales)}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          s.discrepancyAmount === 0
                            ? "text-[#2A7C13]"
                            : s.discrepancyAmount < -50000
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {s.discrepancyAmount === 0
                          ? "Kas Cocok"
                          : `Selisih: ${s.discrepancyAmount > 0 ? "+" : ""}${formatCurrency(s.discrepancyAmount)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
