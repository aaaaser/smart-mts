# smart MTs (sMTs) — Sistem Manajemen Madrasah Tsanawiyah Terpadu

Aplikasi komprehensif untuk tata kelola madrasah tsanawiyah: Master Data, Presensi Scanner QR Terpadu, Penugasan Ganda Guru (Wali Kelas, Guru Piket, Pembina Ekskul), Bank Soal & Asesmen Kurikulum Merdeka / K13, CBT Online, E-Rapor Digital, dan Integrasi Gemini AI.

---

## 🛠️ Stack & Arsitektur Database

- **Database Utama**: PostgreSQL (`smts_db`)
- **ORM**: Prisma ORM (v6.x)
- **Backend Server**: Node.js / Express + TypeScript (Modular Router)
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Lucide Icons + Motion
- **AI Engine**: Google Gemini API (`@google/genai` model `gemini-3.7-flash`)

---

## 🚀 Panduan Instalasi & Konfigurasi PostgreSQL Lokal

### 1. Persiapan Database PostgreSQL

Pastikan PostgreSQL service telah aktif pada komputer Anda. Buat database baru bernama `smts_db`:

```sql
-- Masuk ke PostgreSQL CLI (psql) atau via pgAdmin:
CREATE DATABASE smts_db;
```

### 2. Konfigurasi File Environment (`.env`)

Salin atau buat file `.env` pada root direktori:

```env
# URL Koneksi PostgreSQL Lokal
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/smts_db?schema=public"

# Kunci Gemini AI (Opsional untuk fitur asisten AI & bank soal)
GEMINI_API_KEY="AIzaSy..."
```

> **Catatan Keamanan:** Ganti `YOUR_PASSWORD` dengan kata sandi akun PostgreSQL lokal Anda. Jangan menyimpan password di source code.

### 3. Instalasi Dependensi

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Jalankan Database Migration

Perintah ini akan membuat seluruh tabel, relasi, foreign keys, indeks, dan enum di database `smts_db`:

```bash
npm run db:migrate
```

### 6. Seeding Data Awal (Wajib untuk Testing)

Perintah ini akan mengisi database dengan data lengkap siap pakai:
- **1 Akun Administrator**: `admin` (Password: `admin123`)
- **5 Akun Guru**: NIP, data penugasan ganda (Wali Kelas, Guru Piket, Pembina Pramuka), QR Code unik
- **30 Akun Siswa**: Tersebar di Kelas VII-A, VII-B, VIII-A, VIII-B, IX-A dengan NISN, riwayat kelas & QR Code
- **Mata Pelajaran & Jadwal Pelajaran**
- **Capaian Pembelajaran (CP / KD / TP)**
- **Bank Soal HOTS & Ujian CBT**
- **Riwayat Absensi & Nilai Rapor**

```bash
npm run db:seed
```

### 7. Jalankan Server Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan pada: **`http://localhost:3000`**

---

## 📋 Daftar Perintah Database (CLI Commands)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run db:generate` | Menghasilkan Prisma Client types berdasarkan `schema.prisma` |
| `npm run db:migrate` | Membuat dan menerapkan migrasi skema ke database PostgreSQL |
| `npm run db:seed` | Menjalankan seeding data master, pengguna, dan transaksi awal |
| `npm run db:studio` | Membuka antarmuka grafis (GUI) visual Prisma Studio di browser |
| `npm run db:reset` | Mereset database, menghapus semua data, lalu menjalankan migrasi dan seed ulang |

---

## 🛡️ Backup & Pemulihan Database PostgreSQL

### Pencadangan (Backup)
```bash
# Backup format custom compressed (Direkomendasikan)
pg_dump -U postgres -d smts_db -F c -b -v -f smts_backup_$(date +%Y%m%d).dump

# Backup format plain SQL
pg_dump -U postgres -d smts_db > smts_backup.sql
```

### Pemulihan (Restore)
```bash
# Restore dari file custom dump
pg_restore -U postgres -d smts_db -v -c smts_backup.dump

# Restore dari file SQL
psql -U postgres -d smts_db < smts_backup.sql
```

---

## 🔑 Akun Uji Coba Default (Demo Credentials)

| Role | Username | Password Default | Keterangan |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Akses penuh seluruh master data, pengaturan & log audit |
| **Guru (Wali Kelas)** | `guru_ahmad` | `guru123` | NIP: 198203152008011012 (Guru Matematika & Wali Kelas VII-A) |
| **Guru (Piket/Ekskul)**| `guru_siti` | `guru123` | NIP: 198507222010012025 (Guru IPA & Pembina Pramuka) |
| **Siswa** | `siswa_akbar` | `siswa123` | NIS: 232407001 (Siswa Kelas VII-A) |

---

## 🏢 Struktur Database & Model Entitas

- **`User`**, **`UserQrCode`**, **`AuditLog`**
- **`Teacher`**, **`TeacherSubject`**, **`TeacherAssignment`**, **`TeacherAssignmentType`**
- **`Student`**, **`StudentClassMembership`**, **`Parent`**, **`ParentStudent`**
- **`Class`**, **`Subject`**, **`Schedule`**, **`Extracurricular`**, **`ExtracurricularMember`**
- **`AcademicYear`**, **`Curriculum`**, **`LearningOutcome`**, **`LearningObjective`**, **`LearningMaterial`**
- **`AttendanceSession`**, **`AttendanceRecord`** (Constraint `@@unique([sessionId, userId])`)
- **`QuestionBank`**, **`Question`**, **`QuestionOption`**
- **`Exam`**, **`ExamQuestion`**, **`ExamAttempt`**, **`ExamAnswer`**
- **`Assignment`**, **`AssignmentSubmission`**
- **`Grade`**, **`GradeWeight`**
- **`ReportCard`**, **`ReportCardSubject`**
- **`SchoolSetting`**
