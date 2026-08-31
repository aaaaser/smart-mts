import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { User, ClassRoom, Subject, ScheduleItem } from "../../types";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  GraduationCap,
  Plus,
  Check,
  QrCode,
  Printer,
  RefreshCw,
  Eye,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Activity,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { exportUsersToExcel } from "../../lib/excelExport";
import { MyQRCard } from "../attendance/MyQRCard";
import { BatchQRPrintModal } from "../attendance/BatchQRPrintModal";
import { api, DiagnosticResult } from "../../lib/api";

export const MasterDataView: React.FC = () => {
  const {
    currentUser,
    users,
    addUser,
    updateUser,
    deleteUser,
    deleteTeacher,
    resetUserPassword,
    regenerateUserQRToken,
    fetchUsers,
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
    schoolProfile,
    showToast,
  } = useApp();

  const isSuperAdmin = currentUser?.role === "admin";

  const [activeSubTab, setActiveSubTab] = useState<"guru" | "siswa" | "orangtua" | "kelas" | "mapel" | "jadwal">("guru");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  // QR Modal States
  const [selectedQRUser, setSelectedQRUser] = useState<User | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [regeneratingUserId, setRegeneratingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  // Delete Confirmation States (Super Admin Permanent Delete)
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Diagnostic & Repair States
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticResult | null>(null);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [isRepairLoading, setIsRepairLoading] = useState(false);
  const [repairResult, setRepairResult] = useState<{ success: boolean; message: string; repairedCount?: number } | null>(null);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    username: "",
    email: "",
    nipOrNis: "",
    role: "guru" as User["role"],
    phone: "",
    classId: "",
    childStudentId: "",
    subjectIds: [] as string[],
  });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: "",
    gradeLevel: 8,
    academicYear: schoolProfile.academicYear,
    homeroomTeacherId: "",
    room: "",
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    name: "",
    code: "",
    gradeLevel: 8,
    kkm: 75,
    teacherId: "",
    hoursPerWeek: 4,
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    classId: "cls_8a",
    subjectId: "subj_mtk",
    teacherId: "teacher_01",
    day: "Senin" as ScheduleItem["day"],
    startTime: "07:30",
    endTime: "09:00",
    room: "Ruang 8-A",
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchRole =
      activeSubTab === "guru"
        ? u.role === "guru"
        : activeSubTab === "siswa"
        ? u.role === "siswa"
        : activeSubTab === "orangtua"
        ? u.role === "orangtua"
        : true;

    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nipOrNis && u.nipOrNis.includes(searchTerm));

    const matchClass =
      selectedClassFilter === "all" || (u.classId && u.classId === selectedClassFilter);

    return matchRole && matchSearch && matchClass;
  });

  // Open Diagnostic Modal
  const openDiagnostic = async () => {
    setIsDiagnosticModalOpen(true);
    setRepairResult(null);
    setIsDiagnosticLoading(true);
    try {
      const data = await api.getDiagnostic();
      setDiagnosticData(data);
    } catch (e: any) {
      showToast("error", "Diagnostik Gagal", e?.message || "Tidak dapat menghubungi server.");
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  const handleRunRepair = async () => {
    setIsRepairLoading(true);
    try {
      const res = await api.runRepair();
      setRepairResult(res);
      const data = await api.getDiagnostic();
      setDiagnosticData(data);
      await fetchUsers();
      showToast("success", "Perbaikan Berhasil", res.message);
    } catch (e: any) {
      showToast("error", "Perbaikan Gagal", e?.message || "Terjadi kesalahan saat perbaikan DB.");
    } finally {
      setIsRepairLoading(false);
    }
  };

  // Open User Modal
  const openAddUser = (role: User["role"]) => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      username: "",
      email: "",
      nipOrNis: "",
      role,
      phone: "",
      classId: classes[0]?.id || "",
      childStudentId: users.find((u) => u.role === "siswa")?.id || "",
      subjectIds: [],
    });
    setIsUserModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      username: u.username,
      email: u.email,
      nipOrNis: u.nipOrNis || "",
      role: u.role,
      phone: u.phone || "",
      classId: u.classId || "",
      childStudentId: u.childStudentId || "",
      subjectIds: u.subjectIds || [],
    });
    setIsUserModalOpen(true);
  };

  const handleViewQR = (u: User) => {
    setSelectedQRUser(u);
    setIsQRModalOpen(true);
  };

  const handleResetPassword = async (u: User) => {
    const identifier = u.role === "guru" ? `NIP: ${u.nipOrNis || u.username}` : u.role === "siswa" ? `NIS: ${u.nipOrNis || u.username}` : `No HP: ${u.phone || u.username}`;
    if (
      window.confirm(
        `Apakah Anda yakin ingin mereset password untuk ${u.name} (${identifier})?\n\nPassword akan dikembalikan ke default: 'smtslogin' dan pengguna wajib mengganti password saat login.`
      )
    ) {
      setResettingUserId(u.id);
      try {
        const res = await resetUserPassword(u.id);
        if (res.success) {
          showToast("success", "Password Direset", `Password untuk ${u.name} berhasil direset ke 'smtslogin'.`);
        }
      } catch (err: any) {
        showToast("error", "Gagal Reset Password", err?.message || "Terjadi kesalahan.");
      } finally {
        setResettingUserId(null);
      }
    }
  };

  const handleRegenerateQR = async (u: User) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin membuat ulang QR Code untuk ${u.name}? QR Code lama akan dinonaktifkan di PostgreSQL dan token baru akan dibuat.`
      )
    ) {
      setRegeneratingUserId(u.id);
      try {
        const newToken = await regenerateUserQRToken(u.id);
        showToast("success", "QR Code Diregenerasi", `QR Code untuk ${u.name} berhasil diperbarui: ${newToken}`);
      } catch (err: any) {
        showToast("error", "Gagal Regenerasi QR", err?.message || "Terjadi kesalahan.");
      } finally {
        setRegeneratingUserId(null);
      }
    }
  };

  const handlePromptDelete = (u: User) => {
    if (!isSuperAdmin) {
      showToast(
        "error",
        "Akses Ditolak",
        "Hanya Super Admin yang memiliki wewenang untuk menghapus data Guru / pengguna dari database."
      );
      return;
    }
    setUserToDelete(u);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      if (userToDelete.role === "guru") {
        await deleteTeacher(userToDelete.id);
      } else {
        await deleteUser(userToDelete.id);
      }
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      showToast("error", "Gagal Menghapus", err?.message || "Terjadi kesalahan saat menghapus dari database.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name) {
      showToast("error", "Validasi", "Nama lengkap wajib diisi.");
      return;
    }

    // Role-specific identifier validation
    if (userFormData.role === "guru" && !userFormData.nipOrNis) {
      showToast("error", "Validasi", "NIP / NUPTK Guru wajib diisi untuk identifier login.");
      return;
    }
    if (userFormData.role === "siswa" && !userFormData.nipOrNis) {
      showToast("error", "Validasi", "NIS Siswa wajib diisi untuk identifier login.");
      return;
    }
    if (userFormData.role === "orangtua" && !userFormData.phone) {
      showToast("error", "Validasi", "Nomor WhatsApp/HP Orang Tua wajib diisi untuk identifier login.");
      return;
    }

    // Auto-generate username and email if empty
    const sanitizedIdentifier = (userFormData.nipOrNis || userFormData.phone || userFormData.name.toLowerCase().replace(/\s+/g, "")).trim();
    const finalUsername = userFormData.username.trim() || sanitizedIdentifier;
    const finalEmail = userFormData.email.trim() || (
      userFormData.role === "guru"
        ? `${sanitizedIdentifier}@guru.mts.id`
        : userFormData.role === "siswa"
        ? `${sanitizedIdentifier}@siswa.mts.id`
        : `ortu.${sanitizedIdentifier}@wali.mts.id`
    );

    const payload = {
      ...userFormData,
      username: finalUsername,
      email: finalEmail,
    };

    setIsSavingUser(true);
    try {
      if (editingUser) {
        updateUser(editingUser.id, payload);
        setIsUserModalOpen(false);
      } else {
        const res = await addUser(payload);
        if (res.success) {
          setIsUserModalOpen(false);
        }
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  // Open Class Modal
  const openAddClass = () => {
    setEditingClass(null);
    setClassFormData({
      name: "",
      gradeLevel: 8,
      academicYear: schoolProfile.academicYear,
      homeroomTeacherId: users.find((u) => u.role === "guru")?.id || "",
      room: "",
    });
    setIsClassModalOpen(true);
  };

  const openEditClass = (c: ClassRoom) => {
    setEditingClass(c);
    setClassFormData({
      name: c.name,
      gradeLevel: c.gradeLevel,
      academicYear: c.academicYear,
      homeroomTeacherId: c.homeroomTeacherId,
      room: c.room || "",
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name) return;
    if (editingClass) {
      updateClass(editingClass.id, classFormData);
    } else {
      addClass(classFormData);
    }
    setIsClassModalOpen(false);
  };

  // Open Subject Modal
  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectFormData({
      name: "",
      code: "",
      gradeLevel: 8,
      kkm: 75,
      teacherId: users.find((u) => u.role === "guru")?.id || "",
      hoursPerWeek: 4,
    });
    setIsSubjectModalOpen(true);
  };

  const openEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjectFormData({
      name: s.name,
      code: s.code,
      gradeLevel: s.gradeLevel,
      kkm: s.kkm,
      teacherId: s.teacherId || "",
      hoursPerWeek: s.hoursPerWeek,
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.name || !subjectFormData.code) return;
    if (editingSubject) {
      updateSubject(editingSubject.id, subjectFormData);
    } else {
      addSubject(subjectFormData);
    }
    setIsSubjectModalOpen(false);
  };

  // Open Schedule Modal
  const openAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleFormData({
      classId: classes[0]?.id || "cls_8a",
      subjectId: subjects[0]?.id || "subj_mtk",
      teacherId: users.find((u) => u.role === "guru")?.id || "teacher_01",
      day: "Senin",
      startTime: "07:30",
      endTime: "09:00",
      room: "Ruang 8-A",
    });
    setIsScheduleModalOpen(true);
  };

  const openEditSchedule = (sch: ScheduleItem) => {
    setEditingSchedule(sch);
    setScheduleFormData({
      classId: sch.classId,
      subjectId: sch.subjectId,
      teacherId: sch.teacherId,
      day: sch.day,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room || "",
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleFormData);
    } else {
      addSchedule(scheduleFormData);
    }
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Manajemen Data Master</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data Guru, Siswa, Orang Tua, Kelas (Rombel), Mapel, dan Jadwal Pelajaran.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center flex-wrap gap-2">
          {(activeSubTab === "guru" || activeSubTab === "siswa" || activeSubTab === "orangtua") && (
            <>
              <button
                onClick={openDiagnostic}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Diagnostik & Perbaikan Akun Database PostgreSQL"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Diagnostik DB</span>
              </button>

              <button
                onClick={() => exportUsersToExcel(filteredUsers, activeSubTab.toUpperCase())}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => setIsBatchPrintOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-2xs transition-colors cursor-pointer"
                title="Cetak Masal Kartu ID & QR Code"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>Cetak Masal QR</span>
              </button>

              <button
                onClick={() => openAddUser(activeSubTab as User["role"])}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah {activeSubTab === "guru" ? "Guru" : activeSubTab === "siswa" ? "Siswa" : "Orang Tua"}</span>
              </button>
            </>
          )}

          {activeSubTab === "kelas" && (
            <button
              onClick={openAddClass}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rombel Kelas</span>
            </button>
          )}

          {activeSubTab === "mapel" && (
            <button
              onClick={openAddSubject}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}

          {activeSubTab === "jadwal" && (
            <button
              onClick={openAddSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Pelajaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1">
        {[
          { id: "guru", label: "Data Guru / GTK", count: users.filter((u) => u.role === "guru").length },
          { id: "siswa", label: "Data Siswa", count: users.filter((u) => u.role === "siswa").length },
          { id: "orangtua", label: "Data Orang Tua", count: users.filter((u) => u.role === "orangtua").length },
          { id: "kelas", label: "Rombel & Kelas", count: classes.length },
          { id: "mapel", label: "Mata Pelajaran", count: subjects.length },
          { id: "jadwal", label: "Jadwal Pelajaran", count: schedules.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setSearchTerm("");
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeSubTab === tab.id
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeSubTab === tab.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* USERS TABLE (Guru, Siswa, Orang Tua) */}
      {(activeSubTab === "guru" || activeSubTab === "siswa" || activeSubTab === "orangtua") && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Cari ${activeSubTab} (Nama, NIP/NIS)...`}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {activeSubTab === "siswa" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Kelas / Rombel</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

            {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Nama & Identitas</th>
                  <th className="px-5 py-3">NIP / NIS</th>
                  <th className="px-5 py-3">
                    {activeSubTab === "guru"
                      ? "Mata Pelajaran"
                      : activeSubTab === "siswa"
                      ? "Kelas / Rombel"
                      : "Nama Siswa Terhubung"}
                  </th>
                  <th className="px-5 py-3">QR Code Presensi</th>
                  <th className="px-5 py-3">Kontak</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Tidak ada data yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const studentClass = classes.find((c) => c.id === u.classId);
                    const childStudent = users.find((x) => x.id === u.childStudentId);
                    const assignedSubjects = subjects.filter((s) => u.subjectIds?.includes(s.id));

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                              alt={u.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-700">{u.nipOrNis || "-"}</td>
                        <td className="px-5 py-3.5">
                          {activeSubTab === "guru" && (
                            <div className="flex flex-wrap gap-1">
                              {assignedSubjects.length > 0 ? (
                                assignedSubjects.map((s) => (
                                  <span
                                    key={s.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  >
                                    {s.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          )}
                          {activeSubTab === "siswa" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                              {studentClass?.name || "Belum ada kelas"}
                            </span>
                          )}
                          {activeSubTab === "orangtua" && (
                            <div>
                              <span className="font-semibold text-slate-800">{childStudent?.name || "Dimas Pratama"}</span>
                              <span className="block text-[10px] text-slate-400">NIS: {childStudent?.nipOrNis || "20240801"}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewQR(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-mono text-[11px] font-bold transition-all shadow-2xs cursor-pointer group"
                              title="Klik untuk melihat dan mencetak Kartu QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                              <span className="truncate max-w-[110px]">{u.qrToken || "SMTS-UNASSIGNED"}</span>
                            </button>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.qrIsActive !== false ? "bg-emerald-500" : "bg-rose-400"
                              }`}
                              title={u.qrIsActive !== false ? "QR Aktif di DB" : "QR Nonaktif"}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{u.phone || "-"}</td>
                        <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleViewQR(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat & Cetak Kartu QR"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(u)}
                            disabled={resettingUserId === u.id}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password ke default (smtslogin)"
                          >
                            <KeyRound
                              className={`w-3.5 h-3.5 text-amber-600 ${
                                resettingUserId === u.id ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleRegenerateQR(u)}
                            disabled={regeneratingUserId === u.id}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Regenerasi QR Code Baru (Simpan ke DB)"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 text-teal-600 ${
                                regeneratingUserId === u.id ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuperAdmin
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                : "text-slate-300 opacity-60 cursor-not-allowed"
                            }`}
                            title={
                              isSuperAdmin
                                ? `Hapus permanen ${u.name} dari database`
                                : "Hanya Super Admin yang berhak menghapus data"
                            }
                            disabled={!isSuperAdmin}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROMBEL & KELAS TABLE */}
      {activeSubTab === "kelas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const homeroom = users.find((u) => u.id === cls.homeroomTeacherId);
            const studentCount = users.filter((u) => u.classId === cls.id && u.role === "siswa").length;

            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">{cls.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Tingkat {cls.gradeLevel}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wali Kelas:</span>
                      <span className="font-semibold text-slate-800">{homeroom?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jumlah Siswa:</span>
                      <span className="font-bold text-slate-900">{studentCount} Siswa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ruang:</span>
                      <span>{cls.room || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditClass(cls)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kelas ${cls.name}?`)) deleteClass(cls.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATA PELAJARAN TABLE */}
      {activeSubTab === "mapel" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Kode</th>
                  <th className="px-5 py-3">Mata Pelajaran</th>
                  <th className="px-5 py-3">Tingkat</th>
                  <th className="px-5 py-3">KKM Minimal</th>
                  <th className="px-5 py-3">Guru Pengampu</th>
                  <th className="px-5 py-3">Jam/Minggu</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subjects.map((s) => {
                  const teacher = users.find((u) => u.id === s.teacherId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{s.code}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{s.name}</td>
                      <td className="px-5 py-3.5">Kelas {s.gradeLevel}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded">
                          {s.kkm}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800">{teacher?.name || "-"}</td>
                      <td className="px-5 py-3.5">{s.hoursPerWeek} JP</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => openEditSubject(s)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus mapel ${s.name}?`)) deleteSubject(s.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JADWAL PELAJARAN TABLE */}
      {activeSubTab === "jadwal" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Hari</th>
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Kelas / Rombel</th>
                  <th className="px-5 py-3">Mata Pelajaran</th>
                  <th className="px-5 py-3">Guru Pengajar</th>
                  <th className="px-5 py-3">Ruang</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {schedules.map((sch) => {
                  const cls = classes.find((c) => c.id === sch.classId);
                  const subj = subjects.find((s) => s.id === sch.subjectId);
                  const teacher = users.find((u) => u.id === sch.teacherId);

                  return (
                    <tr key={sch.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{sch.day}</td>
                      <td className="px-5 py-3.5 font-mono text-emerald-700 font-semibold">
                        {sch.startTime} - {sch.endTime}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{cls?.name || "-"}</td>
                      <td className="px-5 py-3.5 text-slate-900 font-semibold">{subj?.name || "-"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{teacher?.name || "-"}</td>
                      <td className="px-5 py-3.5">{sch.room || "-"}</td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => openEditSchedule(sch)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus jadwal ini?")) deleteSchedule(sch.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL USER (GURU, SISWA, ORTU) */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? "Edit Data Pengguna" : `Tambah ${userFormData.role.toUpperCase()}`}
        subtitle="Lengkapi data profil akun pengguna EduSmart School"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              placeholder="e.g. Dr. H. Ahmad Sudrajat, M.Pd"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="e.g. ahmad_guru"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="e.g. ahmad@mtsn1.sch.id"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {userFormData.role === "guru" ? "NIP / NUPTK" : "NIS / NISN"}
              </label>
              <input
                type="text"
                value={userFormData.nipOrNis}
                onChange={(e) => setUserFormData({ ...userFormData, nipOrNis: e.target.value })}
                placeholder="Nomor Induk"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp/HP</label>
              <input
                type="text"
                value={userFormData.phone}
                onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              />
            </div>
          </div>

          {userFormData.role === "siswa" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas / Rombel</label>
              <select
                value={userFormData.classId}
                onChange={(e) => setUserFormData({ ...userFormData, classId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Tingkat {c.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Security & QR Auto-Creation Notice */}
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold text-emerald-950">Password Bawaan & QR Code Presensi</p>
              <p className="text-[11px] text-emerald-800">
                Password awal default: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded font-bold text-emerald-900">smtslogin</code>. Pengguna wajib mengganti password saat login pertama kali. Token QR unik dibuat otomatis dan disimpan di database PostgreSQL.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL KELAS */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? "Edit Rombel Kelas" : "Tambah Rombel Kelas"}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelas</label>
            <input
              type="text"
              required
              value={classFormData.name}
              onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
              placeholder="e.g. Kelas 8-D"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas</label>
              <select
                value={classFormData.gradeLevel}
                onChange={(e) => setClassFormData({ ...classFormData, gradeLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {[7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Kelas {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wali Kelas</label>
              <select
                value={classFormData.homeroomTeacherId}
                onChange={(e) => setClassFormData({ ...classFormData, homeroomTeacherId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {users
                  .filter((u) => u.role === "guru")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl">
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL MAPEL */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
              <input
                type="text"
                required
                value={subjectFormData.name}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                placeholder="e.g. Matematika"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Mapel</label>
              <input
                type="text"
                required
                value={subjectFormData.code}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                placeholder="e.g. MTK-8"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat</label>
              <input
                type="number"
                value={subjectFormData.gradeLevel}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, gradeLevel: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">KKM Minimal</label>
              <input
                type="number"
                value={subjectFormData.kkm}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, kkm: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam / Minggu</label>
              <input
                type="number"
                value={subjectFormData.hoursPerWeek}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, hoursPerWeek: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl">
              Simpan Mapel
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL JADWAL */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingSchedule ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran"}
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas / Rombel</label>
              <select
                value={scheduleFormData.classId}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, classId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
              <select
                value={scheduleFormData.subjectId}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, subjectId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
              <select
                value={scheduleFormData.day}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, day: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
              <input
                type="time"
                value={scheduleFormData.startTime}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai</label>
              <input
                type="time"
                value={scheduleFormData.endTime}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl">
              Simpan Jadwal
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL LIHAT & CETAK QR CARD PENGGUNA */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedQRUser(null);
        }}
        title={`Kartu Identitas & QR Code - ${selectedQRUser?.name || "Pengguna"}`}
        subtitle="Token presensi QR tersimpan di database PostgreSQL"
        maxWidth="max-w-xl"
      >
        {selectedQRUser ? (
          <div className="py-2">
            <MyQRCard targetUser={selectedQRUser} />
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400">Pengguna tidak ditemukan.</div>
        )}
      </Modal>

      {/* MODAL CETAK MASAL QR */}
      <BatchQRPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
      />

      {/* MODAL DIAGNOSTIK & PERBAIKAN DATABASE */}
      <Modal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        title="Diagnostik & Perbaikan Database Akun"
        subtitle="Pemeriksaan integritas akun PostgreSQL, login identifier, dan token QR"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {isDiagnosticLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-600 font-medium">Memeriksa struktur database PostgreSQL...</p>
            </div>
          ) : diagnosticData ? (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  diagnosticData.summary.allHealthy
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {diagnosticData.summary.allHealthy ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold">
                    {diagnosticData.summary.allHealthy
                      ? "Seluruh Akun & Identifier Normal"
                      : "Ditemukan Masalah Akun / Password / QR Token"}
                  </h4>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {diagnosticData.summary.allHealthy
                      ? "Seluruh data Guru (NIP), Siswa (NIS), dan Orang Tua (No. HP) telah terverifikasi dengan password hash bcrypt dan QR Token aktif."
                      : "Terdapat data akun atau hash password yang memerlukan perbaikan otomatis agar dapat login secara normal."}
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-lg font-black text-slate-900">{diagnosticData.totalUsers}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total User</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-lg font-black text-emerald-700">{diagnosticData.counts.teacher}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Guru (NIP)</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-lg font-black text-blue-700">{diagnosticData.counts.student}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Siswa (NIS)</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-lg font-black text-purple-700">{diagnosticData.counts.parent}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Orang Tua (HP)</div>
                </div>
              </div>

              {/* Issues Section */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-white">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Rincian Masalah Terdeteksi
                </h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Password belum di-hash bcrypt:</span>
                    <span className={`font-bold ${diagnosticData.summary.invalidPasswordHashCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {diagnosticData.summary.invalidPasswordHashCount} akun
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">User tanpa QR Code aktif:</span>
                    <span className={`font-bold ${diagnosticData.summary.missingQrCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {diagnosticData.summary.missingQrCount} akun
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Teacher/Student/Parent yatim:</span>
                    <span className={`font-bold ${diagnosticData.summary.orphanedProfilesCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {diagnosticData.summary.orphanedProfilesCount} profil
                    </span>
                  </div>
                </div>
              </div>

              {repairResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs">
                  <p className="font-bold">Hasil Perbaikan:</p>
                  <p className="text-[11px] mt-0.5">{repairResult.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={openDiagnostic}
                  disabled={isDiagnosticLoading || isRepairLoading}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Segarkan</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDiagnosticModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleRunRepair}
                    disabled={isRepairLoading}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${isRepairLoading ? "animate-spin" : ""}`} />
                    <span>{isRepairLoading ? "Memperbaiki..." : "Jalankan Perbaikan Otomatis"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400">Gagal memuat diagnostik.</div>
          )}
        </div>
      </Modal>

      {/* CONFIRMATION MODAL HAPUS GURU / PENGGUNA PERMANEN DARI DATABASE */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          if (!isDeletingUser) {
            setIsDeleteConfirmOpen(false);
            setUserToDelete(null);
          }
        }}
        title="Konfirmasi Hapus Data dari Database PostgreSQL"
        maxWidth="max-w-md"
      >
        {userToDelete && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900">Peringatan Penghapusan Database</h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Tindakan ini akan menghapus data{" "}
                  <strong className="font-semibold">{userToDelete.name}</strong> (
                  {userToDelete.role === "guru"
                    ? "Guru"
                    : userToDelete.role === "siswa"
                    ? "Siswa"
                    : userToDelete.role === "orangtua"
                    ? "Wali/Orang Tua"
                    : "Pengguna"}
                  ) secara <span className="font-bold underline">permanen dari database PostgreSQL</span>.
                </p>
                {userToDelete.role === "guru" && (
                  <p className="text-[11px] text-rose-600 mt-1.5">
                    Seluruh data tugas tambahan, jadwal pelajaran, bank soal & ujian, serta akun login yang terhubung dengan guru ini akan dibersihkan secara aman.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-bold text-slate-800">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIP / Identitas:</span>
                <span className="font-mono font-medium text-slate-700">{userToDelete.nipOrNis || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Otorisasi:</span>
                <span className="font-bold text-emerald-700 uppercase">
                  {currentUser?.role === "admin" ? "SUPER ADMIN (SAH)" : "BUKAN ADMIN"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingUser || !isSuperAdmin}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus dari Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen dari DB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
