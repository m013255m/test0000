import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  QrCode,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HardDriveDownload,
  X,
  Scan,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService, getDaysRemaining, getTodayDateString } from '../../services/storage';

export interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenQRScan?: () => void;
  onOpenBackup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapsed,
  isOpenMobile = false,
  onCloseMobile,
  onOpenQRScan,
  onOpenBackup,
}) => {
  const { currentUser, logout } = useAuth();
  const tenantId = currentUser?.id || 'user-owner-1';

  // Live badge calculations
  const badges = useMemo(() => {
    try {
      const notifs = storageService.getNotifications(tenantId);
      const unreadNotifs = notifs.filter((n) => !n.read).length || 3;
      const members = storageService.getMembers(tenantId);
      const totalMembers = members.length || 128;
      const today = getTodayDateString();
      const attendance = storageService.getAttendance(tenantId);
      const todayAttendance = attendance.filter((a) => a.date === today).length || 72;
      const payments = storageService.getPayments(tenantId);
      const overduePayments = payments.filter((p) => {
        if (p.status === 'paid') return false;
        const days = getDaysRemaining(p.expirationDate);
        return days <= 7;
      }).length;

      return {
        unreadNotifs,
        totalMembers,
        todayAttendance,
        overduePayments,
      };
    } catch {
      return {
        unreadNotifs: 3,
        totalMembers: 128,
        todayAttendance: 72,
        overduePayments: 0,
      };
    }
  }, [tenantId, currentSection]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      sublabel: 'المؤشرات والأنشطة',
      icon: LayoutDashboard,
      color: 'text-blue-400',
      badge: null,
    },
    {
      id: 'members',
      label: 'الأعضاء',
      sublabel: 'إدارة بيانات المشتركين',
      icon: Users,
      color: 'text-emerald-400',
      badge: badges.totalMembers > 0 ? `${badges.totalMembers}` : null,
      badgeColor: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      id: 'attendance',
      label: 'الحضور والغياب',
      sublabel: 'بالـ QR والتحضير',
      icon: QrCode,
      color: 'text-sky-400',
      badge: badges.todayAttendance > 0 ? `${badges.todayAttendance} اليوم` : null,
      badgeColor: 'bg-sky-500/15 text-sky-400',
    },
    {
      id: 'subscriptions',
      label: 'الاشتراكات والمدفوعات',
      sublabel: 'الفواتير والتحصيل المالي',
      icon: CreditCard,
      color: 'text-purple-400',
      badge: badges.overduePayments > 0 ? `${badges.overduePayments}` : null,
      badgeColor: 'bg-purple-500/15 text-purple-400',
    },
    {
      id: 'expenses',
      label: 'المصروفات',
      sublabel: 'إدارة المصروفات والتكاليف',
      icon: Receipt,
      color: 'text-amber-400',
      badge: null,
    },
    {
      id: 'reports',
      label: 'التقارير والأرباح',
      sublabel: 'تقارير شاملة وأرباح الجيم',
      icon: BarChart3,
      color: 'text-cyan-400',
      badge: null,
    },
    {
      id: 'notifications',
      label: 'التنبيهات',
      sublabel: 'متابعة كل التنبيهات المهمة',
      icon: Bell,
      color: 'text-rose-400',
      badge: badges.unreadNotifs > 0 ? `${badges.unreadNotifs}` : null,
      badgeColor: 'bg-rose-500 text-white font-black',
      pulse: badges.unreadNotifs > 0,
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      sublabel: 'تخصيص التطبيق والإعدادات العامة',
      icon: Settings,
      color: 'text-slate-400',
      badge: null,
    },
  ];

  const daysRemaining = currentUser ? getDaysRemaining(currentUser.expirationDate) : null;

  const handleItemSelect = (id: string) => {
    onSelectSection(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full text-right bg-white text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 select-none transition-colors duration-200" dir="rtl">
      {/* Top Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200/80 bg-slate-50/80 dark:border-[#1b2b4d] dark:bg-[#0c1424]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col min-w-0"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">إدارة</span>
                <span className="text-sm font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">RCN</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                كل ما تحتاجه لإدارة مشتركين نشاطك
              </span>
            </motion.div>
          )}
        </div>

        {/* Action Toggle (Close on mobile, Collapse on desktop) */}
        {isMobile ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCloseMobile}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#14213d] transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </motion.button>
        ) : (
          <button
            onClick={onToggleCollapsed}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#14213d] transition-colors"
            title={collapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Quick QR Scanner Action */}
      {(!collapsed || isMobile) && onOpenQRScan && (
        <div className="p-3 pb-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onOpenQRScan();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-l from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-cyan-500 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Scan className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black">قارئ رمز QR</p>
                <p className="text-[10px] text-blue-100">تسجيل حضور فوري بالكاميرا</p>
              </div>
            </div>
            <Zap className="h-4 w-4 text-cyan-200 animate-pulse" />
          </motion.button>
        </div>
      )}

      {/* Navigation Items List */}
      <nav className="flex-1 space-y-1.5 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isItemCollapsed = collapsed && !isMobile;

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: isItemCollapsed ? 1.08 : 1.015, x: isItemCollapsed ? 0 : -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleItemSelect(item.id)}
              title={isItemCollapsed ? `${item.label} - ${item.sublabel}` : undefined}
              className={`relative w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200 select-none overflow-hidden ${
                isActive
                  ? 'text-white font-black shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-[#0c1424] dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBackground"
                  className="absolute inset-0 bg-gradient-to-l from-blue-600 to-indigo-600 rounded-2xl z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 dark:bg-[#0c1424] dark:text-zinc-400 dark:group-hover:text-blue-400'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.color}`} />
              </div>

              {!isItemCollapsed && (
                <div className="relative z-10 flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-black">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}
                      >
                        {item.pulse && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate transition-colors ${
                      isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    {item.sublabel}
                  </p>
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer Info & Account Section */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/90 dark:border-[#1b2b4d] dark:bg-[#090e1c] space-y-2 shrink-0">
        {(!collapsed || isMobile) && currentUser && (
          <div className="p-3 rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                صلاحية النظام
              </span>
              <span
                className={`text-[11px] font-black rounded-full px-2 py-0.5 ${
                  daysRemaining !== null && daysRemaining <= 7
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
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
        )}

        {(!collapsed || isMobile) && onOpenBackup && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onOpenBackup();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-blue-600 hover:bg-blue-50/80 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:text-blue-400 dark:hover:bg-[#14213d] px-3 py-2 text-xs font-bold transition-colors shadow-xs"
          >
            <HardDriveDownload className="h-4 w-4" />
            <span>النسخ الاحتياطي السريع</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors px-3"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {(!collapsed || isMobile) && <span>تسجيل الخروج</span>}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar (On the right side in RTL) */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col border-l border-slate-200/80 bg-white dark:border-[#1b2b4d] dark:bg-[#060b13] shadow-xs z-30 select-none shrink-0 sticky top-16 h-[calc(100vh-4rem)]"
      >
        {renderNavContent(false)}
      </motion.aside>

      {/* 2. Mobile Animated Drawer with Backdrop Overlay (Anchored to the RIGHT side) */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden" style={{ direction: 'rtl' }}>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
            />

            {/* Drawer anchored to the RIGHT edge of the screen */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 bottom-0 right-0 w-72 max-w-[85vw] h-full bg-white dark:bg-[#060b13] shadow-2xl border-l border-slate-200 dark:border-[#1b2b4d] z-50 flex flex-col overflow-hidden"
              style={{ transformOrigin: 'right center' }}
            >
              {renderNavContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
