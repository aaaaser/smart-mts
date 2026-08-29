import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import {
  GraduationCap,
  Lock,
  User,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  LogIn,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";

export const PublicLoginView: React.FC = () => {
  const {
    loginAs,
    loginWithCredentials,
    navigateToPublic,
    navigateToDashboard,
    users,
    schoolProfile,
  } = useApp();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>("admin");

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginWithCredentials(username, password);
    if (success) {
      navigateToDashboard("dashboard");
    }
  };

  const handleQuickDemoLogin = (role: UserRole, customUserId?: string) => {
    loginAs(role, customUserId);
    navigateToDashboard("dashboard");
  };

  return (
    <div id="public-login-view" className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

      {/* Back to Home button */}
      <div className="max-w-md w-full mx-auto mb-6">
        <button
          onClick={() => navigateToPublic("home")}
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website Resmi Madrasah</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Portal smart MTs</h2>
          <p className="text-xs text-emerald-200 mt-1">
            {schoolProfile.name || "Sistem Manajemen Madrasah Terpadu"}
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Quick Demo Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Pilih Akun Demo Pengguna</span>
              <span className="text-[10px] text-emerald-600 font-semibold lowercase">1-klik langsung masuk</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin123");
                  setSelectedDemoRole("admin");
                }}
                className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                  selectedDemoRole === "admin"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Admin Madrasah</span>
                </div>
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">admin</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("siti.nurhaliza");
                  setPassword("guru123");
                  setSelectedDemoRole("guru");
                }}
                className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                  selectedDemoRole === "guru"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>Guru & Waka</span>
                </div>
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">siti.nurhaliza</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("ahmad.fauzan");
                  setPassword("siswa123");
                  setSelectedDemoRole("siswa");
                }}
                className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                  selectedDemoRole === "siswa"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Siswa (Fase D)</span>
                </div>
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">ahmad.fauzan</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("budi.santoso");
                  setPassword("parent123");
                  setSelectedDemoRole("orang_tua");
                }}
                className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                  selectedDemoRole === "orang_tua"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Orang Tua/Wali</span>
                </div>
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">budi.santoso</p>
              </button>
            </div>
          </div>

          {/* Manual Credentials Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username / Alamat Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username atau email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Akun Saya</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(selectedDemoRole)}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors"
              >
                Masuk Cepat Sebagai ({selectedDemoRole.toUpperCase()})
              </button>
            </div>
          </form>

          {/* Database & Security Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              PostgreSQL Ready (smts_db)
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Koneksi Aman & Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
