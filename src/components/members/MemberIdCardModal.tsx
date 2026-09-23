import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../common/Modal';
import { Member } from '../../types';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { getDaysRemaining } from '../../services/storage';

interface MemberIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  businessName: string;
}

export const MemberIdCardModal: React.FC<MemberIdCardModalProps> = ({
  isOpen,
  onClose,
  member,
  businessName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (member && canvasRef.current && isOpen) {
      QRCode.toCanvas(
        canvasRef.current,
        member.qrCodeValue,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Code render error:', error);
        }
      );
    }
  }, [member, isOpen]);

  if (!member) return null;

  const daysRemaining = getDaysRemaining(member.expirationDate);

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${member.qrCodeValue}_${member.fullName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="بطاقة عضوية رقمية ورمز QR"
      subtitle="بطاقة المشترك للدخول الذكي عبر البوابات ومسح الحضور"
      maxWidth="md"
    >
      <div className="space-y-6 text-right" dir="rtl">
        {/* Printable Card Container */}
        <div
          id="member-print-pass"
          className="relative overflow-hidden rounded-3xl border border-indigo-200/90 dark:border-zinc-700 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl"
        >
          {/* Subtle ambient glow */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                بطاقة عضوية معتمدة
              </span>
              <h4 className="text-base font-black tracking-tight text-white">{businessName}</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Member Info & QR Code */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex-1 text-center sm:text-right space-y-1">
              <div className="inline-block rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                كود: {member.qrCodeValue}
              </div>
              <h3 className="text-xl font-extrabold text-white">{member.fullName}</h3>
              <p className="text-xs font-medium text-indigo-200">{member.membershipPlan}</p>

              <div className="pt-2 text-[11px] text-gray-300 space-y-0.5">
                <p>
                  <span className="text-gray-400">تاريخ البدء:</span> {member.startDate}
                </p>
                <p>
                  <span className="text-gray-400">تاريخ الانتهاء:</span> {member.expirationDate}
                </p>
                <p>
                  <span className="text-gray-400">حالة الاشتراك:</span>{' '}
                  <span
                    className={`font-bold ${
                      member.status === 'active'
                        ? 'text-emerald-400'
                        : member.status === 'expired'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {member.status === 'active'
                      ? 'نشط'
                      : member.status === 'expired'
                      ? 'منتهي'
                      : 'معلق'}{' '}
                    ({daysRemaining >= 0 ? `باقي ${daysRemaining} يوم` : 'منتهي'})
                  </span>
                </p>
              </div>
            </div>

            {/* QR Canvas */}
            <div className="flex flex-col items-center bg-white p-2.5 rounded-2xl shadow-lg border border-white/20">
              <canvas ref={canvasRef} className="rounded-lg" />
              <span className="mt-1 text-[9px] font-mono font-bold text-gray-800">
                {member.qrCodeValue}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
            <span>وجّه الرمز للكاميرا للتحضير الآلي</span>
            <span>PulseSync Verified</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleDownloadQR}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 text-xs font-bold text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>تحميل رمز QR (صورة PNG)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة البطاقة</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
