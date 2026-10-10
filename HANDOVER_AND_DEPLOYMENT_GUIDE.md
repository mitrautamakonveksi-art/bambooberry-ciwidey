# IBMS Bambooberry Ciwidey - Final Handover & Deployment Guide

**Versi:** 1.0.0 (Production Ready)  
**Tanggal Penyelesaian:** Sesuai dengan Fase 9  
**Arsitektur:** Next.js App Router Modular Monolith (8 Business Domains)  
**Database:** PostgreSQL (Neon Serverless / Supabase / AWS RDS) via Prisma ORM  

---

## 1. Ringkasan Penyelesaian Proyek (End-to-End Verification)

Sistem **Integrated Business Management System (IBMS)** telah berhasil ditingkatkan dari aplikasi pelaporan Kaizen harian menjadi platform **Enterprise Resource Planning (ERP)** modern yang mengelola operasional F&B multi-outlet Bambooberry secara menyeluruh.

Total **34 Rute App Router** telah terverifikasi dan berhasil melalui kompilasi build produksi tanpa error (`Exit Code: 0`), mencakup 8 Modul Utama:

1. **System Admin (`/admin`)**: Manajemen Outlet, Multi-Outlet Switcher, RBAC Granular (Super Admin, Owner, Manager, Supervisor, Staff), Config KPI No-Code per Divisi, dan Audit Logs terpusat.
2. **Human Resources (`/hr`)**: Master Direktori Karyawan, Presensi GPS & Clock In/Out dengan foto, Jadwal Shift, Rekrutmen & Interview Scorecard, Monitoring Turnover Staf, dan Evaluasi Laporan Harian Terintegrasi.
3. **Operations (`/operations`)**: Manajemen Inventaris Bahan Baku & Buffer Stock, Stock Opname Harian, Pencatatan Log Waste/Pemborosan Bahan, dan Checklist SOP Shift (Opening, Service, Closing).
4. **Products (`/products`)**: Master Menu & Kategori, Manajemen Bahan Baku, Resep BOM (*Bill of Materials*), Kalkulasi Otomatis Food Cost % per Item Menu dengan Indikator Margin Sehat (Ideal ≤ 35%).
5. **Finance (`/finance`)**: Bagan Akun Standar F&B (*Chart of Accounts* - COA), Rekonsiliasi Kasir POS Harian (*End of Day Settlement*) dengan Deteksi Selisih Kas Drawer, Sistem Otorisasi Beban Bertingkat (*Tiered Expense Approval*), dan Ringkasan Laba Rugi (*P&L Summary*).
6. **Marketing & Reputasi (`/marketing`)**: Atribusi Kedatangan Tamu Organik (Google Maps, Instagram, TikTok, Tour Guide Lokal Ciwidey, Walk-in) tanpa promosi banting harga, Log Ulasan Tamu (Google Maps / In-Store), Penanganan Komplain Cepat (*Service Recovery SLA*), dan Kalender Konten Media Sosial.
7. **Executive Analytics (`/analytics`)**: Central KPI Engine, Dasbor Finansial Konsolidasi Multi-Outlet, Sistem Deteksi Anomali Dini (*Early Warning System* - EWS), dan Papan Peringkat Cabang (*Outlet Leaderboard*).
8. **AI Intelligence (`/ai`)**: Executive Copilot berbasis Google Gemini GenAI (`gemini-1.5-flash`), Investigasi Akar Masalah Otomatis (*5-Whys Root Cause Analysis*), Radar Deteksi Anomali, dan Jejak Audit Kueri Eksekutif.

---

## 2. Verifikasi Preservasi Data Eksisting (Legacy Data)

Sesuai dengan mandat utama sejak Fase 0, **tidak ada data historis yang hilang**:

* **Strategi Migrasi:** Skema `prisma/schema.prisma` diperbarui dengan menyisipkan relasi `outletId` secara opsional pada awalnya, kemudian seluruh data pengguna dan laporan lama di-assign ke "Bambooberry Ciwidey" sebagai Outlet Utama (Default Outlet).
* **Keberlanjutan Fitur:** Fitur *Daily Report*, *Report Result*, *Problem*, dan *Kaizen* milik aplikasi terdahulu tidak dihapus, melainkan direlokasi secara terstruktur ke dalam Modul HR (Performance) di rute `/hr/daily-reports` dan rute pelaporan `/reports`.
* **Koeksistensi Tabel:** Seluruh tabel legacy (`DailyReport`, `DailyItem`, `Kaizen`, `KpiTarget`, `Outlet`, `User`, `Approval`) berjalan beriringan dengan tabel baru (`Attendance`, `PosReconciliation`, `Account`, `ProductItem`, `RecipeItem`, `EarlyWarningAlert`, dll) di dalam satu payung PostgreSQL.

