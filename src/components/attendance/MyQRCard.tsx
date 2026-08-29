import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { User, SchoolProfile } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  Download,
  Printer,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  QrCode as QrIcon,
  User as UserIcon,
  Calendar,
  School,
  IdCard,
} from "lucide-react";
import { downloadQRCodePNG, printIDCard } from "../../lib/qrHelper";

interface MyQRCardProps {
  targetUser?: User;
}

export const MyQRCard: React.FC<MyQRCardProps> = ({ targetUser }) => {
  const { currentUser, schoolProfile, regenerateUserQRToken, classes, showToast } = useApp();
  const user = targetUser || currentUser;
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const userClass = classes.find((c) => c.id === user?.classId)?.name || user?.classId || "-";

  useEffect(() => {
    if (user?.qrToken) {
      QRCode.toDataURL(user.qrToken, {
        width: 320,
        margin: 2,
        color: {
          dark: "#064e3b", // Deep emerald dark color for Islamic theme
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [user?.qrToken]);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500">
        Silakan pilih akun untuk melihat QR Code.
      </div>
    );
  }

  const handleCopyToken = () => {
    if (user.qrToken) {
      navigator.clipboard.writeText(user.qrToken);
      setIsCopied(true);
      showToast("info", "Token Disalin", "Token QR Code berhasil disalin ke clipboard.");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (window.confirm("Apakah Anda yakin ingin membuat ulang Token QR Code? QR Code lama tidak akan berlaku lagi.")) {
      setIsRegenerating(true);
      setTimeout(() => {
        regenerateUserQRToken(user.id);
        setIsRegenerating(false);
      }, 500);
    }
  };

  const handleDownload = () => {
    if (user.qrToken) {
      downloadQRCodePNG(
        user.qrToken,
        `QR-${user.role.toUpperCase()}-${user.nipOrNis || user.name.replace(/\s+/g, "_")}.png`
      );
      showToast("success", "Mengunduh QR", "File gambar QR Code berhasil disimpan.");
    }
  };

  const handlePrint = () => {
    printIDCard(user, schoolProfile, userClass);
  };

  const roleLabel =
    user.role === "siswa"
      ? "KARTU PELAJAR DIGITAL"
      : user.role === "guru"
      ? "KARTU IDENTITAS GTK / GURU"
      : user.role === "admin"
      ? "KARTU IDENTITAS ADMINISTRATOR"
      : "KARTU ORANG TUA / WALI";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Identitas Digital Terverifikasi</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            {roleLabel}
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Tunjukkan QR Code ini pada scanner kamera saat presensi di gerbang sekolah atau ruang kelas. Token ini terenkripsi unik.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer"
            title="Download gambar QR Code"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh QR</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer"
            title="Cetak Kartu Fisik Standar"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>

      {/* Card Preview Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Visual Card (Front View) */}
        <div className="md:col-span-7 flex justify-center">
          <div
            id="printable-id-card"
            className="w-full max-w-[380px] bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-2xl shadow-xl overflow-hidden border border-emerald-700/50 relative flex flex-col"
          >
            {/* Islamic geometric pattern watermark background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Card Header */}
            <div className="p-4 bg-emerald-950/60 border-b border-emerald-700/40 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-black text-xs text-white">
                  sM
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight leading-tight text-white uppercase">
                    {schoolProfile.name}
                  </h4>
                  <p className="text-[9px] text-emerald-300 font-medium tracking-wide">
                    {schoolProfile.npsn ? `NPSN: ${schoolProfile.npsn} • ` : ""}smart MTs
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[8px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-5 flex flex-col items-center text-center relative z-10 space-y-4">
              {/* Photo & Name */}
              <div className="flex items-center gap-4 text-left w-full bg-white/5 p-3 rounded-xl border border-white/10">
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                  alt={user.name}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-400/60 shrink-0 bg-emerald-950"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate leading-tight">
                    {user.name}
                  </h3>
                  <div className="text-[11px] text-emerald-200 mt-0.5 font-mono">
                    {user.role === "siswa"
                      ? `NIS: ${user.nipOrNis || "-"}`
                      : `NIP/ID: ${user.nipOrNis || "-"}`}
                  </div>
                  {user.role === "siswa" && (
                    <div className="text-[10px] text-emerald-300/90 font-semibold mt-0.5">
                      Kelas: {userClass}
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-2xl shadow-inner border-2 border-emerald-400/30 flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Presensi"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 text-xs rounded-lg">
                    Membuat QR...
                  </div>
                )}
                <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                  SMART MTS SECURE QR
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="w-full pt-1 flex items-center justify-between text-[9px] text-emerald-300/80 border-t border-white/10 font-mono">
                <span>TP {schoolProfile.academicYear}</span>
                <span>STATUS: AKTIF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel & Security Details */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <QrIcon className="w-4 h-4 text-emerald-600" />
              <span>Informasi Token QR</span>
            </h4>

            {/* Token details */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-600">
                Secure Token String
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-slate-100 rounded-xl font-mono text-xs text-emerald-900 truncate border border-slate-200">
                  {user.qrToken || "Belum ada token"}
                </div>
                <button
                  onClick={handleCopyToken}
                  className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  title="Salin Token"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Token ini di-generate secara acak dengan enkripsi waktu untuk mencegah manipulasi dan pemalsuan identitas.
              </p>
            </div>

            {/* Generate Ulang Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-amber-600" : ""}`} />
                <span>{isRegenerating ? "Memperbarui..." : "Generate Ulang QR Token"}</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Gunakan jika kartu fisik hilang atau token diketahui orang lain.
              </p>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
            <h5 className="font-bold flex items-center gap-1.5 text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Petunjuk Penggunaan:
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800/90 leading-relaxed">
              <li>Cetak kartu pada kertas tebal atau ID Card PVC untuk keawetan.</li>
              <li>Arahkan QR Code ke kamera terminal scanner guru dengan jarak 15–30 cm.</li>
              <li>Pastikan lensa kamera bersih dan pencahayaan ruangan mencukupi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
