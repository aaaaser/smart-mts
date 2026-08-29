import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { TeacherDuty, TeacherDutyType, Extracurricular, User } from "../../types";
import {
  Award,
  ShieldCheck,
  UserCheck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Modal } from "../common/Modal";

export const TeacherDutyManagementView: React.FC = () => {
  const {
    users,
    classes,
    teacherDuties,
    addTeacherDuty,
    updateTeacherDuty,
    deleteTeacherDuty,
    extracurriculars,
    addExtracurricular,
    updateExtracurricular,
    deleteExtracurricular,
    schoolProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"wali_kelas" | "guru_piket" | "pembina_ekskul" | "tugas_lain">("wali_kelas");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for TeacherDuty
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<TeacherDuty | null>(null);
  const [dutyFormData, setDutyFormData] = useState<{
    teacherId: string;
    type: TeacherDutyType;
    title: string;
    classId: string;
    piketDay: TeacherDuty["piketDay"];
    piketHours: string;
    piketLocation: string;
    ekskulId: string;
    description: string;
    academicYear: string;
    isActive: boolean;
  }>({
    teacherId: users.find((u) => u.role === "guru")?.id || "",
    type: "wali_kelas",
    title: "",
    classId: classes[0]?.id || "",
    piketDay: "Senin",
    piketHours: "06.30 - 14.00",
    piketLocation: "Gerbang Utama & Pos Piket",
    ekskulId: extracurriculars[0]?.id || "",
    description: "",
    academicYear: schoolProfile.academicYear,
    isActive: true,
  });

  // Modal State for Extracurricular
  const [isEkskulModalOpen, setIsEkskulModalOpen] = useState(false);
  const [editingEkskul, setEditingEkskul] = useState<Extracurricular | null>(null);
  const [ekskulFormData, setEkskulFormData] = useState<{
    name: string;
    category: Extracurricular["category"];
    leadTeacherId: string;
    scheduleDay: Extracurricular["scheduleDay"];
    scheduleTime: string;
    location: string;
    description: string;
    academicYear: string;
  }>({
    name: "",
    category: "Kepemimpinan",
    leadTeacherId: users.find((u) => u.role === "guru")?.id || "",
    scheduleDay: "Jumat",
    scheduleTime: "14.30 - 16.30 WIB",
    location: "Lapangan Utama Madrasah",
    description: "",
    academicYear: schoolProfile.academicYear,
  });

  const teachers = users.filter((u) => u.role === "guru");

  // Open Modal Helpers
  const openAddDutyModal = (type: TeacherDutyType) => {
    setEditingDuty(null);
    setDutyFormData({
      teacherId: teachers[0]?.id || "",
      type,
      title:
        type === "wali_kelas"
          ? `Wali Kelas ${classes[0]?.name || ""}`
          : type === "guru_piket"
          ? "Guru Piket Hari Senin"
          : type === "pembina_ekskul"
          ? `Pembina ${extracurriculars[0]?.name || "Ekskul"}`
          : "Tugas Tambahan Khusus",
      classId: classes[0]?.id || "",
      piketDay: "Senin",
      piketHours: "06.30 - 14.00",
      piketLocation: "Gerbang Utama & Pos Piket",
      ekskulId: extracurriculars[0]?.id || "",
      description: "",
      academicYear: schoolProfile.academicYear,
      isActive: true,
    });
    setIsDutyModalOpen(true);
  };

  const openEditDutyModal = (duty: TeacherDuty) => {
    setEditingDuty(duty);
    setDutyFormData({
      teacherId: duty.teacherId,
      type: duty.type,
      title: duty.title,
      classId: duty.classId || classes[0]?.id || "",
      piketDay: duty.piketDay || "Senin",
      piketHours: duty.piketHours || "06.30 - 14.00",
      piketLocation: duty.piketLocation || "Gerbang Utama",
      ekskulId: duty.ekskulId || extracurriculars[0]?.id || "",
      description: duty.description || "",
      academicYear: duty.academicYear,
      isActive: duty.isActive,
    });
    setIsDutyModalOpen(true);
  };

  const handleSaveDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyFormData.teacherId) return;

    if (editingDuty) {
      updateTeacherDuty(editingDuty.id, dutyFormData);
    } else {
      addTeacherDuty(dutyFormData);
    }
    setIsDutyModalOpen(false);
  };

  const openAddEkskulModal = () => {
    setEditingEkskul(null);
    setEkskulFormData({
      name: "",
      category: "Kepemimpinan",
      leadTeacherId: teachers[0]?.id || "",
      scheduleDay: "Jumat",
      scheduleTime: "14.30 - 16.30 WIB",
      location: "Lapangan Utama Madrasah",
      description: "",
      academicYear: schoolProfile.academicYear,
    });
    setIsEkskulModalOpen(true);
  };

  const openEditEkskulModal = (ekskul: Extracurricular) => {
    setEditingEkskul(ekskul);
    setEkskulFormData({
      name: ekskul.name,
      category: ekskul.category,
      leadTeacherId: ekskul.leadTeacherId,
      scheduleDay: ekskul.scheduleDay,
      scheduleTime: ekskul.scheduleTime,
      location: ekskul.location,
      description: ekskul.description,
      academicYear: ekskul.academicYear,
    });
    setIsEkskulModalOpen(true);
  };

  const handleSaveEkskul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekskulFormData.name.trim() || !ekskulFormData.leadTeacherId) return;

    if (editingEkskul) {
      updateExtracurricular(editingEkskul.id, ekskulFormData);
    } else {
      addExtracurricular({
        ...ekskulFormData,
        memberStudentIds: [],
      });
    }
    setIsEkskulModalOpen(false);
  };

  // Filtered duties
  const filteredDuties = teacherDuties.filter((d) => {
    if (d.type !== activeTab) return false;
    const teacher = users.find((u) => u.id === d.teacherId);
    return (
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher?.name && teacher.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Penugasan Guru & Ekstrakurikuler
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              T.A. {schoolProfile.academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola tugas tambahan: Wali Kelas, Guru Piket Harian, Pembina Ekstrakurikuler, dan Koordinator Madrasah tanpa membuat akun terpisah.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === "pembina_ekskul" ? (
            <button
              onClick={openAddEkskulModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ekstrakurikuler</span>
            </button>
          ) : (
            <button
              onClick={() => openAddDutyModal(activeTab)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                Tambah Penugasan {activeTab === "wali_kelas" ? "Wali Kelas" : activeTab === "guru_piket" ? "Guru Piket" : "Tugas Khusus"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("wali_kelas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "wali_kelas"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Wali Kelas ({teacherDuties.filter((d) => d.type === "wali_kelas").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("guru_piket")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "guru_piket"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Guru Piket ({teacherDuties.filter((d) => d.type === "guru_piket").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("pembina_ekskul")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "pembina_ekskul"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pembina Ekstrakurikuler ({extracurriculars.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tugas_lain")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "tugas_lain"
              ? "bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Tugas Tambahan Lain</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: WALI KELAS                                       */}
      {/* ======================================================== */}
      {activeTab === "wali_kelas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const duty = teacherDuties.find((d) => d.type === "wali_kelas" && d.classId === cls.id);
              const teacher = users.find((u) => u.id === (duty?.teacherId || cls.homeroomTeacherId));
              const studentCount = users.filter((u) => u.role === "siswa" && u.classId === cls.id).length;

              return (
                <div
                  key={cls.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900">
                        Kelas {cls.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Tingkat {cls.gradeLevel} • {studentCount} Siswa
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={teacher?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                        alt={teacher?.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Wali Kelas
                        </p>
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {teacher?.name || "Belum Ditugaskan"}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          NIP: {teacher?.nipOrNis || teacher?.nip || "-"}
                        </p>
                      </div>
                    </div>

                    {duty?.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                        {duty.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aktif T.A. {schoolProfile.academicYear}
                    </span>

                    <button
                      onClick={() => {
                        if (duty) {
                          openEditDutyModal(duty);
                        } else {
                          openAddDutyModal("wali_kelas");
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ganti / Kelola</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GURU PIKET                                       */}
      {/* ======================================================== */}
      {activeTab === "guru_piket" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const).map((day) => {
              const piketDuties = teacherDuties.filter((d) => d.type === "guru_piket" && d.piketDay === day);

              return (
                <div
                  key={day}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-sm font-black text-slate-900">
                          Hari {day}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {piketDuties.length} Guru Ditugaskan
                      </span>
                    </div>

                    <div className="space-y-3 mt-3">
                      {piketDuties.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          Belum ada guru piket untuk hari {day}.
                        </p>
                      ) : (
                        piketDuties.map((d) => {
                          const teacher = users.find((u) => u.id === d.teacherId);
                          return (
                            <div
                              key={d.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={teacher?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                                  alt={teacher?.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {teacher?.name || d.teacherId}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {d.piketHours || "06.30 - 14.00"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditDutyModal(d)}
                                  className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteTeacherDuty(d.id)}
                                  className="p-1 text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDutyFormData((prev) => ({ ...prev, piketDay: day, title: `Guru Piket Hari ${day}` }));
                      openAddDutyModal("guru_piket");
                    }}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Piket {day}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PEMBINA EKSTRAKURIKULER                           */}
      {/* ======================================================== */}
      {activeTab === "pembina_ekskul" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extracurriculars.map((ekskul) => {
              const leadTeacher = users.find((u) => u.id === ekskul.leadTeacherId);
              return (
                <div
                  key={ekskul.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 text-teal-900">
                        {ekskul.category}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {ekskul.memberStudentIds?.length || 0} Siswa Anggota
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {ekskul.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {ekskul.description}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Pembina: <strong>{leadTeacher?.name || "Belum Ditentukan"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Jadwal: {ekskul.scheduleDay} ({ekskul.scheduleTime})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Lokasi: {ekskul.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditEkskulModal(ekskul)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteExtracurricular(ekskul.id)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TUGAS LAINNYA                                    */}
      {/* ======================================================== */}
      {activeTab === "tugas_lain" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Tugas Tambahan Khusus
              </h3>
              <p className="text-xs text-slate-400">
                Kepala Laboratorium, Kepala Perpustakaan, Tim Adiwiyata, dan Koordinator Bidang
              </p>
            </div>

            <button
              onClick={() => openAddDutyModal("tugas_lain")}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tugas</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredDuties.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Belum ada penugasan tambahan lain yang dicatat.
              </p>
            ) : (
              filteredDuties.map((duty) => {
                const teacher = users.find((u) => u.id === duty.teacherId);
                return (
                  <div key={duty.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{duty.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ditugaskan kepada: <strong>{teacher?.name}</strong> • T.A. {duty.academicYear}
                      </p>
                      {duty.description && (
                        <p className="text-[11px] text-slate-400 mt-1">{duty.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDutyModal(duty)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTeacherDuty(duty.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Duty Modal */}
      {isDutyModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDutyModalOpen(false)}
          title={editingDuty ? "Edit Penugasan Guru" : "Tambah Penugasan Guru"}
        >
          <form onSubmit={handleSaveDuty} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Guru / GTK:
              </label>
              <select
                value={dutyFormData.teacherId}
                onChange={(e) => setDutyFormData({ ...dutyFormData, teacherId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                required
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (NIP: {t.nipOrNis || t.nip || "-"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Judul Penugasan:
              </label>
              <input
                type="text"
                value={dutyFormData.title}
                onChange={(e) => setDutyFormData({ ...dutyFormData, title: e.target.value })}
                placeholder="Misal: Wali Kelas VII-A / Guru Piket Senin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                required
              />
            </div>

            {dutyFormData.type === "wali_kelas" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Kelas / Rombel:
                </label>
                <select
                  value={dutyFormData.classId}
                  onChange={(e) => setDutyFormData({ ...dutyFormData, classId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name} (Tingkat {cls.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dutyFormData.type === "guru_piket" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hari Piket:
                  </label>
                  <select
                    value={dutyFormData.piketDay}
                    onChange={(e) => setDutyFormData({ ...dutyFormData, piketDay: e.target.value as TeacherDuty["piketDay"] })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam Piket:
                  </label>
                  <input
                    type="text"
                    value={dutyFormData.piketHours}
                    onChange={(e) => setDutyFormData({ ...dutyFormData, piketHours: e.target.value })}
                    placeholder="06.30 - 14.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan / Uraian Tugas:
              </label>
              <textarea
                rows={2}
                value={dutyFormData.description}
                onChange={(e) => setDutyFormData({ ...dutyFormData, description: e.target.value })}
                placeholder="Rincian deskripsi tugas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDutyModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Simpan Penugasan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ekskul Modal */}
      {isEkskulModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEkskulModalOpen(false)}
          title={editingEkskul ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler Baru"}
        >
          <form onSubmit={handleSaveEkskul} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Ekstrakurikuler:
              </label>
              <input
                type="text"
                value={ekskulFormData.name}
                onChange={(e) => setEkskulFormData({ ...ekskulFormData, name: e.target.value })}
                placeholder="Misal: Pramuka, Robotik, PMR, Tahfidz"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori:
                </label>
                <select
                  value={ekskulFormData.category}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, category: e.target.value as Extracurricular["category"] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value="Keagamaan">Keagamaan</option>
                  <option value="Kepemimpinan">Kepemimpinan</option>
                  <option value="Sains & Teknologi">Sains & Teknologi</option>
                  <option value="Seni & Budaya">Seni & Budaya</option>
                  <option value="Olahraga">Olahraga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Guru Pembina:
                </label>
                <select
                  value={ekskulFormData.leadTeacherId}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, leadTeacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hari Kegiatan:
                </label>
                <select
                  value={ekskulFormData.scheduleDay}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, scheduleDay: e.target.value as Extracurricular["scheduleDay"] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Waktu Pelaksanaan:
                </label>
                <input
                  type="text"
                  value={ekskulFormData.scheduleTime}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, scheduleTime: e.target.value })}
                  placeholder="14.30 - 16.30 WIB"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lokasi Kegiatan:
              </label>
              <input
                type="text"
                value={ekskulFormData.location}
                onChange={(e) => setEkskulFormData({ ...ekskulFormData, location: e.target.value })}
                placeholder="Lapangan Utama / Laboratorium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Ekskul:
              </label>
              <textarea
                rows={2}
                value={ekskulFormData.description}
                onChange={(e) => setEkskulFormData({ ...ekskulFormData, description: e.target.value })}
                placeholder="Tujuan dan program kerja ekstrakurikuler..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEkskulModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Simpan Ekskul
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
