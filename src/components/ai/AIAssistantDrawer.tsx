import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, X, Send, Bot, User, RefreshCw, Copy, Check, Lightbulb } from "lucide-react";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, schoolProfile } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Halo ${currentUser?.name || "Bapak/Ibu Guru"}! Saya **EduSmart AI Teaching Assistant**. Ada yang bisa saya bantu hari ini?\n\n✨ Anda bisa meminta saya untuk:\n1. Membuat draf soal pilihan ganda / essay berbasis HOTS dan CP/KD\n2. Menyusun indikator ketercapaian tujuan pembelajaran\n3. Membuat deskripsi narasi capaian rapor yang positif & konstruktif\n4. Memberikan strategi remedial untuk siswa yang belum tuntas`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    "Buatkan 5 soal HOTS IPA Kelas 8 materi Sistem Pernapasan",
    "Bagaimana strategi remedial untuk siswa dengan nilai matematika di bawah KKM?",
    "Buatkan narasi deskripsi rapor untuk siswa berprestasi di atas rata-rata",
    "Jelaskan perbedaan struktur CP Kurikulum Merdeka vs KD Kurikulum 2013",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userRole: currentUser?.role || "guru",
          userContext: {
            userName: currentUser?.name,
            schoolName: schoolProfile.name,
            academicYear: schoolProfile.academicYear,
            curriculum: schoolProfile.activeCurriculum,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Maaf, terjadi kendala saat menghubungi AI Assistant. Pastikan konfigurasi API Key tersedia.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Gagal terhubung ke server AI. Mohon periksa koneksi atau coba sesaat lagi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">EduSmart AI Assistant</h3>
              <p className="text-[11px] text-indigo-200">Didukung Gemini 3.7 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/80 overflow-x-auto flex gap-2 no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="text-[11px] bg-white border border-slate-200/80 hover:border-indigo-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-600 font-medium transition-all shrink-0 flex items-center gap-1.5"
            >
              <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div key={idx} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(m.content, idx)}
                      className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors pt-1 border-t border-slate-200/60"
                      title="Salin Jawaban"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>EduSmart AI sedang berpikir...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Tanya AI tentang soal, CP/KD, rapor..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
