export type UserRole = "admin" | "guru" | "siswa" | "orangtua";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  nipOrNis?: string;
  nis?: string;
  nisn?: string;
  nip?: string;
  nuptk?: string;
  phone?: string;
  classId?: string; // For students
  gender?: "L" | "P"; // Laki-laki / Perempuan
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  enrollmentYear?: string;
  childStudentId?: string; // For parents
  childrenStudentIds?: string[]; // For parents
  subjectIds?: string[]; // For teachers
  teachingSubjectIds?: string[]; // For teachers
  teachingClassIds?: string[]; // For teachers
  // User Identity QR Code
  qrToken: string; // e.g. "SMTS-USER-8F4A92-XXXX"
  qrGeneratedAt?: string;
  qrIsActive?: boolean;
  mustChangePassword?: boolean;
}


export interface SchoolProfile {
  id: string;
  name: string;
  npsn: string;
  nss?: string;
  accreditation?: string;
  tagline?: string;
  motto?: string;
  vision?: string;
  mission?: string;
  values?: string;
  city?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  principalName: string;
  principalNip: string;
  academicYear: string; // e.g. "2025/2026"
  semester: "Ganjil" | "Genap" | "ganjil" | "genap";
  activeCurriculum: "merdeka" | "k13";
  passingGradeDefault: number; // e.g. 75
  operatingHours?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "VII-A", "VIII-B", "IX-A"
  gradeLevel: number; // 7, 8, 9, 10, 11, 12
  major?: string; // "Umum", "IPA", "IPS"
  homeroomTeacherId: string;
  homeroomTeacher?: string;
  academicYear: string;
  capacity: number;
  room?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: "Wajib" | "Peminatan" | "Mulok";
  gradeLevels: number[];
  gradeLevel?: number;
  teacherId?: string;
  hoursPerWeek?: number;
  kkm: number;
}


export interface ScheduleItem {
  id: string;
  day: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  startTime: string; // "07:30"
  endTime: string; // "09:00"
  subjectId: string;
  teacherId: string;
  classId: string;
  room: string;
  academicYear: string;
  semester: "Ganjil" | "Genap";
}

