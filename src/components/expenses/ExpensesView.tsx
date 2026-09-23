import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  DollarSign,
  Briefcase,
  User,
  Trash2,
  Edit2,
  Download,
} from 'lucide-react';
import { Expense } from '../../types';
import { storageService, formatCurrency } from '../../services/storage';
import { Badge } from '../common/Badge';
import { ExpenseModal } from './ExpenseModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BulkActionBar } from '../common/BulkActionBar';

interface ExpensesViewProps {
  tenantId: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ tenantId }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses(tenantId));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'business' | 'personal'>('business');

  // Bulk Selection State
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const reloadData = () => {
    setExpenses(storageService.getExpenses(tenantId));
    setSelectedExpenseIds([]);
  };

  // Metrics computation
  const stats = useMemo(() => {
    const businessTotal = expenses
      .filter((e) => e.type === 'business')
      .reduce((sum, e) => sum + e.amount, 0);
    const personalTotal = expenses
      .filter((e) => e.type === 'personal')
      .reduce((sum, e) => sum + e.amount, 0);
    const grandTotal = businessTotal + personalTotal;
    return { businessTotal, personalTotal, grandTotal };
  }, [expenses]);

  // Filtering
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;
      if (activeTab !== 'all' && exp.type !== activeTab) return false;
      return true;
    });
  }, [expenses, searchTerm, activeTab]);

  // Bulk Handlers
  const handleSelectAll = () => {
    setSelectedExpenseIds(filteredExpenses.map((e) => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedExpenseIds([]);
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    storageService.deleteExpensesByIds(selectedExpenseIds, tenantId);
    setSelectedExpenseIds([]);
    setIsBulkDeleteConfirmOpen(false);
    reloadData();
  };

  const handleConfirmClearAll = () => {
    storageService.clearAllExpenses(tenantId);
    setSelectedExpenseIds([]);
    setIsClearAllConfirmOpen(false);
    reloadData();
  };

  const handleSaveExpense = (data: any) => {
    if (editingExpense) {
      storageService.updateExpense(data);
    } else {
      storageService.addExpense(data);
    }
    reloadData();
  };

  const handleDeleteExpense = () => {
    if (!expenseToDelete) return;
    storageService.deleteExpense(expenseToDelete.id, tenantId);
    setExpenseToDelete(null);
    reloadData();
  };

  const exportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['رقم الإيصال', 'البيان', 'النوع', 'البند', 'المبلغ', 'التاريخ', 'طريقة الدفع'];
    const rows = filteredExpenses.map((e) => [
      e.receiptNumber || e.id,
      e.title,
      e.type === 'business' ? 'مصروف عمل' : 'مسحوبات شخصية',
      e.category,
      e.amount,
      e.date,
      e.paymentMethod,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `سجل_المصروفات_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة المصروفات والنفقات</h2>
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              {expenses.length} مصروف
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            فصل تام ودقيق بين مصاريف الصالة والمسحوبات الشخصية لمالك المنشأة
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
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>تسجيل مصروف</span>
          </button>
        </div>
      </div>

      {/* Segregation Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Business Expenses */}
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">مصاريف تشغيل المنشأة (Business)</span>
            <Briefcase className="h-4 w-4 text-rose-600" />
          </div>
          <span className="block mt-2 text-2xl font-black text-rose-700 dark:text-rose-300">
            {formatCurrency(stats.businessTotal, 'ج.م')}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 block">
            إيجار، رواتب، كهرباء، صيانة، إعلانات
          </span>
        </div>

        {/* Personal Expenses (Separated) */}
        <div className="rounded-3xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-700 dark:text-violet-400">مسحوبات شخصية (Personal)</span>
            <User className="h-4 w-4 text-violet-600" />
          </div>
          <span className="block mt-2 text-2xl font-black text-violet-700 dark:text-violet-300">
            {formatCurrency(stats.personalTotal, 'ج.م')}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 block">
            مسحوبات أرباح المالك ونفقات خاصة منفصلة
          </span>
        </div>

        {/* Grand Total */}
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">إجمالي المدفوعات النقدية</span>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </div>
          <span className="block mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {formatCurrency(stats.grandTotal, 'ج.م')}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 block">
            مجموع ما تم صرفه بالكامل
          </span>
        </div>
      </div>

      {/* Tabs Switcher: Business vs Personal */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'business'
                ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>مصاريف المنشأة</span>
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'personal'
                ? 'bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>مسحوبات شخصية</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <span>عرض الكل</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث في المصاريف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pr-10 pl-4 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Bar with Select All and Clear Entire Section */}
      <BulkActionBar
        totalCount={filteredExpenses.length}
        selectedCount={selectedExpenseIds.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
        onClearEntireSection={() => setIsClearAllConfirmOpen(true)}
        sectionLabel="المصروفات"
      />

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 font-bold">
              <tr>
                <th className="py-3.5 pr-4 pl-2 w-10">
                  <input
                    type="checkbox"
                    checked={filteredExpenses.length > 0 && selectedExpenseIds.length === filteredExpenses.length}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-3">بيان المصروف</th>
                <th className="py-3.5 px-3">النوع</th>
                <th className="py-3.5 px-3">البند</th>
                <th className="py-3.5 px-3">المبلغ</th>
                <th className="py-3.5 px-3">التاريخ</th>
                <th className="py-3.5 px-3">طريقة الدفع</th>
                <th className="py-3.5 pl-4 pr-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <Receipt className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const isSelected = selectedExpenseIds.includes(expense.id);

                  return (
                    <tr
                      key={expense.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 pl-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(expense.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {expense.title}
                        {expense.notes && (
                          <span className="block text-[11px] font-normal text-gray-500 dark:text-zinc-400">
                            {expense.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={expense.type === 'business' ? 'danger' : 'purple'} size="sm">
                          {expense.type === 'business' ? 'مصروف منشأة' : 'سحب شخصي'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-zinc-300 font-medium">
                        {expense.category}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white font-mono">
                        {formatCurrency(expense.amount, 'ج.م')}
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-600 dark:text-zinc-400">
                        {expense.date}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-zinc-400">
                        {expense.paymentMethod === 'cash'
                          ? 'نقداً (كاش)'
                          : expense.paymentMethod === 'card'
                          ? 'بطاقة بنكية'
                          : 'تحويل بنكي'}
                      </td>
                      <td className="py-3 pl-4 pr-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsModalOpen(true);
                            }}
                            title="تعديل المصروف"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            title="حذف المصروف"
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

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={editingExpense || undefined}
        tenantId={tenantId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
        title="حذف المصروف"
        message={`هل أنت متأكد من حذف المصروف "${expenseToDelete?.title}" بقيمة ${expenseToDelete?.amount} ج.م؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Bulk Delete Selected Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="حذف المصروفات المحددة"
        message={`هل أنت متأكد من حذف ${selectedExpenseIds.length} مصروف محدد؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Clear Entire Section Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="مسح سجل المصروفات بالكامل"
        message="تحذير: سيتم حذف كافة المصروفات المسجلة. هل ترغب بالاستمرار؟"
        confirmText="مسح السجل بالكامل"
        cancelText="إلغاء"
      />
    </div>
  );
};
