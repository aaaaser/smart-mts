import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Building,
  UserCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Server,
  RefreshCw,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, resetAllData, showToast } = useApp();

  const [form, setForm] = useState(schoolProfile);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    error: string | null;
    database: string;
    stats?: any;
    loading: boolean;
  }>({
    connected: false,
    error: null,
    database: "smts_db",
    loading: true,
  });

  const checkDb = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/system/status");
      const data = await res.json();
      setDbStatus({
        connected: data.connected,
        error: data.error,
        database: data.database || "smts_db",
        stats: data.stats,
        loading: false,
      });
    } catch {
      setDbStatus({
        connected: false,
        error: "Server backend offline atau belum merespon",
        database: "smts_db",
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkDb();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(form);
    try {
      await fetch("/api/system/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      showToast("success", "Pengaturan Disimpan", "Profil madrasah berhasil diperbarui.");
    } catch (err) {
      console.warn("Could not sync settings to server:", err);
    }
  };

  const handleExportBackup = () => {
    const raw = localStorage.getItem("edusmart_school_db_v1");
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smts-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    showToast("success", "Backup Berhasil", "File cadangan data sekolah berhasil diunduh.");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.users && json.classes) {
          localStorage.setItem("edusmart_school_db_v1", JSON.stringify(json));
          showToast("success", "Restore Berhasil", "Data berhasil dipulihkan. Memuat ulang halaman...");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast("error", "Format Salah", "Struktur file JSON tidak valid untuk smart MTs.");
        }
      } catch {
        showToast("error", "File Rusak", "Gagal membaca file backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sekolah & Database PostgreSQL</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola profil kelembagaan madrasah, tahun ajaran aktif, kurikulum nasional, dan konfigurasi database PostgreSQL (smts_db).
        </p>
      </div>

      {/* PostgreSQL Database Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Database Utama: PostgreSQL (smts_db)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Prisma ORM 6.x
                </span>
              </div>
              <p className="text-xs text-slate-400">Penyimpanan relasional terstruktur dengan Prisma Engine & Seeding data lengkap.</p>
            </div>
          </div>

          <button
            onClick={checkDb}
            disabled={dbStatus.loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.loading ? "animate-spin" : ""}`} />
            <span>Cek Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status Koneksi Engine</span>
            {dbStatus.connected ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Terhubung ke PostgreSQL</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Lokal / Standby</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Database Target</span>
            <div className="flex items-center gap-2 text-slate-200 text-xs font-mono font-bold">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>smts_db</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status Data & Seeding</span>
            <span className="text-xs font-bold text-slate-200">
              {dbStatus.stats ? `${dbStatus.stats.totalUsers} Pengguna • ${dbStatus.stats.attendanceRecords} Absensi` : "Siap Dimigrasikan"}
            </span>
          </div>
        </div>

        {/* Command Reference Box */}
        <div className="bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-sans font-bold text-xs mb-1">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workflow CLI Database:</span>
          </div>
          <p className="text-emerald-400">$ npm run db:migrate <span className="text-slate-500"># Jalankan Prisma migration</span></p>
          <p className="text-emerald-400">$ npm run db:seed <span className="text-slate-500"># Seeding akun Admin, 5 Guru, 30 Siswa, Rombel</span></p>
          <p className="text-emerald-400">$ npm run db:studio <span className="text-slate-500"># Buka GUI Visual Prisma Studio</span></p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Identitas Lembaga Pendidikan</h3>
            <p className="text-xs text-slate-400">Data resmi yang akan dicantumkan pada kop surat dan E-Rapor.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Resmi Lembaga / Madrasah</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NPSN</label>
            <input
              type="text"
              value={form.npsn}
              onChange={(e) => setForm({ ...form, npsn: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NSS / Nomor Statistik</label>
            <input
              type="text"
              value={form.nss}
              onChange={(e) => setForm({ ...form, nss: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Akreditasi</label>
            <input
              type="text"
              value={form.accreditation}
              onChange={(e) => setForm({ ...form, accreditation: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">URL Logo Sekolah</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-6 pb-4 border-b border-t border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pimpinan & Periode Akademik</h3>
            <p className="text-xs text-slate-400">Kepala madrasah dan tahun pelajaran berjalan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah / Madrasah</label>
            <input
              type="text"
              value={form.principalName}
              onChange={(e) => setForm({ ...form, principalName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
            <input
              type="text"
              value={form.principalNip}
              onChange={(e) => setForm({ ...form, principalNip: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
            <input
              type="text"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value as any })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            >
              <option value="ganjil">Semester Ganjil</option>
              <option value="genap">Semester Genap</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Kurikulum Utama</label>
            <select
              value={form.activeCurriculum}
              onChange={(e) => setForm({ ...form, activeCurriculum: e.target.value as any })}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
            >
              <option value="merdeka">Kurikulum Merdeka (Fase D/E/F)</option>
              <option value="k13">Kurikulum 2013 (K13 Revisi)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pencadangan & Pemulihan Data (Disaster Recovery)</h3>
            <p className="text-xs text-slate-400">Unduh cadangan JSON atau gunakan utility PostgreSQL natif.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Backup Data (JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm("Reset seluruh data ke konfigurasi demo awal? Tindakan ini tidak dapat dibatalkan.")) {
                resetAllData();
              }
            }}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Reset ke Demo Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
