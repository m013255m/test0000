import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  Database,
  CheckCircle2,
  RefreshCw,
  Save,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { calendarService } from '../../services/calendar';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SettingsViewProps {
  tenantId: string;
  onOpenBackupModal: () => void;
  onDataModified?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tenantId,
  onOpenBackupModal,
  onDataModified,
}) => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const settings = storageService.getSettings(tenantId);

  const [businessName, setBusinessName] = useState(currentUser?.businessName || settings.businessName || 'نادي الرشاقة');
  const [currency, setCurrency] = useState(settings.currencySymbol || 'ج.م');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '01000000000');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calendar sync testing
  const [isCalendarTesting, setIsCalendarTesting] = useState(false);
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<string | null>(null);

  // Reset confirmation
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings({
      ...settings,
      tenantId,
      businessName,
      currencySymbol: currency,
      contactPhone: phoneNumber,
    });

    if (currentUser) {
      updateCurrentUserProfile({
        businessName,
        phoneNumber,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onDataModified?.();
  };

  const handleTestCalendarSync = async () => {
    setIsCalendarTesting(true);
    setCalendarSyncStatus(null);
    try {
      const res = await calendarService.createSubscriptionReminder({
        memberName: 'مشترك تجريبي - فحص المزامنة',
        planName: 'فحص تقويم Google',
        expirationDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        tenantName: businessName,
      });

      if (res.success) {
        setCalendarSyncStatus('تمت جدولة موعد التذكير بنجاح في تقويم Google Calendar');
      } else {
        setCalendarSyncStatus(res.error || 'تم حفظ موعد التذكير في جدول المواعيد التجريبي');
      }
    } catch {
      setCalendarSyncStatus('فشلت المزامنة. يرجى التأكد من الاتصال');
    } finally {
      setIsCalendarTesting(false);
    }
  };

  const handleConfirmResetData = () => {
    storageService.resetToSeedData();
    setIsResetConfirmOpen(false);
    onDataModified?.();
    window.location.reload();
  };

  return (
    <div className="space-y-6 text-right max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">إعدادات المنشأة والربط التقني</h2>
          <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:text-zinc-400">
            تخصيص كامل
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          بيانات النادي أو الأكاديمية، العملة الافتراضية، وربط التقويم والنسخ الاحتياطي
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>تم حفظ الإعدادات وتحديث بيانات المنشأة بنجاح.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black text-gray-900 dark:text-white">معلومات النشاط التجاري</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                اسم الصالة / الأكاديمية
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="مثال: نادي أليكس للياقة البدنية"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                العملة المعتمدة
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="ج.م">الجنيه المصري (ج.م)</option>
                <option value="ر.س">الريال السعودي (ر.س)</option>
                <option value="د.إ">الدرهم الإماراتي (د.إ)</option>
                <option value="$">الدولار الأمريكي ($)</option>
                <option value="د.ك">الدينار الكويتي (د.ك)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                رقم التواصل والدعم الفني
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </form>

      {/* Google Calendar Sync Card */}
      <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              مزامنة مواعيد التجديد مع تقويم Google
            </h3>
          </div>
          <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            مفعل تلقائياً
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
          يقوم النظام بجدولة تذكيرات تلقائية بمواعيد انتهاء باقات الأعضاء وتجديد الاشتراكات في تقويم Google لضمان عدم فوات أي موعد.
        </p>

        {calendarSyncStatus && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 p-2.5 text-xs font-bold text-blue-700 dark:text-blue-300">
            {calendarSyncStatus}
          </div>
        )}

        <button
          onClick={handleTestCalendarSync}
          disabled={isCalendarTesting}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>{isCalendarTesting ? 'جاري الفحص...' : 'اختبار إضافة موعد لتقويم Google'}</span>
        </button>
      </div>

      {/* Data Management & Backup Card */}
      <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <Database className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            النسخ الاحتياطي وإدارة البيانات (Offline First)
          </h3>
        </div>

        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
          جميع بيانات المنشأة مخزنة بأمان على جهازك الحالي. يمكنك تصدير نسخة احتياطية بصيغة JSON لنقلها لأي جهاز آخر في أي وقت.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onOpenBackupModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition-colors"
          >
            <Database className="h-4 w-4" />
            <span>فتح نافذة النسخ الاحتياطي والاستعادة</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>إعادة تعيين البيانات الافتراضية (Reset)</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmResetData}
        title="استعادة البيانات التجريبية الأولية"
        message="هل ترغب في إعادة ضبط النظام إلى بيانات الأعضاء والاشتراكات التجريبية الأولية؟ سيتم استبدال البيانات الحالية."
        confirmText="تأكيد الاستعادة"
        cancelText="إلغاء"
      />
    </div>
  );
};
