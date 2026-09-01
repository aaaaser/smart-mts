import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  FileText,
  QrCode,
  ArrowRight,
  Sparkles,
  Phone,
  ShieldCheck,
  ChevronDown,
  Info,
  Download,
  Printer,
  ExternalLink,
} from "lucide-react";
import { PrintAttendanceCardModal } from "../attendance/PrintAttendanceCardModal";

export const ParentDashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    classes,
    subjects,
    schedules,
    assignments,
    assignmentSubmissions,
    exams,
    examAttempts,
    studentGrades,
    attendanceRecords,
    schoolProfile,
    setActiveTab,
    showToast,
  } = useApp();

  // Find all children associated with this parent
  const allStudents = users.filter((u) => u.role === "siswa");
  
  // Find linked children via childrenStudentIds or childStudentId, or parentName/phone match
  const linkedChildren = allStudents.filter((std) => {
    if (currentUser?.childrenStudentIds && currentUser.childrenStudentIds.includes(std.id)) {
      return true;
    }
    if (currentUser?.childStudentId && currentUser.childStudentId === std.id) {
      return true;
    }
    if (currentUser?.phone && std.parentPhone === currentUser.phone) {
      return true;
    }
    if (currentUser?.name && std.parentName?.toLowerCase().includes(currentUser.name.toLowerCase().split(" ")[0])) {
      return true;
    }
    return false;
  });

  // Fallback: If no children are linked directly yet, link first 2 students for demo/realistic simulation
  const childrenList = linkedChildren.length > 0 ? linkedChildren : [allStudents[0], allStudents[5]].filter(Boolean);

  // Active selected child state (Default to the first child)
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenList[0]?.id || allStudents[0]?.id || ""
  );

  const [isPrintCardOpen, setIsPrintCardOpen] = useState(false);

  // Selected Child object
  const activeChild = allStudents.find((s) => s.id === selectedChildId) || childrenList[0] || allStudents[0];

  // Child Class & Homeroom Teacher (Wali Kelas)
  const childClass = classes.find((c) => c.id === activeChild?.classId);
  const homeroomTeacher = users.find(
    (u) => u.id === childClass?.homeroomTeacherId && u.role === "guru"
  );

  // Attendance Records for Active Child
  const childAttendanceRecords = attendanceRecords.filter(
    (r) => r.userId === activeChild?.id
  );
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = childAttendanceRecords.find((r) => r.date === todayStr);

  const totalDays = Math.max(1, childAttendanceRecords.length);
  const attendedCount = childAttendanceRecords.filter(
    (r) => r.status === "hadir" || r.status === "terlambat"
  ).length;
  const lateCount = childAttendanceRecords.filter((r) => r.status === "terlambat").length;
  const permitCount = childAttendanceRecords.filter(
    (r) => r.status === "izin" || r.status === "sakit"
  ).length;
  const attendanceRate = Math.round((attendedCount / totalDays) * 100) || 98;

  // Schedules for Active Child
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
  const currentDayName = dayNames[new Date().getDay()];
  const childTodaySchedules = schedules.filter(
    (s) => s.classId === activeChild?.classId && (s.day === currentDayName || s.day === "Senin")
  );

  // Assignments & Submissions for Active Child
  const childClassAssignments = assignments.filter((a) => a.classId === activeChild?.classId);
  const childSubmissions = assignmentSubmissions.filter((s) => s.studentId === activeChild?.id);
  const pendingAssignments = childClassAssignments.filter(
    (a) => !childSubmissions.some((s) => s.assignmentId === a.id)
  );

  // Exams for Active Child
  const childExams = exams.filter((e) => e.classId === activeChild?.classId);
  const childExamAttempts = examAttempts.filter((a) => a.studentId === activeChild?.id);

  // Grades for Active Child
  const childGrades = studentGrades.filter((g) => g.studentId === activeChild?.id);
  const averageGrade =
    childGrades.length > 0
      ? Math.round(childGrades.reduce((sum, g) => sum + g.finalCalculatedGrade, 0) / childGrades.length)
      : 88;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* TOP BAR: CHILD SELECTOR (MULTI-ANAK ORANG TUA/WALI)      */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Panel Wali Murid & Orang Tua
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Monitoring Perkembangan Siswa
            </h1>
          </div>
        </div>

        {/* Child Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Pilih Siswa / Anak:
          </label>
          <div className="relative min-w-[240px]">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full appearance-none bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300/80 rounded-2xl px-4 py-2.5 pr-10 text-xs font-black text-emerald-950 shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none cursor-pointer transition-colors"
            >
              {childrenList.map((child) => {
                const cClass = classes.find((c) => c.id === child.classId);
                return (
                  <option key={child.id} value={child.id}>
                    {child.name} — Kelas {cClass?.name || "Madrasah"}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHILD PROFILE & WELCOME BANNER                           */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-emerald-700/50">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <img
            src={
              activeChild?.avatar ||
              "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
            }
            alt={activeChild?.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-300/50 shadow-md shrink-0 bg-emerald-800"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                Kelas {childClass?.name || "VII-A"}
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                NIS/NISN: {activeChild?.nipOrNis || activeChild?.nis || "2026001"} • {activeChild?.nisn || "0081293841"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeChild?.name || "Nama Siswa"}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/90 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Wali Kelas: <strong>{homeroomTeacher?.name || "Siti Nurhaliza, M.Pd."}</strong>
              </span>
              <span>•</span>
              <span>T.A. {schoolProfile.academicYear} (Semester {schoolProfile.semester})</span>
            </div>
          </div>
        </div>

        {/* Quick QR Card Button */}
        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => setIsPrintCardOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            <div className="text-left">
              <span className="block text-[9px] text-emerald-700 font-bold uppercase">ID Presensi</span>
              <span className="block text-xs font-black">Cetak Kartu QR Anak</span>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 TOP STATUS CARDS (KEHADIRAN, TUGAS, NILAI, AKTIVITAS)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Presensi Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Presensi Hari Ini</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                todayAttendance?.status === "hadir"
                  ? "bg-emerald-100 text-emerald-800"
                  : todayAttendance?.status === "terlambat"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-slate-900 uppercase">
              {todayAttendance ? todayAttendance.status : "Belum Presensi"}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {todayAttendance
                ? `Pukul ${todayAttendance.time} WIB (Scan QR)`
                : "Menunggu pemindaian gerbang"}
            </p>
          </div>
        </div>

        {/* Tingkat Kehadiran Bulanan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tingkat Kehadiran</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-black text-slate-900">{attendanceRate}%</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {attendedCount} Hadir • {lateCount} Terlambat • {permitCount} Izin
            </p>
          </div>
        </div>

        {/* Tugas Anak */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tugas Mandiri</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-black text-slate-900">
              {pendingAssignments.length === 0 ? "Lengkap" : `${pendingAssignments.length} Belum Selesai`}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {childSubmissions.length} dari {childClassAssignments.length} tugas terkumpul
            </p>
          </div>
        </div>

        {/* Rata-Rata Rapor */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Rata-Rata Rapor</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-black text-slate-900">
              {averageGrade} <span className="text-xs text-emerald-700 font-bold font-mono">/ 100</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Predikat {averageGrade >= 85 ? "A (Sangat Baik)" : "B (Baik)"}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MIDDLE ROW: JADWAL PELAJARAN HARI INI & AKADEMIK ANAK    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Jadwal Hari Ini (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Jadwal KBM Anak Hari Ini ({currentDayName})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Kelas {childClass?.name}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {childTodaySchedules.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Tidak ada jadwal mata pelajaran untuk hari ini.
                </div>
              ) : (
                childTodaySchedules.map((sch) => {
                  const subj = subjects.find((s) => s.id === sch.subjectId);
                  const teacher = users.find((u) => u.id === sch.teacherId);
                  return (
                    <div
                      key={sch.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shrink-0">
                          {subj?.code || "MAPEL"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{subj?.name || "Mata Pelajaran"}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sch.startTime} - {sch.endTime} WIB • Guru: {teacher?.name?.split(",")[0] || "Guru Mapel"}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        {sch.room || "Ruang Kelas"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kontak Madrasah: {schoolProfile.phone}</span>
            <span className="font-semibold text-emerald-800">{schoolProfile.operatingHours}</span>
          </div>
        </div>

        {/* Right Column: Catatan Wali Kelas & Tugas Anak (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Catatan dari Wali Kelas */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Catatan & Informasi Wali Kelas
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Update Terbaru
              </span>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-emerald-950">
                  {homeroomTeacher?.name || "Wali Kelas VIII-A"}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">28 Agustus 2025</span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                "Ananda {activeChild?.name?.split(" ")[0]} menunjukkan keaktifan yang sangat baik dalam kegiatan belajar mengajar dan pembiasaan sholat dhuha. Mohon bimbingan di rumah untuk persiapan Asesmen Formatif Matematika minggu depan."
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">Ada pertanyaan untuk wali kelas?</span>
              <a
                href={`tel:${homeroomTeacher?.phone || schoolProfile.phone}`}
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
              >
                <Phone className="w-3 h-3" />
                <span>Hubungi Wali Kelas</span>
              </a>
            </div>
          </div>

          {/* Tugas & Penugasan Anak */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Tugas & Lembar Kerja Anak
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("assignments")}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Lihat Semua ({childClassAssignments.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {childClassAssignments.slice(0, 3).map((asg) => {
                const sub = childSubmissions.find((s) => s.assignmentId === asg.id);
                return (
                  <div
                    key={asg.id}
                    className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{asg.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Tenggat: {asg.dueDate} • Skor Max: {asg.maxScore}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${
                        sub
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sub ? (sub.score ? `Nilai: ${sub.score}` : "Terkumpul") : "Belum Kumpul"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* QUICK SHORTCUTS UNTUK ORANG TUA / WALI                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("attendance")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Rekap Kehadiran</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Log presensi & izin anak</p>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Tugas & PR</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Status pekerjaan rumah</p>
        </button>

        <button
          onClick={() => setActiveTab("assessment")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Nilai & Capaian</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Hasil ulangan & kuis</p>
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
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Unduh & cetak e-rapor</p>
        </button>
      </div>

      {/* Print QR Attendance Card Modal for Child */}
      {isPrintCardOpen && activeChild && (
        <PrintAttendanceCardModal
          isOpen={isPrintCardOpen}
          onClose={() => setIsPrintCardOpen(false)}
          targetUser={activeChild}
        />
      )}
    </div>
  );
};
