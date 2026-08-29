import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Bell,
  Sparkles,
  School,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Check,
  Calendar,
  Menu,
  QrCode,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAIAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAIAssistant }) => {
  const { currentUser, schoolProfile, loginAs, logout, notifications, markNotificationRead, activeTab, setActiveTab } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabLabels: Record<string, string> = {
    dashboard: "Dashboard Utama",
    master: "Data Master Sekolah",
    curriculum: "Kurikulum & CP/KD",
    attendance: "Presensi QR Code",
    my_qr: "QR Code Saya",
    questions: "Bank Soal & AI Generator",
    exams: "Ujian Online (CBT)",
    assignments: "Tugas & Lembar Kerja",
    assessment: "Penilaian & Remedial",
    rapor: "E-Rapor Digital",
    reports: "Laporan & Rekapitulasi",
    settings: "Pengaturan Sistem",
  };

  const roleLabels: Record<string, { label: string; bg: string; text: string }> = {
    admin: { label: "SUPER ADMIN", bg: "bg-emerald-50", text: "text-emerald-800 border-emerald-200" },
    guru: { label: "GURU PENGAJAR", bg: "bg-teal-50", text: "text-teal-800 border-teal-200" },
    siswa: { label: "PESERTA DIDIK", bg: "bg-emerald-50", text: "text-emerald-700 border-emerald-200" },
    orangtua: { label: "ORANG TUA / WALI", bg: "bg-amber-50", text: "text-amber-700 border-amber-200" },
  };

  const currentRoleStyle = currentUser ? roleLabels[currentUser.role] : roleLabels.admin;

  return (
    <header className="h-16 bg-white border-b border-emerald-100/80 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumb / Branding */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg lg:hidden transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand logo in mobile */}
        <div className="flex items-center gap-2 lg:hidden" onClick={() => setActiveTab("dashboard")}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-700 to-teal-800 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs">
            sM
          </div>
          <span className="font-extrabold text-emerald-950 text-sm tracking-tight">smart MTs</span>
        </div>

        {/* Clean Breadcrumb (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-sm">
          <span className="text-emerald-800/60 font-semibold cursor-pointer hover:text-emerald-800 flex items-center gap-1.5" onClick={() => setActiveTab("dashboard")}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            sMTs
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-semibold">{tabLabels[activeTab] || "Overview"}</span>
        </div>
      </div>

      {/* Center / Search bar & Academic info */}
      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative h-9 sm:h-10 w-44 sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa, mapel, ujian..."
            className="w-full h-full pl-9 sm:pl-10 pr-4 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-full text-xs text-slate-800 placeholder:text-slate-400 border border-transparent focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
          />
          <Search className="absolute left-3 top-2.5 sm:top-3 w-4 h-4 text-slate-400" />
        </div>

        {/* Semester / Academic Tag */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-xs text-emerald-800 font-medium border border-emerald-100">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>TP {schoolProfile.academicYear}</span>
          <span className="text-emerald-300">•</span>
          <span>Semester {schoolProfile.semester}</span>
        </div>
      </div>

      {/* Right: Personal QR Shortcut, AI Trigger, Notifications & Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Personal QR Card Button */}
        <button
          onClick={() => setActiveTab("attendance")}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          title="Buka Presensi & QR Code Saya"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Presensi QR</span>
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAIAssistant}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-all border border-emerald-200 cursor-pointer"
          title="Buka AI Assistant Guru"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline">AI Guru</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl relative transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in-50 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifikasi smart MTs</h4>
                <span className="text-[10px] text-slate-400 font-medium">{notifications.length} pesan</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Tidak ada notifikasi baru</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? "bg-emerald-50/40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-semibold text-slate-900 leading-snug">{n.title}</h5>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Role Switcher & User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-emerald-100 hover:bg-emerald-50/60 transition-colors"
          >
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
              alt={currentUser?.name}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-200"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[130px] leading-tight">
                {currentUser?.name || "Pengguna"}
              </div>
              <span className="text-[9px] font-bold text-emerald-700">
                {currentRoleStyle.label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-76 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 animate-in fade-in-50 duration-150">
              <div className="p-2.5 border-b border-slate-100 bg-emerald-50/50 rounded-xl mb-2">
                <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Akun Aktif (smart MTs)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{currentUser?.name}</div>
                <div className="text-xs text-slate-500">{currentUser?.email}</div>
                {currentUser?.qrToken && (
                  <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                    <QrCode className="w-3 h-3 text-emerald-700" />
                    <span>{currentUser.qrToken}</span>
                  </div>
                )}
              </div>

              {/* Fast Demo Role Switch */}
              <div className="py-1">
                <div className="px-2 pb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Ganti Akun Demo
                </div>
                <button
                  onClick={() => { loginAs("admin"); setShowRoleMenu(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg hover:bg-emerald-50 text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-800" />
                    <span className="font-medium">Super Admin (Drs. Bambang)</span>
                  </div>
                  {currentUser?.role === "admin" && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
                <button
                  onClick={() => { loginAs("guru", "teacher_01"); setShowRoleMenu(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg hover:bg-emerald-50 text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="font-medium">Guru MTK (Siti Nurhaliza, M.Pd.)</span>
                  </div>
                  {currentUser?.id === "teacher_01" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => { loginAs("siswa", "std_01"); setShowRoleMenu(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg hover:bg-emerald-50 text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                    <span className="font-medium">Siswa (Ahmad Fauzan - 7A)</span>
                  </div>
                  {currentUser?.id === "std_01" && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </button>
                <button
                  onClick={() => { loginAs("orangtua", "parent_01"); setShowRoleMenu(false); }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg hover:bg-amber-50 text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span className="font-medium">Orang Tua (H. Hendra Pratama)</span>
                  </div>
                  {currentUser?.id === "parent_01" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-1">
                <button
                  onClick={() => { logout(); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

