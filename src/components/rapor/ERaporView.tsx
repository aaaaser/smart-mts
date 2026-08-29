import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  FileText,
  Printer,
  Download,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  School,
  Sparkles,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import { generateStudentRaporPDF } from "../../lib/pdfExport";
import { exportGradesToExcel } from "../../lib/excelExport";
import { Modal } from "../common/Modal";

export const ERaporView: React.FC = () => {
  const { currentUser, classes, subjects, users, studentGrades, attendanceRecords, schoolProfile } = useApp();

  const role = currentUser?.role || "admin";
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "cls_8a");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    role === "siswa" ? currentUser?.id || "student_01" : "student_01"
  );

  const [teacherNotes, setTeacherNotes] = useState<Record<string, string>>({
    student_01:
      "Ananda Dimas menunjukkan dedikasi belajar yang sangat tinggi. Terus tingkatkan kemampuan logika pada matematika dan sains.",
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [activeNoteText, setActiveNoteText] = useState("");

  const classStudents = users.filter((u) => u.role === "siswa" && u.classId === selectedClassId);
  const currentStudent = users.find((u) => u.id === selectedStudentId) || classStudents[0] || users[0];
  const selectedClass = classes.find((c) => c.id === currentStudent?.classId || selectedClassId);

  // Student specific grades
  const studentSubjectGrades = subjects.map((subj) => {
    const grd = studentGrades.find(
      (g) => g.studentId === currentStudent?.id && g.subjectId === subj.id
    );
    return {
      subject: subj,
      grade: grd,
      finalScore: grd?.finalCalculatedGrade || 84,
      predicate: grd?.predicate || "B+",
      desc:
        grd?.competencyDescription ||
        `Menunjukkan penguasaan yang sangat baik dalam memahami konsep dasar dan aplikasi ${subj.name}.`,
    };
  });

  // Attendance stats for student
  const studentAtts = attendanceRecords.filter((r) => r.userId === currentStudent?.id);
  const sakitCount = studentAtts.filter((r) => r.status === "sakit").length;
  const izinCount = studentAtts.filter((r) => r.status === "izin").length;
  const alpaCount = studentAtts.filter((r) => r.status === "alpa").length;

  const handlePrintPDF = () => {
    if (!currentStudent || !selectedClass) return;
    generateStudentRaporPDF(
      currentStudent,
      selectedClass,
      studentSubjectGrades,
      { sakit: sakitCount, izin: izinCount, alpa: alpaCount },
      schoolProfile,
      teacherNotes[currentStudent.id] ||
        "Ananda telah menunjukkan prestasi dan kepribadian yang sangat membanggakan selama semester ini."
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">E-Rapor Digital Terpadu</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan Hasil Belajar Siswa (Rapor Semester) berstandar Kurikulum Merdeka & K13 dengan tanda tangan digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF E-Rapor Resmi</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      {role !== "siswa" && (
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
            <label className="text-xs font-bold text-slate-700">Pilih Siswa:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 max-w-xs"
            >
              {classStudents.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.name} (NIS: {std.nipOrNis})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* RAPOR SHEET PREVIEW */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Rapor Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <img
              src={schoolProfile.logoUrl}
              alt="Logo Sekolah"
              className="w-16 h-16 object-contain rounded-xl p-1 border border-slate-200"
            />
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {schoolProfile.name}
              </h3>
              <p className="text-xs text-slate-600">{schoolProfile.address}</p>
              <div className="text-[11px] text-slate-400 mt-0.5">
                NPSN: {schoolProfile.npsn} • NSS: {schoolProfile.nss} • Akreditasi: {schoolProfile.accreditation}
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              LAPORAN HASIL BELAJAR (RAPOR)
            </span>
            <div className="text-xs font-bold text-slate-900 mt-1">
              Tahun Ajaran: {schoolProfile.academicYear} ({schoolProfile.semester.toUpperCase()})
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Kurikulum: {schoolProfile.activeCurriculum === "merdeka" ? "Kurikulum Merdeka" : "K13"}
            </div>
          </div>
        </div>

        {/* Student Biodata Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Peserta Didik</span>
            <div className="font-extrabold text-slate-900 mt-0.5">{currentStudent?.name}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">NIS / NISN</span>
            <div className="font-mono font-bold text-slate-800 mt-0.5">{currentStudent?.nipOrNis} / 0098234123</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Kelas / Rombel</span>
            <div className="font-bold text-slate-800 mt-0.5">{selectedClass?.name} (Fase D)</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Wali Kelas</span>
            <div className="font-bold text-slate-800 mt-0.5">{selectedClass?.homeroomTeacher || "Budi Santoso, S.Pd"}</div>
          </div>
        </div>

        {/* SECTION A: Nilai Akademik & Capaian Kompetensi */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
            A. Capaian Nilai Akademik & Kompetensi Pembelajaran
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 text-center w-10">No</th>
                  <th className="px-4 py-2.5">Mata Pelajaran</th>
                  <th className="px-3 py-2.5 text-center w-16">KKM</th>
                  <th className="px-3 py-2.5 text-center w-16">Nilai Akhir</th>
                  <th className="px-3 py-2.5 text-center w-16">Predikat</th>
                  <th className="px-4 py-2.5">Capaian Kompetensi / Deskripsi Kemajuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentSubjectGrades.map((item, idx) => (
                  <tr key={item.subject.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.subject.name}</td>
                    <td className="px-3 py-3 text-center text-slate-500 font-semibold">{item.subject.kkm}</td>
                    <td className="px-3 py-3 text-center font-black text-emerald-600 text-sm">
                      {item.finalScore}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">{item.predicate}</td>
                    <td className="px-4 py-3 text-slate-600 leading-relaxed text-[11px]">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION B & C: Ekstrakurikuler, Prestasi & Ketidakhadiran */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ekstrakurikuler & Prestasi */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase">B. Ekstrakurikuler & Prestasi</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-slate-900">Praja Muda Karana (Pramuka)</strong>
                  <div className="text-[10px] text-slate-500">Predikat: Sangat Baik (A)</div>
                </div>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <strong className="text-slate-900">Palang Merah Remaja (PMR)</strong>
                  <div className="text-[10px] text-slate-500">Predikat: Baik (B)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Ketidakhadiran */}
          <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase">C. Rekapitulasi Kehadiran</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sakit</span>
                <div className="text-base font-black text-slate-900 mt-1">{sakitCount} Hari</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Izin</span>
                <div className="text-base font-black text-slate-900 mt-1">{izinCount} Hari</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tanpa Ket.</span>
                <div className="text-base font-black text-slate-900 mt-1">{alpaCount} Hari</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION D: Catatan Wali Kelas */}
        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-emerald-950 uppercase">D. Catatan Wali Kelas</h4>
            {(role === "admin" || role === "guru") && (
              <button
                onClick={() => {
                  setActiveNoteText(
                    teacherNotes[currentStudent?.id || ""] ||
                      "Ananda telah menunjukkan prestasi dan kepribadian yang sangat membanggakan selama semester ini."
                  );
                  setIsNoteModalOpen(true);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Catatan</span>
              </button>
            )}
          </div>
          <p className="text-xs text-emerald-950 italic leading-relaxed">
            "{teacherNotes[currentStudent?.id || ""] ||
              "Ananda telah menunjukkan prestasi dan kepribadian yang sangat membanggakan selama semester ini. Pertahankan semangat belajar dan raih cita-citamu!"}"
          </p>
        </div>

        {/* Signature Area */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs text-slate-700">
          <div>
            <div className="text-[11px] text-slate-500">Mengetahui,</div>
            <div className="font-semibold mt-1">Orang Tua / Wali Siswa</div>
            <div className="h-16 flex items-end justify-center font-bold text-slate-400">
              ( ..................................... )
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-[11px] text-slate-500">Mengetahui,</div>
            <div className="font-semibold mt-1">Kepala Sekolah</div>
            <div className="h-16 flex flex-col justify-end items-center">
              <strong className="text-slate-900 underline">{schoolProfile.principalName}</strong>
              <span className="text-[10px] text-slate-500">NIP. {schoolProfile.principalNip}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500">
              {schoolProfile.city}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="font-semibold mt-1">Wali Kelas</div>
            <div className="h-16 flex flex-col justify-end items-center">
              <strong className="text-slate-900 underline">
                {selectedClass?.homeroomTeacher || "Budi Santoso, S.Pd"}
              </strong>
              <span className="text-[10px] text-slate-500">NIP. 19840215 200801 1 008</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT HOMEROOM TEACHER NOTE MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Edit Catatan Wali Kelas"
        subtitle={`Untuk Siswa: ${currentStudent?.name}`}
      >
        <div className="space-y-4">
          <textarea
            rows={4}
            value={activeNoteText}
            onChange={(e) => setActiveNoteText(e.target.value)}
            className="w-full p-3 text-xs border border-slate-200 rounded-xl"
            placeholder="Tuliskan catatan motivasi dan perkembangan karakter siswa..."
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentStudent) {
                  setTeacherNotes((prev) => ({
                    ...prev,
                    [currentStudent.id]: activeNoteText,
                  }));
                }
                setIsNoteModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
