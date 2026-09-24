import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Modal } from '../common/Modal';
import { Camera, RefreshCw, Keyboard, AlertCircle } from 'lucide-react';
import { Member } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanCode: (code: string) => void;
  members: Member[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanCode,
  members,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [inputMode, setInputMode] = useState<'camera' | 'manual'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-qr-scanner-element';

  // Initialize html5-qrcode camera stream
  useEffect(() => {
    if (!isOpen || inputMode !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(containerId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
        }

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await scannerRef.current.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleCodeScanned(decodedText);
            }
          },
          () => {
            // frame pass without qr
          }
        );

        if (isMounted) {
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera scan start notice:', err);
        if (isMounted) {
          setCameraError(
            'تعذر تشغيل الكاميرا المباشرة (يرجى التأكد من منح الإذن أو استخدام الإدخال اليدوي).'
          );
          setCameraActive(false);
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, inputMode, facingMode]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .catch((e) => console.log('Scanner stop caught:', e))
        .finally(() => {
          setCameraActive(false);
        });
    }
  };

  const handleCodeScanned = (code: string) => {
    stopScanner();
    onScanCode(code.trim());
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeScanned(manualCode.trim());
  };

  const handleFlipCamera = () => {
    stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      title="قارئ رمز QR للحضور السريع"
      subtitle="وجّه كاميرا الهاتف أو الجهاز نحو كود المشترك للتحضير الآلي"
      maxWidth="md"
    >
      <div className="space-y-4 text-right" dir="rtl">
        {/* Toggle Mode Tabs */}
        <div className="flex rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => setInputMode('camera')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${
              inputMode === 'camera'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>كاميرا المسح المباشر</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all ${
              inputMode === 'manual'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            <span>إدخال كود المشترك يدوياً</span>
          </button>
        </div>

        {/* Camera View Mode */}
        {inputMode === 'camera' && (
          <div className="space-y-3">
            <div className="relative mx-auto w-full max-w-[320px] aspect-square overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-black shadow-inner flex items-center justify-center">
              {/* HTML5 QR Code Container */}
              <div id={containerId} className="w-full h-full object-cover" />

              {/* Laser Animation Guide */}
              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8">
                  {/* Framing Reticle */}
                  <div className="absolute inset-8 border-2 border-dashed border-indigo-400/80 rounded-2xl" />
                  {/* Scanning Laser Beam */}
                  <div className="absolute left-8 right-8 h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 shadow-lg shadow-indigo-500/80 animate-scan-laser" />
                </div>
              )}

              {/* Fallback / Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center text-xs text-zinc-300">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="font-bold text-white">إذن الكاميرا غير مفعل</p>
                  <p className="mt-1 text-zinc-400 text-[11px] leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => setInputMode('manual')}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-md active:scale-95"
                  >
                    الانتقال للإدخال اليدوي أو اختيار عضو
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            {cameraActive && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>تبديل الكاميرا (أمامية / خلفية)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual ID Input / Quick Member Picker */}
        {inputMode === 'manual' && (
          <div className="space-y-4 pt-1">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300">
                  أدخل رمز المشترك (QR Code) أو المعرف:
                </label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{7}"
                    maxLength={7}
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="مثال: 0000101"
                    className="flex-1 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono uppercase focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-xs"
                  >
                    تحضير
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Member Click-to-Scan Simulator */}
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-3">
              <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500">
                أو اختر مشتركاً للتجربة السريعة والمحاكاة:
              </span>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pl-1">
                {members.slice(0, 8).map((mem) => (
                  <button
                    key={mem.id}
                    type="button"
                    onClick={() => handleCodeScanned(mem.qrCodeValue)}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 p-2.5 text-right text-xs hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{mem.fullName}</p>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                        {mem.qrCodeValue} • {mem.membershipPlan}
                      </p>
                    </div>
                    <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                      تسجيل الحضور
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
