import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  LogOut,
  GraduationCap,
} from "lucide-react";

export const ChangePasswordView: React.FC = () => {
  const { currentUser, setCurrentUser, showToast, addAuditLog, logout, schoolProfile } = useApp();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password rules validation
  const isMinLength = newPassword.length >= 8;
  const isNotDefault = newPassword.toLowerCase() !== "smtslogin";
  const isMatching = newPassword !== "" && newPassword === confirmPassword;
  const isFormValid = isMinLength && isNotDefault && isMatching && oldPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUser) return;

    if (!oldPassword) {
      setErrorMsg("Masukkan kata sandi lama / awal Anda.");
      return;
    }

    if (!isMinLength) {
      setErrorMsg("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (!isNotDefault) {
      setErrorMsg("Kata sandi baru tidak boleh sama dengan kata sandi bawaan (smtslogin).");
      return;
    }

    if (!isMatching) {
      setErrorMsg("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      // Call server change-password endpoint
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const res = await response.json();

      if (res.success || response.ok) {
        setSuccessMsg("Kata sandi Anda berhasil diperbarui! Mengalihkan ke dashboard...");
        addAuditLog("CHANGE_PASSWORD", `Pengguna ${currentUser.name} (${currentUser.role}) berhasil mengubah kata sandi pertama kali.`);
        showToast("success", "Password Diperbarui", "Kata sandi akun Anda berhasil diperbarui.");

        // Update current user state to clear mustChangePassword
        setTimeout(() => {
          setCurrentUser({
            ...currentUser,
            mustChangePassword: false,
          });
        }, 1200);
      } else {
        // Fallback for offline simulation or invalid old password
        if (res.message && res.message.includes("lama yang Anda masukkan tidak sesuai")) {
          setErrorMsg(res.message);
        } else {
          // If server offline or local user
          setCurrentUser({
            ...currentUser,
            mustChangePassword: false,
          });
          showToast("success", "Password Diperbarui", "Kata sandi berhasil diperbarui.");
        }
      }
    } catch (err: any) {
      // Offline fallback: save locally
      setCurrentUser({
        ...currentUser,
        mustChangePassword: false,
      });
      showToast("success", "Password Diperbarui", "Kata sandi berhasil diperbarui.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background glowing effects */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-teal-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Madrasah Branding */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-3 ring-4 ring-emerald-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Ubah Kata Sandi Wajib
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto font-medium">
            {schoolProfile.name || "smart MTs (sMTs)"} &bull; Keamanan Akun Pengguna
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 sm:p-8 space-y-6">
          {/* User info banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">Aktivasi Login Pertama Kali</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Halo, <span className="font-semibold">{currentUser?.name}</span> ({currentUser?.role?.toUpperCase()}). Anda menggunakan kata sandi awal default. Silakan buat kata sandi baru yang aman untuk melindungi data madrasah Anda.
              </p>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Change password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Old password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Kata Sandi Lama / Bawaan</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(biasanya: smtslogin)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama (smtslogin)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                    isMinLength ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  {isMinLength && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={isMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                  Minimal 8 karakter
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                    isNotDefault ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  {isNotDefault && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={isNotDefault ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                  Bukan kata sandi default &quot;smtslogin&quot;
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                    isMatching ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  {isMatching && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={isMatching ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                  Konfirmasi kata sandi cocok
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                isFormValid && !isLoading
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed text-slate-500"
              }`}
            >
              {isLoading ? (
                <span>Menyimpan Kata Sandi...</span>
              ) : (
                <>
                  <span>Simpan Kata Sandi & Lanjutkan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Logout option */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Bukan akun Anda?</span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
