import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { LearningOutcome } from "../../types";
import {
  BookOpen,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Search,
  Bot,
} from "lucide-react";
import { Modal } from "../common/Modal";

export const CurriculumView: React.FC = () => {
  const { curriculums, addCurriculum, updateCurriculum, deleteCurriculum, subjects, schoolProfile } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedCurriculumType, setSelectedCurriculumType] = useState<"all" | "merdeka" | "k13">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningOutcome | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    curriculumType: "merdeka" as "merdeka" | "k13",
    subjectId: subjects[0]?.id || "subj_mtk",
    gradeLevel: 8,
    phase: "D",
    elementOrCoreCompetency: "Aljabar dan Fungsi",
    description: "",
    indicators: ["Menjelaskan konsep persamaan", "Menyelesaikan masalah kontekstual"],
  });

  const filteredCurriculums = curriculums.filter((c) => {
    const matchSubj = selectedSubjectId === "all" || c.subjectId === selectedSubjectId;
    const matchType = selectedCurriculumType === "all" || c.curriculumType === selectedCurriculumType;
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSubj && matchType && matchSearch;
  });

  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `CP-${formData.phase}-${subjects[0]?.code || "MTK"}-0${curriculums.length + 1}`,
      title: "",
      curriculumType: schoolProfile.activeCurriculum,
      subjectId: subjects[0]?.id || "subj_mtk",
      gradeLevel: 8,
      phase: "D",
      elementOrCoreCompetency: "",
      description: "",
      indicators: [""],
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: LearningOutcome) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      title: item.title,
      curriculumType: item.curriculumType,
      subjectId: item.subjectId,
      gradeLevel: item.gradeLevel,
      phase: item.phase || "D",
      elementOrCoreCompetency: item.elementOrCoreCompetency || "",
      description: item.description,
      indicators: item.indicators && item.indicators.length > 0 ? item.indicators : [""],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.code) return;

    if (editingItem) {
      updateCurriculum(editingItem.id, formData);
    } else {
      addCurriculum(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kurikulum & Capaian Pembelajaran (CP/KD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Struktur kompetensi Capaian Pembelajaran (Kurikulum Merdeka) & Kompetensi Dasar (K13) sebagai acuan pembuatan soal & penilaian.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah CP / KD Baru</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode atau judul CP/KD..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={selectedCurriculumType}
            onChange={(e) => setSelectedCurriculumType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kurikulum</option>
            <option value="merdeka">Kurikulum Merdeka</option>
            <option value="k13">Kurikulum 2013</option>
          </select>
        </div>
      </div>

      {/* CP/KD Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCurriculums.map((curr) => {
          const subj = subjects.find((s) => s.id === curr.subjectId);

          return (
            <div
              key={curr.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {curr.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        curr.curriculumType === "merdeka"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {curr.curriculumType === "merdeka" ? "Kurikulum Merdeka" : "K-13"}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500">
                    Kelas {curr.gradeLevel} (Fase {curr.phase || "D"})
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3">{curr.title}</h3>
                <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {subj?.name} • Elemen: {curr.elementOrCoreCompetency}
                </div>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {curr.description}
                </p>

                {/* Indicators / TP */}
                {curr.indicators && curr.indicators.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tujuan Pembelajaran (TP) / Indikator:
                    </div>
                    <ul className="space-y-1">
                      {curr.indicators.map((ind, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(curr)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus CP/KD ${curr.code}?`)) deleteCurriculum(curr.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADD / EDIT CP */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Capaian Pembelajaran (CP/KD)" : "Tambah CP/KD Baru"}
        subtitle="Petakan target pembelajaran berdasarkan kurikulum nasional"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode CP / KD</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CP-D-MTK-01"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kurikulum</label>
              <select
                value={formData.curriculumType}
                onChange={(e) => setFormData({ ...formData, curriculumType: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="merdeka">Kurikulum Merdeka</option>
                <option value="k13">Kurikulum 2013</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Topik CP</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Memahami Teorema Pythagoras dan Tripel Pythagoras"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
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
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fase</label>
              <input
                type="text"
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                placeholder="D / E / F"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Elemen / Lingkup Materi</label>
            <input
              type="text"
              value={formData.elementOrCoreCompetency}
              onChange={(e) => setFormData({ ...formData, elementOrCoreCompetency: e.target.value })}
              placeholder="e.g. Geometri dan Pengukuran"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Lengkap Capaian</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Peserta didik mampu membuktikan dan mengaplikasikan..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm"
            >
              Simpan CP/KD
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
