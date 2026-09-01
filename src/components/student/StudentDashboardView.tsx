import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Award,
  QrCode,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileText,
  UserCheck,
  Phone,
  ShieldCheck,
  Info,
  ExternalLink,
} from "lucide-react";
import { PrintAttendanceCardModal } from "../attendance/PrintAttendanceCardModal";

export const StudentDashboardView: React.FC = () => {
  const {
    currentUser,
    classes,
    subjects,
    users,
    schedules,
    assignments,
    assignmentSubmissions,
    exams,
    examAttempts,
    studentGrades,
    attendanceRecords,
    schoolProfile,
    setActiveTab,
  } = useApp();

  const [isPrintCardOpen, setIsPrintCardOpen] = useState(false);

  const studentClass = classes.find((c) => c.id === currentUser?.classId);
  const homeroomTeacher = users.find(
    (u) => u.id === studentClass?.homeroomTeacherId && u.role === "guru"
  );

  // Student Attendance Statistics
  const myRecords = attendanceRecords.filter((r) => r.userId === currentUser?.id);
  const totalAttended = myRecords.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const lateCount = myRecords.filter((r) => r.status === "terlambat").length;
  const permissionCount = myRecords.filter((r) => r.status === "izin" || r.status === "sakit").length;
  const attendanceRate = myRecords.length > 0 ? Math.round((totalAttended / myRecords.length) * 100) : 100;

  // Today's Attendance
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = myRecords.find((r) => r.date === todayStr);

  // Today's Schedules
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
  const currentDayName = dayNames[new Date().getDay()];
  const todaySchedules = schedules.filter(
    (s) => s.classId === currentUser?.classId && (s.day === currentDayName || s.day === "Senin")
  );

  // Class Assignments & Student Submissions
  const myClassAssignments = assignments.filter((a) => a.classId === currentUser?.classId);
  const mySubmissions = assignmentSubmissions.filter((s) => s.studentId === currentUser?.id);
  const pendingAssignments = myClassAssignments.filter(
    (a) => !mySubmissions.some((s) => s.assignmentId === a.id)
  );

  // Active Exams & Past Exam Attempts
  const myClassExams = exams.filter((e) => e.classId === currentUser?.classId && e.isActive);
  const myExamAttempts = examAttempts.filter((a) => a.studentId === currentUser?.id);

  // Grades summary
  const myGrades = studentGrades.filter((g) => g.studentId === currentUser?.id);
  const averageGrade =
    myGrades.length > 0
      ? Math.round(myGrades.reduce((sum, g) => sum + g.finalCalculatedGrade, 0) / myGrades.length)
      : 86;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* STUDENT WELCOME & IDENTITY BANNER                        */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-emerald-700/50">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <img
            src={
              currentUser?.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
            }
            alt={currentUser?.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-300/50 shadow-md shrink-0 bg-emerald-800"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                {studentClass ? `Kelas ${studentClass.name}` : "Madrasah Tsanawiyah"}
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                NIS: {currentUser?.nipOrNis || currentUser?.nis || "2026001"} • NISN: {currentUser?.nisn || "0081293841"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ahlan wa Sahlan, {currentUser?.name}!
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/90 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Wali Kelas: <strong>{homeroomTeacher?.name || "Ustadz / Ustadzah"}</strong>
              </span>
              <span>•</span>
              <span>T.A. {schoolProfile.academicYear} (Semester {schoolProfile.semester})</span>
            </div>
          </div>
        </div>

        {/* Quick QR Card Shortcut */}
        <div className="relative z-10 flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => setIsPrintCardOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] text-emerald-700 font-bold uppercase">Kartu Pelajar</span>
              <span className="block text-xs font-black">Cetak ID & QR Code</span>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP 4 STUDENT STATS                                      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Presensi Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Presensi Hari Ini</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                todayRecord?.status === "hadir"
                  ? "bg-emerald-100 text-emerald-800"
                  : todayRecord?.status === "terlambat"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-lg font-black text-slate-900 uppercase">
              {todayRecord ? todayRecord.status : "Belum Absen"}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {todayRecord ? `Pukul ${todayRecord.time} WIB` : "Tunjukkan QR pada scanner"}
            </p>
          </div>
        </div>

        {/* Kehadiran Bulanan */}
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
              {totalAttended} Hadir • {lateCount} Terlambat • {permissionCount} Izin
            </p>
          </div>
        </div>

        {/* Tugas Menunggu */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tugas Mandiri</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-black text-slate-900">
              {pendingAssignments.length === 0 ? "Tuntas" : `${pendingAssignments.length} Tugas`}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mySubmissions.length} dari {myClassAssignments.length} tugas selesai dikerjakan
            </p>
          </div>
        </div>

        {/* Rata-Rata Nilai */}
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
      {/* MAIN CONTENT GRID: SCHEDULE + CBT & ASSIGNMENTS          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & KBM (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-black text-slate-900">
                Jadwal Pelajaran Hari Ini ({currentDayName})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("schedules")}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Jadwal Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Tidak ada jadwal pelajaran untuk hari ini.
              </div>
            ) : (
              todaySchedules.map((sch) => {
                const subj = subjects.find((s) => s.id === sch.subjectId);
                const teacher = users.find((u) => u.id === sch.teacherId);
                return (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shrink-0">
                        {subj?.code || "MAPEL"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{subj?.name || "Mata Pelajaran"}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {sch.startTime} - {sch.endTime} WIB • Guru: {teacher?.name?.split(",")[0] || "Guru"}
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

          {/* Catatan dari Wali Kelas */}
          <div className="mt-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Pesan Wali Kelas
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">Aktif</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              "Tetap semangat belajar, jaga ketertiban seragam madrasah, dan jangan lupa mengerjakan tugas tepat waktu sebelum batas deadline."
            </p>
          </div>
        </div>

        {/* Right Column: CBT Exams & Assignments (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active CBT Online Exam Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Ujian CBT Online
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {myClassExams.length} Aktif
              </span>
            </div>

            <div className="space-y-2.5">
              {myClassExams.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Tidak ada ujian CBT yang sedang aktif saat ini.
                </p>
              ) : (
                myClassExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">{exam.title}</h4>
                      <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        Token: <strong>{exam.token || "SMTS-2024"}</strong> • {exam.durationMinutes} Menit
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("exams")}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Mulai
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Homework / Assignments Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Tugas & Lembar Kerja
                </h3>
              </div>
              <button
                onClick={() => setActiveTab("assignments")}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {myClassAssignments.slice(0, 3).map((asg) => {
                const sub = mySubmissions.find((s) => s.assignmentId === asg.id);
                return (
                  <div
                    key={asg.id}
                    className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{asg.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Tenggat: {asg.dueDate}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${
                        sub
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sub ? "Selesai" : "Belum"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts for Student */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("attendance")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Presensi QR Saya</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Tampilkan kode QR</p>
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Tugas Online</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Unggah lembar jawaban</p>
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
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Kerjakan ujian terjadwal</p>
        </button>

        <button
          onClick={() => setActiveTab("rapor")}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
            <span>Rapor Digital</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Lihat nilai semester</p>
        </button>
      </div>

      {/* Print Modal for Student */}
      {isPrintCardOpen && currentUser && (
        <PrintAttendanceCardModal
          isOpen={isPrintCardOpen}
          onClose={() => setIsPrintCardOpen(false)}
          targetUser={currentUser}
        />
      )}
    </div>
  );
};
