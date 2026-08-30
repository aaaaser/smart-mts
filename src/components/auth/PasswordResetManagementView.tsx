import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import {
  KeyRound,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Shield,
  GraduationCap,
  Users,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { Modal } from "../common/Modal";

interface ResetRequestItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userRoleLabel: string;
  identifier: string;
  nipOrNis?: string;
  className?: string;
  avatar?: string;
  note?: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  isDismissed: boolean;
  dismissedAt?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export const PasswordResetManagementView: React.FC = () => {
  const { showToast, addAuditLog, currentUser, users, pendingResetCount, setPendingResetCount, fetchPendingResetCount } = useApp();

  const [requests, setRequests] = useState<ResetRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ResetRequestItem | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    userName: string;
    roleLabel: string;
    identifier: string;
    newPass: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const res = await fetch(`/api/auth/reset-requests?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
        if (typeof json.pendingCount === "number") {
          setPendingResetCount(json.pendingCount);
        }
      }
    } catch (err) {
      console.error("Failed to load reset requests", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, searchTerm, setPendingResetCount]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcessReset = async (item: ResetRequestItem) => {
    if (!window.confirm(`Konfirmasi reset password untuk ${item.userName} (${item.userRoleLabel})?\n\nPassword akan diubah menjadi: smtslogin`)) {
      return;
    }

    setProcessingId(item.id);
    try {
      const res = await fetch("/api/auth/process-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: item.id,
          userId: item.userId,
          newPassword: "smtslogin",
        }),
      });

      const data = await res.json();
      if (data.success || res.ok) {
        showToast("success", "Reset Berhasil", `Password akun ${item.userName} telah direset ke 'smtslogin'.`);
        addAuditLog(
          "PASSWORD_RESET_COMPLETED",
          `Super Admin mereset password akun ${item.userName} (${item.userRoleLabel} - ${item.identifier}) ke smtslogin`
        );

        setSuccessModalData({
          userName: item.userName,
          roleLabel: item.userRoleLabel,
          identifier: item.identifier,
          newPass: "smtslogin",
        });

        if (typeof data.remainingPending === "number") {
          setPendingResetCount(data.remainingPending);
        }

        // Refresh request list and shared count
        await Promise.all([
          fetchRequests(),
          fetchPendingResetCount(),
        ]);
      } else {
        showToast("error", "Gagal", data.message || "Gagal memproses reset kata sandi.");
      }
    } catch (err: any) {
      showToast("error", "Error", err?.message || "Gagal memproses reset kata sandi.");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "guru":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "siswa":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "orangtua":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              Pusat Keamanan & Kredensial
            </span>
            {pendingResetCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingResetCount} Permintaan Menunggu
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-300" />
            <span>Permintaan Reset Kata Sandi</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Daftar permohonan pemulihan kata sandi akun Guru, Peserta Didik, dan Orang Tua/Wali. Eksekusi reset mengubah kata sandi menjadi <strong className="text-white underline">smtslogin</strong>.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
            title="Segarkan daftar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-0 sm:flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pengguna, NIP, NIS, nomor HP..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Diproses (PENDING)</option>
            <option value="COMPLETED">Sudah Diproses (COMPLETED)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 text-slate-700 font-medium"
          >
            <option value="ALL">Semua Peran</option>
            <option value="GURU">Guru Pengajar</option>
            <option value="SISWA">Peserta Didik</option>
            <option value="ORANGTUA">Orang Tua / Wali</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Daftar Permintaan</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {requests.length} data
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs">Memuat data permintaan reset password...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Tidak ada permintaan reset password</p>
            <p className="text-xs text-slate-400">Semua akun madrasah saat ini aman dan tidak ada permohonan pending.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Peran</th>
                  <th className="py-3.5 px-4">Pengenal (NIP/NIS/HP)</th>
                  <th className="py-3.5 px-4">Waktu Pengajuan</th>
                  <th className="py-3.5 px-4">Alasan / Catatan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                          alt={req.userName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{req.userName}</div>
                          {req.className && (
                            <div className="text-[11px] text-emerald-700 font-semibold">Kelas {req.className}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(req.userRole)}`}>
                        {req.userRoleLabel}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-800 text-xs">
                      {req.identifier || req.nipOrNis || "-"}
                    </td>

                    <td className="py-4 px-4 text-slate-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(req.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs text-slate-600 text-[11px] leading-relaxed">
                      {req.note || "Permohonan reset kata sandi akun madrasah"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {req.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                          Menunggu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-700" />
                          Selesai
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDetail(req)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {req.status === "PENDING" ? (
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleProcessReset(req)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            {processingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                            <span>Reset Password</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Diproses: {req.processedAt ? new Date(req.processedAt).toLocaleDateString("id-ID") : "OK"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <Modal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title="Detail Permintaan Reset Password"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <img
                src={selectedDetail.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80"}
                alt={selectedDetail.userName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-600/30"
              />
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeStyle(selectedDetail.userRole)}`}>
                  {selectedDetail.userRoleLabel}
                </span>
                <h4 className="text-base font-black text-slate-900">{selectedDetail.userName}</h4>
                <p className="text-xs text-slate-500 font-mono">
                  Identifier: <strong className="text-slate-800">{selectedDetail.identifier}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Permohonan</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedDetail.createdAt).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Saat Ini</span>
                <span className="font-semibold text-slate-800">
                  {selectedDetail.status === "PENDING" ? "Menunggu Eksekusi Admin" : "Selesai Diproses"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Catatan / Alasan User</span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedDetail.note || "Tidak ada catatan tambahan."}
              </p>
            </div>

            {selectedDetail.status === "PENDING" && (
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedDetail;
                    setSelectedDetail(null);
                    handleProcessReset(item);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Reset Kata Sandi ke smtslogin</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Success Credentials Confirmation Modal */}
      {successModalData && (
        <Modal
          isOpen={!!successModalData}
          onClose={() => setSuccessModalData(null)}
          title="Reset Kata Sandi Berhasil"
        >
          <div className="space-y-5 text-center p-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">Kata Sandi Berhasil Direset</h4>
              <p className="text-xs text-slate-500 mt-1">
                Kredensial untuk akun <strong className="text-slate-800">{successModalData.userName}</strong> ({successModalData.roleLabel}) telah diperbarui.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-800/70 font-medium">Pengenal / Akun:</span>
                <span className="font-bold text-slate-900 font-mono">{successModalData.identifier}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-800/70 font-medium">Kata Sandi Baru:</span>
                <span className="font-mono font-black text-emerald-900 text-sm px-2 py-0.5 bg-white rounded border border-emerald-300">
                  {successModalData.newPass}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              User dapat langsung login menggunakan kata sandi tersebut tanpa harus mengubah kata sandi terlebih dahulu.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
