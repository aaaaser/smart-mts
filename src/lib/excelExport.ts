import * as XLSX from "xlsx";
import { User, StudentSubjectGrade, Subject, ClassRoom, AttendanceRecord } from "../types";

export const exportGradesToExcel = (
  classroom: ClassRoom | undefined,
  subject: Subject | undefined,
  students: User[],
  grades: StudentSubjectGrade[]
) => {
  const data = students.map((std, idx) => {
    const grd = grades.find((g) => g.studentId === std.id);
    const dailyAvg = grd?.dailyScores?.length
      ? Math.round(grd.dailyScores.reduce((a, b) => a + b, 0) / grd.dailyScores.length)
      : 0;
    const asgAvg = grd?.assignmentScores?.length
      ? Math.round(grd.assignmentScores.reduce((a, b) => a + b, 0) / grd.assignmentScores.length)
      : 0;
    const pracAvg = grd?.practicalScores?.length
      ? Math.round(grd.practicalScores.reduce((a, b) => a + b, 0) / grd.practicalScores.length)
      : 0;

    return {
      No: idx + 1,
      NIS: std.nipOrNis || "-",
      "Nama Siswa": std.name,
      "Rata2 Harian (UH)": dailyAvg,
      "Rata2 Tugas": asgAvg,
      "Praktik/Proyek": pracAvg,
      PTS: grd?.midtermScore || 0,
      PAS: grd?.finalScore || 0,
      "Nilai Akhir": grd?.finalCalculatedGrade || 0,
      Predikat: grd?.predicate || "-",
      Status: grd?.status === "tuntas" ? "TUNTAS" : "BELUM TUNTAS",
      "Nilai Remedial": grd?.isRemedial ? grd.remedialScore || "-" : "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");

  const fileName = `Rekap_Nilai_${classroom?.name || "Kelas"}_${subject?.name || "Mapel"}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportAttendanceToExcel = (
  classroomName: string,
  records: AttendanceRecord[],
  students: User[]
) => {
  const data = students.map((std, idx) => {
    const studentRecs = records.filter((r) => r.userId === std.id);
    const hadir = studentRecs.filter((r) => r.status === "hadir").length;
    const terlambat = studentRecs.filter((r) => r.status === "terlambat").length;
    const izin = studentRecs.filter((r) => r.status === "izin").length;
    const sakit = studentRecs.filter((r) => r.status === "sakit").length;
    const alpa = studentRecs.filter((r) => r.status === "alpa").length;
    const total = studentRecs.length || 1;
    const pct = Math.round(((hadir + terlambat) / total) * 100);

    return {
      No: idx + 1,
      NIS: std.nipOrNis || "-",
      "Nama Siswa": std.name,
      Hadir: hadir,
      Terlambat: terlambat,
      Izin: izin,
      Sakit: sakit,
      Alpa: alpa,
      "Total Pertemuan": studentRecs.length,
      "Persentase Kehadiran (%)": `${pct}%`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

  const fileName = `Rekap_Absensi_${classroomName}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportUsersToExcel = (users: User[], roleLabel: string) => {
  const data = users.map((u, idx) => ({
    No: idx + 1,
    "Nama Lengkap": u.name,
    "Username / Email": u.email,
    Role: u.role.toUpperCase(),
    "NIP / NIS": u.nipOrNis || "-",
    Telepon: u.phone || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Data ${roleLabel}`);

  XLSX.writeFile(workbook, `Data_${roleLabel}_EduSmart.xlsx`);
};
