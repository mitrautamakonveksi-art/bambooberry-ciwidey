"use client"

import { useState } from "react"
import { upsertEmployee } from "@/modules/hr/actions/employee-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"

interface UserOption {
  id: string
  name: string
  email: string
  role: string
  division: { name: string } | null
}

export default function EmployeeFormDialog({
  usersWithoutProfile,
}: {
  usersWithoutProfile: UserOption[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await upsertEmployee({
        userId: formData.get("userId") as string,
        nik: formData.get("nik") as string,
        positionTitle: formData.get("positionTitle") as string,
        phone: (formData.get("phone") as string) || undefined,
        joinDate: formData.get("joinDate") as string,
        contractType: formData.get("contractType") as "PKWT" | "PKWTT" | "PROBATION" | "DAILY_WORKER",
        contractEndDate: (formData.get("contractEndDate") as string) || undefined,
        baseSalary: parseFloat(formData.get("baseSalary") as string) || 0,
        emergencyContact: (formData.get("emergencyContact") as string) || undefined,
      })

      setIsOpen(false)
      form.reset()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan data karyawan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-[#2A7C13] hover:bg-[#2A7C13]/90 text-xs sm:text-sm"
      >
        <Plus className="mr-1.5 h-4 w-4" /> Tambah Profil Karyawan
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg text-[#2A7C13]">
                  Tambah Data Profil Karyawan
                </CardTitle>
                <CardDescription>
                  Hubungkan akun pengguna dengan informasi kepegawaian & kontrak.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-500"
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Akun Pengguna Sistem</Label>
                  {usersWithoutProfile.length > 0 ? (
                    <Select name="userId" required defaultValue={usersWithoutProfile[0]?.id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Akun Pengguna" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersWithoutProfile.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.email} - {u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      Semua user aktif sudah memiliki profil. Silakan buat akun user baru terlebih dahulu di menu Admin.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nomor Induk Karyawan (NIK)</Label>
                    <Input name="nik" placeholder="mis. BB-2026-001" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jabatan / Posisi</Label>
                    <Input name="positionTitle" placeholder="mis. Kasir / Barista" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Jenis Kontrak</Label>
                    <Select name="contractType" required defaultValue="PKWT">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKWT">PKWT (Kontrak Tertentu)</SelectItem>
                        <SelectItem value="PKWTT">PKWTT (Karyawan Tetap)</SelectItem>
                        <SelectItem value="PROBATION">Probation (Percobaan)</SelectItem>
                        <SelectItem value="DAILY_WORKER">Harian Lepas (Part Time)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nomor WhatsApp</Label>
                    <Input name="phone" placeholder="081234567890" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tanggal Masuk</Label>
                    <Input name="joinDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Berakhir Kontrak (Opsional)</Label>
                    <Input name="contractEndDate" type="date" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Gaji Pokok Acuan (Rp)</Label>
                    <Input name="baseSalary" type="number" defaultValue="3500000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kontak Darurat</Label>
                    <Input name="emergencyContact" placeholder="Nama & No. HP Keluarga" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2A7C13] hover:bg-[#2A7C13]/90"
                    disabled={isLoading || usersWithoutProfile.length === 0}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Profil Karyawan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
