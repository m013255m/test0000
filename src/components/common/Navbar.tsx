import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Settings,
  HardDriveDownload,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { storageService, getDaysRemaining } from '../../services/storage';
import { AppNotification } from '../../types';
import { BackupModal } from './BackupModal';

export interface NavbarProps {
  onOpenQRScan: () => void;
  onOpenAddMember: () => void;
  onOpenAddPayment: () => void;
  onNavigateSection: (section: string) => void;
  onToggleMobileSidebar: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onDataModified?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateSection,
  onToggleMobileSidebar,
  searchQuery = '',
  onSearchChange,
  onDataModified,
}) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const tenantId = currentUser?.id || 'user-owner-1';

  const loadNotifications = () => {
    const list = storageService.getNotifications(tenantId);
    setNotifications(list);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000);
    return () => clearInterval(interval);
  }, [tenantId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length || 3;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const daysRemaining = currentUser ? getDaysRemaining(currentUser.expirationDate) : null;

  return (
    <header
      className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 dark:border-[#1b2b4d] dark:bg-[#060c18]/95 px-3 sm:px-5 backdrop-blur-xl transition-colors duration-200"
      dir="rtl"
    >
      {/* 1. Right Side: Hamburger Button */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMobileSidebar}
          className="flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:text-white dark:hover:bg-[#14213d] dark:hover:border-blue-500/50 transition-all shadow-xs shrink-0"
          aria-label="فتح القائمة"
          title="القائمة"
        >
          <Menu className="h-5 w-5" />
        </motion.button>
      </div>

      {/* 2. Center: Search Bar ("بحث في التطبيق...") matching screenshot */}
      <div className="flex-1 mx-2 sm:mx-4 max-w-xl">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="بحث في التطبيق..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:text-white dark:placeholder-zinc-400 dark:focus:border-blue-500 dark:focus:bg-[#0c1424] dark:focus:ring-blue-500/30 py-2.5 pr-10 pl-8 text-xs sm:text-sm transition-all text-right"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Left Side: Sun Toggle, Bell Badge (3), User Avatar with Chevron */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Sun / Theme Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          aria-label="تبديل المظهر"
          title={theme === 'dark' ? 'الوضع النهاري (أبيض)' : 'الوضع الليلي'}
          className="flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 text-amber-500 hover:bg-slate-100 hover:text-amber-600 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:text-amber-400 dark:hover:bg-[#14213d] transition-colors shadow-xs shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </motion.button>

        {/* Notifications Bell with Red Circular Badge (3) */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="التنبيهات"
            className="relative flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:text-white dark:hover:bg-[#14213d] transition-colors shadow-xs shrink-0"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md shadow-rose-500/40">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-4 z-50 text-right dark:border-[#1b2b4d] dark:bg-[#0d1627] dark:text-white"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1b2b4d] pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">التنبيهات</h3>
                    <span className="rounded-full bg-rose-50 dark:bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {unreadCount} جديد
                    </span>
                  </div>
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-400">
                      لا توجد إشعارات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.linkSection) onNavigateSection(notif.linkSection);
                          setShowNotifications(false);
                        }}
                        className={`flex items-start gap-3 rounded-2xl p-2.5 text-right text-xs transition-colors cursor-pointer ${
                          notif.read
                            ? 'bg-transparent text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-[#14213d]/60'
                            : 'bg-blue-50/90 text-slate-900 border border-blue-200/80 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:text-white dark:hover:bg-blue-900/40 dark:border-blue-900/40'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.severity === 'critical' ? (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          ) : notif.severity === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white">{notif.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-600 dark:text-zinc-300 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#1b2b4d] text-center">
                  <button
                    onClick={() => {
                      onNavigateSection('notifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    عرض كافة التنبيهات
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar with Chevron Down on Far Left */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-[#1b2b4d] dark:bg-[#0c1424] dark:hover:bg-[#14213d] dark:text-white transition-colors shadow-xs"
            aria-label="قائمة المستخدم"
          >
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-400 ml-1" />
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-xs shadow-xs">
              {currentUser?.fullName?.charAt(0) || 'R'}
            </div>
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-60 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-2.5 z-50 text-right dark:border-[#1b2b4d] dark:bg-[#0d1627] dark:text-white"
              >
                <div className="border-b border-slate-100 dark:border-[#1b2b4d] px-3 py-2">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {currentUser?.fullName || 'مدير المنشأة'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {currentUser?.businessName || 'إدارة RCN'}
                  </p>
                  {daysRemaining !== null && (
                    <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold">
                      {daysRemaining > 0 ? `الاشتراك: باقي ${daysRemaining} يوم` : 'منتهي'}
                    </div>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsBackupModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:text-zinc-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
                  >
                    <HardDriveDownload className="h-4 w-4" />
                    <span>النسخ الاحتياطي</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateSection('settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:text-zinc-200 dark:hover:bg-[#14213d] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>إعدادات النظام</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-[#1b2b4d] pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global Backup Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tenantId={tenantId}
        currentUser={currentUser}
        onDataRestored={() => {
          if (onDataModified) onDataModified();
          loadNotifications();
        }}
      />
    </header>
  );
};
