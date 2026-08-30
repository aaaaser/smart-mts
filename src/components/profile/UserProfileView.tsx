import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  QrCode,
  GraduationCap,
  Users,
  Briefcase,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock,
  IdCard,
  Camera,
  Upload,
  Printer,
  Image as ImageIcon,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { PrintAttendanceCardModal } from "../attendance/PrintAttendanceCardModal";

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    teacherDuties,
    classes,
    subjects,
    users,
    showToast,
    addAuditLog,
    schoolProfile,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<string>("info");

  // Photo Upload State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Print Card State
  const [isPrintCardOpen, setIsPrintCardOpen] = useState(false);

  // Change Password Form State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const role = currentUser.role || "admin";

  // Teacher specific duties & subjects
  const myDuties = role === "guru"
    ? teacherDuties.filter((d) => d.teacherId === currentUser.id && d.isActive)
    : [];

  // Student specific data
  const myClass = classes.find((c) => c.id === currentUser.classId);
  const myWaliKelas = users.find((u) => u.id === myClass?.waliKelasId);

  // Parent specific children
  const myChildren = role === "orangtua"
    ? users.filter((u) => u.role === "siswa" && (u.id === currentUser.childStudentId || u.parentId === currentUser.id || u.parentPhone === currentUser.phone))
    : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setPhotoError("Format file harus berupa JPG, JPEG, PNG, atau WEBP.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Ukuran file maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.onerror = () => {
      setPhotoError("Gagal membaca file foto.");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoBase64) {
      setPhotoError("Silakan pilih file foto terlebih dahulu.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError(null);

    try {
      const res = await fetch(`/api/users/${currentUser.id}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoData: photoBase64,
        }),
      });

      const data = await res.json();
      if (data.success && data.photoUrl) {
        // Update current user state
        const updatedUser = {
          ...currentUser,
          avatar: data.photoUrl,
        };
        setCurrentUser(updatedUser);

        showToast("success", "Foto Diperbarui", "Foto profil berhasil diperbarui.");
        addAuditLog("UPDATE_PROFILE_PHOTO", `Pengguna ${currentUser.name} (${currentUser.role}) berhasil memperbarui foto profil.`);

        setIsPhotoModalOpen(false);
        setPhotoPreview(null);
        setPhotoBase64(null);
      } else {
        setPhotoError(data.message || "Gagal mengunggah foto.");
      }
    } catch (err: any) {
      setPhotoError(err?.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!oldPassword) {
      setErrorMsg("Password saat ini wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
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
        setSuccessMsg(res.message || "Password berhasil diperbarui.");
        showToast("success", "Berhasil", "Password berhasil diperbarui.");
        addAuditLog("CHANGE_PASSWORD", `Pengguna ${currentUser.name} (${currentUser.role}) berhasil memperbarui kata sandi akun.`);

        // Clear form & update local user state
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);

        setCurrentUser({
          ...currentUser,
          mustChangePassword: false,
        });
      } else {
        setErrorMsg(res.message || "Password saat ini salah.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* User Photo with Camera Button */}
            <div className="relative group">
              <img
                src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
              />
              <button
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoBase64(null);
                  setPhotoError(null);
                  setIsPhotoModalOpen(true);
                }}
                className="absolute inset-0 bg-emerald-950/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center transition-opacity cursor-pointer text-white text-[10px] font-bold gap-1 backdrop-blur-xs"
                title="Klik untuk ubah foto profil"
              >
                <Camera className="w-5 h-5" />
                <span>Ubah Foto</span>
              </button>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full ring-2 ring-emerald-950 flex items-center justify-center text-[10px]">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {role === "admin"
                    ? "Super Admin"
                    : role === "guru"
                    ? "Guru Pengajar"
                    : role === "siswa"
                    ? "Peserta Didik"
                    : "Orang Tua / Wali"}
                </span>
                <span className="text-xs text-emerald-200/80">
                  {schoolProfile.name}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentUser.name}
              </h2>

              <p className="text-xs text-emerald-100/80 flex items-center gap-3 flex-wrap">
                <span>@{currentUser.username}</span>
                <span>•</span>
                <span>{currentUser.email || "email@madrasah.sch.id"}</span>
                {currentUser.nipOrNis && (
                  <>
                    <span>•</span>
                    <span className="font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40 text-[11px]">
                      {role === "guru" ? `NIP: ${currentUser.nipOrNis}` : `NIS: ${currentUser.nipOrNis}`}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Badges: Ubah Foto & Cetak Kartu Absensi */}
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setPhotoPreview(null);
                setPhotoBase64(null);
                setPhotoError(null);
                setIsPhotoModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ubah Foto</span>
            </button>

            {(role === "guru" || role === "siswa") && (
              <button
                onClick={() => setIsPrintCardOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cetak Kartu Absensi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("info")}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "info"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>
            {role === "guru"
              ? "Informasi Pribadi"
              : role === "siswa"
              ? "Informasi Siswa"
              : role === "orangtua"
              ? "Informasi Wali"
              : "Informasi Akun"}
          </span>
        </button>

        {role === "guru" && (
          <>
            <button
              onClick={() => setActiveSubTab("employment")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "employment"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Informasi Kepegawaian</span>
            </button>

            <button
              onClick={() => setActiveSubTab("duties")}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === "duties"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Tugas Tambahan</span>
              {myDuties.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                  {myDuties.length}
                </span>
              )}
            </button>
          </>
        )}

        {role === "siswa" && (
          <button
            onClick={() => setActiveSubTab("class")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "class"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Informasi Kelas & Akademik</span>
          </button>
        )}

        {role === "orangtua" && (
          <button
            onClick={() => setActiveSubTab("children")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "children"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anak Saya</span>
            {myChildren.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                {myChildren.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveSubTab("security")}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "security"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Keamanan Akun</span>
        </button>
      </div>

      {/* Ubah Foto Modal */}
      {isPhotoModalOpen && (
        <Modal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          title="Ubah Foto Profil"
        >
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative">
                <img
                  src={photoPreview || currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                  alt="Preview"
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-emerald-600/40 shadow-sm"
                />
                {photoPreview && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                    Baru
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pilih Berkas Foto Profil
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mendukung format <strong>JPG, JPEG, PNG, WEBP</strong>. Ukuran berkas maksimal <strong>5 MB</strong>.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas dari Komputer</span>
                </button>
              </div>
            </div>

            {photoError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!photoBase64 || isUploadingPhoto}
                onClick={handleSavePhoto}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Foto Profil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Attendance Card Modal */}
      {isPrintCardOpen && (
        <PrintAttendanceCardModal
          isOpen={isPrintCardOpen}
          onClose={() => setIsPrintCardOpen(false)}
          targetUser={currentUser}
        />
      )}

      {/* Tab 1: Personal Info */}
      {activeSubTab === "info" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {role === "guru"
                  ? "Informasi Pribadi Tenaga Pendidik"
                  : role === "siswa"
                  ? "Biodata Peserta Didik"
                  : role === "orangtua"
                  ? "Data Pribadi Orang Tua / Wali Murid"
                  : "Informasi Pengelola Administrator"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data identitas yang terdaftar secara resmi di pangkalan data smart MTs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Nama Lengkap</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {currentUser.name}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {role === "guru" ? "NIP / NUPTK" : role === "siswa" ? "NIS / NISN" : "Username / Akun"}
              </span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                {currentUser.nipOrNis || currentUser.username}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Alamat Email</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{currentUser.email || "Belum diisi"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Nomor Telepon / WhatsApp</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{currentUser.phone || "0812-3456-7890"}</span>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Alamat Tempat Tinggal</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>{currentUser.address || "Jl. Madrasah No. 10, Jakarta"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Teacher Employment */}
      {activeSubTab === "employment" && role === "guru" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Informasi Kepegawaian Guru</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Status formasi, nomor registrasi GTK, dan penugasan mata pelajaran madrasah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">NIP (Nomor Induk Pegawai)</span>
              <div className="text-sm font-bold font-mono text-slate-900 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                {currentUser.nipOrNis || "198203152008012015"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Status Kepegawaian</span>
              <div className="text-sm font-semibold text-emerald-800 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span>PNS / Guru Tetap Yayasan</span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold">AKTIF</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tahun Ajaran Aktif</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {schoolProfile.academicYear} (Semester {schoolProfile.semester})
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Mata Pelajaran Diampu</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                Matematika / PAI & Bahasa Arab (Fase D)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Teacher Duties */}
      {activeSubTab === "duties" && role === "guru" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Tugas Tambahan & Penugasan Khusus</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Penugasan resmi dari Kepala Madrasah berdasarkan Surat Keputusan (SK).
            </p>
          </div>

          {myDuties.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tidak ada tugas tambahan aktif saat ini</p>
              <p className="text-xs text-slate-400 mt-1">
                Tugas tambahan seperti Wali Kelas, Guru Piket, atau Pembina Ekskul akan muncul di sini jika ditugaskan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDuties.map((duty) => (
                <div
                  key={duty.id}
                  className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      {duty.type === "wali_kelas"
                        ? `Wali Kelas ${classes.find((c) => c.id === duty.classId)?.name || ""}`
                        : duty.type === "guru_piket"
                        ? "Guru Piket Madrasah"
                        : "Pembina Ekstrakurikuler"}
                    </h4>
                    <p className="text-xs text-emerald-800/80 mt-0.5 font-medium">
                      SK: {duty.decreeNumber || "SK-DIR/2026/01"}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      Status: Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Student Class & Academic */}
      {activeSubTab === "class" && role === "siswa" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Informasi Kelas & Akademik Siswa</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rombongan belajar, wali kelas pembina, dan tahun masuk madrasah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Kelas Terdaftar</span>
              <div className="text-sm font-bold text-emerald-800 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span>Kelas {myClass?.name || "VII-A"}</span>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold">Fase D MTs</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Wali Kelas</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {myWaliKelas?.name || "Siti Nurhaliza, M.Pd."}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tahun Masuk / Angkatan</span>
              <div className="text-sm font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                2024 / 2025
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Status Keaktifan</span>
              <div className="text-sm font-semibold text-emerald-800 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Siswa Aktif Terdaftar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Parent Children */}
      {activeSubTab === "children" && role === "orangtua" && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Data Anak Terhubung</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar peserta didik yang berada di bawah perwalian Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myChildren.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Ahmad Fauzan</h4>
                    <p className="text-xs text-emerald-800/80">NIS: 242507001 • Kelas VII-A</p>
                    <span className="text-[10px] font-bold text-emerald-700">Hubungan: Anak Kandung</span>
                  </div>
                </div>
              </div>
            ) : (
              myChildren.map((child) => (
                <div
                  key={child.id}
                  className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">{child.name}</h4>
                      <p className="text-xs text-emerald-800/80">
                        NIS: {child.nipOrNis || child.nis || "242507001"} • Kelas {classes.find((c) => c.id === child.classId)?.name || "VII-A"}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold">
                    Aktif
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Security & Ubah Password (OPSIONAL UNTUK SEMUA ROLE) */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          {/* Keamanan Akun Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Keamanan Akun & Kata Sandi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola kata sandi akun Anda secara berkala untuk menjaga keamanan data madrasah.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Status Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Password Akun
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Tersimpan Aman (Hash bcrypt)
                  </span>
                </div>
                <div className="text-lg font-mono tracking-widest text-slate-800 font-bold">
                  ••••••••••••
                </div>
                <p className="text-xs text-slate-400">
                  Password terakhir diperbarui:{" "}
                  <span className="font-semibold text-slate-600">
                    {currentUser.mustChangePassword === false ? "Telah diperbarui oleh pengguna" : "Belum pernah diubah (menggunakan password awal 'smtslogin')"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isChangingPassword
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-emerald-700 hover:bg-emerald-800 text-white"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>{isChangingPassword ? "Tutup Form" : "Ubah Password"}</span>
              </button>
            </div>

            {/* Friendly Info Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 leading-relaxed">
                <p className="font-bold">Ubah Kata Sandi Bersifat Opsional</p>
                <p className="text-emerald-800 mt-0.5">
                  Anda dapat menggunakan sistem smart MTs secara langsung tanpa paksaan ganti password. Jika ingin mengubah kata sandi, silakan klik tombol <strong>"Ubah Password"</strong> di atas.
                </p>
              </div>
            </div>
          </div>

          {/* Ubah Password Form (Visible when toggled) */}
          {isChangingPassword && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-md space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Formulir Perubahan Kata Sandi</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan password saat ini untuk verifikasi, lalu tentukan password baru minimal 8 karakter.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{successMsg}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                {/* Password Saat Ini */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan password saat ini (default: smtslogin)"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan kombinasi huruf, angka, atau simbol untuk keamanan lebih tinggi.
                  </p>
                </div>

                {/* Konfirmasi Password Baru */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Konfirmasi Password Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