// Attendance
export interface AttendanceSession {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  token: string; // dynamic token
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export type AttendanceContextMode = "harian" | "pembelajaran" | "guru" | "kegiatan";

export interface AttendanceRecord {
  id: string;
  sessionId?: string; // session ID
  sessionTitle?: string;
  userId: string; // studentId or teacherId
  userType: "siswa" | "guru" | "admin";
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  ekskulId?: string;
  scannedBy?: string;
  date: string;
  time: string;
  status: "hadir" | "terlambat" | "izin" | "sakit" | "alpa";
  note?: string;
  deviceInfo?: string;
  method: "qr_scan" | "manual" | "location_scan";
}

export interface QRScanResult {
  success: boolean;
  message: string;
  user?: User;
  record?: AttendanceRecord;
  isDuplicate?: boolean;
  isWrongClass?: boolean;
  errorType?: "INVALID_TOKEN" | "NOT_STUDENT" | "NOT_TEACHER" | "WRONG_CLASS" | "DUPLICATE" | "INACTIVE";
}

// Teacher Duty Assignments (Penugasan Guru: Wali Kelas, Guru Piket, Pembina Ekskul, Koordinator, dll)
export type TeacherDutyType = "wali_kelas" | "guru_piket" | "pembina_ekskul" | "koordinator" | "tugas_lain";
export type TeacherDutyStatus = "aktif" | "tidak_aktif" | "selesai";

export interface TeacherDuty {
  id: string;
  teacherId: string;
  type: TeacherDutyType;
  assignmentType?: TeacherDutyType;
  title: string; // e.g. "Wali Kelas VII-A", "Guru Piket Senin", "Pembina Pramuka", "Koordinator Literasi"
  assignmentName?: string;
  classId?: string; // for wali_kelas
  piketDay?: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu"; // for guru_piket
  day?: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  piketHours?: string; // e.g. "06.30 - 14.00"
  startTime?: string; // e.g. "06:30"
  endTime?: string; // e.g. "14:00"
  piketLocation?: string; // e.g. "Gerbang Utama & Pos Piket"
  location?: string;
  ekskulId?: string; // for pembina_ekskul
  coordinatorField?: string; // for koordinator (e.g., "Literasi", "Kesiswaan", "Laboratorium", "Perpustakaan", "Adiwiyata", "Keagamaan")
  description?: string;
  notes?: string;
  academicYear: string;
  academicYearId?: string;
  semester?: "Ganjil" | "Genap";
  startDate?: string;
  endDate?: string;
  status?: TeacherDutyStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TeacherContextMode = "mapel" | "wali_kelas" | "guru_piket" | "pembina_ekskul" | "koordinator" | "tugas_lain";

// Extracurricular Activities (Kesiswaan & Ekstrakurikuler)
export interface Extracurricular {
  id: string;
  name: string; // e.g. "Pramuka", "PMR (Palang Merah Remaja)", "Paskibra", "Tahfidz Al-Qur'an", "Klub Robotik & IT"
  category: "Keagamaan" | "Kepemimpinan" | "Sains & Teknologi" | "Seni & Budaya" | "Olahraga";
  leadTeacherId: string; // Selected from existing teacher list!
  scheduleDay: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  scheduleTime: string; // e.g. "14.30 - 16.30 WIB"
  location: string; // e.g. "Lapangan Utama / Lab Komputer"
  memberStudentIds: string[];
  description: string;
  academicYear: string;
}

// Curriculum CP / KD
export interface LearningOutcome {
  id: string;
  subjectId: string;
  curriculum?: "merdeka" | "k13";
  curriculumType?: "merdeka" | "k13";
  code: string; // e.g. "CP-IPA-01" or "KD 3.1"
  title: string;
  phaseOrGrade?: string; // e.g. "Fase D (Kelas 7-9)" or "Kelas 8"
  gradeLevel?: number;
  phase?: string;
  topic?: string;
  elementOrCoreCompetency?: string;
  description?: string;
  learningObjectives?: string[]; // Tujuan Pembelajaran (TP)
  indicators?: string[]; // Indikator Ketercapaian
  subTopics?: string[];
}

// Question Bank
export type QuestionType =
  | "multiple_choice"
  | "complex_mcq"
  | "complex_multiple_choice"
  | "true_false"
  | "matching"
  | "short_answer"
  | "essay";

export type CognitiveLevel = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type DifficultyLevel = "mudah" | "sedang" | "sulit" | "hots" | "easy" | "medium";

export interface QuestionOption {
  id: string; // "A", "B", "C", "D"
  text: string;
  isCorrect?: boolean;
}

export interface QuestionMatchingPair {
  left: string;
  right: string;
}

export interface QuestionItem {
  id: string;
  subjectId: string;
  gradeLevel?: number;
  curriculumId?: string;
  topic?: string;
  cpKdId?: string;
  cognitiveLevel?: CognitiveLevel;
  difficulty: DifficultyLevel;
  type: QuestionType;
  questionText: string;
  options?: any[];
  matchingPairs?: QuestionMatchingPair[];
  correctAnswer: any; // string for single MCQ, array for complex MCQ, boolean for T/F, string for short answer
  explanation?: string;
  points: number;
  indicator?: string;
  createdAt: string;
}


// Exams
export type ExamCategory = "UH" | "PTS" | "PAS" | "PAT" | "TryOut" | "Kuis";

export interface Exam {
  id: string;
  title: string;
  category: ExamCategory;
  subjectId: string;
  classIds: string[];
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  passingGrade: number;
  questionIds: string[];
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  maxAttempts: number;
  showResultAfterSubmit: boolean;
  showExplanation: boolean;
  status: "draft" | "active" | "closed";
  academicYear: string;
  semester: "Ganjil" | "Genap";
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, any>; // questionId -> answer
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  status: "in_progress" | "submitted" | "graded";
  gradedByTeacher?: boolean;
}

// Assignments (Tugas)
export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  topic: string;
  description: string;
  instructions: string;
  deadline: string; // ISO date
  maxPoints: number;
  weight: number;
  submissionType: "online_text" | "file_upload" | "both";
  status: "active" | "closed";
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  textContent?: string;
  fileName?: string;
  fileSize?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  status: "submitted" | "late" | "graded";
}

// Assessment & Grades
export interface StudentSubjectGrade {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  academicYear: string;
  semester: "Ganjil" | "Genap";
  dailyScores: number[]; // Ulangan Harian & Kuis
  assignmentScores: number[]; // Tugas
  practicalScores: number[]; // Praktik / Proyek
  midtermScore: number; // PTS
  finalScore: number; // PAS/PAT
  finalCalculatedGrade: number;
  predicate: "A" | "B" | "C" | "D";
  competencyDescription: string;
  isRemedial: boolean;
  initialScore?: number;
  remedialScore?: number;
  remedialDate?: string;
  status: "tuntas" | "belum_tuntas";
}

export interface GradeWeights {
  daily: number; // e.g. 40
  midterm: number; // e.g. 25
  finalExam: number; // e.g. 35
}

// Digital Report Card (E-Rapor)
export interface ReportCardExtracurricular {
  name: string;
  predicate: "Sangat Baik" | "Baik" | "Cukup";
  description: string;
}

export interface ReportCardAchievement {
  title: string;
  level: "Sekolah" | "Kecamatan" | "Kabupaten/Kota" | "Provinsi" | "Nasional";
  year: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  classId: string;
  academicYear: string;
  semester: "Ganjil" | "Genap";
  issueDate: string;
  issuePlace: string;
  attendanceSummary: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
  };
  extracurriculars: ReportCardExtracurricular[];
  achievements: ReportCardAchievement[];
  physicalData: {
    heightCm: number;
    weightKg: number;
    hearingHealth: string;
    visionHealth: string;
    dentalHealth: string;
  };
  homeroomNotes: string;
  status: "draft" | "finalized";
  finalizedAt?: string;
}

