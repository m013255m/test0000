import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileJson,
  RefreshCw,
  HardDriveDownload,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from './Modal';
import { storageService } from '../../services/storage';
import { SaaSUser } from '../../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  currentUser?: SaaSUser | null;
  onDataRestored?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  currentUser,
  onDataRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Summary counts
  const members = storageService.getMembers(tenantId);
  const attendance = storageService.getAttendance(tenantId);
  const payments = storageService.getPayments(tenantId);
  const expenses = storageService.getExpenses(tenantId);

  const handleDownloadBackup = () => {
    try {
      const data = storageService.exportTenantBackup(tenantId, currentUser);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const bName = (currentUser?.businessName || 'Business').replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `نسخة_احتياطية_${bName}_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      alert(`حدث خطأ أثناء التصدير: ${err?.message}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const result = storageService.restoreTenantBackup(tenantId, parsed);
        if (result.success) {
          setRestoreStatus({
            type: 'success',
            message: result.message,
          });
          if (onDataRestored) onDataRestored();
        } else {
          setRestoreStatus({
            type: 'error',
            message: result.message,
          });
        }
      } catch (err: any) {
        setRestoreStatus({
          type: 'error',
          message: 'الملف غير صالح أو ليس بتنسيق JSON صحيح.',
        });
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsRestoring(false);
      setRestoreStatus({
        type: 'error',
        message: 'فشلت قراءة الملف من الجهاز.',
      });
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="النسخ الاحتياطي واستعادة البيانات"
      subtitle="حفظ نسخة كاملة من بيانات المشتركين والحضور والمالية واستعادتها بأمان"
      maxWidth="lg"
    >
      <div className="space-y-6 text-right" dir="rtl">
        {/* Current Data Overview */}
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              حجم البيانات المخزنة حالياً
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-700/60 shadow-xs">
              <span className="block text-lg font-black text-indigo-600 dark:text-indigo-400">
                {members.length}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">مشترك</span>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-700/60 shadow-xs">
              <span className="block text-lg font-black text-emerald-600 dark:text-emerald-400">
                {attendance.length}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">حضور</span>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-700/60 shadow-xs">
              <span className="block text-lg font-black text-amber-600 dark:text-amber-400">
                {payments.length}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">مدفوعات</span>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-700/60 shadow-xs">
              <span className="block text-lg font-black text-rose-600 dark:text-rose-400">
                {expenses.length}
              </span>
              <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">مصاريف</span>
            </div>
          </div>
        </div>

        {/* Action 1: Export / Download */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/25">
                  <HardDriveDownload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    تنزيل نسخة احتياطية كاملة
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    تصدير كل السجلات والاشتراكات والمصروفات كملف JSON مشفر محلياً
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            <span>تحميل النسخة الاحتياطية (.JSON)</span>
          </button>
          {downloadSuccess && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>تم تحميل النسخة الاحتياطية بنجاح على جهازك!</span>
            </div>
          )}
        </div>

        {/* Action 2: Import / Restore */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/25">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                استعادة نسخة احتياطية سابقة
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                اختر ملف النسخة الاحتياطية (.JSON) لاسترجاع كافة البيانات فوراً
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800/80 bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold text-sm px-4 py-3 transition-colors active:scale-[0.99] disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>جاري استعادة البيانات...</span>
              </>
            ) : (
              <>
                <FileJson className="h-4 w-4" />
                <span>اختيار ملف النسخة الاحتياطية</span>
              </>
            )}
          </button>

          {restoreStatus && (
            <div
              className={`mt-3 flex items-start gap-2.5 text-xs font-semibold p-3 rounded-xl border ${
                restoreStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}
            >
              {restoreStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{restoreStatus.message}</span>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 px-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>تخزين البيانات محلي وآمن تماماً داخل متصفحك دون إرسالها إلى أي خوادم خارجية غير مصرح بها.</span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
};
