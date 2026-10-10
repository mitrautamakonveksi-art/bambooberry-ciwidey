import { prisma } from "@/shared/lib/prisma"
import { createOutlet } from "@/modules/admin/actions/outlet-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Store, Plus, MapPin, Phone } from "lucide-react"

export default async function AdminOutletsPage() {
  const [outlets, divisions] = await Promise.all([
    prisma.outlet.findMany({
      include: {
        _count: {
          select: { users: true, dailyReports: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.division.findMany({
      include: {
        _count: {
          select: { users: true, kpis: true },
        },
      },
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Manajemen Outlet & Divisi
        </h2>
        <p className="text-slate-500">
          Kelola master data cabang BAMBOOBERRY dan departemen organisasi.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Tambah Outlet Baru */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2A7C13]">
              <Plus size={20} /> Tambah Outlet Baru
            </CardTitle>
            <CardDescription>
              Daftarkan cabang fisik restoran baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOutlet} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Outlet</Label>
                <Input name="name" placeholder="mis. Outlet Ciwidey Pusat" required />
              </div>
              <div className="space-y-2">
                <Label>Kota / Lokasi Wilayah</Label>
                <Input name="location" placeholder="mis. Ciwidey, Bandung" />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon Outlet</Label>
                <Input name="phone" placeholder="081234567890" />
              </div>
              <div className="space-y-2">
                <Label>Alamat Lengkap</Label>
                <Input name="address" placeholder="Jl. Raya Ciwidey No. 12" />
              </div>
              <Button type="submit" className="w-full bg-[#2A7C13] hover:bg-[#2A7C13]/90">
                Simpan Outlet
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Daftar Outlet Aktif */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store size={20} /> Daftar Cabang Outlet ({outlets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {outlets.map((outlet) => (
                  <div
                    key={outlet.id}
                    className="p-4 rounded-lg border bg-card hover:border-[#2A7C13]/50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{outlet.name}</h4>
                      <Badge variant={outlet.isActive ? "default" : "secondary"}>
                        {outlet.isActive ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </div>
                    {outlet.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={14} /> {outlet.location}
                      </p>
                    )}
                    {outlet.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={14} /> {outlet.phone}
                      </p>
                    )}
                    <div className="pt-2 border-t flex justify-between text-xs text-slate-500">
                      <span>{outlet._count.users} Staf Terafiliasi</span>
                      <span>{outlet._count.dailyReports} Total Laporan</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Master Divisi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Divisi Organisasi</CardTitle>
              <CardDescription>
                Struktur divisi terintegrasi lintas seluruh modul operasional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {divisions.map((d) => (
                  <div
                    key={d.id}
                    className="px-3 py-2 rounded-lg border bg-slate-50 flex items-center gap-3"
                  >
                    <span className="font-semibold text-sm text-slate-900">{d.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white border text-slate-600">
                      {d._count.kpis} KPI
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
