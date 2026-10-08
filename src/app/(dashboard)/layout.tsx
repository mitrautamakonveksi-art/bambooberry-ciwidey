import Link from "next/link"
import { LayoutDashboard, ClipboardList, Target, Lightbulb, Settings, Bell, Menu, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-[#2A7C13]">
            <div className="h-6 w-6 rounded-sm bg-[#2A7C13]" />
            BAMBOOBERRY
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavItem href="/" icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <NavItem href="/reports" icon={<ClipboardList size={20}/>} label="Laporan Harian" />
          <NavItem href="/reports/summary" icon={<ClipboardList size={20}/>} label="Rekap & Analisis" />
          <NavItem href="/kpi" icon={<Target size={20}/>} label="Target & KPI" />
          <NavItem href="/kaizen" icon={<Lightbulb size={20}/>} label="Log Kaizen" />
        </nav>
        <div className="border-t p-4">
          <NavItem href="/settings" icon={<Settings size={20}/>} label="Pengaturan" />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={24} />
            </Button>
            <span className="font-bold text-[#2A7C13]">BAMBOOBERRY</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-800">Canggu Outlet</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <div className="flex items-center gap-2 border-l pl-4">
              <UserCircle size={28} className="text-slate-400" />
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-medium">Budi Santoso</span>
                <span className="text-xs text-slate-500">Supervisor</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-[#2A7C13]/10 text-[#2A7C13]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon} {label}
    </Link>
  )
}
