import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { useApp } from "../../context/AppContext";
import { Exam, ExamAttempt, QuestionItem } from "../../types";
import {
  GraduationCap,
  Clock,
  Calendar,
  Key,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  BarChart3,
  Bot,
} from "lucide-react";
import { Modal } from "../common/Modal";

export const ExamsView: React.FC = () => {
  const {
    currentUser,
    exams,
    addExam,
    deleteExam,
    examAttempts,
    submitExamAttempt,
    questions,
    subjects,
    classes,
    showToast,
  } = useApp();

  const role = currentUser?.role || "admin";

  // CBT Active Taking State
  const [activeCbtExam, setActiveCbtExam] = useState<Exam | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuestionItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [cbtResult, setCbtResult] = useState<ExamAttempt | null>(null);

  // Teacher Exam Management Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAttemptsExam, setViewingAttemptsExam] = useState<Exam | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenModalExam, setTokenModalExam] = useState<Exam | null>(null);

  const [examFormData, setExamFormData] = useState({
    title: "",
    category: "pts" as Exam["category"],
    subjectId: subjects[0]?.id || "subj_mtk",
    classIds: [classes[0]?.id || "cls_8a"],
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:30",
    durationMinutes: 60,
    passingGrade: 75,
    token: "EDUSMART",
    randomizeQuestions: true,
    shuffleOptions: true,
    showResultsDirectly: true,
    questionIds: [] as string[],
  });

  // Countdown timer for CBT
  useEffect(() => {
    if (!activeCbtExam || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishCBT();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCbtExam, secondsRemaining]);

  // Start CBT Flow for Student
  const handleRequestStartExam = (exam: Exam) => {
    setTokenModalExam(exam);
    setTokenInput("");
  };

  const handleVerifyTokenAndStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenModalExam) return;

    if (tokenInput.trim().toUpperCase() !== tokenModalExam.token.toUpperCase()) {
      showToast("error", "Token Salah", "Token ujian tidak cocok. Silakan minta token ke pengawas.");
      return;
    }

    const examQuestions = questions.filter((q) => tokenModalExam.questionIds.includes(q.id));
    if (examQuestions.length === 0) {
      showToast("warning", "Soal Kosong", "Ujian ini belum memiliki butir soal.");
      return;
    }

    setActiveCbtExam(tokenModalExam);
    setActiveQuestions(tokenModalExam.randomizeQuestions ? [...examQuestions].sort(() => 0.5 - Math.random()) : examQuestions);
    setCurrentQIndex(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setSecondsRemaining(tokenModalExam.durationMinutes * 60);
    setCbtResult(null);
    setTokenModalExam(null);
    showToast("info", "Ujian Dimulai", "Selamat mengerjakan! Waktu ujian sedang berjalan.");
  };

  const handleFinishCBT = () => {
    if (!activeCbtExam || !currentUser) return;

    const attempt = submitExamAttempt({
      examId: activeCbtExam.id,
      studentId: currentUser.id,
      answers: userAnswers,
      timeSpentSeconds: activeCbtExam.durationMinutes * 60 - secondsRemaining,
    });

    setCbtResult(attempt);
    setActiveCbtExam(null);

    if (attempt.passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const openCreateModal = () => {
    setExamFormData({
      title: "",
      category: "pts",
      subjectId: subjects[0]?.id || "subj_mtk",
      classIds: [classes[0]?.id || "cls_8a"],
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "09:30",
      durationMinutes: 60,
      passingGrade: 75,
      token: `EXAM${Math.floor(1000 + Math.random() * 9000)}`,
      randomizeQuestions: true,
      shuffleOptions: true,
      showResultsDirectly: true,
      questionIds: questions.slice(0, 5).map((q) => q.id),
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examFormData.title) return;

    addExam({
      ...examFormData,
      createdBy: currentUser?.id || "teacher_01",
      createdAt: new Date().toISOString(),
    });
    setIsCreateModalOpen(false);
  };

  // ACTIVE CBT TAKING SCREEN
  if (activeCbtExam && activeQuestions.length > 0) {
    const currentQ = activeQuestions[currentQIndex];
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const isFlagged = !!flaggedQuestions[currentQ.id];

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* CBT Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              CBT MODE AKTIF • {activeCbtExam.category.toUpperCase()}
            </span>
            <h2 className="text-base font-bold text-white">{activeCbtExam.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-sm">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm("Apakah Anda yakin ingin menyelesaikan ujian dan mengirimkan jawaban?")) {
                  handleFinishCBT();
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Kirim Jawaban
            </button>
          </div>
        </div>

        {/* Question Area & Navigation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Question Card */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">
                  Soal Nomor <strong className="text-slate-900 text-sm">#{currentQIndex + 1}</strong> dari {activeQuestions.length}
                </span>

                <button
                  onClick={() =>
                    setFlaggedQuestions((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isFlagged ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 hover:bg-amber-50"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isFlagged ? "Ragu-ragu (Ditandai)" : "Tandai Ragu"}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="py-4 text-sm font-semibold text-slate-900 leading-relaxed">
                {currentQ.questionText}
              </div>

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-2 mt-2">
                  {currentQ.options.map((opt, i) => {
                    const optLabel = String.fromCharCode(65 + i);
                    const isSelected = userAnswers[currentQ.id] === optLabel;

                    return (
                      <button
                        key={i}
                        onClick={() =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: optLabel,
                          }))
                        }
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-white border text-slate-700"
                          }`}
                        >
                          {optLabel}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text Input if Short Answer or Essay */}
              {(currentQ.type === "short_answer" || currentQ.type === "essay") && (
                <div className="mt-4">
                  <textarea
                    rows={4}
                    value={userAnswers[currentQ.id] || ""}
                    onChange={(e) =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: e.target.value,
                      }))
                    }
                    placeholder="Tuliskan jawaban lengkap Anda di sini..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Prev / Next Buttons */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                disabled={currentQIndex === activeQuestions.length - 1}
                onClick={() => setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Palette Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 mb-3">Nomor Soal</h4>
            <div className="grid grid-cols-5 gap-2">
              {activeQuestions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlag = !!flaggedQuestions[q.id];
                const isCurrent = currentQIndex === idx;

                let btnClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (isCurrent) {
                  btnClass = "ring-2 ring-emerald-500 bg-emerald-600 text-white font-bold";
                } else if (isFlag) {
                  btnClass = "bg-amber-400 text-amber-950 font-bold";
                } else if (isAnswered) {
                  btnClass = "bg-emerald-100 text-emerald-900 font-bold border-emerald-300";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg text-xs flex items-center justify-center border transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-400" />
                <span>Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CBT RESULT MODAL / SCREEN
  if (cbtResult) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${
            cbtResult.passed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
          }`}
        >
          <Award className="w-10 h-10" />
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
              cbtResult.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
          >
            {cbtResult.passed ? "LULUS KKM" : "PERLU REMEDIAL"}
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Hasil Ujian Anda</h2>
          <p className="text-xs text-slate-500">Jawaban telah terkirim dan dinilai otomatis oleh sistem.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nilai Akhir</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{cbtResult.percentage}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Poin Diperoleh</span>
            <div className="text-lg font-bold text-slate-900 mt-2">
              {cbtResult.score} / {cbtResult.maxScore}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Durasi Pengerjaan</span>
            <div className="text-lg font-bold text-slate-900 mt-2">
              {Math.floor(cbtResult.timeSpentSeconds / 60)} Menit
            </div>
          </div>
        </div>

        <button
          onClick={() => setCbtResult(null)}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
        >
          Kembali ke Daftar Ujian
        </button>
      </div>
    );
  }

  // STANDARD EXAMS LIST VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Ujian Online (CBT Engine)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem Computer Based Test untuk Penilaian Harian (UH), PTS, PAS/PAT, dan Ujian Sekolah.
          </p>
        </div>

        {(role === "admin" || role === "guru") && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Ujian Baru</span>
          </button>
        )}
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => {
          const subj = subjects.find((s) => s.id === exam.subjectId);
          const studentAttempt = examAttempts.find((a) => a.examId === exam.id && a.studentId === currentUser?.id);
          const totalAttempts = examAttempts.filter((a) => a.examId === exam.id).length;

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700">
                    {exam.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{subj?.name}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">{exam.title}</h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {exam.date} ({exam.startTime} - {exam.endTime})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Durasi: {exam.durationMinutes} Menit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      KKM: <strong className="text-slate-900">{exam.passingGrade}</strong> • Token:{" "}
                      <strong className="font-mono text-emerald-700">{exam.token}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {role === "siswa" ? (
                  studentAttempt ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Selesai: Nilai {studentAttempt.percentage}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequestStartExam(exam)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Mulai Kerjakan</span>
                    </button>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => setViewingAttemptsExam(exam)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{totalAttempts} Peserta Mengerjakan</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus ujian ${exam.title}?`)) deleteExam(exam.id);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TOKEN ENTRY MODAL FOR STUDENTS */}
      <Modal
        isOpen={!!tokenModalExam}
        onClose={() => setTokenModalExam(null)}
        title="Konfirmasi Mulai Ujian CBT"
        subtitle={tokenModalExam?.title}
      >
        <form onSubmit={handleVerifyTokenAndStart} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Petunjuk:</strong> Pastikan Anda telah siap dan memiliki koneksi internet stabil. Setelah token
            dimasukkan, waktu ujian akan langsung berjalan mundur.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Masukkan Token Ujian</label>
            <input
              type="text"
              required
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Contoh: EDUSMART"
              className="w-full px-3.5 py-2.5 text-center font-mono font-black text-sm tracking-widest uppercase border border-slate-300 rounded-xl focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTokenModalExam(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm"
            >
              Verifikasi & Masuk Ujian
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE EXAM MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Ujian Online (CBT)"
        subtitle="Konfigurasi waktu, durasi, dan butir soal ujian"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Ujian</label>
            <input
              type="text"
              required
              value={examFormData.title}
              onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
              placeholder="e.g. Penilaian Tengah Semester (PTS) Matematika Genap"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Ujian</label>
              <select
                value={examFormData.category}
                onChange={(e) => setExamFormData({ ...examFormData, category: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="formatif">Formatif / Ulangan Harian</option>
                <option value="pts">Penilaian Tengah Semester (PTS)</option>
                <option value="pas">Penilaian Akhir Semester (PAS)</option>
                <option value="pat">Penilaian Akhir Tahun (PAT)</option>
                <option value="tryout">Try Out Ujian Sekolah</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={examFormData.subjectId}
                onChange={(e) => setExamFormData({ ...examFormData, subjectId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={examFormData.date}
                onChange={(e) => setExamFormData({ ...examFormData, date: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={examFormData.durationMinutes}
                onChange={(e) => setExamFormData({ ...examFormData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Token Akses</label>
              <input
                type="text"
                value={examFormData.token}
                onChange={(e) => setExamFormData({ ...examFormData, token: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm">
              Terbitkan Ujian
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW ATTEMPTS / MONITORING MODAL */}
      <Modal
        isOpen={!!viewingAttemptsExam}
        onClose={() => setViewingAttemptsExam(null)}
        title={`Hasil & Peserta Ujian: ${viewingAttemptsExam?.title}`}
        subtitle="Analisis nilai dan pengawasan peserta ujian CBT"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {examAttempts.filter((a) => a.examId === viewingAttemptsExam?.id).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">Belum ada siswa yang menyelesaikan ujian ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Siswa</th>
                    <th className="px-4 py-2.5 text-center">Nilai</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Waktu Submit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examAttempts
                    .filter((a) => a.examId === viewingAttemptsExam?.id)
                    .map((att) => {
                      const std = currentUser?.id === att.studentId ? currentUser : null;
                      return (
                        <tr key={att.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{std?.name || "Dimas Pratama"}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600">{att.percentage}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                att.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {att.passed ? "Lulus" : "Remedial"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            {new Date(att.submittedAt).toLocaleTimeString("id-ID")}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
