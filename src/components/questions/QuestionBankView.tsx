import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { QuestionItem } from "../../types";
import {
  FileQuestion,
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Bot,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { Modal } from "../common/Modal";

export const QuestionBankView: React.FC = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion, importQuestions, subjects, curriculums, schoolProfile, showToast } =
    useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Manual Question Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [manualForm, setManualForm] = useState({
    subjectId: subjects[0]?.id || "subj_mtk",
    curriculumId: curriculums[0]?.id || "",
    type: "multiple_choice" as QuestionItem["type"],
    difficulty: "medium" as QuestionItem["difficulty"],
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "A",
    points: 10,
    explanation: "",
  });

  // AI Question Generator Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    subjectId: subjects[0]?.id || "subj_mtk",
    topicOrCp: "Teorema Pythagoras dan Penerapannya",
    gradeLevel: 8,
    count: 3,
    type: "multiple_choice",
    difficulty: "hots",
  });
  const [generatedDrafts, setGeneratedDrafts] = useState<any[]>([]);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchSubj = selectedSubjectId === "all" || q.subjectId === selectedSubjectId;
    const matchDiff = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchType = selectedType === "all" || q.type === selectedType;
    const matchSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSubj && matchDiff && matchType && matchSearch;
  });

  const openAddManual = () => {
    setEditingQuestion(null);
    setManualForm({
      subjectId: subjects[0]?.id || "subj_mtk",
      curriculumId: curriculums[0]?.id || "",
      type: "multiple_choice",
      difficulty: "medium",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "A",
      points: 10,
      explanation: "",
    });
    setIsManualModalOpen(true);
  };

  const openEdit = (q: QuestionItem) => {
    setEditingQuestion(q);
    setManualForm({
      subjectId: q.subjectId,
      curriculumId: q.curriculumId || "",
      type: q.type,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options && q.options.length > 0 ? q.options : ["", "", "", ""],
      correctAnswer: String(q.correctAnswer || "A"),
      points: q.points,
      explanation: q.explanation || "",
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.questionText) return;

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, manualForm);
    } else {
      addQuestion(manualForm);
    }
    setIsManualModalOpen(false);
  };

  // Generate via Gemini AI Endpoint
  const handleGenerateAI = async () => {
    setAiGenerating(true);
    const subj = subjects.find((s) => s.id === aiConfig.subjectId);

    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subj?.name || "Matematika",
          topic: aiConfig.topicOrCp,
          gradeLevel: aiConfig.gradeLevel,
          count: aiConfig.count,
          type: aiConfig.type,
          difficulty: aiConfig.difficulty,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions && Array.isArray(data.questions)) {
        setGeneratedDrafts(data.questions);
        showToast("success", "AI Berhasil", `${data.questions.length} butir soal telah disusun oleh AI!`);
      } else {
        showToast("error", "AI Error", "Gagal memproses soal otomatis dari server.");
      }
    } catch {
      showToast("error", "Koneksi Gagal", "Tidak dapat menghubungi layanan AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImportAIDrafts = () => {
    if (generatedDrafts.length === 0) return;

    const formatted: Omit<QuestionItem, "id" | "createdAt">[] = generatedDrafts.map((d) => ({
      subjectId: aiConfig.subjectId,
      curriculumId: curriculums[0]?.id,
      type: (d.type as any) || aiConfig.type,
      difficulty: (d.difficulty as any) || aiConfig.difficulty,
      questionText: d.questionText,
      options: d.options || ["A", "B", "C", "D"],
      correctAnswer: d.correctAnswer,
      points: d.points || 10,
      explanation: d.explanation,
    }));

    importQuestions(formatted);
    setGeneratedDrafts([]);
    setIsAIModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Bank Soal Terintegrasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penyimpanan butir soal terstandarisasi berbasis CP/KD, taksonomi Bloom, dan generator AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generator Button */}
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Generate Soal AI</span>
          </button>

          {/* Manual Add Button */}
          <button
            onClick={openAddManual}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Soal Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari narasi soal atau pembahasan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="all">Semua Kesukaran</option>
            <option value="easy">Mudah (C1-C2)</option>
            <option value="medium">Sedang (C3)</option>
            <option value="hots">Tinggi / HOTS (C4-C6)</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
          >
            <option value="all">Semua Tipe Soal</option>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="complex_multiple_choice">Pilihan Ganda Kompleks</option>
            <option value="true_false">Benar / Salah</option>
            <option value="short_answer">Isian Singkat</option>
            <option value="essay">Uraian / Essay</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
            Tidak ada butir soal yang sesuai dengan filter.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const subj = subjects.find((s) => s.id === q.subjectId);

            const diffBadge = {
              easy: { label: "Mudah (C1)", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              medium: { label: "Sedang (C3)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
              hots: { label: "HOTS (C4-C6)", bg: "bg-purple-50 text-purple-700 border-purple-200" },
            }[q.difficulty];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {subj?.name}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${diffBadge.bg}`}>
                      {diffBadge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800">
                      {q.type.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-600">{q.points} Poin</span>
                    <button
                      onClick={() => openEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Hapus butir soal ini?")) deleteQuestion(q.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options (If multiple choice / true false) */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const optLabel = String.fromCharCode(65 + optIdx);
                      const isCorrect = String(q.correctAnswer).toUpperCase() === optLabel;

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2.5 border transition-all ${
                            isCorrect
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold"
                              : "bg-slate-50 border-slate-100 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center ${
                              isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border"
                            }`}
                          >
                            {optLabel}
                          </span>
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                    <strong>Kunci & Pembahasan: </strong>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* AI QUESTION GENERATOR MODAL */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="EduSmart AI - Generator Butir Soal"
        subtitle="Buat soal HOTS otomatis berstandar kurikulum nasional dengan bantuan AI"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={aiConfig.subjectId}
                onChange={(e) => setAiConfig({ ...aiConfig, subjectId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
              <input
                type="number"
                value={aiConfig.gradeLevel}
                onChange={(e) => setAiConfig({ ...aiConfig, gradeLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Topik / Lingkup Materi CP/KD</label>
            <input
              type="text"
              value={aiConfig.topicOrCp}
              onChange={(e) => setAiConfig({ ...aiConfig, topicOrCp: e.target.value })}
              placeholder="e.g. Sistem Peredaran Darah Manusia dan Penyakitnya"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Soal</label>
              <input
                type="number"
                min={1}
                max={10}
                value={aiConfig.count}
                onChange={(e) => setAiConfig({ ...aiConfig, count: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Soal</label>
              <select
                value={aiConfig.type}
                onChange={(e) => setAiConfig({ ...aiConfig, type: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="multiple_choice">Pilihan Ganda</option>
                <option value="essay">Uraian / Essay</option>
                <option value="short_answer">Isian Singkat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level Kognitif</label>
              <select
                value={aiConfig.difficulty}
                onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="hots">Tinggi / HOTS (C4-C6)</option>
                <option value="medium">Sedang (C3)</option>
                <option value="easy">Mudah (C1-C2)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={aiGenerating || !aiConfig.topicOrCp.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            {aiGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>EduSmart AI sedang menyusun butir soal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mulai Susun Soal Otomatis</span>
              </>
            )}
          </button>

          {/* AI Output Preview */}
          {generatedDrafts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Pratinjau Hasil AI ({generatedDrafts.length} Soal Terbentuk)
                </span>
                <button
                  onClick={handleImportAIDrafts}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Import ke Bank Soal
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3">
                {generatedDrafts.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <p className="font-bold text-slate-900">
                      {i + 1}. {d.questionText}
                    </p>
                    {d.options && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {d.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="text-[11px] text-slate-700">
                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-emerald-700 font-bold">
                      Kunci: {d.correctAnswer} — {d.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MANUAL QUESTION MODAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={editingQuestion ? "Edit Butir Soal" : "Tulis Butir Soal Baru"}
        subtitle="Masukkan konten soal, opsi jawaban, dan kunci pembahasan"
      >
        <form onSubmit={handleSaveManual} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={manualForm.subjectId}
                onChange={(e) => setManualForm({ ...manualForm, subjectId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kesukaran</label>
              <select
                value={manualForm.difficulty}
                onChange={(e) => setManualForm({ ...manualForm, difficulty: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="easy">Mudah (C1-C2)</option>
                <option value="medium">Sedang (C3)</option>
                <option value="hots">Tinggi / HOTS (C4-C6)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pertanyaan / Narasi Soal</label>
            <textarea
              rows={3}
              required
              value={manualForm.questionText}
              onChange={(e) => setManualForm({ ...manualForm, questionText: e.target.value })}
              placeholder="Tuliskan soal di sini..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          {manualForm.type === "multiple_choice" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Pilihan Jawaban (A, B, C, D)</label>
              {manualForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-bold text-slate-500">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const copy = [...manualForm.options];
                      copy[i] = e.target.value;
                      setManualForm({ ...manualForm, options: copy });
                    }}
                    placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kunci Jawaban</label>
              <input
                type="text"
                required
                value={manualForm.correctAnswer}
                onChange={(e) => setManualForm({ ...manualForm, correctAnswer: e.target.value })}
                placeholder="A / B / C / D atau kata kunci"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Poin / Bobot Nilai</label>
              <input
                type="number"
                value={manualForm.points}
                onChange={(e) => setManualForm({ ...manualForm, points: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pembahasan / Rasionalisasi</label>
            <textarea
              rows={2}
              value={manualForm.explanation}
              onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
              placeholder="Penjelasan langkah penyelesaian..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl">
              Simpan Soal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
