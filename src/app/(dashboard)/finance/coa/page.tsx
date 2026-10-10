import { getCurrentUser } from "@/shared/lib/auth"
import { redirect } from "next/navigation"
import { getChartOfAccounts } from "@/modules/finance/actions/finance-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Bagan Akun (Chart of Accounts) | Finance | IBMS",
}

export default async function ChartOfAccountsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const accounts = await getChartOfAccounts()

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "ASSET":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "LIABILITY":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "EQUITY":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "REVENUE":
        return "bg-green-100 text-green-800 border-green-200"
      case "EXPENSE":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Bagan Akun Standar F&B (Chart of Accounts)</h1>
            <p className="text-muted-foreground text-sm">
              Struktur klasifikasi buku besar akuntansi: Aset, Kewajiban, Ekuitas, Pendapatan, dan Beban.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen size={18} className="text-[#2A7C13]" /> Daftar Akun Buku Besar ({accounts.length} Akun)
          </CardTitle>
          <CardDescription className="text-xs">
            Standar kode rekening yang digunakan untuk integrasi transaksi otomatis dari modul F&B.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun Rekening</TableHead>
                <TableHead>Kategori Akun</TableHead>
                <TableHead>Klasifikasi Tipe</TableHead>
                <TableHead>Deskripsi Fungsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id} className="text-xs">
                  <TableCell className="font-mono font-bold text-slate-900">{acc.code}</TableCell>
                  <TableCell className="font-semibold">{acc.name}</TableCell>
                  <TableCell className="text-slate-600">{acc.category.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeBadgeColor(acc.category.type)}>
                      {acc.category.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {acc.description || `Akun standar pencatatan ${acc.name}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
