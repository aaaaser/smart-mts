import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SchoolProfile, User, ClassRoom, Subject, StudentSubjectGrade, ReportCard, AttendanceRecord } from "../types";

export const generateReportCardPDF = (
  student: User,
  classroom: ClassRoom | undefined,
  school: SchoolProfile,
  grades: StudentSubjectGrade[],
  subjects: Subject[],
  reportCard: ReportCard | undefined,
  homeroomTeacher: User | undefined
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header / Kop Sekolah
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(school.name.toUpperCase(), 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`NPSN: ${school.npsn} | Alamat: ${school.address}`, 105, 23, { align: "center" });
  doc.text(`Telp: ${school.phone} | Email: ${school.email} | Website: ${school.website}`, 105, 27, { align: "center" });

  doc.setLineWidth(0.7);
  doc.line(15, 30, 195, 30);
  doc.setLineWidth(0.2);
  doc.line(15, 31, 195, 31);

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)", 105, 38, { align: "center" });

  // Student Identity Box
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const col1X = 15;
  const col2X = 110;
  let curY = 46;

  doc.text(`Nama Peserta Didik`, col1X, curY);
  doc.text(`: ${student.name}`, col1X + 35, curY);
  doc.text(`Kelas / Rombel`, col2X, curY);
  doc.text(`: ${classroom?.name || "-"}`, col2X + 30, curY);

  curY += 5;
  doc.text(`NIS / NISN`, col1X, curY);
  doc.text(`: ${student.nipOrNis || "-"}`, col1X + 35, curY);
  doc.text(`Fase / Semester`, col2X, curY);
  doc.text(`: Fase D / ${school.semester}`, col2X + 30, curY);

  curY += 5;
  doc.text(`Nama Sekolah`, col1X, curY);
  doc.text(`: ${school.name}`, col1X + 35, curY);
  doc.text(`Tahun Pelajaran`, col2X, curY);
  doc.text(`: ${school.academicYear}`, col2X + 30, curY);

  curY += 7;

  // Subjects Table
  const tableRows = subjects.map((subj, idx) => {
    const grd = grades.find((g) => g.subjectId === subj.id);
    return [
      idx + 1,
      subj.name,
      subj.kkm,
      grd?.finalCalculatedGrade ?? "-",
      grd?.predicate ?? "-",
      grd?.competencyDescription || "Mencapai kompetensi pembelajaran dengan baik.",
    ];
  });

  autoTable(doc, {
    startY: curY,
    head: [["No", "Mata Pelajaran", "KKM", "Nilai", "Predikat", "Capaian Kompetensi"]],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: "auto" },
    },
    margin: { left: 15, right: 15 },
  });

  // Attendance & Extracurriculars
  const finalY = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: finalY,
    head: [["Ekstrakurikuler", "Predikat", "Keterangan"], ["Ketidakhadiran", "Jumlah", "Keterangan"]],
    body: [
      ["Pramuka", reportCard?.extracurriculars?.[0]?.predicate || "Baik", reportCard?.extracurriculars?.[0]?.description || "Aktif dalam kegiatan kepanduan"],
      ["Sakit", `${reportCard?.attendanceSummary?.sakit ?? 0} hari`, "Surat dokter terlampir"],
      ["Izin", `${reportCard?.attendanceSummary?.izin ?? 0} hari`, "Surat izin orang tua"],
      ["Tanpa Keterangan", `${reportCard?.attendanceSummary?.alpa ?? 0} hari`, "Kehadiran disiplin"],
    ],
    theme: "grid",
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 15, right: 15 },
  });

  // Notes & Signatures
  const signY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Catatan Wali Kelas:", 15, signY);
  doc.setFont("helvetica", "normal");
  doc.text(reportCard?.homeroomNotes || "Pertahankan prestasi belajar dan tingkatkan keaktifan di kelas.", 15, signY + 4);

  const sigBaseY = signY + 18;
  doc.text("Mengetahui,", 25, sigBaseY);
  doc.text("Orang Tua / Wali", 25, sigBaseY + 4);
  doc.text("( ................................... )", 25, sigBaseY + 22);

  doc.text(`${reportCard?.issuePlace || "Jakarta"}, ${reportCard?.issueDate || "19 Desember 2025"}`, 130, sigBaseY);
  doc.text("Wali Kelas,", 130, sigBaseY + 4);
  doc.setFont("helvetica", "bold");
  doc.text(homeroomTeacher?.name || "Wali Kelas, S.Pd.", 130, sigBaseY + 22);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${homeroomTeacher?.nipOrNis || "-"}`, 130, sigBaseY + 26);

  doc.text("Kepala Sekolah", 80, sigBaseY + 12);
  doc.setFont("helvetica", "bold");
  doc.text(school.principalName, 80, sigBaseY + 28);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${school.principalNip}`, 80, sigBaseY + 32);

  doc.save(`Rapor_${student.name.replace(/\s+/g, "_")}_${classroom?.name || "8A"}.pdf`);
};

