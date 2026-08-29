import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, Volume2, VolumeX, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  onCloseScanner?: () => void;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScanSuccess,
  isActive,
  onCloseScanner,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "smart-mts-qr-reader";

  // Last scanned cooldown to prevent rapid fire
  const lastScannedToken = useRef<string>("");
  const lastScannedTime = useRef<number>(0);

  // Play sound synthesizer chime
  const playScanBeep = (type: "success" | "warning" | "error") => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Ignored if browser policy blocks audio before gesture
    }
  };

  // Get list of cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back/environment camera for handheld scan, or 1st camera
          const backCam = devices.find(
            (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear") || d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setCameraError("Tidak ada perangkat kamera yang terdeteksi di perangkat Anda.");
        }
      })
      .catch((err) => {
        console.warn("Could not get cameras:", err);
        setCameraError("Izin kamera belum diberikan atau kamera tidak tersedia di browser ini.");
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    try {
      setCameraError(null);
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        cameraId || { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now();
          // 2 seconds cooldown for the same token
          if (lastScannedToken.current === decodedText && now - lastScannedTime.current < 2500) {
            return;
          }
          lastScannedToken.current = decodedText;
          lastScannedTime.current = now;

          playScanBeep("success");
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Frame parse error (normal while searching for QR)
        }
      );

      setIsCameraRunning(true);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraError(err?.message || "Gagal membuka kamera. Pastikan izin kamera aktif.");
      setIsCameraRunning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Stop error:", err);
      }
    }
    setIsCameraRunning(false);
  };

  useEffect(() => {
    if (isActive && selectedCameraId) {
      startScanner(selectedCameraId);
    } else {
      stopScanner();
    }
  }, [isActive, selectedCameraId]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-emerald-900/50 flex flex-col items-center relative">
      {/* Top Scanner Toolbar */}
      <div className="w-full bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Live Scanner Kamera
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 text-white text-[11px] px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Kamera ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title={isMuted ? "Aktifkan Suara Beep" : "Matikan Suara"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {isCameraRunning ? (
            <button
              type="button"
              onClick={stopScanner}
              className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Matikan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startScanner(selectedCameraId)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Nyalakan</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport Area */}
      <div className="relative w-full aspect-4/3 max-w-md bg-black flex items-center justify-center overflow-hidden">
        <div id={readerElementId} className="w-full h-full object-cover" />

        {/* Visual Target Reticle Overlay */}
        {isCameraRunning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-60 h-60 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

              {/* Laser Scanning Line Animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
            </div>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
            <div className="text-sm font-bold text-white">Akses Kamera Terkendala</div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              {cameraError}
            </p>
            <div className="text-[11px] text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
              Anda tetap dapat menggunakan mode input Manual / Barcode Scanner / Simulator di bawah!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="w-full bg-slate-950/90 px-4 py-2.5 border-t border-slate-800 text-center text-[11px] text-slate-400">
        Posisikan QR Code siswa/guru tepat di tengah kotak pemindai hijau.
      </div>
    </div>
  );
};
