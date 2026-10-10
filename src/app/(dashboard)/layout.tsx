import Link from "next/link"
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Target,
  Sparkles,
  Settings,
  Bell,
  UserCircle,
  Users,
  Wallet,
  Megaphone,
  ChefHat,
  UtensilsCrossed,
  ShieldCheck,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/shared/lib/prisma"
import { getCurrentUser } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import OutletSwitcher from "@/components/OutletSwitcher"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [outlets, currentUser, unacknowledgedAlerts] = await Promise.all([
    prisma.outlet.findMany({
      where: { isActive: true },
      select: { id: true, name: true, location: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    getCurrentUser(),
    prisma.earlyWarningAlert.count({ where: { isAcknowledged: false } }),
  ])

  const effectiveOutlet = await getEffectiveOutlet(currentUser)

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#2A7C13]">
            <div className="h-7 w-7 rounded-md bg-[#2A7C13] flex items-center justify-center text-white text-xs font-black shadow-sm">
              BB
            </div>
            <div>
              <span className="block leading-none">BAMBOOBERRY</span>
              <span className="text-[10px] font-normal text-slate-400 tracking-wider">
                ENTERPRISE IBMS
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Kelompok: Executive & Analytics */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Eksekutif & Analitik
            </div>
            <div className="space-y-0.5">
              <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard Eksekutif" />
              <NavItem href="/analytics" icon={<BarChart3 size={18} />} label="Executive Analytics" />
              <NavItem href="/kpi" icon={<Target size={18} />} label="Target & KPI" />
              <NavItem href="/reports/summary" icon={<ClipboardList size={18} />} label="Rekap & Analisis" />
            </div>
          </div>

          {/* Kelompok: Operasional & Staf */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pelaporan Shift
            </div>
            <div className="space-y-0.5">
              <NavItem href="/reports" icon={<ClipboardList size={18} />} label="Laporan Harian" />
              <NavItem href="/reports/daily/start" icon={<Building2 size={18} />} label="+ Mulai Shift Baru" />
            </div>
          </div>

          {/* Kelompok: Modul IBMS Enterprise */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Modul Bisnis IBMS
            </div>
            <div className="space-y-0.5">
              <NavItem href="/hr" icon={<Users size={18} />} label="Human Resources (HR)" />
              <NavItem href="/finance" icon={<Wallet size={18} />} label="Finance & Kasir" />
              <NavItem href="/marketing" icon={<Megaphone size={18} />} label="Marketing & Tamu" />
              <NavItem href="/operations" icon={<ChefHat size={18} />} label="Operasional & SOP" />
              <NavItem href="/products" icon={<UtensilsCrossed size={18} />} label="Produk & Resep" />
            </div>
          </div>

          {/* Kelompok: Intelijensi & Tata Kelola */}
          <div>
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              AI & Tata Kelola
            </div>
            <div className="space-y-0.5">
              <NavItem href="/ai" icon={<Sparkles size={18} className="text-amber-500" />} label="AI Intelligence" />
              <NavItem href="/admin" icon={<ShieldCheck size={18} />} label="Administrasi Sistem" />
            </div>
          </div>
        </div>

        <div className="border-t p-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-slate-200">
            <UserCircle size={28} className="text-slate-400 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {currentUser?.name || "Budi Santoso"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {currentUser?.role || "SUPER_ADMIN"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#2A7C13] flex items-center justify-center text-white text-[10px] font-black">
                BB
              </div>
              <span className="font-bold text-sm text-[#2A7C13]">IBMS</span>
            </div>

            {/* Outlet Context Switcher */}
            <div className="flex items-center gap-2">
              <OutletSwitcher outlets={outlets} currentOutletId={effectiveOutlet.rawCookieValue} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Early Warning Indicator */}
            <Link href="/analytics/early-warning">
              <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
                <Bell size={20} />
                {unacknowledgedAlerts > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unacknowledgedAlerts}
                  </span>
                )}
              </Button>
            </Link>

            <div className="hidden sm:flex items-center gap-2 border-l pl-3">
              <Badge variant="outline" className="text-xs font-medium text-slate-600 bg-slate-50">
                {currentUser?.role || "SUPER_ADMIN"}
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>

        {/* Bottom Navigation untuk Mobile Staff */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex justify-around items-center h-16 px-2 shadow-lg">
          <MobileNavItem href="/" icon={<LayoutDashboard size={20} />} label="Home" />
          <MobileNavItem href="/reports" icon={<ClipboardList size={20} />} label="Laporan" />
          <MobileNavItem href="/reports/daily/start" icon={<Building2 size={20} className="text-[#2A7C13]" />} label="Mulai" />
          <MobileNavItem href="/ai" icon={<Sparkles size={20} className="text-amber-500" />} label="AI" />
          <MobileNavItem href="/admin" icon={<Settings size={20} />} label="Admin" />
        </nav>
      </div>
    </div>
  )
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      <span className="text-slate-500">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-600 hover:text-[#2A7C13]"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