export const generateAttendanceRecapPDF = (
  classroomName: string,
  records: AttendanceRecord[],
  students: User[],
  subjectName: string,
  school: SchoolProfile
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(school.name.toUpperCase(), 105, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("REKAPITULASI PRESENSI KEHADIRAN SISWA", 105, 23, { align: "center" });
  doc.text(`Kelas: ${classroomName} | Mata Pelajaran: ${subjectName} | Tahun Ajaran: ${school.academicYear}`, 105, 27, { align: "center" });

  doc.line(15, 30, 195, 30);

  const rows = students.map((std, idx) => {
    const studentRecs = records.filter((r) => r.userId === std.id);
    const hadir = studentRecs.filter((r) => r.status === "hadir").length;
    const terlambat = studentRecs.filter((r) => r.status === "terlambat").length;
    const izin = studentRecs.filter((r) => r.status === "izin").length;
    const sakit = studentRecs.filter((r) => r.status === "sakit").length;
    const alpa = studentRecs.filter((r) => r.status === "alpa").length;
    const total = studentRecs.length || 1;
    const pct = Math.round(((hadir + terlambat) / total) * 100);

    return [idx + 1, std.nipOrNis || "-", std.name, hadir, terlambat, izin, sakit, alpa, `${pct}%`];
  });

  autoTable(doc, {
    startY: 35,
    head: [["No", "NIS", "Nama Siswa", "Hadir", "Telat", "Izin", "Sakit", "Alpa", "Kehadiran"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], halign: "center", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 22 },
      2: { cellWidth: 60 },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
      7: { halign: "center" },
      8: { halign: "center", fontStyle: "bold" },
    },
    margin: { left: 15, right: 15 },
  });

  doc.save(`Rekap_Absensi_${classroomName}_${subjectName}.pdf`);
};

