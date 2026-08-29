import React from "react";
import { useApp } from "../../context/AppContext";
import {
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";

export const PublicFooter: React.FC = () => {
  const { schoolProfile, navigateToPublic, navigateToDashboard, currentUser } = useApp();

  return (
    <footer id="public-footer" className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Top Footer Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">smart MTs — Sistem Manajemen Madrasah Terpadu</h3>
              <p className="text-sm text-emerald-200 mt-1 max-w-2xl">
                Membangun ekosistem pendidikan madrasah yang berakhlakul karimah, berprestasi sains, dan adaptif di era digital.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (currentUser ? navigateToDashboard("dashboard") : navigateToPublic("login"))}
              className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm rounded-xl shadow-lg transition-transform duration-150 active:scale-95"
            >
              {currentUser ? "Buka Dashboard Aplikasi" : "Masuk ke Portal sMTs"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Madrasah Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">smart MTs</span>
                <p className="text-xs text-emerald-400 font-semibold">{schoolProfile.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {schoolProfile.tagline ||
                "Mewujudkan madrasah berakhlakul karimah, unggul dalam sains, dan berdaya saing global melalui transformasi digital terpadu."}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Akreditasi A Unggul (BAN-S/M)
              </span>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigateToPublic("home")}
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Beranda & Profil
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPublic("structure")}
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Struktur Organisasi & Dewan Guru
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPublic("blog")}
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Warta Berita & Artikel Edukasi
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPublic("contact")}
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Hubungi Madrasah / Kontak
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPublic("login")}
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Portal Login Guru, Siswa, & Staf
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Program & Layanan Digital */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Program & Inovasi
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Program Tahfidz Al-Qur'an 5 Juz</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Club Sains Madrasah (KSM & Riset)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Presensi QR Multi-Peran Terpadu</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Bank Soal & Asesmen CBT Digital</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>E-Rapor Kurikulum Merdeka Fase D</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Informasi Kontak */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Sekretariat & Hubungan
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <span>{schoolProfile.address || "Jl. Pendidikan Islami No. 45, Kompleks Madrasah"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{schoolProfile.phone || "(021) 7890-1234"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{schoolProfile.email || "info@smart-mts.sch.id"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Senin - Jumat: 07.00 - 16.00 WIB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} smart MTs (sMTs) — Sistem Manajemen Madrasah Terpadu. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>Kurikulum Merdeka Fase D</span>
            <span>Kementerian Agama Republik Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