// Notifications
export interface AppNotification {
  id: string;
  targetUserRole?: UserRole | "all";
  targetUserId?: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "exam" | "assignment" | "attendance";
  createdAt: string;
  read: boolean;
  link?: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipOrDevice?: string;
}

// --------------------------------------------------------
// PUBLIC WEBSITE & BLOG TYPES
// --------------------------------------------------------

export type BlogStatus = "draft" | "submitted" | "published" | "rejected" | "archived";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  authorNipOrNis?: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: BlogStatus;
  views: number;
  isFeatured?: boolean;
  submittedAt?: string;
  publishedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationStructureItem {
  id: string;
  name: string;
  position: string;
  department?: string; // "Pimpinan", "Komite", "Tata Usaha", "Kurikulum", "Kesiswaan", "Sarana Prasarana", "Humas", "Dewan Guru", "Kesiswaan & Siswa"
  level: number; // 0: Kepala, 1: Waka/Komite/TU, 2: Koordinator/Staff, 3: Guru & Wali Kelas, 4: Siswa & OSIS
  parentId?: string | null;
  teacherId?: string | null;
  teacherName?: string;
  description?: string;
  photo?: string;
  order: number;
  isActive: boolean;
  assignmentsSummary?: string[]; // Multiple duties summary e.g. ["Guru B. Indo", "Wali Kelas VII-A", "Guru Piket Senin"]
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type PublicRoute = "home" | "structure" | "blog" | "blog_detail" | "contact" | "login";
export type AppViewMode = "public" | "dashboard";

