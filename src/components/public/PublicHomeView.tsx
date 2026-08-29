import React from "react";
import { useApp } from "../../context/AppContext";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Laptop,
  Layers,
  FileSpreadsheet,
  Calendar,
  Eye,
  Clock,
  ChevronRight,
  HeartHandshake,
  Compass,
  Star,
} from "lucide-react";

export const PublicHomeView: React.FC = () => {
  const {
    schoolProfile,
    blogPosts,
    publicStats,
    navigateToPublic,
    navigateToDashboard,
    currentUser,
  } = useApp();

  // Published posts only
  const publishedPosts = blogPosts.filter((p) => p.status === "published");
  const featuredPost = publishedPosts.find((p) => p.isFeatured) || publishedPosts[0];
  const recentPosts = publishedPosts.filter((p) => p.id !== featuredPost?.id).slice(0, 3);

  return (
    <div id="public-home-view" className="bg-slate-50 min-h-screen">
      {/* ----------------------------------------------------
          1. HERO SECTION
          ---------------------------------------------------- */}
      <section
        id="hero-section"
        className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white py-20 lg:py-28"
      >
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badges */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800/80 text-emerald-200 border border-emerald-600/40 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Akreditasi A Unggul
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-800/80 text-teal-200 border border-teal-600/40 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5 text-teal-300" />
                  Kurikulum Merdeka Fase D
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-100 border border-emerald-500/30 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  Smart Madrasah Terpadu
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Membentuk Generasi Qur'ani, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
                  Cerdas Sains & Berakhlak Mulia
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {schoolProfile.tagline ||
                  "smart MTs menghadirkan ekosistem pembelajaran terintegrasi: pembinaan karakter islami, kurikulum modern, evaluasi CBT komprehensif, dan tata kelola madrasah berbasis teknologi digital."}
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {currentUser ? (
                  <button
                    id="hero-btn-dashboard"
                    onClick={() => navigateToDashboard("dashboard")}
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Masuk ke Dashboard ({currentUser.role.toUpperCase()})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="hero-btn-login"
                    onClick={() => navigateToPublic("login")}
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Masuk Portal sMTs</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  id="hero-btn-structure"
                  onClick={() => navigateToPublic("structure")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 hover:text-white font-semibold text-sm rounded-xl border border-emerald-700/60 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4 text-emerald-300" />
                  <span>Struktur Organisasi</span>
                </button>
              </div>

              {/* Key Features Pill Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Presensi QR Terpadu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>CBT & Bank Soal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tugas Ganda Guru</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>E-Rapor Digital</span>
                </div>
              </div>
            </div>

            {/* Right Graphic / Feature Card Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Decorative outer glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-3xl blur opacity-30"></div>

                <div className="relative bg-slate-900/90 backdrop-blur-md rounded-2xl border border-emerald-500/30 p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                        sMTs
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">smart MTs Ecosystem</h4>
                        <p className="text-xs text-emerald-400">Portal Terpadu Madrasah</p>
                      </div>
                    </div>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                      Online Real-time
                    </span>
                  </div>

                  {/* Feature preview list */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-900/80 text-emerald-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Satu Scanner Presensi QR</p>
                        <p className="text-[11px] text-slate-400">Melayani Guru, Siswa, & Staf secara otomatis</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-teal-900/80 text-teal-300 flex items-center justify-center shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Evaluasi & CBT Kurikulum Merdeka</p>
                        <p className="text-[11px] text-slate-400">PG Kompleks, Benar/Salah, Menjodohkan, Uraian</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-amber-900/80 text-amber-300 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Manajemen Tugas Tambahan Guru</p>
                        <p className="text-[11px] text-slate-400">Wali Kelas, Guru Piket, Pembina Ekskul, Koordinator</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-900/80 text-blue-300 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">E-Rapor Digital Kemenag</p>
                        <p className="text-[11px] text-slate-400">Capaian TP/CP, deskripsi otomatis & cetak PDF</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      onClick={() => (currentUser ? navigateToDashboard("dashboard") : navigateToPublic("login"))}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow"
                    >
                      {currentUser ? "Buka Dashboard Utama →" : "Akses Akun Anda Sekarang →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. STATISTIK UTAMA MADRASAH
          ---------------------------------------------------- */}
      <section id="statistics-section" className="relative -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{publicStats?.students || 480}+</div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Siswa Aktif</p>
            <p className="text-[11px] text-slate-400 mt-0.5">T.A. {publicStats?.activeAcademicYear || "2025/2026"}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{publicStats?.teachers || 42}</div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Dewan Pendidik & TU</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Guru Profesional Bersertifikasi</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{publicStats?.classes || 15}</div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Rombongan Belajar</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Fase D Kelas VII, VIII, IX</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{publicStats?.extracurriculars || 10}</div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Ekstrakurikuler & Ekskul</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pengembangan Minat & Bakat</p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          3. SAMBUTAN KEPALA MADRASAH
          ---------------------------------------------------- */}
      <section id="welcome-speech-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Photo Column */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 to-teal-900 p-8 lg:p-12 text-center text-white flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80"
                  alt="Kepala Madrasah"
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl object-cover shadow-2xl border-4 border-emerald-400/40"
                />
                <span className="absolute -bottom-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  Kepala Madrasah
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2">
                {schoolProfile.principalName || "Dr. H. Ahmad Fauzi, M.Pd.I."}
              </h3>
              <p className="text-xs text-emerald-200 mt-1 font-medium">
                NIP. {schoolProfile.principalNip || "197205141998031002"}
              </p>
              <p className="text-[11px] text-emerald-300/80 mt-2 italic">
                "{schoolProfile.motto || "Pendidikan madrasah adalah ikhtiar menyalakan lentera iman dan memupuk kecerdasan akal budi."}"
              </p>
            </div>

            {/* Quote & Text Column */}
            <div className="lg:col-span-7 p-8 lg:p-12 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>Sambutan Pimpinan Madrasah</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Selamat Datang di Portal Resmi smart MTs
              </h2>

              <div className="prose prose-slate prose-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  <strong>Assalamu’alaikum Warahmatullahi Wabarakatuh,</strong>
                </p>
                <p>
                  Puji dan syukur senantiasa kita haturkan ke hadirat Allah SWT. Atas karunia-Nya, kami menyambut seluruh
                  keluarga besar pendidik, peserta didik, orang tua/wali murid, dan masyarakat di portal digital resmi{" "}
                  <strong>smart MTs (sMTs)</strong>.
                </p>
                <p>
                  smart MTs bertransformasi menjadi madrasah unggulan yang mengintegrasikan nilai-nilai luhur Al-Qur'an
                  dengan inovasi teknologi dan sains. Melalui platform digital ini, seluruh proses pembelajaran,
                  presensi terpadu multi-peran, bank soal asesmen, evaluasi CBT, dan pengelolaan e-rapor dapat diakses
                  secara transparan dan real-time.
                </p>
                <p>
                  Semoga ikhtiar bersama ini senantiasa diridhoi Allah SWT demi mencetak generasi penerus bangsa yang saleh,
                  cerdas, berdaya saing, dan berakhlakul karimah.
                </p>
                <p className="text-xs font-semibold text-slate-500 pt-2">
                  <strong>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</strong>
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
                <button
                  onClick={() => navigateToPublic("structure")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Kenali Dewan Guru & Pimpinan Madrasah</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          4. VISI, MISI & NILAI UTAMA
          ---------------------------------------------------- */}
      <section id="vision-mission-section" className="py-16 bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
              Fondasi Pendidikan Kami
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Visi & Misi smart MTs
            </h2>
            <p className="text-sm text-emerald-200">
              Landasan filosofis dan arah pengembangan pendidikan dalam mendidik calon pemimpin masa depan.
            </p>
          </div>

          {/* Visi Card */}
          <div className="bg-emerald-900/80 border border-emerald-700/60 rounded-3xl p-8 lg:p-10 mb-10 text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <span className="inline-block bg-emerald-500 text-white font-bold text-xs px-4 py-1 rounded-full uppercase tracking-wider mb-4 shadow">
              Visi Madrasah
            </span>
            <blockquote className="text-lg sm:text-2xl font-bold text-white max-w-4xl mx-auto leading-relaxed">
              "{schoolProfile.vision ||
                "Terwujudnya Generasi Qur'ani yang Berakhlakul Karimah, Unggul dalam Ilmu Pengetahuan & Teknologi, Berprestasi Sains, serta Berwawasan Lingkungan Hidup."}"
            </blockquote>
          </div>

          {/* Misi Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-emerald-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-white">Penguatan Karakter Qur'ani</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menyelenggarakan program pembiasaan ibadah, tahfidzul Qur'an minimal 5 Juz, serta penanaman akhlakul karimah dalam keseharian.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-emerald-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-white">Kurikulum Merdeka & Sains</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menerapkan Kurikulum Merdeka Fase D berbasis proyek (P5RA), bimbingan intensif Kompetisi Sains Madrasah (KSM), dan riset santri.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-emerald-800/40 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-300 flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-white">Transformasi Digital Terpadu</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mengintegrasikan presensi QR terpadu, ujian CBT interaktif, e-rapor, dan literasi teknologi informasi yang aman dan adaptif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          5. PROGRAM UNGGULAN MADRASAH
          ---------------------------------------------------- */}
      <section id="programs-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-emerald-700 text-xs font-bold tracking-widest uppercase">
            Inovasi & Pembinaan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Program Unggulan smart MTs
          </h2>
          <p className="text-sm text-slate-600">
            Fasilitas dan kurikulum pendamping untuk mengembangkan potensi akademik, spiritual, serta kepemimpinan siswa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Program 1 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Program Tahfidzul Qur'an</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bimbingan intensif hafalan Juz 30 dan Juz 1–5 dengan sanad tahsin tajwid terstandar, halaqah harian, serta wisuda tahfidz tahunan.
            </p>
            <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Target: 3 - 5 Juz Hafal
            </span>
          </div>

          {/* Program 2 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Club Sains & Riset Madrasah</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembinaan khusus delegasi Kompetisi Sains Madrasah (KSM) untuk Matematika dan IPA Terintegrasi, serta bimbingan karya ilmiah remaja.
            </p>
            <span className="inline-block text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
              Juara KSM Provinsi & Nasional
            </span>
          </div>

          {/* Program 3 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Smart Classroom & CBT</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pembelajaran interaktif berbantuan perangkat digital cerdas, laboratorium komputer modern, serta asesmen formatif & sumatif CBT online.
            </p>
            <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              Paperless Assessment
            </span>
          </div>

          {/* Program 4 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Bilingual Club (Inggris & Arab)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pelatihan percakapan aktif bahasa Arab dan Inggris melalui public speaking, storytelling, muhadatsah, dan pertukaran budaya.
            </p>
            <span className="inline-block text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
              Kemahiran Bahasa Asing
            </span>
          </div>

          {/* Program 5 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Kepanduan Pramuka & OSIS</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Wadah pembentukan mental tangguh, disiplin, kepemimpinan demokratis, serta kepedulian sosial santri terhadap sesama.
            </p>
            <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
              Karakter Patriotik
            </span>
          </div>

          {/* Program 6 */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">10 Ekstrakurikuler Pilihan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mulai dari Robotika IT, Hadroh/Marawis, Seni Kaligrafi, Futsal, Bulu Tangkis, hingga Paskibra untuk mengasah bakat minat siswa.
            </p>
            <span className="inline-block text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
              Bakat & Minat Tumbuh
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          6. WARTA BERITA & ARTIKEL TERKINI (BLOG SECTION)
          ---------------------------------------------------- */}
      <section id="latest-blog-section" className="py-20 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-emerald-700 text-xs font-bold tracking-widest uppercase">
                Warta & Publikasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Berita & Artikel Madrasah Terkini
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Informasi resmi seputar kegiatan akademik, prestasi siswa, dan karya edukatif guru.
              </p>
            </div>

            <button
              onClick={() => navigateToPublic("blog")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-xs transition-colors"
            >
              <span>Lihat Semua Berita</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Featured Post Hero Banner */}
          {featuredPost && (
            <div
              onClick={() => navigateToPublic("blog_detail", featuredPost.slug)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 mb-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-6 h-64 lg:h-96 overflow-hidden">
                  <img
                    src={
                      featuredPost.coverImage ||
                      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80"
                    }
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="lg:col-span-6 p-8 lg:p-12 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                      {featuredPost.categoryName || "Berita Madrasah"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-500" />
                      Headline Utama
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    {featuredPost.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          featuredPost.authorAvatar ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={featuredPost.authorName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-700">{featuredPost.authorName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString("id-ID") : "Terbaru"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {featuredPost.views} dilihat
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Other 3 Recent Posts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigateToPublic("blog_detail", post.slug)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={
                        post.coverImage ||
                        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                      {post.categoryName}
                    </span>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-600 line-clamp-1">{post.authorName}</span>
                  <span className="shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID") : "Terbaru"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          7. SHOWCASE EKOSISTEM DIGITAL sMTs (INTERNAL PORTAL)
          ---------------------------------------------------- */}
      <section id="portal-showcase-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 lg:p-14 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Inovasi smart MTs
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Satu Sistem Terpadu untuk Guru, Siswa, dan Staf Madrasah
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                sMTs menyatukan seluruh tata kelola madrasah: presensi QR real-time, manajemen tugas tambahan guru,
                pelaksanaan ujian CBT daring, pengelolaan nilai formatif/sumatif, hingga penerbitan E-Rapor Kurikulum
                Merdeka.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200 pt-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Autentikasi Multi-Peran: Admin, Guru, Siswa, & Wali Murid</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Database Lokal PostgreSQL Terstruktur & Aman</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Peran Guru Fleksibel (Wali Kelas, Piket, Ekskul, Koordinator)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Cetak Dokumen & Kartu QR Pribadi Langsung Siap Pakai</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={() => (currentUser ? navigateToDashboard("dashboard") : navigateToPublic("login"))}
                  className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span>{currentUser ? "Buka Dashboard Utama" : "Masuk ke Akun Portal Anda"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Card */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Akses Cepat Demo Pengguna
              </h4>
              <p className="text-xs text-slate-300">
                Pilih profil peran di bawah untuk menguji alur kerja internal sMTs:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigateToPublic("login");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-emerald-500/30 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-emerald-300">Administrator / Kepala TU</p>
                    <p className="text-slate-400 text-[11px]">User: admin • Kelola master, sistem, & review blog</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => {
                    navigateToPublic("login");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-emerald-500/30 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-teal-300">Guru (Waka Kurikulum / Wali Kelas)</p>
                    <p className="text-slate-400 text-[11px]">User: siti.nurhaliza • Absensi, CBT, e-Rapor, Tulis Blog</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                </button>

                <button
                  onClick={() => {
                    navigateToPublic("login");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-emerald-500/30 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-blue-300">Siswa Madrasah (Fase D)</p>
                    <p className="text-slate-400 text-[11px]">User: ahmad.fauzan • Scan QR, CBT, Tugas, Nilai</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          8. CTA BANNER (KONTAK & PPDB INQUIRY)
          ---------------------------------------------------- */}
      <section id="contact-cta-section" className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ingin Mengetahui Lebih Jauh Tentang smart MTs?
            </h3>
            <p className="text-sm text-emerald-100 max-w-xl">
              Hubungi sekretariat madrasah kami untuk informasi Penerimaan Peserta Didik Baru (PPDB), kurikulum, atau kunjungan studi tiru.
            </p>
          </div>

          <button
            onClick={() => navigateToPublic("contact")}
            className="px-8 py-4 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-sm rounded-xl shadow-lg transition-transform active:scale-95 shrink-0"
          >
            Hubungi Kami Sekarang →
          </button>
        </div>
      </section>
    </div>
  );
};
