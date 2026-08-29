import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { User, SchoolProfile } from "../../types";
import { Modal } from "../common/Modal";
import { Printer, Download, Users, CheckSquare, Square, X, QrCode } from "lucide-react";
import { batchPrintIDCards } from "../../lib/qrHelper";

interface BatchQRPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchQRPrintModal: React.FC<BatchQRPrintModalProps> = ({ isOpen, onClose }) => {
  const { classes, users, schoolProfile } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [targetType, setTargetType] = useState<"siswa" | "guru">("siswa");

  const classStudents = users.filter((u) => u.role === "siswa" && u.classId === selectedClassId);
  const teachers = users.filter((u) => u.role === "guru" || u.role === "admin");

  const targetList = targetType === "siswa" ? classStudents : teachers;

  // Select all by default when class / targetType changes
  React.useEffect(() => {
    setSelectedUserIds(targetList.map((u) => u.id));
  }, [selectedClassId, targetType]);

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === targetList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(targetList.map((u) => u.id));
    }
  };

  const handleToggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
    if (selectedUsers.length === 0) return;

    const classMap: Record<string, string> = {};
    classes.forEach((c) => {
      classMap[c.id] = c.name;
    });

    batchPrintIDCards(selectedUsers, schoolProfile, classMap);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cetak Masal Kartu QR Pelajar / GTK"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Type Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setTargetType("siswa")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              targetType === "siswa"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Siswa / Peserta Didik
          </button>
          <button
            onClick={() => setTargetType("guru")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              targetType === "guru"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Guru & Tenaga Kependidikan (GTK)
          </button>
        </div>

        {/* If Siswa, show class select */}
        {targetType === "siswa" && (
          <div className="flex items-center justify-between gap-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <label className="text-xs font-bold text-emerald-950">
              Pilih Rombongan Belajar / Kelas:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.academicYear})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User Selection List */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-800 cursor-pointer"
            >
              {selectedUserIds.length === targetList.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua ({targetList.length} Orang)</span>
            </button>

            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {selectedUserIds.length} Terpilih
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
            {targetList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ada data pada kelas ini.
              </div>
            ) : (
              targetList.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => handleToggleUser(u.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 pointer-events-none"
                      />
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {u.nipOrNis ? `NIS/NIP: ${u.nipOrNis}` : u.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                      {u.qrToken ? u.qrToken.slice(0, 16) + "..." : "Auto-Generated"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400 max-w-xs leading-tight">
            Kartu akan dicetak dalam format grid (A4) siap digunting atau dilaminasi.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintSelected}
              disabled={selectedUserIds.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedUserIds.length} Kartu</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
