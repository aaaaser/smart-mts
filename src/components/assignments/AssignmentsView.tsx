import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Assignment, AssignmentSubmission } from "../../types";
import {
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Award,
  Edit2,
  Trash2,
} from "lucide-react";
import { Modal } from "../common/Modal";

export const AssignmentsView: React.FC = () => {
  const {
    currentUser,
    assignments,
    addAssignment,
    deleteAssignment,
    assignmentSubmissions,
    submitAssignment,
    gradeAssignment,
    subjects,
    classes,
    users,
  } = useApp();

  const role = currentUser?.role || "admin";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAsgForGrading, setSelectedAsgForGrading] = useState<Assignment | null>(null);

  // Student Submit Modal
  const [selectedAsgForSubmit, setSelectedAsgForSubmit] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");

  // Grade Modal
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState(85);
  const [feedbackInput, setFeedbackInput] = useState("Pekerjaan sangat rapi dan lengkap.");

  const [asgFormData, setAsgFormData] = useState({
    title: "",
    subjectId: subjects[0]?.id || "subj_mtk",
    classId: classes[0]?.id || "cls_8a",
    description: "",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxScore: 100,
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgFormData.title) return;

    addAssignment({
      ...asgFormData,
      teacherId: currentUser?.id || "teacher_01",
    });
    setIsCreateModalOpen(false);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgForSubmit || !currentUser || !submissionContent.trim()) return;

    submitAssignment({
      assignmentId: selectedAsgForSubmit.id,
      studentId: currentUser.id,
      content: submissionContent,
    });

    setSelectedAsgForSubmit(null);
    setSubmissionContent("");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    gradeAssignment(gradingSubmission.id, gradeInput, feedbackInput);
    setGradingSubmission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tugas & Lembar Kerja Online</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan tugas mandiri, proyek kelompok, dan penyerahan lembar kerja siswa.
          </p>
        </div>

        {(role === "admin" || role === "guru") && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </button>
        )}
      </div>

      {/* Assignment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((asg) => {
          const subj = subjects.find((s) => s.id === asg.subjectId);
          const cls = classes.find((c) => c.id === asg.classId);
          const mySubmission = assignmentSubmissions.find(
            (s) => s.assignmentId === asg.id && s.studentId === currentUser?.id
          );
          const totalSubs = assignmentSubmissions.filter((s) => s.assignmentId === asg.id).length;

          return (
            <div
              key={asg.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                    {subj?.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{cls?.name}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">{asg.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{asg.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tenggat: {new Date(asg.deadline).toLocaleDateString("id-ID")}
                  </span>
                  <span className="font-bold text-slate-900">Max: {asg.maxScore} Poin</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                {role === "siswa" ? (
                  mySubmission ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {mySubmission.status === "graded" ? `Dinilai: ${mySubmission.score}/100` : "Terkumpul"}
                      </span>
                      <button
                        onClick={() => setSelectedAsgForSubmit(asg)}
                        className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAsgForSubmit(asg)}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Kumpulkan Tugas
                    </button>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => setSelectedAsgForGrading(asg)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      {totalSubs} Pengumpulan ({totalSubs > 0 ? "Periksa" : "Menunggu"})
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus tugas ${asg.title}?`)) deleteAssignment(asg.id);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700"
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

      {/* STUDENT SUBMISSION MODAL */}
      <Modal
        isOpen={!!selectedAsgForSubmit}
        onClose={() => setSelectedAsgForSubmit(null)}
        title="Kumpulkan Jawaban Tugas"
        subtitle={selectedAsgForSubmit?.title}
      >
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700">
            <strong>Instruksi Guru:</strong> {selectedAsgForSubmit?.description}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jawaban / Catatan / Tautan Laporan Tugas
            </label>
            <textarea
              rows={4}
              required
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Tuliskan teks jawaban atau tautan Google Drive / link dokumen tugas Anda di sini..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAsgForSubmit(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm cursor-pointer"
            >
              Unggah & Kirimkan
            </button>
          </div>
        </form>
      </Modal>

      {/* TEACHER SUBMISSIONS GRADING MODAL */}
      <Modal
        isOpen={!!selectedAsgForGrading}
        onClose={() => setSelectedAsgForGrading(null)}
        title={`Daftar Pengumpulan: ${selectedAsgForGrading?.title}`}
        subtitle="Periksa dan beri nilai hasil pekerjaan siswa"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {assignmentSubmissions.filter((s) => s.assignmentId === selectedAsgForGrading?.id).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">Belum ada siswa yang mengumpulkan tugas ini.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignmentSubmissions
                .filter((s) => s.assignmentId === selectedAsgForGrading?.id)
                .map((sub) => {
                  const student = users.find((u) => u.id === sub.studentId);

                  return (
                    <div key={sub.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{student?.name || "Dimas Pratama"}</div>
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {sub.content}
                        </p>
                        {sub.feedback && (
                          <div className="text-[11px] text-emerald-700 mt-1">
                            <strong>Umpan Balik:</strong> {sub.feedback}
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {sub.status === "graded" ? (
                          <span className="font-bold text-xs text-emerald-600">Nilai: {sub.score}/100</span>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeInput(85);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                          >
                            Beri Nilai
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </Modal>

      {/* GIVE SCORE MODAL */}
      <Modal
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title="Input Nilai & Umpan Balik Guru"
        subtitle="Berikan penilaian formatif konstruktif"
      >
        <form onSubmit={handleSaveGrade} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nilai (0 - 100)</label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={gradeInput}
              onChange={(e) => setGradeInput(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Umpan Balik / Catatan Guru</label>
            <textarea
              rows={3}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Berikan saran perbaikan atau apresiasi..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setGradingSubmission(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm">
              Simpan Nilai
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Tugas Baru"
        subtitle="Tentukan petunjuk tugas dan tenggat waktu pengumpulan"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              value={asgFormData.title}
              onChange={(e) => setAsgFormData({ ...asgFormData, title: e.target.value })}
              placeholder="e.g. Proyek Observasi Ekosistem Lingkungan Sekolah"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={asgFormData.subjectId}
                onChange={(e) => setAsgFormData({ ...asgFormData, subjectId: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Sasaran</label>
              <select
                value={asgFormData.classId}
                onChange={(e) => setAsgFormData({ ...asgFormData, classId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi / Petunjuk Pengerjaan</label>
            <textarea
              rows={3}
              required
              value={asgFormData.description}
              onChange={(e) => setAsgFormData({ ...asgFormData, description: e.target.value })}
              placeholder="Jelaskan tahapan pengerjaan tugas dan kriteria penilaian..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tenggat Waktu (Deadline)</label>
              <input
                type="date"
                value={asgFormData.deadline.split("T")[0]}
                onChange={(e) => setAsgFormData({ ...asgFormData, deadline: new Date(e.target.value).toISOString() })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maksimal Poin</label>
              <input
                type="number"
                value={asgFormData.maxScore}
                onChange={(e) => setAsgFormData({ ...asgFormData, maxScore: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
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
              Umumkan Tugas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
