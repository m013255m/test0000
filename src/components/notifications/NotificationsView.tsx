import React, { useState, useMemo } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import { storageService, getDaysRemaining } from '../../services/storage';

interface NotificationsViewProps {
  tenantId: string;
  onNavigateToMembers?: () => void;
  onNavigateToSubscriptions?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  tenantId,
}) => {
  const [filter, setFilter] = useState<'all' | 'expiring' | 'debts'>('all');
  const [readIds, setReadIds] = useState<string[]>([]);

  const members = useMemo(() => storageService.getMembers(tenantId), [tenantId]);
  const payments = useMemo(() => storageService.getPayments(tenantId), [tenantId]);

  // Generate dynamic smart notifications based on members and financial records
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'expiring' | 'debt' | 'reminder';
      title: string;
      message: string;
      phone?: string;
      memberName: string;
      severity: 'high' | 'medium' | 'low';
      date: string;
    }> = [];

    // 1. Expiring subscriptions (less than or equal to 7 days, or expired)
    members.forEach((m) => {
      const days = getDaysRemaining(m.expirationDate);
      if (days < 0 && m.status === 'expired') {
        list.push({
          id: `exp-${m.id}`,
          type: 'expiring',
          title: `اشتراك منتهي: ${m.fullName}`,
          message: `انتهت صلاحية اشتراك (${m.membershipPlan}) بتاريخ ${m.expirationDate}. يرجى التواصل للتجديد.`,
          phone: m.phoneNumber,
          memberName: m.fullName,
          severity: 'high',
          date: m.expirationDate,
        });
      } else if (days >= 0 && days <= 7 && m.status === 'active') {
        list.push({
          id: `exp-${m.id}`,
          type: 'expiring',
          title: `اقتراب موعد التجديد: ${m.fullName}`,
          message: `ينتهي الاشتراك (${m.membershipPlan}) خلال ${days === 0 ? 'اليوم' : `${days} أيام`}.`,
          phone: m.phoneNumber,
          memberName: m.fullName,
          severity: days <= 3 ? 'high' : 'medium',
          date: m.expirationDate,
        });
      }
    });

    // 2. Unpaid & Outstanding Debts
    payments.forEach((p) => {
      if (p.remainingAmount > 0) {
        list.push({
          id: `debt-${p.id}`,
          type: 'debt',
          title: `مستحقات آجلة للمشترك: ${p.memberName}`,
          message: `متبقي مالي قدره ${p.remainingAmount} ج.م على الفاتورة رقم ${p.invoiceNumber}.`,
          memberName: p.memberName,
          severity: 'medium',
          date: p.paymentDate,
        });
      }
    });

    return list;
  }, [members, payments]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'expiring') return notifications.filter((n) => n.type === 'expiring');
    if (filter === 'debts') return notifications.filter((n) => n.type === 'debt');
    return notifications;
  }, [notifications, filter]);

  const handleSendWhatsApp = (phone: string, name: string, msg: string) => {
    // Format Egyptian / international number
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    }
    const text = encodeURIComponent(`مرحباً ${name}،\n${msg}\nنرحب بك دائماً في نادينا الرياضي.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleMarkAllRead = () => {
    setReadIds(notifications.map((n) => n.id));
  };

  return (
    <div className="space-y-5 text-right max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">مركز التنبيهات والمتابعة الذكية</h2>
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              {notifications.length} إشعار نشط
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            تنبيهات فورية بانتهاء الباقات، المتأخرات والرسائل التذكيرية عبر الواتساب
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          <span>تحديد الكل كمقروء</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-gray-200 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400'
          }`}
        >
          كافة التنبيهات ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'expiring'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400'
          }`}
        >
          انتهاء الاشتراكات ({notifications.filter((n) => n.type === 'expiring').length})
        </button>
        <button
          onClick={() => setFilter('debts')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filter === 'debts'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-zinc-400'
          }`}
        >
          الديون والمستحقات ({notifications.filter((n) => n.type === 'debt').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500">
            <Bell className="mx-auto h-10 w-10 opacity-30 mb-2" />
            <p className="font-bold text-sm">لا توجد تنبيهات عاجلة حالياً</p>
            <p className="text-xs text-gray-400 mt-1">كافة الاشتراكات والمدفوعات منتظمة ومستقرة</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border transition-all ${
                  isRead
                    ? 'border-gray-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 opacity-70'
                    : n.severity === 'high'
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      n.type === 'expiring'
                        ? 'bg-rose-500/15 text-rose-600'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    {n.type === 'expiring' ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <CreditCard className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                      {n.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-gray-400 font-mono">
                      التاريخ: {n.date}
                    </span>
                  </div>
                </div>

                {/* Quick Action: WhatsApp reminder */}
                {n.phone && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleSendWhatsApp(n.phone!, n.memberName, n.message)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>تذكير بالواتساب</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
