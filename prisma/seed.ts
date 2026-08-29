import { PrismaClient, Role, Gender, EmploymentStatus, StudentStatus, SemesterType, CurriculumType, AssignmentTypeCategory, AttendanceSessionType, AttendanceStatus, AttendanceMethod, QuestionType, DifficultyLevel, CognitiveLevel, ExamCategory, ExamStatus, AttemptStatus, AssignmentStatus, SubmissionStatus, ReportCardStatus, BlogStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generateRandomToken(prefix = "SMTS"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

async function main() {
  console.log("🌱 Starting smart MTs (sMTs) Database Seeding...");

  // 1. Clear existing data in reverse relation order
  console.log("🧹 Cleaning up old records...");
  await prisma.contactMessage.deleteMany();
  await prisma.organizationStructure.deleteMany();
  await prisma.blogPostTag.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.blogTag.deleteMany();
  await prisma.blogCategory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.reportCardSubject.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.remedial.deleteMany();
  await prisma.dailyGrade.deleteMany();
  await prisma.midtermGrade.deleteMany();
  await prisma.finalGrade.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.gradeWeight.deleteMany();
  await prisma.assessmentCategory.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.examAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.material.deleteMany();
  await prisma.learningObjective.deleteMany();
  await prisma.competency.deleteMany();
  await prisma.learningOutcome.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.extracurricularMember.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.teacherAssignmentType.deleteMany();
  await prisma.extracurricular.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.studentClassMembership.deleteMany();
  await prisma.class.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.userQrCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.schoolSetting.deleteMany();

  // Hash default passwords
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordGuru = await bcrypt.hash("smtslogin", 10);
  const passwordSiswa = await bcrypt.hash("siswa123", 10);

  // 2. School Settings
  console.log("🏫 Creating School Setting...");
  await prisma.schoolSetting.create({
    data: {
      name: "smart MTs (sMTs)",
      npsn: "20108921",
      nss: "121131710001",
      accreditation: "A (Unggul)",
      tagline: "Sistem Manajemen Madrasah Terpadu",
      motto: "Belajar, berkembang, dan berprestasi bersama.",
      vision: "Mewujudkan generasi madrasah yang unggul dalam Imtaq dan Iptek, berakhlak mulia, berkarakter moderat, dan kompetitif global.",
      mission: "1. Menyelenggarakan pendidikan madrasah terpadu berkualitas tinggi.\n2. Mengintegrasikan teknologi cerdas dalam pembelajaran & manajemen.\n3. Menumbuhkan budaya literasi, sains, dan tahfidz Al-Qur'an.\n4. Membina prestasi akademik dan non-akademik berdaya saing nasional.",
      values: "INTEGRITAS, ISLAMI, INOVATIF, INKLUSIF, INSPIRATIF",
      address: "Jl. Madrasah Terpadu No. 12, Kebayoran Baru, Jakarta Selatan",
      phone: "(021) 7890123",
      email: "info@smts.sch.id",
      website: "https://smts.sch.id",
      logoUrl: "",
      principalName: "Dr. H. Ahmad Fauzi, M.Pd.I.",
      principalNip: "197205141998031002",
      activeAcademicYear: "2025/2026",
      activeSemester: "Ganjil",
      activeCurriculum: "merdeka",
      passingGradeDefault: 75,
      schoolStartTime: "07:00",
      schoolLateLimit: "07:15",
      schoolEndTime: "15:00",
      operatingHours: "Senin - Jumat: 06.30 - 15.30 WIB | Sabtu: 07.00 - 12.00 WIB",
      socialMedia: JSON.stringify({
        facebook: "@smts.official",
        instagram: "@smts_madrasah",
        youtube: "@sMTsOfficialChannel",
      }),
    },
  });

  // 3. Academic Years & Semesters
  console.log("📅 Creating Academic Years & Semesters...");
  const ay2025 = await prisma.academicYear.create({
    data: {
      name: "2025/2026",
      startDate: new Date("2025-07-15"),
      endDate: new Date("2026-06-25"),
      isActive: true,
    },
  });

  const ay2026 = await prisma.academicYear.create({
    data: {
      name: "2026/2027",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2027-06-25"),
      isActive: false,
    },
  });

  const sem1 = await prisma.semester.create({
    data: {
      academicYearId: ay2025.id,
      name: SemesterType.GANJIL,
      startDate: new Date("2025-07-15"),
      endDate: new Date("2025-12-20"),
      isActive: true,
    },
  });

  const sem2 = await prisma.semester.create({
    data: {
      academicYearId: ay2025.id,
      name: SemesterType.GENAP,
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-06-25"),
      isActive: false,
    },
  });

  // 4. Classes (VII-A, VII-B, VIII-A, VIII-B, IX-A)
  console.log("🏫 Creating Classes...");
  const class7A = await prisma.class.create({
    data: { name: "VII-A", gradeLevel: 7, academicYearId: ay2025.id, capacity: 32, isActive: true },
  });
  const class7B = await prisma.class.create({
    data: { name: "VII-B", gradeLevel: 7, academicYearId: ay2025.id, capacity: 32, isActive: true },
  });
  const class8A = await prisma.class.create({
    data: { name: "VIII-A", gradeLevel: 8, academicYearId: ay2025.id, capacity: 32, isActive: true },
  });
  const class8B = await prisma.class.create({
    data: { name: "VIII-B", gradeLevel: 8, academicYearId: ay2025.id, capacity: 32, isActive: true },
  });
  const class9A = await prisma.class.create({
    data: { name: "IX-A", gradeLevel: 9, academicYearId: ay2025.id, capacity: 32, isActive: true },
  });

  // 5. Subjects
  console.log("📚 Creating Subjects...");
  const subjectsData = [
    { code: "PAI-01", name: "Al-Qur'an Hadits", category: "Wajib", kkm: 75.0 },
    { code: "PAI-02", name: "Akidah Akhlak", category: "Wajib", kkm: 75.0 },
    { code: "PAI-03", name: "Fikih", category: "Wajib", kkm: 75.0 },
    { code: "PAI-04", name: "Sejarah Kebudayaan Islam (SKI)", category: "Wajib", kkm: 75.0 },
    { code: "BIND-01", name: "Bahasa Indonesia", category: "Wajib", kkm: 75.0 },
    { code: "MTK-01", name: "Matematika", category: "Wajib", kkm: 72.0 },
    { code: "IPA-01", name: "IPA Terpadu", category: "Wajib", kkm: 75.0 },
    { code: "IPS-01", name: "IPS Terpadu", category: "Wajib", kkm: 75.0 },
    { code: "BING-01", name: "Bahasa Inggris", category: "Wajib", kkm: 75.0 },
    { code: "BARAB-01", name: "Bahasa Arab", category: "Wajib", kkm: 75.0 },
    { code: "INF-01", name: "Informatika", category: "Wajib", kkm: 78.0 },
    { code: "PJOK-01", name: "PJOK", category: "Wajib", kkm: 78.0 },
  ];

  const subjectsMap: Record<string, any> = {};
  for (const s of subjectsData) {
    const created = await prisma.subject.create({ data: s });
    subjectsMap[s.code] = created;
  }

  // 6. Admin User
  console.log("👤 Creating Admin User & QR Code...");
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@mtsn1jakarta.sch.id",
      passwordHash: passwordAdmin,
      role: Role.ADMIN,
      isActive: true,
      qrCodes: {
        create: {
          qrToken: "SMTS-ADM-001-ALPHA",
          isActive: true,
        },
      },
    },
  });

  // 7. Teachers (Minimal 5)
  console.log("👩‍🏫 Creating Teachers & Multiple Duty Assignments...");
  const teachersSeed = [
    {
      username: "aisyah",
      email: "aisyah@mtsn1jakarta.sch.id",
      fullName: "Nur Aisyah, M.Pd.",
      nip: "198203152008012015",
      nuptk: "4532760662200022",
      nik: "3174055503820001",
      gender: Gender.P,
      phone: "081234567891",
      employmentStatus: EmploymentStatus.PNS,
      mainSubjectCode: "BIND-01",
      address: "Jl. Fatmawati No. 14, Jakarta Selatan",
    },
    {
      username: "fauzi",
      email: "fauzi@mtsn1jakarta.sch.id",
      fullName: "Ahmad Fauzi, S.Pd.",
      nip: "198506202010011021",
      nuptk: "6741763665200013",
      nik: "3174052006850002",
      gender: Gender.L,
      phone: "081234567892",
      employmentStatus: EmploymentStatus.PNS,
      mainSubjectCode: "MTK-01",
      address: "Jl. Pejaten Raya No. 45, Jakarta Selatan",
    },
    {
      username: "rahma",
      email: "rahma@mtsn1jakarta.sch.id",
      fullName: "Siti Rahma, S.Pd.I",
      nip: "199011122019032014",
      nuptk: "8934768670200031",
      nik: "3174055211900003",
      gender: Gender.P,
      phone: "081234567893",
      employmentStatus: EmploymentStatus.PPPK,
      mainSubjectCode: "PAI-01",
      address: "Jl. Ragunan No. 8, Pasar Minggu",
    },
    {
      username: "budi",
      email: "budi@mtsn1jakarta.sch.id",
      fullName: "Budi Santoso, S.Kom.",
      nip: "198804102015031005",
      nuptk: "2356766668200042",
      nik: "3174051004880004",
      gender: Gender.L,
      phone: "081234567894",
      employmentStatus: EmploymentStatus.GTY,
      mainSubjectCode: "INF-01",
      address: "Jl. Cilandak Tengah No. 22, Jakarta Selatan",
    },
    {
      username: "dewi",
      email: "dewi@mtsn1jakarta.sch.id",
      fullName: "Dewi Lestari, M.Si.",
      nip: "198709082014022008",
      nuptk: "5678765667200053",
      nik: "3174054809870005",
      gender: Gender.P,
      phone: "081234567895",
      employmentStatus: EmploymentStatus.PNS,
      mainSubjectCode: "IPA-01",
      address: "Jl. Margasatwa No. 19, Ragunan",
    },
    {
      username: "shodiq",
      email: "shodiq@mtsn1jakarta.sch.id",
      fullName: "Drs. Shodiq, M.Pd.",
      nip: "197905152005011008",
      nuptk: "1234567890123456",
      nik: "3174051505790006",
      gender: Gender.L,
      phone: "081234567896",
      employmentStatus: EmploymentStatus.PNS,
      mainSubjectCode: "PAI-01",
      address: "Jl. Kebagusan Raya No. 15, Jakarta Selatan",
    },
    {
      username: "arief",
      email: "arief@mtsn1jakarta.sch.id",
      fullName: "Arief Rahman, S.Kom.",
      nip: "198610102012031007",
      nuptk: "2234567890123456",
      nik: "3174051010860007",
      gender: Gender.L,
      phone: "081234567897",
      employmentStatus: EmploymentStatus.GTY,
      mainSubjectCode: "INF-01",
      address: "Jl. Cilandak KKO No. 21, Jakarta Selatan",
    },
    {
      username: "ridwan",
      email: "ridwan@mtsn1jakarta.sch.id",
      fullName: "H. Ridwan Fauzi, S.Ag.",
      nip: "197812122004121006",
      nuptk: "3234567890123456",
      nik: "3174051212780008",
      gender: Gender.L,
      phone: "081234567898",
      employmentStatus: EmploymentStatus.PNS,
      mainSubjectCode: "PAI-01",
      address: "Jl. Mampang Prapatan No. 32, Jakarta Selatan",
    },
  ];

  const createdTeachers: Record<string, any> = {};

  for (const t of teachersSeed) {
    const user = await prisma.user.create({
      data: {
        username: t.username,
        email: t.email,
        passwordHash: passwordGuru,
        role: Role.TEACHER,
        isActive: true,
        mustChangePassword: true,
        qrCodes: {
          create: {
            qrToken: generateRandomToken("SMTS-TCH"),
            isActive: true,
          },
        },
        teacher: {
          create: {
            fullName: t.fullName,
            nip: t.nip,
            nuptk: t.nuptk,
            nik: t.nik,
            email: t.email,
            phone: t.phone,
            gender: t.gender,
            employmentStatus: t.employmentStatus,
            address: t.address,
          },
        },
      },
      include: {
        teacher: true,
        qrCodes: true,
      },
    });

    createdTeachers[t.username] = user.teacher!;

    // Link TeacherSubject
    if (subjectsMap[t.mainSubjectCode]) {
      await prisma.teacherSubject.create({
        data: {
          teacherId: user.teacher!.id,
          subjectId: subjectsMap[t.mainSubjectCode].id,
          academicYearId: ay2025.id,
          semesterId: sem1.id,
        },
      });
    }
  }

  // Automatic Validation of Required Teachers
  const requiredTeacherKeys = [
    "aisyah",
    "fauzi",
    "rahma",
    "budi",
    "dewi",
    "shodiq",
    "arief",
    "ridwan",
  ];

  for (const key of requiredTeacherKeys) {
    if (!createdTeachers[key]) {
      throw new Error(
        `Seed configuration error: teacher '${key}' was not created`
      );
    }

    if (!createdTeachers[key].userId) {
      throw new Error(
        `Seed configuration error: teacher '${key}' has no userId`
      );
    }
  }

  // 8. Teacher Assignment Types & Extracurriculars
  console.log("🎖️ Creating Teacher Assignment Types & Extracurriculars...");
  const typeHomeroom = await prisma.teacherAssignmentType.create({
    data: {
      code: AssignmentTypeCategory.HOMEROOM_TEACHER,
      name: "Wali Kelas",
      description: "Membina dan mengelola satu rombongan belajar / kelas",
    },
  });

  const typeDuty = await prisma.teacherAssignmentType.create({
    data: {
      code: AssignmentTypeCategory.DUTY_TEACHER,
      name: "Guru Piket",
      description: "Menjaga ketertiban, absensi gerbang, dan rekap piket harian",
    },
  });

  const typeEkskul = await prisma.teacherAssignmentType.create({
    data: {
      code: AssignmentTypeCategory.EXTRACURRICULAR_COACH,
      name: "Pembina Ekstrakurikuler",
      description: "Membina kegiatan minat dan bakat siswa di luar jam belajar",
    },
  });

  const typeCoord = await prisma.teacherAssignmentType.create({
    data: {
      code: AssignmentTypeCategory.COORDINATOR,
      name: "Koordinator",
      description: "Memimpin bidang koordinasi khusus madrasah",
    },
  });

  // Extracurriculars
  const ekskulPramuka = await prisma.extracurricular.create({
    data: {
      name: "Pramuka Gudep MTsN 1",
      category: "Kepemimpinan",
      leadTeacherId: createdTeachers["aisyah"].id,
      scheduleDay: "Jumat",
      scheduleTime: "14:30 - 16:30",
      location: "Lapangan Utama Madrasah",
      description: "Gerakan kepanduan pramuka penggalang MTsN 1",
      academicYearId: ay2025.id,
    },
  });

  const ekskulRobotik = await prisma.extracurricular.create({
    data: {
      name: "Klub Robotik & Coding",
      category: "Sains & Teknologi",
      leadTeacherId: createdTeachers["budi"].id,
      scheduleDay: "Sabtu",
      scheduleTime: "09:00 - 11:30",
      location: "Lab Komputer & IoT",
      description: "Pelatihan IoT, Arduino, dan pemrograman robotik",
      academicYearId: ay2025.id,
    },
  });

  const ekskulTahfidz = await prisma.extracurricular.create({
    data: {
      name: "Tahfidz Al-Qur'an",
      category: "Keagamaan",
      leadTeacherId: createdTeachers["rahma"].id,
      scheduleDay: "Selasa & Kamis",
      scheduleTime: "15:30 - 17:00",
      location: "Masjid Baitul 'Ilmi",
      description: "Program bimbingan hafalan Al-Qur'an juz 30 & juz 1-5",
      academicYearId: ay2025.id,
    },
  });

  // 9. Assign MULTIPLE ASSIGNMENTS to Bu Nur Aisyah (As requested: 4 duties!)
  console.log("📋 Assigning 4 Multiple Duties to Bu Nur Aisyah...");
  const aisyahId = createdTeachers["aisyah"].id;

  // Assignment 1: Wali Kelas VII-A
  await prisma.teacherAssignment.create({
    data: {
      teacherId: aisyahId,
      assignmentTypeId: typeHomeroom.id,
      name: "Wali Kelas VII-A",
      classId: class7A.id,
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
      notes: "Bertanggung jawab atas 32 siswa kelas VII-A",
    },
  });

  // Assignment 2: Guru Piket Senin
  await prisma.teacherAssignment.create({
    data: {
      teacherId: aisyahId,
      assignmentTypeId: typeDuty.id,
      name: "Guru Piket Senin",
      dayOfWeek: "Senin",
      startTime: "06:30",
      endTime: "14:30",
      location: "Gerbang Utama & Pos Piket",
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
      notes: "Menyambut kedatangan siswa, scanner QR gerbang, dan kontrol KBM",
    },
  });

  // Assignment 3: Pembina Pramuka
  await prisma.teacherAssignment.create({
    data: {
      teacherId: aisyahId,
      assignmentTypeId: typeEkskul.id,
      name: "Pembina Pramuka Penggalang",
      extracurricularId: ekskulPramuka.id,
      dayOfWeek: "Jumat",
      startTime: "14:30",
      endTime: "16:30",
      location: "Lapangan Utama",
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
      notes: "Latihan rutin penggalang ramu, rakit, terap",
    },
  });

  // Assignment 4: Koordinator Literasi
  await prisma.teacherAssignment.create({
    data: {
      teacherId: aisyahId,
      assignmentTypeId: typeCoord.id,
      name: "Koordinator Gerakan Literasi Madrasah (Gelem)",
      location: "Perpustakaan & Ruang Multimedia",
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
      notes: "Program 15 menit membaca sebelum KBM dan pojok baca kelas",
    },
  });

  // Other teacher assignments
  await prisma.teacherAssignment.create({
    data: {
      teacherId: createdTeachers["fauzi"].id,
      assignmentTypeId: typeHomeroom.id,
      name: "Wali Kelas VIII-A",
      classId: class8A.id,
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
    },
  });

  await prisma.teacherAssignment.create({
    data: {
      teacherId: createdTeachers["budi"].id,
      assignmentTypeId: typeEkskul.id,
      name: "Pembina Robotik",
      extracurricularId: ekskulRobotik.id,
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      status: "aktif",
      isActive: true,
    },
  });

  // 10. Students (Minimal 30 Students across classes VII-A, VII-B, VIII-A, VIII-B, IX-A)
  console.log("👨‍🎓 Creating 30 Students with Class Memberships & Unique QR Codes...");
  const studentNames = [
    { name: "Ahmad Fauzan Rabbani", gender: Gender.L, class: class7A, nis: "242507001", nisn: "0098765401" },
    { name: "Aisyah Zahira Nur", gender: Gender.P, class: class7A, nis: "242507002", nisn: "0098765402" },
    { name: "Bilal Al-Ghifari", gender: Gender.L, class: class7A, nis: "242507003", nisn: "0098765403" },
    { name: "Cut Meutia Salsabila", gender: Gender.P, class: class7A, nis: "242507004", nisn: "0098765404" },
    { name: "Dzaky Pratama Putra", gender: Gender.L, class: class7A, nis: "242507005", nisn: "0098765405" },
    { name: "Fatima Az-Zahra", gender: Gender.P, class: class7A, nis: "242507006", nisn: "0098765406" },

    { name: "Galih Wicaksono", gender: Gender.L, class: class7B, nis: "242507007", nisn: "0098765407" },
    { name: "Hafizhah Khairunnisa", gender: Gender.P, class: class7B, nis: "242507008", nisn: "0098765408" },
    { name: "Ibrahim Maulana", gender: Gender.L, class: class7B, nis: "242507009", nisn: "0098765409" },
    { name: "Jihan Farhana", gender: Gender.P, class: class7B, nis: "242507010", nisn: "0098765410" },
    { name: "Kareem Al-Farisi", gender: Gender.L, class: class7B, nis: "242507011", nisn: "0098765411" },
    { name: "Luthfiah Hanum", gender: Gender.P, class: class7B, nis: "242507012", nisn: "0098765412" },

    { name: "Muhammad Rizky Ramadhan", gender: Gender.L, class: class8A, nis: "232408001", nisn: "0088765401" },
    { name: "Nabila Putri Syahrani", gender: Gender.P, class: class8A, nis: "232408002", nisn: "0088765402" },
    { name: "Omar Khalid Hakim", gender: Gender.L, class: class8A, nis: "232408003", nisn: "0088765403" },
    { name: "Putri Anggraini", gender: Gender.P, class: class8A, nis: "232408004", nisn: "0088765404" },
    { name: "Qaisar Rafi Akbar", gender: Gender.L, class: class8A, nis: "232408005", nisn: "0088765405" },
    { name: "Rania Shakila", gender: Gender.P, class: class8A, nis: "232408006", nisn: "0088765406" },

    { name: "Salman Al-Farisy", gender: Gender.L, class: class8B, nis: "232408007", nisn: "0088765407" },
    { name: "Tazkia Aulia", gender: Gender.P, class: class8B, nis: "232408008", nisn: "0088765408" },
    { name: "Umar Abdullah", gender: Gender.L, class: class8B, nis: "232408009", nisn: "0088765409" },
    { name: "Vina Marwah", gender: Gender.P, class: class8B, nis: "232408010", nisn: "0088765410" },
    { name: "Wildan Firdaus", gender: Gender.L, class: class8B, nis: "232408011", nisn: "0088765411" },
    { name: "Yasmin Nurul Izzah", gender: Gender.P, class: class8B, nis: "232408012", nisn: "0088765412" },

    { name: "Zaidan Ilham Pratama", gender: Gender.L, class: class9A, nis: "222309001", nisn: "0078765401" },
    { name: "Adinda Tri Wardani", gender: Gender.P, class: class9A, nis: "222309002", nisn: "0078765402" },
    { name: "Bagus Setiawan", gender: Gender.L, class: class9A, nis: "222309003", nisn: "0078765403" },
    { name: "Chairun Nisa", gender: Gender.P, class: class9A, nis: "222309004", nisn: "0078765404" },
    { name: "Daffa Kurniawan", gender: Gender.L, class: class9A, nis: "222309005", nisn: "0078765405" },
    { name: "Elvira Maharani", gender: Gender.P, class: class9A, nis: "222309006", nisn: "0078765406" },
  ];

  const createdStudents: any[] = [];

  for (let idx = 0; idx < studentNames.length; idx++) {
    const s = studentNames[idx];
    const username = `siswa_${s.nis}`;

    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@siswa.mtsn1jakarta.sch.id`,
        passwordHash: passwordSiswa,
        role: Role.STUDENT,
        isActive: true,
        qrCodes: {
          create: {
            qrToken: `SMTS-STU-${s.nis}-${generateRandomToken("QR").split("-")[1]}`,
            isActive: true,
          },
        },
        student: {
          create: {
            nis: s.nis,
            nisn: s.nisn,
            fullName: s.name,
            gender: s.gender,
            entryYear: s.class.gradeLevel === 7 ? 2025 : s.class.gradeLevel === 8 ? 2024 : 2023,
            status: StudentStatus.ACTIVE,
            address: `Jl. Madrasah Raya RT 0${(idx % 5) + 1}/RW 03, Jakarta Selatan`,
          },
        },
      },
      include: {
        student: true,
        qrCodes: true,
      },
    });

    // Create StudentClassMembership (Historical Tracking)
    await prisma.studentClassMembership.create({
      data: {
        studentId: user.student!.id,
        classId: s.class.id,
        academicYearId: ay2025.id,
        status: "ACTIVE",
      },
    });

    createdStudents.push({
      ...user.student,
      user,
      classId: s.class.id,
      className: s.class.name,
    });
  }

  // 11. Class-Subject Assignments & Schedules
  console.log("🗓️ Creating Class Subjects & Schedules...");
  for (const cls of [class7A, class7B, class8A, class8B, class9A]) {
    for (const subCode of ["BIND-01", "MTK-01", "PAI-01", "IPA-01", "INF-01"]) {
      await prisma.classSubject.create({
        data: {
          classId: cls.id,
          subjectId: subjectsMap[subCode].id,
          academicYearId: ay2025.id,
          semesterId: sem1.id,
          hoursPerWeek: 4,
        },
      });
    }
  }

  // Schedule Examples
  await prisma.schedule.create({
    data: {
      dayOfWeek: "Senin",
      startTime: "07:30",
      endTime: "09:00",
      classId: class7A.id,
      subjectId: subjectsMap["BIND-01"].id,
      teacherId: createdTeachers["aisyah"].id,
      room: "Ruang VII-A",
      academicYearId: ay2025.id,
      semesterId: sem1.id,
    },
  });

  await prisma.schedule.create({
    data: {
      dayOfWeek: "Senin",
      startTime: "09:15",
      endTime: "10:45",
      classId: class7A.id,
      subjectId: subjectsMap["MTK-01"].id,
      teacherId: createdTeachers["fauzi"].id,
      room: "Ruang VII-A",
      academicYearId: ay2025.id,
      semesterId: sem1.id,
    },
  });

  // 12. Unified Attendance Sessions & Attendance Records (Hadir, Terlambat, Izin, Sakit, Alpa)
  console.log("⏱️ Creating Attendance Sessions & Records (Unified Scanner Flow)...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailySession = await prisma.attendanceSession.create({
    data: {
      title: "Absensi Gerbang & Piket Madrasah",
      sessionType: AttendanceSessionType.DAILY,
      academicYearId: ay2025.id,
      semesterId: sem1.id,
      date: today,
      startTime: "06:30",
      endTime: "08:00",
      lateAfter: "07:15",
      status: "aktif",
      createdBy: adminUser.id,
    },
  });

  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.SICK,
    AttendanceStatus.EXCUSED,
    AttendanceStatus.ABSENT,
  ];

  // Seed attendance for teachers
  for (let i = 0; i < teachersSeed.length; i++) {
    const t = createdTeachers[teachersSeed[i].username];
    const user = await prisma.user.findUnique({ where: { id: t.userId } });
    if (user) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId: dailySession.id,
          userId: user.id,
          scannedBy: adminUser.id,
          status: i === 1 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
          method: AttendanceMethod.QR_SCAN,
          deviceInfo: "Scanner Gerbang Utama (POS-01)",
          notes: i === 1 ? "Hadir pukul 07:22 WIB" : "Hadir tepat waktu",
        },
      });
    }
  }

  // Seed attendance for students
  for (let i = 0; i < createdStudents.length; i++) {
    const s = createdStudents[i];
    const stat = statuses[i % statuses.length];
    await prisma.attendanceRecord.create({
      data: {
        sessionId: dailySession.id,
        userId: s.userId,
        scannedBy: createdTeachers["aisyah"].userId,
        status: stat,
        method: AttendanceMethod.QR_SCAN,
        deviceInfo: "Tablet Piket - Bu Nur Aisyah",
        notes: stat === AttendanceStatus.LATE ? "Terlambat 10 menit" : stat === AttendanceStatus.SICK ? "Surat dokter terlampir" : "",
      },
    });
  }

  // 13. Curriculum, Learning Outcomes (CP), Competencies (KD), TP & Materials
  console.log("📖 Creating Curriculum & Learning Objectives...");
  const currMerdeka = await prisma.curriculum.create({
    data: {
      subjectId: subjectsMap["BIND-01"].id,
      curriculumType: CurriculumType.MERDEKA,
      name: "Kurikulum Merdeka - Fase D",
      gradeLevel: 7,
    },
  });

  const cpBind = await prisma.learningOutcome.create({
    data: {
      curriculumId: currMerdeka.id,
      subjectId: subjectsMap["BIND-01"].id,
      code: "CP-BIND-01",
      title: "Membaca dan Memirsa Teks Deskripsi",
      phase: "Fase D",
      gradeLevel: 7,
      element: "Membaca dan Memirsa",
      description: "Peserta didik mampu mengevaluasi informasi dan menemukan ide pokok serta struktur teks deskripsi.",
    },
  });

  const tpBind = await prisma.learningObjective.create({
    data: {
      learningOutcomeId: cpBind.id,
      code: "TP 7.1",
      statement: "Mengidentifikasi struktur dan kebahasaan teks deskripsi dengan tepat.",
      indicators: "1. Menentukan objek deskripsi\n2. Menjelaskan majas personifikasi\n3. Menyusun simpulan teks",
    },
  });

  // 14. Question Bank & Questions
  console.log("📝 Creating Question Bank & Questions...");
  const qbBind = await prisma.questionBank.create({
    data: {
      subjectId: subjectsMap["BIND-01"].id,
      title: "Bank Soal Teks Deskripsi & Narasi Kelas 7",
      description: "Kumpulan soal pilihan ganda, essay, dan HOTS teks deskripsi",
    },
  });

  const q1 = await prisma.question.create({
    data: {
      questionBankId: qbBind.id,
      subjectId: subjectsMap["BIND-01"].id,
      learningOutcomeId: cpBind.id,
      learningObjectiveId: tpBind.id,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.SEDANG,
      cognitiveLevel: CognitiveLevel.C3,
      questionText: "Paragraf yang menggambarkan suatu objek secara rinci sehingga pembaca seolah-olah melihat dan merasakan langsung disebut teks...",
      correctAnswer: "A",
      explanation: "Teks deskripsi menggambarkan objek secara jelas dan terperinci dengan melibatkan panca indra.",
      points: 10,
      options: {
        create: [
          { optionKey: "A", optionText: "Deskripsi", isCorrect: true },
          { optionKey: "B", optionText: "Eksposisi", isCorrect: false },
          { optionKey: "C", optionText: "Narasi", isCorrect: false },
          { optionKey: "D", optionText: "Laporan", isCorrect: false },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      questionBankId: qbBind.id,
      subjectId: subjectsMap["BIND-01"].id,
      learningOutcomeId: cpBind.id,
      learningObjectiveId: tpBind.id,
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.HOTS,
      cognitiveLevel: CognitiveLevel.C4,
      questionText: "'Ombak bergulung-gulung saling berkejaran menyapa bibir pantai berpasir putih.' Majas yang digunakan pada kalimat tersebut adalah...",
      correctAnswer: "B",
      explanation: "Majas personifikasi melekatkan sifat manusia (saling berkejaran, menyapa) pada benda mati (ombak).",
      points: 10,
      options: {
        create: [
          { optionKey: "A", optionText: "Metafora", isCorrect: false },
          { optionKey: "B", optionText: "Personifikasi", isCorrect: true },
          { optionKey: "C", optionText: "Hiperbola", isCorrect: false },
          { optionKey: "D", optionText: "Litotes", isCorrect: false },
        ],
      },
    },
  });

  // 15. Exams & Exam Attempts
  console.log("💻 Creating Exams & Student Attempts...");
  const examUH = await prisma.exam.create({
    data: {
      title: "Penilaian Harian 1: Teks Deskripsi",
      category: ExamCategory.UH,
      subjectId: subjectsMap["BIND-01"].id,
      teacherId: createdTeachers["aisyah"].id,
      semesterId: sem1.id,
      classIds: JSON.stringify([class7A.id, class7B.id]),
      date: new Date(),
      startTime: "08:00",
      endTime: "09:30",
      durationMinutes: 90,
      passingGrade: 75.0,
      status: ExamStatus.ACTIVE,
      questions: {
        create: [
          { questionId: q1.id, orderIndex: 1 },
          { questionId: q2.id, orderIndex: 2 },
        ],
      },
    },
  });

  // Sample student attempts
  const stu7A = createdStudents.filter((s) => s.classId === class7A.id);
  for (let i = 0; i < stu7A.length; i++) {
    const student = stu7A[i];
    const score = i === 0 ? 95 : i === 1 ? 85 : 78;
    await prisma.examAttempt.create({
      data: {
        examId: examUH.id,
        studentId: student.id,
        score,
        maxScore: 100,
        percentage: score,
        passed: score >= 75,
        status: AttemptStatus.SUBMITTED,
      },
    });
  }

  // 16. Assignments & Submissions
  console.log("📑 Creating Assignments & Student Submissions...");
  const deadlineNextWeek = new Date();
  deadlineNextWeek.setDate(deadlineNextWeek.getDate() + 7);

  const asg1 = await prisma.assignment.create({
    data: {
      teacherId: createdTeachers["aisyah"].id,
      subjectId: subjectsMap["BIND-01"].id,
      classId: class7A.id,
      title: "Menulis Teks Deskripsi Objek Wisata Nusantara",
      description: "Buat karangan teks deskripsi 3-4 paragraf yang mendeskripsikan keindahan alam Indonesia dengan kaidah bahasa yang baik.",
      instructions: "Gunakan minimal 2 majas personifikasi dan perhatikan penggunaan huruf kapital.",
      deadline: deadlineNextWeek,
      maxScore: 100,
      status: AssignmentStatus.ACTIVE,
    },
  });

  // Submissions
  for (let i = 0; i < Math.min(3, stu7A.length); i++) {
    const s = stu7A[i];
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: asg1.id,
        studentId: s.id,
        answerText: "Keindahan Pantai Parangtritis di kala senja... Ombak berkejaran dengan lembut menyentuh tepian.",
        score: 88 + i * 4,
        feedback: "Struktur deskripsi sangat lengkap dan pilihan kata variatif.",
        status: SubmissionStatus.GRADED,
        gradedBy: createdTeachers["aisyah"].fullName,
        gradedAt: new Date(),
      },
    });
  }

  // 17. Grade Weights & Student Grades
  console.log("⚖️ Creating Grade Weights & Student Grades...");
  await prisma.gradeWeight.create({
    data: {
      academicYearId: ay2025.id,
      dailyWeight: 40.0,
      midtermWeight: 25.0,
      finalWeight: 35.0,
    },
  });

  for (const stu of createdStudents) {
    const dailyScores = [82, 86, 90];
    const avgDaily = (82 + 86 + 90) / 3;
    const pts = 85;
    const pas = 88;
    const finalCalc = Math.round(avgDaily * 0.4 + pts * 0.25 + pas * 0.35);

    await prisma.grade.create({
      data: {
        studentId: stu.id,
        subjectId: subjectsMap["BIND-01"].id,
        classId: stu.classId,
        academicYearId: ay2025.id,
        semesterId: sem1.id,
        dailyScores: JSON.stringify(dailyScores),
        assignmentScores: JSON.stringify([88, 92]),
        practicalScores: JSON.stringify([85]),
        midtermScore: pts,
        finalScore: pas,
        finalCalculatedGrade: finalCalc,
        predicate: finalCalc >= 85 ? "A" : "B",
        competencyDescription: "Sangat baik dalam mengevaluasi ide pokok dan membedah struktur kebahasaan teks deskripsi.",
        status: "tuntas",
        isRemedial: false,
      },
    });
  }

  // 18. Digital Report Cards (E-Rapor)
  console.log("📊 Creating Digital Report Cards...");
  for (const s of stu7A) {
    const rc = await prisma.reportCard.create({
      data: {
        studentId: s.id,
        classId: s.classId,
        academicYearId: ay2025.id,
        semesterId: sem1.id,
        issuePlace: "Jakarta",
        attendanceHadir: 78,
        attendanceSakit: 1,
        attendanceIzin: 1,
        attendanceAlpa: 0,
        extracurriculars: JSON.stringify([
          { name: "Pramuka", predicate: "Sangat Baik", description: "Aktif dalam perkemahan sabtu-minggu dan kepemimpinan regu." },
        ]),
        achievements: JSON.stringify([
          { title: "Juara 2 Lomba Pidato Bahasa Indonesia", level: "Kecamatan", year: "2025" },
        ]),
        homeroomNotes: "Pertahankan prestasi belajar, kedisiplinan beribadah, dan keaktifan berorganisasi.",
        status: ReportCardStatus.DRAFT,
      },
    });

    await prisma.reportCardSubject.create({
      data: {
        reportCardId: rc.id,
        subjectId: subjectsMap["BIND-01"].id,
        finalScore: 87,
        predicate: "A",
        description: "Menunjukkan pemahaman yang sangat mendalam pada kompetensi teks deskripsi.",
      },
    });
  }

  // 19. Announcements, Notifications & Audit Logs
  console.log("📢 Creating Announcements & Audit Logs...");
  await prisma.announcement.create({
    data: {
      title: "Sosialisasi Asesmen Sumatif Tengah Semester (ASTS) Ganjil",
      content: "Pelaksanaan ASTS Ganjil TP 2025/2026 akan diselenggarakan serentak menggunakan sistem smart MTs CBT berbasis QR Token.",
      target: "ALL",
      author: "Kepala Madrasah - Drs. H. Ahmad Dahlan, M.Pd.I",
    },
  });

  await prisma.notification.create({
    data: {
      userId: createdTeachers["aisyah"].userId,
      title: "Jadwal Tugas Tambahan Baru",
      message: "Anda telah ditugaskan sebagai Guru Piket Senin dan Pembina Pramuka TP 2025/2026.",
      type: "info",
    },
  });

  // 20. Blog Categories & Tags
  console.log("📝 Creating Blog Categories & Tags...");
  const catBerita = await prisma.blogCategory.create({
    data: { name: "Berita Madrasah", slug: "berita-madrasah", description: "Warta terkini kegiatan dan informasi resmi madrasah" },
  });
  const catPendidikan = await prisma.blogCategory.create({
    data: { name: "Pendidikan & Kurikulum", slug: "pendidikan-dan-kurikulum", description: "Artikel pedagogik, Kurikulum Merdeka, dan metode belajar" },
  });
  const catPrestasi = await prisma.blogCategory.create({
    data: { name: "Prestasi Siswa", slug: "prestasi-siswa", description: "Kabar gembira kejuaraan sains, seni, olahraga, dan riset" },
  });
  const catKegiatan = await prisma.blogCategory.create({
    data: { name: "Kegiatan & Ekskul", slug: "kegiatan-dan-ekskul", description: "Dokumentasi perkemahan, matsama, classmeeting, dan ekskul" },
  });
  const catArtikelGuru = await prisma.blogCategory.create({
    data: { name: "Artikel Guru", slug: "artikel-guru", description: "Opini edukatif, karya ilmiah, dan refleksi pembelajaran guru" },
  });
  const catTips = await prisma.blogCategory.create({
    data: { name: "Tips Belajar", slug: "tips-belajar", description: "Panduan belajar efektif, manajemen waktu, dan persiapan ujian" },
  });
  const catKeagamaan = await prisma.blogCategory.create({
    data: { name: "Keagamaan & Karakter", slug: "keagamaan-dan-karakter", description: "Kajian islami, tahfidz, akhlakul karimah, dan bina karakter" },
  });

  const tagAkademik = await prisma.blogTag.create({ data: { name: "Akademik", slug: "akademik" } });
  const tagMatsama = await prisma.blogTag.create({ data: { name: "Matsama", slug: "matsama" } });
  const tagKurikulum = await prisma.blogTag.create({ data: { name: "Kurikulum Merdeka", slug: "kurikulum-merdeka" } });
  const tagPrestasi = await prisma.blogTag.create({ data: { name: "Prestasi", slug: "prestasi" } });
  const tagTahfidz = await prisma.blogTag.create({ data: { name: "Tahfidz", slug: "tahfidz" } });
  const tagInovasi = await prisma.blogTag.create({ data: { name: "Inovasi Guru", slug: "inovasi-guru" } });

  // 21. Blog Posts (5 PUBLISHED, 2 DRAFT, 2 SUBMITTED, 1 REJECTED)
  console.log("📰 Creating Blog Posts...");
  const p1 = await prisma.blogPost.create({
    data: {
      authorId: adminUser.id,
      categoryId: catBerita.id,
      title: "Selamat Datang di Website Resmi smart MTs",
      slug: "selamat-datang-di-website-resmi-smart-mts",
      excerpt: "smart MTs resmi meluncurkan portal digital terpadu untuk absensi, pembelajaran, CBT, dan layanan informasi publik madrasah.",
      content: `Puji syukur kita panjatkan ke hadirat Allah SWT, atas rahmat dan karunia-Nya portal resmi smart MTs (sMTs) kini hadir sebagai jembatan informasi dan pusat ekosistem digital madrasah.

Di era transformasi digital, madrasah dituntut tidak hanya unggul dalam pembentukan akhlakul karimah, namun juga adaptif terhadap kemajuan sains dan teknologi. Melalui platform smart MTs, seluruh proses administrasi mulai dari absensi terpadu satu scanner, bank soal CBT Kurikulum Merdeka, penugasan ganda guru, hingga digitalisasi e-rapor dapat diakses secara transparan dan akurat.

Semoga portal ini menjadi media silaturahmi yang produktif bagi para guru, siswa, wali murid, serta masyarakat luas. Mari bersama mewujudkan madrasah maju, bermutu, dan mendunia.`,
      coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.PUBLISHED,
      views: 340,
      isFeatured: true,
      publishedAt: new Date("2026-07-15T08:00:00.000Z"),
    },
  });
  await prisma.blogPostTag.create({ data: { postId: p1.id, tagId: tagAkademik.id } });

  const p2 = await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["aisyah"].userId,
      categoryId: catPendidikan.id,
      title: "Semangat Belajar di Tahun Ajaran Baru 2026/2027",
      slug: "semangat-belajar-di-tahun-ajaran-baru",
      excerpt: "Menyambut tahun pelajaran baru dengan semangat baru, Kurikulum Merdeka Fase D, dan pembelajaran berbasis proyek interaktif.",
      content: `Tahun ajaran baru adalah kanvas kosong yang siap kita lukis dengan pencapaian dan kebiasaan-kebiasaan baik. Seluruh dewan guru sMTs telah menyiapkan modul pembelajaran terdiferensiasi yang menyenangkan dan kontekstual.

Siswa diajak tidak sekadar menghafal rumus atau teori, melainkan memahami relevansi ilmu pengetahuan dalam kehidupan sehari-hari melalui Profil Pelajar Rahmatan Lil Alamin. Kami mengajak seluruh siswa untuk aktif memanfaatkan fitur latihan soal interaktif dan bank materi digital yang telah disediakan.`,
      coverImage: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.PUBLISHED,
      views: 215,
      isFeatured: false,
      publishedAt: new Date("2026-07-20T09:30:00.000Z"),
    },
  });
  await prisma.blogPostTag.create({ data: { postId: p2.id, tagId: tagKurikulum.id } });

  const p3 = await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["shodiq"].userId,
      categoryId: catKegiatan.id,
      title: "Kegiatan Matsama Tahun Pelajaran 2026/2027 Berlangsung Meriah",
      slug: "kegiatan-matsama-tahun-pelajaran-2026-2027",
      excerpt: "Masa Ta'aruf Siswa Madrasah (Matsama) diisi dengan pengenalan budaya madrasah, workshop literasi digital, dan pentas seni islami.",
      content: `Selama tiga hari penuh keceriaan, sebanyak ratusan peserta didik baru kelas VII mengikuti rangkaian Masa Ta'aruf Siswa Madrasah (Matsama). Kegiatan ini bertujuan menumbuhkan rasa persaudaraan (ukhuwah islamiyah), mengenalkan tata tertib madrasah, serta melatih kedisiplinan sejak dini.

Puncak acara ditandai dengan parade ekstrakurikuler, unjuk kreasi regu pramuka, demonstrasi robotik madrasah, dan pembacaan ikrar integritas siswa sMTs.`,
      coverImage: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.PUBLISHED,
      views: 489,
      isFeatured: true,
      publishedAt: new Date("2026-07-25T11:00:00.000Z"),
    },
  });
  await prisma.blogPostTag.create({ data: { postId: p3.id, tagId: tagMatsama.id } });

  const p4 = await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["arief"].userId,
      categoryId: catPrestasi.id,
      title: "Prestasi Siswa smart MTs di Ajang Kompetisi Sains Madrasah",
      slug: "prestasi-siswa-smart-mts-di-ajang-ksm",
      excerpt: "Tim Olimpiade IPA dan Matematika smart MTs berhasil memborong 3 medali emas dan 2 perak pada KSM tingkat provinsi.",
      content: `Kabar membanggakan kembali dipersembahkan oleh duta sains smart MTs. Setelah melalui tahapan seleksi ketat dan bimbingan intensif club sains madrasah, para siswa berhasil menorehkan prestasi gemilang pada Kompetisi Sains Madrasah (KSM).

Kepala Madrasah mengapresiasi dedikasi para guru pembimbing dan orang tua yang senantiasa memberikan doa serta dukungan moril. Prestasi ini membuktikan bahwa siswa madrasah mampu bersaing di panggung sains bergengsi dengan tetap menjunjung nilai-nilai kejujuran.`,
      coverImage: "https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.PUBLISHED,
      views: 520,
      isFeatured: false,
      publishedAt: new Date("2026-08-05T14:15:00.000Z"),
    },
  });
  await prisma.blogPostTag.create({ data: { postId: p4.id, tagId: tagPrestasi.id } });

  const p5 = await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["dewi"].userId,
      categoryId: catArtikelGuru.id,
      title: "Guru dan Tenaga Kependidikan: Menginspirasi dengan Hati",
      slug: "guru-dan-tenaga-kependidikan-menginspirasi-dengan-hati",
      excerpt: "Refleksi peran pendidik di era digital bukan sekadar transfer ilmu, melainkan menanamkan nilai kearifan dan welas asih.",
      content: `Di tengah gempuran kecerdasan buatan dan derasnya arus informasi internet, sentuhan kemanusiaan dan keteladanan seorang guru tetap menjadi pilar yang tak tergantikan.

Menjadi pendidik di madrasah adalah amanah dakwah dan pengabdian. Setiap sapaan ramah di pagi hari, bimbingan sabar saat murid menemui jalan buntu, serta doa tulus yang dipanjatkan para guru adalah bekal abadi bagi pembentukan karakter generasi penerus bangsa.`,
      coverImage: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.PUBLISHED,
      views: 180,
      isFeatured: false,
      publishedAt: new Date("2026-08-12T10:00:00.000Z"),
    },
  });
  await prisma.blogPostTag.create({ data: { postId: p5.id, tagId: tagInovasi.id } });

  // 2 DRAFT Posts
  await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["aisyah"].userId,
      categoryId: catPendidikan.id,
      title: "Panduan Penyusunan Modul Ajar Berbasis Diferensiasi",
      slug: "panduan-penyusunan-modul-ajar-diferensiasi",
      excerpt: "Draft rancangan panduan praktis asesmen diagnostik dan diferensiasi konten bagi guru madrasah.",
      content: "Draft artikel masih dalam proses penulisan oleh Ibu Nur Aisyah...",
      status: BlogStatus.DRAFT,
      views: 0,
    },
  });

  await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["dewi"].userId,
      categoryId: catTips.id,
      title: "Strategi Efektif Meningkatkan Minat Baca Siswa Madrasah",
      slug: "strategi-efektif-meningkatkan-minat-baca",
      excerpt: "Catatan ide pojok baca digital dan program gemar membaca buku cerita islami.",
      content: "Draft artikel catatan literasi sedang dihimpun...",
      status: BlogStatus.DRAFT,
      views: 0,
    },
  });

  // 2 SUBMITTED Posts (Menunggu Review Admin)
  await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["arief"].userId,
      categoryId: catPendidikan.id,
      title: "Eksplorasi Pembelajaran Sains Berbasis Laboratorium Virtual",
      slug: "eksplorasi-pembelajaran-sains-berbasis-lab-virtual",
      excerpt: "Memanfaatkan simulasi interaktif PhET dalam pemahaman konsep fisika dan kimia dasar di tingkat MTs.",
      content: `Integrasi laboratorium virtual memberi ruang bagi peserta didik untuk bereksperimen dengan aman, mandiri, dan bebas resiko. Melalui visualisasi interaktif gaya kinetik dan reaksi kimia sederhana, pemahaman konseptual siswa meningkat secara signifikan.

Artikel ini menguraikan tahapan praktis penggabungan simulasi PhET dengan lembar kerja siswa terstruktur yang telah diujicobakan pada kelas VIII sMTs.`,
      coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.SUBMITTED,
      submittedAt: new Date("2026-08-28T07:30:00.000Z"),
      views: 0,
    },
  });

  await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["shodiq"].userId,
      categoryId: catKeagamaan.id,
      title: "Menumbuhkan Jiwa Kepemimpinan Islami Melalui Ekstrakurikuler",
      slug: "menumbuhkan-jiwa-kepemimpinan-islami",
      excerpt: "Bagaimana kegiatan organisasi kepanduan dan OSIS membentuk mental disiplin, tanggung jawab, dan amanah.",
      content: `Kepemimpinan dalam pandangan Islam adalah khidmah (pelayanan) dan pertanggungjawaban. Dalam wadah ekstrakurikuler madrasah, siswa dilatih berdiskusi, mengelola program kerja bakti sosial, dan menghargai perbedaan pandangan secara santun.`,
      coverImage: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=1200&auto=format&fit=crop&q=80",
      status: BlogStatus.SUBMITTED,
      submittedAt: new Date("2026-08-28T09:00:00.000Z"),
      views: 0,
    },
  });

  // 1 REJECTED Post (dengan alasan penolakan)
  await prisma.blogPost.create({
    data: {
      authorId: createdTeachers["aisyah"].userId,
      categoryId: catBerita.id,
      title: "Daftar Toko Penjual Seragam dan Buku Non-Kurikulum",
      slug: "daftar-toko-penjual-seragam-dan-buku",
      excerpt: "Informasi toko rekanan perlengkapan madrasah di sekitar area kecamatan.",
      content: "Konten yang bersifat komersial dan belum diverifikasi secara resmi oleh pihak madrasah...",
      status: BlogStatus.REJECTED,
      rejectedAt: new Date("2026-08-27T10:00:00.000Z"),
      rejectionReason: "Konten memuat promosi komersial pihak ketiga yang belum sesuai dengan panduan publikasi resmi madrasah. Mohon disesuaikan dengan topik edukatif.",
      views: 0,
    },
  });

  // 22. Organization Structure Hierarchy
  console.log("🏛️ Creating Organization Structure...");
  const orgKepala = await prisma.organizationStructure.create({
    data: {
      name: "Dr. H. Ahmad Fauzi, M.Pd.I.",
      position: "Kepala Madrasah",
      department: "Pimpinan",
      level: 0,
      order: 1,
      description: "Penanggung jawab utama kebijakan akademik, manajerial, dan kemitraan madrasah.",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
      isActive: true,
    },
  });

  const orgKomite = await prisma.organizationStructure.create({
    data: {
      name: "H. Abdul Wahab, S.E.",
      position: "Ketua Komite Madrasah",
      department: "Komite",
      level: 1,
      parentId: orgKepala.id,
      order: 2,
      description: "Mitra strategis representasi wali murid dalam pengawasan dan peningkatan mutu madrasah.",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      isActive: true,
    },
  });

  const orgTU = await prisma.organizationStructure.create({
    data: {
      name: "Drs. Bambang Sudarmono, M.M.",
      position: "Kepala Tata Usaha",
      department: "Tata Usaha",
      level: 1,
      parentId: orgKepala.id,
      order: 3,
      description: "Koordinator administrasi kepegawaian, keuangan, persuratan, dan layanan publik madrasah.",
      photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
      isActive: true,
    },
  });

  const orgWakaKurikulum = await prisma.organizationStructure.create({
    data: {
      name: createdTeachers["aisyah"].fullName,
      position: "Waka Bidang Kurikulum",
      department: "Kurikulum",
      level: 1,
      parentId: orgKepala.id,
      teacherId: createdTeachers["aisyah"].id,
      order: 4,
      description: "Pengembangan Kurikulum Merdeka, perencanaan jadwal KBM, evaluasi asesmen, dan digitalisasi e-rapor.",
      photo: createdTeachers["aisyah"].photo,
      isActive: true,
    },
  });

  const orgWakaKesiswaan = await prisma.organizationStructure.create({
    data: {
      name: createdTeachers["shodiq"].fullName,
      position: "Waka Bidang Kesiswaan",
      department: "Kesiswaan",
      level: 1,
      parentId: orgKepala.id,
      teacherId: createdTeachers["shodiq"].id,
      order: 5,
      description: "Pembinaan karakter siswa, kedisiplinan, Matsama, serta koordinasi OSIS & ekstrakurikuler.",
      photo: createdTeachers["shodiq"].photo,
      isActive: true,
    },
  });

  const orgWakaSarpras = await prisma.organizationStructure.create({
    data: {
      name: createdTeachers["arief"].fullName,
      position: "Waka Sarana & Prasarana",
      department: "Sarana Prasarana",
      level: 1,
      parentId: orgKepala.id,
      teacherId: createdTeachers["arief"].id,
      order: 6,
      description: "Pengelolaan laboratorium sains & IT, sarana smart classroom, perpustakaan, dan lingkungan madrasah.",
      photo: createdTeachers["arief"].photo,
      isActive: true,
    },
  });

  const orgWakaHumas = await prisma.organizationStructure.create({
    data: {
      name: createdTeachers["dewi"].fullName,
      position: "Waka Humas & Kemitraan",
      department: "Humas",
      level: 1,
      parentId: orgKepala.id,
      teacherId: createdTeachers["dewi"].id,
      order: 7,
      description: "Publikasi media resmi madrasah, kemitraan instansi, dan komunikasi harmonis dengan masyarakat.",
      photo: createdTeachers["dewi"].photo,
      isActive: true,
    },
  });

  // Level 2: Koordinator & Pembina
  const orgKoordTahfidz = await prisma.organizationStructure.create({
    data: {
      name: createdTeachers["ridwan"].fullName,
      position: "Koordinator Program Tahfidz & Keagamaan",
      department: "Kurikulum",
      level: 2,
      parentId: orgWakaKurikulum.id,
      teacherId: createdTeachers["ridwan"].id,
      order: 8,
      description: "Pembimbingan setoran hafalan Al-Qur'an dan pembiasaan sholat dhuha/dzuhur berjamaah.",
      photo: createdTeachers["ridwan"].photo,
      isActive: true,
    },
  });

  // Level 3: Dewan Guru & Wali Kelas
  await prisma.organizationStructure.create({
    data: {
      name: "Dewan Guru & Wali Kelas sMTs",
      position: "Pendidik & Pembimbing Rombongan Belajar",
      department: "Dewan Guru",
      level: 3,
      parentId: orgWakaKurikulum.id,
      order: 9,
      description: "Tim pendidik berdedikasi mengampu 20+ mata pelajaran dan membimbing kelas VII, VIII, IX.",
      photo: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&auto=format&fit=crop&q=80",
      isActive: true,
    },
  });

  // Level 4: Organisasi Siswa (OSIS)
  await prisma.organizationStructure.create({
    data: {
      name: "Pengurus OSIS & MPK smart MTs",
      position: "Organisasi Siswa Intra Madrasah",
      department: "Kesiswaan & Siswa",
      level: 4,
      parentId: orgWakaKesiswaan.id,
      order: 10,
      description: "Wadah kepemimpinan, kreativitas, dan aspirasi seluruh siswa madrasah.",
      photo: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=80",
      isActive: true,
    },
  });

  // 23. Sample Contact Inquiries
  console.log("📬 Creating Sample Contact Inquiries...");
  await prisma.contactMessage.create({
    data: {
      name: "Drs. Hendra Gunawan",
      email: "hendra.gunawan@gmail.com",
      phone: "081288997766",
      subject: "Informasi Pendaftaran Siswa Baru (PPDB) TP 2026/2027",
      message: "Assalamu'alaikum, kami ingin menanyakan jadwal pendaftaran jalur prestasi dan tahfidz untuk putra kami. Terima kasih.",
      isRead: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: "Administrator",
      userRole: "ADMIN",
      action: "DATABASE_SEED_BLOG_PUBLIC",
      details: "Inisialisasi data public website, blog publication workflow (5 published, 2 draft, 2 submitted, 1 rejected), struktur organisasi visual, dan setting madrasah.",
      ipOrDevice: "127.0.0.1 (Localhost Setup)",
    },
  });

  console.log("✅ Seeding completed successfully!");
  console.log("--------------------------------------------------");
  console.log("Default Login Credentials for Testing:");
  console.log("👉 Admin   : username 'admin'   / password 'admin123'");
  console.log("👉 Guru    : NIP '198203152008012015' (Nur Aisyah) / password 'smtslogin'");
  console.log("👉 Siswa   : NIS '242507001' (Ahmad Fauzan) / password 'siswa123'");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