export const generateStudentRaporPDF = (
  student: User,
  classroom: ClassRoom,
  subjectGrades: Array<{
    subject: Subject;
    grade?: StudentSubjectGrade;
    finalScore: number;
    predicate: string;
    desc: string;
  }>,
  attendanceSummary: { sakit: number; izin: number; alpa: number },
  school: SchoolProfile,
  homeroomNotes: string
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Kop Sekolah
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(school.name.toUpperCase(), 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`NPSN: ${school.npsn} | NSS: ${school.nss} | Akreditasi: ${school.accreditation}`, 105, 23, { align: "center" });
  doc.text(`${school.address}, ${school.city}`, 105, 27, { align: "center" });

  doc.setLineWidth(0.7);
  doc.line(15, 30, 195, 30);
  doc.setLineWidth(0.2);
  doc.line(15, 31, 195, 31);

  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN HASIL BELAJAR (RAPOR PESERTA DIDIK)", 105, 37, { align: "center" });

  // Student Identity Box
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const col1X = 15;
  const col2X = 115;
  let curY = 44;

  doc.text(`Nama Peserta Didik`, col1X, curY);
  doc.text(`: ${student.name}`, col1X + 35, curY);
  doc.text(`Kelas / Rombel`, col2X, curY);
  doc.text(`: ${classroom?.name || "-"} (Tingkat ${classroom?.gradeLevel || "8"})`, col2X + 30, curY);

  curY += 5;
  doc.text(`NIS / NISN`, col1X, curY);
  doc.text(`: ${student.nipOrNis || "-"} / 0098234123`, col1X + 35, curY);
  doc.text(`Semester / T.A.`, col2X, curY);
  doc.text(`: ${school.semester.toUpperCase()} / ${school.academicYear}`, col2X + 30, curY);

  curY += 5;
  doc.text(`Nama Sekolah`, col1X, curY);
  doc.text(`: ${school.name}`, col1X + 35, curY);
  doc.text(`Kurikulum`, col2X, curY);
  doc.text(`: ${school.activeCurriculum === "merdeka" ? "Kurikulum Merdeka" : "K-13"}`, col2X + 30, curY);

  curY += 6;

  // Academic Table
  const tableRows = subjectGrades.map((item, idx) => [
    idx + 1,
    item.subject.name,
    item.subject.kkm,
    item.finalScore,
    item.predicate,
    item.desc,
  ]);

  autoTable(doc, {
    startY: curY,
    head: [["No", "Mata Pelajaran", "KKM", "Nilai", "Predikat", "Capaian Kompetensi / Deskripsi Kemajuan"]],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 42, fontStyle: "bold" },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 14, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 16, halign: "center" },
      5: { cellWidth: "auto" },
    },
    margin: { left: 15, right: 15 },
  });

  // Ekstrakurikuler & Absensi
  const nextY = (doc as any).lastAutoTable.finalY + 4;

  autoTable(doc, {
    startY: nextY,
    head: [["Ekstrakurikuler", "Predikat", "Keterangan"], ["Ketidakhadiran", "Jumlah", "Keterangan"]],
    body: [
      ["Praja Muda Karana (Pramuka)", "Sangat Baik (A)", "Aktif dan berdedikasi dalam kepanduan."],
      ["Palang Merah Remaja (PMR)", "Baik (B)", "Mengikuti kegiatan pertolongan pertama."],
      ["Sakit", `${attendanceSummary.sakit} hari`, "Surat keterangan dokter terlampir"],
      ["Izin", `${attendanceSummary.izin} hari`, "Surat permohonan izin orang tua"],
      ["Tanpa Keterangan", `${attendanceSummary.alpa} hari`, "Kehadiran disiplin"],
    ],
    theme: "grid",
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 15, right: 15 },
  });

  // Homeroom note
  const signY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Catatan Wali Kelas:", 15, signY);
  doc.setFont("helvetica", "normal");
  doc.text(`"${homeroomNotes}"`, 15, signY + 4, { maxWidth: 180 });

  // Tanda Tangan
  const sigBaseY = signY + 16;
  doc.text("Mengetahui,", 25, sigBaseY);
  doc.text("Orang Tua / Wali Siswa", 25, sigBaseY + 4);
  doc.text("( ................................... )", 25, sigBaseY + 20);

  doc.text(`${school.city}, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 130, sigBaseY);
  doc.text("Wali Kelas,", 130, sigBaseY + 4);
  doc.setFont("helvetica", "bold");
  doc.text(classroom.homeroomTeacher || "Budi Santoso, S.Pd", 130, sigBaseY + 20);
  doc.setFont("helvetica", "normal");
  doc.text("NIP. 19840215 200801 1 008", 130, sigBaseY + 24);

  doc.text("Kepala Sekolah / Madrasah", 80, sigBaseY + 10);
  doc.setFont("helvetica", "bold");
  doc.text(school.principalName, 80, sigBaseY + 26);
  doc.setFont("helvetica", "normal");
  doc.text(`NIP. ${school.principalNip}`, 80, sigBaseY + 30);

  doc.save(`E-Rapor_${student.name.replace(/\s+/g, "_")}_${classroom.name}.pdf`);
};


