import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '../common/Modal';
import { Member, AttendanceRecord } from '../../types';
import { CheckCircle2, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { getDaysRemaining } from '../../services/storage';

interface ScanSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  attendanceRecord?: AttendanceRecord | null;
  isDuplicateWarning?: boolean;
  duplicateMessage?: string;
}

export const ScanSuccessModal: React.FC<ScanSuccessModalProps> = ({
  isOpen,
  onClose,
  member,
  attendanceRecord,
  isDuplicateWarning,
  duplicateMessage,
}) => {
  useEffect(() => {
    if (isOpen && !isDuplicateWarning) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#6366f1', '#f59e0b'],
        });
      } catch {}

      // Play pleasant check-in chime using Web Audio API
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.4);
        }
      } catch {}
    }
  }, [isOpen, isDuplicateWarning]);

  if (!member) return null;

  const daysRemaining = getDaysRemaining(member.expirationDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDuplicateWarning ? 'تنبيه تسجيل الحضور' : 'تم تسجيل الحضور بنجاح!'}
      subtitle={
        isDuplicateWarning
          ? 'تم الكشف عن محاولة تسجيل مكررة أو عضو غير مسجل'
          : 'تم التحقق من هوية المشترك واحتساب الحضور فوراً'
      }
      maxWidth="md"
    >
      <div className="space-y-5 text-center" dir="rtl">
        {/* Animated Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl shadow-lg transition-transform animate-in zoom-in-75 duration-300">
          {isDuplicateWarning ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Member Details */}
        <div>
          <span className="inline-block rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {member.qrCodeValue}
          </span>
          <h3 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {member.fullName}
          </h3>
          <p className="text-xs font-bold text-gray-500 dark:text-zinc-400">
            {member.membershipPlan}
          </p>
        </div>

        {/* Duplicate message or Check-in Details */}
        {isDuplicateWarning ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
            {duplicateMessage || 'تم تسجيل الحضور بالفعل اليوم لهذا المشترك.'}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 p-4 text-right space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                وقت التحضير:
              </span>
              <span className="font-black text-gray-900 dark:text-white font-mono">
                {attendanceRecord?.time || new Date().toLocaleTimeString('ar-EG')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                تاريخ اليوم:
              </span>
              <span className="font-bold text-gray-800 dark:text-zinc-200 font-mono">
                {attendanceRecord?.date || new Date().toISOString().split('T')[0]}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700/60 pt-2.5">
              <span className="text-gray-500 dark:text-zinc-400 font-medium">صلاحية الباقة:</span>
              <span
                className={`font-black ${
                  daysRemaining <= 5
                    ? 'text-amber-500'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {member.expirationDate} ({daysRemaining < 0 ? 'منتهي' : `باقي ${daysRemaining} يوم`})
              </span>
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-[0.99]"
        >
          {isDuplicateWarning ? 'فهمت ذلك' : 'إتمام ومتابعة'}
        </button>
      </div>
    </Modal>
  );
};
