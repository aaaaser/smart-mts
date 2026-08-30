import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  QrCode,
  FileQuestion,
  GraduationCap,
  ClipboardList,
  Award,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  Sparkles,
  UserCheck,
  CreditCard,
  X,
  ShieldCheck,
  Globe,
  Newspaper,
  User,
  KeyRound,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenAIAssistant }) => {
  const { currentUser, activeTab, setActiveTab, teacherDuties, navigateToPublic, blogPosts, pendingResetCount, fetchPendingResetCount } = useApp();

  const role = currentUser?.role || "admin";

  useEffect(() => {
    if (role === "admin") {
      fetchPendingResetCount();
    }
  }, [role, activeTab, fetchPendingResetCount]);

  // Check teacher's duties
  const myDuties = currentUser?.role === "guru"
    ? teacherDuties.filter((d) => d.teacherId === currentUser.id && d.isActive)
    : [];

  const isWaliKelas = myDuties.some((d) => d.type === "wali_kelas");
  const isGuruPiket = myDuties.some((d) => d.type === "guru_piket");
  const isPembinaEkskul = myDuties.some((d) => d.type === "pembina_ekskul");

  const countPendingBlog = blogPosts.filter((p) => p.status === "submitted").length;

  const adminMenu = {
    main: [
      { id: "dashboard", label: "Dashboard Utama", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "profile", label: "Profil Admin", icon: <User className="w-4 h-4" /> },
      { id: "master", label: "Data Master", icon: <Users className="w-4 h-4" /> },
      { id: "duties", label: "Penugasan Guru", icon: <Award className="w-4 h-4" />, badge: "SK" },
      { id: "reset-password", label: "Reset Password", icon: <KeyRound className="w-4 h-4" />, badge: pendingResetCount > 0 ? `${pendingResetCount}` : undefined },
      { id: "blog_admin", label: "Manajemen Blog & Web", icon: <Newspaper className="w-4 h-4" />, badge: countPendingBlog > 0 ? `${countPendingBlog} Baru` : undefined },
      { id: "attendance", label: "Presensi QR Terpadu", icon: <QrCode className="w-4 h-4" />, badge: "QR" },
      { id: "curriculum", label: "Kurikulum & CP/KD", icon: <BookOpen className="w-4 h-4" /> },
      { id: "questions", label: "Bank Soal", icon: <FileQuestion className="w-4 h-4" /> },
      { id: "exams", label: "Akademik & Ujian", icon: <GraduationCap className="w-4 h-4" /> },
      { id: "assignments", label: "Tugas Online", icon: <ClipboardList className="w-4 h-4" /> },
    ],
    assessment: [
      { id: "assessment", label: "Penilaian & Bobot", icon: <Award className="w-4 h-4" /> },
      { id: "rapor", label: "E-Rapor Digital", icon: <FileText className="w-4 h-4" /> },
      { id: "reports", label: "Laporan & Rekap", icon: <BarChart3 className="w-4 h-4" /> },
    ],
    system: [
      { id: "settings", label: "Pengaturan Sistem", icon: <Settings className="w-4 h-4" /> },
    ],
  };

  const guruMenu = {
    main: [
      { id: "dashboard", label: "Dashboard Guru", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "profile", label: "Profil Guru", icon: <User className="w-4 h-4" /> },
      { id: "schedules", label: "Jadwal Mengajar", icon: <Calendar className="w-4 h-4" /> },
      { id: "attendance", label: "Presensi QR Terpadu", icon: <QrCode className="w-4 h-4" />, badge: "Scan" },
      ...(myDuties.length > 0
        ? [
            {
              id: "duties",
              label: isWaliKelas
                ? "Wali Kelas & Tugas"
                : isGuruPiket
                ? "Tugas Piket & Ekskul"
                : "Tugas Tambahan",
              icon: <Award className="w-4 h-4" />,
              badge: `${myDuties.length} Tugas`,
            },
          ]
        : []),
      { id: "curriculum", label: "CP/KD & Indikator", icon: <BookOpen className="w-4 h-4" /> },
      { id: "questions", label: "Bank Soal & AI", icon: <FileQuestion className="w-4 h-4" />, badge: "AI" },
      { id: "exams", label: "Ujian Online (CBT)", icon: <GraduationCap className="w-4 h-4" /> },
      { id: "assignments", label: "Tugas & Penilaian", icon: <ClipboardList className="w-4 h-4" /> },
      { id: "blog_teacher", label: "Blog Saya", icon: <Newspaper className="w-4 h-4" /> },
    ],
    assessment: [
      { id: "assessment", label: "Rekap Nilai Siswa", icon: <Award className="w-4 h-4" /> },
      { id: "rapor", label: "E-Rapor Siswa", icon: <FileText className="w-4 h-4" /> },
      { id: "reports", label: "Analisis Nilai", icon: <BarChart3 className="w-4 h-4" /> },
    ],
    system: [
      { id: "settings", label: "Pengaturan Sistem", icon: <Settings className="w-4 h-4" /> },
    ],
  };

  const siswaMenu = {
    main: [
      { id: "dashboard", label: "Dashboard Siswa", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "profile", label: "Profil Saya", icon: <User className="w-4 h-4" /> },
      { id: "schedules", label: "Jadwal Pelajaran", icon: <Calendar className="w-4 h-4" /> },
      { id: "attendance", label: "QR Code & Presensi", icon: <QrCode className="w-4 h-4" />, badge: "ID" },
      { id: "assignments", label: "Tugas Saya", icon: <ClipboardList className="w-4 h-4" /> },
      { id: "exams", label: "Ujian Online (CBT)", icon: <GraduationCap className="w-4 h-4" /> },
    ],
    assessment: [
      { id: "assessment", label: "Rekap Nilai Saya", icon: <Award className="w-4 h-4" /> },
      { id: "rapor", label: "Rapor Digital", icon: <FileText className="w-4 h-4" /> },
    ],
    system: [
      { id: "settings", label: "Pengaturan Akun", icon: <Settings className="w-4 h-4" /> },
    ],
  };

  const orangtuaMenu = {
    main: [
      { id: "dashboard", label: "Dashboard Anak", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "profile", label: "Profil Wali", icon: <User className="w-4 h-4" /> },
      { id: "attendance", label: "Kehadiran & QR Anak", icon: <UserCheck className="w-4 h-4" /> },
      { id: "assignments", label: "Tugas Anak", icon: <ClipboardList className="w-4 h-4" /> },
      { id: "exams", label: "Ujian CBT Anak", icon: <GraduationCap className="w-4 h-4" /> },
    ],
    assessment: [
      { id: "assessment", label: "Nilai & Perkembangan", icon: <Award className="w-4 h-4" /> },
      { id: "rapor", label: "E-Rapor Digital", icon: <FileText className="w-4 h-4" /> },
    ],
    system: [
      { id: "settings", label: "Pengaturan Akun", icon: <Settings className="w-4 h-4" /> },
    ],
  };

  const currentMenu =
    role === "guru"
      ? guruMenu
      : role === "siswa"
      ? siswaMenu
      : role === "orangtua"
      ? orangtuaMenu
      : adminMenu;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Clean Minimalism Sidebar with Islamic Green Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-emerald-100 z-40 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Block */}
        <div className="p-5 flex items-center justify-between border-b border-emerald-100/70 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("dashboard"); onClose(); }}>
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              sM
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base leading-tight">smart MTs</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-400/20 border border-emerald-300/40 text-emerald-300 font-bold rounded">
                  sMTs
                </span>
              </div>
              <span className="text-[10px] text-emerald-200/80 font-medium tracking-wide truncate max-w-[150px]">
                Platform Sekolah Terpadu
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-lg lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Main Menu Section */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
            Menu Utama
          </div>
          {currentMenu.main.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-emerald-700" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {(item as { badge?: string }).badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                    isActive ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {(item as { badge?: string }).badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Assessment Section */}
          {currentMenu.assessment.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-3">
                Penilaian & Hasil
              </div>
              {currentMenu.assessment.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-700" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Fitur Cerdas AI */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-3">
            Fitur Cerdas
          </div>
          <button
            onClick={() => {
              onOpenAIAssistant();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl transition-all text-xs font-semibold border border-emerald-200/80 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Asisten Guru</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
              GEMINI
            </span>
          </button>

          {/* System Section */}
          {currentMenu.system.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-3">
                Sistem & Profil
              </div>
              {currentMenu.system.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-700" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Website Publik External Link */}
          <div className="pt-2">
            <button
              onClick={() => {
                navigateToPublic("home");
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Website Depan</span>
              </div>
              <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                PUBLIC
              </span>
            </button>
          </div>
        </nav>

        {/* User Card at bottom with QR Code quick toggle */}
        <div className="p-3 border-t border-emerald-100 bg-emerald-50/40">
          <div
            onClick={() => { setActiveTab("attendance"); onClose(); }}
            className="flex items-center gap-2.5 p-2 bg-white border border-emerald-200/80 rounded-xl hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
            title="Klik untuk membuka QR Code & Kartu Identitas"
          >
            <img
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
              alt={currentUser?.name}
              className="w-9 h-9 rounded-lg object-cover ring-1 ring-emerald-200 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || "Pengguna"}</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                <QrCode className="w-3 h-3 text-emerald-600" />
                <span className="truncate">{currentUser?.role.toUpperCase()} • QR Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
