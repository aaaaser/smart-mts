import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const PublicContactView: React.FC = () => {
  const { schoolProfile, submitContactMessage, showToast } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Informasi PPDB");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast("error", "Form Belum Lengkap", "Silakan isi nama, email, dan pesan Anda.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitContactMessage(name, email, phone, subject, message);
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }, 600);
  };

  return (
    <div id="public-contact-view" className="bg-slate-50 min-h-screen pb-24">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
            <span>Pusat Layanan & Informasi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Hubungi Sekretariat smart MTs
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            Kami siap melayani pertanyaan seputar PPDB, kurikulum madrasah, kerja sama kemitraan, dan konsultasi
            pendidikan santri.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Madrasah Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Informasi Resmi
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{schoolProfile.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  NPSN: {schoolProfile.npsn || "20109988"} • Akreditasi A Unggul
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Alamat Kampus</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {schoolProfile.address || "Jl. Pendidikan Islami No. 45, Kompleks Madrasah Terpadu"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Telepon & WhatsApp</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Kantor: {schoolProfile.phone || "(021) 7890-1234"}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      WA Layanan: 0812-3456-7890 (Aktif 24/7)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Email Korespondensi</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {schoolProfile.email || "info@smart-mts.sch.id"}
                    </p>
                    <p className="text-xs text-slate-500">ppdb@smart-mts.sch.id (Pendaftaran)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Jam Operasional Kantor</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Senin - Kamis: 07.00 - 15.30 WIB</p>
                    <p className="text-xs text-slate-600">Jumat: 07.00 - 16.00 WIB</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sabtu - Ahad: Layanan Online Daring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200/80">
              <h3 className="text-xl font-bold text-slate-900">Kirim Pesan atau Pertanyaan</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Isi formulir di bawah untuk menyampaikan pertanyaan, permohonan informasi, atau pesan kepada madrasah.
              </p>

              {submittedSuccess && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Pesan Anda Berhasil Terkirim!</p>
                    <p className="mt-0.5 text-emerald-700">
                      Tim sekretariat madrasah kami akan segera meninjau dan merespon pesan Anda melalui email atau WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kategori Subjek
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Informasi PPDB">Informasi Pendaftaran Siswa Baru (PPDB)</option>
                      <option value="Kunjungan Studi Tiru">Kunjungan / Studi Tiru Madrasah</option>
                      <option value="Program Kurikulum & Tahfidz">Kurikulum & Program Tahfidz</option>
                      <option value="Saran & Masukan">Saran & Masukan Madrasah</option>
                      <option value="Pertanyaan Umum">Pertanyaan Umum Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Isi Pesan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tuliskan pertanyaan atau informasi yang ingin Anda sampaikan secara lengkap..."
                    className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Mengirimkan Pesan..." : "Kirimkan Pesan Sekarang"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
