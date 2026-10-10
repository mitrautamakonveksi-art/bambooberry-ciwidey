import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Sliders, ShieldCheck, ArrowRight } from "lucide-react"
import { prisma } from "@/shared/lib/prisma"

export default async function AdminHubPage() {
  const [userCount, outletCount, kpiCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.outlet.count(),
    prisma.kpiDefinition.count(),
    prisma.auditLog.count(),
  ])

  const adminSections = [
    {
      title: "Manajemen Pengguna & RBAC",
      desc: "Atur akun staf, manager, owner, role, dan penempatan cabang outlet.",
      icon: <Users className="h-6 w-6 text-[#2A7C13]" />,
      href: "/admin/users",
      stat: `${userCount} Pengguna Terdaftar`,
    },
    {
      title: "Manajemen Outlet & Divisi",
      desc: "Konfigurasi cabang operasional, alamat, status aktif, dan struktur divisi.",
      icon: <Store className="h-6 w-6 text-[#2A7C13]" />,
      href: "/admin/outlets",
      stat: `${outletCount} Cabang Aktif`,
    },
    {
      title: "Konfigurasi KPI & Bobot Skor",
      desc: "Tambah indikator KPI baru secara no-code dan atur bobot persentase skor.",
      icon: <Sliders className="h-6 w-6 text-[#2A7C13]" />,
      href: "/admin/kpi-config",
      stat: `${kpiCount} Indikator Terdefinisi`,
    },
    {
      title: "Audit Log & Jejak Aktivitas",
      desc: "Pantau seluruh rekam jejak mutasi data, approval, dan aktivitas pengguna.",
      icon: <ShieldCheck className="h-6 w-6 text-[#2A7C13]" />,
      href: "/admin/audit-logs",
      stat: `${auditCount} Riwayat Audit Terekam`,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Administrasi Sistem (System Admin)
        </h2>
        <p className="text-slate-500">
          Pusat kendali tata kelola platform, hak akses pengguna, konfigurasi outlet, dan audit sistem IBMS.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {adminSections.map((section, idx) => (
          <Link key={idx} href={section.href}>
            <Card className="hover:border-[#2A7C13]/60 transition-all hover:shadow-sm cursor-pointer h-full">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="p-2.5 rounded-lg bg-[#2A7C13]/10">
                  {section.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent className="space-y-2">
                <CardTitle className="text-lg text-slate-900">{section.title}</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {section.desc}
                </CardDescription>
                <div className="pt-2 text-xs font-semibold text-[#2A7C13]">
                  {section.stat}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
