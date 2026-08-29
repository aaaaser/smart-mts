import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { OrganizationStructureItem } from "../../types";
import {
  Users,
  Search,
  Building2,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  X,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

export const PublicStructureView: React.FC = () => {
  const { organizationStructure, schoolProfile, navigateToPublic } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<OrganizationStructureItem | null>(null);

  // Departments list for filter
  const departments = [
    { id: "all", label: "Semua Posisi" },
    { id: "Pimpinan", label: "Pimpinan Madrasah" },
    { id: "Tata Usaha", label: "Tata Usaha & Keuangan" },
    { id: "Wakil Kepala", label: "Wakil Kepala Madrasah" },
    { id: "Koordinator Program", label: "Koordinator Khusus" },
    { id: "Dewan Guru", label: "Dewan Pendidik" },
    { id: "Kesiswaan & OSIS", label: "Pengurus OSIS" },
  ];

  // Filtering
  const filteredMembers = organizationStructure.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === "all" || item.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Hierarchy levels
  const pimpinanList = organizationStructure.filter((x) => x.orderIndex <= 2);
  const wakaList = organizationStructure.filter((x) => x.orderIndex >= 3 && x.orderIndex <= 7);
  const staffAndTeachers = organizationStructure.filter((x) => x.orderIndex > 7);

  return (
    <div id="public-structure-view" className="bg-slate-50 min-h-screen pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Tata Kelola & Kepemimpinan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Struktur Organisasi & Dewan Pendidik
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            Mengenal jajaran pimpinan, dewan guru profesional, koordinator program, dan staf tenaga kependidikan di{" "}
            {schoolProfile.name}.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau jabatan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Department Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedDept === dept.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------
            BAGAN ORGANISASI POKOK (DIAGRAM TIER VIEW)
            Shown when not filtering or when searching
            ---------------------------------------------------- */}
        {selectedDept === "all" && searchQuery === "" && (
          <div className="mt-12 space-y-12">
            {/* Tier 1: Pimpinan Madrasah */}
            <div>
              <div className="text-center mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Pimpinan Utama & Komite
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-4xl mx-auto">
                {pimpinanList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMember(item)}
                    className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-sm hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] text-center space-y-3"
                  >
                    <div className="relative w-24 h-24 mx-auto">
                      <img
                        src={item.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-2xl border-2 border-emerald-500 shadow"
                      />
                    </div>
                    <div>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                        {item.position}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                      {item.nip && <p className="text-[11px] text-slate-500">NIP: {item.nip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connecting visual divider */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-emerald-300" />
            </div>

            {/* Tier 2: Wakil Kepala Madrasah */}
            <div>
              <div className="text-center mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
                  Wakil Kepala & Tata Usaha
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {wakaList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMember(item)}
                    className="bg-white rounded-2xl p-5 border border-teal-200 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] text-center space-y-3"
                  >
                    <img
                      src={item.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200"}
                      alt={item.name}
                      className="w-20 h-20 mx-auto object-cover rounded-xl border border-teal-300 shadow-xs"
                    />
                    <div>
                      <span className="inline-block bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">
                        {item.position}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.name}</h4>
                      {item.duties && item.duties.length > 0 && (
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium line-clamp-1">
                          {item.duties.join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            GRID VIEW OF MEMBERS (ALL / FILTERED)
            ---------------------------------------------------- */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Dewan Pendidik & Staf ({filteredMembers.length} Personel)
            </h2>
            <span className="text-xs text-slate-500">Klik kartu untuk detail profil</span>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Tidak ada anggota yang cocok dengan pencarian Anda.</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih semua posisi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMember(item)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={item.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
                          {item.department || "Pendidik"}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-semibold">{item.position}</p>
                      </div>
                    </div>

                    {/* Additional Duties / Bio Pill */}
                    {item.duties && item.duties.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {item.duties.map((duty, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded"
                          >
                            {duty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                    <span>Lihat Profil Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member Profile Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white relative">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"}
                  alt={selectedMember.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                />
                <div>
                  <span className="bg-emerald-500/40 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded">
                    {selectedMember.department || "Pendidik Madrasah"}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedMember.name}</h3>
                  <p className="text-xs text-emerald-200 font-medium">{selectedMember.position}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {selectedMember.nip && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong>NIP:</strong> {selectedMember.nip}
                  </span>
                </div>
              )}

              {selectedMember.bio && (
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Profil & Dedikasi
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedMember.bio}
                  </p>
                </div>
              )}

              {selectedMember.duties && selectedMember.duties.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Tugas Tambahan di sMTs
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMember.duties.map((duty, idx) => (
                      <span
                        key={idx}
                        className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      >
                        {duty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
