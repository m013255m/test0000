import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  LogOut,
  Search,
  Database,
  Calendar,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Send,
  Zap,
  Filter,
  Check,
  XCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { SaaSUser } from '../../types';
import { storageService, addDays, getTodayDateString, getDaysRemaining } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SuperAdminDashboardProps {
  onSwitchToTenant: (tenantId: string) => void;
  onOpenBackupModal: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onSwitchToTenant,
  onOpenBackupModal,
}) => {
  const { logout, allUsers, switchToTenant, refreshUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');

  // Add / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SaaSUser | null>(null);

  // Exact 6 Fields Requested by User
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete User Confirmation
  const [userToDelete, setUserToDelete] = useState<SaaSUser | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for Adding a new User
  const handleOpenAdd = () => {
    setEditingUser(null);
    const today = getTodayDateString();
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setFullName('');
    setPhoneNumber('');
    setStartDate(today);
    setEndDate(addDays(today, 365)); // 1 year default
    setIsModalOpen(true);
  };

  // Open modal for Editing an existing User
  const handleOpenEdit = (user: SaaSUser) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password || '');
    setShowPassword(false);
    setFullName(user.fullName);
    setPhoneNumber(user.phoneNumber || '');
    setStartDate(user.startDate || getTodayDateString());
    setEndDate(user.expirationDate || addDays(getTodayDateString(), 30));
    setIsModalOpen(true);
  };

  // Save (Create or Update) User
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim() || !startDate || !endDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const days = getDaysRemaining(endDate);
    const autoStatus: SaaSUser['status'] = days <= 0 ? 'expired' : 'active';

    if (editingUser) {
      storageService.updateUser({
        ...editingUser,
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        businessName: fullName.trim(), // Keep synced for display
        phoneNumber: phoneNumber.trim(),
        startDate,
        expirationDate: endDate,
        status: editingUser.status === 'disabled' ? 'disabled' : autoStatus,
      });
      showToast(`تم تحديث بيانات المستخدم "${fullName}" ومزامنتها سحابياً بنجاح`);
    } else {
      // Check username collision
      const exists = allUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        alert('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.');
        return;
      }

      storageService.addUser({
        username: username.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        businessName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        startDate,
        expirationDate: endDate,
        status: autoStatus,
        businessType: 'gym',
        role: 'business_owner',
        notes: 'تم الإنشاء عبر RCN Admin Dashboard',
      });
      showToast(`تم حفظ المستخدم "${fullName}" سحابياً - متاح لتسجيل الدخول من أي جهاز فوراً`);
    }

    setIsModalOpen(false);
    refreshUsers();
  };

  // Delete User
  const handleDeleteUser = () => {
    if (!userToDelete) return;
    const name = userToDelete.fullName;
    storageService.deleteUser(userToDelete.id);
    setUserToDelete(null);
    refreshUsers();
    showToast(`تم حذف حساب "${name}" من قاعدة البيانات المركزية`);
  };

  // Quick 1-Click Renew Subscription
  const handleQuickRenew = (user: SaaSUser, daysToAdd: number) => {
    const today = getTodayDateString();
    // If already expired, extend from today, otherwise extend from current expirationDate
    const baseDate = getDaysRemaining(user.expirationDate) <= 0 ? today : user.expirationDate;
    const newExpiration = addDays(baseDate, daysToAdd);

    storageService.updateUser({
      ...user,
      expirationDate: newExpiration,
      status: 'active',
    });
    refreshUsers();
    showToast(`تم تجديد اشتراك "${user.fullName}" لمدة ${daysToAdd} يوم إضافية`);
  };

  // Toggle user status (Active <-> Disabled)
  const handleToggleStatus = (user: SaaSUser) => {
    const nextStatus: SaaSUser['status'] = user.status === 'disabled' ? 'active' : 'disabled';
    storageService.updateUser({
      ...user,
      status: nextStatus,
    });
    refreshUsers();
    showToast(
      nextStatus === 'active'
        ? `تم تفعيل حساب "${user.fullName}"`
        : `تم تعطيل حساب "${user.fullName}" مؤقتاً`
    );
  };

  // Switch to User's Tenant
  const handleEnterFacility = (user: SaaSUser) => {
    switchToTenant(user);
    onSwitchToTenant(user.id);
  };

  // Quick WhatsApp message for renewal
  const handleSendWhatsApp = (user: SaaSUser) => {
    if (!user.phoneNumber) return;
    const cleanPhone = user.phoneNumber.replace(/[^\d+]/g, '');
    const days = getDaysRemaining(user.expirationDate);
    const msg =
      days <= 0
        ? `مرحباً ${user.fullName}، نفيدكم بانتهاء صلاحية اشتراككم في منصة إدارة RCN بتاريخ ${user.expirationDate}. يرجى التواصل معنا للتجديد وتفعيل الحساب.`
        : `مرحباً ${user.fullName}، نود تذكيركم بأن اشتراككم في منصة إدارة RCN سينتهي خلال ${days} يوم بتاريخ ${user.expirationDate}. يرجى التجديد لضمان استمرار الخدمة دون انقطاع.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Expired and Expiring Users (Attention Section)
  const notificationUsers = useMemo(() => {
    return allUsers
      .map((user) => {
        const days = getDaysRemaining(user.expirationDate);
        return {
          ...user,
          daysRemaining: days,
          isExpired: days <= 0 || user.status === 'expired',
          isExpiringSoon: days > 0 && days <= 7,
        };
      })
      .filter((u) => u.isExpired || u.isExpiringSoon)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [allUsers]);

  // Statistics
  const stats = useMemo(() => {
    const total = allUsers.length;
    let active = 0;
    let expired = 0;
    let expiringSoon = 0;

    allUsers.forEach((u) => {
      const days = getDaysRemaining(u.expirationDate);
      if (u.status === 'disabled') {
        // disabled
      } else if (days <= 0 || u.status === 'expired') {
        expired++;
      } else {
        active++;
        if (days <= 7) expiringSoon++;
      }
    });

    return { total, active, expired, expiringSoon };
  }, [allUsers]);

  // Filtered Users for table
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((u) => {
        const days = getDaysRemaining(u.expirationDate);
        const isExp = days <= 0 || u.status === 'expired';

        if (statusFilter === 'active' && (u.status !== 'active' || isExp)) return false;
        if (statusFilter === 'expired' && !isExp) return false;
        if (statusFilter === 'disabled' && u.status !== 'disabled') return false;

        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.phoneNumber && u.phoneNumber.includes(q))
        );
      })
      .sort((a, b) => getDaysRemaining(a.expirationDate) - getDaysRemaining(b.expirationDate));
  }, [allUsers, searchTerm, statusFilter]);

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200"
      dir="rtl"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 dark:border-[#1b2b4d] dark:bg-[#0c1424]/95 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  RCN Admin Dashboard
                </h1>
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-cyan-300">
                  لوحة الإدارة العليا
                </span>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  قاعدة بيانات مركزية سحابية
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                إدارة المستخدمين مركزياً ومزامنة البيانات تلقائياً عبر جميع الأجهزة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              title={theme === 'dark' ? 'الوضع النهاري (أبيض)' : 'الوضع الليلي'}
              className="rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] p-2 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#14213d] transition-colors shadow-xs"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
            </button>

            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#060c18] px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#14213d] transition-colors shadow-xs"
            >
              <Database className="h-4 w-4 text-cyan-500" />
              <span className="hidden sm:inline">نسخ احتياطي للنظام</span>
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-xs"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-emerald-500/40 bg-[#0d1627] px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. KEY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Users */}
          <div className="rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-bold">إجمالي المستخدمين</span>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total}</div>
            <span className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1 block">حسابات مسجلة بالنظام</span>
          </div>

          {/* Active Users */}
          <div className="rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="text-xs font-bold">الحسابات النشطة</span>
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</div>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">اشتراكات سارية حالياً</span>
          </div>

          {/* Expired Subscriptions (Highlight Attention) */}
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-gradient-to-br dark:from-[#1a0c14] dark:to-[#0d1627] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-xs font-bold">اشتراكات منتهية</span>
              <XCircle className="h-4 w-4 text-rose-500 animate-pulse" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.expired}</div>
            <span className="text-[11px] text-rose-600 dark:text-rose-300 mt-1 block font-semibold">
              تتطلب تجديد فوري
            </span>
          </div>

          {/* Expiring Soon */}
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-gradient-to-br dark:from-[#1a140c] dark:to-[#0d1627] p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-bold">تنتهي خلال 7 أيام</span>
              <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats.expiringSoon}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-300 mt-1 block font-semibold">
              متابعة للتجديد المسبق
            </span>
          </div>
        </div>

        {/* 2. SPECIAL ATTENTION SECTION: NOTIFICATIONS FOR EXPIRED & EXPIRING SUBSCRIPTIONS */}
        <section className="rounded-3xl border border-amber-300/80 bg-white dark:border-amber-500/30 dark:bg-[#0d1627] p-5 sm:p-6 shadow-md dark:shadow-xl relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-[#1b2b4d] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    مركز تنبيهات الاشتراكات المنتهية والقريبة من الانتهاء
                  </h2>
                  <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                    {notificationUsers.length} تنبيه
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  إجراءات سريعة لتجديد الاشتراكات، إرسال تذكيرات عبر واتساب، أو إدارة الصلاحيات
                </p>
              </div>
            </div>
          </div>

          {notificationUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-zinc-300">جميع اشتراكات المستخدمين سارية ونشطة حالياً</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                لا توجد أي حسابات منتهية الصلاحية أو قريبة من الانتهاء
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {notificationUsers.map((user) => {
                const isExp = user.isExpired;
                return (
                  <div
                    key={user.id}
                    className={`rounded-2xl border p-3.5 transition-all flex flex-col justify-between gap-3 ${
                      isExp
                        ? 'border-rose-200 bg-rose-50/50 hover:border-rose-300 dark:border-rose-900/50 dark:bg-[#160b13]/80 dark:hover:border-rose-700/60'
                        : 'border-amber-200 bg-amber-50/50 hover:border-amber-300 dark:border-amber-900/50 dark:bg-[#16120b]/80 dark:hover:border-amber-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shrink-0 ${
                            isExp
                              ? 'bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                              : 'bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                        >
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{user.fullName}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                isExp
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                              }`}
                            >
                              {isExp
                                ? `منتهي منذ ${Math.abs(user.daysRemaining)} يوم`
                                : `ينتهي خلال ${user.daysRemaining} أيام`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-mono">
                            <span>@{user.username}</span>
                            {user.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                                {user.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left text-xs font-mono text-slate-500 dark:text-zinc-400 shrink-0">
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">تاريخ النهاية</div>
                        <div className="font-bold text-slate-800 dark:text-zinc-200">{user.expirationDate}</div>
                      </div>
                    </div>

                    {/* Quick Action Toolbar for Expired Accounts */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {/* Quick Renew +30 Days */}
                        <button
                          onClick={() => handleQuickRenew(user, 30)}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500/30 dark:text-cyan-300 dark:hover:bg-blue-600 dark:hover:text-white px-2.5 py-1.5 text-xs font-bold transition-colors"
                          title="تجديد لمدة شهر إضافي"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>+30 يوم</span>
                        </button>

                        {/* Quick Renew +1 Year */}
                        <button
                          onClick={() => handleQuickRenew(user, 365)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-700 dark:bg-emerald-600/20 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white px-2.5 py-1.5 text-xs font-bold transition-colors"
                          title="تجديد لسنة كاملة"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>+سنة</span>
                        </button>

                        {/* WhatsApp Reminder */}
                        {user.phoneNumber && (
                          <button
                            onClick={() => handleSendWhatsApp(user)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/30 dark:border-emerald-500/30 dark:text-emerald-400 px-2.5 py-1.5 text-xs font-bold transition-colors"
                            title="إرسال تذكير بالواتساب"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>واتساب</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#0c1424] transition-colors"
                          title="تعديل الحساب"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEnterFacility(user)}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-[#0c1424] dark:border-[#1b2b4d] px-2.5 py-1 text-xs font-bold dark:text-zinc-300 dark:hover:text-white dark:hover:border-blue-500 transition-colors"
                          title="دخول حساب المستخدم"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>دخول</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. USER MANAGEMENT (ADD & MANAGE USERS) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">إدارة المستخدمين والحسابات</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                إضافة مستخدم جديد، ضبط كلمات المرور، تواريخ الاشتراك، والصلاحيات
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-cyan-500 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="بحث باسم المستخدم، الاسم الكامل، أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-[#1b2b4d] dark:bg-[#0d1627] dark:text-white dark:placeholder-zinc-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors shrink-0 shadow-xs ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#0d1627] dark:border-[#1b2b4d] dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                الكل ({allUsers.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors shrink-0 shadow-xs ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:bg-[#0d1627] dark:border-[#1b2b4d] dark:text-zinc-400 dark:hover:text-emerald-400'
                }`}
              >
                نشط ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors shrink-0 shadow-xs ${
                  statusFilter === 'expired'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:bg-[#0d1627] dark:border-[#1b2b4d] dark:text-zinc-400 dark:hover:text-rose-400'
                }`}
              >
                منتهي ({stats.expired})
              </button>
              <button
                onClick={() => setStatusFilter('disabled')}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors shrink-0 shadow-xs ${
                  statusFilter === 'disabled'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#0d1627] dark:border-[#1b2b4d] dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                معطل
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0d1627] shadow-md dark:shadow-xl transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-[#1b2b4d] dark:bg-[#090e1c] dark:text-zinc-400 font-bold">
                  <tr>
                    <th className="py-3.5 pr-4 pl-3">اسم المستخدم بالكامل (Full Name)</th>
                    <th className="py-3.5 px-3">اسم المستخدم (Username)</th>
                    <th className="py-3.5 px-3">رقم الهاتف (Phone)</th>
                    <th className="py-3.5 px-3">تاريخ البداية</th>
                    <th className="py-3.5 px-3">تاريخ النهاية</th>
                    <th className="py-3.5 px-3">حالة الاشتراك</th>
                    <th className="py-3.5 pl-4 pr-3 text-left">إجراءات الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1b2b4d]/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        لا يوجد مستخدمون مطابقون لمعايير البحث
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const days = getDaysRemaining(u.expirationDate);
                      const isExp = days <= 0 || u.status === 'expired';
                      const isSoon = days > 0 && days <= 7;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#101b30] transition-colors">
                          <td className="py-3 pr-4 pl-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-600/20 dark:text-cyan-400 font-black text-xs shrink-0">
                                {u.fullName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{u.fullName}</span>
                                {u.password && (
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                    كلمة المرور: {u.password}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-blue-600 dark:text-cyan-300 font-bold">
                            @{u.username}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-700 dark:text-zinc-300">
                            {u.phoneNumber || '—'}
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-500 dark:text-zinc-400">
                            {u.startDate || '—'}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold">
                            <span
                              className={
                                isExp
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : isSoon
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-800 dark:text-zinc-200'
                              }
                            >
                              {u.expirationDate}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                                  u.status === 'disabled'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    : isExp
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                                    : isSoon
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                                }`}
                              >
                                {u.status === 'disabled'
                                  ? 'معطل'
                                  : isExp
                                  ? 'منتهي'
                                  : isSoon
                                  ? `باقي ${days} أيام`
                                  : 'نشط'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 pl-4 pr-3 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Enter Tenant */}
                              <button
                                onClick={() => handleEnterFacility(u)}
                                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white dark:bg-blue-600/20 dark:border-blue-500/30 dark:text-cyan-300 dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
                                title="دخول لوحة المستخدم"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>دخول</span>
                              </button>

                              {/* Quick Renew +30 Days */}
                              <button
                                onClick={() => handleQuickRenew(u, 30)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-cyan-400 dark:hover:bg-[#0c1424] transition-colors"
                                title="تجديد سريع (+30 يوم)"
                              >
                                <Zap className="h-3.5 w-3.5" />
                              </button>

                              {/* WhatsApp Direct */}
                              {u.phoneNumber && (
                                <button
                                  onClick={() => handleSendWhatsApp(u)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-emerald-400 dark:hover:bg-[#0c1424] transition-colors"
                                  title="مراسلة عبر واتساب"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {/* Edit User */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-[#0c1424] transition-colors"
                                title="تعديل المستخدم"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-[#0c1424] transition-colors"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* 4. ADD / EDIT USER MODAL WITH THE EXACT 6 FIELDS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد إلى RCN'}
        subtitle="أدخل بيانات الحساب وتواريخ بداية ونهاية الاشتراك"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-right" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                اسم المستخدم (Username) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: alex_fitness"
                  className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* 2. Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                كلمة المرور (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 3. User's Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                اسم المستخدم بالكامل (User’s Full Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: كابتن أحمد سامي"
                className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 4. Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                رقم الهاتف (Phone Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01012345678"
                  className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* 5. Start Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  تاريخ البداية (Start Date) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setStartDate(getTodayDateString())}
                  className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  اليوم
                </button>
              </div>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 6. End Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  تاريخ النهاية (End Date) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEndDate(addDays(startDate || getTodayDateString(), 30))}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    +شهر
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndDate(addDays(startDate || getTodayDateString(), 90))}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    +3 أشهر
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndDate(addDays(startDate || getTodayDateString(), 365))}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    +سنة
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-[#1b2b4d] bg-white dark:bg-[#060c18] px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1b2b4d]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-[#1b2b4d] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#14213d] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-5 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              {editingUser ? 'حفظ التعديلات' : 'تسجيل المستخدم'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="حذف حساب المستخدم"
        message={`هل أنت متأكد من حذف حساب "${userToDelete?.fullName}" (@${userToDelete?.username})؟ سيتم حذف بيانات المشتركين والحضور التابعة له بشكل نهائي.`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />
    </div>
  );
};
