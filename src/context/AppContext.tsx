import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, PublicStats } from "../lib/api";
import {
  User,
  UserRole,
  SchoolProfile,
  ClassRoom,
  Subject,
  ScheduleItem,
  AttendanceSession,
  AttendanceRecord,
  LearningOutcome,
  QuestionItem,
  Exam,
  ExamAttempt,
  Assignment,
  AssignmentSubmission,
  StudentSubjectGrade,
  GradeWeights,
  ReportCard,
  AppNotification,
  AuditLog,
  TeacherDuty,
  Extracurricular,
  AttendanceContextMode,
  PublicRoute,
  AppViewMode,
  BlogPost,
  BlogCategory,
  BlogTag,
  OrganizationStructureItem,
  ContactMessage,
} from "../types";
import {
  initialSchoolProfile,
  initialUsers,
  initialClasses,
  initialSubjects,
  initialSchedules,
  initialCurriculums,
  initialQuestions,
  initialExams,
  initialExamAttempts,
  initialAssignments,
  initialAssignmentSubmissions,
  initialAttendanceSessions,
  initialAttendanceRecords,
  initialGradeWeights,
  initialStudentGrades,
  initialReportCards,
  initialNotifications,
  initialAuditLogs,
  initialTeacherDuties,
  initialExtracurriculars,
  initialBlogCategories,
  initialBlogTags,
  initialBlogPosts,
  initialOrganizationStructure,
  initialContactMessages,
} from "../data/initialData";
import { generateSecureQRToken } from "../lib/qrHelper";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
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

