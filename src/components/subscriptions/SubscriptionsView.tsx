import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  Download,
} from 'lucide-react';
import { SubscriptionPayment, Member } from '../../types';
import { storageService, formatCurrency, getDaysRemaining } from '../../services/storage';
import { Badge } from '../common/Badge';
import { PaymentModal } from './PaymentModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BulkActionBar } from '../common/BulkActionBar';

interface SubscriptionsViewProps {
  tenantId: string;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ tenantId }) => {
  const [payments, setPayments] = useState<SubscriptionPayment[]>(() =>
    storageService.getPayments(tenantId)
  );
  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers(tenantId));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'expiring_soon' | 'overdue' | 'unpaid'>('all');

  // Bulk Selection State
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SubscriptionPayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SubscriptionPayment | null>(null);

  const reloadData = () => {
    setPayments(storageService.getPayments(tenantId));
    setMembers(storageService.getMembers(tenantId));
    setSelectedPaymentIds([]);
  };

  // Metrics computation
  const stats = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    let overdueSum = 0;
    let expiringCount = 0;
    payments.forEach((p) => {
      collected += p.paidAmount || 0;
      outstanding += p.remainingAmount || 0;
      const days = getDaysRemaining(p.expirationDate);
      if (p.status === 'overdue' || (p.status !== 'paid' && days < 0)) {
        overdueSum += p.remainingAmount || 0;
      }
      if (p.status !== 'paid' && days >= 0 && days <= 7) {
        expiringCount++;
      }
    });
    return { collected, outstanding, overdueSum, expiringCount };
  }, [payments]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchSearch =
        payment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.subscriptionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      const days = getDaysRemaining(payment.expirationDate);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'paid') return payment.status === 'paid';
      if (statusFilter === 'overdue') {
        return payment.status === 'overdue' || (payment.status !== 'paid' && days < 0);
      }
      if (statusFilter === 'expiring_soon') {
        return payment.status !== 'paid' && days >= 0 && days <= 7;
      }
      if (statusFilter === 'unpaid') {
        return payment.status === 'unpaid' || payment.status === 'partially_paid';
      }
      return true;
    });
  }, [payments, searchTerm, statusFilter]);

  // Bulk Handlers
  const handleSelectAll = () => {
    setSelectedPaymentIds(filteredPayments.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPaymentIds([]);
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    storageService.deletePaymentsByIds(selectedPaymentIds, tenantId);
    setSelectedPaymentIds([]);
    setIsBulkDeleteConfirmOpen(false);
    reloadData();
  };

  const handleConfirmClearAll = () => {
    storageService.clearAllPayments(tenantId);
    setSelectedPaymentIds([]);
    setIsClearAllConfirmOpen(false);
    reloadData();
  };

  const handleSavePayment = (data: any) => {
    if (editingPayment) {
      storageService.updatePayment(data);
    } else {
      storageService.addPayment(data);
    }
    reloadData();
  };

  const handleDeletePayment = () => {
    if (!paymentToDelete) return;
    storageService.deletePayment(paymentToDelete.id, tenantId);
    setPaymentToDelete(null);
    reloadData();
  };

  const exportCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ['رقم السند', 'المشترك', 'الباقة', 'المستحق', 'المدفوع', 'المتبقي', 'تاريخ السداد', 'تاريخ الانتهاء', 'الحالة'];
    const rows = filteredPayments.map((p) => [
      p.invoiceNumber,
      p.memberName,
      p.subscriptionType,
      p.amount,
      p.paidAmount,
      p.remainingAmount,
      p.paymentDate,
      p.expirationDate,
      p.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سندات_الاشتراكات_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة الاشتراكات والتحصيل</h2>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {payments.length} سند
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            سجل المدفوعات، متابعة الديون، وتجديد باقات المشتركين
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>تصدير (CSV)</span>
          </button>
          <button
            onClick={() => {
              setEditingPayment(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>تسجيل سداد / تجديد</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">إجمالي المحصل</span>
          <span className="block mt-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.collected, 'ج.م')}
          </span>
        </div>
        <div className="p-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">المتبقي (ديون آجلة)</span>
          <span className="block mt-1 text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(stats.outstanding, 'ج.م')}
          </span>
        </div>
        <div className="p-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">متأخرات مستحقة</span>
          <span className="block mt-1 text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.overdueSum, 'ج.م')}
          </span>
        </div>
        <div className="p-4 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">تجديدات هذا الأسبوع</span>
          <span className="block mt-1 text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.expiringCount} اشتراكات
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالمشترك، رقم السند، أو الباقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pr-10 pl-4 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-600 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'paid', label: 'مسدد بالكامل' },
            { id: 'unpaid', label: 'متبقي مالي' },
            { id: 'expiring_soon', label: 'تجديد قريب' },
            { id: 'overdue', label: 'متأخر' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar with Select All and Clear Entire Section */}
      <BulkActionBar
        totalCount={filteredPayments.length}
        selectedCount={selectedPaymentIds.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
        onClearEntireSection={() => setIsClearAllConfirmOpen(true)}
        sectionLabel="الاشتراكات والمدفوعات"
      />

      {/* Payments Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 font-bold">
              <tr>
                <th className="py-3.5 pr-4 pl-2 w-10">
                  <input
                    type="checkbox"
                    checked={filteredPayments.length > 0 && selectedPaymentIds.length === filteredPayments.length}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-3">رقم السند</th>
                <th className="py-3.5 px-3">اسم المشترك</th>
                <th className="py-3.5 px-3">نوع الباقة</th>
                <th className="py-3.5 px-3">المدفوع / الإجمالي</th>
                <th className="py-3.5 px-3">المتبقي</th>
                <th className="py-3.5 px-3">تاريخ الانتهاء</th>
                <th className="py-3.5 px-3">الحالة</th>
                <th className="py-3.5 pl-4 pr-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <Receipt className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    لا توجد سندات قبض مسجلة تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const days = getDaysRemaining(payment.expirationDate);
                  const isSelected = selectedPaymentIds.includes(payment.id);

                  return (
                    <tr
                      key={payment.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 pl-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(payment.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-gray-600 dark:text-zinc-300">
                        {payment.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {payment.memberName}
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-zinc-300">
                        {payment.subscriptionType}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payment.paidAmount, 'ج.م')}
                        </span>
                        <span className="text-gray-400 font-mono text-[11px] block">
                          من {formatCurrency(payment.amount, 'ج.م')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold">
                        {payment.remainingAmount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(payment.remainingAmount, 'ج.م')}
                          </span>
                        ) : (
                          <span className="text-gray-400">خالص</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-zinc-400">
                        {payment.expirationDate}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            payment.status === 'paid'
                              ? 'success'
                              : payment.status === 'overdue' || days < 0
                              ? 'danger'
                              : payment.status === 'expiring_soon'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {payment.status === 'paid'
                            ? 'مسدد بالكامل'
                            : payment.status === 'overdue' || days < 0
                            ? 'متأخرات'
                            : payment.status === 'expiring_soon'
                            ? 'تجديد وشيك'
                            : 'سداد جزئي'}
                        </Badge>
                      </td>
                      <td className="py-3 pl-4 pr-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsModalOpen(true);
                            }}
                            title="تعديل السند"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPaymentToDelete(payment)}
                            title="حذف السند"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPayment(null);
        }}
        onSave={handleSavePayment}
        initialPayment={editingPayment || undefined}
        members={members}
        tenantId={tenantId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="حذف سند القبض"
        message={`هل أنت متأكد من حذف السند "${paymentToDelete?.invoiceNumber}" الخاص بالمشترك ${paymentToDelete?.memberName}؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Bulk Delete Selected Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="حذف السندات المحددة"
        message={`هل ترغب في حذف ${selectedPaymentIds.length} سند محدد بشكل نهائي؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Clear Entire Section Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="مسح سجل الاشتراكات بالكامل"
        message="تحذير: سيتم حذف كافة سندات القبض والمدفوعات المسجلة. هل ترغب بالاستمرار؟"
        confirmText="مسح السجل بالكامل"
        cancelText="إلغاء"
      />
    </div>
  );
};
