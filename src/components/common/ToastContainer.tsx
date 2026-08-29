import React from "react";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let bg = "bg-slate-900 border-slate-800 text-white";
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (t.type === "success") {
          bg = "bg-emerald-950/95 border-emerald-800/80 text-emerald-50";
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (t.type === "error") {
          bg = "bg-rose-950/95 border-rose-800/80 text-rose-50";
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        } else if (t.type === "warning") {
          bg = "bg-amber-950/95 border-amber-800/80 text-amber-50";
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-tight">{t.title}</h4>
              <p className="text-xs text-slate-300/90 mt-0.5 leading-relaxed break-words">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
