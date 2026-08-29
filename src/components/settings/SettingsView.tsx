import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  School,
  Save,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Building,
  UserCheck,
  Calendar,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, resetAllData, showToast } = useApp();

  const [form, setForm] = useState(schoolProfile);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(form);
  };

  const handleExportBackup = () => {
    const raw = localStorage.getItem("edusmart_school_db_v1");
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edusmart-backup-${new Date().toISOString().split("T")[0]}.json`;
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
          showToast("error", "Format Salah", "Struktur file JSON tidak valid untuk EduSmart.");
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
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sekolah & Sistem</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola profil kelembagaan madrasah/sekolah, tahun ajaran aktif, kurikulum nasional, dan cadangan data.
        </p>
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
            <h3 className="text-sm font-bold text-slate-900">Pencadangan & Pemulihan Data</h3>
            <p className="text-xs text-slate-400">Unduh atau pulihkan seluruh database sekolah.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
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
