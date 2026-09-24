import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  CreditCard,
  User,
  ArrowRight,
  Wifi,
  Sparkles,
  Phone,
  RefreshCw,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { storageService, getTodayDateString, getDaysRemaining } from '../../services/storage';
import { useTheme } from '../../context/ThemeContext';
import { Member, AttendanceRecord } from '../../types';
import { firebaseService } from '../../services/firebase';

interface SelfAttendancePageProps {
  initialTenantId?: string;
  onExitToApp?: () => void;
}

export const SelfAttendancePage: React.FC<SelfAttendancePageProps> = ({
  initialTenantId,
  onExitToApp,
}) => {
  // Read tenantId from URL query param, props, or active tenant
  const [tenantId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramTenant = urlParams.get('tenantId');
    if (paramTenant) return paramTenant;
    if (initialTenantId) return initialTenantId;
    // Default fallback
    const allUsers = storageService.getUsers();
    if (allUsers.length > 0) return allUsers[0].id;
    return 'user-owner-1';
  });

  const [memberIdInput, setMemberIdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Success State
  const [registeredMember, setRegisteredMember] = useState<Member | null>(null);
  const [registeredRecord, setRegisteredRecord] = useState<AttendanceRecord | null>(null);
  const [countdown, setCountdown] = useState(10);

  // Live Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const todayStr = getTodayDateString();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Sync members for the selected tenant. Try LAN first, then Firestore so
    // a member can check in from a phone that has never opened the admin app.
    const syncMembers = async () => {
      try {
        const res = await fetch('/api/lan-members');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.members)) {
            const localMembers = storageService.getMembers(tenantId);
            const merged = [...localMembers];
            data.members.forEach((m: Member) => {
              if (m.tenantId !== tenantId) return;
              const idx = merged.findIndex((x) => x.id === m.id);
              if (idx >= 0) merged[idx] = m;
              else merged.push(m);
            });
            if (data.members.some((m: Member) => m.tenantId === tenantId)) {
              storageService.saveMembers(merged, tenantId);
            }
          }
        }
      } catch {
        // Continue to Firestore.
      }

      try {
        const cloudMembers = await firebaseService.fetchMembers(tenantId);
        if (cloudMembers.length > 0) {
          const localMembers = storageService.getMembers(tenantId);
          const merged = [...localMembers];
          cloudMembers.forEach((m) => {
            const idx = merged.findIndex((x) => x.id === m.id);
            if (idx >= 0) merged[idx] = m;
            else merged.push(m);
          });
          storageService.saveMembers(merged, tenantId);
        }
      } catch {
        // Offline / Firestore unavailable: keep local/LAN data.
      }

    };
    syncMembers();

    return () => clearInterval(interval);
  }, [tenantId]);

  // Auto-reset countdown after successful registration
  useEffect(() => {
    if (!registeredMember) return;
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleResetForm();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [registeredMember]);

  const handleResetForm = () => {
    setRegisteredMember(null);
    setRegisteredRecord(null);
    setErrorMessage(null);
    setWarningMessage(null);
    setMemberIdInput('');
  };

  // Find member in storage
  const findMember = (query: string): Member | undefined => {
    const cleanQuery = query.trim().toLowerCase();
    const members = storageService.getMembers(tenantId);

    const legacyMatch = cleanQuery.match(/^ps-mem-(\d{1,7})$/i);
    const plainMatch = cleanQuery.match(/^(\d{1,7})$/);
    const numericQuery = legacyMatch?.[1] || plainMatch?.[1] || '';
    const normalizedNumericQuery = numericQuery ? numericQuery.padStart(7, '0') : '';

    return members.find((m) => {
      // Internal ID is kept only for database relations.
      if (m.id.toLowerCase() === cleanQuery) return true;

      // Public member ID / QR value is always exactly 7 digits.
      if (m.qrCodeValue === normalizedNumericQuery) return true;

      // Backward compatibility with old printed QR codes such as PS-MEM-101.
      if (m.qrCodeValue && m.qrCodeValue.toLowerCase() === cleanQuery) return true;

      // Phone number match (kept for staff/manual lookup).
      if (m.phoneNumber && m.phoneNumber.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, ''))
        return true;

      // Full Name match.
      if (m.fullName.toLowerCase() === cleanQuery) return true;

      return false;
    });
  };

  const handleRegisterAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWarningMessage(null);

    const inputVal = memberIdInput.trim();
    if (!inputVal) {
      setErrorMessage('يرجى إدخال رقم المشترك أو رقم العضوية');
      return;
    }

    setIsSubmitting(true);

    try {
      const member = findMember(inputVal);

      // 1. If ID is invalid
      if (!member) {
        setErrorMessage(
          `رقم المشترك "${inputVal}" غير صحيح أو غير مسجل في النظام. يرجى التأكد من الرقم أو مراجعة موظف الاستقبال.`
        );
        setIsSubmitting(false);
        return;
      }

      // Check membership expiration
      const daysLeft = getDaysRemaining(member.expirationDate);
      const isExpired = daysLeft < 0 || member.status === 'expired';

      const now = new Date();
      const timeFormatted = now.toTimeString().split(' ')[0]; // HH:mm:ss

      // 2. Register attendance using all existing information
      const res = storageService.recordAttendance({
        tenantId,
        memberId: member.id,
        memberName: member.fullName,
        membershipPlan: member.membershipPlan,
        date: todayStr,
        time: timeFormatted,
        status: 'present',
        verifiedBy: 'qr_scanner',
      });

      if (!res.success) {
        // Duplicate check-in warning
        setWarningMessage(res.reason || 'تم تسجيل الحضور مسبقاً اليوم');
        setRegisteredMember(member);
        setRegisteredRecord({
          id: 'duplicate',
          tenantId,
          memberId: member.id,
          memberName: member.fullName,
          membershipPlan: member.membershipPlan,
          date: todayStr,
          time: timeFormatted,
          status: 'present',
          verifiedBy: 'qr_scanner',
          checkInTimestamp: Date.now(),
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Success registration
      setRegisteredMember(member);
      setRegisteredRecord(res.record || null);

      // Sync across LAN to host computer
      if (res.record) {
        fetch('/api/lan-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(res.record),
        }).catch(() => {});
      }

      if (isExpired) {
        setWarningMessage(
          `تنبيه: اشتراكك انتهى بتاريخ (${member.expirationDate}). يرجى مراجعة إدارة النادي للتجديد.`
        );
      }

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch {
        // Ignore if confetti fails
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء تسجيل الحضور. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysRemaining = registeredMember ? getDaysRemaining(registeredMember.expirationDate) : null;
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-200"
      dir="rtl"
    >
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 dark:border-[#1b2b4d] dark:bg-[#0c1424]/95 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-slate-900 dark:text-white">إدارة RCN</h1>
              <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-cyan-500/20 dark:border-cyan-500/30 dark:text-cyan-300 px-2 py-0.2 text-[10px] font-black">
                تسجيل الحضور الذاتي
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">بوابة تحضير المشتركين عبر الشبكة المحلية</p>
          </div>
        </div>

        {/* LAN Wi-Fi Indicator & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[#101c34] dark:text-amber-400 dark:hover:bg-[#182848] transition-colors border border-slate-200 dark:border-[#1b2b4d]"
            title={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-bold">
            <Wifi className="h-3.5 w-3.5 animate-pulse" />
            <span className="hidden sm:inline">شبكة محلية Wi-Fi</span>
            <span className="sm:hidden">LAN</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {!registeredMember ? (
            /* 1. INPUT FORM STATE */
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-5"
            >
              {/* Date & Time Widget */}
              <div className="rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-4 text-center shadow-md dark:shadow-lg transition-colors">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 dark:text-cyan-400">
                  <Calendar className="h-4 w-4" />
                  <span>{todayStr}</span>
                  <span className="text-slate-300 dark:text-zinc-600">•</span>
                  <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="font-mono">{currentTimeStr || '12:00:00'}</span>
                </div>
              </div>

              {/* Main Card */}
              <div className="rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-6 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

                <div className="text-center space-y-1 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30 mx-auto mb-3">
                    <UserCheck className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">تسجيل حضور المشترك</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    أدخل رقم عضويتك (ID) أو رقم هاتفك لتأكيد حضورك اليوم
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 p-3.5 text-xs flex items-start gap-2.5"
                  >
                    <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </motion.div>
                )}

                <form onSubmit={handleRegisterAttendance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      رقم المشترك (Member ID)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        required
                        value={memberIdInput}
                        onChange={(e) => {
                          setMemberIdInput(e.target.value.replace(/\D/g, '').slice(0, 7));
                          if (errorMessage) setErrorMessage(null);
                        }}
                        inputMode="numeric"
                        pattern="\d{7}"
                        maxLength={7}
                        placeholder="مثال: 0000101"
                        className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-white dark:placeholder-zinc-500 dark:focus:border-cyan-400 transition-colors text-right"
                      />
                      {memberIdInput && (
                        <button
                          type="button"
                          onClick={() => setMemberIdInput('')}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 pr-1">
                      يمكنك استخدام رقم العضوية المطبوع على بطاقتك أو رقم هاتفك
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !memberIdInput.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 py-3.5 px-4 text-sm font-black text-white shadow-xl shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>جاري التحقق وتأكيد الحضور...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5" />
                        <span>تسجيل الحضور</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Helpful Hints for Demo Testing */}
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#1b2b4d] text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className="font-bold text-slate-700 dark:text-zinc-300 block mb-1">أرقام تجريبية سريعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['mem-101', 'mem-102', 'mem-103', '101', '102'].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          setMemberIdInput(sample);
                          setErrorMessage(null);
                        }}
                        className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-slate-700 hover:text-blue-600 hover:border-blue-400 dark:bg-[#060c18] dark:border-[#1b2b4d] dark:text-zinc-300 dark:hover:text-cyan-400 dark:hover:border-cyan-500/40"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 2. SUCCESS CONFIRMATION STATE */
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="w-full space-y-4"
            >
              <div className="rounded-3xl border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-[#0d1627] p-6 shadow-2xl relative overflow-hidden text-center transition-colors">
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

                {/* Glowing Checkmark */}
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-500/40 shadow-xl shadow-emerald-500/25">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>

                {/* Main Confirmation Heading */}
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">تم تسجيل الحضور بنجاح</h2>
                <p className="text-sm font-bold text-blue-600 dark:text-cyan-300 mt-1">
                  مرحباً بك يا كابتن: {registeredMember.fullName}
                </p>

                {/* Warning / Note Banner if any */}
                {warningMessage && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 p-3 text-xs flex items-center justify-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold">{warningMessage}</span>
                  </div>
                )}

                {/* Member Existing Information Summary */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1b2b4d] dark:bg-[#060c18] p-4 text-right space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4d] pb-2">
                    <span className="text-slate-500 dark:text-zinc-400">اسم المشترك:</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {registeredMember.fullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4d] pb-2">
                    <span className="text-slate-500 dark:text-zinc-400">رقم العضوية (ID):</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-cyan-300">
                      {registeredMember.id} ({registeredMember.qrCodeValue})
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4d] pb-2">
                    <span className="text-slate-500 dark:text-zinc-400">نوع الباقة / الاشتراك:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {registeredMember.membershipPlan}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4d] pb-2">
                    <span className="text-slate-500 dark:text-zinc-400">تاريخ الحضور:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {registeredRecord?.date || todayStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b2b4d] pb-2">
                    <span className="text-slate-500 dark:text-zinc-400">وقت الحضور:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {registeredRecord?.time || currentTimeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 dark:text-zinc-400">صلاحية الاشتراك:</span>
                    <span
                      className={`font-black rounded-full px-2 py-0.5 text-[10px] ${
                        daysRemaining !== null && daysRemaining <= 3
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      }`}
                    >
                      {daysRemaining !== null
                        ? daysRemaining > 0
                          ? `باقي ${daysRemaining} يوم`
                          : 'منتهي'
                        : 'نشط'}
                    </span>
                  </div>
                </div>

                {/* Reset button & Countdown */}
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-3 px-4 text-xs font-black text-white shadow-lg shadow-blue-600/30 transition-all active:scale-98"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>تسجيل مشترك آخر</span>
                  </button>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    العودة التلقائية خلال <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">{countdown}</span> ثوانٍ
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer & Admin Switch */}
      <footer className="border-t border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] px-4 py-3 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between max-w-lg mx-auto w-full transition-colors">
        <span>نظام RCN للحضور الذاتي • بدون إنترنت</span>
        {onExitToApp ? (
          <button
            onClick={onExitToApp}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            <span>لوحة الإدارة</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            <span>لوحة الإدارة</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </a>
        )}
      </footer>
    </div>
  );
};
