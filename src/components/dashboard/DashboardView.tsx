import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Users,
  GraduationCap,
  BookOpen,
  QrCode,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  FileQuestion,
  FileText,
  Award,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookMarked,
  Printer,
  Bell,
  UserCheck,
  KeyRound,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    schoolProfile,
    users,
    classes,
    subjects,
    exams,
    examAttempts,
    assignments,
    attendanceRecords,
    studentGrades,
    schedules,
    setActiveTab,
    showToast,
  } = useApp();

  const [activeChartFilter, setActiveChartFilter] = useState<"siswa" | "guru">("siswa");
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [pendingResetCount, setPendingResetCount] = useState<number>(0);
  const [loadingReset, setLoadingReset] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const role = currentUser?.role || "admin";

  useEffect(() => {
    if (role === "admin") {
      fetchResetRequests();
    }
  }, [role]);

  const fetchResetRequests = async () => {
    try {
      setLoadingReset(true);
      const res = await fetch("/api/auth/reset-requests?status=PENDING&onlyUndismissed=true&limit=3");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setResetRequests(data.data);
        if (typeof data.pendingCount === "number") {
          setPendingResetCount(data.pendingCount);
        }
      }
    } catch (e) {
      console.error("Failed to load reset requests", e);
    } finally {
      setLoadingReset(false);
    }
  };

  const handleDismissNotification = async (reqId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissingId(reqId);
    try {
      const res = await fetch(`/api/auth/dismiss-reset-request/${reqId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showToast("info", "Notifikasi Disembunyikan", "Notifikasi disembunyikan dari dashboard. Data tetap tersimpan di database.");
        // Remove from dashboard state only
        setResetRequests((prev) => prev.filter((r) => r.id !== reqId));
      } else {
        showToast("error", "Gagal", data.message || "Gagal menyembunyikan notifikasi.");
      }
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Gagal menyembunyikan notifikasi.");
    } finally {
      setDismissingId(null);
    }
  };

  const handleProcessReset = async (reqItem: any) => {
    if (!window.confirm(`Konfirmasi reset password untuk ${reqItem.userName} (${reqItem.userRoleLabel})?\n\nPassword akan direset menjadi: smtslogin`)) {
      return;
    }

    setProcessingRequestId(reqItem.id);
    try {
      const res = await fetch("/api/auth/process-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: reqItem.id,
          userId: reqItem.userId,
          newPassword: "smtslogin",
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        showToast("success", "Reset Berhasil", `Kata sandi akun ${reqItem.userName} telah direset ke 'smtslogin'.`);
        fetchResetRequests();
      } else {
        showToast("error", "Gagal", data.message || "Gagal memproses reset.");
      }
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Gagal memproses reset.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Data aggregations
  const totalTeachers = users.filter((u) => u.role === "guru").length;
  const totalStudents = users.filter((u) => u.role === "siswa").length;
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendanceRecords.filter((r) => r.date === todayStr);
  const todayPresent = todayAttendance.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const attendanceRate = totalStudents > 0 ? Math.min(100, Math.round((todayPresent / (totalStudents + totalTeachers)) * 100) || 96) : 96;

  // Student specific data
  const studentAttempts = examAttempts.filter((a) => a.studentId === currentUser?.id);
  const studentGradeList = studentGrades.filter((g) => g.studentId === currentUser?.id);
  const studentAvgScore =
    studentGradeList.length > 0
      ? Math.round(studentGradeList.reduce((acc, curr) => acc + curr.finalCalculatedGrade, 0) / studentGradeList.length)
      : 88;

  const studentClass = classes.find((c) => c.id === currentUser?.classId);
  const studentTodayAttendance = todayAttendance.find((r) => r.userId === currentUser?.id);
  const studentAssignments = assignments.filter((a) => a.classId === currentUser?.classId);

  // Parent specific data
  const child = users.find((u) => u.id === (currentUser?.childStudentId || "std_01"));
  const childClass = classes.find((c) => c.id === child?.classId);
  const childAttendance = todayAttendance.find((r) => r.userId === child?.id);
  const childGrades = studentGrades.filter((g) => g.studentId === child?.id);
  const childAvg =
    childGrades.length > 0
      ? Math.round(childGrades.reduce((a, b) => a + b.finalCalculatedGrade, 0) / childGrades.length)
      : 90;

  // Weekly attendance bar chart data
  const weeklyAttendanceSiswa = [
    { day: "SEN", percent: 92 },
    { day: "SEL", percent: 96 },
    { day: "RAB", percent: 89 },
    { day: "KAM", percent: 94 },
    { day: "JUM", percent: 98 },
    { day: "SAB", percent: 85 },
  ];

  const weeklyAttendanceGuru = [
    { day: "SEN", percent: 96 },
    { day: "SEL", percent: 100 },
    { day: "RAB", percent: 95 },
    { day: "KAM", percent: 98 },
    { day: "JUM", percent: 96 },
    { day: "SAB", percent: 90 },
  ];

  const currentWeeklyData = activeChartFilter === "siswa" ? weeklyAttendanceSiswa : weeklyAttendanceGuru;

  // Day Name Helper
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentDayName = dayNames[new Date().getDay()];

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Islamic Green Gradient */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/50">
        {/* Subtle geometric dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              {schoolProfile.name}
            </span>
            <span className="text-xs text-emerald-200/80 font-medium">
              TP {schoolProfile.academicYear} • Semester {schoolProfile.semester}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Selamat Datang, {currentUser?.name}!
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {role === "siswa"
              ? `Kelas ${studentClass?.name || "VII-A"}. Pastikan melakukan scan QR kartu pelajar saat masuk ke ruang kelas.`
              : role === "guru"
              ? `Selamat bertugas mengajar dan membimbing peserta didik. Gunakan menu Presensi QR untuk memulai sesi kelas.`
              : role === "orangtua"
              ? `Pantau perkembangan belajar, rekap absensi harian, dan capaian rapor ananda (${child?.name}) secara langsung.`
              : "Kelola administrasi kurikulum madrasah, presensi QR, bank soal AI, dan rapor digital dalam satu platform."}
          </p>
        </div>

        {/* Quick QR Badge / Identity Action */}
        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <button
            onClick={() => setActiveTab("attendance")}
            className="flex items-center gap-2 px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>
              {role === "siswa" ? "Buka Kartu QR Saya" : role === "guru" ? "Scan Presensi Kelas" : "Terminal Presensi"}
            </span>
          </button>
        </div>
      </div>

      {/* Admin Password Reset Requests Notification Card */}
      {role === "admin" && (resetRequests.length > 0 || pendingResetCount > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                    Permintaan Reset Kata Sandi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-950 border border-amber-300">
                    {pendingResetCount} Menunggu
                  </span>
                </div>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Pengguna berikut mengajukan pemulihan kata sandi akun madrasah (Maksimal 3 akun terbaru ditampilkan).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchResetRequests}
                className="p-2 text-amber-800 hover:bg-amber-200/60 rounded-xl transition-colors cursor-pointer"
                title="Segarkan data"
              >
                <RotateCcw className={`w-4 h-4 ${loadingReset ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setActiveTab("reset-password")}
                className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>Lihat Semua ({pendingResetCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {resetRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {resetRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 flex flex-col justify-between gap-3 shadow-xs hover:border-amber-300 transition-all relative group"
                >
                  {/* Dismiss Button [x] - Only hides from dashboard, doesn't delete or complete request */}
                  <button
                    type="button"
                    disabled={dismissingId === req.id}
                    onClick={(e) => handleDismissNotification(req.id, e)}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Sembunyikan dari dashboard (data tetap tersimpan di database)"
                  >
                    {dismissingId === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-start gap-3 pr-6">
                    <img
                      src={req.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                      alt={req.userName}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 mt-0.5"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {req.userName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                          {req.userRoleLabel || req.userRole}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          {req.identifier}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(req.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })} WIB
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      Default: <strong className="text-slate-700">smtslogin</strong>
                    </span>

                    <button
                      type="button"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleProcessReset(req)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {processingRequestId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-100/60 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
              <span>Notifikasi dashboard telah disembunyikan. Terdapat <strong>{pendingResetCount}</strong> permohonan yang masih menunggu di pusat data.</span>
              <button
                onClick={() => setActiveTab("reset-password")}
                className="font-bold underline hover:text-amber-950 cursor-pointer ml-2"
              >
                Buka Manajemen Reset
              </button>
            </div>
          )}

          <div className="sm:hidden pt-1">
            <button
              onClick={() => setActiveTab("reset-password")}
              className="w-full py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1"
            >
              <span>Lihat Semua Permintaan ({pendingResetCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SISWA SPECIFIC TOP OVERVIEW                             */}
      {/* ======================================================== */}
      {role === "siswa" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Presensi Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Presensi Hari Ini ({currentDayName})
              </span>
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                {studentTodayAttendance ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-700 capitalize">
                      {studentTodayAttendance.status} ({studentTodayAttendance.time} WIB)
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-amber-700">Belum Scan Hari Ini</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {studentTodayAttendance ? "Verifikasi QR Code berhasil" : "Tunjukkan kartu ke scanner guru"}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("attendance")}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-colors cursor-pointer"
              title="Lihat Kartu QR"
            >
              <QrCode className="w-6 h-6" />
            </button>
          </div>

          {/* Card 2: Rata-Rata Nilai */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rata-rata Nilai Akademik
              </span>
              <div className="text-2xl font-black text-emerald-700 flex items-center gap-1.5">
                <span>{studentAvgScore}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tuntas KKM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {studentGradeList.length} Mata Pelajaran Dinilai
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Tugas & Ujian */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tugas & Ujian CBT
              </span>
              <div className="text-lg font-black text-slate-900">
                {exams.length} Ujian • {studentAssignments.length} Tugas
              </div>
              <p className="text-[11px] text-slate-400">
                Siap dikerjakan secara online
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4-METRIC STATS GRID (FOR ADMIN & GURU)                   */}
      {/* ======================================================== */}
      {role !== "siswa" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Metric 1 */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {role === "orangtua" ? "Rata-Rata Nilai Ananda" : "Total Peserta Didik"}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {role === "orangtua" ? childAvg : totalStudents.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                {role === "orangtua" ? "Predikat A" : "+Aktif"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              {role === "orangtua" ? `Kelas ${childClass?.name || "VII-A"}` : `${totalClasses} Rombongan Belajar`}
            </span>
          </div>

          {/* Metric 2 */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {role === "orangtua" ? "Tugas Ananda" : "Guru & GTK"}
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {role === "orangtua" ? `${assignments.length} Tugas` : totalTeachers}
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                {role === "orangtua" ? "Tepat Waktu" : "Aktif"}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              {role === "orangtua" ? "Semua tugas tuntas" : `${totalSubjects} Mata Pelajaran Terjadwal`}
            </span>
          </div>

          {/* Metric 3 */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kehadiran Hari Ini
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {role === "orangtua" ? (childAttendance ? "Hadir" : "Belum") : `${attendanceRate}%`}
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Scan QR
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              {role === "orangtua"
                ? childAttendance ? `Pukul ${childAttendance.time} WIB` : "Menunggu presensi"
                : `${todayPresent} presensi terverifikasi`}
            </span>
          </div>

          {/* Metric 4 */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ujian CBT & Formatif
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {exams.length}
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              PTS, PAS, & Ujian Harian
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MIDDLE ROW: ATTENDANCE CHART & QUICK SCAN TERMINAL       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200/80 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Grafik Presensi QR Mingguan
              </h3>
              <p className="text-[11px] text-slate-400">
                Tingkat kehadiran terverifikasi via QR Code Personal
              </p>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveChartFilter("siswa")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeChartFilter === "siswa"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                SISWA
              </button>
              <button
                onClick={() => setActiveChartFilter("guru")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeChartFilter === "guru"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                GURU
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-end justify-between gap-3 sm:gap-6 min-h-[220px]">
            {currentWeeklyData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-full">
                <span className="text-[10px] font-bold text-emerald-700 mb-1">
                  {item.percent}%
                </span>
                <div className="w-full bg-slate-100 rounded-t-xl relative h-36 overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-xl transition-all duration-500 hover:opacity-90"
                    style={{ height: `${item.percent}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 mt-1">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick QR Card Shortcut (1 Col) */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 flex flex-col p-5 justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {role === "siswa" ? "ID & QR Code Siswa" : "Terminal Presensi QR"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {role === "siswa" ? "Kartu Pelajar Digital" : "Pemindai Presensi Cepat"}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                AKTIF
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 bg-white p-2 rounded-2xl shadow-xs border border-emerald-300 flex items-center justify-center">
                <QrCode className="w-14 h-14 text-emerald-800" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-950 uppercase">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  {currentUser?.role.toUpperCase()} • {currentUser?.nipOrNis || "TOKEN SECURE"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("attendance")}
            className="mt-4 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Buka Halaman Presensi Lengkap</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* AI ASSISTANT BANNER                                     */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl p-5 sm:p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-emerald-800">
        <div className="flex flex-col gap-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <h4 className="font-bold text-sm sm:text-base leading-tight">
              AI Asisten Guru & Madrasah (Gemini 2.5)
            </h4>
          </div>
          <p className="text-emerald-200 text-xs leading-relaxed">
            Buat soal ujian HOTS otomatis berdasarkan Capaian Pembelajaran (CP), susun materi ajar, dan rancang deskripsi capaian E-Rapor secara cerdas.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab("questions")}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all text-white cursor-pointer"
          >
            Bank Soal AI
          </button>
          <button
            onClick={() => setActiveTab("rapor")}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
          >
            E-Rapor Digital
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QUICK SHORTCUTS                                         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("attendance")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Presensi QR</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Scanner & kartu ID</p>
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileQuestion className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Bank Soal CP/KD</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Generate soal HOTS</p>
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Ujian CBT</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Ujian online & token</p>
        </button>

        <button
          onClick={() => setActiveTab("rapor")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>E-Rapor Digital</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cetak rapor resmi</p>
        </button>
      </div>

      {/* ======================================================== */}
      {/* EXAMS & ASSIGNMENTS LIST                                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exams Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ujian Online Terjadwal
              </h3>
              <p className="text-[11px] text-slate-400">Instrumen sumatif & formatif</p>
            </div>
            <button
              onClick={() => setActiveTab("exams")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {exams.slice(0, 3).map((exam) => (
              <div key={exam.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{exam.title}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {exam.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>{exam.date}</span>
                    <span>•</span>
                    <span>{exam.durationMinutes} Menit</span>
                    <span>•</span>
                    <span className="text-slate-600">KKM: {exam.passingScore}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("exams")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {role === "siswa" ? "Ikuti Ujian" : "Kelola"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tugas & Penugasan
              </h3>
              <p className="text-[11px] text-slate-400">Lembar kerja aktif</p>
            </div>
            <button
              onClick={() => setActiveTab("assignments")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {assignments.slice(0, 3).map((asg) => (
              <div key={asg.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">{asg.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="text-slate-600">
                      Deadline: {new Date(asg.deadline).toLocaleDateString("id-ID")}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">Max {asg.maxScore} Poin</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("assignments")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  {role === "siswa" ? "Kumpulkan" : "Periksa"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
