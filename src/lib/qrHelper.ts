import QRCode from "qrcode";
import { User, ClassRoom } from "../types";

/**
 * Generate a secure, hard-to-guess QR token for user identity
 * Format: SMTS-USER-[HEX12]
 */
export function generateSecureQRToken(type: "STD" | "TCH" | "ADM" | "USER" = "USER"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
  return `SMTS-${type}-${randomPart}${timestampPart}`;
}

/**
 * Generate QR code Data URL (PNG base64)
 */
export async function generateQRCodeDataURL(
  text: string,
  options?: { width?: number; margin?: number; color?: { dark: string; light: string } }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || "#064e3b", // Deep emerald for sMTs theme
        light: options?.color?.light || "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate QR Code:", err);
    return "";
  }
}

/**
 * Download QR Code as PNG file
 */
export function downloadQRCodePNG(dataUrl: string, filename: string = "smts-user-qr.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print standard Islamic School Student/Teacher ID Card with QR
 */
export function printUserQRCard(
  user: User,
  schoolName: string = "smart MTs (sMTs)",
  className?: string
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const isStudent = user.role === "siswa";
  const titleBadge = isStudent ? "KARTU PELAJAR MADRASAH" : "KARTU IDENTITAS GURU & GTK";
  const idLabel = isStudent ? "NIS / NISN" : "NIP / NUPTK";
  const idValue = `${user.nis || user.nipOrNis || "-"} ${user.nisn ? `/ ${user.nisn}` : ""}`;

  // Generate QR sync image
  QRCode.toDataURL(
    user.qrToken || `SMTS-USER-${user.id}`,
    {
      width: 200,
      margin: 1,
      color: { dark: "#064e3b", light: "#ffffff" },
      errorCorrectionLevel: "H",
    },
    (err, qrDataUrl) => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Kartu Identitas QR - ${user.name}</title>
          <style>
            @page { size: 85.6mm 53.98mm; margin: 0; }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              width: 86mm;
              height: 54mm;
              background: linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%);
              border-radius: 4mm;
              position: relative;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              color: white;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 3.5mm;
              box-sizing: border-box;
            }
            .card::before {
              content: '';
              position: absolute;
              top: -20mm;
              right: -20mm;
              width: 50mm;
              height: 50mm;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid rgba(255,255,255,0.25);
              padding-bottom: 2mm;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 2mm;
            }
            .logo-box {
              width: 7mm;
              height: 7mm;
              background: white;
              color: #064e3b;
              font-weight: 800;
              font-size: 3.8mm;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 1.5mm;
            }
            .school-text {
              font-size: 2.6mm;
              font-weight: 800;
              letter-spacing: 0.2px;
            }
            .badge {
              font-size: 1.8mm;
              font-weight: 700;
              background: rgba(255,255,255,0.2);
              padding: 1mm 2mm;
              border-radius: 2mm;
              letter-spacing: 0.5px;
            }
            .body-content {
              display: flex;
              align-items: center;
              gap: 3mm;
              margin-top: 1mm;
              z-index: 1;
            }
            .photo-box {
              width: 17mm;
              height: 22mm;
              border-radius: 2mm;
              overflow: hidden;
              border: 1.5px solid white;
              background: #e2e8f0;
              flex-shrink: 0;
            }
            .photo-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .info-box {
              flex: 1;
              font-size: 2.2mm;
              line-height: 1.35;
            }
            .user-name {
              font-size: 3.2mm;
              font-weight: 800;
              color: #fef08a;
              margin-bottom: 1mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .info-row {
              display: flex;
              margin-bottom: 0.5mm;
            }
            .info-label {
              width: 16mm;
              color: #d1fae5;
              font-weight: 600;
            }
            .info-val {
              font-weight: 700;
              color: white;
            }
            .qr-box {
              width: 19mm;
              height: 19mm;
              background: white;
              padding: 1mm;
              border-radius: 2mm;
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .qr-box img {
              width: 100%;
              height: 100%;
            }
            .footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-top: 1px solid rgba(255,255,255,0.2);
              padding-top: 1.2mm;
              font-size: 1.8mm;
              color: #d1fae5;
            }
            .token-code {
              font-family: monospace;
              font-weight: bold;
              font-size: 1.9mm;
              color: #fef08a;
            }
            @media print {
              body { background: transparent; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">
                <div class="logo-box">sM</div>
                <div class="school-text">smart MTs (sMTs)</div>
              </div>
              <div class="badge">${titleBadge}</div>
            </div>

            <div class="body-content">
              <div class="photo-box">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}" alt="${user.name}" />
              </div>

              <div class="info-box">
                <div class="user-name">${user.name}</div>
                <div class="info-row">
                  <span class="info-label">${idLabel}</span>
                  <span class="info-val">: ${idValue}</span>
                </div>
                ${
                  isStudent
                    ? `<div class="info-row">
                        <span class="info-label">Kelas / Rombel</span>
                        <span class="info-val">: ${className || user.classId || 'VII-A'}</span>
                      </div>`
                    : `<div class="info-row">
                        <span class="info-label">Jabatan / Guru</span>
                        <span class="info-val">: Guru Pengajar</span>
                      </div>`
                }
                <div class="info-row">
                  <span class="info-label">T.A. / Semester</span>
                  <span class="info-val">: 2025/2026 Ganjil</span>
                </div>
              </div>

              <div class="qr-box">
                <img src="${qrDataUrl || ''}" alt="QR Token" />
              </div>
            </div>

            <div class="footer">
              <span>Token ID: <span class="token-code">${user.qrToken || 'SMTS-USER'}</span></span>
              <span>smart MTs Digital Identity</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  );
}

/**
 * Convenience alias for printing a single ID card with SchoolProfile
 */
export function printIDCard(user: User, schoolProfile?: { name: string; npsn?: string; academicYear?: string }, className?: string) {
  printUserQRCard(user, schoolProfile?.name || "smart MTs (sMTs)", className);
}

/**
 * Batch print cards in A4 sheet grid layout
 */
export async function batchPrintIDCards(
  users: User[],
  schoolProfile: { name: string; npsn?: string; academicYear?: string },
  classMap: Record<string, string> = {}
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const cardHtmlList = await Promise.all(
    users.map(async (u) => {
      const isStudent = u.role === "siswa";
      const qrDataUrl = await QRCode.toDataURL(u.qrToken || `SMTS-USER-${u.id}`, {
        width: 160,
        margin: 1,
        color: { dark: "#064e3b", light: "#ffffff" },
      });
      const clsName = classMap[u.classId || ""] || u.classId || "-";

      return `
        <div class="card-item">
          <div class="card-header">
            <div class="logo-area">
              <div class="logo-box">sM</div>
              <div class="school-info">
                <div class="school-name">${schoolProfile.name.toUpperCase()}</div>
                <div class="school-sub">${schoolProfile.npsn ? `NPSN: ${schoolProfile.npsn} • ` : ""}smart MTs</div>
              </div>
            </div>
            <div class="badge">${isStudent ? "KARTU PELAJAR" : "GTK"}</div>
          </div>
          <div class="card-body">
            <img class="photo" src="${u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}" />
            <div class="meta">
              <div class="name">${u.name}</div>
              <div class="row">NIS/NIP: ${u.nipOrNis || "-"}</div>
              ${isStudent ? `<div class="row">Kelas: ${clsName}</div>` : `<div class="row">Guru / GTK</div>`}
            </div>
            <img class="qr" src="${qrDataUrl}" />
          </div>
          <div class="card-footer">
            <span>Token: ${u.qrToken?.slice(0, 16) || "SMTS-USER"}</span>
            <span>TP ${schoolProfile.academicYear || "2025/2026"}</span>
          </div>
        </div>
      `;
    })
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak Masal Kartu QR - ${users.length} Kartu</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        body { margin: 0; font-family: system-ui, sans-serif; background: #fff; }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6mm;
        }
        .card-item {
          border: 1px dashed #059669;
          border-radius: 8px;
          padding: 8px;
          background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
          color: white;
          box-sizing: border-box;
          page-break-inside: avoid;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .logo-area { display: flex; align-items: center; gap: 6px; }
        .logo-box {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 4px;
          font-weight: 900;
          font-size: 10px;
          padding: 2px 4px;
        }
        .school-name { font-size: 9px; font-weight: 800; }
        .school-sub { font-size: 7px; opacity: 0.8; }
        .badge { background: #34d399; color: #064e3b; font-size: 7px; font-weight: 800; padding: 1px 4px; border-radius: 4px; }
        .card-body { display: flex; align-items: center; gap: 8px; }
        .photo { width: 42px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #fff; }
        .meta { flex: 1; min-width: 0; }
        .name { font-size: 10px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row { font-size: 8px; opacity: 0.9; margin-top: 1px; }
        .qr { width: 44px; height: 44px; background: white; padding: 2px; border-radius: 4px; }
        .card-footer {
          margin-top: 6px;
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 3px;
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          opacity: 0.8;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="grid-container">
        ${cardHtmlList.join("")}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

