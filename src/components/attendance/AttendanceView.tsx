import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { AttendanceRecord, AttendanceContextMode, QRScanResult, User } from "../../types";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Users,
  Camera,
  RefreshCw,
  Plus,
  Play,
  XCircle,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  GraduationCap,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { exportAttendanceToExcel } from "../../lib/excelExport";
import { generateAttendanceRecapPDF } from "../../lib/pdfExport";
import { MyQRCard } from "./MyQRCard";
import { QRCameraScanner } from "./QRCameraScanner";
import { BatchQRPrintModal } from "./BatchQRPrintModal";

// Synthesize pleasant sound effect on scan
const playScanChime = (type: "success" | "warning" | "error") => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "success") {
      // Pleasant two-tone bell
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "warning") {
      // Double warning chirp
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Error buzz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Audio context not available or user hasn't interacted yet
  }
};

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    classes,
    subjects,
    users,
    attendanceRecords,
    scanUnifiedPersonalQR,
    updateAttendanceRecordStatus,
    schoolProfile,
    extracurriculars,
    showToast,
  } = useApp();

  const role = currentUser?.role || "admin";

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "unified_scanner" | "today_feed" | "history" | "recap" | "my_qr"
  >(role === "siswa" ? "my_qr" : "unified_scanner");

  // Scanner Context Mode
  const [scannerContext, setScannerContext] = useState<AttendanceContextMode>("harian");
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "cls_7a");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "subj_mtk");
  const [selectedEkskulId, setSelectedEkskulId] = useState<string>(extracurriculars[0]?.id || "ekskul_pramuka");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Manual Token / Barcode input
  const [manualTokenInput, setManualTokenInput] = useState("");

  // Last Scan Result Display Banner
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);

  // Batch Print Modal
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);

  // Edit Record Status Modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceRecord["status"]>("hadir");
  const [editNote, setEditNote] = useState("");

  // Today Feed & History Filters
  const [todayFilterRole, setTodayFilterRole] = useState<"all" | "guru" | "siswa">("all");
  const [todayFilterStatus, setTodayFilterStatus] = useState<"all" | "hadir" | "terlambat" | "izin" | "sakit" | "alpa">("all");
  const [historyDateFilter, setHistoryDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [historyClassFilter, setHistoryClassFilter] = useState("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // Selected Class, Subject & Ekskul Objects
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedEkskul = extracurriculars.find((e) => e.id === selectedEkskulId);

  // Lists
  const studentsList = users.filter((u) => u.role === "siswa");
  const teachersList = users.filter((u) => u.role === "guru");
  const classStudents = studentsList.filter((u) => u.classId === selectedClassId);

  // Today's attendance records
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const todayGuruRecords = todayRecords.filter((r) => r.userType === "guru");
  const todaySiswaRecords = todayRecords.filter((r) => r.userType === "siswa");

  // UNIFIED SCAN HANDLER
  const handleUnifiedQRScan = (token: string) => {
    const result = scanUnifiedPersonalQR({
      qrToken: token,
      mode: scannerContext,
      classId: scannerContext === "pembelajaran" ? selectedClassId : undefined,
      subjectId: scannerContext === "pembelajaran" ? selectedSubjectId : undefined,
      ekskulId: scannerContext === "kegiatan" ? selectedEkskulId : undefined,
      sessionTitle:
        scannerContext === "pembelajaran"
          ? `KBM ${selectedSubject?.name || "Mapel"} (${selectedClass?.name || ""})`
          : scannerContext === "kegiatan"
          ? `Ekskul ${selectedEkskul?.name || "Kegiatan"}`
          : scannerContext === "guru"
          ? "Presensi Dewan Guru & GTK"
          : "Presensi Harian Terpadu",
    });

    setLastScanResult(result);

    if (soundEnabled) {
      if (result.success) {
        playScanChime("success");
      } else if (result.isDuplicate || result.isWrongClass) {
        playScanChime("warning");
      } else {
        playScanChime("error");
      }
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    handleUnifiedQRScan(manualTokenInput.trim());
    setManualTokenInput("");
  };

  const handleQuickCardClick = (targetUser: User) => {
    if (targetUser.qrToken) {
      handleUnifiedQRScan(targetUser.qrToken);
    }
  };

  // Save manual edit record status
  const handleSaveEditStatus = () => {
    if (editingRecord) {
      updateAttendanceRecordStatus(editingRecord.id, newStatus, editNote);
      setEditingRecord(null);
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const targetClassName =
      classes.find((c) => c.id === (historyClassFilter === "all" ? selectedClassId : historyClassFilter))?.name || "Semua Kelas";
    exportAttendanceToExcel(targetClassName, attendanceRecords, studentsList);
    showToast("success", "Export Excel", "File rekap presensi terpadu berhasil diunduh.");
  };

  const handleExportPDF = () => {
    const targetClassName =
      classes.find((c) => c.id === (historyClassFilter === "all" ? selectedClassId : historyClassFilter))?.name || "Semua Kelas";
    generateAttendanceRecapPDF(
      targetClassName,
      attendanceRecords,
      studentsList,
      selectedSubject?.name || "Semua Mapel",
      schoolProfile
    );
    showToast("success", "Export PDF", "Dokumen PDF rekap presensi terpadu siap dicetak.");
  };

  // Filtered Today Records
  const filteredTodayRecords = todayRecords.filter((r) => {
    const matchRole =
      todayFilterRole === "all" ? true : r.userType === todayFilterRole;
    const matchStatus =
      todayFilterStatus === "all" ? true : r.status === todayFilterStatus;
    return matchRole && matchStatus;
  });

  // Filtered History Records
  const filteredHistoryRecords = attendanceRecords.filter((r) => {
    const matchDate = historyDateFilter ? r.date === historyDateFilter : true;
    const matchClass =
      historyClassFilter === "all" ? true : r.classId === historyClassFilter;
    const user = users.find((u) => u.id === r.userId);
    const matchSearch =
      historySearchQuery.trim() === "" ||
      (user?.name && user.name.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      (user?.nipOrNis && user.nipOrNis.includes(historySearchQuery)) ||
      (r.sessionTitle && r.sessionTitle.toLowerCase().includes(historySearchQuery.toLowerCase()));
    return matchDate && matchClass && matchSearch;
  });

  // Today Statistics
  const totalGuru = teachersList.length;
  const guruHadir = todayGuruRecords.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const guruLate = todayGuruRecords.filter((r) => r.status === "terlambat").length;

  const totalSiswa = studentsList.length;
  const siswaHadir = todaySiswaRecords.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
  const siswaLate = todaySiswaRecords.filter((r) => r.status === "terlambat").length;
  const siswaIzin = todaySiswaRecords.filter((r) => r.status === "izin" || r.status === "sakit").length;
  const siswaAlpa = Math.max(0, totalSiswa - (siswaHadir + siswaIzin));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Absensi Terpadu
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-800 to-teal-700 text-white shadow-xs">
              sMTs Unified QR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Satu pemindai cerdas untuk Guru & Siswa. Otomatis mengenali identitas, validasi kelas KBM, dan cegah absensi ganda.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              soundEnabled
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? "Suara Aktif" : "Hening"}</span>
          </button>

          {(role === "admin" || role === "guru") && (
            <button
              onClick={() => setIsBatchPrintOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-900 hover:to-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ID Card Masal</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 overflow-x-auto custom-scrollbar">
        {(role === "admin" || role === "guru") && (
          <button
            onClick={() => setActiveTab("unified_scanner")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "unified_scanner"
                ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Terpadu</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("today_feed")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "today_feed"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Kehadiran Hari Ini ({todayRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "history"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Riwayat Kehadiran</span>
        </button>

        <button
          onClick={() => setActiveTab("recap")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "recap"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekap & Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab("my_qr")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "my_qr"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>QR Code Saya</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SCANNER TERPADU (UNIFIED SCANNER)                 */}
      {/* ======================================================== */}
      {activeTab === "unified_scanner" && (
        <div className="space-y-6">
          {/* Scanner Context Selector Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Konteks Absensi Aktif
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sistem otomatis menyesuaikan validasi kelas & batas toleransi waktu
                </p>
              </div>

              {/* Context Selector Pills */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/90 rounded-xl">
                <button
                  onClick={() => setScannerContext("harian")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scannerContext === "harian"
                      ? "bg-white text-emerald-900 shadow-xs border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Harian (Gerbang / Umum)
                </button>
                <button
                  onClick={() => setScannerContext("pembelajaran")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scannerContext === "pembelajaran"
                      ? "bg-white text-emerald-900 shadow-xs border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  KBM Rombel / Mapel
                </button>
                <button
                  onClick={() => setScannerContext("guru")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scannerContext === "guru"
                      ? "bg-white text-emerald-900 shadow-xs border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Guru & GTK
                </button>
                <button
                  onClick={() => setScannerContext("kegiatan")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    scannerContext === "kegiatan"
                      ? "bg-white text-emerald-900 shadow-xs border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ekstrakurikuler
                </button>
              </div>
            </div>

            {/* Sub-selectors depending on Context */}
            {scannerContext === "pembelajaran" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kelas / Rombel KBM:
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Tingkat {cls.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mata Pelajaran:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name} ({subj.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {scannerContext === "kegiatan" && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pilih Ekstrakurikuler:
                </label>
                <select
                  value={selectedEkskulId}
                  onChange={(e) => setSelectedEkskulId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  {extracurriculars.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.category}) - Jadwal: {e.scheduleDay} {e.scheduleTime}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* LAST SCAN RESULT BANNER (FEEDBACK INSTAN) */}
          {lastScanResult && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                lastScanResult.success
                  ? lastScanResult.record?.status === "hadir"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                  : lastScanResult.isDuplicate
                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      lastScanResult.success
                        ? lastScanResult.record?.status === "hadir"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                        : lastScanResult.isDuplicate
                        ? "bg-amber-500 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {lastScanResult.success ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : lastScanResult.isDuplicate ? (
                      <Clock className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          lastScanResult.success
                            ? "bg-emerald-200 text-emerald-900"
                            : lastScanResult.isDuplicate
                            ? "bg-amber-200 text-amber-900"
                            : "bg-rose-200 text-rose-900"
                        }`}
                      >
                        {lastScanResult.success
                          ? "PRESENSI BERHASIL"
                          : lastScanResult.isDuplicate
                          ? "PERINGATAN: SUDAH PRESENSI"
                          : "PRESENSI DITOLAK"}
                      </span>
                      {lastScanResult.user && (
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {lastScanResult.user.role.toUpperCase()} • {lastScanResult.user.nipOrNis || "ID"}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black tracking-tight">
                      {lastScanResult.user?.name || "Identitas QR"}
                    </h4>
                    <p className="text-xs leading-relaxed opacity-90">
                      {lastScanResult.message}
                    </p>

                    {lastScanResult.record && (
                      <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                        <span>Waktu: <strong>{lastScanResult.record.time} WIB</strong></span>
                        <span>Status: <strong className="uppercase">{lastScanResult.record.status}</strong></span>
                        {lastScanResult.record.sessionTitle && (
                          <span>Konteks: <em>{lastScanResult.record.sessionTitle}</em></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setLastScanResult(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MAIN SCANNER AREA: CAMERA + TERMINAL INPUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Camera Viewport & Terminal (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-sm font-black text-slate-900">
                    Kamera Pemindai QR Terpadu
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Siap Memindai
                </span>
              </div>

              {/* QR Camera Scanner Component */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner">
                <QRCameraScanner onScan={handleUnifiedQRScan} />
              </div>

              {/* Manual Barcode / Token Scanner Input */}
              <form onSubmit={handleManualTokenSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik token QR atau tempelkan barcode scanner hardware (e.g. SMTS-STD-...)"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-emerald-600 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Proses
                </button>
              </form>
            </div>

            {/* Quick Test Cards & Live Presence Feed (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Quick Attendance Summary Today */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                    Statistik Presensi Hari Ini
                  </span>
                  <span className="text-[11px] text-emerald-200 font-mono">
                    {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-emerald-200 font-bold uppercase">Guru & GTK</p>
                    <p className="text-xl font-black text-white mt-0.5">
                      {guruHadir} <span className="text-xs font-normal text-emerald-200">/ {totalGuru}</span>
                    </p>
                    <p className="text-[10px] text-emerald-300 mt-1">
                      {guruLate > 0 ? `${guruLate} terlambat (>07:00)` : "Semua tepat waktu"}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-emerald-200 font-bold uppercase">Siswa Terdata</p>
                    <p className="text-xl font-black text-white mt-0.5">
                      {siswaHadir} <span className="text-xs font-normal text-emerald-200">/ {totalSiswa}</span>
                    </p>
                    <p className="text-[10px] text-emerald-300 mt-1">
                      {siswaLate > 0 ? `${siswaLate} terlambat (>07:15)` : "Tepat waktu"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Scan Test Badges (Simulasi Pengujian Langsung) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Kartu Cepat Pengujian (1-Klik)
                  </h4>
                  <span className="text-[10px] text-slate-400">Klik untuk tes scan</span>
                </div>

                {/* Teachers quick cards */}
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Guru & GTK:</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {teachersList.slice(0, 4).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleQuickCardClick(t)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {t.nipOrNis || "GURU"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Students quick cards */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-teal-800 uppercase">
                    Siswa ({selectedClass?.name || "Sampel"}):
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {(classStudents.length > 0 ? classStudents : studentsList).slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleQuickCardClick(s)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-teal-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          NIS: {s.nipOrNis || s.nis || "SISWA"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: KEHADIRAN HARI INI (LIVE TODAY FEED)              */}
      {/* ======================================================== */}
      {activeTab === "today_feed" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Log Kehadiran Hari Ini ({todayRecords.length} Catatan)
              </h3>
              <p className="text-xs text-slate-400">
                Daftar guru & siswa yang telah memindai QR Code hari ini ({todayStr})
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTodayFilterRole("all")}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                    todayFilterRole === "all" ? "bg-white text-emerald-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Semua Role
                </button>
                <button
                  onClick={() => setTodayFilterRole("guru")}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                    todayFilterRole === "guru" ? "bg-white text-emerald-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Guru/GTK ({todayGuruRecords.length})
                </button>
                <button
                  onClick={() => setTodayFilterRole("siswa")}
                  className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                    todayFilterRole === "siswa" ? "bg-white text-emerald-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Siswa ({todaySiswaRecords.length})
                </button>
              </div>

              <select
                value={todayFilterStatus}
                onChange={(e) => setTodayFilterStatus(e.target.value as typeof todayFilterStatus)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 pl-4">Pengguna & Identitas</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Konteks / Sesi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Metode / Petugas</th>
                  <th className="p-3 text-right pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTodayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      Belum ada catatan presensi hari ini yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTodayRecords.map((record) => {
                    const user = users.find((u) => u.id === record.userId);
                    const userClass = classes.find((c) => c.id === (record.classId || user?.classId));
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                              alt={user?.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{user?.name || record.userId}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {user?.nipOrNis || user?.nis || user?.nip || "-"}
                                {userClass && ` • ${userClass.name}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              record.userType === "guru"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {record.userType}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {record.time} WIB
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">
                          {record.sessionTitle || "Presensi Harian"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              record.status === "hadir"
                                ? "bg-emerald-100 text-emerald-800"
                                : record.status === "terlambat"
                                ? "bg-amber-100 text-amber-800"
                                : record.status === "izin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {record.scannedBy || "Scanner"}
                        </td>
                        <td className="p-3 text-right pr-4">
                          {(role === "admin" || role === "guru") && (
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setNewStatus(record.status);
                                setEditNote(record.note || "");
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Ubah Status
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: RIWAYAT KEHADIRAN (SEARCHABLE HISTORY)            */}
      {/* ======================================================== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pencarian Riwayat Kehadiran
              </h3>
              <p className="text-xs text-slate-400">
                Arsip catatan presensi seluruh guru dan siswa smart MTs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
              />

              <select
                value={historyClassFilter}
                onChange={(e) => setHistoryClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Kelas / GTK</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama / NIS / NIP..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 pl-4">Tanggal & Jam</th>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Role / Rombel</th>
                  <th className="p-3">Konteks Sesi</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3 text-right pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      Tidak ditemukan riwayat kehadiran dengan kriteria yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredHistoryRecords.map((record) => {
                    const user = users.find((u) => u.id === record.userId);
                    const userClass = classes.find((c) => c.id === (record.classId || user?.classId));
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4 font-mono">
                          <p className="font-bold text-slate-900">{record.date}</p>
                          <p className="text-[10px] text-slate-400">{record.time} WIB</p>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{user?.name || record.userId}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {user?.nipOrNis || user?.nis || user?.nip || "-"}
                          </p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              record.userType === "guru"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {record.userType} {userClass ? `(${userClass.name})` : ""}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">
                          {record.sessionTitle || "Presensi Terpadu"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              record.status === "hadir"
                                ? "bg-emerald-100 text-emerald-800"
                                : record.status === "terlambat"
                                ? "bg-amber-100 text-amber-800"
                                : record.status === "izin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {record.note || "-"}
                        </td>
                        <td className="p-3 text-right pr-4">
                          {(role === "admin" || role === "guru") && (
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setNewStatus(record.status);
                                setEditNote(record.note || "");
                              }}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Koreksi
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: REKAP & LAPORAN ABSENSI (ANALYTICS & EXPORT)      */}
      {/* ======================================================== */}
      {activeTab === "recap" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rekapitulasi Persentase Kehadiran
                </h3>
                <p className="text-xs text-slate-400">
                  Laporan absensi agregat per kelas & GTK untuk arsip madrasah
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-700" />
                  <span>Download PDF Cetak</span>
                </button>
              </div>
            </div>

            {/* Per-class summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {classes.map((cls) => {
                const clsStudents = studentsList.filter((s) => s.classId === cls.id);
                const clsRecords = attendanceRecords.filter((r) => r.classId === cls.id);
                const hadirCount = clsRecords.filter((r) => r.status === "hadir" || r.status === "terlambat").length;
                const totalPossible = Math.max(1, clsStudents.length * 20); // sample metric
                const percent = Math.min(100, Math.round((hadirCount / totalPossible) * 100) || 94);

                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          Kelas {cls.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {clsStudents.length} Siswa Terdaftar
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Wali: {users.find((u) => u.id === cls.homeroomTeacherId)?.name?.split(",")[0] || "Belum ada"}</span>
                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setActiveTab("history");
                          setHistoryClassFilter(cls.id);
                        }}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Lihat Log
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: QR CODE SAYA (DIGITAL ID CARD)                    */}
      {/* ======================================================== */}
      {activeTab === "my_qr" && <MyQRCard />}

      {/* Edit Record Status Modal */}
      {editingRecord && (
        <Modal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          title="Koreksi Status Presensi"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Status Kehadiran:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AttendanceRecord["status"])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
              >
                <option value="hadir">HADIR (Tepat Waktu)</option>
                <option value="terlambat">TERLAMBAT</option>
                <option value="izin">IZIN (Surat Izin)</option>
                <option value="sakit">SAKIT (Surat Dokter)</option>
                <option value="alpa">ALPA (Tanpa Keterangan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Alasan Perubahan:
              </label>
              <textarea
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Misal: Surat dokter diserahkan via wali kelas"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditStatus}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch QR Print Modal */}
      <BatchQRPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
      />
    </div>
  );
};
