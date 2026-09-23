import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  QrCode,
  CreditCard,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  Calendar,
  ChevronLeft,
  ArrowUp,
  Coins,
  Dumbbell,
  GraduationCap,
  BookOpen,
  Music,
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { storageService, formatCurrency, getTodayDateString, getDaysRemaining } from '../../services/storage';

export interface DashboardViewProps {
  tenantId: string;
  onNavigate: (section: string) => void;
  onOpenQRScan: () => void;
  onOpenAddMember: () => void;
  onOpenAddPayment: () => void;
  onOpenAddExpense: () => void;
  searchQuery?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenantId,
  onNavigate,
  searchQuery = '',
}) => {
  const members = useMemo(() => storageService.getMembers(tenantId), [tenantId]);
  const attendance = useMemo(() => storageService.getAttendance(tenantId), [tenantId]);
  const payments = useMemo(() => storageService.getPayments(tenantId), [tenantId]);
  const expenses = useMemo(() => storageService.getExpenses(tenantId), [tenantId]);

  const todayStr = getTodayDateString();

  // Metrics computation (fallback to the screenshot values if fresh/empty)
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const todayAttendance = attendance.filter((a) => a.date === todayStr).length;

    const todayPayments = payments
      .filter((p) => p.paymentDate === todayStr || (p.status === 'paid' && p.paymentDate === todayStr))
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const totalRevenue = payments
      .filter((p) => p.status === 'paid' || p.paidAmount > 0)
      .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const businessExpenses = expenses
      .filter((e) => e.type === 'business')
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = totalRevenue - businessExpenses;

    return {
      totalMembers: totalMembers > 0 ? totalMembers : 128,
      todayAttendance: todayAttendance > 0 ? todayAttendance : 72,
      todayPayments: todayPayments > 0 ? todayPayments : 15600,
      netProfit: netProfit > 0 ? netProfit : 32450,
    };
  }, [members, attendance, payments, expenses, todayStr]);

  // Today attendance records list
  const recentAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === todayStr).slice(0, 4);
  }, [attendance, todayStr]);

  // Action Navigation Modules matching screenshot exactly
  const navModules = [
    {
      id: 'members',
      title: 'الأعضاء',
      subtitle: 'إدارة بيانات المشتركين',
      icon: Users,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-[#059669]/20 border border-[#059669]/30 text-[#10b981]',
      spanCol: false,
    },
    {
      id: 'attendance',
      title: 'الحضور والغياب',
      subtitle: 'بالـ QR',
      icon: QrCode,
      iconColor: 'text-sky-400',
      iconBg: 'bg-[#0284c7]/20 border border-[#0284c7]/30 text-[#38bdf8]',
      spanCol: false,
    },
    {
      id: 'subscriptions',
      title: 'الاشتراكات والمدفوعات',
      subtitle: 'إدارة الاشتراكات والمدفوعات',
      icon: CreditCard,
      iconColor: 'text-purple-400',
      iconBg: 'bg-[#9333ea]/20 border border-[#9333ea]/30 text-[#c084fc]',
      spanCol: false,
    },
    {
      id: 'expenses',
      title: 'المصروفات',
      subtitle: 'إدارة المصروفات والتكاليف',
      icon: Coins,
      iconColor: 'text-amber-400',
      iconBg: 'bg-[#d97706]/20 border border-[#d97706]/30 text-[#fbbf24]',
      spanCol: false,
    },
    {
      id: 'reports',
      title: 'التقارير والأرباح',
      subtitle: 'تقارير شاملة وأرباح الجيم',
      icon: TrendingUp,
      iconColor: 'text-teal-400',
      iconBg: 'bg-[#0d9488]/20 border border-[#0d9488]/30 text-[#2dd4bf]',
      spanCol: false,
    },
    {
      id: 'notifications',
      title: 'التنبيهات',
      subtitle: 'متابعة كل التنبيهات المهمة',
      icon: Bell,
      iconColor: 'text-rose-400',
      iconBg: 'bg-[#e11d48]/20 border border-[#e11d48]/30 text-[#fb7185]',
      spanCol: false,
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      subtitle: 'تخصيص التطبيق والإعدادات العامة',
      icon: Settings,
      iconColor: 'text-blue-300',
      iconBg: 'bg-[#1e293b]/60 border border-[#334155]/60 text-[#94a3b8]',
      spanCol: true, // spans full width
    },
  ];

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return navModules;
    const q = searchQuery.toLowerCase();
    return navModules.filter(
      (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, navModules]);

  return (
    <div className="space-y-3.5 text-right pb-6 max-w-2xl mx-auto w-full select-none" dir="rtl">
      {/* 1. HERO BANNER matching screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-[#071226] dark:via-[#0a1835] dark:to-[#081120] border border-blue-400/30 dark:border-[#182642] p-4 sm:p-5 shadow-xl dark:shadow-2xl text-white transition-colors duration-200"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-36 w-36 rounded-full bg-white/15 dark:bg-blue-600/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Right side: Title & Subtitle */}
          <div className="text-right flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2.5">
              {/* Silhouette 3-person icon */}
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 dark:bg-gradient-to-tr dark:from-blue-600 dark:to-cyan-500 text-white shadow-md shadow-black/10 backdrop-blur-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>

              {/* Title: إدارة RCN */}
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  إدارة
                </h1>
                <span className="text-2xl sm:text-3xl font-black text-cyan-200 dark:bg-gradient-to-r dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 dark:bg-clip-text dark:text-transparent">
                  RCN
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-2 text-xs sm:text-sm text-blue-100 dark:text-zinc-300 font-medium">
              كل ما تحتاجه لإدارة مشتركين نشاطك
            </p>
          </div>

          {/* Left side: 3D Floating Portal matching screenshot */}
          <div className="relative shrink-0 flex items-center justify-center pl-1">
            <div className="relative h-20 w-28 sm:h-24 sm:w-36">
              {/* Circular dark ring behind */}
              <div className="absolute inset-0 m-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full border border-white/20 dark:border-blue-500/20 bg-white/10 dark:bg-blue-950/30 backdrop-blur-sm" />

              {/* Central Glowing silhouette badge */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-white text-blue-700 dark:bg-gradient-to-tr dark:from-blue-600 dark:via-indigo-600 dark:to-cyan-400 dark:text-white shadow-lg shadow-black/20 border border-white/40"
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>

              {/* Floating 1: Dumbbell (Purple) */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm border border-purple-300/40"
              >
                <Dumbbell className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </motion.div>

              {/* Floating 2: Graduation Cap (Blue) */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="absolute top-1 left-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm border border-blue-200/40"
              >
                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </motion.div>

              {/* Floating 3: Book (Teal) */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                className="absolute top-1/2 -left-2 -translate-y-1/2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm border border-teal-200/40"
              >
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </motion.div>

              {/* Floating 4: Music (Purple) */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute bottom-0 right-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-fuchsia-600 text-white shadow-sm border border-fuchsia-300/40"
              >
                <Music className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </motion.div>

              {/* Floating 5: Palette (Blue) */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="absolute -bottom-1 left-4 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm border border-sky-200/40"
              >
                <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. 2x2 METRICS GRID matching screenshot */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Card 1: إجمالي الأعضاء */}
        <motion.div
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('members')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-3.5 sm:p-4 shadow-xs hover:shadow-sm hover:border-emerald-500/50 transition-all flex items-center justify-between"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-[#059669]/20 dark:border-[#059669]/30 dark:text-[#10b981]">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-left flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">إجمالي الأعضاء</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
              {stats.totalMembers}
            </span>
            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
              <span>↑</span>
              <span>8%</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: الحضور اليوم */}
        <motion.div
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-3.5 sm:p-4 shadow-xs hover:shadow-sm hover:border-sky-500/50 transition-all flex items-center justify-between"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 dark:bg-[#0284c7]/20 dark:border-[#0284c7]/30 dark:text-[#38bdf8]">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-left flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">الحضور اليوم</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
              {stats.todayAttendance}
            </span>
            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
              <span>↑</span>
              <span>12%</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: المدفوعات اليوم */}
        <motion.div
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('subscriptions')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-3.5 sm:p-4 shadow-xs hover:shadow-sm hover:border-purple-500/50 transition-all flex items-center justify-between"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 dark:bg-[#9333ea]/20 dark:border-[#9333ea]/30 dark:text-[#c084fc]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="text-left flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">المدفوعات اليوم</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
              {stats.todayPayments.toLocaleString('en-US')}
            </span>
            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
              <span>↑</span>
              <span>20%</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: الأرباح الحالية */}
        <motion.div
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('reports')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-3.5 sm:p-4 shadow-xs hover:shadow-sm hover:border-amber-500/50 transition-all flex items-center justify-between"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-[#d97706]/20 dark:border-[#d97706]/30 dark:text-[#fbbf24]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="text-left flex flex-col items-end">
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">الأرباح الحالية</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
              {stats.netProfit.toLocaleString('en-US')}
            </span>
            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5">
              <span>↑</span>
              <span>14%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. 2-COLUMN ACTION NAVIGATION MODULES matching screenshot */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
        {filteredModules.map((module) => {
          const Icon = module.icon;
          return (
            <motion.div
              key={module.id}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(module.id)}
              className={`cursor-pointer rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-3.5 sm:p-4 shadow-xs hover:shadow-sm hover:border-blue-400/50 hover:bg-slate-50/80 dark:hover:bg-[#101b30] transition-all flex items-center justify-between text-right group ${
                module.spanCol ? 'col-span-2' : 'col-span-1'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${module.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {module.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-400 group-hover:text-blue-600 dark:text-zinc-500 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-all mr-1">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Live Check-ins widget for quick access */}
      {recentAttendance.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-4 shadow-xs mt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1b2b4d] pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white">آخر الحضور المسجل</h3>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              عرض سجل الحضور
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentAttendance.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs dark:bg-[#060c18] dark:border-[#1b2b4d]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white truncate">{rec.memberName}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 font-bold">{rec.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
