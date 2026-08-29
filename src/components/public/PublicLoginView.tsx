import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Database,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Users,
  BookOpen,
  HeartHandshake,
  Loader2,
  LogIn,
} from "lucide-react";

interface RoleOption {
  value: string;
  label: string;
  roleType: UserRole;
  description: string;
  icon: React.ElementType;
  demoUsername: string;
  demoPassword: string;
  color: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "admin",
    label: "Admin",
    roleType: "admin",
    description: "Administrator & Pengelola Sistem Madrasah",
    icon: ShieldCheck,
    demoUsername: "admin",
    demoPassword: "admin123",
    color: "emerald",
  },
  {
    value: "guru",
    label: "Guru",
    roleType: "guru",
    description: "Dewan Guru, Pendidik & Wali Kelas",
    icon: BookOpen,
    demoUsername: "siti.nurhaliza",
    demoPassword: "guru123",
    color: "teal",
  },
  {
    value: "siswa",
    label: "Siswa",
    roleType: "siswa",
    description: "Peserta Didik (Fase D MTs)",
    icon: GraduationCap,
    demoUsername: "ahmad.fauzan",
    demoPassword: "siswa123",
    color: "blue",
  },
  {
    value: "orang_tua",
    label: "Orang Tua / Wali",
    roleType: "orangtua",
    description: "Wali Murid & Monitoring Rapor Siswa",
    icon: HeartHandshake,
    demoUsername: "budi.santoso",
    demoPassword: "parent123",
    color: "amber",
  },
];

export const PublicLoginView: React.FC = () => {
  const {
    loginWithCredentials,
    navigateToPublic,
    navigateToDashboard,
    currentUser,
    schoolProfile,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      navigateToDashboard("dashboard");
    }
  }, [currentUser, navigateToDashboard]);

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRole(roleValue);
    setErrorMessage(null);
  };

  const handleApplyDemoAccount = (roleOpt: RoleOption) => {
    setSelectedRole(roleOpt.value);
    setUsername(roleOpt.demoUsername);
    setPassword(roleOpt.demoPassword);
    setErrorMessage(null);
    setSuccessMessage(`Data demo ${roleOpt.label} terisi. Klik "Masuk ke Sistem" untuk login.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate form inputs
    if (!selectedRole) {
      setErrorMessage("Silakan pilih jenis pengguna terlebih dahulu.");
      return;
    }

    if (!username.trim() || !password) {
      setErrorMessage("Username atau email dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithCredentials(username.trim(), password, selectedRole);
      if (res.success) {
        setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...");
      } else {
        setErrorMessage(res.message || "Gagal masuk ke sistem.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleData = ROLE_OPTIONS.find((r) => r.value === selectedRole);

  return (
    <div
      id="public-login-view"
      className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

      {/* Back to Website Button */}
      <div className="max-w-lg w-full mx-auto mb-4">
        <button
          id="btn-back-to-public"
          type="button"
          onClick={() => navigateToPublic("home")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-slate-800/80 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Website Resmi Madrasah</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-lg w-full mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-7 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Masuk ke smart MTs
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1 font-medium">
            {schoolProfile.name || "Sistem Informasi & Manajemen Madrasah Terpadu"}
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Error Alert */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div
              id="login-success-alert"
              className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector Combobox */}
            <div>
              <label
                htmlFor="login-role-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between"
              >
                <span>Login Sebagai</span>
                <span className="text-[11px] font-semibold text-rose-500 lowercase">
                  * wajib dipilih
                </span>
              </label>
              <div className="relative">
                <select
                  id="login-role-select"
                  value={selectedRole}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className={`w-full appearance-none pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                    selectedRole
                      ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 focus:ring-emerald-500"
                      : "border-slate-300 bg-slate-50/50 text-slate-600 focus:ring-emerald-500"
                  }`}
                >
                  <option value="" disabled>
                    — Pilih jenis pengguna —
                  </option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>

                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {selectedRoleData ? (
                    <selectedRoleData.icon className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Users className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {selectedRoleData && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <selectedRoleData.icon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akses: {selectedRoleData.description}</span>
                </div>
              )}
            </div>

            {/* Username / Email */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Username / Alamat Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email akun"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Guide */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pilih Akun Demo Cepat
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                Otomatis isi form
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((roleOpt) => {
                const IconComponent = roleOpt.icon;
                const isSelected = selectedRole === roleOpt.value;

                return (
                  <button
                    key={roleOpt.value}
                    type="button"
                    onClick={() => handleApplyDemoAccount(roleOpt)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 shadow-xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <IconComponent
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-emerald-600" : "text-slate-400"
                        }`}
                      />
                      <span>{roleOpt.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span className="truncate">{roleOpt.demoUsername}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer security badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              PostgreSQL (Single Source of Truth)
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tervalidasi di Server
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
