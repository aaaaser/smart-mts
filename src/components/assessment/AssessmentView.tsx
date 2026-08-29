import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { StudentSubjectGrade } from "../../types";
import {
  Award,
  Filter,
  Download,
  Settings,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { exportGradesToExcel } from "../../lib/excelExport";

export const AssessmentView: React.FC = () => {
  const {
    currentUser,
    classes,
    subjects,
    users,
    studentGrades,
    gradeWeights,
    updateGradeWeights,
    upsertStudentGrade,
    processRemedial,
  } = useApp();

  const role = currentUser?.role || "admin";

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "cls_8a");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "subj_mtk");

  // Grade Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{
    studentId: string;
    studentName: string;
    dailyScores: number[];
    assignmentScores: number[];
    practicalScores: number[];
    midtermScore: number;
    finalScore: number;
    competencyDescription: string;
  } | null>(null);

  // Remedial Modal
  const [isRemedialModalOpen, setIsRemedialModalOpen] = useState(false);
  const [remedialData, setRemedialData] = useState<{ gradeId: string; studentName: string; score: number } | null>(
    null
  );

  // Weights Config Modal
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightsForm, setWeightsForm] = useState(gradeWeights);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const classStudents = users.filter((u) => u.role === "siswa" && u.classId === selectedClassId);

  const handleOpenEdit = (studentId: string, studentName: string) => {
    const existing = studentGrades.find(
      (g) => g.studentId === studentId && g.subjectId === selectedSubjectId
    );

    setEditingGrade({
      studentId,
      studentName,
      dailyScores: existing?.dailyScores || [80, 85],
      assignmentScores: existing?.assignmentScores || [82],
      practicalScores: existing?.practicalScores || [80],
      midtermScore: existing?.midtermScore || 80,
      finalScore: existing?.finalScore || 80,
      competencyDescription:
        existing?.competencyDescription ||
        "Menunjukkan penguasaan materi yang baik dalam menyelesaikan permasalahan kontekstual.",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;

    upsertStudentGrade({
      studentId: editingGrade.studentId,
      subjectId: selectedSubjectId,
      classId: selectedClassId,
      dailyScores: editingGrade.dailyScores,
      assignmentScores: editingGrade.assignmentScores,
      practicalScores: editingGrade.practicalScores,
      midtermScore: editingGrade.midtermScore,
      finalScore: editingGrade.finalScore,
      competencyDescription: editingGrade.competencyDescription,
    });

    setIsEditModalOpen(false);
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    updateGradeWeights(weightsForm);
    setIsWeightModalOpen(false);
  };

  const handleProcessRemedial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remedialData) return;
    processRemedial(remedialData.gradeId, remedialData.score);
    setIsRemedialModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengolahan Nilai & Asesmen</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Komposit nilai Harian (UH), Tugas, PTS, PAS dengan kalkulasi bobot otomatis & manajemen remedial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(role === "admin" || role === "guru") && (
            <button
              onClick={() => {
                setWeightsForm(gradeWeights);
                setIsWeightModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Atur Bobot Nilai</span>
            </button>
          )}

          <button
            onClick={() => exportGradesToExcel(selectedClass, selectedSubject, classStudents, studentGrades)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Leger Excel</span>
          </button>
        </div>
      </div>

      {/* Weights Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Formula Nilai Akhir (NA) Rapor</div>
            <div className="text-[11px] text-slate-400">
              NA = (Rata2 Harian × {gradeWeights.daily}%) + (PTS × {gradeWeights.midterm}%) + (PAS ×{" "}
              {gradeWeights.finalExam}%)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
            Harian: {gradeWeights.daily}%
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 font-bold">
            PTS: {gradeWeights.midterm}%
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-400 border border-slate-700 font-bold">
            PAS: {gradeWeights.finalExam}%
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700">Rombel:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700">Mata Pelajaran:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (KKM: {s.kkm})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRADES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">NIS & Siswa</th>
                <th className="px-3 py-3 text-center">Rata2 UH</th>
                <th className="px-3 py-3 text-center">Tugas</th>
                <th className="px-3 py-3 text-center">PTS</th>
                <th className="px-3 py-3 text-center">PAS</th>
                <th className="px-4 py-3 text-center">Nilai Akhir (NA)</th>
                <th className="px-3 py-3 text-center">Predikat</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {classStudents.map((std) => {
                const grd = studentGrades.find(
                  (g) => g.studentId === std.id && g.subjectId === selectedSubjectId
                );

                const avgUH = grd?.dailyScores?.length
                  ? Math.round(grd.dailyScores.reduce((a, b) => a + b, 0) / grd.dailyScores.length)
                  : "-";
                const avgAsg = grd?.assignmentScores?.length
                  ? Math.round(grd.assignmentScores.reduce((a, b) => a + b, 0) / grd.assignmentScores.length)
                  : "-";

                const isTuntas = grd ? grd.status === "tuntas" : true;

                return (
                  <tr key={std.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{std.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">NIS: {std.nipOrNis}</div>
                    </td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-800">{avgUH}</td>
                    <td className="px-3 py-3.5 text-center text-slate-800">{avgAsg}</td>
                    <td className="px-3 py-3.5 text-center text-slate-800">{grd?.midtermScore ?? "-"}</td>
                    <td className="px-3 py-3.5 text-center text-slate-800">{grd?.finalScore ?? "-"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-sm font-black text-emerald-600">
                        {grd?.finalCalculatedGrade ?? "-"}
                      </span>
                      {grd?.isRemedial && (
                        <span className="block text-[9px] font-bold text-amber-600 uppercase">
                          (Remedial: {grd.remedialScore})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center font-bold text-slate-900">{grd?.predicate ?? "-"}</td>
                    <td className="px-3 py-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isTuntas ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {isTuntas ? "Tuntas" : "Belum Tuntas"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(std.id, std.name)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                      >
                        Input / Edit
                      </button>

                      {grd && !isTuntas && (
                        <button
                          onClick={() => {
                            setRemedialData({
                              gradeId: grd.id,
                              studentName: std.name,
                              score: 75,
                            });
                            setIsRemedialModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                        >
                          Remedial
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT GRADE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Input Nilai: ${editingGrade?.studentName}`}
        subtitle={`Mata Pelajaran: ${selectedSubject?.name} • KKM: ${selectedSubject?.kkm}`}
        maxWidth="xl"
      >
        {editingGrade && (
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Ulangan Harian (UH 1)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.dailyScores[0] || 80}
                  onChange={(e) => {
                    const copy = [...editingGrade.dailyScores];
                    copy[0] = Number(e.target.value);
                    setEditingGrade({ ...editingGrade, dailyScores: copy });
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Ulangan Harian (UH 2)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.dailyScores[1] || 85}
                  onChange={(e) => {
                    const copy = [...editingGrade.dailyScores];
                    copy[1] = Number(e.target.value);
                    setEditingGrade({ ...editingGrade, dailyScores: copy });
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Rata-rata Tugas</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.assignmentScores[0] || 80}
                  onChange={(e) => {
                    const copy = [...editingGrade.assignmentScores];
                    copy[0] = Number(e.target.value);
                    setEditingGrade({ ...editingGrade, assignmentScores: copy });
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Praktik / Kinerja</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.practicalScores[0] || 80}
                  onChange={(e) => {
                    const copy = [...editingGrade.practicalScores];
                    copy[0] = Number(e.target.value);
                    setEditingGrade({ ...editingGrade, practicalScores: copy });
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai PTS / UTS</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.midtermScore}
                  onChange={(e) => setEditingGrade({ ...editingGrade, midtermScore: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nilai PAS / UAS</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingGrade.finalScore}
                  onChange={(e) => setEditingGrade({ ...editingGrade, finalScore: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Capaian Kompetensi (Narasi Rapor)
              </label>
              <textarea
                rows={3}
                value={editingGrade.competencyDescription}
                onChange={(e) => setEditingGrade({ ...editingGrade, competencyDescription: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm">
                Simpan & Hitung Nilai Akhir
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* WEIGHTS CONFIG MODAL */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Pengaturan Bobot Nilai Akhir (NA)"
        subtitle="Total ketiga komponen bobot harus tepat 100%"
      >
        <form onSubmit={handleSaveWeights} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bobot Harian (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightsForm.daily}
                onChange={(e) => setWeightsForm({ ...weightsForm, daily: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bobot PTS (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightsForm.midterm}
                onChange={(e) => setWeightsForm({ ...weightsForm, midterm: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bobot PAS (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={weightsForm.finalExam}
                onChange={(e) => setWeightsForm({ ...weightsForm, finalExam: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-bold text-slate-800">
            <span>Total Persentase:</span>
            <span
              className={
                weightsForm.daily + weightsForm.midterm + weightsForm.finalExam === 100
                  ? "text-emerald-600"
                  : "text-rose-600"
              }
            >
              {weightsForm.daily + weightsForm.midterm + weightsForm.finalExam}% (Harus 100%)
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={weightsForm.daily + weightsForm.midterm + weightsForm.finalExam !== 100}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl disabled:opacity-50"
            >
              Simpan Formula Bobot
            </button>
          </div>
        </form>
      </Modal>

      {/* REMEDIAL MODAL */}
      <Modal
        isOpen={isRemedialModalOpen}
        onClose={() => setIsRemedialModalOpen(false)}
        title={`Input Nilai Remedial: ${remedialData?.studentName}`}
        subtitle="Nilai akhir remedial disesuaikan batas KKM standar"
      >
        {remedialData && (
          <form onSubmit={handleProcessRemedial} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Remedial Baru</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={remedialData.score}
                onChange={(e) => setRemedialData({ ...remedialData, score: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nilai remedial yang masuk rapor akan disesuaikan dengan KKM mata pelajaran ({selectedSubject?.kkm}).
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRemedialModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl shadow-sm">
                Proses Nilai Remedial
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
