# BAMBOOBERRY CIWIDEY - ENTERPRISE IBMS
> **Integrated Business Management System (IBMS)**  
> Platform Enterprise Resource Planning (ERP) Multi-Outlet F&B mencakup HR, Finance, Operations, Products, Marketing, Executive Analytics, System Admin, dan AI Intelligence.

---

## 🏗️ Arsitektur Sistem: Modular Monolith

Aplikasi dibangun menggunakan **Next.js 16 (App Router)** dengan pendekatan arsitektur **Modular Monolith**:
* Setiap domain bisnis memiliki folder terisolasi di `src/modules/<domain>/` yang berisi *Server Actions*, *Service Logic*, dan *Types*.
* *Shared Kernel* berada di `src/shared/` untuk library bersama (`prisma`, `auth`, `audit-logger`, `types`).
* UI Components modular di `src/components/<domain>/`.

```
src/
├── app/                      # Next.js App Router (34 Rute Produksi)
│   ├── (dashboard)/
│   │   ├── admin/            # Modul 1: System Admin & RBAC
│   │   ├── hr/               # Modul 2: Human Resources & Kehadiran
│   │   ├── operations/       # Modul 3: Operasional, Inventaris & SOP
│   │   ├── products/         # Modul 4: Produk, Resep & BOM Food Cost
│   │   ├── finance/          # Modul 5: Finance, Kasir & Rekonsiliasi POS
│   │   ├── marketing/        # Modul 6: Marketing, Ulasan & Atribusi
│   │   ├── analytics/        # Modul 7: Executive Analytics & EWS
│   │   └── ai/               # Modul 8: Gemini GenAI Intelligence
├── components/               # Komponen UI Interaktif per Domain
├── modules/                  # Business Logic, Data Access & Server Actions
└── shared/                   # Shared Kernel (Prisma Client, RBAC, Audit Trail)
```

---

## 🚀 Fitur Utama 8 Modul Bisnis

1. **System Admin (`/admin`)**: Manajemen outlet multi-cabang, konfigurasi bobot KPI tanpa koding, pengaturan peran pengguna (RBAC), dan audit log transaksi.
2. **Human Resources (`/hr`)**: Profil karyawan lengkap (NIK, kontrak PKWT/PKWTT), absensi GPS & foto, jadwal shift, perekrutan & interview scorecard, turnover tracking, serta evaluasi laporan kerja harian.
3. **Operations & SOP (`/operations`)**: Stok opname fisik, kontrol persediaan bahan baku & buffer stock, pencatatan log pemborosan bahan (waste log), dan checklist SOP shift harian.
4. **Products & BOM (`/products`)**: Master menu & bahan baku, formula resep (Bill of Materials), kalkulasi otomatis Food Cost % dengan indikator ambang batas aman (≤ 35%).
5. **Finance & Kasir (`/finance`)**: Chart of Accounts (COA) standar F&B, rekonsiliasi kasir harian (POS Settlement) dengan deteksi selisih uang drawer, pengajuan beban dengan persetujuan bertingkat (*Tiered Expense Approval*), dan ringkasan Laba Rugi (P&L).
6. **Marketing & Reputasi (`/marketing`)**: Atribusi channel kedatangan tamu (Google Maps, Instagram, TikTok, Tour Guide lokal) tanpa diskon perang harga, pemantauan ulasan bintang 1-5, dan SLA Service Recovery komplain tamu.
7. **Executive Analytics (`/analytics`)**: Konsolidasi metrik pendapatan & laba bersih multi-outlet, Central KPI Engine, Early Warning System (EWS) untuk mendeteksi anomali kritis, dan Papan Peringkat Cabang.
8. **AI Intelligence (`/ai`)**: Copilot eksekutif berbasis Google Gemini GenAI (`gemini-1.5-flash`), analisis akar masalah otomatis (5-Whys RCA), dan radar anomali bisnis.

---

## 🛠️ Memulai Pengembangan Lokal

### Prasyarat
* Node.js v20+ atau v22+
* Database PostgreSQL (Lokal atau Neon / Supabase)

### Instalasi & Menjalankan

1. Kloning repositori dan instal dependensi:
   ```bash
   npm install
   ```

2. Konfigurasikan file `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   AUTH_SECRET="your-random-secret"
   GEMINI_API_KEY="your-gemini-api-key" # Opsional (Tersedia mode fallback cerdas jika kosong)
   ```

3. Sinkronkan skema database Prisma:
   ```bash
   npx prisma db push
   # atau npx prisma migrate dev
   ```

4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📦 Kompilasi Produksi (Production Build)

Pastikan seluruh kode aman dari error tipe dan linting:

```bash
# Validasi tipe TypeScript
npx tsc --noEmit

# Kompilasi bundel produksi Next.js (34 rute terverifikasi)
npm run build
```

---

## 📖 Panduan Deployment & Handover

Untuk petunjuk deployment lengkap di platform Vercel, Railway, atau VPS serta strategi pemeliharaan jangka panjang, silakan baca [HANDOVER_AND_DEPLOYMENT_GUIDE.md](file:///c:/Project/bambooberry-ciwidey/HANDOVER_AND_DEPLOYMENT_GUIDE.md).
