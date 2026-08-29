import React from "react";
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
} from "lucide-react";

export const StudentDashboardView: React.FC = () => {
  const {
    currentUser,
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
  } = useApp();

  const studentClass = classes.find((c) => c.id === currentUser?.classId);

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

  // Active Exams
  const myClassExams = exams.filter((e) => e.classId === currentUser?.classId && e.isActive);

  // Grades summary
  const myGrades = studentGrades.filter((g) => g.studentId === currentUser?.id);
  const averageGrade =
    myGrades.length > 0
      ? Math.round(myGrades.reduce((sum, g) => sum + g.finalCalculatedGrade, 0) / myGrades.length)
      : 86;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/50">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              {studentClass ? `Kelas ${studentClass.name}` : "Madrasah Tsanawiyah"}
            </span>
            <span className="text-xs text-emerald-200/80 font-medium">
              NIS: {currentUser?.nipOrNis || currentUser?.nis || "202407001"} • T.A. {schoolProfile.academicYear}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ahlan wa Sahlan, {currentUser?.name}!
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Semoga harimu penuh berkah dan semangat menuntut ilmu. Cek jadwal pelajaran hari ini, tugas yang perlu dikumpulkan, dan ujian CBT madrasah.
          </p>
        </div>

        {/* Quick QR Card Shortcut */}
        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <button
            onClick={() => setActiveTab("attendance")}
            className="flex items-center gap-2.5 px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] text-emerald-700 font-bold uppercase">Kartu Digital</span>
              <span className="block text-xs font-black">Buka QR Code Presensi</span>
            </div>
          </button>
        </div>
      </div>

      {/* Top 4 Student Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Presensi Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Presensi Hari Ini</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              todayRecord?.status === "hadir"
                ? "bg-emerald-100 text-emerald-800"
                : todayRecord?.status === "terlambat"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-500"
            }`}>
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
            <h4 className="text-xl font-black text-slate-900">
              {attendanceRate}%
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalAttended} Hadir • {lateCount} Terlambat
            </p>
          </div>
        </div>

        {/* Tugas Menunggu */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tugas Terjadwal</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-black text-slate-900">
              {myClassAssignments.length} Tugas
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mySubmissions.length} Selesai dikerjakan
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
              Semester {schoolProfile.semester} (Predikat A/B)
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Today's Schedule + Active CBT & Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule & KBM (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-black text-slate-900">
                Jadwal KBM Hari Ini ({currentDayName})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("schedules")}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat Mingguan</span>
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
                return (
                  <div
                    key={sch.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {subj?.code || "MAPEL"}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{subj?.name || "Mata Pelajaran"}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {sch.startTime} - {sch.endTime} WIB • {sch.room || "Ruang Kelas"}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      Aktif
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: CBT Exams & Assignments (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active CBT Online Exam Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
                    className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">{exam.title}</h4>
                      <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        Token: <strong>{exam.token || "SMTS-2024"}</strong> • Durasi: {exam.durationMinutes} Menit
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("exams")}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Mulai
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Homework / Assignments Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
                Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {myClassAssignments.slice(0, 3).map((asg) => {
                const sub = mySubmissions.find((s) => s.assignmentId === asg.id);
                return (
                  <div
                    key={asg.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
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
    </div>
  );
};
