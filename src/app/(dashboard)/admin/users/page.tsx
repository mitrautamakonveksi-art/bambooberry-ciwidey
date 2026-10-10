import { prisma } from "@/shared/lib/prisma"
import { createUser } from "@/modules/admin/actions/user-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus } from "lucide-react"
import { RoleType } from "@prisma/client"

export default async function AdminUsersPage() {
  const [users, outlets, divisions] = await Promise.all([
    prisma.user.findMany({
      include: { outlets: true, division: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.outlet.findMany({ where: { isActive: true } }),
    prisma.division.findMany(),
  ])

  const roleBadgeColor = (role: RoleType) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "OWNER":
        return "bg-purple-100 text-purple-800"
      case "MANAGER":
        return "bg-blue-100 text-blue-800"
      case "SUPERVISOR":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna & Hak Akses (RBAC)
          </h2>
          <p className="text-slate-500">
            Kelola data staf dan kredensial login multi-outlet.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Tambah Pengguna Baru */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2A7C13]">
              <UserPlus size={20} /> Tambah Akun Baru
            </CardTitle>
            <CardDescription>
              Buat akun staf/manajemen baru dan tentukan penempatan outlet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input name="name" placeholder="mis. Siti Rahmawati" required />
              </div>

              <div className="space-y-2">
                <Label>Alamat Email</Label>
                <Input name="email" type="email" placeholder="nama@bambooberry.com" required />
              </div>

              <div className="space-y-2">
                <Label>Kata Sandi</Label>
                <Input name="password" type="password" placeholder="Minimal 8 karakter" required />
              </div>

              <div className="space-y-2">
                <Label>Peran (Role)</Label>
                <Select name="role" required defaultValue="STAFF">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner / Direksi</SelectItem>
                    <SelectItem value="MANAGER">Manager Outlet</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="STAFF">Staf Outlet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Divisi Utama</Label>
                <Select name="divisionId">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Penempatan Cabang (Outlet Utama)</Label>
                <Select name="outletIds" required defaultValue={outlets[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90 mt-2">
                Simpan & Daftarkan Pengguna
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabel Daftar Pengguna */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} /> Daftar Pengguna Terdaftar ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium text-slate-500">Nama & Email</th>
                    <th className="p-3 text-left font-medium text-slate-500">Peran (Role)</th>
                    <th className="p-3 text-left font-medium text-slate-500">Divisi</th>
                    <th className="p-3 text-left font-medium text-slate-500">Outlet Akses</th>
                    <th className="p-3 text-center font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge className={roleBadgeColor(u.role)} variant="outline">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-600">
                        {u.division?.name || "-"}
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          {u.outlets.map((o) => (
                            <span
                              key={o.id}
                              className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700"
                            >
                              {o.name}
                            </span>
                          ))}
                          {u.outlets.length === 0 && (
                            <span className="text-xs text-slate-400">Semua (Global)</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={u.isActive ? "default" : "destructive"}>
                          {u.isActive ? "Aktif" : "Non-aktif"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
