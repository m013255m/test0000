import React, { useState, useMemo, useEffect } from 'react';
import {
  QrCode,
  UserCheck,
  Search,
  Download,
  Trash2,
  Plus,
  Printer,
  Sparkles,
} from 'lucide-react';
import { AttendanceRecord, Member } from '../../types';
import { storageService, getTodayDateString } from '../../services/storage';
import { Badge } from '../common/Badge';
import { QRScannerModal } from './QRScannerModal';
import { ScanSuccessModal } from './ScanSuccessModal';
import { GenerateAttendanceQRModal } from './GenerateAttendanceQRModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { BulkActionBar } from '../common/BulkActionBar';

interface AttendanceViewProps {
  tenantId: string;
  onOpenQRScanDirectly?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ tenantId }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendance(tenantId)
  );
  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers(tenantId));
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');

  // Bulk Selection State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Scanner & Modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGenerateQROpen, setIsGenerateQROpen] = useState(false);
  const [scannedMember, setScannedMember] = useState<Member | null>(null);
  const [newRecord, setNewRecord] = useState<AttendanceRecord | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Manual Check-In Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedManualMemberId, setSelectedManualMemberId] = useState('');

  const reloadData = () => {
    setAttendance(storageService.getAttendance(tenantId));
    setMembers(storageService.getMembers(tenantId));
    setSelectedRecordIds([]);
  };

  // Auto-sync storage changes & LAN network check-ins
  useEffect(() => {
    // 1. Sync local members & attendance to LAN server memory
    const syncToLan = () => {
      try {
        const currentMembers = storageService.getMembers(tenantId);
        const currentAtt = storageService.getAttendance(tenantId);
        fetch('/api/lan-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ members: currentMembers, attendance: currentAtt }),
        }).catch(() => {});
      } catch {
        // Ignore if fetch fails
      }
    };
    syncToLan();

    // 2. Poll LAN attendance from phones
    const pollLanAttendance = async () => {
      try {
        const res = await fetch('/api/lan-attendance');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.attendance) && data.attendance.length > 0) {
          const currentLocal = storageService.getAttendance(tenantId);
          let hasNew = false;
          data.attendance.forEach((lanRec: AttendanceRecord) => {
            if (lanRec.tenantId === tenantId) {
              const alreadyExists = currentLocal.some((l) => l.id === lanRec.id);
              if (!alreadyExists) {
                currentLocal.unshift(lanRec);
                hasNew = true;
              }
            }
          });
          if (hasNew) {
            storageService.saveAttendance(currentLocal, tenantId);
            setAttendance([...currentLocal]);
          }
        }
      } catch {
        // Ignore network errors
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rcn_attendance_data' || !e.key) {
        reloadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(() => {
      pollLanAttendance();
      const currentList = storageService.getAttendance(tenantId);
      if (currentList.length !== attendance.length) {
        setAttendance(currentList);
      }
    }, 2500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [tenantId, attendance.length]);

  const todayStr = getTodayDateString();

  // Handle QR Code scan or manual ID check
  const handleScanCode = (code: string) => {
    const member = members.find(
      (m) =>
        m.qrCodeValue.toLowerCase() === code.toLowerCase() ||
        m.id.toLowerCase() === code.toLowerCase() ||
        m.fullName.toLowerCase() === code.toLowerCase()
    );

    if (!member) {
      setDuplicateWarning(
        `لم يتم العثور على مشترك مسجل برمز أو اسم "${code}".`
      );
      setScannedMember({
        id: 'unknown',
        tenantId,
        fullName: 'عضو غير مسجل',
        phoneNumber: '',
        email: '',
        membershipPlan: 'غير محدد',
        qrCodeValue: code,
        startDate: '',
        expirationDate: '',
        status: 'expired',
        createdAt: '',
      });
      setIsSuccessModalOpen(true);
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss

    const res = storageService.recordAttendance({
      tenantId,
      memberId: member.id,
      memberName: member.fullName,
      membershipPlan: member.membershipPlan,
      date: todayStr,
      time: timeStr,
      status: 'present',
      verifiedBy: 'qr_scanner',
    });

    setScannedMember(member);
    if (!res.success) {
      setDuplicateWarning(res.reason || 'تعذر تسجيل الحضور.');
      setNewRecord(null);
    } else {
      setDuplicateWarning(null);
      setNewRecord(res.record || null);
    }
    setIsSuccessModalOpen(true);
    reloadData();
  };

  // Manual Attendance Submission
  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualMemberId) return;
    const member = members.find((m) => m.id === selectedManualMemberId);
    if (!member) return;

    const timeStr = new Date().toTimeString().split(' ')[0];
    const res = storageService.recordAttendance({
      tenantId,
      memberId: member.id,
      memberName: member.fullName,
      membershipPlan: member.membershipPlan,
      date: todayStr,
      time: timeStr,
      status: 'present',
      verifiedBy: 'manual',
    });

    if (res.success) {
      setScannedMember(member);
      setNewRecord(res.record || null);
      setDuplicateWarning(null);
      setIsSuccessModalOpen(true);
      setIsManualModalOpen(false);
      setSelectedManualMemberId('');
      reloadData();
    } else {
      alert(res.reason);
    }
  };

  // Bulk Handlers
  const handleSelectAll = () => {
    setSelectedRecordIds(filteredAttendance.map((a) => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedRecordIds([]);
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    storageService.deleteAttendanceByIds(selectedRecordIds, tenantId);
    setSelectedRecordIds([]);
    setIsBulkDeleteConfirmOpen(false);
    reloadData();
  };

  const handleConfirmClearAll = () => {
    storageService.clearAllAttendance(tenantId);
    setSelectedRecordIds([]);
    setIsClearAllConfirmOpen(false);
    reloadData();
  };

  const handleDeleteRecord = () => {
    if (!recordToDelete) return;
    storageService.deleteAttendance(recordToDelete.id, tenantId);
    setRecordToDelete(null);
    reloadData();
  };

  // Filter attendance records
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const matchSearch =
        rec.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.membershipPlan.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (dateFilter === 'today') return rec.date === todayStr;
      if (dateFilter === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return rec.date === y.toISOString().split('T')[0];
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(rec.date) >= weekAgo;
      }
      return true;
    });
  }, [attendance, searchTerm, dateFilter, todayStr]);

  // Attendance stats
  const todayCount = attendance.filter((a) => a.date === todayStr).length;
  const qrScannedToday = attendance.filter(
    (a) => a.date === todayStr && a.verifiedBy === 'qr_scanner'
  ).length;

  const exportCSV = () => {
    if (filteredAttendance.length === 0) return;
    const headers = ['المعرف', 'اسم العضو', 'الباقة', 'التاريخ', 'الوقت', 'طريقة التحضير', 'الحالة'];
    const rows = filteredAttendance.map((r) => [
      r.id,
      r.memberName,
      r.membershipPlan,
      r.date,
      r.time,
      r.verifiedBy === 'qr_scanner' ? 'مسح رمز QR' : 'تحضير يدوي',
      r.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سجل_الحضور_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">سجل حضور الأعضاء برمز QR</h2>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {todayCount} حاضر اليوم
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            متابعة دقيقة لحركة دخول المشتركين وتحضير فوري عبر الكاميرا
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsGenerateQROpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-blue-600/25 transition-all active:scale-95"
            title="توليد رمز QR ثابت للطباعة والحضور اليومي لجميع المشتركين"
          >
            <QrCode className="h-4 w-4" />
            <span>توليد رمز QR للحضور الذاتي</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>تصدير (CSV)</span>
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>تحضير يدوي</span>
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            <span>فتح قارئ QR</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">حضور اليوم</span>
          <span className="mt-1 block text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {todayCount}
          </span>
        </div>
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">حضور عبر ماسح QR</span>
          <span className="mt-1 block text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {qrScannedToday}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">إجمالي سجلات الحضور</span>
          <span className="mt-1 block text-2xl font-black text-gray-900 dark:text-white">
            {attendance.length}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الباقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pr-10 pl-4 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-600 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'أمس' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'all', label: 'جميع الأيام' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                dateFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar for Attendance */}
      <BulkActionBar
        totalCount={filteredAttendance.length}
        selectedCount={selectedRecordIds.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
        onClearEntireSection={() => setIsClearAllConfirmOpen(true)}
        sectionLabel="الحضور"
      />

      {/* Attendance Records Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 font-bold">
              <tr>
                <th className="py-3.5 pr-4 pl-2 w-10">
                  <input
                    type="checkbox"
                    checked={filteredAttendance.length > 0 && selectedRecordIds.length === filteredAttendance.length}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-3">المشترك</th>
                <th className="py-3.5 px-3">نوع الباقة</th>
                <th className="py-3.5 px-3">التاريخ</th>
                <th className="py-3.5 px-3">وقت الدخول</th>
                <th className="py-3.5 px-3">طريقة التحضير</th>
                <th className="py-3.5 px-3">الحالة</th>
                <th className="py-3.5 pl-4 pr-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <UserCheck className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    لا توجد سجلات حضور مسجلة لهذا التاريخ
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => {
                  const isSelected = selectedRecordIds.includes(rec.id);
                  return (
                    <tr
                      key={rec.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 pl-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(rec.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                            {rec.memberName.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {rec.memberName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-gray-700 dark:text-zinc-300">
                          {rec.membershipPlan}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-zinc-400">
                        {rec.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                        {rec.time}
                      </td>
                      <td className="py-3 px-3">
                        {rec.verifiedBy === 'qr_scanner' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            <QrCode className="h-3 w-3" />
                            <span>مسح QR</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-zinc-400">
                            <span>يدوي</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="success" size="sm">
                          حاضر ومؤكد
                        </Badge>
                      </td>
                      <td className="py-3 pl-4 pr-3 text-left">
                        <button
                          onClick={() => setRecordToDelete(rec)}
                          title="حذف السجل"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optical QR Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanCode={handleScanCode}
        members={members}
      />

      {/* QR Scan Success or Duplicate Modal */}
      <ScanSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        member={scannedMember}
        attendanceRecord={newRecord}
        isDuplicateWarning={!!duplicateWarning}
        duplicateMessage={duplicateWarning || undefined}
      />

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="تسجيل حضور يدوي"
        subtitle="اختر المشترك لتأكيد حضوره يدوياً"
      >
        <form onSubmit={handleManualCheckIn} className="space-y-4 text-right" dir="rtl">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
              اختر المشترك
            </label>
            <select
              value={selectedManualMemberId}
              onChange={(e) => setSelectedManualMemberId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white"
            >
              <option value="">-- اختر المشترك من القائمة --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.membershipPlan}) - {m.phoneNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              تسجيل الحضور
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Record Confirmation */}
      <ConfirmDialog
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDeleteRecord}
        title="حذف سجل الحضور"
        message={`هل أنت متأكد من حذف سجل حضور "${recordToDelete?.memberName}" بتاريخ ${recordToDelete?.date}؟`}
        confirmText="حذف السجل"
        cancelText="إلغاء"
      />

      {/* Bulk Delete Selected Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="حذف سجلات الحضور المحددة"
        message={`هل تريد بالتأكيد حذف ${selectedRecordIds.length} سجل حضور محدد؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Clear Entire Section Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="مسح سجل الحضور بالكامل"
        message="تحذير: سيتم مسح كافة سجلات الحضور المسجلة لهذه المنشأة بشكل نهائي. هل ترغب بالاستمرار؟"
        confirmText="مسح السجل بالكامل"
        cancelText="إلغاء"
      />

      {/* Fixed Reusable QR Code for Printing & Self Attendance */}
      <GenerateAttendanceQRModal
        isOpen={isGenerateQROpen}
        onClose={() => {
          setIsGenerateQROpen(false);
          reloadData();
        }}
        tenantId={tenantId}
      />
    </div>
  );
};
