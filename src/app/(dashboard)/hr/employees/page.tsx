import { getEmployees, getUsersWithoutEmployee } from "@/modules/hr/actions/employee-actions"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/shared/i18n/id"
import EmployeeFormDialog from "@/components/hr/EmployeeFormDialog"

export const metadata = {
  title: "Direktori Karyawan & Kontrak | HR | BAMBOOBERRY",
}

export default async function EmployeesPage() {
  const user = await getCurrentUser()
  const effectiveOutlet = await getEffectiveOutlet(user)

  const [employees, usersWithoutProfile] = await Promise.all([
    getEmployees(effectiveOutlet.outletId),
    getUsersWithoutEmployee(),
  ])

  const getContractColor = (contract: string) => {
    switch (contract) {
      case "PKWTT":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "PKWT":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "PROBATION":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Direktori Karyawan & Kontrak
          </h2>
          <p className="text-slate-500">
            Kelola data profil kepegawaian, jabatan, penempatan cabang, dan masa kontrak kerja.
          </p>
        </div>
        <EmployeeFormDialog usersWithoutProfile={usersWithoutProfile} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Karyawan Terdaftar ({employees.length})</CardTitle>
          <CardDescription>
            Menampilkan seluruh staf dan manajemen yang terhubung dengan akun sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIK / Nama</TableHead>
                  <TableHead>Jabatan & Divisi</TableHead>
                  <TableHead>Cabang Outlet</TableHead>
                  <TableHead className="text-center">Tipe Kontrak</TableHead>
                  <TableHead className="text-center">Tanggal Masuk</TableHead>
                  <TableHead className="text-right">Gaji Acuan</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{emp.user.name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {emp.nik || "NIK: Belum diisi"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{emp.positionTitle}</div>
                      <div className="text-xs text-slate-500">{emp.user.division?.name || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {emp.user.outlets.map((o) => (
                          <span
                            key={o.id}
                            className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium"
                          >
                            {o.name}
                          </span>
                        ))}
                        {emp.user.outlets.length === 0 && (
                          <span className="text-xs text-slate-400">Global</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={getContractColor(emp.contractType)}>
                        {emp.contractType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-slate-600">
                      {formatDate(emp.joinDate)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-800">
                      {emp.baseSalary ? formatCurrency(emp.baseSalary) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={emp.user.isActive ? "default" : "destructive"}>
                        {emp.user.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      Belum ada data profil karyawan. Klik tombol di atas untuk mendaftarkan profil.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
