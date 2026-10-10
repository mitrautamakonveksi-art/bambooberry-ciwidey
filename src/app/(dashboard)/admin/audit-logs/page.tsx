import { getAuditLogs } from "@/modules/admin/actions/audit-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Clock, User } from "lucide-react"
import { AuditAction } from "@prisma/client"

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs(100)

  const actionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800"
      case "UPDATE":
        return "bg-blue-100 text-blue-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      case "APPROVE":
        return "bg-emerald-100 text-emerald-800"
      case "REJECT":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Audit Trail & Log Aktivitas Sistem
        </h2>
        <p className="text-slate-500">
          Rekam jejak seluruh mutasi data penting, approval transaksi, dan aksi pengguna IBMS.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#2A7C13]" /> Riwayat Mutasi Terkini ({logs.length})
          </CardTitle>
          <CardDescription>
            Menampilkan 100 aktivitas terbaru dengan identitas pengguna dan detail entitas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-500">Waktu</th>
                  <th className="p-3 text-left font-medium text-slate-500">Pengguna</th>
                  <th className="p-3 text-center font-medium text-slate-500">Aksi</th>
                  <th className="p-3 text-left font-medium text-slate-500">Entitas Terkait</th>
                  <th className="p-3 text-left font-medium text-slate-500">Ringkasan Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString("id-ID")}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {log.user?.name || "Sistem / Otomatis"}
                      </div>
                      {log.user?.email && (
                        <div className="text-[11px] text-slate-500">{log.user.email}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={actionBadgeColor(log.action)} variant="outline">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-900 font-mono text-xs">
                      <span className="font-semibold">{log.entityName}</span>
                      <span className="text-slate-400 block text-[10px]">{log.entityId}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-600 max-w-xs truncate">
                      {log.newData
                        ? JSON.stringify(log.newData)
                        : log.oldData
                        ? `Old: ${JSON.stringify(log.oldData)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Belum ada catatan log aktivitas yang terekam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