---

## 3. Panduan Hardening & Keamanan (Security Audit)

Sebelum membuka akses aplikasi ke publik atau tim staf, pastikan langkah hardening berikut telah diverifikasi:

1. **RBAC di Level Server Actions:** Setiap fungsi di `src/modules/.../actions.ts` telah dilengkapi guardrail (mis. `isManagerOrAbove(user)` atau `isOwnerOrAdmin(user)`). Ini mencegah serangan manipulasi API (*Direct Object Reference*).
2. **Prisma Transactions (`$transaction`):** Seluruh mutasi kritis (seperti Penyesuaian Stok, Persetujuan Pengeluaran Finansial, dan Rekonsiliasi POS) menggunakan transaksi atomik. Jika salah satu proses (misal potong stok) gagal, maka pencatatan buku besar (*ledger*) otomatis dibatalkan (*rollback*).
3. **Audit Trail Mandatory:** Setiap aksi `CREATE`, `UPDATE`, `DELETE`, `APPROVE` pada entitas finansial dan operasional tercatat pada tabel `AuditLog` beserta payload JSON dan ID pelakunya.
4. **Enkripsi Kredensial:** Password pengguna di-hash menggunakan algoritma yang disediakan oleh `bcryptjs` sebelum disimpan ke database.

---

## 4. Environment Variables Checklist

Konfigurasikan file `.env` di server produksi Anda dengan variabel berikut:

```env
# 1. Database Configuration (PostgreSQL / Neon / Supabase)
DATABASE_URL="postgresql://user:password@host:port/bambooberry_ibms?sslmode=require"

# 2. NextAuth.js Configuration
# Generate secret baru di terminal: openssl rand -base64 32
AUTH_SECRET="your-secure-random-string-here"
AUTH_URL="https://ibms.bambooberry.co.id" # URL domain produksi Anda

# 3. Google Gemini AI Integration (Fase 8)
GEMINI_API_KEY="AIzaSyYourGoogleGeminiKeyHere..."

# 4. App Settings
NEXT_PUBLIC_APP_NAME="Bambooberry IBMS"
NEXT_PUBLIC_TIMEZONE="Asia/Jakarta"
```

---

## 5. Deployment Guide (Vercel / VPS / Railway)

Aplikasi ini sangat cocok di-deploy menggunakan ekosistem **Vercel** (untuk Frontend/Backend Serverless) dikombinasikan dengan **Neon** atau **Supabase** (untuk PostgreSQL).

### Langkah Deployment Standar:

1. Hubungkan repositori Git Anda ke platform deployment (mis. Vercel).
2. Masukkan seluruh *Environment Variables* di atas ke menu pengaturan Vercel (`Project Settings -> Environment Variables`).
3. Atur **Build Command**:
   ```bash
   npx prisma generate && npx prisma db push && next build
   ```
   *(Catatan: Gunakan `npx prisma migrate deploy` alih-alih `db push` jika Anda sudah menggunakan file migrasi berversi secara rutin di production).*
4. Jalankan Deployment.
5. (Pertama Kali Saja) Buat akun Super Admin / Owner langsung melalui antarmuka atau Database Seeding script yang telah disiapkan di `prisma/seed.ts`:
   ```bash
   npx prisma db seed
   ```

---

## 6. Rekomendasi Pemeliharaan (Next Steps)

Untuk menjaga performa dan reliabilitas aplikasi Bambooberry IBMS ke depannya:

1. **Database Indexing:** Seiring pertumbuhan transaksi harian dan clock-in staf, pantau *query time* di PostgreSQL. Indeks tambahan telah dipasang pada tabel `PosReconciliation`, `DailyItem`, `Attendance`, dan `EarlyWarningAlert`.
2. **Backup Rutin:** Aktifkan fitur *Automated Daily Backup* pada penyedia layanan PostgreSQL (Neon/AWS RDS) Anda.
3. **Cron Jobs untuk EWS:** Integrasikan Vercel Cron Jobs (atau eksternal scheduler) untuk memicu fungsi agregasi Early Warning System (mengecek stok minimum dan komplain SLA) pada tengah malam setiap harinya.

---
*Bambooberry IBMS kini siap digunakan untuk memajukan skala bisnis kuliner dan agrowisata Anda di Ciwidey.*
