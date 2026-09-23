import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Wifi,
  Sparkles,
  Info,
  RefreshCw,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface GenerateAttendanceQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  businessName?: string;
}

export const GenerateAttendanceQRModal: React.FC<GenerateAttendanceQRModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  businessName = 'إدارة RCN',
}) => {
  // Local network IP / host configuration
  const [protocol, setProtocol] = useState<'http' | 'https'>(() => {
    return window.location.protocol.replace(':', '') === 'https' ? 'https' : 'http';
  });

  const [localHost, setLocalHost] = useState<string>(() => {
    // If the browser already has an IP or host (e.g. 192.168.1.5:3000), use it
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${hostname}${port}`;
    }
    // Saved preference or default LAN pattern
    const saved = localStorage.getItem('rcn_lan_ip_port');
    if (saved) return saved;
    return `192.168.1.100:3000`;
  });

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // The local attendance URL that the QR code points to (using root query param so it never 404s on any host/proxy/LAN)
  const attendanceUrl = `${protocol}://${localHost.trim()}/?attendance=1&tenantId=${tenantId}&kiosk=1`;

  // Generate QR code whenever attendanceUrl changes
  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);

    // Save to local storage for quick retrieval
    localStorage.setItem('rcn_lan_ip_port', localHost.trim());

    // Generate high resolution QR code data URL
    QRCode.toDataURL(attendanceUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#060b13',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        setIsGenerating(false);
      });
  }, [attendanceUrl, isOpen, localHost, protocol, tenantId]);

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(attendanceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Download high quality PNG with nice printable border and instructions
  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;

    // Create high-resolution branded canvas for downloading
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Decorative top header bar
    ctx.fillStyle = '#060b13';
    ctx.fillRect(0, 0, width, 180);

    // Cyan accent line
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, 175, width, 10);

    // 2. Title & Subtitle inside header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Arial, Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`نظام تسجيل الحضور الذاتي`, width / 2, 80);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Arial, Tahoma, sans-serif';
    ctx.fillText(`${businessName} - RCN Attendance`, width / 2, 140);

    // 3. Instructions at top of QR
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 38px Arial, Tahoma, sans-serif';
    ctx.fillText('امسح رمز QR بكاميرا هاتفك لتسجيل الحضور', width / 2, 260);

    ctx.fillStyle = '#64748b';
    ctx.font = '28px Arial, Tahoma, sans-serif';
    ctx.fillText('تأكد من اتصال هاتفك بنفس شبكة الواي فاي (Wi-Fi) المحلية', width / 2, 310);

    // 4. Draw QR Code image in center
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      const qrSize = 740;
      const qrX = (width - qrSize) / 2;
      const qrY = 360;

      // Draw subtle shadow / card behind QR
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 5. Steps / Footer
      const footerY = 1180;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px Arial, Tahoma, sans-serif';
      ctx.fillText('خطوات تسجيل الحضور:', width / 2, footerY);

      ctx.fillStyle = '#334155';
      ctx.font = '28px Arial, Tahoma, sans-serif';
      ctx.fillText('1. افتح كاميرا هاتفك وامسح الرمز أعلاه', width / 2, footerY + 50);
      ctx.fillText('2. ستفتح صفحة الحضور، أدخل رقم عضويتك (ID)', width / 2, footerY + 95);
      ctx.fillText('3. اضغط "تسجيل الحضور" لتأكيد دخولك فوراً', width / 2, footerY + 140);

      // Bottom URL tag
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(attendanceUrl, width / 2, height - 50);

      // Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `RCN_Attendance_QR_${tenantId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    qrImg.src = qrDataUrl;
  };

  // Direct Print Modal / Poster
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>طباعة رمز الحضور الذاتي - ${businessName}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body {
              font-family: Arial, Tahoma, sans-serif;
              text-align: center;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background: #ffffff;
            }
            .container {
              border: 3px solid #0f172a;
              border-radius: 24px;
              padding: 40px 25px;
              max-width: 680px;
              margin: 0 auto;
            }
            .header-badge {
              display: inline-block;
              background: #060b13;
              color: #ffffff;
              padding: 10px 24px;
              border-radius: 50px;
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 12px;
            }
            h1 { font-size: 36px; margin: 8px 0; color: #0284c7; }
            h2 { font-size: 22px; color: #475569; margin: 0 0 25px 0; font-weight: normal; }
            .qr-wrapper {
              background: #f8fafc;
              border: 2px dashed #94a3b8;
              border-radius: 20px;
              display: inline-block;
              padding: 18px;
              margin: 15px auto;
            }
            .qr-image { width: 360px; height: 360px; display: block; }
            .instructions {
              margin-top: 25px;
              background: #f1f5f9;
              padding: 18px;
              border-radius: 16px;
              font-size: 18px;
              line-height: 1.8;
              text-align: right;
            }
            .instructions ol { margin: 0; padding-right: 25px; }
            .url-box {
              margin-top: 15px;
              font-family: monospace;
              font-size: 15px;
              color: #0369a1;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-badge">إدارة RCN - تسجيل الحضور الذاتي</div>
            <h1>${businessName}</h1>
            <h2>امسح الرمز بكاميرا هاتفك لتسجيل الحضور فوراً</h2>

            <div class="qr-wrapper">
              <img class="qr-image" src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="instructions">
              <strong>تعليمات المشتركين:</strong>
              <ol>
                <li>اتصل بشبكة الواي فاي (Wi-Fi) الخاصة بالصالة.</li>
                <li>افتح كاميرا الهاتف ووجّهها نحو الرمز أعلاه.</li>
                <li>أدخل رقم عضويتك (ID) واضغط على "تسجيل الحضور".</li>
              </ol>
            </div>

            <div class="url-box">${attendanceUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Open the attendance page in a new window/tab for instant testing
  const handleOpenAttendancePage = () => {
    // Navigate or open attendance page
    window.open(`/?attendance=1&tenantId=${tenantId}&kiosk=1`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="توليد رمز QR للحضور الذاتي (طباعة)"
      subtitle="رمز ثابت ويعمل كل يوم لجميع المشتركين عبر الشبكة المحلية (Wi-Fi)"
      maxWidth="xl"
    >
      <div className="space-y-5 text-right select-none" dir="rtl">
        {/* Banner with explanations */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/20 p-3.5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-cyan-400 border border-blue-200 dark:border-blue-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-black text-slate-900 dark:text-white">رمز ثابت دائم لجميع الأعضاء</h4>
            <p className="text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
              هذا الرمز لا يحتوي على رقم عضو محدد، بل يفتح صفحة الحضور المخصصة حيث يُدخل كل مشترك رقمه الخاص بنفسه. يُطبع الرمز مرة واحدة ويُعلق عند المدخل أو الاستقبال ليعمل يومياً.
            </p>
          </div>
        </div>

        {/* LAN IP & Port Settings */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-[#1b2b4d] dark:bg-[#0c1424] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span>عنوان الشبكة المحلية (Local IP & Port)</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              يعمل بدون إنترنت عبر الواي فاي
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Protocol */}
            <div className="flex rounded-xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#060c18] p-0.5 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setProtocol('http')}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  protocol === 'http'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                http://
              </button>
              <button
                type="button"
                onClick={() => setProtocol('https')}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  protocol === 'https'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                https://
              </button>
            </div>

            {/* Editable Host & Port */}
            <div className="relative flex-1">
              <input
                type="text"
                value={localHost}
                onChange={(e) => setLocalHost(e.target.value)}
                placeholder="192.168.1.100:3000"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-blue-700 font-bold focus:border-blue-500 focus:outline-none dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-cyan-300 shadow-xs"
              />
            </div>

            {/* Auto-detect / Reset button */}
            <button
              type="button"
              onClick={() => {
                const hostname = window.location.hostname;
                const port = window.location.port ? `:${window.location.port}` : '';
                setLocalHost(`${hostname}${port}`);
              }}
              title="استخدام عنوان الجهاز الحالي"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-zinc-300 dark:hover:text-white dark:hover:bg-[#14213d] transition-colors shrink-0 shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>عنوان المتصفح</span>
            </button>
          </div>

          {/* Quick IP Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
            <span>أمثلة شائعة:</span>
            {['192.168.1.100:3000', '192.168.1.50:3000', '192.168.0.10:3000'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setLocalHost(sample)}
                className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 font-mono text-slate-700 hover:text-blue-700 hover:border-blue-300 dark:bg-[#060c18] dark:border-[#1b2b4d] dark:text-zinc-300 dark:hover:text-cyan-400 dark:hover:border-cyan-500/40 transition-colors shadow-xs"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Full Resulting URL */}
          <div className="mt-2 rounded-xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#060c18] p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <span className="font-mono text-xs text-slate-700 dark:text-zinc-300 truncate direction-ltr text-left flex-1">
              {attendanceUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-600/20 dark:border-blue-500/30 dark:text-cyan-300 dark:hover:bg-blue-600 dark:hover:text-white transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Preview & Action Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* QR Code Canvas / Display */}
          <div className="flex flex-col items-center justify-center p-5 rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] text-center shadow-xs transition-colors">
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-blue-500/10 inline-block border-4 border-cyan-400">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain block mx-auto"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400 dark:text-zinc-400 text-xs">
                  جاري توليد الرمز...
                </div>
              )}
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                جاهز للطباعة والمسح اليومي
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                دقة عالية 1200×1500 بكسل
              </p>
            </div>
          </div>

          {/* Action Buttons & Features */}
          <div className="space-y-3">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={!qrDataUrl || isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              <span>تنزيل رمز QR بدقة عالية (PNG)</span>
            </button>

            {/* Print Directly */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!qrDataUrl || isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:hover:bg-[#14213d] dark:text-zinc-200 dark:hover:text-white transition-colors shadow-xs"
            >
              <Printer className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span>طباعة مباشرة كبوستر A4</span>
            </button>

            {/* Test Attendance Page */}
            <button
              type="button"
              onClick={handleOpenAttendancePage}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:text-cyan-300 transition-colors shadow-xs"
            >
              <Smartphone className="h-4 w-4" />
              <span>تجربة صفحة تسجيل الحضور الآن</span>
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
            </button>

            {/* Instructions box */}
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1b2b4d] dark:bg-[#060c18] space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>كيف يعمل النظام؟</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-zinc-400 pr-1 leading-relaxed">
                <li>يقوم المشترك بمسح الرمز بكاميرا هاتفه.</li>
                <li>تفتح له صفحة الحضور فوراً ويدخل رقم عضويته (ID).</li>
                <li>يتحقق النظام من بيانات المشترك ويسجل حضوره ووقته تلقائياً.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-[#1b2b4d]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-[#1b2b4d] dark:text-zinc-300 dark:hover:bg-[#14213d] transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