interface AppContextType {
  // Authentication & Current User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loginAs: (role: UserRole, customUserId?: string) => void;
  loginWithCredentials: (usernameOrEmail: string, pass: string, role?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;

  // School Profile
  schoolProfile: SchoolProfile;
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void;

  // Master Data
  users: User[];
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  regenerateUserQRToken: (userId: string) => string;

  classes: ClassRoom[];
  addClass: (cls: Omit<ClassRoom, "id">) => void;
  updateClass: (id: string, cls: Partial<ClassRoom>) => void;
  deleteClass: (id: string) => void;

  subjects: Subject[];
  addSubject: (subj: Omit<Subject, "id">) => void;
  updateSubject: (id: string, subj: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  schedules: ScheduleItem[];
  addSchedule: (sch: Omit<ScheduleItem, "id">) => void;
  updateSchedule: (id: string, sch: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;

  // Curriculum & CP/KD
  curriculums: LearningOutcome[];
  addCurriculum: (curr: Omit<LearningOutcome, "id">) => void;
  updateCurriculum: (id: string, curr: Partial<LearningOutcome>) => void;
  deleteCurriculum: (id: string) => void;

  // Question Bank
  questions: QuestionItem[];
  addQuestion: (q: Omit<QuestionItem, "id" | "createdAt">) => void;
  updateQuestion: (id: string, q: Partial<QuestionItem>) => void;
  deleteQuestion: (id: string) => void;
  importQuestions: (newQuestions: Omit<QuestionItem, "id" | "createdAt">[]) => void;

  // Exams
  exams: Exam[];
  addExam: (exam: Omit<Exam, "id">) => Exam;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  examAttempts: ExamAttempt[];
  submitExamAttempt: (attempt: Omit<ExamAttempt, "id" | "submittedAt" | "status">) => ExamAttempt;
  gradeExamAttempt: (attemptId: string, customScore: number, answersScore?: Record<string, number>) => void;

  // Assignments
  assignments: Assignment[];
  addAssignment: (asg: Omit<Assignment, "id" | "createdAt">) => void;
  updateAssignment: (id: string, asg: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;

  assignmentSubmissions: AssignmentSubmission[];
  submitAssignment: (sub: Omit<AssignmentSubmission, "id" | "submittedAt" | "status">) => void;
  gradeAssignment: (subId: string, score: number, feedback?: string) => void;

  // Teacher Duty Assignments (Penugasan Guru)
  teacherDuties: TeacherDuty[];
  addTeacherDuty: (duty: Omit<TeacherDuty, "id">) => void;
  updateTeacherDuty: (id: string, duty: Partial<TeacherDuty>) => void;
  deleteTeacherDuty: (id: string) => void;
  toggleTeacherDutyStatus: (id: string) => void;
  getTeacherDuties: (teacherId: string) => TeacherDuty[];

  // Teacher Context Mode (Guru Mata Pelajaran vs Wali Kelas vs Guru Piket vs Pembina Ekskul vs Koordinator)
  activeTeacherContext: string;
  setActiveTeacherContext: (context: string) => void;

  // Extracurriculars
  extracurriculars: Extracurricular[];
  addExtracurricular: (ekskul: Omit<Extracurricular, "id">) => void;
  updateExtracurricular: (id: string, ekskul: Partial<Extracurricular>) => void;
  deleteExtracurricular: (id: string) => void;

  // Attendance
  attendanceSessions: AttendanceSession[];
  createAttendanceSession: (session: Omit<AttendanceSession, "id" | "createdAt" | "isActive" | "token">) => AttendanceSession;
  closeAttendanceSession: (sessionId: string) => void;

  attendanceRecords: AttendanceRecord[];
  recordStudentAttendance: (token: string, studentId: string, deviceInfo?: string) => { success: boolean; message: string };
  recordTeacherAttendance: (teacherId: string, status?: "hadir" | "terlambat" | "izin" | "sakit", note?: string) => { success: boolean; message: string };
  scanStudentPersonalQR: (params: {
    qrToken: string;
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    sessionId?: string;
    sessionTitle?: string;
    forcedStatus?: AttendanceRecord["status"];
    deviceInfo?: string;
  }) => QRScanResult;
  scanTeacherPersonalQR: (params: {
    qrToken: string;
    adminId?: string;
    forcedStatus?: AttendanceRecord["status"];
    note?: string;
  }) => QRScanResult;
  scanUnifiedPersonalQR: (params: {
    qrToken: string;
    mode?: AttendanceContextMode;
    classId?: string;
    subjectId?: string;
    ekskulId?: string;
    sessionId?: string;
    sessionTitle?: string;
    forcedStatus?: AttendanceRecord["status"];
    deviceInfo?: string;
  }) => QRScanResult;
  updateAttendanceRecordStatus: (id: string, status: AttendanceRecord["status"], note?: string) => void;

  // Assessment & Grades
  studentGrades: StudentSubjectGrade[];
  gradeWeights: GradeWeights;
  updateGradeWeights: (weights: GradeWeights) => void;
  upsertStudentGrade: (grade: Partial<StudentSubjectGrade> & { studentId: string; subjectId: string; classId: string }) => void;
  processRemedial: (gradeId: string, remedialScore: number) => void;

  // Report Cards
  reportCards: ReportCard[];
  saveReportCard: (report: Partial<ReportCard> & { studentId: string; classId: string }) => void;
  finalizeReportCard: (reportId: string) => void;

  // Notifications & Audit
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, "id" | "createdAt" | "read">) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;

  // UI Toast
  toasts: ToastMessage[];
  showToast: (type: ToastMessage["type"], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Backup / Reset
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;

  // Quick navigation helpers
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Public Website Routing & Modes
  publicRoute: PublicRoute;
  setPublicRoute: (route: PublicRoute) => void;
  blogDetailSlug: string;
  setBlogDetailSlug: (slug: string) => void;
  appMode: AppViewMode;
  setAppMode: (mode: AppViewMode) => void;
  navigateToPublic: (route: PublicRoute, slug?: string) => void;
  navigateToDashboard: (tab?: string) => void;

  // Dynamic Public Stats from PostgreSQL
  publicStats: PublicStats;
  isStatsLoading: boolean;
  fetchPublicData: () => Promise<void>;

  // Public & Teacher/Admin Blog
  blogPosts: BlogPost[];
  blogCategories: BlogCategory[];
  blogTags: BlogTag[];
  addBlogPost: (post: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views">) => BlogPost;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  submitBlogPostForReview: (id: string) => void;
  reviewBlogPost: (id: string, action: "approve" | "reject" | "archive", rejectionReason?: string, isFeatured?: boolean) => void;
  deleteBlogPost: (id: string) => void;
  toggleFeaturedPost: (id: string) => void;
  addBlogCategory: (name: string, description?: string) => void;

  // Organization Structure
  organizationStructure: OrganizationStructureItem[];
  addOrganizationMember: (member: Omit<OrganizationStructureItem, "id">) => void;
  updateOrganizationMember: (id: string, updates: Partial<OrganizationStructureItem>) => void;
  deleteOrganizationMember: (id: string) => void;

  // Contact Inquiries
  contactMessages: ContactMessage[];
  submitContactMessage: (name: string, email: string, phone: string, subject: string, message: string) => { success: boolean; message: string };
  markContactMessageRead: (id: string) => void;
  deleteContactMessage: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "edusmart_school_db_v1";

// Helper to determine initial view mode and route from browser location
const getInitialRouteFromLocation = (): { mode: AppViewMode; route: PublicRoute; slug: string } => {
  if (typeof window === "undefined") {
    return { mode: "public", route: "home", slug: "" };
  }
  const path = window.location.pathname;
  if (path === "/struktur") return { mode: "public", route: "structure", slug: "" };
  if (path === "/blog") return { mode: "public", route: "blog", slug: "" };
  if (path.startsWith("/blog/")) {
    const slug = decodeURIComponent(path.replace("/blog/", ""));
    return { mode: "public", route: "blog_detail", slug };
  }
  if (path === "/kontak") return { mode: "public", route: "contact", slug: "" };
  if (path === "/login") return { mode: "public", route: "login", slug: "" };
  if (path === "/admin" || path === "/teacher" || path === "/student" || path === "/parent" || path.startsWith("/dashboard")) {
    return { mode: "dashboard", route: "home", slug: "" };
  }
  // Default URL "/" -> Always show Public Website Homepage first
  return { mode: "public", route: "home", slug: "" };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or stored data
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveToLocal = (key: string, value: any) => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  };

  // Initial routing state
  const initialNav = getInitialRouteFromLocation();
  const [publicRoute, setPublicRoute] = useState<PublicRoute>(initialNav.route);
  const [blogDetailSlug, setBlogDetailSlug] = useState<string>(initialNav.slug);
  const [appMode, setAppMode] = useState<AppViewMode>(initialNav.mode);

  const [currentUser, setCurrentUser] = useState<User | null>(() => loadStored("currentUser", null));
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => loadStored("profile", initialSchoolProfile));
  const [users, setUsers] = useState<User[]>(() => loadStored("users", initialUsers));
  const [classes, setClasses] = useState<ClassRoom[]>(() => loadStored("classes", initialClasses));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadStored("subjects", initialSubjects));
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => loadStored("schedules", initialSchedules));
  const [curriculums, setCurriculums] = useState<LearningOutcome[]>(() => loadStored("curriculums", initialCurriculums));
  const [questions, setQuestions] = useState<QuestionItem[]>(() => loadStored("questions", initialQuestions));
  const [exams, setExams] = useState<Exam[]>(() => loadStored("exams", initialExams));
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => loadStored("examAttempts", initialExamAttempts));
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadStored("assignments", initialAssignments));
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>(() => loadStored("assignmentSubmissions", initialAssignmentSubmissions));
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => loadStored("attendanceSessions", initialAttendanceSessions));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => loadStored("attendanceRecords", initialAttendanceRecords));
  const [gradeWeights, setGradeWeights] = useState<GradeWeights>(() => loadStored("gradeWeights", initialGradeWeights));
  const [studentGrades, setStudentGrades] = useState<StudentSubjectGrade[]>(() => loadStored("studentGrades", initialStudentGrades));
  const [reportCards, setReportCards] = useState<ReportCard[]>(() => loadStored("reportCards", initialReportCards));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored("notifications", initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored("auditLogs", initialAuditLogs));
  const [teacherDuties, setTeacherDuties] = useState<TeacherDuty[]>(() => loadStored("teacherDuties", initialTeacherDuties));
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => loadStored("extracurriculars", initialExtracurriculars));

  // Public Website Data States
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => loadStored("blogPosts", initialBlogPosts));
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(() => loadStored("blogCategories", initialBlogCategories));
  const [blogTags, setBlogTags] = useState<BlogTag[]>(() => loadStored("blogTags", initialBlogTags));
  const [organizationStructure, setOrganizationStructure] = useState<OrganizationStructureItem[]>(() => loadStored("organizationStructure", initialOrganizationStructure));
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => loadStored("contactMessages", initialContactMessages));

  // Dynamic Public Stats from PostgreSQL Single Source of Truth
  const [publicStats, setPublicStats] = useState<PublicStats>({
    students: 480,
    teachers: 42,
    subjects: 18,
    extracurriculars: 10,
    classes: 15,
    activeAcademicYear: "2025/2026",
    activeSemester: "Ganjil",
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [activeTeacherContext, setActiveTeacherContext] = useState<string>("mapel");

  // Sync to local storage
  useEffect(() => saveToLocal("currentUser", currentUser), [currentUser]);
  useEffect(() => saveToLocal("profile", schoolProfile), [schoolProfile]);
  useEffect(() => saveToLocal("users", users), [users]);
  useEffect(() => saveToLocal("classes", classes), [classes]);
  useEffect(() => saveToLocal("subjects", subjects), [subjects]);
  useEffect(() => saveToLocal("schedules", schedules), [schedules]);
  useEffect(() => saveToLocal("curriculums", curriculums), [curriculums]);
  useEffect(() => saveToLocal("questions", questions), [questions]);
  useEffect(() => saveToLocal("exams", exams), [exams]);
  useEffect(() => saveToLocal("examAttempts", examAttempts), [examAttempts]);
  useEffect(() => saveToLocal("assignments", assignments), [assignments]);
  useEffect(() => saveToLocal("assignmentSubmissions", assignmentSubmissions), [assignmentSubmissions]);
  useEffect(() => saveToLocal("attendanceSessions", attendanceSessions), [attendanceSessions]);
  useEffect(() => saveToLocal("attendanceRecords", attendanceRecords), [attendanceRecords]);
  useEffect(() => saveToLocal("gradeWeights", gradeWeights), [gradeWeights]);
  useEffect(() => saveToLocal("studentGrades", studentGrades), [studentGrades]);
  useEffect(() => saveToLocal("reportCards", reportCards), [reportCards]);
  useEffect(() => saveToLocal("notifications", notifications), [notifications]);
  useEffect(() => saveToLocal("auditLogs", auditLogs), [auditLogs]);
  useEffect(() => saveToLocal("teacherDuties", teacherDuties), [teacherDuties]);
  useEffect(() => saveToLocal("extracurriculars", extracurriculars), [extracurriculars]);
  useEffect(() => saveToLocal("blogPosts", blogPosts), [blogPosts]);
  useEffect(() => saveToLocal("blogCategories", blogCategories), [blogCategories]);
  useEffect(() => saveToLocal("blogTags", blogTags), [blogTags]);
  useEffect(() => saveToLocal("organizationStructure", organizationStructure), [organizationStructure]);
  useEffect(() => saveToLocal("contactMessages", contactMessages), [contactMessages]);

  // Fetch dynamic public data from PostgreSQL backend on mount
  const fetchPublicData = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const [statsData, profileData, blogData, orgData] = await Promise.allSettled([
        api.getPublicStats(),
        api.getPublicSchoolProfile(),
        api.getPublicBlog({ limit: 12 }),
        api.getPublicOrganization(),
      ]);

      if (statsData.status === "fulfilled" && statsData.value) {
        setPublicStats(statsData.value);
      }
      if (profileData.status === "fulfilled" && profileData.value) {
        setSchoolProfile((prev) => ({ ...prev, ...profileData.value }));
      }
      if (blogData.status === "fulfilled" && blogData.value?.posts && blogData.value.posts.length > 0) {
        setBlogPosts(blogData.value.posts);
      }
      if (orgData.status === "fulfilled" && orgData.value && orgData.value.length > 0) {
        setOrganizationStructure(orgData.value);
      }
    } catch (err) {
      console.warn("Public data sync error:", err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const nav = getInitialRouteFromLocation();
      setAppMode(nav.mode);
      setPublicRoute(nav.route);
      setBlogDetailSlug(nav.slug);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Navigation handlers
  const navigateToPublic = useCallback((route: PublicRoute, slug?: string) => {
    setAppMode("public");
    setPublicRoute(route);
    if (slug) setBlogDetailSlug(slug);

    let path = "/";
    if (route === "structure") path = "/struktur";
    else if (route === "blog") path = "/blog";
    else if (route === "blog_detail" && slug) path = `/blog/${slug}`;
    else if (route === "contact") path = "/kontak";
    else if (route === "login") path = "/login";

    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToDashboard = useCallback((tab?: string) => {
    if (!currentUser) {
      navigateToPublic("login");
      return;
    }
    setAppMode("dashboard");
    if (tab) setActiveTab(tab);
    else setActiveTab("dashboard");

    const rolePath = currentUser.role === "admin" ? "/admin" : currentUser.role === "guru" ? "/teacher" : currentUser.role === "siswa" ? "/student" : "/parent";
    if (typeof window !== "undefined" && window.location.pathname !== rolePath) {
      window.history.pushState({}, "", rolePath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentUser, navigateToPublic]);

  // Toast Helper
  const showToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Audit Log
  const addAuditLog = useCallback((action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      userId: currentUser?.id || "guest",
      userName: currentUser?.name || "Tamu",
      userRole: currentUser?.role || "admin",
      action,
      details,
      timestamp: new Date().toISOString(),
      ipOrDevice: "EduSmart Web App Client",
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, [currentUser]);

  // Notifications
  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      ...notif,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Auth
  const loginAs = (role: UserRole, customUserId?: string) => {
    if (customUserId) {
      const u = users.find((x) => x.id === customUserId);
      if (u) {
        setCurrentUser(u);
        setActiveTab("dashboard");
        addAuditLog("Login Pengguna", `Login sebagai ${u.name} (${u.role})`);
        showToast("success", "Login Berhasil", `Selamat datang kembali, ${u.name}!`);
        return;
      }
    }
    const defaultUser = users.find((x) => x.role === role) || initialUsers.find((x) => x.role === role) || users[0];
    setCurrentUser(defaultUser);
    setActiveTab("dashboard");
    addAuditLog("Login Pengguna", `Login sebagai ${defaultUser.name} (${defaultUser.role})`);
    showToast("success", "Login Berhasil", `Selamat datang, ${defaultUser.name}!`);
  };

  const loginWithCredentials = async (
    usernameOrEmail: string,
    pass: string,
    role?: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    if (!role) {
      const msg = "Silakan pilih jenis pengguna terlebih dahulu.";
      showToast("warning", "Pilih Jenis Pengguna", msg);
      return { success: false, message: msg };
    }

    if (!usernameOrEmail || !pass) {
      const msg = "Username atau email dan kata sandi wajib diisi.";
      showToast("warning", "Input Tidak Lengkap", msg);
      return { success: false, message: msg };
    }

    try {
      const res = await api.login({
        usernameOrEmail: usernameOrEmail.trim(),
        password: pass,
        role: role.trim(),
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setAppMode("dashboard");
        setActiveTab("dashboard");
        addAuditLog("Login Pengguna", `Login sukses sebagai ${role} untuk akun: ${res.user.username}`);
        showToast("success", "Login Berhasil", `Selamat datang kembali, ${res.user.name}!`);

        const rolePath =
          res.user.role === "admin"
            ? "/admin/dashboard"
            : res.user.role === "guru"
            ? "/teacher/dashboard"
            : res.user.role === "siswa"
            ? "/student/dashboard"
            : "/parent/dashboard";

        if (typeof window !== "undefined") {
          window.history.pushState({}, "", rolePath);
        }
        return { success: true, message: res.message || "Login berhasil", user: res.user };
      } else {
        const errorMsg = res.message || "Username atau password yang Anda masukkan salah.";
        showToast("error", "Login Gagal", errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      // Offline fallback: check local user list
      const u = users.find(
        (x) =>
          (x.username.toLowerCase() === usernameOrEmail.toLowerCase().trim() ||
            x.email.toLowerCase() === usernameOrEmail.toLowerCase().trim()) &&
          x.role.toLowerCase() === role.toLowerCase().replace("_", "")
      );
      if (u) {
        setCurrentUser(u);
        setAppMode("dashboard");
        setActiveTab("dashboard");
        addAuditLog("Login Pengguna", `Login offline untuk akun: ${u.username}`);
        showToast("success", "Login Berhasil", `Selamat datang kembali, ${u.name}`);
        return { success: true, message: "Login berhasil", user: u };
      }

      const errorMsg = err?.message || "Terjadi kesalahan pada server saat login.";
      showToast("error", "Login Gagal", errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog("Logout", `Pengguna ${currentUser.name} keluar dari sistem.`);
    }
    setCurrentUser(null);
    setAppMode("public");
    setPublicRoute("home");
    setActiveTab("dashboard");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
    showToast("info", "Keluar", "Anda telah keluar dari aplikasi.");
  };

  // School Profile
  const updateSchoolProfile = (profile: Partial<SchoolProfile>) => {
    setSchoolProfile((prev) => ({ ...prev, ...profile }));
    addAuditLog("Update Profil Sekolah", "Memperbarui identitas dan pengaturan akademik sekolah.");
    showToast("success", "Tersimpan", "Profil sekolah berhasil diperbarui.");
  };

  // User CRUD
  const addUser = (userData: Omit<User, "id">) => {
    const roleType = userData.role === "siswa" ? "STD" : userData.role === "guru" ? "TCH" : "ADM";
    const newUser: User = {
      id: `usr_${Date.now()}`,
      ...userData,
      qrToken: userData.qrToken || generateSecureQRToken(roleType),
      qrGeneratedAt: new Date().toISOString(),
      qrIsActive: true,
      avatar: userData.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };
    setUsers((prev) => [...prev, newUser]);
    addAuditLog("Tambah Pengguna", `Menambahkan akun baru: ${newUser.name} (${newUser.role}) dengan QR Token ${newUser.qrToken}`);
    showToast("success", "Pengguna Ditambahkan", `${newUser.name} berhasil didaftarkan.`);
  };

  const regenerateUserQRToken = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    const roleType = user?.role === "siswa" ? "STD" : user?.role === "guru" ? "TCH" : "ADM";
    const newToken = generateSecureQRToken(roleType);
    const now = new Date().toISOString();

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, qrToken: newToken, qrGeneratedAt: now } : u))
    );

    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, qrToken: newToken, qrGeneratedAt: now } : null));
    }

    addAuditLog("Generate Ulang QR", `Memperbarui QR Token untuk pengguna ID: ${userId} (${newToken})`);
    showToast("success", "QR Code Diperbarui", "Token identitas QR baru telah dibuat.");
    return newToken;
  };

  const updateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null));
    }
    addAuditLog("Edit Pengguna", `Memperbarui data akun ID: ${id}`);
    showToast("success", "Pengguna Diperbarui", "Perubahan data pengguna berhasil disimpan.");
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addAuditLog("Hapus Pengguna", `Menghapus akun: ${target?.name || id}`);
    showToast("info", "Pengguna Dihapus", "Akun berhasil dihapus dari sistem.");
  };

  // Classes CRUD
  const addClass = (clsData: Omit<ClassRoom, "id">) => {
    const newClass: ClassRoom = { id: `cls_${Date.now()}`, ...clsData };
    setClasses((prev) => [...prev, newClass]);
    addAuditLog("Tambah Kelas", `Membuat rombongan belajar baru: ${newClass.name}`);
    showToast("success", "Kelas Dibuat", `Kelas ${newClass.name} berhasil ditambahkan.`);
  };

  const updateClass = (id: string, updated: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    addAuditLog("Edit Kelas", `Memperbarui data kelas ID: ${id}`);
    showToast("success", "Kelas Diperbarui", "Data kelas berhasil disimpan.");
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    addAuditLog("Hapus Kelas", `Menghapus kelas ID: ${id}`);
    showToast("info", "Kelas Dihapus", "Data kelas berhasil dihapus.");
  };

  // Subjects CRUD
  const addSubject = (subjData: Omit<Subject, "id">) => {
    const newSubj: Subject = { id: `subj_${Date.now()}`, ...subjData };
    setSubjects((prev) => [...prev, newSubj]);
    addAuditLog("Tambah Mata Pelajaran", `Menambahkan mata pelajaran: ${newSubj.name}`);
    showToast("success", "Mata Pelajaran Ditambahkan", `${newSubj.name} aktif.`);
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    addAuditLog("Edit Mapel", `Memperbarui data mata pelajaran ID: ${id}`);
    showToast("success", "Mapel Diperbarui", "Data mata pelajaran tersimpan.");
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    addAuditLog("Hapus Mapel", `Menghapus mapel ID: ${id}`);
    showToast("info", "Mapel Dihapus", "Mata pelajaran telah dihapus.");
  };

  // Schedules CRUD
  const addSchedule = (schData: Omit<ScheduleItem, "id">) => {
    const newSch: ScheduleItem = { id: `sch_${Date.now()}`, ...schData };
    setSchedules((prev) => [...prev, newSch]);
    addAuditLog("Tambah Jadwal", `Membuat jadwal ${newSch.day} (${newSch.startTime}-${newSch.endTime})`);
    showToast("success", "Jadwal Ditambahkan", "Jadwal pelajaran berhasil dibuat.");
  };

  const updateSchedule = (id: string, updated: Partial<ScheduleItem>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    addAuditLog("Edit Jadwal", `Memperbarui jadwal ID: ${id}`);
    showToast("success", "Jadwal Diperbarui", "Jadwal pelajaran tersimpan.");
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    addAuditLog("Hapus Jadwal", `Menghapus jadwal ID: ${id}`);
    showToast("info", "Jadwal Dihapus", "Jadwal telah dihapus.");
  };

  // Teacher Duties CRUD (Penugasan Guru)
  const addTeacherDuty = (dutyData: Omit<TeacherDuty, "id">) => {
    const newDuty: TeacherDuty = { id: `duty_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, ...dutyData };
    setTeacherDuties((prev) => [...prev, newDuty]);
    const teacher = users.find((u) => u.id === newDuty.teacherId);
    addAuditLog("Penugasan Guru", `Menambahkan penugasan '${newDuty.title}' untuk guru ${teacher?.name || newDuty.teacherId}`);
    showToast("success", "Penugasan Disimpan", `${newDuty.title} berhasil ditugaskan.`);
  };

  const updateTeacherDuty = (id: string, updated: Partial<TeacherDuty>) => {
    setTeacherDuties((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
    addAuditLog("Update Penugasan", `Memperbarui penugasan guru ID: ${id}`);
    showToast("success", "Penugasan Diperbarui", "Data penugasan guru berhasil disimpan.");
  };

  const deleteTeacherDuty = (id: string) => {
    setTeacherDuties((prev) => prev.filter((d) => d.id !== id));
    addAuditLog("Hapus Penugasan", `Menghapus penugasan guru ID: ${id}`);
    showToast("info", "Penugasan Dihapus", "Penugasan guru telah dicabut.");
  };

  const toggleTeacherDutyStatus = (id: string) => {
    setTeacherDuties((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextActive = !d.isActive;
          const nextStatus = nextActive ? "aktif" : "tidak_aktif";
          return { ...d, isActive: nextActive, status: nextStatus };
        }
        return d;
      })
    );
    addAuditLog("Ubah Status Penugasan", `Mengubah status aktif penugasan ID: ${id}`);
    showToast("info", "Status Diperbarui", "Status penugasan telah diperbarui.");
  };

  const getTeacherDuties = (teacherId: string): TeacherDuty[] => {
    return teacherDuties.filter((d) => d.teacherId === teacherId && d.isActive);
  };

  // Extracurriculars CRUD
  const addExtracurricular = (ekskulData: Omit<Extracurricular, "id">) => {
    const newEkskul: Extracurricular = { id: `ekskul_${Date.now()}`, ...ekskulData };
    setExtracurriculars((prev) => [...prev, newEkskul]);
    addAuditLog("Tambah Ekskul", `Menambahkan kegiatan ekstrakurikuler: ${newEkskul.name}`);
    showToast("success", "Ekskul Ditambahkan", `${newEkskul.name} berhasil didaftarkan.`);
  };

  const updateExtracurricular = (id: string, updated: Partial<Extracurricular>) => {
    setExtracurriculars((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    addAuditLog("Edit Ekskul", `Memperbarui data ekskul ID: ${id}`);
    showToast("success", "Ekskul Diperbarui", "Data ekstrakurikuler disimpan.");
  };

  const deleteExtracurricular = (id: string) => {
    setExtracurriculars((prev) => prev.filter((e) => e.id !== id));
    addAuditLog("Hapus Ekskul", `Menghapus ekskul ID: ${id}`);
    showToast("info", "Ekskul Dihapus", "Ekstrakurikuler telah dihapus.");
  };

  // Curriculum CRUD
  const addCurriculum = (currData: Omit<LearningOutcome, "id">) => {
    const newCurr: LearningOutcome = { id: `cp_${Date.now()}`, ...currData };
    setCurriculums((prev) => [...prev, newCurr]);
    addAuditLog("Tambah CP/KD", `Menambahkan Capaian Pembelajaran: ${newCurr.title}`);
    showToast("success", "CP/KD Ditambahkan", `${newCurr.code} berhasil disimpan.`);
  };

  const updateCurriculum = (id: string, updated: Partial<LearningOutcome>) => {
    setCurriculums((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    addAuditLog("Edit CP/KD", `Memperbarui CP/KD ID: ${id}`);
    showToast("success", "CP/KD Diperbarui", "Perubahan CP/KD tersimpan.");
  };

  const deleteCurriculum = (id: string) => {
    setCurriculums((prev) => prev.filter((c) => c.id !== id));
    addAuditLog("Hapus CP/KD", `Menghapus CP/KD ID: ${id}`);
    showToast("info", "CP/KD Dihapus", "Capaian Pembelajaran dihapus.");
  };

  // Questions CRUD & Import
  const addQuestion = (qData: Omit<QuestionItem, "id" | "createdAt">) => {
    const newQ: QuestionItem = {
      id: `qst_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      ...qData,
      createdAt: new Date().toISOString(),
    };
    setQuestions((prev) => [newQ, ...prev]);
    addAuditLog("Tambah Soal Bank", `Menambahkan butir soal (${newQ.type} - ${newQ.difficulty})`);
    showToast("success", "Soal Ditambahkan", "Butir soal masuk ke Bank Soal.");
  };

  const updateQuestion = (id: string, updated: Partial<QuestionItem>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)));
    addAuditLog("Edit Soal Bank", `Mengubah butir soal ID: ${id}`);
    showToast("success", "Soal Diperbarui", "Soal berhasil diperbarui.");
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    addAuditLog("Hapus Soal", `Menghapus butir soal ID: ${id}`);
    showToast("info", "Soal Dihapus", "Soal dihapus dari bank soal.");
  };

  const importQuestions = (newQuestions: Omit<QuestionItem, "id" | "createdAt">[]) => {
    const formatted: QuestionItem[] = newQuestions.map((q, idx) => ({
      id: `qst_imp_${Date.now()}_${idx}`,
      ...q,
      createdAt: new Date().toISOString(),
    }));
    setQuestions((prev) => [...formatted, ...prev]);
    addAuditLog("Import Soal", `Mengimpor ${formatted.length} butir soal ke Bank Soal.`);
    showToast("success", "Import Soal Berhasil", `${formatted.length} butir soal telah masuk.`);
  };

  // Exams
  const addExam = (examData: Omit<Exam, "id">): Exam => {
    const newExam: Exam = { id: `exam_${Date.now()}`, ...examData };
    setExams((prev) => [newExam, ...prev]);
    addNotification({
      targetUserRole: "siswa",
      title: `Ujian Baru: ${newExam.title}`,
      message: `Ujian ${newExam.category} telah dijadwalkan pada ${newExam.date} (${newExam.startTime}).`,
      type: "exam",
      link: "/exams",
    });
    addAuditLog("Buat Ujian", `Membuat instrumen ujian online: ${newExam.title}`);
    showToast("success", "Ujian Dibuat", `Ujian "${newExam.title}" berhasil diterbitkan.`);
    return newExam;
  };

  const updateExam = (id: string, updated: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    addAuditLog("Edit Ujian", `Memperbarui konfigurasi ujian ID: ${id}`);
    showToast("success", "Ujian Diperbarui", "Pengaturan ujian disimpan.");
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    addAuditLog("Hapus Ujian", `Menghapus ujian ID: ${id}`);
    showToast("info", "Ujian Dihapus", "Data ujian dihapus.");
  };

  const submitExamAttempt = (attemptData: Omit<ExamAttempt, "id" | "submittedAt" | "status">): ExamAttempt => {
    const targetExam = exams.find((e) => e.id === attemptData.examId);
    let totalScore = 0;
    let maxScore = 0;

    // Automatic grading for standard question types
    if (targetExam) {
      targetExam.questionIds.forEach((qId) => {
        const q = questions.find((x) => x.id === qId);
        if (q) {
          maxScore += q.points;
          const userAns = attemptData.answers[qId];
          if (q.type === "multiple_choice" || q.type === "true_false") {
            if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
              totalScore += q.points;
            }
          } else if (q.type === "short_answer") {
            if (String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
              totalScore += q.points;
            }
          } else {
            // Essay / Complex / Matching: default auto award proportional if answered, or pending manual grade
            if (userAns !== undefined && userAns !== "") {
              totalScore += Math.round(q.points * 0.8); // preliminary base
            }
          }
        }
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= (targetExam?.passingGrade || 75);

    const newAttempt: ExamAttempt = {
      id: `att_${Date.now()}`,
      ...attemptData,
      submittedAt: new Date().toISOString(),
      score: totalScore,
      maxScore: maxScore || 100,
      percentage,
      passed,
      status: "graded",
    };

    setExamAttempts((prev) => [newAttempt, ...prev.filter((a) => !(a.examId === attemptData.examId && a.studentId === attemptData.studentId))]);

    // Update or insert student grade record
    if (targetExam && currentUser) {
      const existingGrade = studentGrades.find((g) => g.studentId === attemptData.studentId && g.subjectId === targetExam.subjectId);
      if (existingGrade) {
        const updatedDailies = [...existingGrade.dailyScores, percentage];
        upsertStudentGrade({
          studentId: attemptData.studentId,
          subjectId: targetExam.subjectId,
          classId: currentUser.classId || "cls_8a",
          dailyScores: updatedDailies,
        });
      }
    }

    addAuditLog("Submit Ujian", `Siswa ${currentUser?.name} menyelesaikan ujian ${targetExam?.title || attemptData.examId}. Nilai: ${percentage}%`);
    showToast(passed ? "success" : "warning", "Ujian Selesai Dikirim", `Jawaban berhasil disimpan. Nilai Anda: ${percentage}`);
    return newAttempt;
  };

  const gradeExamAttempt = (attemptId: string, customScore: number) => {
    setExamAttempts((prev) =>
      prev.map((att) => {
        if (att.id === attemptId) {
          const percentage = att.maxScore > 0 ? Math.round((customScore / att.maxScore) * 100) : customScore;
          return {
            ...att,
            score: customScore,
            percentage,
            passed: percentage >= 75,
            status: "graded",
            gradedByTeacher: true,
          };
        }
        return att;
      })
    );
    showToast("success", "Penilaian Disimpan", "Nilai ujian siswa berhasil diperbarui.");
  };

  // Assignments
  const addAssignment = (asgData: Omit<Assignment, "id" | "createdAt">) => {
    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      ...asgData,
      createdAt: new Date().toISOString(),
    };
    setAssignments((prev) => [newAsg, ...prev]);
    addNotification({
      targetUserRole: "siswa",
      title: `Tugas Baru: ${newAsg.title}`,
      message: `Tenggat waktu: ${new Date(newAsg.deadline).toLocaleDateString("id-ID")}`,
      type: "assignment",
      link: "/assignments",
    });
    addAuditLog("Buat Tugas", `Membuat tugas online: ${newAsg.title}`);
    showToast("success", "Tugas Dibuat", "Tugas baru telah diumumkan ke kelas.");
  };

  const updateAssignment = (id: string, updated: Partial<Assignment>) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    showToast("success", "Tugas Diperbarui", "Pengaturan tugas tersimpan.");
  };

  const deleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    showToast("info", "Tugas Dihapus", "Tugas berhasil dihapus.");
  };

  const submitAssignment = (subData: Omit<AssignmentSubmission, "id" | "submittedAt" | "status">) => {
    const newSub: AssignmentSubmission = {
      id: `sub_${Date.now()}`,
      ...subData,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    };
    setAssignmentSubmissions((prev) => [...prev.filter((s) => !(s.assignmentId === subData.assignmentId && s.studentId === subData.studentId)), newSub]);
    addAuditLog("Pengumpulan Tugas", `Siswa ID ${subData.studentId} mengumpulkan tugas ID: ${subData.assignmentId}`);
    showToast("success", "Tugas Terkirim", "Tugas Anda berhasil diunggah.");
  };

  const gradeAssignment = (subId: string, score: number, feedback?: string) => {
    setAssignmentSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              score,
              feedback,
              gradedAt: new Date().toISOString(),
              status: "graded",
            }
          : s
      )
    );
    showToast("success", "Nilai Tersimpan", `Tugas dinilai: ${score}/100.`);
  };

  // QR Attendance Sessions
  const createAttendanceSession = (sessionData: Omit<AttendanceSession, "id" | "createdAt" | "isActive" | "token">): AttendanceSession => {
    const randomToken = `EDUSMART-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const newSession: AttendanceSession = {
      id: `att_sess_${Date.now()}`,
      ...sessionData,
      token: randomToken,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setAttendanceSessions((prev) => [newSession, ...prev]);
    addAuditLog("Buka Absensi QR", `Membuat sesi QR Code presensi: ${newSession.title}`);
    showToast("success", "Sesi Absensi Aktif", "QR Code dinamis telah dibuat.");
    return newSession;
  };

  const closeAttendanceSession = (sessionId: string) => {
    setAttendanceSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, isActive: false } : s)));
    addAuditLog("Tutup Absensi QR", `Menutup sesi presensi ID: ${sessionId}`);
    showToast("info", "Sesi Absensi Ditutup", "Presensi untuk sesi ini telah berakhir.");
  };

  // Student QR Scan Attendance
  const recordStudentAttendance = (token: string, studentId: string, deviceInfo?: string): { success: boolean; message: string } => {
    const session = attendanceSessions.find((s) => s.token === token && s.isActive);
    if (!session) {
      return { success: false, message: "QR Code tidak valid atau sudah kedaluwarsa." };
    }

    const student = users.find((u) => u.id === studentId);
    if (student?.classId && student.classId !== session.classId) {
      return { success: false, message: "QR Code ini bukan untuk rombel / kelas Anda." };
    }

    // Check duplicate
    const today = new Date().toISOString().split("T")[0];
    const duplicate = attendanceRecords.find(
      (r) => r.sessionId === session.id && r.userId === studentId && r.date === today
    );
    if (duplicate) {
      return { success: false, message: "Anda sudah melakukan presensi pada sesi ini." };
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    // Determine status (terlambat if > 15 mins from session start)
    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}`,
      sessionId: session.id,
      userId: studentId,
      userType: "siswa",
      classId: session.classId,
      date: today,
      time: timeStr,
      status: "hadir",
      method: "qr_scan",
      deviceInfo: deviceInfo || "Browser QR Scanner",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    addAuditLog("Presensi QR Siswa", `Siswa ${student?.name || studentId} presensi hadir.`);
    showToast("success", "Presensi Berhasil!", `Status kehadiran Anda tercatat HADIR pukul ${timeStr}.`);
    return { success: true, message: "Presensi berhasil dicatat." };
  };

  // Teacher Daily Attendance
  const recordTeacherAttendance = (teacherId: string, status: "hadir" | "terlambat" | "izin" | "sakit" = "hadir", note?: string): { success: boolean; message: string } => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    const duplicate = attendanceRecords.find((r) => r.userId === teacherId && r.date === today && r.userType === "guru");
    if (duplicate) {
      return { success: false, message: "Guru sudah tercatat presensi hari ini." };
    }

    const newRecord: AttendanceRecord = {
      id: `rec_t_${Date.now()}`,
      userId: teacherId,
      userType: "guru",
      date: today,
      time: timeStr,
      status,
      note,
      method: "qr_scan",
      deviceInfo: "sMTs Teacher Attendance Hub",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    const teacher = users.find((u) => u.id === teacherId);
    addAuditLog("Presensi Guru", `Guru ${teacher?.name} melakukan presensi (${status})`);
    showToast("success", "Presensi Guru Berhasil", `Presensi guru ${status.toUpperCase()} tercatat.`);
    return { success: true, message: "Presensi guru berhasil dicatat." };
  };

  // Personal QR Scanning Logic for Students
  const scanStudentPersonalQR = ({
    qrToken,
    classId,
    subjectId,
    teacherId,
    sessionId,
    sessionTitle,
    forcedStatus,
    deviceInfo,
  }: {
    qrToken: string;
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    sessionId?: string;
    sessionTitle?: string;
    forcedStatus?: AttendanceRecord["status"];
    deviceInfo?: string;
  }): QRScanResult => {
    const cleanToken = qrToken.trim();
    // Find student with matching token
    const student = users.find((u) => u.qrToken === cleanToken || (u.nipOrNis && cleanToken.includes(u.nipOrNis)));
    if (!student) {
      return {
        success: false,
        message: `QR Code tidak dikenali dalam sistem smart MTs. (Token: ${cleanToken.substring(0, 15)}...)`,
        errorType: "INVALID_TOKEN",
      };
    }

    if (student.role !== "siswa") {
      return {
        success: false,
        message: `Identitas terdeteksi (${student.name}) bukan akun Siswa, melainkan ${student.role.toUpperCase()}.`,
        user: student,
        errorType: "NOT_STUDENT",
      };
    }

    // Check class membership if classId is specified
    if (classId && student.classId && student.classId !== classId) {
      const studentClass = classes.find((c) => c.id === student.classId)?.name || student.classId;
      const targetClass = classes.find((c) => c.id === classId)?.name || classId;
      return {
        success: false,
        message: `Siswa (${student.name}) terdaftar di kelas ${studentClass}, bukan kelas ${targetClass}.`,
        user: student,
        isWrongClass: true,
        errorType: "WRONG_CLASS",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Duplicate check
    const existing = attendanceRecords.find(
      (r) =>
        r.userId === student.id &&
        r.date === today &&
        r.userType === "siswa" &&
        (sessionId ? r.sessionId === sessionId : (subjectId ? r.subjectId === subjectId : true))
    );

    if (existing) {
      return {
        success: false,
        message: `Siswa ${student.name} SUDAH tercatat hadir hari ini pukul ${existing.time} WIB.`,
        user: student,
        record: existing,
        isDuplicate: true,
        errorType: "DUPLICATE",
      };
    }

    // Determine status (cutoff 07:15)
    let finalStatus: AttendanceRecord["status"] = forcedStatus || "hadir";
    if (!forcedStatus) {
      const hours = now.getHours();
      const mins = now.getMinutes();
      if (hours > 7 || (hours === 7 && mins > 15)) {
        finalStatus = "terlambat";
      }
    }

    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      sessionTitle,
      userId: student.id,
      userType: "siswa",
      classId: classId || student.classId,
      subjectId,
      teacherId,
      scannedBy: currentUser?.id,
      date: today,
      time: timeStr,
      status: finalStatus,
      method: "qr_scan",
      deviceInfo: deviceInfo || "sMTs QR Scanner Terminal",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    addAuditLog("Scan QR Siswa", `Presensi berhasil untuk ${student.name} (${finalStatus.toUpperCase()})`);
    showToast(
      finalStatus === "hadir" ? "success" : "warning",
      `Presensi: ${student.name}`,
      `Status: ${finalStatus.toUpperCase()} (Pukul ${timeStr} WIB)`
    );

    return {
      success: true,
      message: `Presensi berhasil dicatat: ${student.name} (${finalStatus.toUpperCase()})`,
      user: student,
      record: newRecord,
    };
  };

  // Personal QR Scanning Logic for Teachers & Staff
  const scanTeacherPersonalQR = ({
    qrToken,
    adminId,
    forcedStatus,
    note,
  }: {
    qrToken: string;
    adminId?: string;
    forcedStatus?: AttendanceRecord["status"];
    note?: string;
  }): QRScanResult => {
    const cleanToken = qrToken.trim();
    const teacher = users.find((u) => u.qrToken === cleanToken || (u.nipOrNis && cleanToken.includes(u.nipOrNis)));
    if (!teacher) {
      return {
        success: false,
        message: "QR Code Guru/GTK tidak terdaftar dalam sistem.",
        errorType: "INVALID_TOKEN",
      };
    }

    if (teacher.role !== "guru") {
      return {
        success: false,
        message: `Identitas (${teacher.name}) berstatus ${teacher.role}, bukan Guru/GTK.`,
        user: teacher,
        errorType: "NOT_TEACHER",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const existing = attendanceRecords.find(
      (r) => r.userId === teacher.id && r.date === today && r.userType === "guru"
    );

    if (existing) {
      return {
        success: false,
        message: `Guru ${teacher.name} sudah presensi hari ini pada pukul ${existing.time} WIB.`,
        user: teacher,
        record: existing,
        isDuplicate: true,
        errorType: "DUPLICATE",
      };
    }

    let status: AttendanceRecord["status"] = forcedStatus || "hadir";
    if (!forcedStatus) {
      const hours = now.getHours();
      const mins = now.getMinutes();
      if (hours > 7 || (hours === 7 && mins > 0)) {
        status = "terlambat";
      }
    }

    const newRecord: AttendanceRecord = {
      id: `rec_t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: teacher.id,
      userType: "guru",
      date: today,
      time: timeStr,
      status,
      note,
      scannedBy: adminId || currentUser?.id,
      method: "qr_scan",
      deviceInfo: "sMTs GTK Scanner",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    addAuditLog("Scan QR Guru", `Presensi guru ${teacher.name} dicatat (${status.toUpperCase()})`);
    showToast("success", `Presensi Guru: ${teacher.name}`, `Status: ${status.toUpperCase()} (Pukul ${timeStr} WIB)`);

    return {
      success: true,
      message: `Presensi guru berhasil dicatat: ${teacher.name}`,
      user: teacher,
      record: newRecord,
    };
  };

  // Unified Personal QR Scanner (Absensi Terpadu Guru & Siswa)
  const scanUnifiedPersonalQR = ({
    qrToken,
    mode = "harian",
    classId,
    subjectId,
    ekskulId,
    sessionId,
    sessionTitle,
    forcedStatus,
    deviceInfo,
  }: {
    qrToken: string;
    mode?: AttendanceContextMode;
    classId?: string;
    subjectId?: string;
    ekskulId?: string;
    sessionId?: string;
    sessionTitle?: string;
    forcedStatus?: AttendanceRecord["status"];
    deviceInfo?: string;
  }): QRScanResult => {
    const cleanToken = qrToken.trim();
    // Match user by qrToken, NIP/NIS, ID or username
    const user = users.find(
      (u) =>
        u.qrToken === cleanToken ||
        (u.nipOrNis && cleanToken.includes(u.nipOrNis)) ||
        (u.nis && cleanToken.includes(u.nis)) ||
        (u.nip && cleanToken.includes(u.nip)) ||
        u.id === cleanToken ||
        u.username === cleanToken
    );

    if (!user) {
      return {
        success: false,
        message: `QR Code tidak dikenali dalam sistem smart MTs. Pastikan token terdaftar. (Token: ${cleanToken.substring(0, 15)}...)`,
        errorType: "INVALID_TOKEN",
      };
    }

    if (user.qrIsActive === false) {
      return {
        success: false,
        message: `QR Code untuk pengguna ${user.name} saat ini dinonaktifkan oleh administrator.`,
        user,
        errorType: "INACTIVE",
      };
    }

    const isTeacher = user.role === "guru";
    const isStudent = user.role === "siswa";
    const isStaff = user.role === "admin";
    const userType: AttendanceRecord["userType"] = isTeacher ? "guru" : isStudent ? "siswa" : "admin";

    // Mode-specific validation
    if (mode === "pembelajaran") {
      if (isStudent && classId && user.classId && user.classId !== classId) {
        const studentClass = classes.find((c) => c.id === user.classId)?.name || user.classId;
        const targetClass = classes.find((c) => c.id === classId)?.name || classId;
        return {
          success: false,
          message: `Siswa bukan anggota kelas ${targetClass} (Terdaftar di kelas ${studentClass}). Presensi ditolak.`,
          user,
          isWrongClass: true,
          errorType: "WRONG_CLASS",
        };
      }
    }

    if (mode === "guru" && !isTeacher && !isStaff) {
      return {
        success: false,
        message: `Identitas terdeteksi (${user.name}) adalah Siswa, bukan Guru/GTK. Silakan alihkan ke mode Presensi Siswa/Harian.`,
        user,
        errorType: "NOT_TEACHER",
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Duplicate Check
    const existing = attendanceRecords.find((r) => {
      if (r.userId !== user.id || r.date !== today) return false;
      if (mode === "pembelajaran") {
        return (sessionId && r.sessionId === sessionId) || (subjectId && r.subjectId === subjectId);
      }
      if (mode === "kegiatan" && ekskulId) {
        return r.ekskulId === ekskulId;
      }
      // Harian / Umum
      return r.userType === userType && !r.subjectId && !r.ekskulId;
    });

    if (existing) {
      return {
        success: false,
        message: `Sudah melakukan absensi hari ini: ${user.name} (${user.role.toUpperCase()}) pada pukul ${existing.time} WIB dengan status ${existing.status.toUpperCase()}.`,
        user,
        record: existing,
        isDuplicate: true,
        errorType: "DUPLICATE",
      };
    }

    // Determine status & cutoff
    let finalStatus: AttendanceRecord["status"] = forcedStatus || "hadir";
    if (!forcedStatus) {
      const hours = now.getHours();
      const mins = now.getMinutes();
      if (isTeacher) {
        // Teacher cutoff at 07:00
        if (hours > 7 || (hours === 7 && mins > 0)) {
          finalStatus = "terlambat";
        }
      } else {
        // Student cutoff at 07:15
        if (hours > 7 || (hours === 7 && mins > 15)) {
          finalStatus = "terlambat";
        }
      }
    }

    const defaultTitle =
      mode === "pembelajaran"
        ? "Presensi KBM Rombel"
        : mode === "kegiatan"
        ? "Presensi Ekstrakurikuler"
        : isTeacher
        ? "Presensi GTK / Guru Madrasah"
        : "Presensi Harian Siswa Terpadu";

    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      sessionTitle: sessionTitle || defaultTitle,
      userId: user.id,
      userType,
      classId: user.classId || classId,
      subjectId,
      ekskulId,
      teacherId: isTeacher ? user.id : (currentUser?.id || undefined),
      scannedBy: currentUser?.name || "Terminal Absensi sMTs",
      date: today,
      time: timeStr,
      status: finalStatus,
      method: "qr_scan",
      deviceInfo: deviceInfo || "sMTs Unified Scanner Terminal",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    const roleLabel = isTeacher ? "Guru/GTK" : isStudent ? "Siswa" : "Admin";
    addAuditLog("Scan QR Terpadu", `Presensi ${roleLabel}: ${user.name} berhasil dicatat (${finalStatus.toUpperCase()}) pada ${timeStr} WIB.`);
    showToast(
      finalStatus === "hadir" ? "success" : "warning",
      `Presensi ${roleLabel}: ${user.name}`,
      `Status: ${finalStatus.toUpperCase()} (Pukul ${timeStr} WIB)`
    );

    return {
      success: true,
      message: `Presensi Terpadu Berhasil: ${user.name} [${roleLabel}] - ${finalStatus.toUpperCase()}`,
      user,
      record: newRecord,
    };
  };

  const updateAttendanceRecordStatus = (id: string, status: AttendanceRecord["status"], note?: string) => {
    setAttendanceRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status, note: note !== undefined ? note : r.note } : r)));
    showToast("success", "Status Presensi Diperbarui", `Status diubah menjadi ${status.toUpperCase()}.`);
  };

  // Grades & Assessment
  const updateGradeWeights = (weights: GradeWeights) => {
    setGradeWeights(weights);
    addAuditLog("Ubah Bobot Nilai", `Bobot Nilai Rapor: Harian ${weights.daily}%, PTS ${weights.midterm}%, PAS ${weights.finalExam}%`);
    showToast("success", "Bobot Nilai Disimpan", "Formula perhitungan nilai akhir rapor diperbarui.");
  };

  const upsertStudentGrade = (gradeData: Partial<StudentSubjectGrade> & { studentId: string; subjectId: string; classId: string }) => {
    setStudentGrades((prev) => {
      const existingIdx = prev.findIndex((g) => g.studentId === gradeData.studentId && g.subjectId === gradeData.subjectId);
      const prevGrade = existingIdx >= 0 ? prev[existingIdx] : null;

      const dailyScores = gradeData.dailyScores ?? prevGrade?.dailyScores ?? [80];
      const assignmentScores = gradeData.assignmentScores ?? prevGrade?.assignmentScores ?? [80];
      const practicalScores = gradeData.practicalScores ?? prevGrade?.practicalScores ?? [80];
      const midtermScore = gradeData.midtermScore ?? prevGrade?.midtermScore ?? 80;
      const finalScore = gradeData.finalScore ?? prevGrade?.finalScore ?? 80;

      // Calculate composite daily average
      const avgDaily =
        dailyScores.concat(assignmentScores, practicalScores).reduce((a, b) => a + b, 0) /
        (dailyScores.length + assignmentScores.length + practicalScores.length || 1);

      // Final score formula with weights
      const calculated = Math.round(
        (avgDaily * (gradeWeights.daily / 100)) +
        (midtermScore * (gradeWeights.midterm / 100)) +
        (finalScore * (gradeWeights.finalExam / 100))
      );

      const predicate: "A" | "B" | "C" | "D" =
        calculated >= 90 ? "A" : calculated >= 80 ? "B" : calculated >= 70 ? "C" : "D";
      const status: "tuntas" | "belum_tuntas" = calculated >= 75 ? "tuntas" : "belum_tuntas";

      const updatedRecord: StudentSubjectGrade = {
        id: prevGrade?.id || `grd_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        studentId: gradeData.studentId,
        subjectId: gradeData.subjectId,
        classId: gradeData.classId,
        academicYear: schoolProfile.academicYear,
        semester: schoolProfile.semester,
        dailyScores,
        assignmentScores,
        practicalScores,
        midtermScore,
        finalScore,
        finalCalculatedGrade: calculated,
        predicate,
        competencyDescription:
          gradeData.competencyDescription ??
          prevGrade?.competencyDescription ??
          `Menunjukkan penguasaan ${predicate === "A" ? "sangat baik" : predicate === "B" ? "baik" : "cukup"} dalam capaian pembelajaran semester ini.`,
        isRemedial: prevGrade?.isRemedial || false,
        initialScore: prevGrade?.initialScore,
        remedialScore: prevGrade?.remedialScore,
        remedialDate: prevGrade?.remedialDate,
        status,
      };

      if (existingIdx >= 0) {
        const clone = [...prev];
        clone[existingIdx] = updatedRecord;
        return clone;
      }
      return [updatedRecord, ...prev];
    });

    showToast("success", "Nilai Tersimpan", "Data nilai siswa berhasil dihitung dan disimpan.");
  };

  const processRemedial = (gradeId: string, remedialScore: number) => {
    setStudentGrades((prev) =>
      prev.map((g) => {
        if (g.id === gradeId) {
          const initial = g.initialScore ?? g.finalCalculatedGrade;
          const finalVal = Math.max(initial, Math.min(remedialScore, 80)); // Remedial cap at KKM / 80
          return {
            ...g,
            isRemedial: true,
            initialScore: initial,
            remedialScore,
            remedialDate: new Date().toISOString().split("T")[0],
            finalCalculatedGrade: finalVal,
            predicate: finalVal >= 90 ? "A" : finalVal >= 80 ? "B" : finalVal >= 70 ? "C" : "D",
            status: finalVal >= 75 ? "tuntas" : "belum_tuntas",
          };
        }
        return g;
      })
    );
    addAuditLog("Proses Remedial", `Memproses perbaikan nilai remedial untuk entri ID: ${gradeId}. Nilai remedial: ${remedialScore}`);
    showToast("success", "Remedial Berhasil", "Nilai remedial siswa telah diperbarui.");
  };

  // Report Cards
  const saveReportCard = (reportData: Partial<ReportCard> & { studentId: string; classId: string }) => {
    setReportCards((prev) => {
      const idx = prev.findIndex((r) => r.studentId === reportData.studentId && r.academicYear === schoolProfile.academicYear && r.semester === schoolProfile.semester);
      const base: ReportCard = idx >= 0 ? prev[idx] : {
        id: `rep_${Date.now()}`,
        studentId: reportData.studentId,
        classId: reportData.classId,
        academicYear: schoolProfile.academicYear,
        semester: schoolProfile.semester,
        issueDate: "19 Desember 2025",
        issuePlace: "Jakarta",
        attendanceSummary: { hadir: 90, sakit: 2, izin: 1, alpa: 0 },
        extracurriculars: [{ name: "Pramuka", predicate: "Baik", description: "Aktif mengikuti kegiatan rutin" }],
        achievements: [],
        physicalData: { heightCm: 160, weightKg: 50, hearingHealth: "Sehat", visionHealth: "Baik", dentalHealth: "Sehat" },
        homeroomNotes: "Tingkatkan kedisiplinan dan semangat belajar.",
        status: "draft",
      };

      const updated: ReportCard = { ...base, ...reportData };
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = updated;
        return clone;
      }
      return [updated, ...prev];
    });

    showToast("success", "E-Rapor Tersimpan", "Data e-rapor siswa berhasil disimpan.");
  };

  const finalizeReportCard = (reportId: string) => {
    setReportCards((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "finalized", finalizedAt: new Date().toISOString() } : r))
    );
    addAuditLog("Finalisasi Rapor", `Memfinalisasi dokumen E-Rapor ID: ${reportId}`);
    showToast("success", "Rapor Difinalisasi", "Dokumen e-rapor telah siap dicetak / diunduh.");
  };

  // Blog Post Management (Guru & Admin)
  const addBlogPost = (postData: Omit<BlogPost, "id" | "createdAt" | "updatedAt" | "views">): BlogPost => {
    const newPost: BlogPost = {
      id: `post_${Date.now()}`,
      ...postData,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setBlogPosts((prev) => [newPost, ...prev]);
    addAuditLog("Buat Artikel Blog", `Membuat artikel baru: "${newPost.title}" (${newPost.status})`);
    showToast(
      "success",
      newPost.status === "submitted" ? "Artikel Diajukan" : "Draft Disimpan",
      newPost.status === "submitted"
        ? "Artikel berhasil dikirimkan dan menunggu review Admin."
        : "Draft artikel berhasil disimpan."
    );
    return newPost;
  };

  const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    setBlogPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    addAuditLog("Update Artikel Blog", `Memperbarui artikel ID: ${id}`);
    showToast("success", "Artikel Diperbarui", "Perubahan artikel blog berhasil disimpan.");
  };

  const submitBlogPostForReview = (id: string) => {
    setBlogPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "submitted",
              submittedAt: new Date().toISOString(),
              rejectionReason: undefined,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    addAuditLog("Pengajuan Review Blog", `Mengajukan artikel ID: ${id} untuk review Administrator`);
    showToast("success", "Artikel Diajukan", "Artikel berhasil diajukan untuk ditinjau oleh Administrator.");
  };

  const reviewBlogPost = (
    id: string,
    action: "approve" | "reject" | "archive",
    rejectionReason?: string,
    isFeatured?: boolean
  ) => {
    setBlogPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (action === "approve") {
          return {
            ...p,
            status: "published",
            publishedAt: p.publishedAt || new Date().toISOString(),
            rejectionReason: undefined,
            isFeatured: isFeatured !== undefined ? isFeatured : p.isFeatured,
            updatedAt: new Date().toISOString(),
          };
        }
        if (action === "reject") {
          return {
            ...p,
            status: "rejected",
            rejectedAt: new Date().toISOString(),
            rejectionReason: rejectionReason || "Perlu revisi konten.",
            updatedAt: new Date().toISOString(),
          };
        }
        if (action === "archive") {
          return {
            ...p,
            status: "archived",
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    const actionLabel = action === "approve" ? "Disetujui & Diterbitkan" : action === "reject" ? "Ditolak / Perlu Revisi" : "Diarsipkan";
    addAuditLog("Review Artikel Blog", `Admin melakukan ${action} pada artikel ID: ${id}`);
    showToast("success", "Status Artikel Berubah", `Artikel berhasil ${actionLabel}.`);
  };

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.id !== id));
    addAuditLog("Hapus Artikel Blog", `Menghapus artikel ID: ${id}`);
    showToast("info", "Artikel Dihapus", "Artikel blog telah dihapus dari sistem.");
  };

  const toggleFeaturedPost = (id: string) => {
    setBlogPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured, updatedAt: new Date().toISOString() } : p))
    );
    showToast("success", "Status Featured Diperbarui", "Headline artikel berhasil diubah.");
  };

  const addBlogCategory = (name: string, description?: string) => {
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
    const newCat: BlogCategory = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      description,
      count: 0,
    };
    setBlogCategories((prev) => [...prev, newCat]);
    showToast("success", "Kategori Ditambahkan", `Kategori "${name}" berhasil dibuat.`);
  };

  // Organization Structure Management
  const addOrganizationMember = (member: Omit<OrganizationStructureItem, "id">) => {
    const newItem: OrganizationStructureItem = {
      id: `org_${Date.now()}`,
      ...member,
    };
    setOrganizationStructure((prev) => [...prev, newItem]);
    addAuditLog("Tambah Struktur Organisasi", `Menambahkan posisi ${newItem.position} (${newItem.name})`);
    showToast("success", "Posisi Ditambahkan", `Posisi ${newItem.position} berhasil ditambahkan ke bagan organisasi.`);
  };

  const updateOrganizationMember = (id: string, updates: Partial<OrganizationStructureItem>) => {
    setOrganizationStructure((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    addAuditLog("Update Struktur Organisasi", `Memperbarui posisi struktur ID: ${id}`);
    showToast("success", "Bagan Diperbarui", "Data struktur organisasi berhasil diperbarui.");
  };

  const deleteOrganizationMember = (id: string) => {
    setOrganizationStructure((prev) => prev.filter((item) => item.id !== id));
    addAuditLog("Hapus Struktur Organisasi", `Menghapus posisi ID: ${id}`);
    showToast("info", "Posisi Dihapus", "Posisi telah dihapus dari struktur organisasi.");
  };

  // Contact Inquiries Management
  const submitContactMessage = (name: string, email: string, phone: string, subject: string, message: string) => {
    const newMsg: ContactMessage = {
      id: `msg_${Date.now()}`,
      name,
      email,
      phone,
      subject,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setContactMessages((prev) => [newMsg, ...prev]);

    // Send to backend API asynchronously
    fetch("/api/contact/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, subject, message }),
    }).catch((err) => console.log("Contact API submission fallback to local:", err));

    showToast("success", "Pesan Terkirim", "Terima kasih! Pesan dan pertanyaan Anda telah diterima pihak madrasah.");
    return { success: true, message: "Pesan berhasil dikirim." };
  };

  const markContactMessageRead = (id: string) => {
    setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    fetch(`/api/contact/messages/${id}/read`, { method: "PUT" }).catch(() => {});
  };

  const deleteContactMessage = (id: string) => {
    setContactMessages((prev) => prev.filter((m) => m.id !== id));
    fetch(`/api/contact/messages/${id}`, { method: "DELETE" }).catch(() => {});
    showToast("info", "Pesan Dihapus", "Pesan kontak berhasil dihapus.");
  };

  // Reset & Backup Data
  const resetToDefaultData = () => {
    localStorage.clear();
    setSchoolProfile(initialSchoolProfile);
    setUsers(initialUsers);
    setClasses(initialClasses);
    setSubjects(initialSubjects);
    setSchedules(initialSchedules);
    setCurriculums(initialCurriculums);
    setQuestions(initialQuestions);
    setExams(initialExams);
    setExamAttempts(initialExamAttempts);
    setAssignments(initialAssignments);
    setAssignmentSubmissions(initialAssignmentSubmissions);
    setAttendanceSessions(initialAttendanceSessions);
    setAttendanceRecords(initialAttendanceRecords);
    setGradeWeights(initialGradeWeights);
    setStudentGrades(initialStudentGrades);
    setReportCards(initialReportCards);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setCurrentUser(initialUsers[0]);
    showToast("info", "Data Direset", "Semua data telah dikembalikan ke kondisi awal (demo).");
  };

  const exportDatabaseJSON = (): string => {
    const fullDb = {
      schoolProfile,
      users,
      classes,
      subjects,
      schedules,
      curriculums,
      questions,
      exams,
      examAttempts,
      assignments,
      assignmentSubmissions,
      attendanceSessions,
      attendanceRecords,
      gradeWeights,
      studentGrades,
      reportCards,
      notifications,
      auditLogs,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    return JSON.stringify(fullDb, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
      if (data.users) setUsers(data.users);
      if (data.classes) setClasses(data.classes);
      if (data.subjects) setSubjects(data.subjects);
      if (data.schedules) setSchedules(data.schedules);
      if (data.curriculums) setCurriculums(data.curriculums);
      if (data.questions) setQuestions(data.questions);
      if (data.exams) setExams(data.exams);
      if (data.examAttempts) setExamAttempts(data.examAttempts);
      if (data.assignments) setAssignments(data.assignments);
      if (data.assignmentSubmissions) setAssignmentSubmissions(data.assignmentSubmissions);
      if (data.attendanceSessions) setAttendanceSessions(data.attendanceSessions);
      if (data.attendanceRecords) setAttendanceRecords(data.attendanceRecords);
      if (data.gradeWeights) setGradeWeights(data.gradeWeights);
      if (data.studentGrades) setStudentGrades(data.studentGrades);
      if (data.reportCards) setReportCards(data.reportCards);
      showToast("success", "Restore Sukses", "Database EduSmart School berhasil dipulihkan.");
      return true;
    } catch {
      showToast("error", "Restore Gagal", "Format file JSON tidak valid.");
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loginAs,
        loginWithCredentials,
        logout,
        schoolProfile,
        updateSchoolProfile,
        users,
        addUser,
        updateUser,
        deleteUser,
        classes,
        addClass,
        updateClass,
        deleteClass,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        curriculums,
        addCurriculum,
        updateCurriculum,
        deleteCurriculum,
        questions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        importQuestions,
        exams,
        addExam,
        updateExam,
        deleteExam,
        examAttempts,
        submitExamAttempt,
        gradeExamAttempt,
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        assignmentSubmissions,
        submitAssignment,
        gradeAssignment,
        attendanceSessions,
        createAttendanceSession,
        closeAttendanceSession,
        attendanceRecords,
        recordStudentAttendance,
        recordTeacherAttendance,
        scanStudentPersonalQR,
        scanTeacherPersonalQR,
        scanUnifiedPersonalQR,
        teacherDuties,
        addTeacherDuty,
        updateTeacherDuty,
        deleteTeacherDuty,
        toggleTeacherDutyStatus,
        getTeacherDuties,
        activeTeacherContext,
        setActiveTeacherContext,
        extracurriculars,
        addExtracurricular,
        updateExtracurricular,
        deleteExtracurricular,
        regenerateUserQRToken,
        updateAttendanceRecordStatus,
        studentGrades,
        gradeWeights,
        updateGradeWeights,
        upsertStudentGrade,
        processRemedial,
        reportCards,
        saveReportCard,
        finalizeReportCard,
        notifications,
        markNotificationRead,
        addNotification,
        auditLogs,
        addAuditLog,
        toasts,
        showToast,
        removeToast,
        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON,
        activeTab,
        setActiveTab,
        publicRoute,
        setPublicRoute,
        blogDetailSlug,
        setBlogDetailSlug,
        appMode,
        setAppMode,
        navigateToPublic,
        navigateToDashboard,
        publicStats,
        isStatsLoading,
        fetchPublicData,
        blogPosts,
        blogCategories,
        blogTags,
        addBlogPost,
        updateBlogPost,
        submitBlogPostForReview,
        reviewBlogPost,
        deleteBlogPost,
        toggleFeaturedPost,
        addBlogCategory,
        organizationStructure,
        addOrganizationMember,
        updateOrganizationMember,
        deleteOrganizationMember,
        contactMessages,
        submitContactMessage,
        markContactMessageRead,
        deleteContactMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
