import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { User, SchoolProfile } from "../../types";
import { useApp } from "../../context/AppContext";
import {
  Printer,
  Download,
  X,
  Sparkles,
  QrCode as QrIcon,
  User as UserIcon,
  Check,
  IdCard,
  Building,
  School,
} from "lucide-react";
import { Modal } from "../common/Modal";

interface PrintAttendanceCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User;
  targetUsers?: User[];
}

export const PrintAttendanceCardModal: React.FC<PrintAttendanceCardModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  targetUsers,
}) => {
  const { schoolProfile, classes, currentUser, showToast } = useApp();
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);

  const usersToPrint = targetUsers && targetUsers.length > 0
    ? targetUsers
    : targetUser
    ? [targetUser]
    : currentUser
    ? [currentUser]
    : [];

  const activeUser = usersToPrint[selectedUserIndex] || usersToPrint[0];

  useEffect(() => {
    if (isOpen && usersToPrint.length > 0) {
      usersToPrint.forEach((u) => {
        const token = u.qrToken || `SMTS-USER-${u.id}`;
        QRCode.toDataURL(token, {
          width: 350,
          margin: 1,
          color: {
            dark: "#064e3b",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        })
          .then((url) => {
            setQrMap((prev) => ({ ...prev, [u.id]: url }));
          })
          .catch((err) => console.error("QR gen error:", err));
      });
    }
  }, [isOpen, usersToPrint]);

  if (!isOpen || usersToPrint.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const getClassName = (classId?: string) => {
    return classes.find((c) => c.id === classId)?.name || classId || "-";
  };

  return (
    <>
      {/* Print Styles injected in DOM */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card-area, #printable-card-area * {
            visibility: visible;
          }
          #printable-card-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white !important;
            margin: 0;
            padding: 0;
          }
          .attendance-id-card {
            width: 85.60mm !important;
            height: 53.98mm !important;
            max-width: 85.60mm !important;
            max-height: 53.98mm !important;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
            margin: 0 auto !important;
          }
          @page {
            size: 85.60mm 53.98mm landscape;
            margin: 0;
          }
        }
      `}</style>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Cetak Kartu Absensi Digital (${activeUser?.role === "guru" ? "Guru / GTK" : "Peserta Didik"})`}
      >
        <div className="space-y-6">
          {/* Multi-user selector if batch */}
          {usersToPrint.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Pilih Akun ({selectedUserIndex + 1} dari {usersToPrint.length}):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedUserIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedUserIndex === 0}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setSelectedUserIndex((prev) => Math.min(usersToPrint.length - 1, prev + 1))}
                  disabled={selectedUserIndex === usersToPrint.length - 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {/* Physical CR80 Card Preview (85.60mm x 53.98mm landscape equivalent) */}
          <div className="flex justify-center p-4 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
            <div id="printable-card-area">
              {usersToPrint.map((u, index) => {
                if (usersToPrint.length > 1 && index !== selectedUserIndex) {
                  return null;
                }

                const isTeacher = u.role === "guru";
                const cardTitle = isTeacher ? "KARTU ABSENSI GURU / GTK" : "KARTU ABSENSI SISWA";
                const userClassName = getClassName(u.classId);

                return (
                  <div
                    key={u.id}
                    className="attendance-id-card relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl shadow-xl overflow-hidden p-3.5 flex flex-col justify-between select-none border border-emerald-600/40"
                    style={{
                      width: "85.60mm",
                      height: "53.98mm",
                      boxSizing: "border-box",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {/* Decorative Islamic Geometric subtle pattern */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6ee7b7_1px,transparent_1px)] [background-size:8px_8px]" />
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

                    {/* Card Header */}
                    <div className="relative z-10 flex items-center justify-between border-b border-emerald-400/30 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-emerald-900 font-black text-[10px] shadow-xs">
                          sM
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-tight leading-tight uppercase text-emerald-100">
                            {schoolProfile.name}
                          </div>
                          <div className="text-[7.5px] font-extrabold tracking-widest text-emerald-300 uppercase">
                            {cardTitle}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[7px] font-bold text-emerald-200">
                          TP {schoolProfile.academicYear}
                        </div>
                        <div className="text-[6.5px] font-mono text-emerald-300">
                          sMTs DIGITAL
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="relative z-10 grid grid-cols-12 gap-2 items-center my-auto">
                      {/* Left: User Photo */}
                      <div className="col-span-3 flex flex-col items-center">
                        <div className="w-12 h-14 rounded-lg overflow-hidden border-2 border-emerald-300/80 bg-white/10 shadow-xs relative">
                          <img
                            src={
                              u.avatar ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                            }
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Middle: User Identity Details */}
                      <div className="col-span-6 space-y-0.5 pr-1">
                        <div className="text-[10px] font-black text-white leading-tight line-clamp-2">
                          {u.name}
                        </div>

                        {isTeacher ? (
                          <>
                            <div className="text-[8px] text-emerald-200 font-mono">
                              NIP: <strong className="text-white">{u.nip || u.nipOrNis || "-"}</strong>
                            </div>
                            <div className="text-[7.5px] text-emerald-100 font-medium truncate">
                              Jabatan: Tenaga Pendidik
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-[8px] text-emerald-200 font-mono">
                              NIS: <strong className="text-white">{u.nis || u.nipOrNis || "-"}</strong>
                            </div>
                            <div className="text-[7.5px] text-emerald-100 font-medium">
                              Kelas: <strong className="text-white">{userClassName}</strong>
                            </div>
                          </>
                        )}

                        <div className="text-[6.5px] text-emerald-300/80 pt-0.5 truncate font-mono">
                          ID: {u.qrToken || `SMTS-${u.id.substring(0, 8)}`}
                        </div>
                      </div>

                      {/* Right: High-Resolution QR Code */}
                      <div className="col-span-3 flex flex-col items-center justify-center">
                        <div className="p-1 bg-white rounded-lg shadow-md border border-emerald-300">
                          {qrMap[u.id] ? (
                            <img
                              src={qrMap[u.id]}
                              alt="QR Token"
                              className="w-13 h-13 object-contain block"
                            />
                          ) : (
                            <div className="w-13 h-13 bg-slate-100 animate-pulse rounded" />
                          )}
                        </div>
                        <span className="text-[6px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5 text-center">
                          Scan Presensi
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="relative z-10 flex items-center justify-between border-t border-emerald-400/30 pt-1 text-[6.5px] text-emerald-200">
                      <div className="truncate max-w-[170px]">
                        {schoolProfile.address || "Kementerian Agama Republik Indonesia"}
                      </div>
                      <div className="font-mono text-emerald-300 font-bold">
                        SMART-MTS
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specification Notice */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <IdCard className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">Standar Fisik Cetak:</span>
              <p className="text-[11px] text-emerald-800">
                Ukuran cetak presisi: <strong>85.60 mm × 53.98 mm</strong> (Standar Kartu ID / KTP Landscape). Siap dicetak langsung menggunakan printer kartu PVC atau kertas ID card.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Absensi</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
