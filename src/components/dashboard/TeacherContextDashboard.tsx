import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { TeacherDuty, TeacherContextMode, StudentSubjectGrade, AttendanceRecord } from "../../types";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  Send,
  MessageSquare,
  Activity,
  Compass,
  FileCheck,
  Star,
  Check,
  Filter,
  ArrowRight,
} from "lucide-react";

interface TeacherContextDashboardProps {
  onOpenAIAssistant: () => void;
}

export const TeacherContextDashboard: React.FC<TeacherContextDashboardProps> = ({ onOpenAIAssistant }) => {
  const {
    currentUser,
    schoolProfile,
    users,
    classes,
    subjects,
    schedules,
    exams,
    assignments,
    assignmentSubmissions,
    attendanceRecords,
    studentGrades,
    teacherDuties,
    extracurriculars,
    activeTeacherContext,
    setActiveTeacherContext,
    setActiveTab,
    showToast,
  } = useApp();

  const [piketJournalNotes, setPiketJournalNotes] = useState("");
  const [piketIncidentType, setPiketIncidentType] = useState<"aman" | "kejadian" | "tamu">("aman");
  const [piketLoggedEntries, setPiketLoggedEntries] = useState<Array<{ id: string; time: string; type: string; note: string; author: string }>>([
    {
      id: "entry_1",
      time: "07.00 WIB",
      type: "Pemeriksaan Gerbang",
      note: "Pintu gerbang dibuka tepat waktu, pembiasaan 5S (Senyum, Salam, Sapa, Sopan, Santun) berjalan tertib.",
      author: currentUser?.name || "Guru Piket",
    },
    {
      id: "entry_2",
      time: "08.15 WIB",
      type: "Tamu Kedinasan",
      note: "Kunjungan Pengawas Madrasah Kemenag Kab/Kota untuk monitoring Asesmen Madrasah.",
      author: currentUser?.name || "Guru Piket",
    },
  ]);

  const [classConsultNotes, setClassConsultNotes] = useState("");
  const [classNotices, setClassNotices] = useState<Array<{ id: string; date: string; title: string; content: string }>>([
    {
      id: "nt_1",
      date: "28 Agt 2025",
      title: "Persiapan PTS Semester Ganjil",
      content: "Mohon seluruh siswa Kelas VIII-A melengkapi portofolio tugas Matematika dan IPA sebelum tanggal 10 September.",
    },
    {
      id: "nt_2",
      date: "25 Agt 2025",
      title: "Kebersihan Rombel & Pojok Baca",
      content: "Jadwal piket kelas 5 menit sebelum bel masuk telah diperbarui. Pojok Baca wajib dirapikan setiap istirahat kedua.",
    },
  ]);

  const [ekskulActivityNotes, setEkskulActivityNotes] = useState("");
  const [ekskulAgendaList, setEkskulAgendaList] = useState<Array<{ id: string; date: string; topic: string; attendanceRate: number }>>([
    { id: "ek_1", date: "22 Agt 2025", topic: "Pelatihan Dasar Tali Temali & Sandi Morse", attendanceRate: 94 },
    { id: "ek_2", date: "15 Agt 2025", topic: "Simulasi PBB & Baris-Berbaris Tongkat", attendanceRate: 98 },
    { id: "ek_3", date: "08 Agt 2025", topic: "Orientasi Anggota Baru Penggalang Ramu", attendanceRate: 100 },
  ]);

  const [selectedStudentForNote, setSelectedStudentForNote] = useState<string>("");

  if (!currentUser || currentUser.role !== "guru") {
    return null;
  }

  // Get all active duties for current teacher
  const myDuties = teacherDuties.filter((d) => d.teacherId === currentUser.id && d.isActive);

  // Identify active duty object if selected
  const currentDuty = myDuties.find((d) => d.id === activeTeacherContext);

  // Mode identification
  const currentMode: TeacherContextMode =
    activeTeacherContext === "mapel"
      ? "mapel"
      : currentDuty?.type || "mapel";

  // Data helpers for Wali Kelas
  const myWaliClass = currentDuty?.classId ? classes.find((c) => c.id === currentDuty.classId) : classes[0];
  const classStudents = users.filter((u) => u.role === "siswa" && (myWaliClass ? u.classId === myWaliClass.id : false));
  
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendanceRecords.filter((r) => r.date === todayStr);

  const classStudentsAttendance = classStudents.map((std) => {
    const record = todayAttendance.find((r) => r.userId === std.id);
    const studentGradeRecords = studentGrades.filter((g) => g.studentId === std.id);
    const avgScore =
      studentGradeRecords.length > 0
        ? Math.round(studentGradeRecords.reduce((acc, curr) => acc + curr.finalCalculatedGrade, 0) / studentGradeRecords.length)
        : 85;
    return {
      student: std,
      record,
      avgScore,
    };
  });

  const classPresentCount = classStudentsAttendance.filter(
    (item) => item.record?.status === "hadir" || item.record?.status === "terlambat"
  ).length;

  const classAttendancePercent =
    classStudents.length > 0 ? Math.round((classPresentCount / classStudents.length) * 100) : 100;

  // Data helpers for Guru Piket
  const todayTeachers = users.filter((u) => u.role === "guru");
  const todayTeachersAttendance = todayTeachers.map((t) => {
    const rec = todayAttendance.find((r) => r.userId === t.id && r.userType === "guru");
    return { teacher: t, record: rec };
  });
  const presentTeachersCount = todayTeachersAttendance.filter(
    (t) => t.record?.status === "hadir" || t.record?.status === "terlambat"
  ).length;
  const lateStudentsCount = todayAttendance.filter((r) => r.userType === "siswa" && r.status === "terlambat").length;
  const permitStudentsCount = todayAttendance.filter(
    (r) => r.userType === "siswa" && (r.status === "izin" || r.status === "sakit")
  ).length;

  // Data helpers for Pembina Ekskul
  const myEkskul = currentDuty?.ekskulId
    ? extracurriculars.find((e) => e.id === currentDuty.ekskulId)
    : extracurriculars[0];
  const ekskulMembers = users.filter(
    (u) => u.role === "siswa" && myEkskul?.memberStudentIds.includes(u.id)
  );

  const handleAddPiketJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!piketJournalNotes.trim()) return;

    const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    const newEntry = {
      id: `piket_j_${Date.now()}`,
      time: timeStr,
      type: piketIncidentType === "aman" ? "Catatan Ketertiban" : piketIncidentType === "kejadian" ? "Insiden / Pembinaan" : "Kunjungan Tamu",
      note: piketJournalNotes.trim(),
      author: currentUser.name,
    };

    setPiketLoggedEntries([newEntry, ...piketLoggedEntries]);
    setPiketJournalNotes("");
    showToast("success", "Jurnal Piket Dicatat", "Laporan buku piket harian berhasil disimpan.");
  };

  const handleAddClassNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classConsultNotes.trim()) return;

    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const newNotice = {
      id: `notice_${Date.now()}`,
      date: dateStr,
      title: "Catatan Wali Kelas",
      content: classConsultNotes.trim(),
    };

    setClassNotices([newNotice, ...classNotices]);
    setClassConsultNotes("");
    showToast("success", "Pengumuman Rombel Disimpan", "Catatan wali kelas berhasil diterbitkan untuk rombel ini.");
  };

  const handleAddEkskulAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekskulActivityNotes.trim()) return;

    const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const newAgenda = {
      id: `ek_${Date.now()}`,
      date: dateStr,
      topic: ekskulActivityNotes.trim(),
      attendanceRate: 100,
    };

    setEkskulAgendaList([newAgenda, ...ekskulAgendaList]);
    setEkskulActivityNotes("");
    showToast("success", "Agenda Ekskul Dicatat", "Materi dan jurnal kegiatan ekstrakurikuler disimpan.");
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* CONTEXT SWITCHER TOOLBAR (Satu Guru — Banyak Penugasan)  */}
      {/* ======================================================== */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Konteks Tugas Aktif Guru
            </div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>{myDuties.length} Tugas Tambahan Terdaftar</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                1 Akun • 1 QR Code
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Context Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          {/* Primary Mapel Button */}
          <button
            onClick={() => setActiveTeacherContext("mapel")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTeacherContext === "mapel"
                ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guru Mata Pelajaran</span>
          </button>

          {/* Render each active assignment */}
          {myDuties.map((duty) => {
            const isSelected = activeTeacherContext === duty.id;
            return (
              <button
                key={duty.id}
                onClick={() => setActiveTeacherContext(duty.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200"
                }`}
              >
                {duty.type === "wali_kelas" && <Award className="w-3.5 h-3.5 text-amber-300" />}
                {duty.type === "guru_piket" && <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />}
                {duty.type === "pembina_ekskul" && <Compass className="w-3.5 h-3.5 text-emerald-300" />}
                {duty.type === "koordinator" && <Star className="w-3.5 h-3.5 text-indigo-300" />}
                {duty.type === "tugas_lain" && <Sparkles className="w-3.5 h-3.5 text-teal-300" />}
                <span>{duty.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW: GURU MATA PELAJARAN (DEFAULT)                   */}
      {/* ======================================================== */}
      {currentMode === "mapel" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kelas Diajar
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{classes.length} Rombel</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Matematika & IPA Terpadu</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tugas Berjalan
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{assignments.length} Tugas</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {assignmentSubmissions.length} Masuk
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Terkoreksi otomatis & manual</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ujian CBT Dibuat
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{exams.length} Paket</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">PTS, PAS, & Kuis Formatif</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Bank Soal AI
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">Gemini 2.5</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  HOTS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Generator soal otomatis</span>
            </div>
          </div>

          {/* Quick Actions Grid for Mapel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab("attendance")}
              className="p-4 bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Presensi KBM</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Buka scanner QR kelas</p>
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className="p-4 bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <FileQuestion className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Bank Soal & AI</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Buat soal HOTS otomatis</p>
            </button>

            <button
              onClick={() => setActiveTab("assignments")}
              className="p-4 bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Tugas & LKPD</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Kelola lembar kerja siswa</p>
            </button>

            <button
              onClick={() => setActiveTab("assessment")}
              className="p-4 bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Penilaian & Nilai</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Input nilai dan remedial</p>
            </button>
          </div>

          {/* Today Teaching Schedule & Active Assignments/CBT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today Teaching Schedules (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-black text-slate-900">
                    Jadwal Mengajar Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long" })})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("schedules")}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Jadwal Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {schedules.filter((s) => s.teacherId === currentUser.id || s.teacherId === "teacher_01").length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    Tidak ada jadwal mengajar di kelas hari ini.
                  </div>
                ) : (
                  schedules
                    .filter((s) => s.teacherId === currentUser.id || s.teacherId === "teacher_01")
                    .slice(0, 3)
                    .map((sch) => {
                      const cls = classes.find((c) => c.id === sch.classId);
                      const subj = subjects.find((s) => s.id === sch.subjectId);
                      return (
                        <div
                          key={sch.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shrink-0">
                              {cls?.name || "Kelas"}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{subj?.name || "Mata Pelajaran"}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {sch.startTime} - {sch.endTime} WIB • {sch.room || "Ruang Kelas"}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab("attendance")}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Presensi KBM</span>
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Active Assignments & CBT summary (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-black text-slate-900">
                      Tugas & LKPD Perlu Koreksi
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("assignments")}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Kelola ({assignments.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {assignments.slice(0, 2).map((asg) => {
                    const submissions = assignmentSubmissions.filter((s) => s.assignmentId === asg.id);
                    const targetClass = classes.find((c) => c.id === asg.classId);
                    return (
                      <div
                        key={asg.id}
                        className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{asg.title}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Kelas {targetClass?.name} • Tenggat {asg.dueDate}
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          {submissions.length} Jawaban
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Assistant Banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-5 text-white space-y-2 shadow-xs border border-emerald-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    AI Madrasah Assistant
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  Butuh pembuatan soal HOTS atau modul ajar kurikulum merdeka?
                </h4>
                <div className="pt-1">
                  <button
                    onClick={onOpenAIAssistant}
                    className="px-3.5 py-1.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Buka Gemini AI Assistant</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW: WALI KELAS DASHBOARD                            */}
      {/* ======================================================== */}
      {currentMode === "wali_kelas" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Banner for Wali Kelas */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  TUGAS WALI KELAS
                </span>
                <span className="text-xs text-emerald-200">
                  {myWaliClass ? `Rombongan Belajar ${myWaliClass.name}` : "Kelas VIII-A"}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Dashboard Wali Kelas: {myWaliClass?.name || "Kelas VIII-A"}
              </h3>
              <p className="text-xs text-emerald-200 max-w-xl">
                Pantau perkembangan akademik, presensi harian per siswa, capaian E-Rapor, dan catatan bimbingan konseling untuk 30 siswa binaan Anda.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab("rapor")}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Leger & E-Rapor</span>
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Presensi Rombel</span>
              </button>
            </div>
          </div>

          {/* Wali Kelas Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Siswa Binaan
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">{classStudents.length} Siswa</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  100% Aktif
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">
                {classStudents.filter((s) => s.gender === "L").length} Laki-laki • {classStudents.filter((s) => s.gender === "P").length} Perempuan
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Presensi Kelas Hari Ini
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-emerald-700">{classAttendancePercent}%</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {classPresentCount}/{classStudents.length} Hadir
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Terverifikasi scan QR</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rata-rata Nilai Rombel
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">88.2</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Predikat A
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Seluruh mapel semester ini</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Perhatian Khusus
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-amber-600">2 Siswa</span>
                <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                  Konseling
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Tugas belum lengkap</span>
            </div>
          </div>

          {/* Student Roster Table & Class Notice Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Roster (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Daftar Siswa {myWaliClass?.name}</h4>
                  <p className="text-[11px] text-slate-400">Status kehadiran dan nilai capaian siswa hari ini</p>
                </div>
                <button
                  onClick={() => setActiveTab("assessment")}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Lihat Leger Lengkap &rarr;
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">NIS/NISN</th>
                      <th className="px-4 py-3">Presensi Hari Ini</th>
                      <th className="px-4 py-3">Rata-Rata Nilai</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudentsAttendance.slice(0, 8).map(({ student, record, avgScore }) => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                              alt={student.name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{student.name}</div>
                              <div className="text-[10px] text-slate-400">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {student.nipOrNis || student.nis || "2025001"}
                        </td>
                        <td className="px-4 py-3">
                          {record ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Hadir ({record.time})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Belum Presensi
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900">{avgScore}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold ml-1">
                            ({avgScore >= 85 ? "A" : "B"})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentForNote(student.name);
                              setClassConsultNotes(`Catatan bimbingan untuk ${student.name}: `);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Catat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Class Notice & Consultation Board (1 Col) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Catatan & Pengumuman Wali Kelas</h4>
                <p className="text-[11px] text-slate-400 mb-4">Publikasi catatan bimbingan atau informasi untuk rombel ini</p>

                <form onSubmit={handleAddClassNotice} className="space-y-3">
                  <textarea
                    value={classConsultNotes}
                    onChange={(e) => setClassConsultNotes(e.target.value)}
                    rows={3}
                    placeholder="Tulis catatan wali kelas, pengumuman tugas, atau agenda rombel..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Terbitkan Pengumuman Rombel</span>
                  </button>
                </form>

                <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {classNotices.map((nt) => (
                    <div key={nt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="text-emerald-800">{nt.title}</span>
                        <span>{nt.date}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{nt.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. VIEW: GURU PIKET DASHBOARD                            */}
      {/* ======================================================== */}
      {currentMode === "guru_piket" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Banner for Guru Piket */}
          <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-900 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-700/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-400/20 text-sky-300 border border-sky-300/30">
                  TUGAS GURU PIKET
                </span>
                <span className="text-xs text-teal-200">
                  Jadwal: {currentDuty?.piketDay || "Senin"} ({currentDuty?.piketHours || "06.30 - 14.00 WIB"})
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Dashboard Piket: {currentDuty?.title || "Guru Piket Hari Ini"}
              </h3>
              <p className="text-xs text-teal-200 max-w-xl">
                Lokasi: {currentDuty?.piketLocation || "Gerbang Utama & Pos Piket"}. Memantau kehadiran GTK, siswa terlambat, izin masuk/keluar, dan ketertiban KBM.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab("attendance")}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Buka Scanner Presensi Gerbang</span>
              </button>
            </div>
          </div>

          {/* Guru Piket Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Presensi Guru & GTK Hari Ini
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {presentTeachersCount}/{todayTeachers.length}
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {Math.round((presentTeachersCount / todayTeachers.length) * 100)}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Scan QR Guru Terpadu</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Siswa Terlambat Masuk
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-amber-600">{lateStudentsCount} Siswa</span>
                <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                  Gerbang
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Tercatat di sistem QR</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Izin / Sakit Terkonfirmasi
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">{permitStudentsCount} Siswa</span>
                <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                  Surat Izin
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Tervalidasi pihak orang tua</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jurnal Piket Hari Ini
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-emerald-700">{piketLoggedEntries.length} Laporan</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tercatat
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Buku Jurnal Digital</span>
            </div>
          </div>

          {/* Buku Piket Digital & GTK Attendance Monitor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form & Jurnal Piket (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Buku Jurnal Piket Madrasah Digital</h4>
                  <p className="text-[11px] text-slate-400">Catat kejadian, penanganan siswa terlambat, dan tamu madrasah</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-lg">
                  Hari Ini: {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>

              <form onSubmit={handleAddPiketJournal} className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Kategori:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPiketIncidentType("aman")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        piketIncidentType === "aman"
                          ? "bg-emerald-800 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Ketertiban
                    </button>
                    <button
                      type="button"
                      onClick={() => setPiketIncidentType("kejadian")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        piketIncidentType === "kejadian"
                          ? "bg-amber-600 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Insiden/Terlambat
                    </button>
                    <button
                      type="button"
                      onClick={() => setPiketIncidentType("tamu")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        piketIncidentType === "tamu"
                          ? "bg-teal-700 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      Buku Tamu
                    </button>
                  </div>
                </div>

                <textarea
                  value={piketJournalNotes}
                  onChange={(e) => setPiketJournalNotes(e.target.value)}
                  rows={2}
                  placeholder="Deskripsikan catatan piket, nama siswa/tamu terkait, dan tindak lanjut yang dilakukan..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none bg-white"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambahkan ke Buku Jurnal</span>
                  </button>
                </div>
              </form>

              {/* Log Timeline */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Catatan Kejadian Hari Ini ({piketLoggedEntries.length})
                </h5>
                <div className="space-y-2.5">
                  {piketLoggedEntries.map((entry) => (
                    <div key={entry.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {entry.time}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{entry.type}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{entry.note}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        Oleh: {entry.author}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick GTK Status (1 Col) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Status Kehadiran Guru Hari Ini</h4>
                <p className="text-[11px] text-slate-400 mb-4">Monitoring presensi seluruh GTK madrasah</p>

                <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                  {todayTeachersAttendance.map(({ teacher, record }) => (
                    <div key={teacher.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={teacher.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                          alt={teacher.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{teacher.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIP: {teacher.nipOrNis || "-"}</div>
                        </div>
                      </div>
                      <div>
                        {record ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            {record.time}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Belum
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("attendance")}
                className="mt-4 w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer text-center"
              >
                Buka Layar Presensi QR Penuh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VIEW: PEMBINA EKSTRAKURIKULER DASHBOARD               */}
      {/* ======================================================== */}
      {currentMode === "pembina_ekskul" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Banner for Ekskul */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
                  PEMBINA EKSTRAKURIKULER
                </span>
                <span className="text-xs text-emerald-200">
                  {myEkskul?.name || "Pramuka Gugus Depan"}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Dashboard Pembina: {myEkskul?.name || "Ekstrakurikuler Madrasah"}
              </h3>
              <p className="text-xs text-emerald-200 max-w-xl">
                Jadwal: {myEkskul?.scheduleDay || "Jumat"} ({myEkskul?.scheduleTime || "14.30 - 16.30 WIB"}) di {myEkskul?.location || "Lapangan Utama"}. {myEkskul?.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab("attendance")}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Presensi Anggota</span>
              </button>
            </div>
          </div>

          {/* Ekskul Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Anggota Terdaftar
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">{ekskulMembers.length} Siswa</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {myEkskul?.category}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Siswa aktif terdaftar</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jadwal Latihan Rutin
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-black text-emerald-800">{myEkskul?.scheduleDay}</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Mingguan
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">{myEkskul?.scheduleTime}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Kehadiran Sesi Terakhir
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">96%</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tertib
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Scan QR Personal</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jurnal & Agenda Selesai
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-900">{ekskulAgendaList.length} Sesi</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tercatat
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2">Kurikulum ekskul madrasah</span>
            </div>
          </div>

          {/* Members Table & Activity Logger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members List (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Daftar Anggota: {myEkskul?.name}</h4>
                  <p className="text-[11px] text-slate-400">Daftar anggota aktif dan riwayat kehadiran ekskul</p>
                </div>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Presensi QR Ekskul
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Keaktifan</th>
                      <th className="px-4 py-3">Predikat Nilai</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ekskulMembers.map((student) => {
                      const studentClass = classes.find((c) => c.id === student.classId);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                                alt={student.name}
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                              />
                              <div className="font-bold text-slate-900">{student.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {studentClass?.name || "VII-A"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-700 font-bold">95% Hadir</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-black rounded text-[11px]">
                              Sangat Baik (A)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Logger Form (1 Col) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Catat Jurnal & Agenda Latihan</h4>
                <p className="text-[11px] text-slate-400 mb-3">Dokumentasikan materi dan materi latihan mingguan</p>

                <form onSubmit={handleAddEkskulAgenda} className="space-y-3">
                  <textarea
                    value={ekskulActivityNotes}
                    onChange={(e) => setEkskulActivityNotes(e.target.value)}
                    rows={3}
                    placeholder="Tuliskan topik materi kegiatan ekskul hari ini..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan Jurnal Latihan</span>
                  </button>
                </form>

                <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {ekskulAgendaList.map((agenda) => (
                    <div key={agenda.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="text-emerald-800 font-bold">{agenda.date}</span>
                        <span className="text-emerald-700">{agenda.attendanceRate}% Hadir</span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{agenda.topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. VIEW: KOORDINATOR PROGRAM / TUGAS KHUSUS              */}
      {/* ======================================================== */}
      {(currentMode === "koordinator" || currentMode === "tugas_lain") && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Header Banner for Koordinator */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-400/20 text-indigo-300 border border-indigo-300/30">
                  KOORDINATOR PROGRAM
                </span>
                <span className="text-xs text-emerald-200">
                  {currentDuty?.coordinatorField || "Program Khusus Madrasah"}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">
                Dashboard: {currentDuty?.title || "Koordinator Program Madrasah"}
              </h3>
              <p className="text-xs text-emerald-200 max-w-xl">
                {currentDuty?.description || "Penanggung jawab koordinasi program strategis, pemantauan kegiatan, dan penyusunan laporan ketercapaian madrasah."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab("reports")}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Laporan & Progres</span>
              </button>
            </div>
          </div>

          {/* Program Overview & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status Program
              </span>
              <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Berjalan Sesuai Target</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                SK Pengangkatan No: {currentDuty?.notes || "SK Kepala Madrasah 2025/2026"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Periode Penugasan
              </span>
              <div className="text-xl font-black text-slate-900">
                T.A. {currentDuty?.academicYear || schoolProfile.academicYear}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Semester {currentDuty?.semester || schoolProfile.semester} • Status: Aktif
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Keterlibatan Siswa & GTK
              </span>
              <div className="text-xl font-black text-emerald-700">
                100% Madrasah
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mencakup seluruh rombel tingkat VII, VIII, dan IX.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
