export const i18n = {
  appName: "BAMBOOBERRY IBMS",
  tagline: "Enterprise Integrated Business Management System",
  
  roles: {
    SUPER_ADMIN: "Super Administrator",
    OWNER: "Owner / Direksi",
    MANAGER: "General Manager / Outlet Manager",
    SUPERVISOR: "Supervisor Operasional",
    STAFF: "Staf Outlet",
  },

  modules: {
    dashboard: "Dashboard Eksekutif",
    hr: "Human Resources (SDM)",
    finance: "Keuangan & Kasir",
    marketing: "Pemasaran & Tamu",
    operations: "Operasional Outlet",
    products: "Produk & Rantai Pasok",
    analytics: "Analitik Eksekutif",
    admin: "Administrasi Sistem",
    ai: "Kecerdasan AI",
  },

  status: {
    green: "Optimal (Hijau)",
    yellow: "Waspada (Kuning)",
    red: "Kritis (Merah)",
    open: "Terbuka",
    inProgress: "Sedang Berjalan",
    completed: "Selesai",
    approved: "Disetujui",
    rejected: "Ditolak",
    pending: "Menunggu",
    draft: "Draf",
  },

  common: {
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    edit: "Ubah",
    add: "Tambah Baru",
    search: "Cari...",
    filter: "Saring",
    export: "Ekspor",
    allOutlets: "Semua Outlet",
    selectOutlet: "Pilih Outlet",
    loading: "Memuat data...",
    noData: "Belum ada data tersedia.",
  },

  formatCurrency: (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value)
  },

  formatNumber: (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: decimals,
    }).format(value)
  },

  formatDate: (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(d)
  },

  formatTime: (date: Date | string | null | undefined) => {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d)
  },
} as const

export const formatTime = i18n.formatTime
export const formatDate = i18n.formatDate
export const formatCurrency = i18n.formatCurrency
export const formatNumber = i18n.formatNumber

